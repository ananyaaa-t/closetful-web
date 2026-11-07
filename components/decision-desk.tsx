"use client";

import { useId, useMemo, useState } from "react";
import { Check, Scale, Sparkles, X } from "lucide-react";
import type { Item } from "@/app/closet/item-card";
import { ProductImage } from "@/components/product-image";
import { resolveProductImageUrl } from "@/lib/product-image";
import { rankSavedItems, type DecisionPreferences } from "@/lib/recommendations";
import type { RetrievalSelection } from "@/lib/generative-retrieval";

function priceLabel(price: number | null) {
  return price === null ? "Price unknown" : `$${price.toFixed(2)}`;
}

export function DecisionDesk({ items, sample = false }: { items: Item[]; sample?: boolean }) {
  const id = useId();
  const [category, setCategory] = useState("All");
  const [budget, setBudget] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [sort, setSort] = useState<DecisionPreferences["sort"]>("match");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [retrieving, setRetrieving] = useState(false);
  const [retrievalError, setRetrievalError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{
    selection: RetrievalSelection; sourceIds: string; query: string;
  } | null>(null);

  const categories = [...new Set(items.flatMap((item) => item.category ? [item.category] : []))].sort();
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    items.filter((item) => category === "All" || item.category === category).forEach((item) => {
      new Set(item.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)).forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12).map(([tag]) => tag);
  }, [items, category]);
  const maxPrice = budget === "" ? null : Number(budget);
  const invalidBudget = maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0);
  const manualRanked = invalidBudget ? [] : rankSavedItems(
    items.filter((item) => !dismissedIds.includes(item.id)),
    { category, maxPrice, priorities, sort }
  );
  const sourceIds = items.map((item) => item.id).join(",");
  const selection = generated?.sourceIds === sourceIds && generated.query === query ? generated.selection : null;
  const ranked = selection ? selection.picks.flatMap((pick) => {
    const entry = manualRanked.find((entry) => entry.item.id === pick.itemId);
    return entry ? [{ ...entry, reasons: [
      "AI selected this saved piece",
      ...pick.savedTags.map((tag) => `Saved tag: "${tag}"`),
      ...entry.reasons,
    ] }] : [];
  }) : manualRanked;
  const selected = items.filter((item) => selectedIds.includes(item.id));
  const matched = ranked.filter((result) => result.matchedPriorities.length > 0);
  const best = !selection && sort === "match" && priorities.length && matched.length ? ranked[0].item.id : null;
  const unknownPrices = items.filter((item) =>
    item.price === null && (category === "All" || item.category === category)
  ).length;

  function toggleCompare(itemId: string) {
    setSelectedIds((previous) => {
      const current = previous.filter((key) => items.some((item) => item.id === key));
      if (current.includes(itemId)) return current.filter((key) => key !== itemId);
      return current.length < 3 ? [...current, itemId] : current;
    });
  }

  async function retrieve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRetrieving(true);
    setRetrievalError(null);
    setGenerated(null);
    try {
      const response = await fetch("/api/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: sample ? "demo" : "closet", query,
          itemIds: manualRanked.slice(0, 40).map((entry) => entry.item.id),
          category, maxPrice, priorities,
        }),
        signal: AbortSignal.timeout(35000),
      });
      const body: { selection?: RetrievalSelection; error?: string } = await response.json();
      if (!response.ok || !body.selection) {
        throw new Error(body.error ?? "AI couldn't produce a shortlist. Please retry.");
      }
      setGenerated({ selection: body.selection, sourceIds, query });
      setCategory(body.selection.category);
      setBudget(body.selection.maxPrice === null ? "" : String(body.selection.maxPrice));
      setSelectedIds(body.selection.picks.map((pick) => pick.itemId));
    } catch (error) {
      setRetrievalError(error instanceof Error ? error.message : "AI retrieval failed. Please retry.");
    } finally {
      setRetrieving(false);
    }
  }

  return (
    <section aria-label="Help me choose" className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#FDF8F9]/60">Less scrolling. Better decisions.</p>
        <h2 className="font-space-grotesk text-3xl font-medium tracking-tight">Which one is worth it?</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#FDF8F9]/75">
          Choose what matters, then compare up to three things you&apos;ve already saved.
          No new shopping rabbit holes.
        </p>
      </div>

      <form onSubmit={retrieve} className="rounded-xl border border-[#FDF8F9]/25 bg-[#FDF8F9]/5 p-4 sm:p-6">
        <label htmlFor={`${id}-query`} className="flex items-center gap-2 text-base font-medium">
          <Sparkles aria-hidden="true" className="h-4 w-4" /> Describe what you&apos;re deciding
        </label>
        <textarea id={`${id}-query`} value={query} maxLength={500} required disabled={retrieving}
          onChange={(event) => { setQuery(event.target.value); setGenerated(null); }}
          placeholder="Pick neutral everyday pieces under $100"
          rows={2}
          className="mt-3 w-full resize-y rounded-md border border-[#FDF8F9]/25 bg-[#38040E] px-3 py-3 text-sm placeholder:text-[#FDF8F9]/55 disabled:opacity-60" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={retrieving || !query.trim() || !manualRanked.length || invalidBudget}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#FDF8F9] px-4 text-sm font-medium text-[#38040E] disabled:opacity-50">
            <Sparkles aria-hidden="true" className="h-4 w-4" /> {retrieving ? "Picking saved pieces..." : "Pick from my closet"}
          </button>
          {selection && <button type="button" onClick={() => setGenerated(null)} className="min-h-11 text-sm underline underline-offset-4">Back to all pieces</button>}
        </div>
        <p className="mt-3 text-xs leading-5 text-[#FDF8F9]/65">
          Uses Gemini to select up to 3 saved IDs from {Math.min(manualRanked.length, 40)} eligible pieces.
          {manualRanked.length > 40 && " Limited to 40; narrow your category or search to consider other pieces."}
          {" "}Your prompt and product names, prices, categories and tags are sent to Gemini.
          Stored private notes, URLs and account details are not.
        </p>
        {retrievalError && <p role="alert" className="mt-3 text-sm text-red-200">{retrievalError}</p>}
        {selection && <p role="status" className="mt-3 text-sm text-[#FDF8F9]/80">
          {selection.picks.length ? `${selection.picks.length} AI-picked ${selection.picks.length === 1 ? "piece" : "pieces"} added to your shortlist.` : "No saved pieces match this request. Try another description."}
          {` Considered ${selection.considered} eligible saved pieces.`}
          {selection.maxPrice !== null && ` Interpreted price limit: $${selection.maxPrice.toFixed(2)} per item.`}
        </p>}
      </form>

      <details open={!selection} className="rounded-xl border border-[#FDF8F9]/15 bg-[#FDF8F9]/5 p-4 sm:p-6">
        <summary className="cursor-pointer text-sm font-medium">Fine-tune category, budget and priorities</summary>
        <div className="mt-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label htmlFor={`${id}-category`} className="text-sm">
            Compare within
            <select id={`${id}-category`} value={category} disabled={retrieving}
              onChange={(event) => { setCategory(event.target.value); setPriorities([]); setGenerated(null); }}
              className="mt-2 min-h-11 w-full rounded-md border border-[#FDF8F9]/25 bg-[#38040E] px-3 capitalize">
              <option value="All">All saved pieces</option>
              {categories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label htmlFor={`${id}-budget`} className="text-sm">
            Maximum price per item ($)
            <input id={`${id}-budget`} type="number" min="0" step="0.01"
              placeholder="No limit" value={budget} disabled={retrieving} onChange={(event) => { setBudget(event.target.value); setGenerated(null); }}
              aria-invalid={invalidBudget} aria-describedby={invalidBudget ? `${id}-budget-error` : undefined}
              className="mt-2 min-h-11 w-full rounded-md border border-[#FDF8F9]/25 bg-[#38040E] px-3 placeholder:text-[#FDF8F9]/50" />
          </label>
          <label htmlFor={`${id}-sort`} className="text-sm">
            Put first
            <select id={`${id}-sort`} value={sort} disabled={retrieving}
              onChange={(event) => { setSort(event.target.value === "price" ? "price" : "match"); setGenerated(null); }}
              className="mt-2 min-h-11 w-full rounded-md border border-[#FDF8F9]/25 bg-[#38040E] px-3">
              <option value="match">Matches my priorities</option>
              <option value="price">Lowest saved price</option>
            </select>
          </label>
        </div>
        {invalidBudget && <p id={`${id}-budget-error`} role="alert" className="mt-3 text-sm text-red-200">Enter a price limit of zero or more.</p>}
        {tags.length > 0 && (
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm text-[#FDF8F9]/80">What matters to you? Pick a few saved tags.</legend>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button type="button" key={tag} aria-pressed={priorities.includes(tag)} disabled={retrieving}
                  onClick={() => { setGenerated(null); setPriorities((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]); }}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs ${priorities.includes(tag) ? "border-[#FDF8F9] bg-[#FDF8F9] text-[#38040E]" : "border-[#FDF8F9]/25 text-[#FDF8F9]/85 hover:border-[#FDF8F9]/70"}`}>
                  {priorities.includes(tag) && <Check aria-hidden="true" className="h-3 w-3" />}{tag}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <p className="mt-4 text-xs leading-5 text-[#FDF8F9]/60">
          Recommendations use saved tags and prices, not product quality, reviews, or live availability.
          {maxPrice !== null && unknownPrices > 0 && ` ${unknownPrices} item(s) with unknown prices are excluded from your budget filter.`}
        </p>
        </div>
      </details>

      {selected.length > 0 && (
        <section aria-label="Compare shortlist" className="rounded-xl border border-[#FDF8F9]/25 bg-[#450A15] p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="inline-flex items-center gap-2 text-lg font-medium"><Scale aria-hidden="true" className="h-5 w-5" /> Your shortlist ({selected.length}/3)</h3>
            <button type="button" onClick={() => setSelectedIds([])} className="min-h-10 text-sm underline underline-offset-4">Clear shortlist</button>
          </div>
          {selected.length === 1 && <p className="mb-4 text-sm text-[#FDF8F9]/70">Add one more piece to compare them side by side.</p>}
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable comparison table">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Saved prices and tags for your shortlisted products</caption>
              <thead>
                <tr>
                  <th scope="col" className="p-2 text-xs font-normal text-[#FDF8F9]/60">Saved details</th>
                  {selected.map((item) => (
                    <th key={item.id} scope="col" className="min-w-40 p-2 font-medium">
                      {item.name ?? "Untitled item"}
                      <button type="button" aria-label={`Remove ${item.name ?? "item"} from comparison`} onClick={() => toggleCompare(item.id)} className="ml-2 inline-flex h-9 w-9 items-center justify-center">
                        <X aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[#FDF8F9]/80">
                <tr className="border-t border-[#FDF8F9]/15"><th scope="row" className="p-2 font-normal">Saved price</th>{selected.map((item) => <td key={item.id} className="p-2">{priceLabel(item.price)}</td>)}</tr>
                <tr className="border-t border-[#FDF8F9]/15"><th scope="row" className="p-2 font-normal">Your priorities</th>{selected.map((item) => <td key={item.id} className="p-2">{priorities.filter((tag) => item.tags.some((value) => value.trim().toLowerCase() === tag)).join(", ") || "No selected matches"}</td>)}</tr>
                <tr className="border-t border-[#FDF8F9]/15"><th scope="row" className="p-2 font-normal">Your notes</th>{selected.map((item) => <td key={item.id} className="p-2">{item.notes ?? "No notes yet"}</td>)}</tr>
                <tr className="border-t border-[#FDF8F9]/15"><th scope="row" className="p-2 font-normal">Within limit</th>{selected.map((item) => <td key={item.id} className="p-2">{invalidBudget ? "Invalid limit" : maxPrice === null ? "No limit set" : item.price === null ? "Unknown" : item.price <= maxPrice ? "Yes" : "Over budget"}</td>)}</tr>
                {!sample && <tr className="border-t border-[#FDF8F9]/15"><th scope="row" className="p-2 font-normal">Confirm details</th>{selected.map((item) => <td key={item.id} className="p-2"><a href={item.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Visit product</a></td>)}</tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#FDF8F9]/65 sm:hidden">Swipe sideways to compare each piece.</p>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#FDF8F9]/75">
        <p role="status">{ranked.length} saved {ranked.length === 1 ? "piece" : "pieces"} to consider{priorities.length && !matched.length ? " - none match your selected tags yet." : "."}</p>
        {dismissedIds.length > 0 && <button type="button" onClick={() => setDismissedIds([])} className="min-h-10 underline underline-offset-4">Show set-aside pieces</button>}
      </div>
      {!ranked.length && (
        <div className="rounded-xl border border-dashed border-[#FDF8F9]/25 p-8 text-center">
          <p className="text-lg">{items.length ? "Nothing fits these filters yet." : "Save a couple of pieces to get started."}</p>
          <p className="mt-2 text-sm text-[#FDF8F9]/65">{items.length ? "Try a different category, raise your limit, or show pieces you set aside." : "Your recommendations will come from your own wishlist."}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {ranked.map(({ item, matchedPriorities, reasons }) => (
          <article key={item.id} aria-label={item.name ?? "Untitled item"} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#FDF8F9]/15 bg-[#FDF8F9]/5">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#450A15]">
              <ProductImage src={sample ? item.image_url : resolveProductImageUrl(item.image_url, item.url)} alt={item.name ?? "Saved product"} className={sample ? "object-cover" : "object-contain"} />
              {best === item.id && <span className="absolute bottom-3 left-3 rounded-full bg-[#FDF8F9] px-3 py-1.5 text-xs font-medium text-[#38040E]">Top tag match</span>}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
              <p className="text-xs capitalize text-[#FDF8F9]/60">{item.category ?? "Uncategorized"}</p>
              <h3 className="text-sm font-medium leading-5 sm:text-base">{item.name ?? "Untitled item"}</h3>
              <p className="text-sm">{priceLabel(item.price)}</p>
              {reasons.length > 0 ? (
                <ul className="space-y-1 text-xs leading-5 text-[#FDF8F9]/75">{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              ) : <p className="text-xs leading-5 text-[#FDF8F9]/65">Pick priorities above to find your best fit.</p>}
              {matchedPriorities.length > 0 && <p className="text-xs text-[#FDF8F9]/60">{matchedPriorities.length} of {priorities.length} priorities matched</p>}
              <div className="mt-auto flex flex-col gap-2 pt-2">
                <button type="button" aria-pressed={selectedIds.includes(item.id)}
                  aria-label={`${selectedIds.includes(item.id) ? "Unshortlist" : "Shortlist"} ${item.name ?? "item"}`}
                  disabled={selected.length >= 3 && !selectedIds.includes(item.id)}
                  onClick={() => toggleCompare(item.id)}
                  className={`min-h-11 rounded-md border px-2 text-sm disabled:opacity-40 ${selectedIds.includes(item.id) ? "border-[#FDF8F9] bg-[#FDF8F9] text-[#38040E]" : "border-[#FDF8F9]/40 hover:bg-[#FDF8F9]/10"}`}>
                  {selectedIds.includes(item.id) ? "In shortlist" : selected.length >= 3 ? "Shortlist full" : "Shortlist"}
                </button>
                <button type="button" onClick={() => {
                  setDismissedIds((current) => [...current, item.id]);
                  setSelectedIds((current) => current.filter((key) => key !== item.id));
                }} className="min-h-10 text-xs text-[#FDF8F9]/65 underline underline-offset-4">Not this time</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
