import Image from "next/image";

const MOCK_ITEMS: {
  name: string;
  price: string;
  category: string;
  // Free-license (Unsplash License) stock photos of generic item types —
  // not photos of any specific retailer's product listing.
  image: string;
}[] = [
  {
    name: "Wool Overcoat",
    price: "$420",
    category: "Outerwear",
    image: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543",
  },
  {
    name: "Leather Tote",
    price: "$185",
    category: "Bags",
    image: "https://images.unsplash.com/photo-1624687943971-e86af76d57de",
  },
  {
    name: "Suede Loafers",
    price: "$210",
    category: "Shoes",
    image: "https://images.unsplash.com/photo-1761726065663-6e550c25a6ef",
  },
  {
    name: "Cashmere Sweater",
    price: "$260",
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1631541909061-71e349d1f203",
  },
  {
    name: "Gold Hoops",
    price: "$68",
    category: "Jewelry",
    image: "https://images.unsplash.com/photo-1600721391776-b5cd0e0048f9",
  },
  {
    name: "Silk Scarf",
    price: "$95",
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1606259458027-54d2a728b6ab",
  },
];

/** A static, illustrative mockup of the `/closet` grid experience so
 * visitors can see the save → organize → browse experience before signing
 * up. Uses free-license (Unsplash License) stock photos of generic item
 * types — deliberately NOT real screenshots or photos scraped from any
 * specific retailer, which would be copyrighted product photography.
 * Mirrors the card layout used by `ItemCard` in the real closet. */
export function ClosetMockup() {
  return (
    <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6">
      {/* Fake browser chrome to frame the mockup as "the product" */}
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <span className="ml-3 text-[11px] uppercase tracking-wider text-white/30">
          your closet
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
        {MOCK_ITEMS.map((item) => (
          <div key={item.name} className="flex flex-col">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-[#450A15]">
              <Image
                src={`${item.image}?w=400&auto=format&fit=crop&q=60`}
                alt=""
                fill
                sizes="(min-width: 640px) 16vw, 33vw"
                className="object-cover"
              />
            </div>
            <p className="mt-2 truncate text-[11px] font-medium text-white/90">
              {item.name}
            </p>
            <p className="text-[11px] text-white/50">{item.price}</p>
            <span className="mt-1 w-fit rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/60">
              {item.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
