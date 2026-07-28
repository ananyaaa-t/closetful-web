import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles both redirect-back flows that land here:
 *  - The confirmation link Supabase emails after signup (or a magic link):
 *    appends `token_hash` + `type` to the `emailRedirectTo` URL configured
 *    in the signup Server Action.
 *  - The OAuth callback (e.g. "Continue with Google"): Supabase's PKCE
 *    flow appends a `code` param to the `redirectTo` URL configured in
 *    `signInWithGoogle`, which must be exchanged for a session — this is
 *    a different shape than the email OTP flow, so it needs its own
 *    branch rather than falling through to the "invalid link" error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/closet";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?message=Confirmation link is invalid or has expired.`
  );
}
