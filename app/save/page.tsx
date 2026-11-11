import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { scrapeProductMetadata } from "@/lib/scrape";
import { categorizeItem } from "@/lib/categorize";
import { SaveItemForm } from "@/app/save/save-item-form";
import { resolveProductImageUrl } from "@/lib/product-image";
import { Button } from "@/components/ui/button";

/** Pulls the first http(s) URL out of arbitrary shared text. Android's
 * native share sheet often puts the link inside `text` (e.g. "Check this
 * out! https://...") rather than a dedicated `url` field, depending on the
 * sharing app, so `url` alone isn't reliable for the PWA share target. */
function extractUrl(url?: string, text?: string): string | undefined {
  if (url) return url;
  const match = text?.match(/https?:\/\/\S+/);
  return match?.[0];
}

/**
 * Destination for the "Save to Closetful" bookmarklet, and the PWA's
 * Web Share Target (see app/manifest.ts) — Android/Chrome installed users
 * can tap "Share" on any link and land here with `?url=` (or `?text=`)
 * pre-filled. Opened as a popup from the bookmarklet with `?url=<current
 * page>`.
 *
 * Shows a preview (scraped name/price/image + an AI-suggested category)
 * and lets the user edit the category and add a note before anything is
 * actually saved — mirroring the Chrome extension's "preview before save"
 * panel, rather than saving instantly like this page used to.
 */
export default async function SavePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; text?: string; name?: string; image_url?: string; price?: string; }>;
}) {
  const params = await searchParams;
  const url = extractUrl(params.url, params.text);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <p className="text-[#FDF8F9]">You need to be logged in to save items.</p>
        <Button asChild variant="link">
          <Link
            href={`/login?message=Log in, then click the Save button again on the product page.`}
          >
            Log in
          </Link>
        </Button>
      </Shell>
    );
  }

  if (!url) {
    return (
      <Shell>
        <p className="text-[#FDF8F9]">No URL provided.</p>
        <p className="text-sm text-[#FDF8F9]/50">
          Use the &quot;Save to Closetful&quot; bookmarklet from a product page
          instead of opening this directly.
        </p>
      </Shell>
    );
  }

  // Scrape and get an AI category suggestion up front, in parallel, so the
  // preview form below can show real data instead of blank fields — same
  // pipeline the paste-URL flow uses, just surfaced before saving instead
  // of after.
  const capturedImage = resolveProductImageUrl(params.image_url, url);
  const capturedName = params.name?.trim().slice(0, 500);
  const capturedPrice = Number.parseFloat((params.price ?? "").replace(/[^0-9.]/g, ""));
  const scraped = capturedImage && capturedName
    ? {
      url,
      name: capturedName,
      image_url: capturedImage,
      price: Number.isFinite(capturedPrice) ? capturedPrice : null,
    }
    : await scrapeProductMetadata(url);
  const categorization = await categorizeItem({
    name: scraped.name,
    url: scraped.url,
    price: scraped.price,
  });

  return (
    <Shell>
      <SaveItemForm
        url={scraped.url}
        name={scraped.name}
        price={scraped.price}
        imageUrl={scraped.image_url}
        suggestedCategory={categorization?.category ?? null}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode; }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#38040E] px-6 py-10 text-center font-sans text-[#FDF8F9] selection:bg-[#FDF8F9]/15">
      {children}
    </div>
  );
}
