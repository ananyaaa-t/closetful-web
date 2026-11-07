import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { Item } from "@/app/closet/item-card";
import { generateSavedItemPicks, validateGeneratedSelection } from "./generative-retrieval";

const items: Item[] = [
  { id: "saved-sweater", url: "https://shop.example/private-tracking", name: "Cream knit sweater", price: 65, image_url: null, category: "clothing", tags: ["neutral", "everyday"], notes: "Private note fixture" },
  { id: "saved-coat", url: "https://shop.example/coat", name: "Coat", price: 180, image_url: null, category: "clothing", tags: ["work"], notes: null },
  { id: "unknown-price", url: "https://shop.example/bag", name: "Bag", price: null, image_url: null, category: "bags", tags: ["neutral"], notes: null },
];
const constraints = { category: "All", maxPrice: null, priorities: [] };

test("generated catalog IDs map only to real saved items with grounded tags and a parsed budget", () => {
  const selection = validateGeneratedSelection({
    picks: ["item_1"],
    max_price: 100, category: "clothing",
  }, items, constraints);
  assert.deepEqual(selection, {
    picks: [{ itemId: "saved-sweater", savedTags: ["neutral", "everyday"] }],
    maxPrice: 100, category: "clothing", considered: 3,
  });
});

test("unknown IDs, duplicate picks and generated product facts are rejected", () => {
  for (const picks of [
    ["invented-product"],
    ["item_1", "item_1"],
    [{ id: "item_1", matched_tags: ["waterproof"] }],
  ]) {
    assert.throws(() => validateGeneratedSelection({ picks, max_price: null, category: "All" }, items, constraints));
  }
});

test("the model cannot relax hard budgets or make unknown-price pieces affordable", () => {
  assert.throws(() => validateGeneratedSelection({
    picks: ["item_2"], max_price: 500, category: "All",
  }, items, { ...constraints, maxPrice: 100 }), /budget/);
  assert.throws(() => validateGeneratedSelection({
    picks: ["item_3"], max_price: 100, category: "All",
  }, items, constraints), /budget/);
  assert.throws(() => validateGeneratedSelection({
    picks: ["item_3"], max_price: null, category: "All",
  }, items, { ...constraints, category: "clothing" }), /category/);
});

test("no matches stays empty rather than returning unrelated fallback picks", () => {
  assert.deepEqual(validateGeneratedSelection({ picks: [], max_price: 0, category: "All" }, items, constraints).picks, []);
});

test("provider request uses constrained temporary IDs and excludes private notes, URLs and real database IDs", async () => {
  const key = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-only-not-a-key";
  const fetchMock = mock.method(globalThis, "fetch", async (_url: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    const payload = JSON.parse(body.contents[0].parts[0].text);
    assert.deepEqual(payload.catalog[0], {
      id: "item_1", name: "Cream knit sweater", price: 65,
      category: "clothing", tags: ["neutral", "everyday"],
    });
    assert.deepEqual(body.generationConfig.responseSchema.properties.picks.items.enum, ["item_1", "item_2", "item_3"]);
    const request = String(init?.body);
    assert.ok(!request.includes("Private note fixture"));
    assert.ok(!request.includes("private-tracking"));
    assert.ok(!request.includes("saved-sweater"));
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({
      picks: ["item_1"], max_price: 100, category: "All",
    }) }] } }] });
  });
  try {
    const result = await generateSavedItemPicks("Neutral pieces under $100", items, constraints);
    assert.ok(result.ok);
    assert.equal(result.selection.picks[0].itemId, "saved-sweater");
  } finally {
    fetchMock.mock.restore();
    if (key === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = key;
  }
});

test("a provider failure is explicit and cannot masquerade as successful retrieval", async () => {
  const key = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-only-not-a-key";
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(null, { status: 403 }));
  try {
    const result = await generateSavedItemPicks("Pick a sweater", items, constraints);
    assert.equal(result.ok, false);
    assert.ok(!("selection" in result));
  } finally {
    fetchMock.mock.restore();
    if (key === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = key;
  }
});
