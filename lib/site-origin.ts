import { headers } from "next/headers";

/**
 * Resolves the site's own origin for building redirect URLs (email
 * confirmation links, OAuth callbacks). Prefers the `host`/
 * `x-forwarded-proto` request headers — which Vercel populates correctly
 * for every deployment (production, preview, and local dev) — over a
 * manually-set `NEXT_PUBLIC_SITE_URL` env var, since that var is easy to
 * forget to configure per-environment and silently falls back to
 * localhost if unset (this previously sent production users back to
 * http://localhost:3000 after signing in with Google).
 */
export async function getSiteOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host");
  if (host) {
    const proto = headerList.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
