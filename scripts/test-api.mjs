import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import { randomUUID } from "node:crypto";
import next from "next";
import { neon } from "@neondatabase/serverless";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
process.env.PROTOTYPE_ACCESS_CODE = "nutriscan-synthetic-access-test";
process.env.VERCEL = "1";
const sql = neon(process.env.DATABASE_URL);
const owners = [];
const app = next({
  dev: false,
  dir: process.cwd(),
  hostname: "127.0.0.1",
  port: 0,
});
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer((req, res) => handle(req, res));
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port;
// Node fetch rewrites Host; raw HTTP is needed to simulate the HTTPS proxy accurately.
function send(url, options) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      url,
      {
        method: options.method,
        headers: {
          ...options.headers,
          ...(options.body
            ? { "content-length": Buffer.byteLength(options.body) }
            : {}),
        },
        signal: options.signal,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("error", reject);
        res.on("end", () => {
          const headers = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            for (const item of Array.isArray(value) ? value : [value])
              if (item !== undefined) headers.append(key, item);
          }
          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode,
              headers,
            }),
          );
        });
      },
    );
    req.on("error", reject);
    req.end(options.body);
  });
}
function client() {
  const cookies = new Map();
  return {
    cookies,
    async request(path, method = "GET", body, options = {}) {
      const response = await send(base + path, {
        method,
        headers: {
          host: "nutriscan-audit.example.test",
          origin: "https://nutriscan-audit.example.test",
          "x-forwarded-proto": "https",
          ...(options.withoutCode
            ? {}
            : { "x-prototype-code": process.env.PROTOTYPE_ACCESS_CODE ?? "" }),
          cookie: [...cookies].map(([k, v]) => k + "=" + v).join("; "),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(90000),
      });
      for (const item of response.headers.getSetCookie()) {
        if (!/Max-Age=0/i.test(item)) assert.match(item, /; Secure/i);
        const pair = item.split(";")[0];
        const eq = pair.indexOf("=");
        if (/Max-Age=0/i.test(item)) cookies.delete(pair.slice(0, eq));
        else cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
      }
      return response;
    },
  };
}
try {
  const a = client(),
    b = client();
  assert.equal(
    (await a.request("/api/catalog", "GET", undefined, { withoutCode: true }))
      .status,
    401,
  );
  assert.equal((await a.request("/api/profile")).status, 401);
  for (const c of [a, b]) {
    assert.equal((await c.request("/api/session", "POST", {})).status, 200);
    owners.push(c.cookies.get("nutriscan-device").split(".")[0]);
  }
  const catalog = await a.request("/api/catalog").then((r) => r.json());
  assert.equal(
    catalog.catalogs.find((c) => c.version === "personal-v3").foods.length,
    46,
  );
  assert.equal(
    catalog.catalogs.find((c) => c.version === "personal-v4").foods.length,
    78,
  );
  assert.equal(catalog.menus.length, 9);
  const profile = {
    name: "NutriScan synthetic API test",
    age: 30,
    sex: "male",
    heightCm: 175,
    weightKg: 70,
    activity: "low",
    goal: "maintain",
    preference: "all",
    allergies: [],
    restrictions: "",
    specialCare: false,
  };
  assert.equal((await a.request("/api/profile", "PUT", profile)).status, 200);
  const teenReply = await b.request("/api/profile", "PUT", {
    ...profile,
    age: 17,
    goal: "lose",
  });
  assert.equal(teenReply.status, 200);
  const teen = await teenReply.json();
  assert.equal(teen.profile.age, 17);
  assert.equal(teen.profile.goal, "maintain");
  assert.equal(teen.targets.calories, 2830);
  const data = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    analysis: {
      items: [{ foodId: "nasi", label: "Nasi putih", grams: 150 }],
      source: "manual",
      title: "Synthetic test",
      summary: "",
    },
    catalogVersion: "personal-v4",
    reportVersion: 2,
    revision: 0,
    meal: {
      eatenAt: new Date().toISOString(),
      mealType: "lunch",
      targets: { calories: 2300, protein: 115, carbs: 288, fat: 77, fiber: 32 },
    },
    photoData:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/E8AAAAASUVORK5CYII=",
  };
  let response = await a.request("/api/submissions", "POST", data);
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(saved.photoStored, true);
  assert.equal(saved.revision, 1);
  response = await a.request("/api/photos/" + data.id, "GET", undefined, {
    withoutCode: true,
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.ok((await response.arrayBuffer()).byteLength > 0);
  assert.equal((await b.request("/api/photos/" + data.id)).status, 404);
  assert.equal((await a.request("/api/submissions", "POST", data)).status, 409);
  assert.equal((await a.request("/api/session", "DELETE")).status, 200);
  assert.equal((await a.request("/api/profile")).status, 401);
  assert.equal((await a.request("/api/submissions")).status, 401);
  assert.equal((await a.request("/api/photos/" + data.id)).status, 401);
  const status = await a.request("/api/session").then((r) => r.json());
  assert.equal(status.canResume, true);
  assert.equal(status.active, false);
  assert.equal((await a.request("/api/session", "POST", {})).status, 200);
  assert.equal(
    (await a.request("/api/profile").then((r) => r.json())).profile.name,
    profile.name,
  );
  assert.equal(
    (await a.request("/api/submissions", "DELETE", { id: data.id })).status,
    400,
  );
  assert.equal(
    (
      await b
        .request("/api/submissions", "DELETE", { id: data.id, confirm: true })
        .then((r) => r.json())
    ).deleted,
    0,
  );
  const removed = await a
    .request("/api/submissions", "DELETE", { id: data.id, confirm: true })
    .then((r) => r.json());
  assert.equal(removed.deleted, 1);
  assert.equal(removed.pendingPhotoDeletes, 0);
  assert.equal((await a.request("/api/photos/" + data.id)).status, 404);
  assert.equal((await a.request("/api/submissions", "POST", data)).status, 409);
  const retry = await a
    .request("/api/migrate", "POST", { records: [data] })
    .then((r) => r.json());
  assert.ok(retry.deleted.includes(data.id));
  delete data.photoData;
  for (let i = 0; i < 2; i++) {
    const record = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    assert.equal(
      (await a.request("/api/submissions", "POST", record)).status,
      200,
    );
  }
  assert.equal(
    (
      await a
        .request("/api/submissions", "DELETE", { all: true, confirm: true })
        .then((r) => r.json())
    ).deleted,
    2,
  );
  const old = { ...data, id: randomUUID(), createdAt: "2000-01-01T00:00:00Z" };
  const migration = await a
    .request("/api/migrate", "POST", { records: [old] })
    .then((r) => r.json());
  assert.ok(migration.deleted.includes(old.id));
  assert.equal(
    (await a.request("/api/submissions").then((r) => r.json())).submissions
      .length,
    0,
  );
  assert.equal(
    (await a.request("/api/profile").then((r) => r.json())).profile.name,
    profile.name,
  );
  console.log(
    "PASS: HTTPS proxy origin + access-code gate, cookie-only private photo, latest catalog/menu, cloud profile, private photo upload/read/delete, logout/resume, owner isolation, revision conflict, explicit delete confirmation, single/all delete, migration anti-resurrection.",
  );
} catch (error) {
  process.exitCode = 1;
  console.error(error);
} finally {
  try {
    if (owners.length) {
      const keys = await sql.query(
        "SELECT photo_key AS key FROM submissions WHERE session_id=ANY($1::uuid[]) AND photo_key IS NOT NULL UNION SELECT object_key AS key FROM photo_cleanup WHERE session_id=ANY($1::uuid[])",
        [owners],
      );
      const s3 = new S3Client({
        endpoint: process.env.AWS_ENDPOINT_URL_S3,
        region: process.env.AWS_REGION,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
      for (const row of keys)
        if (owners.some((owner) => row.key.startsWith(owner + "/")))
          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.PHOTO_BUCKET || "nutriscan-meals",
              Key: row.key,
            }),
          );
      await sql.transaction([
        sql`DELETE FROM submissions WHERE session_id=ANY(${owners}::uuid[])`,
        sql`DELETE FROM submission_tombstones WHERE session_id=ANY(${owners}::uuid[])`,
        sql`DELETE FROM photo_cleanup WHERE session_id=ANY(${owners}::uuid[])`,
        sql`DELETE FROM nutriscan_sessions WHERE id=ANY(${owners}::uuid[])`,
      ]);
      console.log(
        "Synthetic test sessions and photos cleaned; existing user reports untouched.",
      );
    }
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    await app.close();
  }
}
