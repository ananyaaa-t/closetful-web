"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { Search, LayoutGrid, List, ChevronRight, Bookmark } from "lucide-react";
import { ItemCard, type Item } from "@/app/closet/item-card";
import { PasteUrlForm } from "@/app/closet/paste-url-form";
import { BookmarkletButton } from "@/app/closet/bookmarklet-button";
import { ShareClosetButton } from "@/app/closet/share-closet-button";
import { brandFromUrl } from "@/lib/brand";
import { DecisionDesk } from "@/components/decision-desk";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ExploreBrands } from "@/components/explore-brands";
import { recommendBrands, type ShoppingVisit } from "@/lib/brand-recommendations";
import { useShoppingActivity } from "@/app/closet/use-shopping-activity";

type ViewMode = "grid" | "list";

const EXTENSION_URL = "https://github.com/ananyaaa-t/closetful-extension";

function EmptyState({ hasItems, onAdd }: { hasItems: boolean; onAdd: () => void; }) {
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
          <Button
            type="button"
            variant="outline"
            onClick={onAdd}
          >
            Paste a URL <ChevronRight className="h-3 w-3" />
          </Button>
          <Button asChild variant="outline">
            <a
              href={EXTENSION_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Install Extension <ChevronRight className="h-3 w-3" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

export function ClosetBoard({
  items,
  userEmail,
  logout,
  isPublic,
  shareUrl,
  shoppingVisits,
  shoppingHistoryError,
}: {
  items: Item[];
  userEmail: string;
  logout: () => void | Promise<void>;
  isPublic: boolean;
  shareUrl: string;
  shoppingVisits: ShoppingVisit[];
  shoppingHistoryError: string | null;
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [view, setView] = useState<"closet" | "choose" | "explore">("closet");
  const shopping = useShoppingActivity(shoppingVisits, shoppingHistoryError);
  const exploration = useMemo(() => recommendBrands(items, shopping.visits), [items, shopping.visits]);

  function trackShoppingClick(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || ![0, 1].includes(event.button) || !(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>("a[data-shopping-link]");
    if (anchor) shopping.recordVisit(anchor.href);
  }

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
    <div onClickCapture={trackShoppingClick} onAuxClickCapture={trackShoppingClick}>
      {/* Top header */}
      <Collapsible open={addOpen} onOpenChange={setAddOpen} asChild>
        <header className="sticky top-0 z-20 border-b border-[#FDF8F9]/6 bg-[#38040E]/95 backdrop-blur-xl">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8">
            <div className="flex items-center gap-6">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen((v) => !v)}
                className="hidden lg:inline-flex"
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
              >
                <List className="h-4 w-4" />
              </Button>
              <h1 className="text-[15px] font-medium lowercase tracking-tighter text-[#FDF8F9]">
                closetful.
              </h1>
            </div>

            <div className="order-last w-full sm:order-none sm:mx-4 sm:max-w-xs sm:flex-1">
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search your closet"
                  aria-label="Search your closet"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                >
                  {addOpen ? "Close" : "+ Add"}
                </Button>
              </CollapsibleTrigger>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ShareClosetButton isPublic={isPublic} shareUrl={shareUrl} />
            </div>
          </div>

          {/* Add panel — paste-URL is the primary, universal save method
            (works on any device, no install), with the bookmarklet tucked
            behind "More ways to add" for desktop power users. */}
          <CollapsibleContent className="border-t px-6 py-4 lg:px-8">
            <div className="mx-auto flex max-w-2xl flex-col gap-3">
              <PasteUrlForm />
              <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="link"
                    className="w-fit px-0"
                  >
                    {moreOpen ? "Hide other ways to add" : "More ways to add"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent><BookmarkletButton /></CollapsibleContent>
              </Collapsible>
            </div>
          </CollapsibleContent>
        </header>
      </Collapsible>

      <div className="flex min-h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <aside
          className={`hidden flex-shrink-0 flex-col overflow-hidden border-r border-[#FDF8F9]/6 transition-all duration-300 lg:flex ${sidebarOpen ? "w-52" : "w-0"
            }`}
        >
          <div className="flex w-52 flex-col gap-1 p-6">
            <p className="mb-3 text-[9px] uppercase tracking-[0.22em] text-[#FDF8F9]/25">Categories</p>
            {categories.map((cat) => (
              <Button
                key={cat}
                type="button"
                variant={selectedCategory === cat ? "secondary" : "ghost"}
                aria-pressed={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className="justify-between"
              >
                <span className="tracking-wide capitalize">{cat}</span>
                <span
                  className={`text-[9px] tabular-nums ${selectedCategory === cat ? "text-[#FDF8F9]/50" : "text-[#FDF8F9]/20"
                    }`}
                >
                  {categoryCounts[cat] ?? 0}
                </span>
              </Button>
            ))}

            <div className="mt-8 border-t border-[#FDF8F9]/6 pt-6">
              <Button type="button" variant="link" size="sm" className="mb-3 px-2" onClick={() => setView("explore")}>
                Explore brands <ChevronRight className="h-3 w-3" />
              </Button>
              <p className="mb-3 px-2 text-xs text-muted-foreground">
                {exploration.personalized ? "From your saves & shop visits" : "Save a piece to personalize"}
              </p>
              {exploration.brands.map((brand) => (
                <a
                  key={brand.domain}
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-shopping-link
                  className="block w-full rounded-md px-2 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="block font-medium text-foreground">{brand.name}</span>
                  <span className="mt-1 block text-[11px] leading-4">{brand.reason}</span>
                </a>
              ))}
            </div>

            <div className="mt-8 border-t border-[#FDF8F9]/6 pt-6">
              <p className="mb-1 truncate text-[10px] text-[#FDF8F9]/30">{userEmail}</p>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="px-0"
                >
                  Log out
                </Button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-6 py-8 lg:px-8">
          <nav aria-label="Closet views" className="mb-8 flex flex-wrap gap-3">
            <Button type="button" aria-pressed={view === "closet"} onClick={() => setView("closet")}
              variant={view === "closet" ? "default" : "outline"}>
              My closet
            </Button>
            <Button type="button" aria-pressed={view === "choose"} onClick={() => setView("choose")}
              variant={view === "choose" ? "default" : "outline"}>
              Help me choose
            </Button>
            <Button type="button" aria-pressed={view === "explore"} onClick={() => setView("explore")}
              variant={view === "explore" ? "default" : "outline"}>
              Explore
            </Button>
          </nav>
          <div hidden={view !== "explore"}>
            <ExploreBrands brands={exploration.brands} personalized={exploration.personalized}
              historyError={shopping.error} hasVisits={shopping.visits.length > 0}
              clearing={shopping.clearing} onClearHistory={shopping.clearHistory} />
          </div>
          <div hidden={view !== "choose"}><DecisionDesk items={items.filter((item) => !search.trim() ||
            [item.name, item.category, ...item.tags].some((value) => value?.toLowerCase().includes(search.trim().toLowerCase()))
          )} /></div>
          <div hidden={view !== "closet"}>
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
              <Separator className="flex-1" />
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
                <Button
                  key={cat}
                  type="button"
                  variant={selectedCategory === cat ? "secondary" : "ghost"}
                  size="sm"
                  aria-pressed={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize"
                >
                  {cat}
                </Button>
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
          </div>
        </main>
      </div>
    </div>
  );
}
