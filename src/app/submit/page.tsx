import type { Metadata } from "next";
import { WorkflowForm } from "@/components/workflow-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submit a Workflow | DevFlow",
  description:
    "Share how you use AI tools to ship — your setup, techniques, and workflows that other developers can learn from.",
};

async function getTools() {
  try {
    const { db } = await import("@/lib/db");
    const { tools } = await import("@/lib/schema");
    return db
      .select({ id: tools.id, name: tools.name, category: tools.category })
      .from(tools)
      .orderBy(tools.name);
  } catch {
    return [];
  }
}

export default async function SubmitPage() {
  const tools = await getTools();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      <div className="text-center mb-12">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{
            color: "var(--text-tertiary)",
            letterSpacing: "0.15em",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          Contribute
        </p>
        <h1
          className="text-3xl font-bold tracking-tight mb-2"
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            letterSpacing: "-0.03em",
          }}
        >
          Share how you ship
        </h1>
        <p
          className="text-sm max-w-md mx-auto leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Your AI tool setup could change how someone else works.
          Walk us through it.
        </p>
      </div>

      <WorkflowForm availableTools={tools} />
    </div>
  );
}
