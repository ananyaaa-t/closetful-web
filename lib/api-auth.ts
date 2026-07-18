import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Resolves the Supabase client + authenticated user for an API route,
 * supporting two auth paths:
 *  - Session cookie (the web app's own requests, via @supabase/ssr)
 *  - `Authorization: Bearer <access_token>` (the Chrome extension, which
 *    runs on a different origin and can't share the web app's cookies)
 *
 * The bearer-token client is created with the token attached to every
 * request header, so Postgres RLS policies (`auth.uid() = user_id`) still
 * evaluate correctly for that user — no service-role key needed.
 */
export async function getAuthedClientAndUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (token) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    return { supabase, user };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Shared CORS headers so the Chrome extension (a different origin) can
 * call this API. Only bearer-token auth is accepted cross-origin — cookies
 * aren't sent/relied upon here, so a wildcard origin is safe. */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
