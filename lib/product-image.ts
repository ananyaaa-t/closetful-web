export function resolveProductImageUrl(
  raw: string | null | undefined,
  pageUrl: string
): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim(), pageUrl);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

export function isAmazonProductUrl(url: string): boolean {
  try {
    return /(^|\.)amazon\.(com|ca|co\.uk|de|fr|it|es|co\.jp|in|com\.au)$/.test(
      new URL(url).hostname
    );
  } catch {
    return false;
  }
}
