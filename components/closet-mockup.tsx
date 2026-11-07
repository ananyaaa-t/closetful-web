import Image from "next/image";
import Link from "next/link";
import { DEMO_CATALOG } from "@/lib/demo-catalog";

export function ClosetMockup() {
  return (
    <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs text-white/65">A sample closet. Try it for yourself.</span>
        <Link href="/demo" className="min-h-10 py-2 text-xs text-white underline underline-offset-4">Open demo</Link>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
        {DEMO_CATALOG.slice(0, 6).map((item) => (
          <div key={item.id} className="flex flex-col">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-[#450A15]">
              <Image src={item.image_url!} alt={item.name ?? "Sample piece"} fill
                sizes="(min-width: 640px) 16vw, 33vw" className="object-cover" />
            </div>
            <p className="mt-2 truncate text-[11px] font-medium text-white/90">{item.name}</p>
            <p className="text-[11px] text-white/65">${item.price}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-white/50">Illustrative pieces and prices. Licensed stock photos, not live listings.</p>
    </div>
  );
}
