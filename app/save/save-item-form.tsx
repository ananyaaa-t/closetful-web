"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveScrapedItem, type SavePreviewState } from "@/app/actions/items";
import { CATEGORIES } from "@/lib/categorize";
import { ProductImage } from "@/components/product-image";

const initialState: SavePreviewState = { ok: false, error: null };

function labelFor(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function SaveItemForm({
  url,
  name,
  price,
  imageUrl,
  suggestedCategory,
}: {
  url: string;
  name: string | null;
  price: number | null;
  imageUrl: string | null;
  suggestedCategory: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveScrapedItem, initialState);
  const [category, setCategory] = useState(suggestedCategory ?? "other");

  if (state.ok) {
    return (
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDF8F9]/10 text-lg text-[#FDF8F9]">
          ✓
        </div>
        <p className="text-lg font-medium text-[#FDF8F9]">Saved to your closet!</p>
        <p className="line-clamp-2 text-sm text-[#FDF8F9]/50">
          {name ?? "This item"} has been catalogued under {labelFor(category)}.
        </p>
        <Link
          href="/closet"
          className="mt-2 text-sm font-medium text-[#FDF8F9] underline underline-offset-2"
        >
          Go to your closet
        </Link>
        <p className="text-xs text-[#FDF8F9]/30">You can close this window.</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-xs flex-col gap-4 rounded-2xl border border-[#FDF8F9]/10 bg-[#450A15] p-5 text-left"
    >
      <input type="hidden" name="url" value={url} />
      <input type="hidden" name="name" value={name ?? ""} />
      <input type="hidden" name="price" value={price ?? ""} />
      <input type="hidden" name="image_url" value={imageUrl ?? ""} />
      <input type="hidden" name="category" value={category} />

      <div className="flex items-center gap-3">
        <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-[#38040E]">
          <ProductImage src={imageUrl} alt={name ?? "Product preview"} />
        </div>

        {!imageUrl && (
          <p className="text-xs leading-relaxed text-[#FDF8F9]/70">
            The store did not provide a product photo. Use the bookmark or extension
            from the product page to capture it; we won&apos;t substitute an unrelated image.
          </p>
        )}
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] leading-snug text-[#FDF8F9]">
            {name ?? "Untitled item"}
          </p>
          {price !== null && (
            <p className="text-[13px] font-medium text-[#FDF8F9]/80">${price.toFixed(2)}</p>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[9px] uppercase tracking-[0.18em] text-[#FDF8F9]/35">
          Suggested Collection
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                category === c
                  ? "border-[#FDF8F9] bg-[#FDF8F9] text-[#38040E]"
                  : "border-[#FDF8F9]/20 text-[#FDF8F9]/60 hover:border-[#FDF8F9]/40"
              }`}
            >
              {labelFor(c)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[9px] uppercase tracking-[0.18em] text-[#FDF8F9]/35">
          Notes
        </label>
        <textarea
          name="notes"
          placeholder="Add a note (e.g. would look great with the Toteme coat)…"
          rows={3}
          className="w-full resize-none rounded-md border border-[#FDF8F9]/15 bg-[#38040E] px-2.5 py-2 text-[13px] text-[#FDF8F9] outline-none placeholder:text-[#FDF8F9]/30 focus:border-[#FDF8F9]/40"
        />
      </div>

      {state.error && <p className="text-sm text-red-300">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#FDF8F9] py-2.5 text-sm font-medium text-[#38040E] transition-colors hover:bg-[#FDF8F9]/85 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save to my Closet"}
      </button>
    </form>
  );
}
