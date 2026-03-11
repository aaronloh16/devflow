"use client";

import { useState, useCallback } from "react";
import { ChevronUp } from "lucide-react";

interface UpvoteButtonProps {
  targetId: number;
  targetType: "workflow" | "tool" | "stack_combo";
  initialCount: number;
  initialUpvoted?: boolean;
}

export function UpvoteButton({
  targetId,
  targetType,
  initialCount,
  initialUpvoted = false,
}: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [pending, setPending] = useState(false);

  const toggle = useCallback(async () => {
    if (pending) return;

    // Optimistic update
    const wasUpvoted = upvoted;
    setUpvoted(!wasUpvoted);
    setCount((c) => (wasUpvoted ? c - 1 : c + 1));
    setPending(true);

    try {
      const res = await fetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, targetType }),
      });

      if (res.ok) {
        const data = await res.json();
        setUpvoted(data.upvoted);
        setCount(data.count);
      } else {
        // Revert on error
        setUpvoted(wasUpvoted);
        setCount((c) => (wasUpvoted ? c + 1 : c - 1));
      }
    } catch {
      // Revert on network error
      setUpvoted(wasUpvoted);
      setCount((c) => (wasUpvoted ? c + 1 : c - 1));
    } finally {
      setPending(false);
    }
  }, [pending, upvoted, targetId, targetType]);

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all"
      style={{
        background: upvoted ? "var(--accent-cyan-dim)" : "var(--bg-elevated)",
        border: `1px solid ${upvoted ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
        cursor: pending ? "wait" : "pointer",
      }}
    >
      <ChevronUp
        className="w-5 h-5 transition-colors"
        style={{ color: upvoted ? "var(--accent-cyan)" : "var(--text-secondary)" }}
      />
      <span
        className="text-xs font-bold tabular-nums"
        style={{
          color: upvoted ? "var(--accent-cyan)" : "var(--text-primary)",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {count}
      </span>
    </button>
  );
}
