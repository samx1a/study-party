import { NextResponse } from "next/server";
import { handler, requireApiUser } from "@/lib/api";
import { getRoomState, requireMember } from "@/lib/rooms";

export const GET = handler(async (_req, ctx: RouteContext<"/api/rooms/[id]/state">) => {
  const { id } = await ctx.params;
  const me = await requireApiUser();
  const room = await requireMember(id, me.id);
  return NextResponse.json(await getRoomState(room, me.id), {
    headers: { "Cache-Control": "no-store" },
  });
});
