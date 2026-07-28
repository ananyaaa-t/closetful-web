"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error: string | null;
};

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Where Supabase redirects after the user clicks the confirmation
      // link in their email.
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/confirm`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=Check your email to confirm your account.");
}

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/closet");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Starts the Supabase Google OAuth flow and redirects the browser to
 * Google's consent screen. Requires the Google provider to be enabled
 * (with a client ID/secret) in the Supabase dashboard under
 * Authentication > Providers — this action only wires up the client side.
 *
 * `signInWithOAuth` builds the authorize URL locally and does NOT
 * validate against Supabase first, so if the provider isn't enabled it
 * still returns a "valid" URL — one that then 400s with a raw JSON error
 * ("Unsupported provider: provider is not enabled") once the browser
 * lands on it. We check the project's public auth settings first so we
 * can show a friendly message instead of redirecting into that dead end.
 */
export async function signInWithGoogle() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // `redirect()` throws internally (NEXT_REDIRECT), so it must never be
  // called from inside this try block — a catch here would swallow it.
  let googleEnabled = false;
  try {
    const settingsRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      cache: "no-store",
    });
    const settings = await settingsRes.json();
    googleEnabled = Boolean(settings?.external?.google);
  } catch {
    redirect("/login?message=Couldn't reach Google sign-in. Try again shortly.");
  }

  if (!googleEnabled) {
    // Note: this string is passed through the `x-action-redirect` HTTP
    // header for server action redirects, which must be ASCII-safe — an
    // em dash here previously caused a 500 ("Invalid character in header
    // content"). Stick to plain ASCII punctuation in any redirect message.
    redirect(
      "/login?message=Google sign-in isn't set up yet, use email/password for now."
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/confirm`,
    },
  });

  if (error || !data.url) {
    redirect("/login?message=Google sign-in is not available right now.");
  }

  redirect(data.url);
}
