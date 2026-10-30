import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import {
  createGeminiClient,
  FALLBACK_MODEL,
  GeminiFailure,
} from "../lib/gemini.ts";

const good = () =>
  Response.json({
    candidates: [
      { finishReason: "STOP", content: { parts: [{ text: '{"ok":true}' }] } },
    ],
  });
const options = () => ({
  apiKey: "test-secret",
  model: "gemini-3.8-flash",
  prompt: "Test",
  schema: { type: "object" },
  image: new Uint8Array([1, 2]),
  mimeType: "image/jpeg",
  validate: (text: string) => {
    try {
      return JSON.parse(text).ok === true;
    } catch {
      return false;
    }
  },
});
const noWait = async () => {};

test("503 falls back once, then overloaded primary is skipped for a new photo", async () => {
  let time = 0;
  const calls: string[] = [];
  let primaryCalls = 0;
  const client = createGeminiClient({
    now: () => time,
    wait: noWait,
    fetch: async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("gemini-3.8-flash") && ++primaryCalls === 1)
        return Response.json({ error: { message: "Busy" } }, { status: 503 });
      return good();
    },
  });
  const first = await client(options());
  assert.equal(first.model, FALLBACK_MODEL);
  assert.equal(first.attempts, 2);
  const second = await client({ ...options(), image: new Uint8Array([3]) });
  assert.equal(second.model, FALLBACK_MODEL);
  assert.equal(second.attempts, 1);
  assert.equal(primaryCalls, 1);
  time = 120001;
  const third = await client({ ...options(), image: new Uint8Array([4]) });
  assert.equal(third.model, "gemini-3.8-flash");
  assert.equal(primaryCalls, 2);
  assert.equal(calls.length, 4);
});

test("same validated photo is cached; a different key, photo or expired TTL makes a new call", async () => {
  let calls = 0;
  let time = 0;
  const client = createGeminiClient({
    now: () => time,
    wait: noWait,
    fetch: async () => {
      calls++;
      return good();
    },
  });
  await client(options());
  const cached = await client(options());
  assert.equal(cached.cached, true);
  assert.equal(cached.attempts, 0);
  assert.equal(calls, 1);
  await client({ ...options(), apiKey: "different-secret" });
  assert.equal(calls, 2);
  await client({ ...options(), image: new Uint8Array([9]) });
  assert.equal(calls, 3);
  time = 300001;
  await client(options());
  assert.equal(calls, 4);
});

for (const status of [400, 401, 403, 404, 429])
  test(
    "HTTP " + status + " is not retried and credentials are redacted",
    async () => {
      let calls = 0;
      const client = createGeminiClient({
        wait: noWait,
        fetch: async () => {
          calls++;
          return Response.json(
            { error: { message: "Problem with test-secret" } },
            { status },
          );
        },
      });
      await assert.rejects(
        client(options()),
        (error) =>
          error instanceof GeminiFailure &&
          error.status === status &&
          !error.message.includes("test-secret"),
      );
      assert.equal(calls, 1);
    },
  );

test("primary timeout uses one fallback; both timeouts stop after two calls", async () => {
  let calls = 0;
  const client = createGeminiClient({
    wait: noWait,
    primaryTimeoutMs: 1,
    fallbackTimeoutMs: 1,
    fetch: async (_input, init) => {
      calls++;
      await delay(8);
      if (init?.signal?.aborted) throw init.signal.reason;
      return good();
    },
  });
  await assert.rejects(
    client(options()),
    (error) => error instanceof GeminiFailure && error.kind === "timeout",
  );
  assert.equal(calls, 2);
});

test("user cancellation stops requests without fallback", async () => {
  const controller = new AbortController();
  let calls = 0;
  const client = createGeminiClient({
    wait: noWait,
    fetch: async () => {
      calls++;
      controller.abort();
      throw controller.signal.reason;
    },
  });
  await assert.rejects(client({ ...options(), signal: controller.signal }), {
    name: "AbortError",
  });
  assert.equal(calls, 1);
});

test("truncated or invalid results are never cached or presented as success", async () => {
  let calls = 0;
  const client = createGeminiClient({
    wait: noWait,
    fetch: async () => {
      calls++;
      return calls === 1
        ? Response.json({
            candidates: [
              {
                finishReason: "MAX_TOKENS",
                content: { parts: [{ text: '{"ok":true}' }] },
              },
            ],
          })
        : good();
    },
  });
  await assert.rejects(
    client(options()),
    (error) =>
      error instanceof GeminiFailure && error.kind === "invalid-response",
  );
  const next = await client(options());
  assert.equal(next.cached, false);
  assert.equal(calls, 2);
});

test("overload on both models has a strict two-call limit", async () => {
  let calls = 0;
  const client = createGeminiClient({
    wait: noWait,
    fetch: async () => {
      calls++;
      return Response.json({ error: { message: "Busy" } }, { status: 503 });
    },
  });
  await assert.rejects(
    client(options()),
    (error) => error instanceof GeminiFailure && error.status === 503,
  );
  assert.equal(calls, 2);
});
