import type { Metadata } from "next";
import { EssentialsView } from "@/components/essentials-view";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Builder's Picks | DevFlow",
  description:
    "Curated AI dev tools organized by use case — what top builders actually use.",
};

export default function BuildersPicksPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <Sparkles className="w-4.5 h-4.5" style={{ color: "#6366f1" }} />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            Builder&rsquo;s Picks
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Curated tools for every stage of AI development — what top builders actually
          use.
        </p>
      </div>

      <div className="animate-fade-in-up delay-100">
        <EssentialsView />
      </div>
    </div>
  );
}
