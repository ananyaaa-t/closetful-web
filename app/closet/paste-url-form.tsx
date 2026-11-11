"use client";

import { useActionState, useRef, useEffect } from "react";
import { saveItem, type SaveItemState } from "@/app/actions/items";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <Input
        name="url"
        type="url"
        required
        placeholder="Paste a product URL…"
        aria-label="Product URL"
        className="h-11 flex-1"
      />
      <Button
        type="submit"
        disabled={pending}
      >
        {pending ? "Saving…" : "Save"}
      </Button>
      {state.error && (
        <Alert variant="destructive" className="sm:absolute sm:mt-12">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
