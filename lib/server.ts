import "server-only";
import { requestOrigin } from "./request-origin";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function protect(request: Request): NextResponse | null {
  // Next.js may normalize request.url to localhost while the browser uses 127.0.0.1.
  // Use the incoming Host while preserving strict same-origin checks.
  let browserUrl: URL;
  try {
    browserUrl = requestOrigin(request);
  } catch {
    return NextResponse.json(
      { error: "Alamat permintaan tidak valid." },
      { status: 400 },
    );
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== browserUrl.origin)
    return NextResponse.json(
      { error: "Permintaan dari alamat lain tidak diizinkan." },
      { status: 403 },
    );
  const code = process.env.PROTOTYPE_ACCESS_CODE;
  if (code) {
    const actual = Buffer.from(request.headers.get("x-prototype-code") ?? "");
    const expected = Buffer.from(code);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return NextResponse.json(
        { error: "Masukkan kode akses prototype di Pengaturan." },
        { status: 401 },
      );
  } else if (
    !["localhost", "127.0.0.1", "[::1]"].includes(browserUrl.hostname)
  ) {
    return NextResponse.json(
      {
        error:
          "Akses live belum diaktifkan. Atur PROTOTYPE_ACCESS_CODE di server.",
      },
      { status: 403 },
    );
  }
  return null;
}
const buckets = new Map<string, { count: number; until: number }>();
export function allowRequest(key: string, max: number, windowMs = 60000) {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  const entry = buckets.get(key);
  if (!entry) {
    buckets.set(key, { count: 1, until: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}
