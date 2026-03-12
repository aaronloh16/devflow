"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Plus, X, Search, Check, Loader2 } from "lucide-react";

interface AvailableTool {
  id: number;
  name: string;
  category: string;
}

interface FormData {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  selectedTools: { id: number; name: string }[];
  steps: string[];
  proofUrl: string;
}

const INITIAL_FORM: FormData = {
  title: "",
  description: "",
  difficulty: "intermediate",
  selectedTools: [],
  steps: [""],
  proofUrl: "",
};

const STEPS = [
  { n: 1, label: "Basics" },
  { n: 2, label: "Steps & Submit" },
];

const DIFFICULTY_OPTIONS = [
  {
    value: "beginner" as const,
    label: "Beginner",
    desc: "Simple setup, common tools",
  },
  {
    value: "intermediate" as const,
    label: "Intermediate",
    desc: "Some configuration, multiple tools",
  },
  {
    value: "advanced" as const,
    label: "Advanced",
    desc: "Complex orchestration, expert-level",
  },
];

export function WorkflowForm({ availableTools }: { availableTools: AvailableTool[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [toolSearch, setToolSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // --- Validation per step ---
  function canAdvance(): boolean {
    if (step === 1)
      return (
        form.title.length >= 5 &&
        form.description.length >= 10 &&
        form.selectedTools.length >= 1
      );
    return true;
  }

  function canSubmit(): boolean {
    return form.steps.some((s) => s.trim().length > 0);
  }

  // --- Tool toggling (tag-style) ---
  function toggleTool(tool: { id: number; name: string }) {
    setForm((prev) => {
      const exists = prev.selectedTools.find((t) => t.id === tool.id);
      if (exists) {
        return {
          ...prev,
          selectedTools: prev.selectedTools.filter((t) => t.id !== tool.id),
        };
      }
      return {
        ...prev,
        selectedTools: [...prev.selectedTools, { id: tool.id, name: tool.name }],
      };
    });
  }

  // --- Step list management ---
  function updateStepText(index: number, value: string) {
    setForm((prev) => {
      const steps = [...prev.steps];
      steps[index] = value;
      return { ...prev, steps };
    });
  }

  function addStep() {
    setForm((prev) => ({ ...prev, steps: [...prev.steps, ""] }));
  }

  function removeStep(index: number) {
    if (form.steps.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  }

  // --- Submit ---
  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          difficulty: form.difficulty,
          toolIds: form.selectedTools.map((t) => ({ id: t.id })),
          steps: form.steps
            .filter((s) => s.trim())
            .map((s, i) => ({
              order: i + 1,
              title: s.trim(),
              description: s.trim(),
            })),
          proofUrls: form.proofUrl.trim() ? [form.proofUrl.trim()] : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      const { slug } = await res.json();
      router.push(`/workflows/${slug}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Filtered tools for search ---
  const filteredTools = toolSearch.trim()
    ? availableTools.filter(
        (t) =>
          t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
          t.category.toLowerCase().includes(toolSearch.toLowerCase())
      )
    : availableTools;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-center mb-12 px-2">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <button
              onClick={() => {
                if (s.n < step) setStep(s.n);
              }}
              className="flex items-center gap-2 transition-all"
              disabled={s.n > step}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background:
                    s.n < step
                      ? "var(--accent-green-dim)"
                      : s.n === step
                        ? "var(--text-primary)"
                        : "var(--bg-elevated)",
                  color:
                    s.n < step
                      ? "var(--accent-green)"
                      : s.n === step
                        ? "var(--bg-base)"
                        : "var(--text-tertiary)",
                  border: `1px solid ${
                    s.n < step
                      ? "var(--accent-green)"
                      : s.n === step
                        ? "var(--text-primary)"
                        : "var(--border-subtle)"
                  }`,
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                {s.n < step ? <Check className="w-3.5 h-3.5" /> : s.n}
              </span>
              <span
                className="text-xs font-medium"
                style={{
                  color: s.n === step ? "var(--text-primary)" : "var(--text-tertiary)",
                }}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className="w-12 sm:w-20 h-px mx-3"
                style={{
                  background: s.n < step ? "var(--accent-green)" : "var(--border-subtle)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="animate-fade-in" key={step}>
        {/* ---- STEP 1: Basics + Tools ---- */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                Describe your workflow
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                What&rsquo;s the technique or setup you use to ship faster with AI?
              </p>
            </div>

            <div>
              <Label>Title</Label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g., Parallel Claude Code sessions for full-stack features"
                className="input-base w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="e.g., Use multiple Claude Code instances in parallel — one for frontend, one for backend, one for tests — to ship full features in a single session."
                rows={3}
                className="input-base w-full px-4 py-3 rounded-xl text-sm resize-none"
              />
            </div>

            <div>
              <Label>Difficulty</Label>
              <div className="grid grid-cols-3 gap-3 mt-1">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => update("difficulty", d.value)}
                    className="p-3.5 rounded-xl text-left transition-all"
                    style={{
                      background:
                        form.difficulty === d.value
                          ? "var(--accent-cyan-dim)"
                          : "var(--bg-surface)",
                      border: `1px solid ${
                        form.difficulty === d.value
                          ? "var(--text-primary)"
                          : "var(--border-subtle)"
                      }`,
                    }}
                  >
                    <span
                      className="text-xs font-semibold block mb-0.5"
                      style={{
                        color:
                          form.difficulty === d.value
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {d.label}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {d.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tools — tag-style picker */}
            <div>
              <Label>Tools Used</Label>
              <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
                Select the AI tools this workflow uses. Pick at least one.
              </p>

              {/* Selected tools as tags */}
              {form.selectedTools.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {form.selectedTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: "var(--accent-cyan-dim)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--text-primary)",
                      }}
                    >
                      {tool.name}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}

              {/* Tool search */}
              <div className="relative mb-2">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: "var(--text-tertiary)" }}
                />
                <input
                  type="text"
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  placeholder="Search tools..."
                  className="input-base w-full pl-10 pr-4 py-2.5 rounded-xl text-xs"
                />
              </div>

              {/* Tool grid */}
              <div
                className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 py-1"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "var(--border-default) transparent",
                }}
              >
                {filteredTools.map((tool) => {
                  const selected = form.selectedTools.some((t) => t.id === tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool)}
                      className="px-2.5 py-1.5 rounded-lg text-xs transition-all"
                      style={{
                        background: selected
                          ? "var(--accent-cyan-dim)"
                          : "var(--bg-surface)",
                        border: `1px solid ${
                          selected ? "var(--text-primary)" : "var(--border-subtle)"
                        }`,
                        color: selected ? "var(--text-primary)" : "var(--text-secondary)",
                      }}
                    >
                      {tool.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ---- STEP 2: Steps + Proof + Submit ---- */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                How does it work?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                List the steps someone would follow to replicate your workflow.
              </p>
            </div>

            <div className="space-y-2">
              {form.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="flex-shrink-0 w-6 h-6 mt-2.5 rounded-md flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: "var(--accent-cyan-dim)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-default)",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}
                  >
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={s}
                    onChange={(e) => updateStepText(i, e.target.value)}
                    placeholder={
                      i === 0
                        ? "e.g., Open three Claude Code sessions in separate terminal panes"
                        : i === 1
                          ? "e.g., Assign each session a specific role (frontend, backend, tests)"
                          : "e.g., Use a shared CLAUDE.md to keep all agents aligned"
                    }
                    className="input-base flex-1 px-4 py-2.5 rounded-xl text-sm"
                  />
                  {form.steps.length > 1 && (
                    <button
                      onClick={() => removeStep(i)}
                      className="p-2 mt-1.5 rounded-md transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addStep}
              className="btn-ghost w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Step
            </button>

            {/* Proof URL */}
            <div>
              <Label optional>Proof / Reference URL</Label>
              <input
                type="url"
                value={form.proofUrl}
                onChange={(e) => update("proofUrl", e.target.value)}
                placeholder="e.g., https://github.com/your-repo or blog post link"
                className="input-base w-full px-4 py-2.5 rounded-xl text-sm"
              />
            </div>

            {/* Preview */}
            <div
              className="p-5 rounded-xl space-y-3"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                Preview
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wider"
                  style={{
                    background:
                      form.difficulty === "beginner"
                        ? "var(--accent-green-dim)"
                        : form.difficulty === "advanced"
                          ? "rgba(248,113,113,0.12)"
                          : "var(--accent-amber-dim)",
                    color:
                      form.difficulty === "beginner"
                        ? "var(--accent-green)"
                        : form.difficulty === "advanced"
                          ? "var(--accent-red)"
                          : "var(--accent-amber)",
                  }}
                >
                  {form.difficulty}
                </span>
              </div>
              <h3
                className="text-base font-bold"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                {form.title || "Untitled Workflow"}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {form.description || "No description"}
              </p>
              {form.selectedTools.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.selectedTools.map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 text-[11px] font-medium rounded-md"
                      style={{
                        background: "var(--accent-cyan-dim)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {form.steps.filter((s) => s.trim()).length} step
                {form.steps.filter((s) => s.trim()).length !== 1 ? "s" : ""}
              </p>
            </div>

            {error && (
              <div
                className="p-3 rounded-lg text-xs"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  color: "var(--accent-red)",
                  border: "1px solid rgba(248,113,113,0.15)",
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div
        className="flex items-center justify-between mt-10 pt-6"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="btn-ghost px-4 py-2.5 rounded-lg text-sm inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="btn-primary px-5 py-2.5 rounded-lg text-sm inline-flex items-center gap-2"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Next
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit()}
            className="btn-primary px-6 py-2.5 rounded-lg text-sm inline-flex items-center gap-2"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish Workflow"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Tiny label component ---
function Label({
  children,
  optional,
}: {
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      className="block text-[10px] font-semibold uppercase tracking-widest mb-2"
      style={{
        color: "var(--text-tertiary)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        letterSpacing: "0.12em",
      }}
    >
      {children}
      {optional && (
        <span className="ml-1.5 normal-case tracking-normal font-normal">(optional)</span>
      )}
    </label>
  );
}
