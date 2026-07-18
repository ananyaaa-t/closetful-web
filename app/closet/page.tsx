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
    <div className="flex flex-1 flex-col bg-[#3a0d1a]">
      <ExtensionSync />
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-10">
        <span className="text-xl font-semibold lowercase tracking-tight text-white">
          closetful.
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="text-xs uppercase tracking-wider text-white/50 hover:text-white/80"
          >
            Log out · {user.email}
          </button>
        </form>
      </header>

      <ClosetBoard items={items ?? []} />
    </div>
  );
}
