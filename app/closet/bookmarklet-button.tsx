"use client";

import { useSyncExternalStore } from "react";
import { buildBookmarklet } from "@/lib/bookmarklet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const noopSubscribe = () => () => { };

/**
 * Draggable "Save to Closetful" bookmarklet. Captures the current page's
 * URL and opens a small popup pointed at /save on this app's own origin —
 * this is why the origin must be read from `window.location` at runtime in
 * the browser (the bookmarklet executes in the context of whatever site
 * it's clicked from, e.g. nike.com, so the destination origin can't be a
 * relative path). Uses `useSyncExternalStore` (rather than an effect +
 * setState) to read this browser-only value without a hydration mismatch.
 */
export function BookmarkletButton() {
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => null
  );

  if (!origin) return null;

  const code = buildBookmarklet(origin);

  return (
    <Card className="w-full gap-2 p-4">
      <p className="text-[#FDF8F9]/60">
        Drag this to your bookmarks bar, then click it on any product page to
        preview and save its main photo — no copy-pasting URLs. Especially useful
        for stores like Amazon that block server-side previews.
      </p>
      <Button asChild className="w-fit">
        <a
          href={`javascript:${code}`}
          onClick={(e) => e.preventDefault()}
          draggable
          className="cursor-grab active:cursor-grabbing"
        >
          + Save to Closetful
        </a>
      </Button>
    </Card>
  );
}
