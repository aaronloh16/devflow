// TODO: Future data sources to add:
// - Reddit API (OAuth2, free tier for non-commercial) — r/LocalLLaMA, r/MachineLearning mentions
// - X/Twitter via SocialData.tools or similar proxy — ~$0.36/month for 60 tools

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc } from "drizzle-orm";
import {
  tools,
  npmSnapshots,
  pypiSnapshots,
  momentumScores,
} from "../src/lib/schema";
import toolsData from "../src/data/tools.json";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client);

interface NpmDownloadResponse {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

interface PyPIRecentResponse {
  data: {
    last_day: number;
    last_week: number;
    last_month: number;
  };
  package: string;
  type: string;
}

async function fetchNpmDownloads(pkg: string): Promise<number | null> {
  const res = await fetch(
    `https://api.npmjs.org/downloads/point/last-week/${pkg}`
  );

  if (!res.ok) {
    console.error(`  npm API error for ${pkg}: ${res.status}`);
    return null;
  }

  const data = (await res.json()) as NpmDownloadResponse;
  return data.downloads;
}

async function fetchPyPIDownloads(pkg: string): Promise<number | null> {
  const res = await fetch(
    `https://pypistats.org/api/packages/${pkg}/recent`
  );

  if (!res.ok) {
    console.error(`  PyPI API error for ${pkg}: ${res.status}`);
    return null;
  }

  const data = (await res.json()) as PyPIRecentResponse;
  return data.data.last_week;
}

async function syncToolMetadata() {
  console.log("Syncing tool metadata (npm/pypi packages)...");
  const allTools = await db.select().from(tools);

  let updated = 0;
  for (const dbTool of allTools) {
    const jsonTool = toolsData.find((t) => t.repo === dbTool.repo);
    if (!jsonTool) continue;

    const npmPkg = jsonTool.npm_package ?? null;
    const pypiPkg = jsonTool.pypi_package ?? null;

    if (dbTool.npmPackage !== npmPkg || dbTool.pypiPackage !== pypiPkg) {
      await db
        .update(tools)
        .set({ npmPackage: npmPkg, pypiPackage: pypiPkg })
        .where(eq(tools.id, dbTool.id));
      updated++;
    }
  }

  if (updated > 0) {
    console.log(`  Updated ${updated} tools with package info.`);
  }
}

async function collectNpmData() {
  const allTools = await db.select().from(tools);
  const npmTools = allTools.filter((t) => t.npmPackage);
  console.log(`\nCollecting npm data for ${npmTools.length} tools...`);

  let success = 0;

  for (const tool of npmTools) {
    const downloads = await fetchNpmDownloads(tool.npmPackage!);
    if (downloads === null) continue;

    await db.insert(npmSnapshots).values({
      toolId: tool.id,
      weeklyDownloads: downloads,
    });

    if (downloads > 0) {
      console.log(`  ${tool.name}: ${downloads.toLocaleString()} downloads/week`);
    }

    success++;

    // Rate limiting: 100ms delay between requests
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`npm collection done. ${success}/${npmTools.length} succeeded.`);
}

async function collectPypiData() {
  const allTools = await db.select().from(tools);
  const pypiTools = allTools.filter((t) => t.pypiPackage);
  console.log(`\nCollecting PyPI data for ${pypiTools.length} tools...`);

  let success = 0;

  for (const tool of pypiTools) {
    const downloads = await fetchPyPIDownloads(tool.pypiPackage!);
    if (downloads === null) continue;

    await db.insert(pypiSnapshots).values({
      toolId: tool.id,
      weeklyDownloads: downloads,
    });

    if (downloads > 0) {
      console.log(`  ${tool.name}: ${downloads.toLocaleString()} downloads/week`);
    }

    success++;

    // Rate limiting: 2s delay (pypistats.org allows 30 req/min)
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`PyPI collection done. ${success}/${pypiTools.length} succeeded.`);
}

async function updateMomentumWithDownloads() {
  console.log("\nUpdating momentum scores with download data...");
  const allTools = await db.select().from(tools);

  for (const tool of allTools) {
    const [latestNpm] = await db
      .select()
      .from(npmSnapshots)
      .where(eq(npmSnapshots.toolId, tool.id))
      .orderBy(desc(npmSnapshots.collectedAt))
      .limit(1);

    const [latestPypi] = await db
      .select()
      .from(pypiSnapshots)
      .where(eq(pypiSnapshots.toolId, tool.id))
      .orderBy(desc(pypiSnapshots.collectedAt))
      .limit(1);

    const [latestMomentum] = await db
      .select()
      .from(momentumScores)
      .where(eq(momentumScores.toolId, tool.id))
      .orderBy(desc(momentumScores.calculatedAt))
      .limit(1);

    if (!latestMomentum) continue;

    const npmDownloads = latestNpm?.weeklyDownloads ?? 0;
    const pypiDownloads = latestPypi?.weeklyDownloads ?? 0;

    // Skip if no download data for this tool
    if (npmDownloads === 0 && pypiDownloads === 0) continue;

    const downloadBoost = (npmDownloads + pypiDownloads) / 1000;

    // Reconstruct full score from components
    const hnBoost =
      latestMomentum.hnPoints7d * 0.1 + latestMomentum.hnMentions7d * 2;
    const overallScore = latestMomentum.starVelocity + hnBoost + downloadBoost;

    await db.insert(momentumScores).values({
      toolId: tool.id,
      starVelocity: latestMomentum.starVelocity,
      hnMentions7d: latestMomentum.hnMentions7d,
      hnPoints7d: latestMomentum.hnPoints7d,
      npmDownloads7d: npmDownloads,
      pypiDownloads7d: pypiDownloads,
      overallScore: Math.round(overallScore * 100) / 100,
    });

    console.log(
      `  ${tool.name}: npm=${npmDownloads.toLocaleString()}, pypi=${pypiDownloads.toLocaleString()}, boost=+${downloadBoost.toFixed(1)}, total=${overallScore.toFixed(1)}`
    );
  }
}

async function main() {
  try {
    await syncToolMetadata();
    await collectNpmData();
    await collectPypiData();
    await updateMomentumWithDownloads();
  } catch (err) {
    console.error("Download collection failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
