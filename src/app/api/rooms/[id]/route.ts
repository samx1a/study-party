import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { room } from "@/db/schema";
import { handler, parseBody, requireApiUser } from "@/lib/api";
import { broadcast, roomService } from "@/lib/livekit";
import { requireHost, ROOM_LIMITS as L } from "@/lib/rooms";

const patch = z
  .object({
    name: z.string().trim().min(1).max(L.nameMax),
    focusMinutes: z.number().int().min(L.focusMin).max(L.focusMax),
    breakMinutes: z.number().int().min(L.breakMin).max(L.breakMax),
  })
  .partial();

export const PATCH = handler(async (req, ctx: RouteContext<"/api/rooms/[id]">) => {
  const { id } = await ctx.params;
  const me = await requireApiUser();
  const r = await requireHost(id, me.id);
  const changes = await parseBody(req, patch);

  // Changing lengths mid-cycle would jump everyone to a random point, so restart the timer.
  const lengthsChanged =
    (changes.focusMinutes !== undefined && changes.focusMinutes !== r.focusMinutes) ||
    (changes.breakMinutes !== undefined && changes.breakMinutes !== r.breakMinutes);
  const timer = lengthsChanged && r.timerStartedAt ? { timerStartedAt: new Date() } : {};

  await db
    .update(room)
    .set({ ...changes, ...timer })
    .where(eq(room.id, id));
  await broadcast(id, { type: "room-updated" });
  return NextResponse.json({ ok: true });
});

export const DELETE = handler(async (_req, ctx: RouteContext<"/api/rooms/[id]">) => {
  const { id } = await ctx.params;
  const me = await requireApiUser();
  await requireHost(id, me.id);
  await db.delete(room).where(eq(room.id, id));
  // Close the live call too. Ignore "not found": nobody was in it.
  await roomService()
    .deleteRoom(id)
    .catch(() => {});
  return new NextResponse(null, { status: 204 });
});
