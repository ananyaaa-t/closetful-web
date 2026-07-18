"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID;

/**
 * Pushes the current Supabase session to the Closetful Chrome extension
 * whenever the user logs in/out here on the web app, so the extension is
 * automatically logged in too — no separate login required in the popup.
 *
 * Uses Chrome's `externally_connectable` messaging: the extension's
 * manifest allow-lists this origin, which lets `chrome.runtime.sendMessage`
 * reach its background service worker directly from a normal web page.
 * If the extension isn't installed, this is a harmless no-op (Chrome sets
 * `chrome.runtime.lastError`, which we swallow).
 */
export function ExtensionSync() {
  useEffect(() => {
    if (!EXTENSION_ID) {
      console.warn("[ExtensionSync] NEXT_PUBLIC_EXTENSION_ID is not set");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chromeRuntime = (window as any).chrome?.runtime;
    if (typeof chromeRuntime?.sendMessage !== "function") {
      console.warn(
        "[ExtensionSync] chrome.runtime.sendMessage not available — extension not installed, or this page was open before the extension loaded (try reloading the tab)."
      );
      return;
    }

    console.info("[ExtensionSync] chrome.runtime detected, will sync session to extension", EXTENSION_ID);

    const supabase = createClient();

    function sendToExtension(message: Record<string, unknown>) {
      try {
        chromeRuntime.sendMessage(EXTENSION_ID, message, (response: unknown) => {
          if (chromeRuntime.lastError) {
            console.warn("[ExtensionSync] sendMessage error:", chromeRuntime.lastError.message);
            return;
          }
          console.info("[ExtensionSync] sendMessage response:", response);
        });
      } catch (err) {
        console.warn("[ExtensionSync] sendMessage threw:", err);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.info("[ExtensionSync] initial session present?", !!session);
      if (session) {
        sendToExtension({
          type: "CLOSETFUL_SESSION",
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: (session.expires_at ?? 0) * 1000,
          },
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.info("[ExtensionSync] auth state change:", event);
      if (event === "SIGNED_OUT") {
        sendToExtension({ type: "CLOSETFUL_LOGOUT" });
      } else if (session) {
        sendToExtension({
          type: "CLOSETFUL_SESSION",
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: (session.expires_at ?? 0) * 1000,
          },
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
