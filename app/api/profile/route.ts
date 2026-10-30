import { NextResponse } from "next/server";
import { protect } from "@/lib/server";
import { requireSession, sessionError } from "@/lib/session";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validation";
import { planFor } from "@/lib/personal";
export async function GET(request: Request) {
  const denial = protect(request);
  if (denial) return denial;
  try {
    const id = await requireSession(request);
    const rows =
      await db()`SELECT profile,targets FROM nutriscan_sessions WHERE id=${id}::uuid`;
    return NextResponse.json(
      { profile: rows[0]?.profile ?? null, targets: rows[0]?.targets ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return sessionError(e);
  }
}
export async function PUT(request: Request) {
  const denial = protect(request);
  if (denial) return denial;
  try {
    const id = await requireSession(request);
    if (Number(request.headers.get("content-length") ?? 0) > 10000)
      return NextResponse.json(
        { error: "Profil terlalu besar." },
        { status: 413 },
      );
    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Profil belum valid." },
        { status: 400 },
      );
    const targets = planFor(parsed.data).targets;
    await db()`UPDATE nutriscan_sessions SET profile=${JSON.stringify(parsed.data)}::jsonb,targets=${JSON.stringify(targets)}::jsonb,updated_at=now() WHERE id=${id}::uuid`;
    return NextResponse.json({ profile: parsed.data, targets });
  } catch (e) {
    return sessionError(e);
  }
}
