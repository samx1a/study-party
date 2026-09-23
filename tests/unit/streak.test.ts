import { describe, expect, it } from "vitest";
import {
  addDays,
  currentStreak,
  dayKey,
  isDuplicateBeat,
  longestStreak,
  minutesToCredit,
  safeTimeZone,
} from "@/lib/streak";

describe("dayKey", () => {
  it("uses the user's time zone, not UTC", () => {
    // 11:30pm Sept 22 in California is already Sept 23 in UTC.
    const at = new Date("2026-09-23T06:30:00Z");
    expect(dayKey(at, "America/Los_Angeles")).toBe("2026-09-22");
    expect(dayKey(at, "UTC")).toBe("2026-09-23");
  });

  it("falls back to UTC for a bad time zone", () => {
    expect(safeTimeZone("Mars/Olympus")).toBe("UTC");
    expect(dayKey(new Date("2026-01-01T12:00:00Z"), "Mars/Olympus")).toBe("2026-01-01");
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("currentStreak", () => {
  const days = (entries: Record<string, number>) => new Map(Object.entries(entries));

  it("counts consecutive days that hit the minimum", () => {
    const m = days({ "2026-09-21": 30, "2026-09-22": 25, "2026-09-23": 20 });
    expect(currentStreak(m, "2026-09-23")).toBe(3);
  });

  it("doesn't break the streak just because today isn't done yet", () => {
    const m = days({ "2026-09-21": 30, "2026-09-22": 25, "2026-09-23": 5 });
    expect(currentStreak(m, "2026-09-23")).toBe(2);
  });

  it("is broken by a missed day", () => {
    const m = days({ "2026-09-20": 30, "2026-09-22": 25 });
    expect(currentStreak(m, "2026-09-23")).toBe(1);
    expect(currentStreak(m, "2026-09-24")).toBe(0);
  });

  it("finds the longest run", () => {
    const m = days({ "2026-09-01": 30, "2026-09-02": 30, "2026-09-03": 30, "2026-09-10": 30, "2026-09-11": 10 });
    expect(longestStreak(m)).toBe(3);
  });
});

describe("heartbeat credit", () => {
  it("credits one minute for a normal ~60s gap", () => {
    expect(minutesToCredit(0, 60_000)).toBe(1);
  });
  it("never credits the first beat or a long gap", () => {
    expect(minutesToCredit(null, 60_000)).toBe(0);
    expect(minutesToCredit(0, 10 * 60_000)).toBe(0);
  });
  it("flags beats that come too fast", () => {
    expect(isDuplicateBeat(0, 5_000)).toBe(true);
    expect(isDuplicateBeat(0, 60_000)).toBe(false);
    expect(isDuplicateBeat(null, 0)).toBe(false);
  });
});
