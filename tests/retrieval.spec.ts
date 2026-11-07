import { expect, test } from "@playwright/test";

test("generative picking creates a grounded shortlist, applies its price limit and keeps photos", async ({ page }) => {
  await page.route("**/api/retrieve", async (route) => {
    const request = route.request().postDataJSON();
    expect(request.mode).toBe("demo");
    expect(request.itemIds).toContain("sweater");
    expect(request).not.toHaveProperty("notes");
    await route.fulfill({ json: { selection: {
      picks: [{ itemId: "sweater", savedTags: ["neutral", "everyday"] }],
      maxPrice: 100, category: "clothing", considered: 6,
    } } });
  });
  await page.goto("/demo");
  await page.getByRole("button", { name: "Help me choose", exact: true }).click();
  await page.getByLabel("Describe what you're deciding").fill("Pick neutral everyday pieces under $100");
  await page.getByRole("button", { name: "Pick from my closet", exact: true }).click();
  await expect(page.getByText("1 AI-picked piece added to your shortlist.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Maximum price per item ($)")).toHaveValue("100");
  const desk = page.getByRole("region", { name: "Help me choose", exact: true });
  await expect(desk.getByRole("article")).toHaveCount(1);
  await expect(desk.getByRole("article").first()).toHaveAccessibleName("Cream knit sweater");
  await expect(page.getByRole("region", { name: "Compare shortlist" })).toBeVisible();
  await expect(desk.getByRole("article").getByRole("img")).toBeVisible();
  await page.getByRole("button", { name: "Back to all pieces" }).click();
  await expect(desk.getByRole("article")).toHaveCount(1);
  await page.getByLabel("Maximum price per item ($)").fill("");
  await expect(desk.getByRole("article")).toHaveCount(3);
});

test("AI errors are visible and do not produce an invented shortlist", async ({ page }) => {
  await page.route("**/api/retrieve", (route) => route.fulfill({
    status: 503, json: { error: "AI retrieval is temporarily unavailable. Retry or use the manual filters." },
  }));
  await page.goto("/demo");
  await page.getByRole("button", { name: "Help me choose", exact: true }).click();
  await page.getByLabel("Describe what you're deciding").fill("Pick a sweater");
  await page.getByRole("button", { name: "Pick from my closet", exact: true }).click();
  await expect(page.getByRole("region", { name: "Help me choose", exact: true }).getByRole("alert")).toContainText("AI retrieval is temporarily unavailable");
  await expect(page.getByRole("region", { name: "Compare shortlist" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Help me choose", exact: true }).getByRole("article")).toHaveCount(6);
});

test("an empty AI result stays empty instead of falling back to unrelated products", async ({ page }) => {
  await page.route("**/api/retrieve", (route) => route.fulfill({ json: {
    selection: { picks: [], category: "All", maxPrice: null, considered: 6 },
  } }));
  await page.goto("/demo");
  await page.getByRole("button", { name: "Help me choose", exact: true }).click();
  await page.getByLabel("Describe what you're deciding").fill("A purple kayak");
  await page.getByRole("button", { name: "Pick from my closet", exact: true }).click();
  await expect(page.getByText("No saved pieces match this request. Try another description.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Help me choose", exact: true }).getByRole("article")).toHaveCount(0);
});

test("retrieval API enforces authentication, demo catalog IDs and authoritative prices", async ({ request }) => {
  const body = { query: "Pick a coat", itemIds: ["coat"], maxPrice: null, category: "All", priorities: [] };
  const unauthorized = await request.post("/api/retrieve", { data: { ...body, mode: "closet" } });
  expect(unauthorized.status()).toBe(401);
  const invalidId = await request.post("/api/retrieve", { data: { ...body, mode: "demo", itemIds: ["not-in-this-closet"] } });
  expect(invalidId.status()).toBe(400);
  const constrained = await request.post("/api/retrieve", {
    data: { ...body, mode: "demo", maxPrice: 1, items: [{ id: "coat", price: 0 }] },
  });
  expect(constrained.status()).toBe(200);
  expect((await constrained.json()).selection.picks).toEqual([]);
  const crossOrigin = await request.post("/api/retrieve", {
    headers: { origin: "https://other.example" }, data: { ...body, mode: "demo" },
  });
  expect(crossOrigin.status()).toBe(403);
});
