"use client";

import { useSearchParams } from "next/navigation";

/** Renders the `?message=` query param as an informational banner —
 * used for the post-signup "check your email" prompt and for graceful
 * fallbacks like Google sign-in not being configured yet. Split into its
 * own component (rather than reading useSearchParams directly in the
 * page) so it can be wrapped in <Suspense>, per Next's guidance for pages
 * that are otherwise static. */
export function AuthMessage() {
  const message = useSearchParams().get("message");
  if (!message) return null;

  return (
    <p className="mb-4 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/70">
      {message}
    </p>
  );
}
