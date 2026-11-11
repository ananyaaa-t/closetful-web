"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Bookmark, Plus, Search, Scale, Check } from "lucide-react";
import { DEMO_CATALOG, DEMO_PHOTO_CREDITS } from "@/lib/demo-catalog";
import { DecisionDesk } from "@/components/decision-desk";
import { ProductImage } from "@/components/product-image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          <Button asChild variant="outline"><Link href="/signup">Create my real closet</Link></Button>
          <div className="order-last flex w-full items-center gap-3 sm:order-none sm:w-auto">
            <Label className="relative min-w-0 flex-1">
              <span className="sr-only">Search sample closet</span>
              <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-[#FDF8F9]/60" />
              <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your closet"
                className="pl-9" />
            </Label>
            <Button type="button" onClick={() => setAdding((open) => !open)}
              aria-expanded={adding}
              aria-controls="sample-picker">
              <Plus aria-hidden="true" className="h-4 w-4" /> Add sample
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        {(!savedIds || writeError) && <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {writeError ?? (raw === STORAGE_ERROR ? "Browser storage is unavailable. Allow local storage to try saves in this demo." : "Your saved demo data couldn't be read. Reset it to continue.")}
            <Button type="button" variant="link" onClick={() => store(INITIAL_IDS)} className="ml-3">Reset demo</Button>
          </AlertDescription>
        </Alert>}

        {adding && (
          <Card id="sample-picker" role="region" aria-label="Add sample pieces" className="mb-8 gap-0 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-medium">Try adding a piece</h2><p className="mt-1 text-sm text-[#FDF8F9]/65">Sample catalog only. Your real closet saves product links.</p></div>
              <Button type="button" variant="link" onClick={() => setAdding(false)}>Close samples</Button>
            </div>
            {available.length ? <div className="grid gap-3 sm:grid-cols-2">
              {available.map((item) => <Button key={item.id} type="button" variant="outline" onClick={() => store([...(savedIds ?? []), item.id])}
                className="h-auto min-h-16 justify-between whitespace-normal p-3 text-left">
                <span>{item.name} <span className="text-[#FDF8F9]/60">${item.price}</span></span><Plus aria-hidden="true" className="h-4 w-4" />
              </Button>)}
            </div> : <p className="text-sm text-[#FDF8F9]/70">All sample pieces are in your closet.</p>}
          </Card>
        )}

        <nav aria-label="Demo views" className="mb-8 flex flex-wrap gap-3 border-b border-[#FDF8F9]/15 pb-4">
          <Button type="button" aria-pressed={tab === "closet"} onClick={() => setTab("closet")}
            variant={tab === "closet" ? "default" : "outline"}>
            <Bookmark aria-hidden="true" className="h-4 w-4" /> My closet ({saved.length})
          </Button>
          <Button type="button" aria-pressed={tab === "choose"} onClick={() => setTab("choose")}
            variant={tab === "choose" ? "default" : "outline"}>
            <Scale aria-hidden="true" className="h-4 w-4" /> Help me choose
          </Button>
        </nav>

        <div hidden={tab !== "choose"}><DecisionDesk items={visible} sample /></div>
        <section aria-label="Sample closet" hidden={tab !== "closet"}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div><p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#FDF8F9]/60">Your wishlist, with a little clarity</p><h1 className="font-space-grotesk text-3xl font-medium tracking-tight">Saved for later. Chosen with intention.</h1></div>
            <Button type="button" variant="link" onClick={() => setTab("choose")} className="h-auto min-h-11 whitespace-normal px-0 text-left">Not sure what to buy? Compare pieces</Button>
          </div>
          {visible.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {visible.map((item) => <Card key={item.id} role="article" aria-label={item.name ?? "Sample piece"} className="gap-0 p-0">
              <div className="relative aspect-[4/5] bg-[#450A15]"><ProductImage src={item.image_url} alt={item.name ?? "Sample piece"} className="object-cover" /></div>
              <div className="space-y-2 p-3 sm:p-4">
                <p className="text-xs capitalize text-[#FDF8F9]/60">{item.category}</p>
                <h2 className="text-sm font-medium sm:text-base">{item.name}</h2>
                <p className="text-sm">${item.price?.toFixed(2)}</p>
                <p className="text-xs leading-5 text-[#FDF8F9]/65">{item.notes}</p>
                <Button type="button" variant="link" size="sm" aria-label={`Remove ${item.name} from demo closet`} onClick={() => store((savedIds ?? []).filter((key) => key !== item.id))}
                  className="px-0"><Check aria-hidden="true" className="h-3 w-3" /> Saved - remove</Button>
              </div>
            </Card>)}
          </div> : <div className="rounded-xl border border-dashed border-[#FDF8F9]/25 p-10 text-center"><p>{saved.length ? "No matches. Try another search." : "Your demo closet is empty. Add a sample piece to start."}</p></div>}
        </section>
        <footer className="mt-12 border-t border-[#FDF8F9]/15 pt-6 text-xs leading-6 text-[#FDF8F9]/60">
          <div className="flex flex-wrap items-center justify-between gap-3"><p>Sample prices and descriptions are illustrative. Stock photography, not retailer inventory.</p><Button type="button" variant="link" size="sm" onClick={() => store(INITIAL_IDS)}>Reset demo</Button></div>
          <Collapsible>
            <div className="flex flex-wrap items-center gap-2">
              <CollapsibleTrigger asChild><Button type="button" variant="link" size="sm" className="px-0">Photo sources</Button></CollapsibleTrigger>
              <a href="https://unsplash.com/license" className="underline">Unsplash License</a>
            </div>
            <CollapsibleContent><div className="flex flex-wrap gap-x-4">{DEMO_PHOTO_CREDITS.map(([label, photo]) => <a key={photo} href={`https://images.unsplash.com/photo-${photo}`} target="_blank" rel="noopener noreferrer" className="underline">{label}</a>)}</div></CollapsibleContent>
          </Collapsible>
        </footer>
      </main>
    </div>
  );
}
