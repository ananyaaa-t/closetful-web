import type { SupabaseClient } from "@supabase/supabase-js";
import { scrapeProductMetadata, type ScrapedProduct } from "@/lib/scrape";
import { categorizeItem } from "@/lib/categorize";
import { isRateLimited } from "@/lib/rate-limit";

export type SaveItemResult =
  | { ok: true; item: Record<string, unknown> }
  | { ok: false; error: string };

export type ProvidedMetadata = {
  name?: string | null;
  price?: number | null;
  image_url?: string | null;
};

/**
 * Shared save pipeline (validate URL -> scrape metadata -> AI categorize ->
 * insert) used by the paste-URL form action, the /api/items route, the
 * bookmarklet's /save page, and the Chrome extension.
 *
 * `providedMetadata` lets a caller skip server-side scraping when it
 * already has accurate data — critically, this is how the Chrome extension
 * bypasses bot-protected sites (Etsy/Sephora/Amazon): its content script
 * reads name/image/price directly out of the page's DOM in the user's own
 * browser, where there's no separate server-to-server request for
 * anti-bot systems like Akamai/DataDome to block.
 */
export async function saveItemForUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  rawUrl: string,
  providedMetadata?: ProvidedMetadata
): Promise<SaveItemResult> {
  // Rate-limited per user (not per IP) since every entry point into this
  // function is already authenticated, and each call costs a scrape +
  // Gemini call — see lib/rate-limit.ts for why this is a soft, in-memory
  // limit rather than a hard guarantee.
  if (isRateLimited(userId)) {
    return {
      ok: false,
      error: "You're saving items too quickly. Please wait a few minutes and try again.",
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Unsupported protocol");
    }
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  const hasProvidedMetadata =
    providedMetadata &&
    (providedMetadata.name || providedMetadata.image_url || providedMetadata.price);

  const metadata: ScrapedProduct = hasProvidedMetadata
    ? {
        url: parsed.toString(),
        name: providedMetadata.name ?? null,
        price: providedMetadata.price ?? null,
        image_url: providedMetadata.image_url ?? null,
      }
    : await scrapeProductMetadata(parsed.toString());

  const categorization = await categorizeItem({
    name: metadata.name,
    url: metadata.url,
    price: metadata.price,
  });

  // If this URL was already saved (e.g. the extension re-saving an item
  // that was originally scraped server-side and got blocked by a site's
  // bot protection), update the existing row with any newly-found data
  // instead of creating a duplicate. New non-null values win; nulls never
  // overwrite existing good data.
  const { data: existing } = await supabase
    .from("items")
    .select("id, name, price, image_url, category, tags")
    .eq("user_id", userId)
    .eq("url", metadata.url)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("items")
      .update({
        name: metadata.name ?? existing.name,
        price: metadata.price ?? existing.price,
        image_url: metadata.image_url ?? existing.image_url,
        category: categorization?.category ?? existing.category,
        tags: categorization?.tags ?? existing.tags,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, item: data };
  }

  const { data, error } = await supabase
    .from("items")
    .insert({
      user_id: userId,
      url: metadata.url,
      name: metadata.name,
      price: metadata.price,
      image_url: metadata.image_url,
      category: categorization?.category ?? null,
      tags: categorization?.tags ?? [],
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, item: data };
}
