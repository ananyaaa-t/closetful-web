"use client";

import { useId, useMemo, useState } from "react";
import { Check, ChevronDown, Scale, Sparkles, X } from "lucide-react";
import type { Item } from "@/app/closet/item-card";
import { ProductImage } from "@/components/product-image";
import { resolveProductImageUrl } from "@/lib/product-image";
import { rankSavedItems, type DecisionPreferences } from "@/lib/recommendations";
import type { RetrievalSelection } from "@/lib/generative-retrieval";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

function priceLabel(price: number | null) {
  return price === null ? "Price unknown" : `$${price.toFixed(2)}`;
}

export function DecisionDesk({ items, sample = false }: { items: Item[]; sample?: boolean; }) {
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
    return entry ? [{
      ...entry, reasons: [
        "AI selected this saved piece",
        ...pick.savedTags.map((tag) => `Saved tag: "${tag}"`),
        ...entry.reasons,
      ]
    }] : [];
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
      const body: { selection?: RetrievalSelection; error?: string; } = await response.json();
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

      <Card className="p-4 sm:p-6">
        <form onSubmit={retrieve}>
          <Label htmlFor={`${id}-query`} className="text-base leading-6">
            <Sparkles aria-hidden="true" className="h-4 w-4" /> Describe what you&apos;re deciding
          </Label>
          <Textarea id={`${id}-query`} value={query} maxLength={500} required disabled={retrieving}
            onChange={(event) => { setQuery(event.target.value); setGenerated(null); }}
            placeholder="Pick neutral everyday pieces under $100"
            rows={2}
            className="mt-3 resize-y" />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={retrieving || !query.trim() || !manualRanked.length || invalidBudget}>
              <Sparkles aria-hidden="true" className="h-4 w-4" /> {retrieving ? "Picking saved pieces..." : "Pick from my closet"}
            </Button>
            {selection && <Button type="button" variant="link" onClick={() => setGenerated(null)}>Back to all pieces</Button>}
          </div>
          <p className="mt-3 text-xs leading-5 text-[#FDF8F9]/65">
            Uses Gemini to select up to 3 saved IDs from {Math.min(manualRanked.length, 40)} eligible pieces.
            {manualRanked.length > 40 && " Limited to 40; narrow your category or search to consider other pieces."}
            {" "}Your prompt and product names, prices, categories and tags are sent to Gemini.
            Stored private notes, URLs and account details are not.
          </p>
          {retrievalError && <Alert variant="destructive" className="mt-3"><AlertDescription>{retrievalError}</AlertDescription></Alert>}
          {selection && <p role="status" className="mt-3 text-sm text-[#FDF8F9]/80">
            {selection.picks.length ? `${selection.picks.length} AI-picked ${selection.picks.length === 1 ? "piece" : "pieces"} added to your shortlist.` : "No saved pieces match this request. Try another description."}
            {` Considered ${selection.considered} eligible saved pieces.`}
            {selection.maxPrice !== null && ` Interpreted price limit: $${selection.maxPrice.toFixed(2)} per item.`}
          </p>}
        </form>
      </Card>

      <Collapsible key={selection ? "picked" : "manual"} defaultOpen={!selection} asChild>
        <Card className="gap-0 p-4 sm:p-6">
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="group h-auto min-h-11 w-full justify-between whitespace-normal text-left">
              Fine-tune category, budget and priorities
              <ChevronDown aria-hidden="true" className="transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent forceMount className="data-[state=closed]:hidden">
            <div className="mt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor={`${id}-category`}>
                    Compare within
                  </Label>
                  <NativeSelect id={`${id}-category`} value={category} disabled={retrieving}
                    onChange={(event) => { setCategory(event.target.value); setPriorities([]); setGenerated(null); }}
                    className="mt-2 w-full capitalize">
                    <NativeSelectOption value="All">All saved pieces</NativeSelectOption>
                    {categories.map((value) => <NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}
                  </NativeSelect>
                </div>
                <div>
                  <Label htmlFor={`${id}-budget`}>
                    Maximum price per item ($)
                  </Label>
                  <Input id={`${id}-budget`} type="number" min="0" step="0.01"
                    placeholder="No limit" value={budget} disabled={retrieving} onChange={(event) => { setBudget(event.target.value); setGenerated(null); }}
                    aria-invalid={invalidBudget} aria-describedby={invalidBudget ? `${id}-budget-error` : undefined}
                    className="mt-2" />
                </div>
                <div>
                  <Label htmlFor={`${id}-sort`}>
                    Put first
                  </Label>
                  <NativeSelect id={`${id}-sort`} value={sort} disabled={retrieving}
                    onChange={(event) => { setSort(event.target.value === "price" ? "price" : "match"); setGenerated(null); }}
                    className="mt-2 w-full">
                    <NativeSelectOption value="match">Matches my priorities</NativeSelectOption>
                    <NativeSelectOption value="price">Lowest saved price</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>
              {invalidBudget && <Alert id={`${id}-budget-error`} variant="destructive" className="mt-3"><AlertDescription>Enter a price limit of zero or more.</AlertDescription></Alert>}
              {tags.length > 0 && (
                <fieldset className="mt-5">
                  <legend className="mb-2 text-sm text-[#FDF8F9]/80">What matters to you? Pick a few saved tags.</legend>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Button type="button" key={tag} aria-pressed={priorities.includes(tag)} disabled={retrieving}
                        variant={priorities.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setGenerated(null); setPriorities((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]); }}
                      >
                        {priorities.includes(tag) && <Check aria-hidden="true" className="h-3 w-3" />}{tag}
                      </Button>
                    ))}
                  </div>
                </fieldset>
              )}
              <p className="mt-4 text-xs leading-5 text-[#FDF8F9]/60">
                Recommendations use saved tags and prices, not product quality, reviews, or live availability.
                {maxPrice !== null && unknownPrices > 0 && ` ${unknownPrices} item(s) with unknown prices are excluded from your budget filter.`}
              </p>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {selected.length > 0 && (
        <Card role="region" aria-label="Compare shortlist" className="gap-0 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="inline-flex items-center gap-2 text-lg font-medium"><Scale aria-hidden="true" className="h-5 w-5" /> Your shortlist ({selected.length}/3)</h3>
            <Button type="button" variant="link" onClick={() => setSelectedIds([])}>Clear shortlist</Button>
          </div>
          {selected.length === 1 && <p className="mb-4 text-sm text-[#FDF8F9]/70">Add one more piece to compare them side by side.</p>}
          <Table containerProps={{ tabIndex: 0, role: "region", "aria-label": "Scrollable comparison table" }}>
            <TableCaption className="sr-only">Saved prices and tags for your shortlisted products</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="text-xs font-normal text-muted-foreground">Saved details</TableHead>
                {selected.map((item) => (
                  <TableHead key={item.id} scope="col" className="min-w-40 whitespace-normal p-2">
                    {item.name ?? "Untitled item"}
                    <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${item.name ?? "item"} from comparison`} onClick={() => toggleCompare(item.id)} className="ml-2">
                      <X aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="text-muted-foreground">
              <TableRow><TableHead scope="row" className="font-normal">Saved price</TableHead>{selected.map((item) => <TableCell key={item.id}>{priceLabel(item.price)}</TableCell>)}</TableRow>
              <TableRow><TableHead scope="row" className="font-normal">Your priorities</TableHead>{selected.map((item) => <TableCell key={item.id} className="whitespace-normal">{priorities.filter((tag) => item.tags.some((value) => value.trim().toLowerCase() === tag)).join(", ") || "No selected matches"}</TableCell>)}</TableRow>
              <TableRow><TableHead scope="row" className="font-normal">Your notes</TableHead>{selected.map((item) => <TableCell key={item.id} className="whitespace-normal">{item.notes ?? "No notes yet"}</TableCell>)}</TableRow>
              <TableRow><TableHead scope="row" className="font-normal">Within limit</TableHead>{selected.map((item) => <TableCell key={item.id}>{invalidBudget ? "Invalid limit" : maxPrice === null ? "No limit set" : item.price === null ? "Unknown" : item.price <= maxPrice ? "Yes" : "Over budget"}</TableCell>)}</TableRow>
              {!sample && <TableRow><TableHead scope="row" className="font-normal">Confirm details</TableHead>{selected.map((item) => <TableCell key={item.id}><Button asChild variant="link" size="sm" className="px-0"><a href={item.url} target="_blank" rel="noopener noreferrer" data-shopping-link>Visit product</a></Button></TableCell>)}</TableRow>}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-[#FDF8F9]/65 sm:hidden">Swipe sideways to compare each piece.</p>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#FDF8F9]/75">
        <p role="status">{ranked.length} saved {ranked.length === 1 ? "piece" : "pieces"} to consider{priorities.length && !matched.length ? " - none match your selected tags yet." : "."}</p>
        {dismissedIds.length > 0 && <Button type="button" variant="link" onClick={() => setDismissedIds([])}>Show set-aside pieces</Button>}
      </div>
      {!ranked.length && (
        <div className="rounded-xl border border-dashed border-[#FDF8F9]/25 p-8 text-center">
          <p className="text-lg">{items.length ? "Nothing fits these filters yet." : "Save a couple of pieces to get started."}</p>
          <p className="mt-2 text-sm text-[#FDF8F9]/65">{items.length ? "Try a different category, raise your limit, or show pieces you set aside." : "Your recommendations will come from your own wishlist."}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {ranked.map(({ item, matchedPriorities, reasons }) => (
          <Card key={item.id} role="article" aria-label={item.name ?? "Untitled item"} className="min-w-0 gap-0 p-0">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#450A15]">
              <ProductImage src={sample ? item.image_url : resolveProductImageUrl(item.image_url, item.url)} alt={item.name ?? "Saved product"} className={sample ? "object-cover" : "object-contain"} />
              {best === item.id && <Badge className="absolute bottom-3 left-3">Top tag match</Badge>}
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
                <Button type="button" aria-pressed={selectedIds.includes(item.id)}
                  variant={selectedIds.includes(item.id) ? "default" : "outline"}
                  aria-label={`${selectedIds.includes(item.id) ? "Unshortlist" : "Shortlist"} ${item.name ?? "item"}`}
                  disabled={selected.length >= 3 && !selectedIds.includes(item.id)}
                  onClick={() => toggleCompare(item.id)}
                >
                  {selectedIds.includes(item.id) ? "In shortlist" : selected.length >= 3 ? "Shortlist full" : "Shortlist"}
                </Button>
                <Button type="button" variant="link" size="sm" onClick={() => {
                  setDismissedIds((current) => [...current, item.id]);
                  setSelectedIds((current) => current.filter((key) => key !== item.id));
                }}>Not this time</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
