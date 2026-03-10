import { db } from "./db";
import { tools, momentumScores, githubSnapshots } from "./schema";
import { desc, eq, sql } from "drizzle-orm";

export type ToolWithMetrics = {
  id: number;
  name: string;
  repo: string;
  category: string;
  description: string | null;
  website: string | null;
  npmPackage: string | null;
  pypiPackage: string | null;
  stars: number;
  forks: number;
  starVelocity: number;
  hnMentions7d: number;
  hnPoints7d: number;
  npmDownloads7d: number;
  pypiDownloads7d: number;
  overallScore: number;
  lastUpdated: Date | null;
};

/**
 * Fetches all tools with their latest momentum score and GitHub snapshot.
 * Uses DISTINCT ON to get latest row per tool in a single query each,
 * replacing the N+1 pattern (121 queries → 3 queries).
 */
export async function getToolsWithLatestMetrics(): Promise<ToolWithMetrics[]> {
  // Latest momentum score per tool (1 query)
  const latestScores = await db.execute<{
    tool_id: number;
    star_velocity: number;
    hn_mentions_7d: number;
    hn_points_7d: number;
    npm_downloads_7d: number;
    pypi_downloads_7d: number;
    overall_score: number;
    calculated_at: Date;
  }>(sql`
    SELECT DISTINCT ON (tool_id)
      tool_id, star_velocity, hn_mentions_7d, hn_points_7d,
      npm_downloads_7d, pypi_downloads_7d, overall_score, calculated_at
    FROM momentum_scores
    ORDER BY tool_id, calculated_at DESC
  `);

  // Latest GitHub snapshot per tool (1 query)
  const latestGH = await db.execute<{
    tool_id: number;
    stars: number;
    forks: number;
  }>(sql`
    SELECT DISTINCT ON (tool_id)
      tool_id, stars, forks
    FROM github_snapshots
    ORDER BY tool_id, collected_at DESC
  `);

  // All tools (1 query)
  const allTools = await db.select().from(tools);

  // Index by toolId for O(1) lookups
  const scoresByToolId = new Map(latestScores.rows.map((s) => [s.tool_id, s]));
  const ghByToolId = new Map(latestGH.rows.map((g) => [g.tool_id, g]));

  return allTools.map((tool) => {
    const score = scoresByToolId.get(tool.id);
    const gh = ghByToolId.get(tool.id);

    return {
      id: tool.id,
      name: tool.name,
      repo: tool.repo,
      category: tool.category,
      description: tool.description,
      website: tool.website,
      npmPackage: tool.npmPackage,
      pypiPackage: tool.pypiPackage,
      stars: gh?.stars ?? 0,
      forks: gh?.forks ?? 0,
      starVelocity: score?.star_velocity ?? 0,
      hnMentions7d: score?.hn_mentions_7d ?? 0,
      hnPoints7d: score?.hn_points_7d ?? 0,
      npmDownloads7d: score?.npm_downloads_7d ?? 0,
      pypiDownloads7d: score?.pypi_downloads_7d ?? 0,
      overallScore: score?.overall_score ?? 0,
      lastUpdated: score?.calculated_at ?? null,
    };
  });
}
