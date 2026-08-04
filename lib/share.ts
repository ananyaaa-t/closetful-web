import type { SupabaseClient } from "@supabase/supabase-js";

export type ShareProfile = {
  shareToken: string;
  isPublic: boolean;
};

/**
 * Returns the current user's share profile, creating one if it doesn't
 * exist yet. Uses an upsert (not select-then-insert) so this is safe to
 * call concurrently — e.g. two tabs loading /closet at once — without a
 * race where both requests see "no row" and try to insert one, which
 * would otherwise violate the `user_id` primary key on the second insert.
 * The `on conflict` update is a harmless no-op that just returns the
 * existing row.
 */
export async function ensureShareProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string
): Promise<ShareProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: false })
    .select("share_token, is_public")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Couldn't load share settings.");
  }

  return { shareToken: data.share_token, isPublic: data.is_public };
}
