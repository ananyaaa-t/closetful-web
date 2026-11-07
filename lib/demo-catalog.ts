import type { Item } from "@/app/closet/item-card";

export const DEMO_CATALOG: Item[] = [
  { id: "coat", url: "https://example.com/coat", name: "Camel belted coat", price: 180, image_url: "/demo/coat.jpg", category: "clothing", tags: ["neutral", "layering", "work"], notes: "For cold morning commutes." },
  { id: "jacket", url: "https://example.com/jacket", name: "Black leather jacket", price: 145, image_url: "/demo/jacket.jpg", category: "clothing", tags: ["black", "leather", "layering"], notes: "Could replace the jacket I rarely wear." },
  { id: "sweater", url: "https://example.com/sweater", name: "Cream knit sweater", price: 65, image_url: "/demo/sweater.jpg", category: "clothing", tags: ["neutral", "layering", "everyday"], notes: "Easy to pair with my jeans." },
  { id: "bag", url: "https://example.com/bag", name: "Tan leather tote", price: 85, image_url: "/demo/bag.jpg", category: "bags", tags: ["neutral", "leather", "work"], notes: "Need to check if my laptop fits." },
  { id: "handbag", url: "https://example.com/handbag", name: "Black quilted shoulder bag", price: 120, image_url: "/demo/handbag.jpg", category: "bags", tags: ["black", "leather"], notes: "An option for going out." },
  { id: "backpack", url: "https://example.com/backpack", name: "Everyday backpack", price: 55, image_url: "/demo/backpack.jpg", category: "bags", tags: ["everyday", "travel"], notes: "Hands free for travel." },
  { id: "shoes", url: "https://example.com/shoes", name: "Black suede loafers", price: 95, image_url: "/demo/shoes.jpg", category: "shoes", tags: ["black", "work", "everyday"], notes: "Try these on before buying." },
  { id: "jewelry", url: "https://example.com/jewelry", name: "Silver hoop earrings", price: 35, image_url: "/demo/jewelry.jpg", category: "accessories", tags: ["silver", "everyday"], notes: null },
];

export const DEMO_PHOTO_CREDITS = [
  ["Coat", "1539533113208-f6df8cc8b543"],
  ["Jacket", "1551028719-00167b16eac5"],
  ["Sweater", "1631541909061-71e349d1f203"],
  ["Tote", "1624687943971-e86af76d57de"],
  ["Handbag", "1548036328-c9fa89d128fa"],
  ["Backpack", "1553062407-98eeb64c6a62"],
  ["Loafers", "1761726065663-6e550c25a6ef"],
  ["Earrings", "1600721391776-b5cd0e0048f9"],
] as const;
