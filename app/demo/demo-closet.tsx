"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Bookmark, Plus, Search, Scale, Check } from "lucide-react";
import { DEMO_CATALOG, DEMO_PHOTO_CREDITS } from "@/lib/demo-catalog";
import { DecisionDesk } from "@/components/decision-desk";
import { ProductImage } from "@/components/product-image";

const STORAGE_KEY = "closetful-demo-saved-v1";
const CHANGE_EVENT = "closetful-demo-saved-change";
const INITIAL_IDS = ["coat", "jacket", "sweater", "bag", "handbag", "shoes"];
const STORAGE_ERROR = "__storage_unavailable__";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function snapshot(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return STORAGE_ERROR;
  }
}

function savedIdsFromStorage(raw: string | null): string[] | null {
  if (raw === null) return INITIAL_IDS;
  if (raw === STORAGE_ERROR) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((id) =>
      typeof id === "string" && DEMO_CATALOG.some((item) => item.id === id)
    )) return null;
    return [...new Set<string>(parsed)];
  } catch {
    return null;
  }
}

export function DemoCloset() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const savedIds = savedIdsFromStorage(raw);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [tab, setTab] = useState<"closet" | "choose">("closet");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const saved = DEMO_CATALOG.filter((item) => savedIds?.includes(item.id));
  const query = search.trim().toLowerCase();
  const visible = saved.filter((item) => [item.name, item.category, ...item.tags]
    .some((value) => value?.toLowerCase().includes(query)));
  const available = DEMO_CATALOG.filter((item) => !savedIds?.includes(item.id));

  function store(ids: string[]) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      window.dispatchEvent(new Event(CHANGE_EVENT));
      setWriteError(null);
    } catch {
      setWriteError("Your browser couldn't save this change. Allow local storage and try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#38040E] font-sans text-[#FDF8F9]">
      <div className="border-b border-[#FDF8F9]/15 bg-[#FDF8F9]/5 px-5 py-3 text-center text-xs leading-5 text-[#FDF8F9]/80">
        Interactive demo: sample pieces and prices, saved only in this browser. Not live product listings.
      </div>
      <header className="sticky top-0 z-20 border-b border-[#FDF8F9]/15 bg-[#38040E]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">closetful.</Link>
          <Link href="/signup" className="min-h-10 rounded-full border border-[#FDF8F9]/30 px-4 py-2.5 text-xs">Create my real closet</Link>
          <div className="order-last flex w-full items-center gap-3 sm:order-none sm:w-auto">
            <label className="relative flex-1">
              <span className="sr-only">Search sample closet</span>
              <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-[#FDF8F9]/60" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your closet"
                className="min-h-11 w-full rounded-md border border-[#FDF8F9]/25 bg-transparent pl-9 pr-3 text-sm placeholder:text-[#FDF8F9]/55" />
            </label>
            <button type="button" onClick={() => setAdding((open) => !open)}
              aria-expanded={adding}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#FDF8F9] px-4 text-sm font-medium text-[#38040E]">
              <Plus aria-hidden="true" className="h-4 w-4" /> Add sample
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        {(!savedIds || writeError) && <div role="alert" className="mb-6 rounded-lg border border-red-200/40 p-4 text-sm text-red-200">
          {writeError ?? (raw === STORAGE_ERROR ? "Browser storage is unavailable. Allow local storage to try saves in this demo." : "Your saved demo data couldn't be read. Reset it to continue.")}
          <button type="button" onClick={() => store(INITIAL_IDS)} className="ml-3 min-h-10 underline underline-offset-4">Reset demo</button>
        </div>}

        {adding && (
          <section aria-label="Add sample pieces" className="mb-8 rounded-xl border border-[#FDF8F9]/25 bg-[#FDF8F9]/5 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-medium">Try adding a piece</h2><p className="mt-1 text-sm text-[#FDF8F9]/65">Sample catalog only. Your real closet saves product links.</p></div>
              <button type="button" onClick={() => setAdding(false)} className="min-h-10 text-sm underline underline-offset-4">Close samples</button>
            </div>
            {available.length ? <div className="grid gap-3 sm:grid-cols-2">
              {available.map((item) => <button key={item.id} type="button" onClick={() => store([...(savedIds ?? []), item.id])}
                className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-[#FDF8F9]/20 p-3 text-left text-sm hover:bg-[#FDF8F9]/10">
                <span>{item.name} <span className="text-[#FDF8F9]/60">${item.price}</span></span><Plus aria-hidden="true" className="h-4 w-4" />
              </button>)}
            </div> : <p className="text-sm text-[#FDF8F9]/70">All sample pieces are in your closet.</p>}
          </section>
        )}

        <nav aria-label="Demo views" className="mb-8 flex gap-3 border-b border-[#FDF8F9]/15 pb-4">
          <button type="button" aria-pressed={tab === "closet"} onClick={() => setTab("closet")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm ${tab === "closet" ? "bg-[#FDF8F9] text-[#38040E]" : "border border-[#FDF8F9]/25"}`}>
            <Bookmark aria-hidden="true" className="h-4 w-4" /> My closet ({saved.length})
          </button>
          <button type="button" aria-pressed={tab === "choose"} onClick={() => setTab("choose")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm ${tab === "choose" ? "bg-[#FDF8F9] text-[#38040E]" : "border border-[#FDF8F9]/25"}`}>
            <Scale aria-hidden="true" className="h-4 w-4" /> Help me choose
          </button>
        </nav>

        <div hidden={tab !== "choose"}><DecisionDesk items={visible} sample /></div>
          <section aria-label="Sample closet" hidden={tab !== "closet"}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div><p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#FDF8F9]/60">Your wishlist, with a little clarity</p><h1 className="font-space-grotesk text-3xl font-medium tracking-tight">Saved for later. Chosen with intention.</h1></div>
              <button type="button" onClick={() => setTab("choose")} className="min-h-11 text-sm underline underline-offset-4">Not sure what to buy? Compare pieces</button>
            </div>
            {visible.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {visible.map((item) => <article key={item.id} aria-label={item.name ?? "Sample piece"} className="overflow-hidden rounded-xl border border-[#FDF8F9]/15 bg-[#FDF8F9]/5">
                <div className="relative aspect-[4/5] bg-[#450A15]"><ProductImage src={item.image_url} alt={item.name ?? "Sample piece"} className="object-cover" /></div>
                <div className="space-y-2 p-3 sm:p-4">
                  <p className="text-xs capitalize text-[#FDF8F9]/60">{item.category}</p>
                  <h2 className="text-sm font-medium sm:text-base">{item.name}</h2>
                  <p className="text-sm">${item.price?.toFixed(2)}</p>
                  <p className="text-xs leading-5 text-[#FDF8F9]/65">{item.notes}</p>
                  <button type="button" aria-label={`Remove ${item.name} from demo closet`} onClick={() => store((savedIds ?? []).filter((key) => key !== item.id))}
                    className="inline-flex min-h-11 items-center gap-2 text-xs text-[#FDF8F9]/70 underline underline-offset-4"><Check aria-hidden="true" className="h-3 w-3" /> Saved - remove</button>
                </div>
              </article>)}
            </div> : <div className="rounded-xl border border-dashed border-[#FDF8F9]/25 p-10 text-center"><p>{saved.length ? "No matches. Try another search." : "Your demo closet is empty. Add a sample piece to start."}</p></div>}
          </section>
        <footer className="mt-12 border-t border-[#FDF8F9]/15 pt-6 text-xs leading-6 text-[#FDF8F9]/60">
          <div className="flex flex-wrap items-center justify-between gap-3"><p>Sample prices and descriptions are illustrative. Stock photography, not retailer inventory.</p><button type="button" onClick={() => store(INITIAL_IDS)} className="min-h-10 underline underline-offset-4">Reset demo</button></div>
          <details><summary className="cursor-pointer">Photo sources (<a href="https://unsplash.com/license" className="underline">Unsplash License</a>)</summary><div className="flex flex-wrap gap-x-4">{DEMO_PHOTO_CREDITS.map(([label, photo]) => <a key={photo} href={`https://images.unsplash.com/photo-${photo}`} target="_blank" rel="noopener noreferrer" className="underline">{label}</a>)}</div></details>
        </footer>
      </main>
    </div>
  );
}
