import * as cheerio from "cheerio";

export type ScrapedProduct = {
  url: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
};

const PRICE_REGEX = /[$£€]\s?(\d{1,3}(?:[,.]\d{3})*(?:\.\d{1,2})?)/;

function parsePrice(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const match = raw.match(PRICE_REGEX) ?? raw.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const numeric = match[1].replace(/,/g, "");
  const value = Number.parseFloat(numeric);
  return Number.isFinite(value) ? value : null;
}

/**
 * Extracts product name/price/image from a page's meta tags and JSON-LD
 * Product schema. Falls back to the Microlink API when a site doesn't
 * expose enough metadata for raw parsing to work reliably.
 */
export async function scrapeProductMetadata(
  url: string
): Promise<ScrapedProduct> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ClosetfulBot/1.0; +https://closetful.app)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return microlinkFallback(url);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const name =
      $('meta[property="og:title"]').attr("content") ??
      $('meta[name="twitter:title"]').attr("content") ??
      $("title").text() ??
      null;

    const image_url =
      $('meta[property="og:image"]').attr("content") ??
      $('meta[name="twitter:image"]').attr("content") ??
      null;

    let price: number | null =
      parsePrice($('meta[property="product:price:amount"]').attr("content")) ??
      parsePrice($('meta[property="og:price:amount"]').attr("content"));

    if (price === null) {
      // Look for a Product JSON-LD block, which most e-commerce sites embed
      // for SEO and commonly includes an accurate `offers.price`.
      $('script[type="application/ld+json"]').each((_, el) => {
        if (price !== null) return;
        try {
          const json = JSON.parse($(el).contents().text());
          const nodes = Array.isArray(json) ? json : [json];
          for (const node of nodes) {
            const offers = node?.offers ?? node?.["@graph"]?.[0]?.offers;
            const candidate = offers?.price ?? offers?.[0]?.price;
            if (candidate) {
              price = parsePrice(String(candidate));
              break;
            }
          }
        } catch {
          // Ignore malformed JSON-LD blocks.
        }
      });
    }

    const result: ScrapedProduct = {
      url,
      name: name?.trim() || null,
      price,
      image_url: image_url ?? null,
    };

    // If raw parsing came up mostly empty, prefer the Microlink fallback.
    if (!result.name && !result.image_url) {
      return microlinkFallback(url);
    }

    return result;
  } catch {
    return microlinkFallback(url);
  }
}

async function microlinkFallback(url: string): Promise<ScrapedProduct> {
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) {
      return { url, name: null, price: null, image_url: null };
    }
    const json = await res.json();
    const data = json?.data ?? {};
    return {
      url,
      name: data.title ?? null,
      price: parsePrice(data.price ? String(data.price) : null),
      image_url: data.image?.url ?? null,
    };
  } catch {
    return { url, name: null, price: null, image_url: null };
  }
}
