import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { ClosetBoard } from "@/app/closet/closet-board";
import { ExtensionSync } from "@/app/closet/extension-sync";

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
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#38040E] font-sans text-[#FDF8F9] selection:bg-[#FDF8F9]/15">
      <ExtensionSync />
      <ClosetBoard items={items ?? []} userEmail={user.email ?? ""} logout={logout} />
    </div>
  );
}
