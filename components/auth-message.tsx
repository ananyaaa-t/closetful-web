"use client";

import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <Alert role="status" className="mb-4">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
