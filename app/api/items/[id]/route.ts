import { NextResponse } from "next/server";
import { getAuthedClientAndUser, CORS_HEADERS } from "@/lib/api-auth";

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/items/[id]">
) {
  const { id } = await ctx.params;
  const { supabase, user } = await getAuthedClientAndUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
