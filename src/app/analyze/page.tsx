import { RepoAnalyzer } from "@/components/repo-analyzer";

export default function AnalyzePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Stack Health Check</h1>
        <p className="text-zinc-400 mt-2">
          Paste a GitHub repo URL to analyze its dependencies against the
          momentum leaderboard. See what&apos;s accelerating, what&apos;s
          stagnating, and where to upgrade.
        </p>
      </div>

      <RepoAnalyzer />
    </div>
  );
}
