import type { Item } from "@/app/closet/item-card";

export type DecisionPreferences = {
  category: string;
  maxPrice: number | null;
  priorities: string[];
  sort: "match" | "price";
};

export type Recommendation = {
  item: Item;
  matchedPriorities: string[];
  reasons: string[];
};

export function rankSavedItems(items: Item[], preferences: DecisionPreferences): Recommendation[] {
  const priorities = [...new Set(preferences.priorities.map((tag) => tag.trim().toLowerCase()))]
    .filter(Boolean);
  const ranked = items
    .filter((item) => {
      if (preferences.category !== "All" && item.category !== preferences.category) return false;
      if (preferences.maxPrice !== null) {
        return item.price !== null && Number.isFinite(item.price) &&
          item.price >= 0 && item.price <= preferences.maxPrice;
      }
      return true;
    })
    .map((item) => {
      const tags = new Set(item.tags.map((tag) => tag.trim().toLowerCase()));
      const matchedPriorities = priorities.filter((tag) => tags.has(tag));
      const reasons = matchedPriorities.map((tag) => `Matches "${tag}"`);
      if (preferences.maxPrice !== null && item.price !== null) {
        reasons.push(`$${(preferences.maxPrice - item.price).toFixed(2)} below your limit`);
      }
      if (priorities.length && !matchedPriorities.length) {
        reasons.push("No selected priorities match its saved tags");
      }
      if (item.price === null) reasons.push("Price unknown; check the store before deciding");
      return { item, matchedPriorities, reasons };
    });

  return ranked.sort((a, b) => {
    if (preferences.sort === "match") {
      const difference = b.matchedPriorities.length - a.matchedPriorities.length;
      if (difference) return difference;
      // Without explicit priorities, don't pretend recency is a personalized match.
      return 0;
    }
    return (a.item.price ?? Infinity) - (b.item.price ?? Infinity);
  });
}
