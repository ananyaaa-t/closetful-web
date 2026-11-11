import { expect, test } from "@playwright/test";
import { buildBookmarklet } from "../lib/bookmarklet";

test("sample saves persist across reload and remain separate from the real closet", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("button", { name: "My closet (6)" })).toBeVisible();
  await page.getByRole("button", { name: "Add sample", exact: true }).click();
  await page.getByRole("button", { name: "Everyday backpack $55" }).click();
  await expect(page.getByRole("button", { name: "My closet (7)" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "My closet (7)" })).toBeVisible();
  await page.getByRole("button", { name: "Remove Everyday backpack from demo closet" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "My closet (6)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create my real closet" })).toHaveAttribute("href", "/signup");
});

test("recommendations react to budget and priorities, preserve comparison, and enforce a three-piece limit", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Help me choose", exact: true }).click();
  await page.getByLabel("Maximum price per item ($)").fill("100");
  await page.getByRole("button", { name: "neutral", exact: true }).click();
  const desk = page.getByRole("region", { name: "Help me choose", exact: true });
  await expect(desk.getByRole("article")).toHaveCount(3);
  await expect(desk.getByRole("article").first()).toHaveAccessibleName("Cream knit sweater");
  await expect(desk.getByText("Top tag match")).toBeVisible();
  await expect(desk.getByRole("article", { name: "Camel belted coat" })).toHaveCount(0);
  for (const name of ["Cream knit sweater", "Tan leather tote", "Black suede loafers"]) {
    await page.getByRole("button", { name: `Shortlist ${name}`, exact: true }).click();
  }
  const comparison = page.getByRole("region", { name: "Compare shortlist" });
  await expect(comparison.getByRole("columnheader")).toHaveCount(4);
  await page.getByLabel("Maximum price per item ($)").fill("");
  await expect(page.getByRole("button", { name: "Shortlist Camel belted coat", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "My closet (6)" }).click();
  await page.getByRole("button", { name: "Help me choose", exact: true }).click();
  await expect(comparison).toBeVisible();
  await page.getByRole("button", { name: "Clear shortlist" }).click();
  await expect(comparison).toHaveCount(0);
});

test("mobile has working product photos, visible search/add, and no page-level overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  await expect(page.getByRole("searchbox", { name: "Search sample closet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add sample", exact: true })).toBeVisible();
  const photos = page.getByRole("region", { name: "Sample closet" }).getByRole("img");
  await expect(photos).toHaveCount(6);
  for (const photo of await photos.all()) {
    await photo.scrollIntoViewIfNeeded();
    await expect(photo).toHaveJSProperty("complete", true);
    await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("searchbox", { name: "Search sample closet" }).fill("sweater");
  await expect(page.getByRole("region", { name: "Sample closet" }).getByRole("article")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Search sample closet" }).fill("no such item");
  await expect(page.getByText("No matches. Try another search.")).toBeVisible();
});

test("decision filters support keyboard disclosure without losing their values", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Help me choose", exact: true }).click();
  await page.getByLabel("Compare within").selectOption("clothing");
  await page.getByLabel("Maximum price per item ($)").fill("100");
  await page.getByLabel("Put first").selectOption("price");
  await page.getByRole("button", { name: "neutral", exact: true }).click();

  const filters = page.getByRole("button", { name: "Fine-tune category, budget and priorities" });
  await filters.press("Enter");
  await expect(page.getByLabel("Maximum price per item ($)")).toBeHidden();
  await expect(filters).toBeFocused();
  await filters.press("Enter");
  await expect(page.getByLabel("Maximum price per item ($)")).toBeVisible();
  await expect(page.getByLabel("Maximum price per item ($)")).toHaveValue("100");
  await expect(page.getByLabel("Compare within")).toHaveValue("clothing");
  await expect(page.getByLabel("Put first")).toHaveValue("price");
  await expect(page.getByRole("button", { name: "neutral", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("a failed photo is explicit and can be retried without a generic replacement", async ({ page }) => {
  let fail = true;
  await page.route("**/demo/coat.jpg", async (route) => {
    if (fail) await route.abort();
    else await route.continue();
  });

  await page.goto("/demo");
  const coat = page.getByRole("region", { name: "Sample closet" })
    .getByRole("article", { name: "Camel belted coat" });
  await expect(coat.getByText("Photo couldn't load")).toBeVisible();
  fail = false;
  await coat.getByRole("button", { name: "Retry photo" }).click();
  await expect(coat.getByRole("img")).toBeVisible();
  await expect.poll(() => coat.getByRole("img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});

test("the bookmarklet captures Amazon's main photo and original URL, not the page preview", async ({ page }) => {
  const productUrl = "https://www.amazon.com/dp/B0BZ4FHFV4?th=1";
  await page.route("https://www.amazon.com/**", (route) => route.fulfill({
    contentType: "text/html",
    body: `<meta property="og:image" content="https://images.example/toolboxes.jpg">
      <span id="productTitle">Coffee syrup dispenser bottles</span>
      <img id="landingImage" src="https://images.example/thumbnail.jpg"
        data-old-hires="https://images.example/bottles.jpg">
      <div id="corePrice_feature_div"><span class="a-offscreen">$24.00</span></div>`,
  }));
  await page.goto(productUrl);
  const popup = page.waitForEvent("popup");
  await page.evaluate(buildBookmarklet("http://127.0.0.1:3000"));
  const opened = await popup;
  await opened.waitForURL("**/save?**");
  const captured = new URL(opened.url()).searchParams;
  expect(captured.get("url")).toBe(productUrl);
  expect(captured.get("image_url")).toBe("https://images.example/bottles.jpg");
  expect(captured.get("name")).toBe("Coffee syrup dispenser bottles");
  expect(captured.get("price")).toBe("$24.00");
});
