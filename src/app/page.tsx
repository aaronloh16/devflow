import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WorkflowCard } from "@/components/workflow-card";

export const dynamic = "force-dynamic";

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

interface ToolCategory {
  category: string;
  count: number;
}

async function getFeaturedWorkflows(): Promise<WorkflowPreview[]> {
  try {
    const { db } = await import("@/lib/db");
    const { workflows, workflowTools, tools } = await import("@/lib/schema");
    const { desc, eq } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(workflows)
      .orderBy(desc(workflows.upvoteCount))
      .limit(6);

    const results = await Promise.all(
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

    return results;
  } catch {
    return [];
  }
}

async function getToolCategories(): Promise<ToolCategory[]> {
  try {
    const { db } = await import("@/lib/db");
    const { tools } = await import("@/lib/schema");
    const { sql } = await import("drizzle-orm");

    const rows = await db
      .select({
        category: tools.category,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(tools)
      .groupBy(tools.category)
      .orderBy(sql`count(*) desc`);

    return rows;
  } catch {
    return [];
  }
}

export default async function Home() {
  const [featuredWorkflows, toolCategories] = await Promise.all([
    getFeaturedWorkflows(),
    getToolCategories(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Hero */}
      <section className="pt-20 pb-16 animate-fade-in-up">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-5"
          style={{
            color: "var(--text-tertiary)",
            letterSpacing: "0.15em",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          Community-sourced workflows
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5"
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            letterSpacing: "-0.03em",
          }}
        >
          How the best engineers
          <br />
          ship with AI
        </h1>
        <p
          className="text-base max-w-lg leading-relaxed mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          Real workflows from real engineers. The exact tools, prompts, and
          step-by-step processes used to build production software with AI.
        </p>
        <div className="flex gap-3">
          <Link
            href="/workflows"
            className="btn-primary px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Browse Workflows
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/submit"
            className="btn-ghost px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2"
          >
            Share Yours
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-16 animate-fade-in-up delay-100">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              n: "01",
              title: "Browse",
              desc: "Discover workflows from engineers at top companies, ranked by community upvotes.",
            },
            {
              n: "02",
              title: "Copy",
              desc: "Get the exact tools, prompts, and step-by-step processes that work in production.",
            },
            {
              n: "03",
              title: "Share",
              desc: "Submit your own workflows and build your reputation as a contributor.",
            },
          ].map((step) => (
            <div key={step.n}>
              <span
                className="text-xs font-bold"
                style={{
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                {step.n}
              </span>
              <h3
                className="text-sm font-semibold mt-2 mb-1.5"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--border-subtle)" }} />

      {/* Featured Workflows */}
      <section className="py-16 animate-fade-in-up delay-200">
        {featuredWorkflows.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                Trending Workflows
              </h2>
              <Link
                href="/workflows"
                className="text-xs flex items-center gap-1 transition-colors hover-text-secondary"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {featuredWorkflows.map((w) => (
                <WorkflowCard key={w.slug} {...w} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{
                color: "var(--text-tertiary)",
                letterSpacing: "0.15em",
              }}
            >
              Launching
            </p>
            <h2
              className="text-xl font-bold mb-3"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              The first workflows are being curated
            </h2>
            <p
              className="text-sm max-w-md mx-auto mb-8 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              We&rsquo;re collecting battle-tested AI workflows from engineers
              at top companies. Be among the first to share yours.
            </p>
            <Link
              href="/submit"
              className="btn-primary px-5 py-2.5 rounded-lg text-sm inline-block"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              Submit a Workflow
            </Link>
          </div>
        )}
      </section>

      {/* Browse by Category */}
      {toolCategories.length > 0 && (
        <>
          <div style={{ borderTop: "1px solid var(--border-subtle)" }} />
          <section className="py-16 animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                Browse by Category
              </h2>
              <Link
                href="/leaderboard"
                className="text-xs flex items-center gap-1 transition-colors hover-text-secondary"
              >
                All tools <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {toolCategories.map((cat) => (
                <Link
                  key={cat.category}
                  href="/leaderboard"
                  className="card px-4 py-3.5 hover:scale-[1.01] transition-transform"
                >
                  <p
                    className="text-sm font-medium mb-0.5"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-syne), sans-serif",
                    }}
                  >
                    {cat.category}
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: "var(--text-tertiary)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    {cat.count} {cat.count === 1 ? "tool" : "tools"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Generate Stack CTA */}
      <div style={{ borderTop: "1px solid var(--border-subtle)" }} />
      <section className="py-16 animate-fade-in-up delay-400">
        <Link href="/generate" className="group block">
          <div className="card p-8 hover:scale-[1.005] transition-transform">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3
                  className="text-base font-bold mb-2"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  Need a stack recommendation?
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Describe what you want to build. Get a recommended stack,
                  architecture diagram, and step-by-step build plan — powered by
                  live tool data.
                </p>
              </div>
              <ArrowRight
                className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: "var(--text-tertiary)" }}
              />
            </div>
          </div>
        </Link>
      </section>

      {/* Footer */}
      <div className="text-center pb-12">
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Built in public ·{" "}
          <a
            href="https://github.com/aaronloh16/devflow"
            target="_blank"
            rel="noopener noreferrer"
            className="hover-text-secondary"
          >
            View source
          </a>
        </p>
      </div>
    </div>
  );
}
