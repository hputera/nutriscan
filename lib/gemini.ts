import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

export const FALLBACK_MODEL = "gemini-3.5-flash-lite";
const CACHE_TTL = 5 * 60_000;
const COOLDOWN = 2 * 60_000;
const MAX_CACHE = 64;
const TRANSIENT_STATUS = new Set([500, 502, 503, 504]);
export class GeminiFailure extends Error {
  status: number;
  kind: "provider" | "timeout" | "network" | "invalid-response";
  retryable: boolean;
  constructor(
    message: string,
    status: number,
    kind: GeminiFailure["kind"],
    retryable: boolean,
  ) {
    super(message);
    this.name = "GeminiFailure";
    this.status = status;
    this.kind = kind;
    this.retryable = retryable;
  }
}
export type ScanResult = {
  text: string;
  model: string;
  cached: boolean;
  attempts: number;
};
type ScanOptions = {
  apiKey: string;
  model: string;
  prompt: string;
  schema: unknown;
  image: Uint8Array;
  mimeType: string;
  signal?: AbortSignal;
  validate: (text: string) => boolean;
};
type Dependencies = {
  fetch?: typeof fetch;
  now?: () => number;
  wait?: (ms: number, signal?: AbortSignal) => Promise<void>;
  primaryTimeoutMs?: number;
  fallbackTimeoutMs?: number;
};
type ProviderReply = {
  candidates?: {
    finishReason?: string;
    content?: { parts?: { text?: string; thought?: boolean }[] };
  }[];
};
function responseText(raw: ProviderReply): string {
  const candidate = raw.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== "STOP") return "";
  return (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("");
}
export function createGeminiClient(dependencies: Dependencies = {}) {
  const send = dependencies.fetch ?? fetch;
  const now = dependencies.now ?? Date.now;
  const wait =
    dependencies.wait ??
    (async (ms, signal) => {
      await delay(ms, undefined, { signal });
    });
  const cache = new Map<string, { until: number; result: ScanResult }>();
  const cooldown = new Map<string, number>();
  return async function scan(options: ScanOptions): Promise<ScanResult> {
    options.signal?.throwIfAborted();
    for (const [key, entry] of cache)
      if (entry.until <= now()) cache.delete(key);
    for (const [key, until] of cooldown)
      if (until <= now()) cooldown.delete(key);
    // Keep hashes and validated results only; never store photos or credentials.
    const account = createHash("sha256").update(options.apiKey).digest("hex");
    const key = createHash("sha256")
      .update(account)
      .update(options.model)
      .update(options.prompt)
      .update(JSON.stringify(options.schema))
      .update(options.mimeType)
      .update(options.image)
      .digest("hex");
    const saved = cache.get(key);
    if (saved) return { ...saved.result, cached: true, attempts: 0 };
    const primary = options.model.replace(/^models\//, "");
    const coolingDown = (cooldown.get(account + primary) ?? 0) > now();
    const models =
      primary === FALLBACK_MODEL || coolingDown
        ? [FALLBACK_MODEL]
        : [primary, FALLBACK_MODEL];
    let lastError: GeminiFailure | undefined;
    for (let attempt = 0; attempt < models.length; attempt++) {
      options.signal?.throwIfAborted();
      const model = models[attempt];
      if (attempt) await wait(700, options.signal);
      const timeout = AbortSignal.timeout(
        model === FALLBACK_MODEL
          ? (dependencies.fallbackTimeoutMs ?? 35_000)
          : (dependencies.primaryTimeoutMs ?? 25_000),
      );
      const signal = options.signal
        ? AbortSignal.any([options.signal, timeout])
        : timeout;
      try {
        const response = await send(
          "https://generativelanguage.googleapis.com/v1beta/models/" +
            encodeURIComponent(model) +
            ":generateContent",
          {
            method: "POST",
            signal,
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": options.apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: options.prompt },
                    {
                      inlineData: {
                        data: Buffer.from(options.image).toString("base64"),
                        mimeType: options.mimeType,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                responseJsonSchema: options.schema,
                maxOutputTokens: 2048,
              },
            }),
          },
        );
        if (!response.ok) {
          const raw = await response.json().catch(() => null);
          const reason =
            typeof raw?.error?.message === "string"
              ? raw.error.message
              : "Gemini request rejected";
          const clean = reason
            .split(options.apiKey)
            .join("[REDACTED]")
            .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED]")
            .slice(0, 500);
          // Retry only transient service failures; not exhausted quotas or configuration errors.
          throw new GeminiFailure(
            clean,
            response.status,
            "provider",
            TRANSIENT_STATUS.has(response.status),
          );
        }
        const text = responseText(await response.json());
        if (!text || !options.validate(text))
          throw new GeminiFailure(
            "Gemini returned an incomplete or invalid result",
            502,
            "invalid-response",
            false,
          );
        const result: ScanResult = {
          text,
          model,
          cached: false,
          attempts: attempt + 1,
        };
        if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
        cache.set(key, { until: now() + CACHE_TTL, result });
        return result;
      } catch (error) {
        if (options.signal?.aborted) throw options.signal.reason ?? error;
        lastError =
          error instanceof GeminiFailure
            ? error
            : timeout.aborted
              ? new GeminiFailure(
                  "Gemini request timed out",
                  504,
                  "timeout",
                  true,
                )
              : new GeminiFailure(
                  "Connection to Gemini failed",
                  502,
                  "network",
                  true,
                );
        if (!lastError.retryable) throw lastError;
        if (model === primary && primary !== FALLBACK_MODEL)
          cooldown.set(account + primary, now() + COOLDOWN);
        if (attempt === models.length - 1) throw lastError;
      }
    }
    throw (
      lastError ??
      new GeminiFailure("Gemini unavailable", 503, "provider", false)
    );
  };
}
export const scanWithGemini = createGeminiClient();
