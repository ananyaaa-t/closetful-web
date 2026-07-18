const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const CATEGORIES = [
  "clothing",
  "shoes",
  "bags",
  "accessories",
  "makeup",
  "skincare",
  "haircare",
  "fragrance",
  "tech",
  "home",
  "fitness",
  "books",
  "food",
  "toys",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type CategorizationResult = {
  category: Category;
  tags: string[];
};

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    category: { type: "STRING", enum: CATEGORIES as unknown as string[] },
    tags: {
      type: "ARRAY",
      items: { type: "STRING" },
      maxItems: 5,
    },
  },
  required: ["category", "tags"],
};

/**
 * Auto-categorizes a saved item using Gemini's free-tier structured output
 * (JSON schema-constrained response). Calls the REST API directly rather
 * than the `@google/genai` SDK: the SDK's client hit an intermittent
 * per-project `SERVICE_DISABLED` permission error with newer "auth key"
 * style Gemini keys, while plain REST calls with the same key worked
 * reliably in testing. Returns null (rather than throwing) if the API key
 * is missing or the call fails, so the save flow never blocks on this being
 * unavailable — categorization is a nice-to-have layered on top of the core
 * save loop, not a dependency.
 */
export async function categorizeItem(input: {
  name: string | null;
  url: string;
  price: number | null;
}): Promise<CategorizationResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [
        {
          text: "You categorize saved shopping items for a wishlist app. `category` is a broad classification of what the item fundamentally IS — pick exactly one from the fixed list (e.g. a lip gloss is \"makeup\", not \"beauty\"; a moisturizer is \"skincare\"; a handbag is \"bags\", not \"accessories\"). `tags` are specific, concrete descriptors of the item itself — product type, brand, material, color, or style (e.g. \"lip balm\", \"gloss\", \"nike\", \"leather\", \"cropped\") — up to 5, short and lowercase. Never put a category-like word in tags, and never put a specific product-type word as the category.",
        },
      ],
    },
    contents: [
      {
        parts: [
          {
            text: `Item name: ${input.name ?? "(unknown)"}\nURL: ${input.url}\nPrice: ${
              input.price ?? "(unknown)"
            }`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  // Gemini occasionally returns a transient 503 ("high demand") or 429 —
  // Google's own error message recommends retrying, so back off briefly and
  // retry a couple of times before giving up gracefully.
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(GEMINI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(15000),
        body: requestBody,
      });

      if (!res.ok) {
        const isRetryable = res.status === 503 || res.status === 429;
        const body = await res.text();
        console.error(`categorizeItem failed (attempt ${attempt}/${maxAttempts}):`, res.status, body);
        if (isRetryable && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, attempt * 750));
          continue;
        }
        return null;
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;

      const parsed = JSON.parse(text) as { category: string; tags: unknown };

      if (!CATEGORIES.includes(parsed.category as Category)) return null;

      return {
        category: parsed.category as Category,
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.filter((t): t is string => typeof t === "string").slice(0, 5)
          : [],
      };
    } catch (err) {
      console.error(`categorizeItem failed (attempt ${attempt}/${maxAttempts}):`, err);
      if (attempt === maxAttempts) return null;
      await new Promise((r) => setTimeout(r, attempt * 750));
    }
  }

  return null;
}
