import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">AI Stack Radar</h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Architecture recommendations backed by live developer sentiment. See what&apos;s
          gaining momentum, then generate a stack that uses it.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/leaderboard"
            className="px-6 py-3 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
          >
            View Leaderboard
          </Link>
          <Link
            href="/generate"
            className="px-6 py-3 border border-zinc-700 rounded-lg font-medium hover:border-zinc-500 transition-colors"
          >
            Generate a Stack
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-24">
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-semibold mb-2">Momentum Leaderboard</h2>
          <p className="text-zinc-400 text-sm">
            Ranks AI dev tools by real developer sentiment — GitHub star velocity, Hacker
            News mentions, and more. Updated daily.
          </p>
        </div>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-semibold mb-2">Architecture Generator</h2>
          <p className="text-zinc-400 text-sm">
            Describe what you want to build. Get back a recommended stack, Mermaid
            diagram, and build steps — powered by live leaderboard data.
          </p>
        </div>
      </div>
    </div>
  );
}
