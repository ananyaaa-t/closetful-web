import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shoppingDomainFromUrl } from "@/lib/brand-recommendations";
import { isRateLimited } from "@/lib/rate-limit";
import { getSiteOrigin } from "@/lib/site-origin";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== await getSiteOrigin()) {
    return NextResponse.json({ error: "Open shops from Closetful to record a visit." }, { status: 403 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log in again to save shopping activity." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const domain = typeof body?.domain === "string" ? shoppingDomainFromUrl(`https://${body.domain}`) : null;
  if (!domain || domain !== body.domain) {
    return NextResponse.json({ error: "A valid shop domain is required." }, { status: 400 });
  }
  if (isRateLimited(`shopping:${user.id}`)) {
    return NextResponse.json({ error: "Shopping activity is being saved too quickly. Please wait a few minutes." }, { status: 429 });
  }
  const { data, error } = await supabase.from("shopping_activity")
    .insert({ user_id: user.id, domain })
    .select("id, domain, created_at").single();
  if (error) {
    console.error("Closetful couldn't record shopping activity:", error.code);
    return NextResponse.json({ error: "This shop visit couldn't be saved. You can still shop normally." }, { status: 503 });
  }
  return NextResponse.json({ visit: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== await getSiteOrigin()) {
    return NextResponse.json({ error: "Clear shopping activity from Closetful." }, { status: 403 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log in again to clear shopping activity." }, { status: 401 });
  const { error } = await supabase.from("shopping_activity").delete().eq("user_id", user.id);
  if (error) {
    console.error("Closetful couldn't clear shopping activity:", error.code);
    return NextResponse.json({ error: "Shopping activity couldn't be cleared. Please retry." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
