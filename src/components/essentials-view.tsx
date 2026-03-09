"use client";

import { useState, useMemo } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import {
  ESSENTIALS_CATEGORIES,
  TIER_META,
} from "@/data/essentials";

export function EssentialsView() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    let categories = ESSENTIALS_CATEGORIES;

    if (selectedCategory) {
      categories = categories.filter((c) => c.id === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      categories = categories
        .map((cat) => ({
          ...cat,
          tools: cat.tools.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q)
          ),
        }))
        .filter((cat) => cat.tools.length > 0);
    }

    return categories;
  }, [selectedCategory, search]);

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-white text-zinc-900"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All
          </button>
          {ESSENTIALS_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? "bg-white text-zinc-900"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {filteredCategories.map((category) => (
          <section key={category.id}>
            <h2 className="text-lg font-semibold mb-4">{category.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.tools.map((tool) => {
                const tierMeta = TIER_META[tool.tier];
                return (
                  <a
                    key={tool.name}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-4 border border-zinc-800 rounded-xl bg-zinc-900/30 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-zinc-100 group-hover:text-white flex items-center gap-1">
                        {tool.name}
                        <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${tierMeta.bgColor} ${tierMeta.color}`}
                      >
                        {tierMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {tool.description}
                    </p>
                  </a>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          {search.trim()
            ? `No tools matching "${search}".`
            : "No tools found for this category."}
        </div>
      )}
    </div>
  );
}
