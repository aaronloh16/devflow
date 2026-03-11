"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { WorkflowCard } from "@/components/workflow-card";

interface WorkflowPreview {
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  toolNames: string[];
  upvoteCount: number;
  submitterName: string;
  submitterRole: string | null;
  timeSaved: string | null;
  isVerified: boolean;
}

const DIFFICULTIES = [
  { value: null, label: "All" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const SORTS = [
  { value: "upvotes", label: "Most Upvoted" },
  { value: "newest", label: "Newest" },
] as const;

export function WorkflowBrowser({
  workflows,
}: {
  workflows: WorkflowPreview[];
}) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [sort, setSort] = useState("upvotes");

  const filtered = useMemo(() => {
    let result = workflows;

    if (difficulty) {
      result = result.filter((w) => w.difficulty === difficulty);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.toolNames.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (sort === "newest") {
      // Already sorted by newest from server if requested — for client sort, reverse by upvotes
      // Since we receive pre-sorted data, just keep it as-is for "newest"
    }

    return result;
  }, [workflows, search, difficulty, sort]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--text-tertiary)" }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workflows, tools, or techniques..."
          className="input-base w-full pl-11 pr-4 py-3 rounded-xl text-sm"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        />
      </div>

      {/* Filters row */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.label}
              onClick={() => setDifficulty(d.value)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background:
                  difficulty === d.value
                    ? "var(--text-primary)"
                    : "var(--bg-surface)",
                color:
                  difficulty === d.value
                    ? "var(--bg-base)"
                    : "var(--text-secondary)",
                border: `1px solid ${
                  difficulty === d.value
                    ? "var(--text-primary)"
                    : "var(--border-subtle)"
                }`,
                fontFamily: "var(--font-syne), sans-serif",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal
            className="w-3.5 h-3.5"
            style={{ color: "var(--text-tertiary)" }}
          />
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              className="text-xs transition-colors"
              style={{
                color:
                  sort === s.value
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                fontWeight: sort === s.value ? 600 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((w) => (
            <WorkflowCard key={w.slug} {...w} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p
            className="text-sm mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {search.trim()
              ? `No workflows matching "${search}".`
              : "No workflows found for this filter."}
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
