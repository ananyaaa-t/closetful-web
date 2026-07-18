"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorizeItem } from "@/lib/categorize";
import { saveItemForUser } from "@/lib/save-item";

export type SaveItemState = {
  error: string | null;
};

export async function saveItem(
  _prevState: SaveItemState,
  formData: FormData
): Promise<SaveItemState> {
  const rawUrl = String(formData.get("url") ?? "").trim();

  if (!rawUrl) {
    return { error: "Paste a product URL first." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to save items." };
  }

  const result = await saveItemForUser(supabase, user.id, rawUrl);
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/closet");
  return { error: null };
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("items").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/closet");
}

export type UpdateItemState = {
  error: string | null;
};

/**
 * Lets a user fill in details manually when scraping fails or is blocked
 * (common on bot-protected sites like Etsy/Amazon) — a graceful fallback
 * rather than a silently broken save.
 */
export async function updateItem(
  id: string,
  _prevState: UpdateItemState,
  formData: FormData
): Promise<UpdateItemState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const name = String(formData.get("name") ?? "").trim() || null;
  const imageUrl = String(formData.get("image_url") ?? "").trim() || null;
  const rawPrice = String(formData.get("price") ?? "").trim();
  const price = rawPrice ? Number.parseFloat(rawPrice) : null;

  if (rawPrice && Number.isNaN(price)) {
    return { error: "Price must be a number." };
  }

  // If the item didn't get auto-categorized (scrape returned nothing to
  // work with), retry now that the user has supplied a real name.
  const { data: existing } = await supabase
    .from("items")
    .select("url, category")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  let category = existing?.category ?? null;
  let tags: string[] | undefined;
  if (name && !category && existing?.url) {
    const categorization = await categorizeItem({ name, url: existing.url, price });
    if (categorization) {
      category = categorization.category;
      tags = categorization.tags;
    }
  }

  const { error } = await supabase
    .from("items")
    .update({ name, image_url: imageUrl, price, category, ...(tags ? { tags } : {}) })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/closet");
  return { error: null };
}
