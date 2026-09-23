import { NextResponse } from "next/server";
import { z } from "zod";
import { handler, parseBody, requireApiUser } from "@/lib/api";
import { getParticipant, isOnCamera } from "@/lib/livekit";
import { requireMember } from "@/lib/rooms";
import { recordHeartbeat, updateTimezone } from "@/lib/stats";
import { timerState } from "@/lib/timer";

const body = z.object({
  roomId: z.string().min(1).max(40),
  timezone: z.string().max(64).optional(),
});

// Sent by the room page about once a minute. The server decides whether it counts.
export const POST = handler(async (req) => {
  const me = await requireApiUser();
  const { roomId, timezone } = await parseBody(req, body);
  const room = await requireMember(roomId, me.id);
  await updateTimezone(me.id, me.timezone ?? "UTC", timezone);

  // Don't trust the browser: ask LiveKit whether they're really in the call with their camera on.
  let verified = false;
  try {
    const p = await getParticipant(roomId, me.id);
    verified = !!p && isOnCamera(p);
  } catch (err) {
    console.warn("[heartbeat] LiveKit check failed", err);
  }

  const phase = timerState(
    {
      startedAt: room.timerStartedAt?.getTime() ?? null,
      focusMinutes: room.focusMinutes,
      breakMinutes: room.breakMinutes,
    },
    Date.now(),
  ).phase;

  const result = await recordHeartbeat({
    userId: me.id,
    roomId,
    timezone: timezone ?? me.timezone ?? "UTC",
    verified,
    onBreak: phase === "break",
  });
  return NextResponse.json(result);
});
