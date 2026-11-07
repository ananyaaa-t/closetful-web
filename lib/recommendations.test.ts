import assert from "node:assert/strict";
import { test } from "node:test";
import type { Item } from "@/app/closet/item-card";
import { rankSavedItems, type DecisionPreferences } from "./recommendations";

const items: Item[] = [
  { id: "coat", name: "Coat", url: "https://example.com/coat", image_url: null, price: 180, category: "clothing", tags: ["neutral", "work"], notes: null },
  { id: "sweater", name: "Sweater", url: "https://example.com/sweater", image_url: null, price: 65, category: "clothing", tags: ["NEUTRAL", "everyday"], notes: null },
  { id: "bag", name: "Bag", url: "https://example.com/bag", image_url: null, price: 85, category: "bags", tags: ["work"], notes: null },
  { id: "unknown", name: "Unknown", url: "https://example.com/unknown", image_url: null, price: null, category: "clothing", tags: ["neutral", "work"], notes: null },
];
const defaults: DecisionPreferences = { category: "All", maxPrice: null, priorities: [], sort: "match" };

test("ranks only saved items by explicit priorities and explains matches without inventing quality", () => {
  const result = rankSavedItems(items, { ...defaults, priorities: ["neutral", "WORK", "work"] });
  assert.deepEqual(result[0].matchedPriorities, ["neutral", "work"]);
  assert.equal(result[0].item.id, "coat");
  assert.deepEqual(result[0].reasons, ['Matches "neutral"', 'Matches "work"']);
  assert.equal(result.find((entry) => entry.item.id === "sweater")?.matchedPriorities.length, 1);
});

test("category and budget are hard constraints; unknown prices are not treated as affordable", () => {
  const result = rankSavedItems(items, { ...defaults, category: "clothing", maxPrice: 100 });
  assert.deepEqual(result.map((entry) => entry.item.id), ["sweater"]);
  assert.deepEqual(result[0].reasons, ["$35.00 below your limit"]);
});

test("zero-price items remain eligible for a zero budget; prices exactly at the limit qualify", () => {
  const free = { ...items[0], id: "free", price: 0 };
  assert.deepEqual(rankSavedItems([...items, free], { ...defaults, maxPrice: 0 }).map((entry) => entry.item.id), ["free"]);
  assert.ok(rankSavedItems(items, { ...defaults, maxPrice: 65 }).some((entry) => entry.item.id === "sweater"));
});

test("lowest-price sorting puts unknown prices last; no-priority ranking preserves saved order", () => {
  assert.deepEqual(rankSavedItems(items, { ...defaults, sort: "price" }).map((entry) => entry.item.id), ["sweater", "bag", "coat", "unknown"]);
  assert.deepEqual(rankSavedItems(items, defaults).map((entry) => entry.item.id), items.map((item) => item.id));
  assert.equal(rankSavedItems([], defaults).length, 0);
});
