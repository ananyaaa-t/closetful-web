import { NextResponse } from "next/server";
import { saveItemForUser } from "@/lib/save-item";
import { getAuthedClientAndUser, CORS_HEADERS } from "@/lib/api-auth";

/**
 * POST /api/items — save an item from a pasted URL. Accepts either the web
 * app's session cookie or `Authorization: Bearer <token>` (used by the
 * Chrome extension, which runs on a different origin).
 */
export async function POST(request: Request) {
  const { supabase, user } = await getAuthedClientAndUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url) {
    return NextResponse.json(
      { error: "A URL is required." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Optional pre-scraped metadata (sent by the Chrome extension, which
  // reads the product page's DOM directly in the browser — see
  // lib/save-item.ts for why this matters).
  const providedMetadata =
    body?.name || body?.image_url || body?.price
      ? {
          name: typeof body.name === "string" ? body.name : null,
          image_url: typeof body.image_url === "string" ? body.image_url : null,
          price: typeof body.price === "number" ? body.price : null,
        }
      : undefined;

  const result = await saveItemForUser(supabase, user.id, url, providedMetadata);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { item: result.item },
    { status: 201, headers: CORS_HEADERS }
  );
}

export async function GET(request: Request) {
  const { supabase, user } = await getAuthedClientAndUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ items: data }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
