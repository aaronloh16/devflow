import Link from "next/link";
import { Trophy, Sparkles, TrendingUp, ArrowUpRight, Star, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

interface TopMover {
  name: string;
  repo: string;
  stars: number;
  starVelocity: number;
  overallScore: number;
}

async function getTopMovers(): Promise<TopMover[]> {
  try {
    const { db } = await import("@/lib/db");
    const { tools, momentumScores, githubSnapshots } = await import("@/lib/schema");
    const { eq, desc } = await import("drizzle-orm");

    const allTools = await db.select().from(tools);

    const toolsWithScores = await Promise.all(
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
          name: tool.name,
          repo: tool.repo,
          stars: latestGH?.stars ?? 0,
          starVelocity: latestScore?.starVelocity ?? 0,
          overallScore: latestScore?.overallScore ?? 0,
        };
      })
    );

    toolsWithScores.sort((a, b) => b.overallScore - a.overallScore);
    return toolsWithScores.slice(0, 5);
  } catch {
    return [];
  }
}

export default async function Home() {
  const topMovers = await getTopMovers();

  return (
    <div className="relative">
      {/* Subtle radial gradient behind hero */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 relative">
        {/* Hero */}
        <div className="text-center space-y-5 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-400 mb-2">
            <Activity className="w-3 h-3 text-emerald-400" />
            Updated daily from GitHub &amp; Hacker News
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
            What developers are
            <br />
            <span className="text-emerald-400">actually using</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            AI dev tool rankings backed by live sentiment data. See&nbsp;what&rsquo;s
            gaining momentum, then generate an architecture that uses it.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="/leaderboard"
              className="group px-6 py-3 bg-emerald-500 text-zinc-950 rounded-lg font-semibold text-sm hover:bg-emerald-400 transition-colors inline-flex items-center gap-2"
            >
              View Leaderboard
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/generate"
              className="px-6 py-3 border border-zinc-700 rounded-lg font-semibold text-sm hover:border-zinc-500 hover:bg-zinc-900 transition-colors"
            >
              Generate a Stack
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {/* Leaderboard card */}
          <div className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold mb-1.5">Momentum Leaderboard</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Ranks 60+ AI dev tools by GitHub star velocity and Hacker News activity.
                  Open-source scoring algorithm — no black boxes.
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> Star velocity
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span>HN mentions</span>
                  <span className="text-zinc-700">·</span>
                  <span>Daily updates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generator card */}
          <div className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold mb-1.5">Architecture Generator</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Describe what you want to build. Get a recommended stack, Mermaid
                  diagram, and step-by-step build plan — powered by live data.
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Claude-powered
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span>Diagrams</span>
                  <span className="text-zinc-700">·</span>
                  <span>Shareable</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Movers preview */}
        {topMovers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                  Top Movers
                </h2>
              </div>
              <Link
                href="/leaderboard"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider w-10">
                      #
                    </th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                      Tool
                    </th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                      Stars
                    </th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                      Velocity
                    </th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topMovers.map((tool, i) => (
                    <tr
                      key={tool.repo}
                      className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-sm">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                            i === 0
                              ? "bg-amber-500/20 text-amber-400"
                              : i === 1
                                ? "bg-zinc-400/20 text-zinc-300"
                                : i === 2
                                  ? "bg-orange-600/20 text-orange-400"
                                  : "text-zinc-600"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <a
                          href={`https://github.com/${tool.repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-zinc-200 hover:text-white inline-flex items-center gap-1"
                        >
                          {tool.name}
                          <ArrowUpRight className="w-3 h-3 text-zinc-600" />
                        </a>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-zinc-400 tabular-nums">
                        {tool.stars.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm hidden sm:table-cell tabular-nums">
                        <span
                          className={
                            tool.starVelocity > 0 ? "text-emerald-400" : "text-zinc-500"
                          }
                        >
                          +{tool.starVelocity.toFixed(1)}/d
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-white tabular-nums">
                        {tool.overallScore.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom tagline */}
        <div className="text-center pt-8 pb-4">
          <p className="text-xs text-zinc-600">
            Open-source scoring algorithm · Built in public ·{" "}
            <a
              href="https://github.com/aaronloh16/ai-stack-radar"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              View source
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
