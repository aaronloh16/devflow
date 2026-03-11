import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { upvotes, workflows, stackCombos } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { getFingerprint } from "@/lib/fingerprint";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targetId = Number(body.targetId);
    const targetType = String(body.targetType);

    if (!targetId || !["workflow", "tool", "stack_combo"].includes(targetType)) {
      return NextResponse.json(
        { error: "Invalid targetId or targetType" },
        { status: 400 }
      );
    }

    const fingerprintHash = await getFingerprint();

    // Check existing upvote
    const [existing] = await db
      .select()
      .from(upvotes)
      .where(
        and(
          eq(upvotes.fingerprintHash, fingerprintHash),
          eq(upvotes.targetId, targetId),
          eq(upvotes.targetType, targetType)
        )
      )
      .limit(1);

    if (existing) {
      // Remove upvote
      await db.delete(upvotes).where(eq(upvotes.id, existing.id));

      if (targetType === "workflow") {
        await db
          .update(workflows)
          .set({ upvoteCount: sql`GREATEST(${workflows.upvoteCount} - 1, 0)` })
          .where(eq(workflows.id, targetId));
      } else if (targetType === "stack_combo") {
        await db
          .update(stackCombos)
          .set({ upvoteCount: sql`GREATEST(${stackCombos.upvoteCount} - 1, 0)` })
          .where(eq(stackCombos.id, targetId));
      }
    } else {
      // Add upvote
      await db.insert(upvotes).values({ fingerprintHash, targetId, targetType });

      if (targetType === "workflow") {
        await db
          .update(workflows)
          .set({ upvoteCount: sql`${workflows.upvoteCount} + 1` })
          .where(eq(workflows.id, targetId));
      } else if (targetType === "stack_combo") {
        await db
          .update(stackCombos)
          .set({ upvoteCount: sql`${stackCombos.upvoteCount} + 1` })
          .where(eq(stackCombos.id, targetId));
      }
    }

    // Fetch updated count
    let count = 0;
    if (targetType === "workflow") {
      const [row] = await db
        .select({ c: workflows.upvoteCount })
        .from(workflows)
        .where(eq(workflows.id, targetId));
      count = row?.c ?? 0;
    } else if (targetType === "stack_combo") {
      const [row] = await db
        .select({ c: stackCombos.upvoteCount })
        .from(stackCombos)
        .where(eq(stackCombos.id, targetId));
      count = row?.c ?? 0;
    }

    return NextResponse.json({ upvoted: !existing, count });
  } catch (error) {
    console.error("Upvote error:", error);
    return NextResponse.json(
      { error: "Failed to toggle upvote" },
      { status: 500 }
    );
  }
}
