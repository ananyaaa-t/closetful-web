import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { saveItemForUser } from "@/lib/save-item";

/**
 * Destination for the "Save to Closetful" bookmarklet. Opened in a small
 * popup window from any product page with `?url=<current page>`. Saves
 * immediately (reusing the same pipeline as the paste-URL form) and shows
 * a compact confirmation the user can glance at and close.
 */
export default async function SavePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <p className="text-black dark:text-zinc-50">
          You need to be logged in to save items.
        </p>
        <Link
          href={`/login?message=Log in, then click the Save button again on the product page.`}
          className="text-sm font-medium underline"
        >
          Log in
        </Link>
      </Shell>
    );
  }

  if (!url) {
    return (
      <Shell>
        <p className="text-black dark:text-zinc-50">No URL provided.</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Use the &quot;Save to Closetful&quot; bookmarklet from a product
          page instead of opening this directly.
        </p>
      </Shell>
    );
  }

  const result = await saveItemForUser(supabase, user.id, url);

  if (!result.ok) {
    return (
      <Shell>
        <p className="text-red-600 dark:text-red-400">{result.error}</p>
      </Shell>
    );
  }

  const item = result.item as {
    name: string | null;
    image_url: string | null;
    price: number | null;
  };

  return (
    <Shell>
      <p className="text-lg font-medium text-black dark:text-zinc-50">
        Saved ✓
      </p>
      <p className="line-clamp-2 max-w-xs text-center text-sm text-zinc-600 dark:text-zinc-400">
        {item.name ?? "Item"}
        {item.price !== null ? ` · $${item.price.toFixed(2)}` : ""}
      </p>
      <Link
        href="/closet"
        className="text-sm font-medium text-black underline dark:text-zinc-50"
      >
        View your closet
      </Link>
      <p className="text-xs text-zinc-400">You can close this window.</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 px-6 py-10 text-center dark:bg-black">
      {children}
    </div>
  );
}
