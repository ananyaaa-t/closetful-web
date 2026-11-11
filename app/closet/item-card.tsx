"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ExternalLink, X } from "lucide-react";
import { deleteItem, updateItem, refreshItemImage, type UpdateItemState } from "@/app/actions/items";
import { hostnameFromUrl, brandFromUrl } from "@/lib/brand";
import { ProductImage } from "@/components/product-image";
import { resolveProductImageUrl } from "@/lib/product-image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type Item = {
  id: string;
  url: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  tags: string[];
  notes: string | null;
};

type ItemCardViewMode = "grid" | "list" | "recent";

const initialState: UpdateItemState = { error: null };

// How long the "confirm remove?" state stays armed before reverting back
// to the normal × button, if the user doesn't click again.
const CONFIRM_TIMEOUT_MS = 3000;

function CategoryTag({ label }: { label: string; }) {
  return (
    <Badge variant="secondary" className="capitalize">
      {label}
    </Badge>
  );
}

export function ItemCard({ item, viewMode }: { item: Item; viewMode: ItemCardViewMode; }) {
  const boundUpdate = updateItem.bind(null, item.id);
  const [state, formAction, pending] = useActionState(boundUpdate, initialState);
  const [photoState, photoAction, refreshingPhoto] = useActionState(
    refreshItemImage.bind(null, item.id),
    initialState
  );
  const missingDetails = !item.name || !item.image_url;
  const [editing, setEditing] = useState(false);

  // Deleting is permanent (hard delete, no trash/undo in the DB), so a
  // single misclick shouldn't be able to remove an item — require a
  // second click within a few seconds to actually confirm.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      confirmTimeoutRef.current = setTimeout(() => {
        setConfirmingDelete(false);
      }, CONFIRM_TIMEOUT_MS);
      return;
    }

    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    startDeleteTransition(async () => {
      await deleteItem(item.id);
    });
  }

  const category = item.category ?? "Uncategorized";
  const price = item.price !== null ? `$${item.price.toFixed(2)}` : null;
  const source = hostnameFromUrl(item.url);
  const name = item.name ?? "Untitled item";

  const editForm = editing && (
    <form action={formAction} className="mt-2 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Input
        name="name"
        aria-label="Item name"
        defaultValue={item.name ?? ""}
        placeholder="Item name"
      />
      <Input
        name="price"
        aria-label="Price"
        type="number"
        step="0.01"
        defaultValue={item.price ?? ""}
        placeholder="Price"
      />
      <Input
        name="image_url"
        aria-label="Image URL"
        defaultValue={item.image_url ?? ""}
        placeholder="Image URL"
      />
      {state.error && <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>}
      <div className="flex gap-1.5">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  const addDetailsButton = !editing && (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={() => setEditing(true)}
        className="px-0"
      >
        {missingDetails ? "Add details" : "Edit details"}
      </Button>
      <form action={photoAction}>
        <Button
          type="submit"
          variant="link"
          size="sm"
          disabled={refreshingPhoto}
          className="px-0"
        >
          {refreshingPhoto ? "Finding photo..." : "Fix photo"}
        </Button>
      </form>
      {photoState.error && <Alert variant="destructive"><AlertDescription>{photoState.error}</AlertDescription></Alert>}
    </div>
  );

  const image = <ProductImage src={resolveProductImageUrl(item.image_url, item.url)} alt={name} />;

  if (viewMode === "recent") {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" data-shopping-link className="group flex flex-col">
        <div className="relative mb-2.5 aspect-[4/5] w-full overflow-hidden bg-[#450A15]">
          {image}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#38040E]/60 to-transparent" />
          <div className="absolute bottom-2.5 left-2.5">
            <CategoryTag label={category} />
          </div>
        </div>
        <p className="line-clamp-1 text-[11.5px] font-light text-[#FDF8F9]/80">{name}</p>
        {price && <p className="mt-0.5 text-[11px] text-[#FDF8F9]/45">{price}</p>}
      </a>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="group flex items-center gap-5 border-b border-[#FDF8F9]/6 px-1 py-4 transition-colors duration-150 hover:bg-[#FDF8F9]/3">
        <div className="relative h-[70px] w-14 flex-shrink-0 overflow-hidden bg-[#450A15]">{image}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-light leading-snug text-[#FDF8F9]/85">{name}</p>
          <p className="mt-0.5 truncate text-[10px] tracking-wide text-[#FDF8F9]/35">
            {brandFromUrl(item.url)} · {source}
          </p>
          {item.notes && (
            <p className="mt-1 line-clamp-1 text-[11px] italic text-[#FDF8F9]/40">{item.notes}</p>
          )}
          {editForm}
          {addDetailsButton}
        </div>
        <CategoryTag label={category} />
        {price && (
          <span className="w-20 flex-shrink-0 text-right text-[13px] font-medium text-[#FDF8F9]">{price}</span>
        )}
        <Button
          type="button"
          variant={confirmingDelete ? "destructive" : "ghost"}
          size="sm"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          aria-label={confirmingDelete ? "Confirm remove item" : "Remove item"}
        >
          {confirmingDelete ? (isDeleting ? "Removing…" : "Confirm?") : "Remove"}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a
            href={item.url}
            data-shopping-link
            target="_blank"
            rel="noopener noreferrer"
          >
            Open <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </Button>
      </div>
    );
  }

  // Grid view (default)
  return (
    <Card className="group gap-0 p-0">
      <div className="relative mb-3 aspect-[4/5] w-full overflow-hidden bg-[#450A15]">
        {image}
        <Button
          type="button"
          variant={confirmingDelete ? "destructive" : "secondary"}
          size={confirmingDelete ? "sm" : "icon"}
          onClick={handleDeleteClick}
          disabled={isDeleting}
          aria-label={confirmingDelete ? "Confirm remove item" : "Remove from closet"}
          className={`absolute right-2.5 top-2.5 ${confirmingDelete
              ? "opacity-100"
              : "opacity-100 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            }`}
        >
          {confirmingDelete ? (isDeleting ? "Removing…" : "Confirm?") : <X className="h-3 w-3" />}
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-3 pb-4">
        <CategoryTag label={category} />
        <h3 className="mt-0.5 line-clamp-2 text-[12.5px] font-light leading-snug text-[#FDF8F9]/90">
          {name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-1">
          {price && <span className="text-[13px] font-medium text-[#FDF8F9]">{price}</span>}
          <span className="tracking-wide text-[10px] text-[#FDF8F9]/35">{source}</span>
        </div>
        {item.notes && (
          <p className="line-clamp-2 text-[11px] italic text-[#FDF8F9]/40">{item.notes}</p>
        )}
        {editForm}
        {addDetailsButton}
        <Button asChild variant="outline" className="mt-2">
          <a
            href={item.url}
            data-shopping-link
            target="_blank"
            rel="noopener noreferrer"
          >
            Open <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </Button>
      </div>
    </Card>
  );
}
