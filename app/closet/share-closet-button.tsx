"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Share2, Copy, Check, RefreshCw, X } from "lucide-react";
import { setClosetSharing, regenerateShareLink, type ShareActionState } from "@/app/actions/profile";

const initialState: ShareActionState = { error: null };

export function ShareClosetButton({
  isPublic,
  shareUrl,
}: {
  isPublic: boolean;
  shareUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(setClosetSharing, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [copied, setCopied] = useState(false);
  const [regenPending, startRegenTransition] = useTransition();

  function handleToggle() {
    const form = formRef.current;
    if (!form) return;
    const input = form.elements.namedItem("isPublic") as HTMLInputElement;
    input.value = String(!isPublic);
    form.requestSubmit();
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRegenerate() {
    startRegenTransition(async () => {
      await regenerateShareLink();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-[#FDF8F9]/20 px-3.5 py-1.5 text-[11px] uppercase tracking-wider text-[#FDF8F9]/70 transition-colors hover:border-[#FDF8F9]/40 hover:text-[#FDF8F9]"
      >
        <Share2 className="h-3 w-3" /> Share Closet
      </button>

      {open && (
        <>
          {/* Click-away layer: sits below the panel but above everything
              else, so clicking outside the panel closes it. */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-lg border border-[#FDF8F9]/10 bg-[#450A15] p-4 shadow-2xl shadow-black/40">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-[#FDF8F9]">Share your closet</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-[#FDF8F9]/40 hover:text-[#FDF8F9]/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <form ref={formRef} action={formAction}>
              <input type="hidden" name="isPublic" defaultValue={String(isPublic)} />
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-xs text-[#FDF8F9]/60">
                  {isPublic ? "Anyone with the link can view" : "Only you can see your closet"}
                </span>
                <button
                  type="button"
                  onClick={handleToggle}
                  disabled={pending}
                  role="switch"
                  aria-checked={isPublic}
                  className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                    isPublic ? "bg-[#FDF8F9]" : "bg-[#FDF8F9]/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#38040E] transition-transform ${
                      isPublic ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </form>
            {state.error && <p className="mt-2 text-xs text-red-300">{state.error}</p>}

            {isPublic && (
              <div className="mt-4 flex flex-col gap-2 border-t border-[#FDF8F9]/6 pt-4">
                <div className="flex items-center gap-2 rounded-md border border-[#FDF8F9]/10 bg-[#38040E] px-2.5 py-2">
                  <span className="flex-1 truncate text-xs text-[#FDF8F9]/60">{shareUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-shrink-0 text-[#FDF8F9]/50 hover:text-[#FDF8F9]/90"
                    aria-label="Copy link"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenPending}
                  className="flex w-fit items-center gap-1.5 text-[11px] text-[#FDF8F9]/35 underline underline-offset-2 hover:text-[#FDF8F9]/70 disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" /> {regenPending ? "Generating…" : "Generate new link"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
