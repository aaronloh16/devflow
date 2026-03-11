# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Vitest (run once)
npm run test:watch       # Vitest (watch mode)
npm run db:push          # Push Drizzle schema to Neon Postgres (no migration files)
npm run db:generate      # Generate Drizzle migration files
npm run db:migrate       # Apply migrations
npm run db:studio        # Open Drizzle Studio for DB inspection
```

## Architecture

**DevFlow** is a community-driven platform for AI dev workflows — how engineers actually use AI tools to ship. Core features: a workflow library with upvotes and submission, and Builder's Picks (community-curated tool directory organized by use case).

### Core Pages

1. **Homepage** (`/`) — Hero, featured workflows, browse by category, Builder's Picks CTA
2. **Workflows** (`/workflows`) — Community-submitted AI workflows with search, filter, upvotes
3. **Workflow Detail** (`/workflows/[slug]`) — Full workflow with steps, tools, prompts
4. **Builder's Picks** (`/leaderboard`) — Curated AI tools organized by category with tier ratings (Essential / Rising / Worth Watching)
5. **Submit** (`/submit`) — Multi-step workflow submission form

### Data Model

- **tools.json** → master list of ~89 AI tools with GitHub repos, categories
- **essentials.ts** → curated tool directory with categories, tiers, and descriptions (Builder's Picks)

### Key Patterns

- **Database:** Drizzle ORM with `postgres` driver connecting to Neon Postgres. Schema in `src/lib/schema.ts`.
- **Community tables:** `users`, `workflows`, `workflowTools`, `upvotes`, `stackCombos`, `stackComboTools`.
- **Anonymous fingerprinting:** SHA-256 of IP + User-Agent for upvote deduplication. No auth, no cookies.
- **Workflow submission:** Multi-step form (basics → tools → steps → results → review) posts to `/api/workflows`. Server slugifies title, upserts user by fingerprint, inserts workflow + tool links.
- **Upvote system:** Toggle endpoint at `/api/upvote` — inserts or deletes from `upvotes` table, updates denormalized `upvoteCount` on target.

### Environment Variables

Required in `.env.local` (see `.env.example`):

- `DATABASE_URL` — Neon Postgres connection string

## Verification

- **`npm run test` after any code change.** Always run the test suite after modifying source files. Tests must pass before committing. If tests fail, fix them before moving on — never leave broken tests for a later commit.
- **`npm run build` is the primary type-check.** TypeScript compilation catches most issues. Run it after every change.
- **`npm run lint` for style issues.** Run before committing.
- **Browser-check UI changes.** Screenshots and snapshots catch layout issues that types can't.
- **When refactoring shared code** (e.g., extracting helpers, changing function signatures), check and update the corresponding test mocks. Tests that mock the old interface will break silently or fail in CI.
