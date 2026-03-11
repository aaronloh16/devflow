import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Clock, ExternalLink, ArrowLeft } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { UpvoteButton } from "@/components/upvote-button";
import type { WorkflowStep } from "@/lib/schema";

export const dynamic = "force-dynamic";

interface WorkflowData {
  id: number;
  slug: string;
  title: string;
  description: string;
  problemContext: string | null;
  difficulty: string;
  timeSaved: string | null;
  outcome: string | null;
  failureModes: string | null;
  steps: WorkflowStep[];
  proofUrls: string[];
  submitterName: string;
  submitterRole: string | null;
  submitterId: number | null;
  isVerified: boolean;
  upvoteCount: number;
  viewCount: number;
  createdAt: string;
  tools: { name: string; category: string; roleInWorkflow: string | null }[];
}

const DIFFICULTY_STYLES = {
  beginner: { color: "var(--accent-green)", bg: "var(--accent-green-dim)", label: "Beginner" },
  intermediate: { color: "var(--accent-amber)", bg: "var(--accent-amber-dim)", label: "Intermediate" },
  advanced: { color: "var(--accent-red)", bg: "rgba(248,113,113,0.12)", label: "Advanced" },
} as const;

async function getWorkflow(slug: string): Promise<WorkflowData | null> {
  try {
    const { db } = await import("@/lib/db");
    const { workflows, workflowTools, tools } = await import("@/lib/schema");
    const { eq } = await import("drizzle-orm");

    const [workflow] = await db
      .select()
      .from(workflows)
      .where(eq(workflows.slug, slug))
      .limit(1);

    if (!workflow) return null;

    const toolRows = await db
      .select({
        name: tools.name,
        category: tools.category,
        roleInWorkflow: workflowTools.roleInWorkflow,
      })
      .from(workflowTools)
      .innerJoin(tools, eq(workflowTools.toolId, tools.id))
      .where(eq(workflowTools.workflowId, workflow.id))
      .orderBy(workflowTools.usageOrder);

    return {
      id: workflow.id,
      slug: workflow.slug,
      title: workflow.title,
      description: workflow.description,
      problemContext: workflow.problemContext,
      difficulty: workflow.difficulty,
      timeSaved: workflow.timeSaved,
      outcome: workflow.outcome,
      failureModes: workflow.failureModes,
      steps: workflow.steps,
      proofUrls: (workflow.proofUrls ?? []) as string[],
      submitterName: workflow.submitterName,
      submitterRole: workflow.submitterRole,
      submitterId: workflow.submitterId,
      isVerified: workflow.isVerified,
      upvoteCount: workflow.upvoteCount,
      viewCount: workflow.viewCount,
      createdAt: workflow.createdAt.toISOString(),
      tools: toolRows,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const workflow = await getWorkflow(slug);
  if (!workflow) return { title: "Workflow Not Found | DevFlow" };

  return {
    title: `${workflow.title} | DevFlow`,
    description: workflow.description,
    openGraph: {
      title: `${workflow.title} — DevFlow Workflow`,
      description: workflow.description,
    },
  };
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workflow = await getWorkflow(slug);

  if (!workflow) {
    notFound();
  }

  const diff = DIFFICULTY_STYLES[workflow.difficulty as keyof typeof DIFFICULTY_STYLES] ?? DIFFICULTY_STYLES.beginner;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      {/* Back link */}
      <Link
        href="/workflows"
        className="inline-flex items-center gap-1.5 text-xs mb-8 transition-colors"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft className="w-3 h-3" />
        All Workflows
      </Link>

      {/* Hero */}
      <div className="flex items-start justify-between gap-6 mb-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span
              className="px-2.5 py-1 text-[10px] font-semibold rounded-md uppercase tracking-wider"
              style={{ background: diff.bg, color: diff.color }}
            >
              {diff.label}
            </span>
            {workflow.timeSaved && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--accent-green)" }}>
                <Clock className="w-3 h-3" />
                Saves {workflow.timeSaved}
              </span>
            )}
            {workflow.isVerified && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--accent-green)" }}>
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>

          <h1
            className="text-3xl font-bold tracking-tight mb-3"
            style={{ fontFamily: "var(--font-syne), sans-serif", letterSpacing: "-0.03em" }}
          >
            {workflow.title}
          </h1>

          <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            {workflow.description}
          </p>

          {/* Submitter */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--accent-violet-dim)", color: "var(--accent-violet)" }}
            >
              {workflow.submitterName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {workflow.submitterName}
              </span>
              {workflow.submitterRole && (
                <span className="text-xs ml-2" style={{ color: "var(--text-tertiary)" }}>
                  {workflow.submitterRole}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Upvote */}
        <UpvoteButton
          targetId={workflow.id}
          targetType="workflow"
          initialCount={workflow.upvoteCount}
        />
      </div>

      <div className="space-y-10">
        {/* Problem Context */}
        {workflow.problemContext && (
          <section>
            <h2
              className="text-base font-bold mb-3"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Problem
            </h2>
            <div
              className="p-5 rounded-xl"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {workflow.problemContext}
              </p>
            </div>
          </section>
        )}

        {/* Tools Used */}
        {workflow.tools.length > 0 && (
          <section>
            <h2
              className="text-base font-bold mb-3"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Tools Used
            </h2>
            <div className="flex flex-wrap gap-2">
              {workflow.tools.map((tool) => (
                <span
                  key={tool.name}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg"
                  style={{
                    background: "var(--accent-cyan-dim)",
                    color: "var(--accent-cyan)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {tool.name}
                  {tool.roleInWorkflow && (
                    <span style={{ color: "var(--text-tertiary)" }}> — {tool.roleInWorkflow}</span>
                  )}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Steps */}
        <section>
          <h2
            className="text-base font-bold mb-4"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Step-by-Step
          </h2>
          <ol className="space-y-4">
            {workflow.steps.map((step, i) => (
              <li
                key={i}
                className="p-5 rounded-xl"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "var(--accent-cyan-dim)",
                      color: "var(--accent-cyan)",
                      border: "1px solid var(--border-default)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    {step.order ?? i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    {step.title && (
                      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                        {step.title}
                      </h3>
                    )}
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {step.description}
                    </p>
                    {step.toolName && (
                      <span
                        className="inline-block mt-2 px-2 py-0.5 text-[11px] rounded-md"
                        style={{ background: "var(--accent-violet-dim)", color: "var(--accent-violet)" }}
                      >
                        {step.toolName}
                      </span>
                    )}
                    {step.promptText && (
                      <div className="mt-3 relative">
                        <pre
                          className="text-xs p-4 rounded-lg overflow-x-auto"
                          style={{
                            background: "var(--bg-base)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                          }}
                        >
                          {step.promptText}
                        </pre>
                        <div className="absolute top-2 right-2">
                          <CopyButton text={step.promptText} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Outcome */}
        {workflow.outcome && (
          <section>
            <h2
              className="text-base font-bold mb-3"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Expected Outcome
            </h2>
            <div
              className="p-5 rounded-xl"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {workflow.outcome}
              </p>
            </div>
          </section>
        )}

        {/* Failure Modes */}
        {workflow.failureModes && (
          <section>
            <h2
              className="text-base font-bold mb-3"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Common Failure Modes
            </h2>
            <div
              className="p-5 rounded-xl"
              style={{
                background: "rgba(248,113,113,0.04)",
                border: "1px solid rgba(248,113,113,0.15)",
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {workflow.failureModes}
              </p>
            </div>
          </section>
        )}

        {/* Proof */}
        {workflow.proofUrls.length > 0 && (
          <section>
            <h2
              className="text-base font-bold mb-3"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Proof
            </h2>
            <div className="space-y-2">
              {workflow.proofUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm transition-colors p-3 rounded-lg"
                  style={{
                    color: "var(--accent-cyan)",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{url}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <div
          className="pt-8 text-center"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
            Have a workflow like this? Share it with the community.
          </p>
          <Link
            href="/submit"
            className="btn-primary px-6 py-2.5 rounded-xl text-sm inline-block"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Submit Your Workflow
          </Link>
        </div>
      </div>
    </div>
  );
}
