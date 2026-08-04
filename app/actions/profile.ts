"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureShareProfile } from "@/lib/share";

export type ShareActionState = {
  error: string | null;
};

/** Turns the "Share Closet" link on or off for the current user. */
export async function setClosetSharing(
  _prevState: ShareActionState,
  formData: FormData
): Promise<ShareActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const isPublic = formData.get("isPublic") === "true";

  // Ensure a profile row exists before flipping its flag — a user who's
  // never opened the share panel before won't have one yet.
  await ensureShareProfile(supabase, user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ is_public: isPublic })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/closet");
  return { error: null };
}

/**
 * Rotates the share token, invalidating any previously-shared link. Useful
 * if a user shared a link somewhere they no longer want it to work, but
 * still wants sharing to stay on for a fresh link.
 */
export async function regenerateShareLink(): Promise<ShareActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  await ensureShareProfile(supabase, user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ share_token: crypto.randomUUID() })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/closet");
  return { error: null };
}
