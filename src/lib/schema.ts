import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  serial,
  jsonb,
  uniqueIndex,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// ─── Types ─────────────────────────────────────────────────────────────

export interface WorkflowStep {
  order: number;
  title: string;
  description: string;
  toolName?: string;
  screenshotUrl?: string;
  promptText?: string;
}

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

export const sharedStacks = pgTable("shared_stacks", {
  id: text("id").primaryKey(), // nanoid
  prompt: text("prompt").notNull(),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── DevFlow: Community Tables ─────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  role: text("role"),
  company: text("company"),
  linkedinUrl: text("linkedin_url"),
  avatarUrl: text("avatar_url"),
  fingerprintHash: text("fingerprint_hash").unique(),
  isVerifiedContributor: boolean("is_verified_contributor").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflows = pgTable(
  "workflows",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    problemContext: text("problem_context"),
    difficulty: text("difficulty").notNull(), // beginner | intermediate | advanced
    timeSaved: text("time_saved"),
    outcome: text("outcome"),
    failureModes: text("failure_modes"),
    steps: jsonb("steps").$type<WorkflowStep[]>().notNull(),
    proofUrls: jsonb("proof_urls").$type<string[]>().default([]),
    submitterId: integer("submitter_id").references(() => users.id),
    submitterName: text("submitter_name").notNull(),
    submitterRole: text("submitter_role"),
    isVerified: boolean("is_verified").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    upvoteCount: integer("upvote_count").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("workflows_slug_idx").on(table.slug),
    index("workflows_difficulty_idx").on(table.difficulty),
    index("workflows_featured_idx").on(table.isFeatured),
    index("workflows_upvote_count_idx").on(table.upvoteCount),
    index("workflows_created_at_idx").on(table.createdAt),
  ]
);

export const workflowTools = pgTable(
  "workflow_tools",
  {
    id: serial("id").primaryKey(),
    workflowId: integer("workflow_id")
      .references(() => workflows.id, { onDelete: "cascade" })
      .notNull(),
    toolId: integer("tool_id")
      .references(() => tools.id)
      .notNull(),
    usageOrder: integer("usage_order").notNull().default(0),
    roleInWorkflow: text("role_in_workflow"),
  },
  (table) => [
    uniqueIndex("workflow_tools_wf_tool_idx").on(table.workflowId, table.toolId),
    index("workflow_tools_tool_idx").on(table.toolId),
  ]
);

export const upvotes = pgTable(
  "upvotes",
  {
    id: serial("id").primaryKey(),
    fingerprintHash: text("fingerprint_hash").notNull(),
    targetId: integer("target_id").notNull(),
    targetType: text("target_type").notNull(), // workflow | tool | stack_combo
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("upvotes_fingerprint_target_idx").on(
      table.fingerprintHash,
      table.targetId,
      table.targetType
    ),
  ]
);

export const stackCombos = pgTable("stack_combos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  useCase: text("use_case"),
  upvoteCount: integer("upvote_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stackComboTools = pgTable(
  "stack_combo_tools",
  {
    id: serial("id").primaryKey(),
    stackComboId: integer("stack_combo_id")
      .references(() => stackCombos.id, { onDelete: "cascade" })
      .notNull(),
    toolId: integer("tool_id")
      .references(() => tools.id)
      .notNull(),
    role: text("role"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("stack_combo_tools_combo_tool_idx").on(table.stackComboId, table.toolId),
  ]
);
