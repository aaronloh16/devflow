import Link from "next/link";
import { ChevronUp, Clock, BadgeCheck } from "lucide-react";

interface WorkflowCardProps {
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  toolNames: string[];
  upvoteCount: number;
  submitterName: string;
  submitterRole?: string | null;
  timeSaved?: string | null;
  isVerified: boolean;
}

const DIFFICULTY_STYLES = {
  beginner: { color: "var(--accent-green)", bg: "var(--accent-green-dim)", label: "Beginner" },
  intermediate: { color: "var(--accent-amber)", bg: "var(--accent-amber-dim)", label: "Intermediate" },
  advanced: { color: "var(--accent-red)", bg: "rgba(248,113,113,0.12)", label: "Advanced" },
} as const;

export function WorkflowCard({
  slug,
  title,
  description,
  difficulty,
  toolNames,
  upvoteCount,
  submitterName,
  submitterRole,
  timeSaved,
  isVerified,
}: WorkflowCardProps) {
  const diff = DIFFICULTY_STYLES[difficulty];

  return (
    <Link href={`/workflows/${slug}`} className="group block">
      <div className="card p-5 h-full hover:scale-[1.01] transition-transform cursor-pointer">
        {/* Header: title + badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3
                className="text-base font-semibold leading-tight"
                style={{ fontFamily: "var(--font-syne), sans-serif", color: "var(--text-primary)" }}
              >
                {title}
              </h3>
              {isVerified && (
                <BadgeCheck
                  className="w-4 h-4 shrink-0"
                  style={{ color: "var(--accent-green)" }}
                />
              )}
            </div>
            <p
              className="text-sm leading-relaxed line-clamp-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {description}
            </p>
          </div>

          {/* Upvote count */}
          <div
            className="shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <ChevronUp className="w-4 h-4" style={{ color: "var(--accent-cyan)" }} />
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-jetbrains-mono), monospace" }}
            >
              {upvoteCount}
            </span>
          </div>
        </div>

        {/* Tool pills */}
        {toolNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {toolNames.map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 text-[11px] font-medium rounded-md"
                style={{
                  background: "var(--accent-cyan-dim)",
                  color: "var(--accent-cyan)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Footer: submitter + meta */}
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold"
              style={{ background: "var(--accent-violet-dim)", color: "var(--accent-violet)" }}
            >
              {submitterName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium block truncate" style={{ color: "var(--text-primary)" }}>
                {submitterName}
              </span>
              {submitterRole && (
                <span className="text-[10px] block truncate" style={{ color: "var(--text-tertiary)" }}>
                  {submitterRole}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {timeSaved && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--accent-green)" }}>
                <Clock className="w-3 h-3" />
                {timeSaved}
              </span>
            )}
            <span
              className="px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wider"
              style={{ background: diff.bg, color: diff.color }}
            >
              {diff.label}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
