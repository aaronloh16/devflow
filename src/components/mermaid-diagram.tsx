"use client";

import { useEffect, useRef, useCallback } from "react";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 9)}`);

  const render = useCallback(async () => {
    if (!containerRef.current || !chart) return;
    try {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#3f3f46",
          primaryTextColor: "#fafafa",
          primaryBorderColor: "#52525b",
          lineColor: "#71717a",
          secondaryColor: "#27272a",
          tertiaryColor: "#18181b",
        },
      });
      const { svg } = await mermaid.render(idRef.current, chart);
      containerRef.current.innerHTML = svg;
    } catch (err) {
      console.error("Mermaid render error:", err);
      if (containerRef.current) {
        containerRef.current.innerHTML = `<pre class="text-sm text-zinc-400 p-4 bg-zinc-900 rounded-lg overflow-x-auto">${escapeHtml(chart)}</pre>`;
      }
    }
  }, [chart]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div
      ref={containerRef}
      className="p-6 border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-x-auto flex justify-center"
    />
  );
}
