import { ArchitectureGenerator } from "@/components/architecture-generator";

export default function GeneratePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Architecture Generator</h1>
        <p className="text-zinc-400 mt-2">
          Describe what you want to build. Get a recommended stack backed by live
          developer sentiment data.
        </p>
      </div>

      <ArchitectureGenerator />
    </div>
  );
}
