import { NextRequest, NextResponse } from "next/server";
import { getToolsWithLatestMetrics } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  try {
    const allTools = await getToolsWithLatestMetrics();

    const leaderboard = allTools
      .filter((t) => !category || t.category === category)
      .sort((a, b) => b.overallScore - a.overallScore);

    return NextResponse.json({ tools: leaderboard });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
