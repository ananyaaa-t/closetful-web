import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hostnameFromUrl } from "@/lib/brand";
import { ProductImage } from "@/components/product-image";
import { resolveProductImageUrl } from "@/lib/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SharedItem = {
  id: string;
  url: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
};

/**
 * Public, read-only view of a user's closet — no auth required. Reachable
 * only via the unguessable `share_token` from the "Share Closet" panel on
 * /closet, and only while that user has sharing turned on: the lookup
 * below relies entirely on the `profiles`/`items` "public can view" RLS
 * policies (see the add_share_closet migration), not on any check in this
 * component. If the owner turns sharing off, this same code path simply
 * finds no matching row and falls through to the "not available" state.
 */
export default async function SharedClosetPage({
  params,
}: PageProps<"/shared/[token]">) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("share_token", token)
    .maybeSingle();

  if (!profile) {
    return (
      <Shell>
        <p className="text-lg text-[#FDF8F9]">This closet isn&apos;t available.</p>
        <p className="max-w-xs text-center text-sm text-[#FDF8F9]/50">
          The link may be expired, or the owner has turned off sharing.
        </p>
      </Shell>
    );
  }

  const { data: items } = await supabase
    .from("items")
    .select("id, url, name, price, image_url, category")
    .eq("user_id", profile.user_id)
    .order("created_at", { ascending: false });

  const list = (items ?? []) as SharedItem[];

  return (
    <div className="flex min-h-screen flex-col bg-[#38040E] font-sans text-[#FDF8F9] selection:bg-[#FDF8F9]/15">
      <header className="flex items-center justify-between border-b border-[#FDF8F9]/6 px-6 py-5 sm:px-10">
        <Link href="/" className="text-xl font-semibold lowercase tracking-tight text-[#FDF8F9]">
          closetful.
        </Link>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#FDF8F9]/30">
          Shared closet
        </span>
      </header>

      <main className="flex flex-1 flex-col px-6 py-10 sm:px-10">
        {list.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-lg text-[#FDF8F9]/70">Nothing saved here yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
            {list.map((item) => (
              <SharedItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SharedItemCard({ item }: { item: SharedItem; }) {
  const price = item.price !== null ? `$${item.price.toFixed(2)}` : null;
  const name = item.name ?? "Untitled item";

  return (
    <Card className="gap-0 p-0">
      <div className="relative mb-3 aspect-[4/5] w-full overflow-hidden bg-[#450A15]">
        <ProductImage src={resolveProductImageUrl(item.image_url, item.url)} alt={name} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-3 pb-4">
        {item.category && (
          <Badge variant="secondary" className="capitalize">
            {item.category}
          </Badge>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-[12.5px] font-light leading-snug text-[#FDF8F9]/90">
          {name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-1">
          {price && <span className="text-[13px] font-medium text-[#FDF8F9]">{price}</span>}
          <span className="tracking-wide text-[10px] text-[#FDF8F9]/35">{hostnameFromUrl(item.url)}</span>
        </div>
        <Button asChild variant="outline" className="mt-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open
          </a>
        </Button>
      </div>
    </Card>
  );
}

function Shell({ children }: { children: React.ReactNode; }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#38040E] px-6 py-10 text-center">
      {children}
    </div>
  );
}
