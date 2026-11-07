"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorizeItem } from "@/lib/categorize";
import { saveItemForUser } from "@/lib/save-item";
import { scrapeProductMetadata } from "@/lib/scrape";
import { resolveProductImageUrl } from "@/lib/product-image";

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

export type SavePreviewState = {
  error: string | null;
  ok: boolean;
};

/**
 * Saves an item that's already been previewed on /save — the metadata was
 * scraped and a category was AI-suggested up front so the user could see
 * and edit both before committing, rather than saving instantly and
 * categorizing invisibly afterward (see app/save/page.tsx). Passing all of
 * name/price/image_url/category here means saveItemForUser skips its own
 * scrape *and* its own Gemini call — both already happened once for the
 * preview, so this never re-does either.
 */
export async function saveScrapedItem(
  _prevState: SavePreviewState,
  formData: FormData
): Promise<SavePreviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be logged in to save items." };
  }

  const url = String(formData.get("url") ?? "").trim();
  if (!url) {
    return { ok: false, error: "Missing item URL." };
  }

  const name = String(formData.get("name") ?? "").trim() || null;
  const imageUrl = String(formData.get("image_url") ?? "").trim() || null;
  const rawPrice = String(formData.get("price") ?? "").trim();
  const price = rawPrice ? Number.parseFloat(rawPrice) : null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const result = await saveItemForUser(supabase, user.id, url, {
    name,
    price: Number.isNaN(price) ? null : price,
    image_url: imageUrl,
    category,
    notes,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/closet");
  return { ok: true, error: null };
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

  const resolvedImage = existing?.url ? resolveProductImageUrl(imageUrl, existing.url) : null;
  if (imageUrl && !resolvedImage) {
    return { error: "The photo URL must be a valid HTTP or HTTPS URL." };
  }

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
    .update({ name, image_url: resolvedImage, price, category, ...(tags ? { tags } : {}) })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/closet");
  return { error: null };
}

export async function refreshItemImage(
  id: string
): Promise<UpdateItemState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to fix a photo." };

  const { data: item, error: readError } = await supabase
    .from("items")
    .select("url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (readError || !item) return { error: readError?.message ?? "Item not found." };

  const scraped = await scrapeProductMetadata(item.url);
  if (!scraped.image_url) {
    return {
      error: "This store isn't sharing a product photo. Open the product page and use the Save to Closetful bookmark or extension to capture its main photo, then save it again.",
    };
  }

  const { error } = await supabase.from("items")
    .update({ image_url: scraped.image_url })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/closet");
  return { error: null };
}
