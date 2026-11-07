"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ExternalLink, X } from "lucide-react";
import { deleteItem, updateItem, refreshItemImage, type UpdateItemState } from "@/app/actions/items";
import { hostnameFromUrl, brandFromUrl } from "@/lib/brand";
import { ProductImage } from "@/components/product-image";
import { resolveProductImageUrl } from "@/lib/product-image";

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

function CategoryTag({ label }: { label: string }) {
  return (
    <span className="inline-block w-fit rounded-sm bg-[#FDF8F9]/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[#FDF8F9]/70 capitalize">
      {label}
    </span>
  );
}

export function ItemCard({ item, viewMode }: { item: Item; viewMode: ItemCardViewMode }) {
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
      <input
        name="name"
        defaultValue={item.name ?? ""}
        placeholder="Item name"
        className="rounded-sm border border-[#FDF8F9]/15 bg-transparent px-2 py-1 text-xs text-[#FDF8F9] outline-none placeholder:text-[#FDF8F9]/30 focus:border-[#FDF8F9]/40"
      />
      <input
        name="price"
        type="number"
        step="0.01"
        defaultValue={item.price ?? ""}
        placeholder="Price"
        className="rounded-sm border border-[#FDF8F9]/15 bg-transparent px-2 py-1 text-xs text-[#FDF8F9] outline-none placeholder:text-[#FDF8F9]/30 focus:border-[#FDF8F9]/40"
      />
      <input
        name="image_url"
        defaultValue={item.image_url ?? ""}
        placeholder="Image URL"
        className="rounded-sm border border-[#FDF8F9]/15 bg-transparent px-2 py-1 text-xs text-[#FDF8F9] outline-none placeholder:text-[#FDF8F9]/30 focus:border-[#FDF8F9]/40"
      />
      {state.error && <p className="text-xs text-red-300">{state.error}</p>}
      <div className="flex gap-1.5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#FDF8F9] px-3 py-1 text-xs font-medium text-[#38040E] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-[#FDF8F9]/20 px-3 py-1 text-xs text-[#FDF8F9]/70"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const addDetailsButton = !editing && (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="min-h-8 text-[#FDF8F9]/70 underline underline-offset-4"
      >
        {missingDetails ? "Add details" : "Edit details"}
      </button>
      <form action={photoAction}>
        <button
          type="submit"
          disabled={refreshingPhoto}
          className="min-h-8 text-[#FDF8F9]/70 underline underline-offset-4 disabled:opacity-50"
        >
          {refreshingPhoto ? "Finding photo..." : "Fix photo"}
        </button>
      </form>
      {photoState.error && <p role="alert" className="w-full text-red-200">{photoState.error}</p>}
    </div>
  );

  const image = <ProductImage src={resolveProductImageUrl(item.image_url, item.url)} alt={name} />;

  if (viewMode === "recent") {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col">
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
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          aria-label={confirmingDelete ? "Confirm remove item" : "Remove item"}
          className={`flex-shrink-0 rounded-full text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 ${
            confirmingDelete
              ? "bg-red-600 px-2 py-1 text-white hover:bg-red-500"
              : "text-[#FDF8F9]/30 hover:text-[#FDF8F9]/70"
          }`}
        >
          {confirmingDelete ? (isDeleting ? "Removing…" : "Confirm?") : "Remove"}
        </button>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-shrink-0 items-center gap-1 text-[10px] uppercase tracking-widest text-[#FDF8F9]/40 transition-colors hover:text-[#FDF8F9]/80"
        >
          Open <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="group flex cursor-pointer flex-col">
      <div className="relative mb-3 aspect-[4/5] w-full overflow-hidden bg-[#450A15]">
        {image}
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          aria-label={confirmingDelete ? "Confirm remove item" : "Remove from closet"}
          className={`absolute right-2.5 top-2.5 flex h-11 items-center justify-center rounded-full bg-[#38040E]/70 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 ${
            confirmingDelete
              ? "w-auto gap-1 bg-red-600/90 px-2 text-[10px] text-white opacity-100"
              : "w-11 text-[#FDF8F9]/70 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          }`}
        >
          {confirmingDelete ? (isDeleting ? "Removing…" : "Confirm?") : <X className="h-3 w-3" />}
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-0.5">
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
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 border border-[#FDF8F9]/12 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[#FDF8F9]/60 transition-all duration-200 hover:border-[#FDF8F9]/30 hover:text-[#FDF8F9]/90"
        >
          Open <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
