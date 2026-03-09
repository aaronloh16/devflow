import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc, gt } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import {
  tools,
  momentumScores,
  githubSnapshots,
  hnSnapshots,
  dailyDigests,
} from "../src/lib/schema";

const DATABASE_URL = process.env.DATABASE_URL;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface ToolDelta {
  name: string;
  repo: string;
  category: string;
  currentScore: number;
  previousScore: number;
  scoreDelta: number;
  currentStars: number;
  starVelocity: number;
  hnMentions7d: number;
  hnPoints7d: number;
  topHNUrl: string | null;
}

async function getToolDeltas(): Promise<ToolDelta[]> {
  const allTools = await db.select().from(tools);
  const deltas: ToolDelta[] = [];

  for (const tool of allTools) {
    // Get two most recent momentum scores
    const scores = await db
      .select()
      .from(momentumScores)
      .where(eq(momentumScores.toolId, tool.id))
      .orderBy(desc(momentumScores.calculatedAt))
      .limit(2);

    if (scores.length < 1) continue;

    const current = scores[0];
    const previous = scores.length > 1 ? scores[1] : null;

    // Get latest GitHub snapshot
    const [latestGH] = await db
      .select()
      .from(githubSnapshots)
      .where(eq(githubSnapshots.toolId, tool.id))
      .orderBy(desc(githubSnapshots.collectedAt))
      .limit(1);

    // Get latest HN snapshot
    const [latestHN] = await db
      .select()
      .from(hnSnapshots)
      .where(eq(hnSnapshots.toolId, tool.id))
      .orderBy(desc(hnSnapshots.collectedAt))
      .limit(1);

    deltas.push({
      name: tool.name,
      repo: tool.repo,
      category: tool.category,
      currentScore: current.overallScore,
      previousScore: previous?.overallScore ?? current.overallScore,
      scoreDelta: current.overallScore - (previous?.overallScore ?? current.overallScore),
      currentStars: latestGH?.stars ?? 0,
      starVelocity: current.starVelocity,
      hnMentions7d: current.hnMentions7d,
      hnPoints7d: current.hnPoints7d,
      topHNUrl: latestHN?.topStoryUrl ?? null,
    });
  }

  // Sort by absolute score delta (biggest movers first)
  deltas.sort((a, b) => Math.abs(b.scoreDelta) - Math.abs(a.scoreDelta));
  return deltas;
}

async function generateDigest(deltas: ToolDelta[]) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Build a concise data summary for the LLM
  const topMovers = deltas.slice(0, 15);
  const topByScore = [...deltas].sort((a, b) => b.currentScore - a.currentScore).slice(0, 10);
  const hnActive = deltas.filter((d) => d.hnMentions7d > 0).sort((a, b) => b.hnPoints7d - a.hnPoints7d).slice(0, 5);

  const dataSummary = `
## Today's Data (${today})

### Biggest Score Changes (last collection cycle)
${topMovers.map((d) => `- ${d.name} (${d.category}): score ${d.previousScore.toFixed(1)} → ${d.currentScore.toFixed(1)} (${d.scoreDelta >= 0 ? "+" : ""}${d.scoreDelta.toFixed(1)}), ${d.currentStars.toLocaleString()} stars, velocity ${d.starVelocity.toFixed(1)}/day`).join("\n")}

### Current Top 10 by Overall Score
${topByScore.map((d, i) => `${i + 1}. ${d.name}: ${d.currentScore.toFixed(1)} (velocity: ${d.starVelocity.toFixed(1)}/day, ${d.currentStars.toLocaleString()} stars)`).join("\n")}

### Active on Hacker News This Week
${hnActive.length > 0 ? hnActive.map((d) => `- ${d.name}: ${d.hnMentions7d} mentions, ${d.hnPoints7d} points${d.topHNUrl ? ` — ${d.topHNUrl}` : ""}`).join("\n") : "No significant HN activity this cycle."}
`.trim();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are the AI voice behind AI Stack Radar, a developer tool that tracks momentum of 60+ AI/ML open-source tools using GitHub stars, HN mentions, and package downloads.

Write a daily digest based on today's data. Be opinionated, concise, and interesting. Write like a sharp tech analyst, not a press release.

Rules:
- Headline: One punchy line (under 80 chars) capturing today's most interesting signal. No date in the headline.
- Body: 2-3 short paragraphs. Lead with the most interesting movement. Mention specific numbers. If something crossed a milestone (e.g., 100k stars), call it out. If HN is buzzing about something, mention it. End with a forward-looking observation or question.
- Highlights: Pick exactly 3 tools that had the most interesting movements. For each, give a short "delta" string (e.g., "+5.2 score", "entered top 5") and a one-sentence reason.

Respond in this exact JSON format:
{
  "headline": "...",
  "body": "...",
  "highlights": [
    { "tool": "Tool Name", "repo": "owner/repo", "delta": "...", "reason": "..." },
    { "tool": "Tool Name", "repo": "owner/repo", "delta": "...", "reason": "..." },
    { "tool": "Tool Name", "repo": "owner/repo", "delta": "...", "reason": "..." }
  ]
}

Here is today's data:

${dataSummary}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = textBlock.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr) as {
    headline: string;
    body: string;
    highlights: Array<{
      tool: string;
      repo: string;
      delta: string;
      reason: string;
    }>;
  };

  return parsed;
}

async function main() {
  try {
    console.log("Gathering tool deltas...");
    const deltas = await getToolDeltas();
    console.log(`Found ${deltas.length} tools with data.`);

    if (deltas.length === 0) {
      console.log("No data to generate digest from. Skipping.");
      return;
    }

    // Check if we already generated a digest today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [existingDigest] = await db
      .select()
      .from(dailyDigests)
      .where(gt(dailyDigests.generatedAt, todayStart))
      .limit(1);

    if (existingDigest) {
      console.log("Digest already generated today. Skipping.");
      return;
    }

    console.log("Generating digest with Claude...");
    const digest = await generateDigest(deltas);

    console.log(`\nHeadline: ${digest.headline}`);
    console.log(`Body: ${digest.body.slice(0, 200)}...`);
    console.log(`Highlights: ${digest.highlights.map((h) => h.tool).join(", ")}`);

    await db.insert(dailyDigests).values({
      headline: digest.headline,
      body: digest.body,
      highlights: digest.highlights,
    });

    console.log("\nDigest saved to database.");
  } catch (err) {
    console.error("Digest generation failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
