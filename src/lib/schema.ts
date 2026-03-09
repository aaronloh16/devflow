import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  serial,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  repo: text("repo").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  website: text("website"),
  hnSearchTerms: jsonb("hn_search_terms").$type<string[]>().default([]),
  npmPackage: text("npm_package"),
  pypiPackage: text("pypi_package"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const githubSnapshots = pgTable(
  "github_snapshots",
  {
    id: serial("id").primaryKey(),
    toolId: integer("tool_id")
      .references(() => tools.id)
      .notNull(),
    stars: integer("stars").notNull(),
    forks: integer("forks").notNull(),
    openIssues: integer("open_issues").notNull(),
    watchers: integer("watchers").notNull(),
    collectedAt: timestamp("collected_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("github_snapshots_tool_date_idx").on(table.toolId, table.collectedAt),
  ]
);

export const hnSnapshots = pgTable(
  "hn_snapshots",
  {
    id: serial("id").primaryKey(),
    toolId: integer("tool_id")
      .references(() => tools.id)
      .notNull(),
    mentionCount: integer("mention_count").notNull(),
    totalPoints: integer("total_points").notNull(),
    totalComments: integer("total_comments").notNull(),
    topStoryUrl: text("top_story_url"),
    collectedAt: timestamp("collected_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("hn_snapshots_tool_date_idx").on(table.toolId, table.collectedAt),
  ]
);

export const npmSnapshots = pgTable(
  "npm_snapshots",
  {
    id: serial("id").primaryKey(),
    toolId: integer("tool_id")
      .references(() => tools.id)
      .notNull(),
    weeklyDownloads: integer("weekly_downloads").notNull(),
    collectedAt: timestamp("collected_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("npm_snapshots_tool_date_idx").on(table.toolId, table.collectedAt),
  ]
);

export const pypiSnapshots = pgTable(
  "pypi_snapshots",
  {
    id: serial("id").primaryKey(),
    toolId: integer("tool_id")
      .references(() => tools.id)
      .notNull(),
    weeklyDownloads: integer("weekly_downloads").notNull(),
    collectedAt: timestamp("collected_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("pypi_snapshots_tool_date_idx").on(table.toolId, table.collectedAt),
  ]
);

export const momentumScores = pgTable(
  "momentum_scores",
  {
    id: serial("id").primaryKey(),
    toolId: integer("tool_id")
      .references(() => tools.id)
      .notNull(),
    starVelocity: real("star_velocity").notNull(), // stars gained per day (7d avg)
    hnMentions7d: integer("hn_mentions_7d").notNull(),
    hnPoints7d: integer("hn_points_7d").notNull(),
    npmDownloads7d: integer("npm_downloads_7d").notNull().default(0),
    pypiDownloads7d: integer("pypi_downloads_7d").notNull().default(0),
    overallScore: real("overall_score").notNull(), // composite score
    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("momentum_scores_tool_date_idx").on(table.toolId, table.calculatedAt),
  ]
);

export const dailyDigests = pgTable("daily_digests", {
  id: serial("id").primaryKey(),
  headline: text("headline").notNull(),
  body: text("body").notNull(),
  highlights: jsonb("highlights")
    .$type<
      Array<{
        tool: string;
        repo: string;
        delta: string;
        reason: string;
      }>
    >()
    .notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const sharedStacks = pgTable("shared_stacks", {
  id: text("id").primaryKey(), // nanoid
  prompt: text("prompt").notNull(),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
