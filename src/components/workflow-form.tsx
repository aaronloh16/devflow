"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Search,
  Check,
  Loader2,
} from "lucide-react";

interface AvailableTool {
  id: number;
  name: string;
  category: string;
}

interface SelectedTool {
  id: number;
  name: string;
  role: string;
}

interface StepData {
  title: string;
  description: string;
  toolName: string;
  promptText: string;
}

interface FormData {
  title: string;
  description: string;
  problemContext: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  timeSaved: string;
  selectedTools: SelectedTool[];
  steps: StepData[];
  outcome: string;
  failureModes: string;
  proofUrls: string[];
  submitterName: string;
  submitterRole: string;
}

const INITIAL_FORM: FormData = {
  title: "",
  description: "",
  problemContext: "",
  difficulty: "intermediate",
  timeSaved: "",
  selectedTools: [],
  steps: [{ title: "", description: "", toolName: "", promptText: "" }],
  outcome: "",
  failureModes: "",
  proofUrls: [""],
  submitterName: "",
  submitterRole: "",
};

const STEPS = [
  { n: 1, label: "Basics" },
  { n: 2, label: "Tools" },
  { n: 3, label: "Steps" },
  { n: 4, label: "Results" },
  { n: 5, label: "Submit" },
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

export function WorkflowForm({
  availableTools,
}: {
  availableTools: AvailableTool[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [toolSearch, setToolSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- Field updaters ---
  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateStep = useCallback(
    (index: number, field: keyof StepData, value: string) => {
      setForm((prev) => {
        const steps = [...prev.steps];
        steps[index] = { ...steps[index], [field]: value };
        return { ...prev, steps };
      });
    },
    []
  );

  // --- Validation per step ---
  function canAdvance(): boolean {
    if (step === 1) return form.title.length >= 5 && form.description.length >= 10;
    if (step === 2) return form.selectedTools.length >= 1;
    if (step === 3) return form.steps.some((s) => s.title && s.description);
    if (step === 4) return form.submitterName.trim().length > 0;
    return true;
  }

  // --- Tool toggling ---
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
        selectedTools: [
          ...prev.selectedTools,
          { id: tool.id, name: tool.name, role: "" },
        ],
      };
    });
  }

  function updateToolRole(id: number, role: string) {
    setForm((prev) => ({
      ...prev,
      selectedTools: prev.selectedTools.map((t) =>
        t.id === id ? { ...t, role } : t
      ),
    }));
  }

  // --- Step list management ---
  function addStep() {
    setForm((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        { title: "", description: "", toolName: "", promptText: "" },
      ],
    }));
  }

  function removeStep(index: number) {
    if (form.steps.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  }

  // --- Proof URL management ---
  function addProofUrl() {
    setForm((prev) => ({ ...prev, proofUrls: [...prev.proofUrls, ""] }));
  }

  function updateProofUrl(index: number, value: string) {
    setForm((prev) => {
      const urls = [...prev.proofUrls];
      urls[index] = value;
      return { ...prev, proofUrls: urls };
    });
  }

  function removeProofUrl(index: number) {
    if (form.proofUrls.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      proofUrls: prev.proofUrls.filter((_, i) => i !== index),
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
          problemContext: form.problemContext || undefined,
          difficulty: form.difficulty,
          timeSaved: form.timeSaved || undefined,
          toolIds: form.selectedTools.map((t) => ({
            id: t.id,
            role: t.role || undefined,
          })),
          steps: form.steps
            .filter((s) => s.title || s.description)
            .map((s, i) => ({
              order: i + 1,
              title: s.title,
              description: s.description,
              toolName: s.toolName || undefined,
              promptText: s.promptText || undefined,
            })),
          outcome: form.outcome || undefined,
          failureModes: form.failureModes || undefined,
          proofUrls: form.proofUrls.filter(Boolean),
          submitterName: form.submitterName,
          submitterRole: form.submitterRole || undefined,
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

  // --- Tool names for step dropdown ---
  const selectedToolNames = form.selectedTools.map((t) => t.name);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-12 px-2">
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
                className="text-xs font-medium hidden sm:inline"
                style={{
                  color:
                    s.n === step
                      ? "var(--text-primary)"
                      : "var(--text-tertiary)",
                }}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className="w-8 sm:w-12 h-px mx-2"
                style={{
                  background:
                    s.n < step ? "var(--accent-green)" : "var(--border-subtle)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="animate-fade-in" key={step}>
        {/* ---- STEP 1: Basics ---- */}
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
                What&rsquo;s the technique, setup, or workflow you use to ship faster with AI?
              </p>
            </div>

            <div>
              <Label>Title</Label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g., Parallel Claude Code sessions with agent orchestrator"
                className="input-base w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>

            <div>
              <Label>Short Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="A 1-2 sentence summary of what this workflow does and why it matters."
                rows={2}
                className="input-base w-full px-4 py-3 rounded-xl text-sm resize-none"
              />
            </div>

            <div>
              <Label optional>Problem This Solves</Label>
              <textarea
                value={form.problemContext}
                onChange={(e) => update("problemContext", e.target.value)}
                placeholder="What were you struggling with before you figured this out?"
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

            <div>
              <Label optional>Time Saved</Label>
              <input
                type="text"
                value={form.timeSaved}
                onChange={(e) => update("timeSaved", e.target.value)}
                placeholder="e.g., 3 hours per PR review"
                className="input-base w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
          </div>
        )}

        {/* ---- STEP 2: Tools ---- */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                Tools & Stack
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Which AI tools does this workflow use? Select at least one.
              </p>
            </div>

            {/* Selected tools with roles */}
            {form.selectedTools.length > 0 && (
              <div className="space-y-2">
                <Label>Selected ({form.selectedTools.length})</Label>
                {form.selectedTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--text-primary)",
                    }}
                  >
                    <span
                      className="text-sm font-medium shrink-0"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {tool.name}
                    </span>
                    <input
                      type="text"
                      value={tool.role}
                      onChange={(e) => updateToolRole(tool.id, e.target.value)}
                      placeholder="Role in workflow (optional)"
                      className="flex-1 bg-transparent text-xs outline-none"
                      style={{
                        color: "var(--text-secondary)",
                        borderBottom: "1px solid var(--border-subtle)",
                        paddingBottom: 2,
                      }}
                    />
                    <button
                      onClick={() => toggleTool(tool)}
                      className="p-1 rounded-md transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tool search */}
            <div className="relative">
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
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "var(--border-default) transparent",
              }}
            >
              {filteredTools.map((tool) => {
                const selected = form.selectedTools.some(
                  (t) => t.id === tool.id
                );
                return (
                  <button
                    key={tool.id}
                    onClick={() => toggleTool(tool)}
                    className="px-3 py-2.5 rounded-lg text-left transition-all"
                    style={{
                      background: selected
                        ? "var(--accent-cyan-dim)"
                        : "var(--bg-surface)",
                      border: `1px solid ${
                        selected
                          ? "var(--text-primary)"
                          : "var(--border-subtle)"
                      }`,
                    }}
                  >
                    <span
                      className="text-xs font-medium block truncate"
                      style={{
                        color: selected
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {tool.name}
                    </span>
                    <span
                      className="text-[10px] block truncate"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {tool.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- STEP 3: Steps ---- */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                Step-by-step process
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Walk through the workflow. Include prompts, commands, or configs where helpful.
              </p>
            </div>

            <div className="space-y-4">
              {form.steps.map((s, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl relative"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
                      style={{
                        background: "var(--accent-cyan-dim)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-default)",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                      }}
                    >
                      {i + 1}
                    </span>
                    {form.steps.length > 1 && (
                      <button
                        onClick={() => removeStep(i)}
                        className="p-1 rounded-md transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={s.title}
                      onChange={(e) => updateStep(i, "title", e.target.value)}
                      placeholder="Step title"
                      className="input-base w-full px-3.5 py-2.5 rounded-lg text-sm"
                    />
                    <textarea
                      value={s.description}
                      onChange={(e) =>
                        updateStep(i, "description", e.target.value)
                      }
                      placeholder="What to do in this step..."
                      rows={2}
                      className="input-base w-full px-3.5 py-2.5 rounded-lg text-sm resize-none"
                    />

                    <div className="flex gap-3">
                      {selectedToolNames.length > 0 && (
                        <select
                          value={s.toolName}
                          onChange={(e) =>
                            updateStep(i, "toolName", e.target.value)
                          }
                          className="input-base px-3 py-2 rounded-lg text-xs flex-1"
                        >
                          <option value="">Tool used (optional)</option>
                          {selectedToolNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <textarea
                      value={s.promptText}
                      onChange={(e) =>
                        updateStep(i, "promptText", e.target.value)
                      }
                      placeholder="Prompt, command, or config (optional)"
                      rows={3}
                      className="input-base w-full px-3.5 py-2.5 rounded-lg text-xs resize-none"
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                      }}
                    />
                  </div>
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
          </div>
        )}

        {/* ---- STEP 4: Results & About ---- */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                Results & attribution
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                What does this workflow achieve, and who are you?
              </p>
            </div>

            <div>
              <Label optional>Expected Outcome</Label>
              <textarea
                value={form.outcome}
                onChange={(e) => update("outcome", e.target.value)}
                placeholder="What's the end result when this workflow is followed correctly?"
                rows={3}
                className="input-base w-full px-4 py-3 rounded-xl text-sm resize-none"
              />
            </div>

            <div>
              <Label optional>Common Pitfalls</Label>
              <textarea
                value={form.failureModes}
                onChange={(e) => update("failureModes", e.target.value)}
                placeholder="What goes wrong if someone sets this up incorrectly?"
                rows={2}
                className="input-base w-full px-4 py-3 rounded-xl text-sm resize-none"
              />
            </div>

            <div>
              <Label optional>Proof / References</Label>
              {form.proofUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateProofUrl(i, e.target.value)}
                    placeholder="https://..."
                    className="input-base flex-1 px-4 py-2.5 rounded-lg text-xs"
                  />
                  {form.proofUrls.length > 1 && (
                    <button
                      onClick={() => removeProofUrl(i)}
                      className="p-1.5 rounded-md"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addProofUrl}
                className="text-xs flex items-center gap-1 mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Plus className="w-3 h-3" />
                Add URL
              </button>
            </div>

            <div
              className="pt-6"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              <Label>Your Name</Label>
              <input
                type="text"
                value={form.submitterName}
                onChange={(e) => update("submitterName", e.target.value)}
                placeholder="How you want to be credited"
                className="input-base w-full px-4 py-3 rounded-xl text-sm mb-4"
              />

              <Label optional>Role / Company</Label>
              <input
                type="text"
                value={form.submitterRole}
                onChange={(e) => update("submitterRole", e.target.value)}
                placeholder="e.g., Senior Engineer @ Vercel"
                className="input-base w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
          </div>
        )}

        {/* ---- STEP 5: Review ---- */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "var(--font-syne), sans-serif" }}
              >
                Review & submit
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Check everything looks good before publishing.
              </p>
            </div>

            {/* Preview card */}
            <div
              className="p-6 rounded-xl space-y-4"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
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
                {form.timeSaved && (
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--accent-green)" }}
                  >
                    Saves {form.timeSaved}
                  </span>
                )}
              </div>

              <h3
                className="text-lg font-bold"
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

              <div
                className="pt-3 flex items-center gap-2"
                style={{ borderTop: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: "var(--accent-violet-dim)",
                    color: "var(--accent-violet)",
                  }}
                >
                  {(form.submitterName || "?").charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium">
                  {form.submitterName || "Anonymous"}
                </span>
                {form.submitterRole && (
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {form.submitterRole}
                  </span>
                )}
              </div>
            </div>

            {/* Steps summary */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                {form.steps.filter((s) => s.title || s.description).length}{" "}
                steps
              </p>
              <ol className="space-y-2">
                {form.steps
                  .filter((s) => s.title || s.description)
                  .map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span
                        className="text-[10px] font-bold mt-0.5 shrink-0"
                        style={{
                          color: "var(--text-tertiary)",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{s.title || s.description}</span>
                    </li>
                  ))}
              </ol>
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
      <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: "1px solid var(--border-subtle)" }}>
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

        {step < 5 ? (
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
            disabled={submitting}
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
        <span className="ml-1.5 normal-case tracking-normal font-normal">
          (optional)
        </span>
      )}
    </label>
  );
}
