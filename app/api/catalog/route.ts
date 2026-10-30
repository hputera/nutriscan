import { NextResponse } from "next/server";
import { protect } from "@/lib/server";
import { databaseCatalogs, db } from "@/lib/db";
export async function GET(request: Request) {
  const denial = protect(request);
  if (denial) return denial;
  try {
    const catalogs = await databaseCatalogs();
    const menus = await db()`SELECT payload FROM menu_templates ORDER BY id`;
    return NextResponse.json(
      { catalogs, menus: menus.map((r) => r.payload) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Katalog Neon belum siap. Jalankan npm run db:setup." },
      { status: 503 },
    );
  }
}
