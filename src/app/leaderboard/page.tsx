import { LeaderboardTable } from "@/components/leaderboard-table";

export const dynamic = "force-dynamic";

async function getLeaderboardData() {
  // In production, this would fetch from the API
  // For SSR, we query the DB directly
  try {
    const { db } = await import("@/lib/db");
    const { tools, momentumScores, githubSnapshots } = await import("@/lib/schema");
    const { eq, desc } = await import("drizzle-orm");

    const allTools = await db.select().from(tools);

    const leaderboard = await Promise.all(
      allTools.map(async (tool) => {
        const [latestScore] = await db
          .select()
          .from(momentumScores)
          .where(eq(momentumScores.toolId, tool.id))
          .orderBy(desc(momentumScores.calculatedAt))
          .limit(1);

        const [latestGH] = await db
          .select()
          .from(githubSnapshots)
          .where(eq(githubSnapshots.toolId, tool.id))
          .orderBy(desc(githubSnapshots.collectedAt))
          .limit(1);

        return {
          id: tool.id,
          name: tool.name,
          repo: tool.repo,
          category: tool.category,
          description: tool.description,
          website: tool.website,
          stars: latestGH?.stars ?? 0,
          forks: latestGH?.forks ?? 0,
          starVelocity: latestScore?.starVelocity ?? 0,
          hnMentions7d: latestScore?.hnMentions7d ?? 0,
          hnPoints7d: latestScore?.hnPoints7d ?? 0,
          overallScore: latestScore?.overallScore ?? 0,
          lastUpdated: latestScore?.calculatedAt?.toISOString() ?? null,
        };
      })
    );

    leaderboard.sort((a, b) => b.overallScore - a.overallScore);
    return leaderboard;
  } catch {
    // If DB isn't connected yet, return empty
    return [];
  }
}

export default async function LeaderboardPage() {
  const tools = await getLeaderboardData();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Momentum Leaderboard</h1>
        <p className="text-zinc-400 mt-2">
          AI dev tools ranked by real developer sentiment. Updated daily.
        </p>
      </div>

      {tools.length > 0 ? (
        <LeaderboardTable initialTools={tools} />
      ) : (
        <div className="text-center py-24 text-zinc-500">
          <p className="text-lg mb-2">No data yet</p>
          <p className="text-sm">
            Run{" "}
            <code className="bg-zinc-800 px-2 py-0.5 rounded">
              npm run collect:github
            </code>{" "}
            to seed the leaderboard.
          </p>
        </div>
      )}
    </div>
  );
}
