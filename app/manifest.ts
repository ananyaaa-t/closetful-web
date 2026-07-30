import type { MetadataRoute } from "next";

/**
 * PWA manifest. Enables "Add to Home Screen" on both Android and iOS, and
 * registers Closetful as a native Share Target on Android — installed
 * Android/Chrome users can tap "Share" on any link (Instagram, TikTok,
 * a store's product page, etc.) and pick "Closetful" to save it instantly.
 *
 * iOS Safari does not support the Web Share Target API (even for
 * home-screen-installed PWAs), so this only creates a share-sheet entry on
 * Android — iPhone users still get "Add to Home Screen" but should use the
 * paste-URL flow on /closet to save items. See app/save/page.tsx, which
 * already accepts `?url=` from the bookmarklet and now also serves as the
 * share_target destination below (GET requests reuse the same handler).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Closetful",
    short_name: "closetful.",
    description:
      "Save anything you want from anywhere on the internet, organized automatically in one place.",
    start_url: "/closet",
    display: "standalone",
    background_color: "#38040E",
    theme_color: "#38040E",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    share_target: {
      action: "/save",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}
