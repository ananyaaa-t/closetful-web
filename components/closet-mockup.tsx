import Image from "next/image";
import Link from "next/link";
import { DEMO_CATALOG } from "@/lib/demo-catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ClosetMockup() {
  return (
    <Card className="w-full max-w-3xl gap-0 p-4 shadow-2xl shadow-black/40 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs text-white/65">A sample closet. Try it for yourself.</span>
        <Button asChild variant="link" size="sm"><Link href="/demo">Open demo</Link></Button>
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
    </Card>
  );
}
