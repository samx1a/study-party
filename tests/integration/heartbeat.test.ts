import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { presence, room, studyDay, user } from "@/db/schema";
import { getStats, recordHeartbeat } from "@/lib/stats";

const USER = "test-user-heartbeat";
const ROOM = "test-room-hb";
const T0 = new Date("2026-09-23T18:00:00Z").getTime();
const beat = (now: number, extra: Partial<Parameters<typeof recordHeartbeat>[0]> = {}) =>
  recordHeartbeat({
    userId: USER,
    roomId: ROOM,
    timezone: "America/Los_Angeles",
    verified: true,
    onBreak: false,
    now,
    ...extra,
  });

beforeEach(async () => {
  await db.delete(user).where(eq(user.id, USER));
  await db.insert(user).values({ id: USER, name: "HB", email: "hb@test.dev" });
  await db.insert(room).values({ id: ROOM, name: "HB room", ownerId: USER });
});

afterAll(async () => {
  await db.delete(user).where(eq(user.id, USER));
});

describe("recordHeartbeat", () => {
  it("credits one minute per real minute, starting from the second beat", async () => {
    expect(await beat(T0)).toEqual({ credited: 0, reason: "first_beat" });
    expect(await beat(T0 + 60_000)).toEqual({ credited: 1 });
    expect(await beat(T0 + 120_000)).toEqual({ credited: 1 });
    const [row] = await db.select().from(studyDay).where(eq(studyDay.userId, USER));
    expect(row).toMatchObject({ day: "2026-09-23", minutes: 2 });
  });

  it("ignores beats that arrive too fast (e.g. two tabs)", async () => {
    await beat(T0);
    expect(await beat(T0 + 5_000)).toEqual({ credited: 0, reason: "too_soon" });
  });

  it("doesn't count time with the camera off or on a break", async () => {
    await beat(T0);
    expect(await beat(T0 + 60_000, { verified: false })).toMatchObject({
      credited: 0,
      reason: "camera_off",
    });
    expect(await beat(T0 + 120_000, { onBreak: true })).toMatchObject({ credited: 0, reason: "on_break" });
    expect(await db.select().from(studyDay).where(eq(studyDay.userId, USER))).toHaveLength(0);
  });

  it("does not back-credit after a long gap", async () => {
    await beat(T0);
    expect(await beat(T0 + 30 * 60_000)).toEqual({ credited: 0, reason: "first_beat" });
    const [p] = await db.select().from(presence).where(eq(presence.userId, USER));
    expect(p.lastBeatAt.getTime()).toBe(T0 + 30 * 60_000);
  });
});

describe("getStats", () => {
  it("adds up today, the week, and the streak in the user's time zone", async () => {
    await db.insert(studyDay).values([
      { userId: USER, day: "2026-09-21", minutes: 40 },
      { userId: USER, day: "2026-09-22", minutes: 25 },
      { userId: USER, day: "2026-09-23", minutes: 10 },
      { userId: USER, day: "2026-08-01", minutes: 90 },
    ]);
    const s = await getStats(USER, "America/Los_Angeles", T0);
    expect(s.todayMinutes).toBe(10);
    expect(s.weekMinutes).toBe(75);
    expect(s.totalMinutes).toBe(165);
    expect(s.streak).toBe(2); // today (10 min) doesn't count yet, but doesn't break it
    expect(s.last7.map((d) => d.minutes)).toEqual([0, 0, 0, 0, 40, 25, 10]);
  });
});
