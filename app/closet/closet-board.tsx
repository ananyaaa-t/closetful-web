"use client";

import { useMemo, useState } from "react";
import { ItemCard, type Item } from "@/app/closet/item-card";
import { PasteUrlForm } from "@/app/closet/paste-url-form";
import { BookmarkletButton } from "@/app/closet/bookmarklet-button";
import { brandFromUrl } from "@/lib/brand";

// Curated brands shown as quick jump-off links to help users find something
// worth saving — clicking opens the brand's site in a new tab, then the
// bookmarklet (or paste-URL form) captures it back into the closet.
const EXPLORE_BRANDS: { label: string; url: string }[] = [
  { label: "Acne Studios", url: "https://www.acnestudios.com" },
  { label: "Miu Miu", url: "https://www.miumiu.com" },
  { label: "The Row", url: "https://www.therow.com" },
  { label: "Khaite", url: "https://www.khaite.com" },
  { label: "Bottega Veneta", url: "https://www.bottegaveneta.com" },
  { label: "Toteme", url: "https://toteme-studio.com" },
];

export function ClosetBoard({ items }: { items: Item[] }) {
  const [activeBrand, setActiveBrand] = useState("ALL");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const brands = useMemo(() => {
    const unique = new Set(items.map((item) => brandFromUrl(item.url)));
    return Array.from(unique).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesBrand =
        activeBrand === "ALL" || brandFromUrl(item.url) === activeBrand;
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query));
      return matchesBrand && matchesSearch;
    });
  }, [items, activeBrand, search]);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search"
          className="w-full rounded-md border-b border-white/20 bg-transparent px-1 py-1.5 text-sm text-white outline-none placeholder:text-white/40 sm:w-64"
        />
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="w-fit rounded-full border border-white/25 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white/80 hover:border-white/60 hover:text-white"
        >
          {addOpen ? "Close" : "+ Add item"}
        </button>
      </div>

      {addOpen && (
        <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <PasteUrlForm />
          <BookmarkletButton />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/10 pb-4 text-xs font-medium uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveBrand("ALL")}
          className={`pb-1 ${
            activeBrand === "ALL"
              ? "border-b-2 border-white text-white"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          All
        </button>
        {brands.map((brand) => (
          <button
            key={brand}
            type="button"
            onClick={() => setActiveBrand(brand)}
            className={`pb-1 ${
              activeBrand === brand
                ? "border-b-2 border-white text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      <div className="-mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/10 pb-4 text-xs uppercase tracking-wider text-white/40">
        <span className="font-medium">Explore:</span>
        {EXPLORE_BRANDS.map((brand) => (
          <a
            key={brand.label}
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70"
          >
            {brand.label}
          </a>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-lg text-white">
            {items.length === 0 ? "Nothing saved yet" : "No matches"}
          </p>
          <p className="max-w-sm text-sm text-white/50">
            {items.length === 0
              ? "Add your first item to start your closet."
              : "Try a different brand or search term."}
          </p>
        </div>
      )}
    </div>
  );
}
