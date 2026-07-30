/**
 * Lightweight in-memory rate limiter for the save pipeline (each save
 * triggers an external scrape + a paid Gemini API call, so unbounded
 * saves are both an abuse vector and a real cost risk).
 *
 * This is a best-effort, single-instance limiter — it resets on
 * redeploy/cold start and isn't shared across serverless instances, so it
 * won't perfectly enforce the limit under heavy concurrent load. That's an
 * acceptable tradeoff for a personal-scale project without adding a paid
 * external dependency (e.g. Upstash/Vercel KV); revisit with a shared
 * store if abuse becomes a real problem.
 */

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

const hits = new Map<string, number[]>();

/** Returns true if `key` (typically a user id) is currently rate-limited. */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter(
    (t) => now - t < WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}
