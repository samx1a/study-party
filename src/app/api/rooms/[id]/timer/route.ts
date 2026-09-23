import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { room } from "@/db/schema";
import { handler, parseBody, requireApiUser } from "@/lib/api";
import { broadcast } from "@/lib/livekit";
import { requireMember } from "@/lib/rooms";
import { skipPhase } from "@/lib/timer";

const body = z.object({ action: z.enum(["start", "stop", "skip"]) });

// Any member can run the timer: rooms are small groups of friends.
export const POST = handler(async (req, ctx: RouteContext<"/api/rooms/[id]/timer">) => {
  const { id } = await ctx.params;
  const me = await requireApiUser();
  const r = await requireMember(id, me.id);
  const { action } = await parseBody(req, body);
  const now = Date.now();

  let startedAt: Date | null;
  if (action === "start") {
    startedAt = r.timerStartedAt ?? new Date(now);
  } else if (action === "stop") {
    startedAt = null;
  } else {
    const cfg = {
      startedAt: r.timerStartedAt?.getTime() ?? null,
      focusMinutes: r.focusMinutes,
      breakMinutes: r.breakMinutes,
    };
    startedAt = new Date(skipPhase(cfg, now));
  }

  await db.update(room).set({ timerStartedAt: startedAt }).where(eq(room.id, r.id));
  await broadcast(r.id, { type: "room-updated" });
  return NextResponse.json({ timerStartedAt: startedAt?.getTime() ?? null, serverNow: now });
});
