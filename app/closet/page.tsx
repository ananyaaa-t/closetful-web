import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { ClosetBoard } from "@/app/closet/closet-board";
import { ExtensionSync } from "@/app/closet/extension-sync";
import { ensureShareProfile } from "@/lib/share";
import { getSiteOrigin } from "@/lib/site-origin";

export default async function ClosetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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
        items={items ?? []}
        userEmail={user.email ?? ""}
        logout={logout}
        isPublic={shareProfile.isPublic}
        shareUrl={shareUrl}
      />
    </div>
  );
}
