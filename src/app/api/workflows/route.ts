import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workflows, workflowTools, tools, users, type WorkflowStep } from "@/lib/schema";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { getFingerprint } from "@/lib/fingerprint";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// GET: List workflows with optional filtering
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const search = params.get("q") ?? "";
  const difficulty = params.get("difficulty");
  const sort = params.get("sort") ?? "upvotes";
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(params.get("limit") ?? 20)));
  const offset = (page - 1) * limit;

  try {
    let query = db.select().from(workflows).$dynamic();

    // Filtering
    const conditions = [];
    if (difficulty && ["beginner", "intermediate", "advanced"].includes(difficulty)) {
      conditions.push(eq(workflows.difficulty, difficulty));
    }
    if (search.trim()) {
      conditions.push(
        or(
          ilike(workflows.title, `%${search}%`),
          ilike(workflows.description, `%${search}%`)
        )!
      );
    }

    if (conditions.length === 1) {
      query = query.where(conditions[0]);
    } else if (conditions.length > 1) {
      const { and } = await import("drizzle-orm");
      query = query.where(and(...conditions));
    }

    // Sorting
    if (sort === "newest") {
      query = query.orderBy(desc(workflows.createdAt));
    } else if (sort === "views") {
      query = query.orderBy(desc(workflows.viewCount));
    } else {
      query = query.orderBy(desc(workflows.upvoteCount));
    }

    const rows = await query.limit(limit).offset(offset);

    // Fetch tool names for each workflow
    const results = await Promise.all(
      rows.map(async (w) => {
        const toolRows = await db
          .select({ name: tools.name })
          .from(workflowTools)
          .innerJoin(tools, eq(workflowTools.toolId, tools.id))
          .where(eq(workflowTools.workflowId, w.id))
          .orderBy(workflowTools.usageOrder);

        return {
          slug: w.slug,
          title: w.title,
          description: w.description,
          difficulty: w.difficulty,
          toolNames: toolRows.map((t) => t.name),
          upvoteCount: w.upvoteCount,
          submitterName: w.submitterName,
          submitterRole: w.submitterRole,
          timeSaved: w.timeSaved,
          isVerified: w.isVerified,
          createdAt: w.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ workflows: results, page, limit });
  } catch (error) {
    console.error("Workflows GET error:", error);
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}

// POST: Create a new workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const difficulty = String(body.difficulty ?? "");
    const submitterName = String(body.submitterName ?? "").trim() || "Anonymous";
    const steps = body.steps as WorkflowStep[] | undefined;

    if (!title || title.length < 5) {
      return NextResponse.json(
        { error: "Title must be at least 5 characters" },
        { status: 400 }
      );
    }
    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters" },
        { status: 400 }
      );
    }
    if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
      return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
    }
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: "At least one step is required" },
        { status: 400 }
      );
    }

    const fingerprintHash = await getFingerprint();

    // Generate unique slug
    let slug = slugify(title);
    const [existingSlug] = await db
      .select({ id: workflows.id })
      .from(workflows)
      .where(eq(workflows.slug, slug))
      .limit(1);

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Upsert user by fingerprint
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.fingerprintHash, fingerprintHash))
      .limit(1);

    let submitterId: number;
    if (existingUser) {
      submitterId = existingUser.id;
      await db
        .update(users)
        .set({ displayName: submitterName, role: body.submitterRole || null })
        .where(eq(users.id, existingUser.id));
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          displayName: submitterName,
          role: body.submitterRole || null,
          fingerprintHash,
        })
        .returning({ id: users.id });
      submitterId = newUser.id;
    }

    // Insert workflow
    const [workflow] = await db
      .insert(workflows)
      .values({
        slug,
        title,
        description,
        problemContext: body.problemContext || null,
        difficulty,
        timeSaved: body.timeSaved || null,
        outcome: body.outcome || null,
        failureModes: body.failureModes || null,
        steps: steps.map((s, i) => ({
          order: i + 1,
          title: s.title,
          description: s.description,
          toolName: s.toolName || undefined,
          promptText: s.promptText || undefined,
        })),
        proofUrls: (body.proofUrls as string[])?.filter(Boolean) ?? [],
        submitterId,
        submitterName,
        submitterRole: body.submitterRole || null,
      })
      .returning({ id: workflows.id, slug: workflows.slug });

    // Insert workflow tools
    const toolIds = body.toolIds as { id: number; role?: string }[] | undefined;
    if (toolIds && Array.isArray(toolIds)) {
      for (let i = 0; i < toolIds.length; i++) {
        await db.insert(workflowTools).values({
          workflowId: workflow.id,
          toolId: toolIds[i].id,
          usageOrder: i,
          roleInWorkflow: toolIds[i].role || null,
        });
      }
    }

    return NextResponse.json({ slug: workflow.slug }, { status: 201 });
  } catch (error) {
    console.error("Workflow POST error:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
