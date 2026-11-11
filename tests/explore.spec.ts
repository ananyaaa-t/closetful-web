import { expect, test } from "@playwright/test";

test("same-origin shopping activity requires an authenticated account", async ({ request, baseURL }) => {
  if (!baseURL) throw new Error("The app URL must be configured for this test.");
  const headers = { origin: new URL(baseURL).origin };
  const record = await request.post("/api/shopping-activity", { headers, data: { domain: "nike.com" } });
  expect(record.status()).toBe(401);
  const clear = await request.delete("/api/shopping-activity", { headers });
  expect(clear.status()).toBe(401);
});

test("shopping history cannot be changed from another website", async ({ request }) => {
  const headers = { origin: "https://another.example" };
  const record = await request.post("/api/shopping-activity", { headers, data: { domain: "nike.com" } });
  expect(record.status()).toBe(403);
  const clear = await request.delete("/api/shopping-activity", { headers });
  expect(clear.status()).toBe(403);
});
