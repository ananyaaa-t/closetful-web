import * as cheerio from "cheerio";
import { isAmazonProductUrl, resolveProductImageUrl } from "./product-image";

export type ScrapedProduct = {
  url: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
};

const PRICE_REGEX = /[$£€]\s?(\d{1,3}(?:[,.]\d{3})*(?:\.\d{1,2})?)/;

function parsePrice(raw: unknown): number | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const text = String(raw);
  const match = text.match(PRICE_REGEX) ?? text.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = Number.parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value.trim() || null : null;
}

function products(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 20) return [];
  if (Array.isArray(value)) return value.flatMap((node) => products(node, depth + 1));
  if (!record(value)) return [];
  const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
  return [
    ...(types.includes("Product") ? [value] : []),
    ...products(value["@graph"], depth + 1),
    ...products(value.mainEntity, depth + 1),
  ];
}

function imageUrl(value: unknown, pageUrl: string): string | null {
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const image = imageUrl(candidate, pageUrl);
      if (image) return image;
    }
    return null;
  }
  if (record(value)) return imageUrl(value.contentUrl ?? value.url, pageUrl);
  return resolveProductImageUrl(text(value), pageUrl);
}

export function extractProductMetadata(html: string, url: string): ScrapedProduct {
  const $ = cheerio.load(html);
  const amazon = isAmazonProductUrl(url);
  const pageName =
    text($("#productTitle").text()) ??
    text($('meta[property="og:title"]').attr("content")) ??
    text($("h1").first().text()) ??
    text($("title").text());

  const candidates: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      candidates.push(...products(JSON.parse($(el).text())));
    } catch {
      console.warn("Closetful ignored a malformed product JSON-LD block.");
    }
  });

  const product =
    candidates.find((node) => {
      const name = text(node.name);
      return name && pageName?.toLowerCase().includes(name.toLowerCase());
    }) ?? candidates[0];
  const offers = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
  const schemaPrice = record(offers) ? parsePrice(offers.price ?? offers.lowPrice) : null;

  let mainImage: string | null = null;
  if (amazon) {
    const main = $("#landingImage, #imgBlkFront").first();
    mainImage = imageUrl(main.attr("data-old-hires"), url);
    if (!mainImage && main.attr("data-a-dynamic-image")) {
      try {
        const dynamic: unknown = JSON.parse(main.attr("data-a-dynamic-image")!);
        if (record(dynamic)) mainImage = imageUrl(Object.keys(dynamic), url);
      } catch {
        console.warn("Closetful ignored malformed Amazon image metadata.");
      }
    }
    mainImage ??= imageUrl(main.attr("src"), url);
    // Amazon's robot-check pages and generic previews are not product photos.
    // Never replace a missing main image with an unrelated social preview.
    return {
      url,
      name: text($("#productTitle").text()) ?? text(product?.name),
      price:
        schemaPrice ??
        parsePrice($("#corePrice_feature_div .a-offscreen, #priceblock_ourprice").first().text()),
      image_url: mainImage ?? imageUrl(product?.image, url),
    };
  }

  return {
    url,
    name:
      text(product?.name) ??
      pageName ??
      text($('meta[name="twitter:title"]').attr("content")),
    price:
      schemaPrice ??
      parsePrice($('meta[property="product:price:amount"]').attr("content")) ??
      parsePrice($('meta[property="og:price:amount"]').attr("content")),
    image_url:
      imageUrl(product?.image, url) ??
      imageUrl($('img[itemprop="image"]').first().attr("src"), url) ??
      imageUrl($('meta[property="og:image:secure_url"]').attr("content"), url) ??
      imageUrl($('meta[property="og:image"]').attr("content"), url) ??
      imageUrl($('meta[name="twitter:image"], meta[property="twitter:image"]').attr("content"), url),
  };
}

export async function scrapeProductMetadata(url: string): Promise<ScrapedProduct> {
  const empty: ScrapedProduct = { url, name: null, price: null, image_url: null };
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ClosetfulBot/1.0; +https://closetful.app)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn("Closetful could not retrieve a product page:", res.status);
      return empty;
    }
    const product = extractProductMetadata(await res.text(), res.url || url);
    if (!product.image_url) {
      console.warn("Closetful could not find a product-specific photo.");
    }
    return { ...product, url };
  } catch (error) {
    console.error(
      "Closetful product retrieval failed:",
      error instanceof Error ? error.name : "Unknown error"
    );
    return empty;
  }
}
