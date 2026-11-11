"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import { Share2, Copy, Check, RefreshCw, X } from "lucide-react";
import { setClosetSharing, regenerateShareLink, type ShareActionState } from "@/app/actions/profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

const initialState: ShareActionState = { error: null };

export function ShareClosetButton({
  isPublic,
  shareUrl,
}: {
  isPublic: boolean;
  shareUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const [state, formAction, pending] = useActionState(setClosetSharing, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const sharingInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [regenPending, startRegenTransition] = useTransition();

  function handleToggle(checked: boolean) {
    if (!sharingInputRef.current) return;
    sharingInputRef.current.value = String(checked);
    formRef.current?.requestSubmit();
  }

  async function handleCopy() {
    setCopyError(null);
    setCopied(false);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Couldn't copy the link. Select it below and copy it manually.");
    }
  }

  function handleRegenerate() {
    startRegenTransition(async () => {
      await regenerateShareLink();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          <Share2 aria-hidden="true" /> Share Closet
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-labelledby={`${id}-title`} className="w-80 max-w-[calc(100vw-2rem)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <PopoverTitle id={`${id}-title`}>Share your closet</PopoverTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <form ref={formRef} action={formAction}>
          <input ref={sharingInputRef} type="hidden" name="isPublic" defaultValue={String(isPublic)} />
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${id}-sharing`} className="text-xs leading-5 text-muted-foreground">
              {isPublic ? "Anyone with the link can view" : "Only you can see your closet"}
            </Label>
            <Switch
              id={`${id}-sharing`}
              checked={isPublic}
              onCheckedChange={handleToggle}
              disabled={pending}
            />
          </div>
        </form>
        {state.error && <Alert variant="destructive"><AlertDescription>{state.error}</AlertDescription></Alert>}

        {isPublic && (
          <div className="mt-4 flex flex-col gap-2 border-t pt-4">
            <div className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-2">
              <span className="min-w-0 flex-1 select-text break-all text-xs text-muted-foreground">{shareUrl}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleCopy}
                aria-label="Copy link"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <span role="status" className="sr-only">{copied ? "Link copied" : ""}</span>
            {copyError && <Alert variant="destructive"><AlertDescription>{copyError}</AlertDescription></Alert>}
            <Button
              type="button"
              variant="link"
              onClick={handleRegenerate}
              disabled={regenPending}
              className="w-fit px-0"
            >
              <RefreshCw className="h-3 w-3" /> {regenPending ? "Generating…" : "Generate new link"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
