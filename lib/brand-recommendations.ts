import type { Item } from "@/app/closet/item-card";

type Brand = {
  name: string;
  domain: string;
  categories: string[];
  tags: string[];
  aliases?: string[];
};

export type ShoppingVisit = {
  id: string;
  domain: string;
  created_at: string;
};

export type BrandRecommendation = {
  name: string;
  domain: string;
  url: string;
  reason: string;
  kind: "familiar" | "discover" | "starter";
};

export const SHOPPING_HISTORY_DAYS = 30;
export const MAX_SHOPPING_VISITS = 200;

const BRANDS: Brand[] = [
  { name: "COS", domain: "cos.com", categories: ["clothing", "accessories"], tags: ["minimal", "neutral", "work"] },
  { name: "Everlane", domain: "everlane.com", categories: ["clothing", "shoes"], tags: ["neutral", "everyday", "work"] },
  { name: "Uniqlo", domain: "uniqlo.com", categories: ["clothing"], tags: ["everyday", "layering", "neutral"] },
  { name: "Aritzia", domain: "aritzia.com", categories: ["clothing"], tags: ["work", "layering", "everyday"] },
  { name: "Madewell", domain: "madewell.com", categories: ["clothing", "bags", "shoes"], tags: ["denim", "leather", "everyday"] },
  { name: "Reformation", domain: "thereformation.com", categories: ["clothing", "shoes"], tags: ["dress", "floral", "going out"] },
  { name: "Acne Studios", domain: "acnestudios.com", categories: ["clothing", "bags"], tags: ["denim", "layering", "leather"] },
  { name: "Miu Miu", domain: "miumiu.com", categories: ["clothing", "bags", "shoes"], tags: ["leather", "going out"] },
  { name: "The Row", domain: "therow.com", categories: ["clothing", "bags"], tags: ["minimal", "neutral", "leather"] },
  { name: "Khaite", domain: "khaite.com", categories: ["clothing", "bags"], tags: ["denim", "leather", "neutral"] },
  { name: "Bottega Veneta", domain: "bottegaveneta.com", categories: ["bags", "shoes", "accessories"], tags: ["leather", "going out"] },
  { name: "Toteme", domain: "toteme.com", aliases: ["toteme-studio.com"], categories: ["clothing", "bags"], tags: ["minimal", "neutral", "layering"] },
  { name: "Nike", domain: "nike.com", categories: ["clothing", "shoes", "fitness"], tags: ["athletic", "running", "everyday"] },
  { name: "Adidas", domain: "adidas.com", categories: ["clothing", "shoes", "fitness"], tags: ["athletic", "running", "everyday"] },
  { name: "Allbirds", domain: "allbirds.com", categories: ["shoes"], tags: ["everyday", "walking", "neutral"] },
  { name: "Birkenstock", domain: "birkenstock.com", categories: ["shoes"], tags: ["everyday", "leather", "sandals"] },
  { name: "BAGGU", domain: "baggu.com", categories: ["bags", "accessories"], tags: ["colorful", "everyday", "travel"] },
  { name: "Dagne Dover", domain: "dagnedover.com", categories: ["bags"], tags: ["work", "travel", "everyday"] },
  { name: "Mejuri", domain: "mejuri.com", categories: ["accessories"], tags: ["jewelry", "gold", "silver", "everyday"] },
  { name: "Glossier", domain: "glossier.com", categories: ["makeup", "skincare", "fragrance"], tags: ["everyday", "lip balm", "gloss"] },
  { name: "The Ordinary", domain: "theordinary.com", categories: ["skincare", "haircare"], tags: ["serum", "moisturizer", "cleanser"] },
  { name: "Sephora", domain: "sephora.com", categories: ["makeup", "skincare", "haircare", "fragrance"], tags: ["gloss", "serum", "perfume"] },
  { name: "Ulta Beauty", domain: "ulta.com", categories: ["makeup", "skincare", "haircare", "fragrance"], tags: ["gloss", "serum", "perfume"] },
  { name: "MUJI", domain: "muji.com", aliases: ["muji.us"], categories: ["home", "clothing"], tags: ["minimal", "neutral", "everyday"] },
  { name: "IKEA", domain: "ikea.com", categories: ["home"], tags: ["minimal", "storage", "everyday"] },
  { name: "West Elm", domain: "westelm.com", categories: ["home"], tags: ["wood", "neutral", "decor"] },
  { name: "Apple", domain: "apple.com", categories: ["tech"], tags: ["laptop", "phone", "headphones"] },
  { name: "Best Buy", domain: "bestbuy.com", categories: ["tech"], tags: ["laptop", "phone", "headphones"] },
  { name: "REI", domain: "rei.com", categories: ["fitness", "clothing", "shoes"], tags: ["outdoors", "hiking", "travel"] },
  { name: "Bookshop", domain: "bookshop.org", categories: ["books"], tags: ["reading", "fiction"] },
  { name: "Barnes & Noble", domain: "barnesandnoble.com", categories: ["books"], tags: ["reading", "fiction"] },
  { name: "LEGO", domain: "lego.com", categories: ["toys"], tags: ["building", "creative"] },
  { name: "Thrive Market", domain: "thrivemarket.com", categories: ["food"], tags: ["pantry", "snacks"] },
];

export function shoppingDomainFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!host.includes(".") || host.length > 253 || /^[\d.]+$/.test(host) || host.includes(":")) return null;
    const brand = BRANDS.find((entry) => [entry.domain, ...(entry.aliases ?? [])]
      .some((domain) => host === domain || host.endsWith(`.${domain}`)));
    return brand?.domain ?? host;
  } catch {
    return null;
  }
}

export function recommendBrands(
  items: Pick<Item, "url" | "category" | "tags">[],
  visits: ShoppingVisit[],
): { personalized: boolean; brands: BrandRecommendation[] } {
  const saved = new Map<string, number>();
  const opened = new Map<string, number>();
  const categories = new Map<string, number>();
  const tags = new Map<string, number>();
  const savedCategories = new Set<string>();
  const savedTags = new Set<string>();
  const add = (map: Map<string, number>, key: string, weight: number) =>
    map.set(key, Math.min(20, (map.get(key) ?? 0) + weight));

  for (const item of items) {
    const domain = shoppingDomainFromUrl(item.url);
    if (!domain) continue;
    saved.set(domain, (saved.get(domain) ?? 0) + 1);
    if (item.category) {
      add(categories, item.category, 4);
      savedCategories.add(item.category);
    }
    for (const tag of new Set(item.tags.map((value) => value.trim().toLowerCase()).filter(Boolean))) {
      add(tags, tag, 2);
      savedTags.add(tag);
    }
  }
  for (const visit of visits) {
    const domain = shoppingDomainFromUrl(`https://${visit.domain}`);
    if (domain && domain === visit.domain) opened.set(domain, Math.min(3, (opened.get(domain) ?? 0) + 1));
  }

  const historyDomains = new Set([...saved.keys(), ...opened.keys()]);
  const knownHistory = BRANDS.filter((brand) => historyDomains.has(brand.domain));
  for (const brand of knownHistory) {
    const weight = Math.min(3, (saved.get(brand.domain) ?? 0) + (opened.get(brand.domain) ?? 0));
    for (const category of brand.categories) add(categories, category, weight);
    for (const tag of brand.tags) add(tags, tag, weight);
  }

  if (!historyDomains.size) {
    const starters = ["cos.com", "nike.com", "baggu.com", "sephora.com", "ikea.com", "bookshop.org"];
    return {
      personalized: false,
      brands: starters.flatMap((domain) => {
        const brand = BRANDS.find((entry) => entry.domain === domain);
        return brand ? [{
          name: brand.name, domain, url: `https://${domain}`,
          reason: "A place to start. Save a piece to make this personal.",
          kind: "starter" as const,
        }] : [];
      }),
    };
  }

  const familiar = [...historyDomains].map((domain) => {
    const known = BRANDS.find((brand) => brand.domain === domain);
    const count = saved.get(domain) ?? 0;
    return {
      name: known?.name ?? domain,
      domain,
      url: `https://${domain}`,
      reason: count ? `${count} ${count === 1 ? "piece" : "pieces"} saved from this shop.` : "You opened this shop from Closetful.",
      kind: "familiar" as const,
      score: Math.min(count, 5) * 6 + (opened.get(domain) ?? 0) * 8,
    };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const discoveries = BRANDS.filter((brand) => !historyDomains.has(brand.domain)).map((brand) => {
    const categoryScore = Math.max(0, ...brand.categories.map((category) => categories.get(category) ?? 0));
    const tagScore = brand.tags.map((tag) => tags.get(tag) ?? 0).sort((a, b) => b - a).slice(0, 2)
      .reduce((sum, score) => sum + score, 0);
    const category = brand.categories.find((value) => savedCategories.has(value));
    const tag = brand.tags.find((value) => savedTags.has(value));
    const related = knownHistory.map((source) => ({
      source,
      overlap: brand.categories.filter((value) => source.categories.includes(value)).length +
        brand.tags.filter((value) => source.tags.includes(value)).length,
    })).sort((a, b) => b.overlap - a.overlap)[0];
    const reason = tag ? `Matches "${tag}" in your saved pieces.`
      : category ? `Matches your saved ${category}.`
        : related?.overlap ? `Similar to ${related.source.name} in your shop history.`
          : "";
    return {
      name: brand.name, domain: brand.domain, url: `https://${brand.domain}`,
      reason, kind: "discover" as const,
      score: categoryScore ? categoryScore + tagScore : categories.size ? 0 : tagScore,
    };
  }).filter((brand) => brand.score > 0 && brand.reason)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const brands: BrandRecommendation[] = [];
  for (let index = 0; brands.length < 6 && (index < familiar.length || index < discoveries.length); index++) {
    if (familiar[index] && brands.length < 6) brands.push(familiar[index]);
    if (discoveries[index] && brands.length < 6) brands.push(discoveries[index]);
  }
  return { personalized: true, brands };
}
