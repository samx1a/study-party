import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { presence, studyDay, user } from "@/db/schema";
import {
  addDays,
  currentStreak,
  dayKey,
  isDuplicateBeat,
  longestStreak,
  minutesToCredit,
  safeTimeZone,
} from "@/lib/streak";

type BeatResult = { credited: number; reason?: "too_soon" | "not_sharing" | "on_break" | "first_beat" };

// Records a heartbeat and credits at most one study minute. `verified` says whether
// LiveKit confirmed the user is in the room sharing their screen right now.
export async function recordHeartbeat(opts: {
  userId: string;
  roomId: string;
  timezone: string;
  verified: boolean;
  onBreak: boolean;
  now?: number;
}): Promise<BeatResult> {
  const now = opts.now ?? Date.now();

  return db.transaction(async (tx) => {
    // Lock this user's row so two tabs can't double-credit the same minute.
    const [prev] = await tx
      .select({ lastBeatAt: presence.lastBeatAt })
      .from(presence)
      .where(eq(presence.userId, opts.userId))
      .for("update");
    const last = prev?.lastBeatAt.getTime() ?? null;

    if (isDuplicateBeat(last, now)) return { credited: 0, reason: "too_soon" };

    await tx
      .insert(presence)
      .values({ userId: opts.userId, roomId: opts.roomId, lastBeatAt: new Date(now) })
      .onConflictDoUpdate({ target: presence.userId, set: { roomId: opts.roomId, lastBeatAt: new Date(now) } });

    if (!opts.verified) return { credited: 0, reason: "not_sharing" };
    if (opts.onBreak) return { credited: 0, reason: "on_break" };
    const credit = minutesToCredit(last, now);
    if (credit === 0) return { credited: 0, reason: "first_beat" };

    const day = dayKey(now, opts.timezone);
    await tx
      .insert(studyDay)
      .values({ userId: opts.userId, day, minutes: credit })
      .onConflictDoUpdate({
        target: [studyDay.userId, studyDay.day],
        set: { minutes: sql`${studyDay.minutes} + ${credit}` },
      });
    return { credited: credit };
  });
}

export async function updateTimezone(userId: string, current: string, next: string | undefined) {
  if (!next || next === current || safeTimeZone(next) !== next) return;
  await db.update(user).set({ timezone: next }).where(eq(user.id, userId));
}

export type Stats = {
  todayMinutes: number;
  weekMinutes: number;
  totalMinutes: number;
  streak: number;
  longestStreak: number;
  last7: { day: string; minutes: number }[];
};

export async function getStats(userId: string, timezone: string, now = Date.now()): Promise<Stats> {
  const today = dayKey(now, timezone);
  const rows = await db
    .select({ day: studyDay.day, minutes: studyDay.minutes })
    .from(studyDay)
    .where(and(eq(studyDay.userId, userId), gte(studyDay.day, addDays(today, -400))));
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${studyDay.minutes}), 0)::int` })
    .from(studyDay)
    .where(eq(studyDay.userId, userId));

  const byDay = new Map(rows.map((r) => [r.day, r.minutes]));
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i - 6);
    return { day, minutes: byDay.get(day) ?? 0 };
  });

  return {
    todayMinutes: byDay.get(today) ?? 0,
    weekMinutes: last7.reduce((s, d) => s + d.minutes, 0),
    totalMinutes: total,
    streak: currentStreak(byDay, today),
    longestStreak: longestStreak(byDay),
    last7,
  };
}
