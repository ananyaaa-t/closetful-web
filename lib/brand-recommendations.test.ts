import assert from "node:assert/strict";
import { test } from "node:test";
import { recommendBrands, shoppingDomainFromUrl, type ShoppingVisit } from "./brand-recommendations";

function visit(domain: string, index = 0): ShoppingVisit {
  return { id: String(index), domain, created_at: "2026-11-11T00:00:00Z" };
}

test("saved pieces produce a mixture of familiar shops and relevant new brands with grounded reasons", () => {
  const result = recommendBrands([
    { url: "https://www.nike.com/shoe", category: "shoes", tags: ["running"] },
    { url: "https://www.nike.com/second-shoe", category: "shoes", tags: ["everyday"] },
  ], []);
  assert.equal(result.personalized, true);
  assert.equal(result.brands[0].name, "Nike");
  assert.equal(result.brands[0].reason, "2 pieces saved from this shop.");
  assert.ok(result.brands.some((brand) => brand.name === "Adidas" && brand.kind === "discover"));
  assert.ok(!result.brands.some((brand) => brand.name === "Nike" && brand.kind === "discover"));
  assert.equal(new Set(result.brands.map((brand) => brand.domain)).size, result.brands.length);
});

test("generic style tags do not recommend unrelated shopping categories", () => {
  const result = recommendBrands([
    { url: "https://theordinary.com/serum", category: "skincare", tags: ["everyday"] },
  ], []);
  assert.ok(result.brands.some((brand) => brand.name === "Sephora"));
  assert.ok(!result.brands.some((brand) => ["Nike", "IKEA", "Bookshop"].includes(brand.name)));
});

test("in-app clicks personalize an otherwise empty closet, with repeated-click influence capped", () => {
  const result = recommendBrands([], [visit("nike.com")]);
  assert.equal(result.personalized, true);
  assert.equal(result.brands[0].name, "Nike");
  assert.match(result.brands[0].reason, /opened this shop/);
  assert.ok(result.brands.some((brand) => brand.name === "Adidas" && brand.kind === "discover"));
  const three = Array.from({ length: 3 }, (_, index) => visit("nike.com", index));
  const thirty = Array.from({ length: 30 }, (_, index) => visit("nike.com", index));
  assert.deepEqual(recommendBrands([], three), recommendBrands([], thirty));
});

test("a newly explored shop joins the familiar mix alongside existing saved brands", () => {
  const result = recommendBrands([
    { url: "https://nike.com/one", category: "shoes", tags: ["running"] },
    { url: "https://nike.com/two", category: "shoes", tags: ["running"] },
    { url: "https://aritzia.com/sweater", category: "clothing", tags: ["neutral"] },
    { url: "https://baggu.com/tote", category: "bags", tags: ["everyday"] },
  ], [visit("adidas.com")]);
  assert.ok(result.brands.some((brand) => brand.name === "Adidas" && brand.kind === "familiar"));
  assert.ok(result.brands.some((brand) => brand.kind === "discover"));
});

test("a fresh closet is honestly labeled as a starter selection, not personalized history", () => {
  const result = recommendBrands([], []);
  assert.equal(result.personalized, false);
  assert.ok(result.brands.length > 0);
  assert.ok(result.brands.every((brand) => brand.kind === "starter" && /place to start/i.test(brand.reason)));
  assert.equal(recommendBrands([], [visit("nike.com/not-a-domain")]).personalized, false);
});

test("unknown shops remain real familiar links, and saved-item counts are not capped", () => {
  const result = recommendBrands([
    { url: "https://independent-books.example/book", category: "books", tags: [] },
  ], []);
  assert.equal(result.brands[0].url, "https://independent-books.example");
  assert.ok(result.brands.some((brand) => brand.name === "Bookshop" && brand.kind === "discover"));
  const many = Array.from({ length: 25 }, (_, index) => ({
    url: `https://nike.com/shoe-${index}`, category: "shoes", tags: [],
  }));
  assert.match(recommendBrands(many, []).brands[0].reason, /^25 pieces/);
});

test("shop identity merges known subdomains and aliases without confusing lookalike domains", () => {
  assert.equal(shoppingDomainFromUrl("https://shop.nike.com/product?color=red"), "nike.com");
  assert.equal(shoppingDomainFromUrl("https://toteme-studio.com/products/coat"), "toteme.com");
  assert.equal(shoppingDomainFromUrl("https://nike.com.another.example/product"), "nike.com.another.example");
  assert.equal(shoppingDomainFromUrl("javascript:alert(1)"), null);
  assert.equal(shoppingDomainFromUrl("http://127.0.0.1/product"), null);
  assert.equal(shoppingDomainFromUrl("http://localhost/product"), null);
});
