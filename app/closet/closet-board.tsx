"use client";

import { useMemo, useState } from "react";
import { Search, LayoutGrid, List, ChevronRight, Bookmark } from "lucide-react";
import { ItemCard, type Item } from "@/app/closet/item-card";
import { PasteUrlForm } from "@/app/closet/paste-url-form";
import { BookmarkletButton } from "@/app/closet/bookmarklet-button";
import { brandFromUrl } from "@/lib/brand";

type ViewMode = "grid" | "list";

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

const EXTENSION_URL = "https://github.com/ananyaaa-t/closetful-extension";

function EmptyState({ hasItems, onAdd }: { hasItems: boolean; onAdd: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-28 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#FDF8F9]/10">
        <Bookmark className="h-8 w-8 text-[#FDF8F9]/20" />
      </div>
      <p className="mb-2 font-space-grotesk text-2xl font-medium tracking-tight text-[#FDF8F9]/40">
        {hasItems ? "No matches" : "Your closet awaits."}
      </p>
      <p className="max-w-xs text-[11px] uppercase leading-relaxed tracking-[0.2em] text-[#FDF8F9]/25">
        {hasItems
          ? "Try a different category or search term."
          : "Save pieces from anywhere on the web using the Closetful Chrome extension"}
      </p>
      {!hasItems && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 border border-[#FDF8F9]/25 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#FDF8F9]/70 transition-all duration-200 hover:border-[#FDF8F9]/50 hover:text-[#FDF8F9]"
          >
            Paste a URL <ChevronRight className="h-3 w-3" />
          </button>
          <a
            href={EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[#FDF8F9]/20 px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-[#FDF8F9]/60 transition-all duration-200 hover:border-[#FDF8F9]/40 hover:text-[#FDF8F9]/90"
          >
            Install Extension <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export function ClosetBoard({
  items,
  userEmail,
  logout,
}: {
  items: Item[];
  userEmail: string;
  logout: () => void | Promise<void>;
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    items.forEach((item) => {
      const label = item.category ?? "Uncategorized";
      counts[label] = (counts[label] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => item.category ?? "Uncategorized"));
    return ["All", ...Array.from(unique).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const category = item.category ?? "Uncategorized";
      const matchesCategory = selectedCategory === "All" || category === selectedCategory;
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query) ||
        brandFromUrl(item.url).toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, search]);

  // Items already arrive from the server ordered by created_at desc, so the
  // first few are the most recently added — no need to re-sort here.
  const recentlyAdded = useMemo(() => items.slice(0, 4), [items]);
  const showRecentlyAdded = search === "" && selectedCategory === "All" && recentlyAdded.length > 0;

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-20 border-b border-[#FDF8F9]/6 bg-[#38040E]/95 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-4 px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="hidden h-7 w-7 items-center justify-center text-[#FDF8F9]/30 transition-colors hover:text-[#FDF8F9]/70 lg:flex"
              aria-label="Toggle sidebar"
            >
              <List className="h-4 w-4" />
            </button>
            <h1 className="text-[15px] font-medium lowercase tracking-tighter text-[#FDF8F9]">
              closetful.
            </h1>
          </div>

          <div className="mx-8 hidden max-w-xs flex-1 sm:block">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 text-[#FDF8F9]/30" />
              <input
                type="search"
                placeholder="search your closet"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-b border-[#FDF8F9]/15 bg-transparent pb-0.5 pl-5 text-[11.5px] tracking-wide text-[#FDF8F9] outline-none transition-colors placeholder:text-[#FDF8F9]/30 focus:border-[#FDF8F9]/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAddOpen((v) => !v)}
              className="hidden text-[10px] uppercase tracking-[0.15em] text-[#FDF8F9]/50 transition-colors hover:text-[#FDF8F9]/85 sm:block"
            >
              {addOpen ? "Close" : "+ Add"}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex h-7 w-7 items-center justify-center transition-colors ${
                  viewMode === "grid" ? "text-[#FDF8F9]" : "text-[#FDF8F9]/30 hover:text-[#FDF8F9]/60"
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex h-7 w-7 items-center justify-center transition-colors ${
                  viewMode === "list" ? "text-[#FDF8F9]" : "text-[#FDF8F9]/30 hover:text-[#FDF8F9]/60"
                }`}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Add panel — paste-URL is the primary, universal save method
            (works on any device, no install), with the bookmarklet tucked
            behind "More ways to add" for desktop power users. */}
        {addOpen && (
          <div className="border-t border-[#FDF8F9]/6 px-6 py-4 lg:px-8">
            <div className="mx-auto flex max-w-2xl flex-col gap-3">
              <PasteUrlForm />
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className="w-fit text-[11px] text-[#FDF8F9]/35 underline underline-offset-2 hover:text-[#FDF8F9]/70"
              >
                {moreOpen ? "Hide other ways to add" : "More ways to add"}
              </button>
              {moreOpen && <BookmarkletButton />}
            </div>
          </div>
        )}
      </header>

      <div className="flex min-h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside
          className={`hidden flex-shrink-0 flex-col overflow-hidden border-r border-[#FDF8F9]/6 transition-all duration-300 lg:flex ${
            sidebarOpen ? "w-52" : "w-0"
          }`}
        >
          <div className="flex w-52 flex-col gap-1 p-6">
            <p className="mb-3 text-[9px] uppercase tracking-[0.22em] text-[#FDF8F9]/25">Categories</p>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center justify-between rounded-sm px-2 py-1.5 text-left text-[11.5px] transition-all duration-150 ${
                  selectedCategory === cat
                    ? "bg-[#FDF8F9]/8 text-[#FDF8F9]"
                    : "text-[#FDF8F9]/45 hover:bg-[#FDF8F9]/4 hover:text-[#FDF8F9]/75"
                }`}
              >
                <span className="tracking-wide capitalize">{cat}</span>
                <span
                  className={`text-[9px] tabular-nums ${
                    selectedCategory === cat ? "text-[#FDF8F9]/50" : "text-[#FDF8F9]/20"
                  }`}
                >
                  {categoryCounts[cat] ?? 0}
                </span>
              </button>
            ))}

            <div className="mt-8 border-t border-[#FDF8F9]/6 pt-6">
              <p className="mb-3 text-[9px] uppercase tracking-[0.22em] text-[#FDF8F9]/25">Explore</p>
              {EXPLORE_BRANDS.map((brand) => (
                <a
                  key={brand.label}
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-2 py-1.5 text-left text-[11px] tracking-wide text-[#FDF8F9]/35 transition-colors hover:text-[#FDF8F9]/70"
                >
                  {brand.label}
                </a>
              ))}
            </div>

            <div className="mt-8 border-t border-[#FDF8F9]/6 pt-6">
              <p className="mb-1 truncate text-[10px] text-[#FDF8F9]/30">{userEmail}</p>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-[10px] uppercase tracking-[0.15em] text-[#FDF8F9]/35 hover:text-[#FDF8F9]/70"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-8">
          {/* Recently Added */}
          {showRecentlyAdded && (
            <section className="mb-12">
              <div className="mb-5 flex items-baseline justify-between">
                <h2 className="text-[19px] font-semibold tracking-tight text-[#FDF8F9]/80">Recently Added</h2>
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#FDF8F9]/25">
                  {items.length} {items.length === 1 ? "piece" : "pieces"} saved
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4">
                {recentlyAdded.map((item) => (
                  <ItemCard key={`recent-${item.id}`} item={item} viewMode="recent" />
                ))}
              </div>
            </section>
          )}

          {/* Divider + section label */}
          <div className="mb-6 flex items-center gap-4">
            <h2 className="flex-shrink-0 text-[19px] font-semibold capitalize tracking-tight text-[#FDF8F9]/80">
              {selectedCategory === "All" ? "All Pieces" : selectedCategory}
            </h2>
            <div className="h-px flex-1 bg-[#FDF8F9]/6" />
            {filtered.length > 0 && (
              <span className="flex-shrink-0 text-[9px] uppercase tracking-[0.18em] text-[#FDF8F9]/25">
                {filtered.length} {filtered.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          {/* Mobile category filter row */}
          <div
            className="mb-6 flex gap-5 overflow-x-auto pb-1 lg:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap border-b pb-1 text-[10px] uppercase capitalize tracking-[0.15em] transition-all ${
                  selectedCategory === cat
                    ? "border-[#FDF8F9] text-[#FDF8F9]"
                    : "border-transparent text-[#FDF8F9]/35"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid or List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.length > 0 ? (
                filtered.map((item) => <ItemCard key={item.id} item={item} viewMode="grid" />)
              ) : (
                <EmptyState hasItems={items.length > 0} onAdd={() => setAddOpen(true)} />
              )}
            </div>
          ) : (
            <div className="border-t border-[#FDF8F9]/6">
              {filtered.length > 0 ? (
                filtered.map((item) => <ItemCard key={item.id} item={item} viewMode="list" />)
              ) : (
                <div className="grid grid-cols-1">
                  <EmptyState hasItems={items.length > 0} onAdd={() => setAddOpen(true)} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
