"use client";

import { useRef, useState } from "react";
import {
  MAX_SHOPPING_VISITS, shoppingDomainFromUrl, type ShoppingVisit,
} from "@/lib/brand-recommendations";

export function useShoppingActivity(initialVisits: ShoppingVisit[], initialError: string | null) {
  const [visits, setVisits] = useState(initialVisits);
  const [readError, setReadError] = useState(initialError);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const clearingRef = useRef(false);
  const pending = useRef(new Set<Promise<void>>());

  function recordVisit(url: string) {
    const domain = shoppingDomainFromUrl(url);
    if (!domain || clearingRef.current) return;
    const request = (async () => {
      try {
        const response = await fetch("/api/shopping-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
          keepalive: true,
          signal: AbortSignal.timeout(10000),
        });
        const body: { visit?: ShoppingVisit; error?: string } = await response.json();
        if (!response.ok || !body.visit) throw new Error(body.error ?? "This shop visit couldn't be saved.");
        const visit = body.visit;
        setVisits((current) => [visit, ...current]
          .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, MAX_SHOPPING_VISITS));
        setWriteError(null);
      } catch (error) {
        console.warn("Closetful couldn't save shopping activity:", error);
        setWriteError(error instanceof Error ? error.message : "Shopping activity couldn't be saved.");
      }
    })();
    pending.current.add(request);
    void request.finally(() => pending.current.delete(request));
  }

  async function clearHistory() {
    clearingRef.current = true;
    setClearing(true);
    try {
      await Promise.all([...pending.current]);
      const response = await fetch("/api/shopping-activity", {
        method: "DELETE", signal: AbortSignal.timeout(15000),
      });
      const body: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error ?? "Shopping activity couldn't be cleared.");
      setVisits([]);
      setReadError(null);
      setWriteError(null);
    } catch (error) {
      console.warn("Closetful couldn't clear shopping activity:", error);
      setWriteError(error instanceof Error ? error.message : "Shopping activity couldn't be cleared.");
    } finally {
      clearingRef.current = false;
      setClearing(false);
    }
  }

  return { visits, error: writeError ?? readError, clearing, recordVisit, clearHistory };
}
