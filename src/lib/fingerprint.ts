import { createHash } from "crypto";
import { headers } from "next/headers";

export async function getFingerprint(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const ua = h.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex");
}
