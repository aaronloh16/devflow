"use client";

import { useState } from "react";
import {
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Github,
  Lightbulb,
} from "lucide-react";
import { MermaidDiagram } from "@/components/mermaid-diagram";

interface DetectedTool {
  name: string;
  category: string;
  status: "accelerating" | "stable" | "stagnating";
  momentumScore: number;
  note: string;
}

interface Suggestion {
  current: string;
  suggested: string;
  reason: string;
}

interface RepoAnalysis {
  summary: string;
  overallHealthScore: number;
  detectedTools: DetectedTool[];
  suggestions: Suggestion[];
  diagram: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 70) return "bg-emerald-950/50 border-emerald-900/50";
  if (score >= 40) return "bg-amber-950/50 border-amber-900/50";
  return "bg-red-950/50 border-red-900/50";
}

function StatusIcon({ status }: { status: DetectedTool["status"] }) {
  switch (status) {
    case "accelerating":
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case "stable":
      return <Minus className="w-4 h-4 text-zinc-400" />;
    case "stagnating":
      return <TrendingDown className="w-4 h-4 text-red-400" />;
  }
}

function statusLabel(status: DetectedTool["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusColor(status: DetectedTool["status"]): string {
  switch (status) {
    case "accelerating":
      return "text-emerald-400";
    case "stable":
      return "text-zinc-400";
    case "stagnating":
      return "text-red-400";
  }
}

export function RepoAnalyzer() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RepoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to analyze repository");
      }
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* URL Input */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Github className="w-5 h-5 text-zinc-500" />
          </div>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="https://github.com/owner/repo"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            disabled={loading}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !repoUrl.trim()}
          className="px-6 py-3 bg-white text-zinc-900 rounded-xl font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-950/50 border border-red-900 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-8 p-6 border border-zinc-800 rounded-xl bg-zinc-900/30 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          <span className="text-zinc-400">
            Fetching dependencies and analyzing against momentum data...
          </span>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-8">
          {/* Health Score */}
          <div
            className={`p-6 rounded-xl border ${scoreBg(result.overallHealthScore)}`}
          >
            <div className="flex items-center gap-5">
              <div
                className={`text-5xl font-bold ${scoreColor(result.overallHealthScore)}`}
              >
                {result.overallHealthScore}
              </div>
              <div>
                <h2 className="text-lg font-semibold">Stack Health Score</h2>
                <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                  {result.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Detected Tools */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Detected Tools</h2>
            <div className="grid gap-3">
              {result.detectedTools.map((tool, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border border-zinc-800 rounded-xl bg-zinc-900/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-zinc-100">
                        {tool.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 truncate">{tool.note}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <StatusIcon status={tool.status} />
                    <span
                      className={`text-sm font-medium ${statusColor(tool.status)}`}
                    >
                      {statusLabel(tool.status)}
                    </span>
                    {tool.momentumScore > 0 && (
                      <span className="text-xs text-zinc-500">
                        {tool.momentumScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h2 className="text-lg font-semibold">Upgrade Suggestions</h2>
              </div>
              <div className="grid gap-3">
                {result.suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="p-4 border border-amber-900/30 bg-amber-950/20 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-zinc-400">{suggestion.current}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-medium text-zinc-100">
                        {suggestion.suggested}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {suggestion.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architecture Diagram */}
          {result.diagram && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Architecture Overview
              </h2>
              <MermaidDiagram chart={result.diagram} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
