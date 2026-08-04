import { NextResponse } from "next/server";
import { categorizeItem } from "@/lib/categorize";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuthedClientAndUser, CORS_HEADERS } from "@/lib/api-auth";

/**
 * POST /api/categorize — suggests a category for a not-yet-saved item, so
 * the extension's and mobile's "preview before save" panels can show a
 * real AI suggestion in the category dropdown instead of a hardcoded
 * default. Read-only: nothing is written to the database here. The actual
 * save (POST /api/items) still accepts whatever category the user leaves
 * selected — if it differs from this suggestion, the user's choice wins.
 *
 * Shares the same per-user rate limit as saving, since this costs a real
 * Gemini call just like categorization-on-save does.
 */
export async function POST(request: Request) {
  const { user } = await getAuthedClientAndUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { category: null, tags: [] },
      { status: 200, headers: CORS_HEADERS }
    );
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : null;
  const url = typeof body?.url === "string" ? body.url : "";
  const price = typeof body?.price === "number" ? body.price : null;

  if (!url) {
    return NextResponse.json(
      { error: "A URL is required." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const result = await categorizeItem({ name, url, price });

  // Degrades to a null suggestion (not an error) if Gemini is unavailable
  // — the dropdown just falls back to its default option, same as how a
  // save never fails because of categorization elsewhere in the app.
  return NextResponse.json(
    { category: result?.category ?? null, tags: result?.tags ?? [] },
    { headers: CORS_HEADERS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
