/** Derives a display-friendly brand label from a saved item's URL, e.g.
 * "https://www.nike.com/..." -> "NIKE". Used to power the brand filter tabs. */
export function brandFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    const label = parts.length > 2 ? parts[parts.length - 2] : parts[0];
    return label.toUpperCase();
  } catch {
    return "OTHER";
  }
}

export function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
