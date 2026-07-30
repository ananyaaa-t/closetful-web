"use client";

import { useActionState, useRef, useEffect } from "react";
import { saveItem, type SaveItemState } from "@/app/actions/items";

const initialState: SaveItemState = { error: null };

export function PasteUrlForm() {
  const [state, formAction, pending] = useActionState(saveItem, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
    }
  }, [pending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full flex-col gap-2 sm:flex-row"
    >
      <input
        name="url"
        type="url"
        required
        placeholder="Paste a product URL…"
        className="flex-1 rounded-lg border border-[#FDF8F9]/15 bg-transparent px-3 py-2.5 text-sm text-[#FDF8F9] outline-none placeholder:text-[#FDF8F9]/40 focus:border-[#FDF8F9]/40"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#FDF8F9] px-5 py-2.5 text-sm font-medium text-[#38040E] transition-colors hover:bg-[#FDF8F9]/85 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state.error && (
        <p className="text-sm text-red-300 sm:absolute sm:mt-12">{state.error}</p>
      )}
    </form>
  );
}
