import { NextResponse } from "next/server";
import type { Item } from "@/app/closet/item-card";
import { getAuthedClientAndUser } from "@/lib/api-auth";
import { DEMO_CATALOG } from "@/lib/demo-catalog";
import { generateSavedItemPicks, MAX_RETRIEVAL_ITEMS } from "@/lib/generative-retrieval";
import { isRateLimited } from "@/lib/rate-limit";
import { rankSavedItems } from "@/lib/recommendations";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Use AI retrieval from Closetful." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || !["demo", "closet"].includes(body.mode) ||
    typeof body.query !== "string" || !body.query.trim() || body.query.length > 500 ||
    !Array.isArray(body.itemIds) || !body.itemIds.every((id: unknown) => typeof id === "string") ||
    body.itemIds.length > MAX_RETRIEVAL_ITEMS ||
    typeof body.category !== "string" || body.category.length > 100 ||
    (body.maxPrice !== null && (typeof body.maxPrice !== "number" || !Number.isFinite(body.maxPrice) || body.maxPrice < 0)) ||
    !Array.isArray(body.priorities) || body.priorities.length > 12 ||
    !body.priorities.every((tag: unknown) => typeof tag === "string" && tag.length <= 100)) {
    return NextResponse.json({ error: "Enter a request and valid filters for up to 40 saved pieces." }, { status: 400 });
  }

  let items: Item[];
  let rateKey: string;
  if (body.mode === "demo") {
    items = DEMO_CATALOG.filter((item) => body.itemIds.includes(item.id));
    rateKey = `retrieve:demo:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"}`;
  } else {
    const { supabase, user } = await getAuthedClientAndUser(request);
    if (!user) return NextResponse.json({ error: "Log in to retrieve your saved pieces." }, { status: 401 });
    const { data, error } = await supabase.from("items")
      .select("id, url, name, price, image_url, category, tags, notes")
      .eq("user_id", user.id)
      .in("id", body.itemIds);
    if (error) {
      console.error("Closetful couldn't load the retrieval catalog:", error.code);
      return NextResponse.json({ error: "Your saved pieces couldn't be loaded. Please retry." }, { status: 503 });
    }
    items = data ?? [];
    rateKey = `retrieve:user:${user.id}`;
  }
  if (new Set(body.itemIds).size !== body.itemIds.length || items.length !== body.itemIds.length) {
    return NextResponse.json({ error: "One or more pieces aren't available in this closet." }, { status: 400 });
  }
  if (isRateLimited(rateKey)) {
    return NextResponse.json({ error: "Too many AI requests. Please wait a few minutes." }, { status: 429 });
  }
  const constraints = { category: body.category, maxPrice: body.maxPrice, priorities: body.priorities };
  const candidates = rankSavedItems(items, { ...constraints, sort: "match" }).map((entry) => entry.item);
  const result = await generateSavedItemPicks(body.query.trim(), candidates, constraints, request.signal);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 503 });
  return NextResponse.json({ selection: result.selection });
}
