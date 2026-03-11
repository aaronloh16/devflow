import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { WorkflowBrowser } from "@/components/workflow-browser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workflows | DevFlow",
  description:
    "Browse real AI dev workflows from top engineers — the exact tools, setups, and techniques they use every day.",
};

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

async function getWorkflows(): Promise<WorkflowPreview[]> {
  try {
    const { db } = await import("@/lib/db");
    const { workflows, workflowTools, tools } = await import("@/lib/schema");
    const { desc, eq } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(workflows)
      .orderBy(desc(workflows.upvoteCount))
      .limit(100);

    return Promise.all(
      rows.map(async (w) => {
        const toolRows = await db
          .select({ name: tools.name })
          .from(workflowTools)
          .innerJoin(tools, eq(workflowTools.toolId, tools.id))
          .where(eq(workflowTools.workflowId, w.id))
          .orderBy(workflowTools.usageOrder);

        return {
          slug: w.slug,
          title: w.title,
          description: w.description,
          difficulty: w.difficulty as "beginner" | "intermediate" | "advanced",
          toolNames: toolRows.map((t) => t.name),
          upvoteCount: w.upvoteCount,
          submitterName: w.submitterName,
          submitterRole: w.submitterRole,
          timeSaved: w.timeSaved,
          isVerified: w.isVerified,
        };
      })
    );
  } catch {
    return [];
  }
}

export default async function WorkflowsPage() {
  const workflows = await getWorkflows();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{
              color: "var(--text-tertiary)",
              letterSpacing: "0.15em",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            Workflows
          </p>
          <h1
            className="text-3xl font-bold tracking-tight mb-2"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            How devs actually ship
          </h1>
          <p
            className="text-sm leading-relaxed max-w-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Real AI tool setups and techniques from engineers who figured it out.
            Upvote the ones that changed how you work.
          </p>
        </div>
        <Link
          href="/submit"
          className="btn-primary px-4 py-2.5 rounded-lg text-sm inline-flex items-center gap-2 shrink-0"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Submit
        </Link>
      </div>

      {workflows.length > 0 ? (
        <WorkflowBrowser workflows={workflows} />
      ) : (
        <div className="text-center py-20 animate-fade-in-up">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span className="text-2xl">🧪</span>
          </div>
          <h2
            className="text-xl font-bold mb-3"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            First workflows incoming
          </h2>
          <p
            className="text-sm max-w-md mx-auto mb-8 leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            We&rsquo;re collecting battle-tested AI workflows from engineers at
            top companies. Be the first to share how you actually use AI to
            ship.
          </p>
          <Link
            href="/submit"
            className="btn-primary px-6 py-2.5 rounded-lg text-sm inline-flex items-center gap-2"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Submit a Workflow
          </Link>
        </div>
      )}
    </div>
  );
}
