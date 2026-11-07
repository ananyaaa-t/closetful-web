import assert from "node:assert/strict";
import { test } from "node:test";
import { extractProductMetadata, scrapeProductMetadata } from "./scrape";
import { resolveProductImageUrl } from "./product-image";

test("Product JSON-LD outranks a generic page preview, including a nested graph and ImageObject", () => {
  const result = extractProductMetadata(`
    <meta property="og:image" content="https://shop.example/toolboxes.jpg">
    <meta property="og:title" content="Coffee syrup bottles">
    <script type="application/ld+json">${JSON.stringify({
      "@graph": [
        { "@type": "Organization", offers: { price: 999 } },
        { "@type": ["Product"], name: "Coffee syrup bottles",
          image: [{ "@type": "ImageObject", contentUrl: "/bottles.jpg" }],
          offers: [{ price: 24.5 }] },
      ],
    })}</script>`, "https://shop.example/products/bottles");
  assert.equal(result.name, "Coffee syrup bottles");
  assert.equal(result.image_url, "https://shop.example/bottles.jpg");
  assert.equal(result.price, 24.5);
});

test("Amazon uses its main product photo, not an unrelated social preview", () => {
  const result = extractProductMetadata(`
    <span id="productTitle">Coffee syrup dispenser bottles</span>
    <meta property="og:image" content="https://images.example/toolboxes.jpg">
    <img id="landingImage" src="https://images.example/thumbnail.jpg"
      data-old-hires="https://images.example/bottles.jpg">
    <div id="corePrice_feature_div"><span class="a-offscreen">$24.00</span></div>
  `, "https://www.amazon.com/dp/B0BZ4FHFV4");
  assert.equal(result.image_url, "https://images.example/bottles.jpg");
  assert.equal(result.name, "Coffee syrup dispenser bottles");
  assert.equal(result.price, 24);
});

test("Amazon dynamic image data works without a high-resolution attribute", () => {
  const result = extractProductMetadata(`
    <span id="productTitle">Bottles</span>
    <img id="landingImage" src="data:image/gif;base64,empty"
      data-a-dynamic-image='{"https://images.example/bottles.jpg":[1000,1000]}'>
  `, "https://www.amazon.com/dp/B0BZ4FHFV4");
  assert.equal(result.image_url, "https://images.example/bottles.jpg");
});

test("Amazon robot-check responses cannot turn generic photos into product photos", () => {
  const result = extractProductMetadata(`
    <title>Amazon.com</title><h1>Robot check</h1>
    <meta property="og:image" content="https://images.example/toolboxes.jpg">
  `, "https://www.amazon.com/dp/B0BZ4FHFV4");
  assert.equal(result.image_url, null);
  assert.equal(result.name, null);
});

test("relative and protocol-relative photos are resolved; unsupported URLs are rejected", () => {
  assert.equal(resolveProductImageUrl("../bottle.jpg", "https://shop.example/products/item"), "https://shop.example/bottle.jpg");
  assert.equal(resolveProductImageUrl("//cdn.example/bottle.jpg", "https://shop.example/item"), "https://cdn.example/bottle.jpg");
  assert.equal(resolveProductImageUrl("javascript:alert(1)", "https://shop.example"), null);
  assert.equal(resolveProductImageUrl("https://user:password@images.example/photo.jpg", "https://shop.example"), null);
  assert.equal(resolveProductImageUrl(" ", "https://shop.example"), null);
});

test("a redirected product page resolves its photo against the final location but preserves the saved URL", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    const response = new Response('<meta property="og:image" content="../bottle.jpg">');
    Object.defineProperty(response, "url", { value: "https://store.example/products/item" });
    return response;
  };
  try {
    const result = await scrapeProductMetadata("https://short.example/item");
    assert.equal(result.url, "https://short.example/item");
    assert.equal(result.image_url, "https://store.example/bottle.jpg");
  } finally {
    globalThis.fetch = original;
  }
});
