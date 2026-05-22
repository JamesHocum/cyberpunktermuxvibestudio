// Shared provider fallback chain for AI gateway calls.
// Tries providers in order; falls through on 429 / 402 / 5xx / network error.
// Returns the first 2xx streaming Response, plus metadata describing which
// hop succeeded so the caller can log usage and emit headers.

export interface ProviderAttempt {
  /** Stable id used in logs and the X-Provider response header */
  id: string;
  /** Model identifier sent to the upstream provider (post-prefix-strip if needed) */
  model: string;
  /** Full endpoint URL */
  endpoint: string;
  /** Authorization header value, e.g. `Bearer …` */
  authHeader: string;
  /** Source label for ai_usage_log: 'managed' | 'byok' | 'fallback' */
  source: "managed" | "byok" | "fallback";
}

export interface ChainResult {
  response: Response;
  used: ProviderAttempt;
  hops: Array<{ id: string; model: string; status: number; ok: boolean; reason?: string }>;
}

const FALLBACK_STATUSES = new Set([429, 402, 500, 502, 503, 504]);

export async function tryProviderChain(
  attempts: ProviderAttempt[],
  body: Record<string, unknown>,
): Promise<ChainResult> {
  const hops: ChainResult["hops"] = [];
  let lastErr: { status: number; text: string } | null = null;

  for (const attempt of attempts) {
    const payload = { ...body, model: attempt.model, stream: true };
    try {
      const res = await fetch(attempt.endpoint, {
        method: "POST",
        headers: {
          Authorization: attempt.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        hops.push({ id: attempt.id, model: attempt.model, status: res.status, ok: true });
        return { response: res, used: attempt, hops };
      }

      // Read body for log; only fall through on retryable statuses
      const text = await res.text().catch(() => "");
      hops.push({ id: attempt.id, model: attempt.model, status: res.status, ok: false, reason: text.slice(0, 120) });
      lastErr = { status: res.status, text };

      if (!FALLBACK_STATUSES.has(res.status)) {
        // Non-retryable error — break and surface to caller
        break;
      }
      console.log(`[providerChain] ${attempt.id} returned ${res.status}, trying next`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      hops.push({ id: attempt.id, model: attempt.model, status: 0, ok: false, reason: msg });
      lastErr = { status: 0, text: msg };
      console.log(`[providerChain] ${attempt.id} network error: ${msg}`);
    }
  }

  const err = new Error(`All providers failed (last status ${lastErr?.status ?? "n/a"})`) as Error & {
    status: number;
    hops: ChainResult["hops"];
  };
  err.status = lastErr?.status ?? 502;
  err.hops = hops;
  throw err;
}

export function lovableAttempt(model: string, apiKey: string, id = "lovable"): ProviderAttempt {
  return {
    id,
    model,
    endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
    authHeader: `Bearer ${apiKey}`,
    source: "managed",
  };
}

export function openaiByokAttempt(model: string, apiKey: string): ProviderAttempt {
  return {
    id: "openai-byok",
    model: model.replace(/^openai\//, ""),
    endpoint: "https://api.openai.com/v1/chat/completions",
    authHeader: `Bearer ${apiKey}`,
    source: "byok",
  };
}
