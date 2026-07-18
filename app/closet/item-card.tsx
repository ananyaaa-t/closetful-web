"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { deleteItem, updateItem, type UpdateItemState } from "@/app/actions/items";
import { hostnameFromUrl } from "@/lib/brand";

export type Item = {
  id: string;
  url: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  tags: string[];
};

const initialState: UpdateItemState = { error: null };

export function ItemCard({ item }: { item: Item }) {
  const boundDelete = deleteItem.bind(null, item.id);
  const boundUpdate = updateItem.bind(null, item.id);
  const [state, formAction, pending] = useActionState(boundUpdate, initialState);
  const missingDetails = !item.name || !item.image_url;
  const [editing, setEditing] = useState(false);

  const [imgError, setImgError] = useState(false);

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-black/20">
        {item.image_url && !imgError ? (
          <Image
            src={item.image_url}
            alt={item.name ?? "Saved item"}
            fill
            unoptimized
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
            No image
          </div>
        )}
        <form
          action={boundDelete}
          className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <button
            type="submit"
            aria-label="Remove item"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white hover:bg-black/70"
          >
            ×
          </button>
        </form>
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium text-white">
          {item.name ?? "Untitled item"}
        </p>
        {item.price !== null && (
          <p className="shrink-0 text-sm text-white/80">${item.price.toFixed(2)}</p>
        )}
      </div>

      <p className="mt-1 text-[11px] uppercase tracking-wider text-white/40">
        {hostnameFromUrl(item.url)}
      </p>

      {item.category && (
        <span className="mt-1.5 w-fit rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70">
          {item.category}
        </span>
      )}

      {item.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] text-white/50"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {missingDetails && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1.5 w-fit text-[11px] text-white/40 underline underline-offset-2 hover:text-white/70"
        >
          Add details
        </button>
      )}

      {editing && (
        <form action={formAction} className="mt-2 flex flex-col gap-1.5">
          <input
            name="name"
            defaultValue={item.name ?? ""}
            placeholder="Item name"
            className="rounded-md border border-white/15 bg-transparent px-2 py-1 text-xs text-white outline-none placeholder:text-white/30 focus:border-white/40"
          />
          <input
            name="price"
            type="number"
            step="0.01"
            defaultValue={item.price ?? ""}
            placeholder="Price"
            className="rounded-md border border-white/15 bg-transparent px-2 py-1 text-xs text-white outline-none placeholder:text-white/30 focus:border-white/40"
          />
          <input
            name="image_url"
            defaultValue={item.image_url ?? ""}
            placeholder="Image URL"
            className="rounded-md border border-white/15 bg-transparent px-2 py-1 text-xs text-white outline-none placeholder:text-white/30 focus:border-white/40"
          />
          {state.error && <p className="text-xs text-red-300">{state.error}</p>}
          <div className="flex gap-1.5">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 rounded-full border border-white/25 py-2 text-center text-xs font-medium uppercase tracking-wider text-white/80 transition-colors hover:border-white/60 hover:text-white"
      >
        Open
      </a>
    </div>
  );
}
