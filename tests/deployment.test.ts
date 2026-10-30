import "./load-catalog.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  saveWithConfirmation,
  type SaveAcknowledgement,
} from "../lib/save-confirmation.ts";
import { responseData } from "../lib/client-response.ts";
import {
  SCAN_MAX_BYTES,
  MIGRATION_BATCH_SIZE,
  MIGRATION_MAX_BYTES,
} from "../lib/upload-limits.ts";
import type { Submission } from "../lib/types.ts";
const record: Submission = {
  id: "f5c6f354-c3ac-4d65-b19d-3d51741a09ec",
  createdAt: "2026-10-30T04:00:00Z",
  image: null,
  catalogVersion: "personal-v4",
  reportVersion: 2,
  revision: 0,
  analysis: {
    items: [{ foodId: "nasi", label: "Nasi putih", grams: 100 }],
    source: "manual",
    title: "Nasi",
    summary: "",
  },
  meal: {
    eatenAt: "2026-10-30T04:00:00Z",
    mealType: "lunch",
    targets: { calories: 2300, protein: 115, carbs: 288, fat: 77, fiber: 32 },
  },
};
const ack: SaveAcknowledgement = {
  revision: 1,
  photoStored: false,
  image: null,
  photoPending: false,
};
test("acknowledged save remains successful when the subsequent history refresh fails", async () => {
  let confirmed = 0;
  const order: string[] = [];
  const result = await saveWithConfirmation(record, {
    hasPhoto: false,
    save: async () => {
      order.push("save");
      return ack;
    },
    confirm: () => {
      confirmed++;
      order.push("confirmed");
    },
    load: async () => {
      order.push("refresh");
      throw new Error("network");
    },
  });
  assert.equal(confirmed, 1);
  assert.equal(result.refreshFailed, true);
  assert.deepEqual(order, ["save", "confirmed", "refresh"]);
});
test("lost POST reply recovers the already-stored draft without creating a second meal", async () => {
  const rows: Submission[] = [];
  let writes = 0,
    confirmed = 0;
  const result = await saveWithConfirmation(record, {
    hasPhoto: true,
    save: async () => {
      writes++;
      rows.push({
        ...record,
        revision: 1,
        photoStored: true,
        image: "/api/photos/" + record.id,
      });
      throw new Error("reply lost");
    },
    load: async () => rows,
    confirm: (value) => {
      confirmed++;
      assert.equal(value.photoStored, true);
      assert.equal(value.revision, 1);
    },
  });
  assert.equal(result.recovered, true);
  assert.equal(rows.length, 1);
  assert.equal(writes, 1);
  assert.equal(confirmed, 1);
});
test("failed save never claims a different revision, target, portion or date as its own success", async () => {
  const failure = new Error("conflict");
  const changes: Submission[] = [
    { ...record, id: "different" },
    {
      ...record,
      analysis: {
        ...record.analysis,
        items: [{ ...record.analysis.items[0], grams: 200 }],
      },
    },
    { ...record, meal: { ...record.meal!, eatenAt: "2026-10-31T04:00:00Z" } },
    {
      ...record,
      meal: {
        ...record.meal!,
        targets: { ...record.meal!.targets, calories: 2000 },
      },
    },
  ];
  for (const changed of changes) {
    await assert.rejects(
      saveWithConfirmation(record, {
        hasPhoto: false,
        save: async () => {
          throw failure;
        },
        load: async () => [changed],
        confirm: () => assert.fail("false save acknowledgement"),
      }),
      (e) => e === failure,
    );
  }
  await assert.rejects(
    saveWithConfirmation(record, {
      hasPhoto: false,
      save: async () => {
        throw failure;
      },
      load: async () => {
        throw new Error("history offline");
      },
      confirm: () => assert.fail(),
    }),
    (e) => e === failure,
  );
});
test("Vercel HTML payload errors produce an actionable message instead of JSON syntax errors", async () => {
  await assert.rejects(
    responseData(new Response("<html>Too large</html>", { status: 413 })),
    /terlalu besar/,
  );
  await assert.rejects(
    responseData(new Response("gateway error", { status: 502 })),
    /HTTP 502/,
  );
  await assert.rejects(responseData(new Response("not json")), /belum lengkap/);
  assert.equal(
    (await responseData(Response.json({ saved: true }))).saved,
    true,
  );
});
test("maximal supported migration batch and scan file fit below Vercel's payload ceiling", () => {
  const maxPhoto =
    "data:image/jpeg;base64," + "A".repeat(4 * Math.ceil((384 * 1024) / 3));
  const migration = JSON.stringify({
    records: Array.from({ length: MIGRATION_BATCH_SIZE }, () => ({
      ...record,
      photoData: maxPhoto,
    })),
  });
  assert.ok(Buffer.byteLength(migration) < MIGRATION_MAX_BYTES);
  assert.ok(MIGRATION_MAX_BYTES < 4_500_000);
  assert.ok(SCAN_MAX_BYTES + 100000 < 4_500_000);
});

test("HTTPS proxy origin stays same-origin and untrusted forwarded protocols do not change local origin", async () => {
  const { requestOrigin } = await import("../lib/request-origin.ts");
  const request = new Request("http://localhost/api/submissions", {
    headers: {
      host: "nutriscan.example.test",
      origin: "https://nutriscan.example.test",
      "x-forwarded-proto": "https",
    },
  });
  assert.equal(
    requestOrigin(request, true).origin,
    "https://nutriscan.example.test",
  );
  assert.equal(requestOrigin(request, true).protocol, "https:");
  assert.equal(
    requestOrigin(request, false).origin,
    "http://nutriscan.example.test",
  );
  const malformed = new Request("http://localhost/api/session", {
    headers: {
      host: "nutriscan.example.test",
      "x-forwarded-proto": "https,http",
    },
  });
  assert.equal(requestOrigin(malformed, true).protocol, "http:");
});

test("photo cleanup failures remain queued and an expired budget stops the next batch", async () => {
  const { drainPhotoQueue } = await import("../lib/photo-cleanup.ts");
  const keys = Array.from({ length: 8 }, (_, i) => "photo-" + i);
  const controller = new AbortController();
  const attempted: string[] = [];
  const forgotten: string[] = [];
  await drainPhotoQueue(
    keys,
    async (key) => {
      attempted.push(key);
      if (key === "photo-0") {
        controller.abort();
        throw new Error("storage unavailable");
      }
    },
    async (key) => {
      forgotten.push(key);
    },
    controller.signal,
  );
  assert.equal(attempted.length, 1);
  assert.equal(forgotten.length, 0);
  await drainPhotoQueue(
    ["ok", "offline"],
    async (key) => {
      if (key === "offline") throw new Error("offline");
    },
    async (key) => {
      forgotten.push(key);
    },
    new AbortController().signal,
  );
  assert.deepEqual(forgotten, ["ok"]);
});
