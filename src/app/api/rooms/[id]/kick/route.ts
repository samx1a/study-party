import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { roomMember } from "@/db/schema";
import { handler, HttpError, parseBody, requireApiUser } from "@/lib/api";
import { broadcast, removeParticipant } from "@/lib/livekit";
import { requireHost } from "@/lib/rooms";

const body = z.object({ userId: z.string().min(1) });

// Host removes someone: ban them from getting new tokens, then drop them from the call.
export const POST = handler(async (req, ctx: RouteContext<"/api/rooms/[id]/kick">) => {
  const { id } = await ctx.params;
  const me = await requireApiUser();
  await requireHost(id, me.id);
  const { userId } = await parseBody(req, body);
  if (userId === me.id) throw new HttpError(400, "You can't remove yourself.");

  const banned = await db
    .update(roomMember)
    .set({ banned: true })
    .where(and(eq(roomMember.roomId, id), eq(roomMember.userId, userId)))
    .returning({ userId: roomMember.userId });
  if (banned.length === 0) throw new HttpError(404, "That person isn't in this room.", "not_found");
  await broadcast(id, { type: "kicked", userId });
  await removeParticipant(id, userId);
  return NextResponse.json({ ok: true });
});
