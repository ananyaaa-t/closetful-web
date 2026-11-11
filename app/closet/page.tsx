import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { ClosetBoard } from "@/app/closet/closet-board";
import { ExtensionSync } from "@/app/closet/extension-sync";
import { ensureShareProfile } from "@/lib/share";
import { getSiteOrigin } from "@/lib/site-origin";
import { MAX_SHOPPING_VISITS, SHOPPING_HISTORY_DAYS } from "@/lib/brand-recommendations";

async function loadShoppingVisits(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const since = new Date(Date.now() - SHOPPING_HISTORY_DAYS * 86400000).toISOString();
  return supabase.from("shopping_activity").select("id, domain, created_at").eq("user_id", userId)
    .gte("created_at", since).order("created_at", { ascending: false }).limit(MAX_SHOPPING_VISITS);
}

export default async function ClosetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: items }, { data: shoppingVisits, error: shoppingError }] = await Promise.all([
    supabase.from("items").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    loadShoppingVisits(supabase, user.id),
  ]);
  if (shoppingError) console.error("Closetful couldn't load shopping activity:", shoppingError.code);

  // Ensures a share profile row exists so the "Share Closet" panel always
  // has a link ready to show, even before the user has ever turned sharing
  // on. Computed here (Server Component) rather than client-side so the
  // full shareable URL is correct for whatever origin this request is
  // actually running on (production, preview, or local dev).
  const shareProfile = await ensureShareProfile(supabase, user.id);
  const siteOrigin = await getSiteOrigin();
  const shareUrl = `${siteOrigin}/shared/${shareProfile.shareToken}`;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#38040E] font-sans text-[#FDF8F9] selection:bg-[#FDF8F9]/15">
      <ExtensionSync />
      <ClosetBoard
        key={user.id}
        items={items ?? []}
        userEmail={user.email ?? ""}
        logout={logout}
        isPublic={shareProfile.isPublic}
        shareUrl={shareUrl}
        shoppingVisits={shoppingVisits ?? []}
        shoppingHistoryError={shoppingError ? "Shopping history couldn't be loaded. These suggestions use your saved pieces only." : null}
      />
    </div>
  );
}
