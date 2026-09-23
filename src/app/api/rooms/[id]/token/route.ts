import { NextResponse } from "next/server";
import { handler, HttpError, requireApiUser } from "@/lib/api";
import { env } from "@/lib/env";
import { createJoinToken, ensureLiveKitRoom, listParticipants } from "@/lib/livekit";
import { joinRoom } from "@/lib/rooms";

export const POST = handler(async (_req, ctx: RouteContext<"/api/rooms/[id]/token">) => {
  const { id } = await ctx.params;
  const me = await requireApiUser();
  const { room } = await joinRoom(id, me.id);

  let participants;
  try {
    participants = await listParticipants(room.id);
  } catch (err) {
    console.error("[token] LiveKit unreachable", err);
    throw new HttpError(503, "The video service is unavailable. Try again in a minute.", "video_down");
  }

  // Rejoining from a second tab replaces the old connection, so it doesn't count.
  const others = participants.filter((p) => p.identity !== me.id);
  if (others.length >= room.maxParticipants) {
    throw new HttpError(409, `This room is full (${room.maxParticipants}/${room.maxParticipants}).`, "full");
  }

  await ensureLiveKitRoom(room.id, room.maxParticipants);
  const token = await createJoinToken({ roomId: room.id, userId: me.id, name: me.name });
  return NextResponse.json({ token, url: env().NEXT_PUBLIC_LIVEKIT_URL });
});
