import { describe, expect, it } from "vitest";
import { formatClock, skipPhase, timerState } from "@/lib/timer";

const MIN = 60_000;
const cfg = { startedAt: 0, focusMinutes: 25, breakMinutes: 5 };

describe("timerState", () => {
  it("is idle when stopped or not started yet", () => {
    expect(timerState({ ...cfg, startedAt: null }, 1000).phase).toBe("idle");
    expect(timerState({ ...cfg, startedAt: 5000 }, 1000).phase).toBe("idle");
  });

  it("starts in focus, round 1", () => {
    expect(timerState(cfg, 0)).toEqual({
      phase: "focus",
      round: 1,
      remainingMs: 25 * MIN,
      phaseLengthMs: 25 * MIN,
    });
  });

  it("switches to break exactly at the focus length", () => {
    expect(timerState(cfg, 25 * MIN - 1).phase).toBe("focus");
    const s = timerState(cfg, 25 * MIN);
    expect(s.phase).toBe("break");
    expect(s.remainingMs).toBe(5 * MIN);
    expect(s.round).toBe(1);
  });

  it("loops into round 2 after focus + break", () => {
    const s = timerState(cfg, 30 * MIN + 10_000);
    expect(s.phase).toBe("focus");
    expect(s.round).toBe(2);
    expect(s.remainingMs).toBe(25 * MIN - 10_000);
  });
});

describe("skipPhase", () => {
  it("skipping during focus starts the break now", () => {
    const now = 10 * MIN;
    const startedAt = skipPhase(cfg, now);
    const s = timerState({ ...cfg, startedAt }, now);
    expect(s.phase).toBe("break");
    expect(s.remainingMs).toBe(5 * MIN);
  });

  it("skipping during break starts the next focus round now", () => {
    const now = 27 * MIN;
    const startedAt = skipPhase(cfg, now);
    const s = timerState({ ...cfg, startedAt }, now);
    expect(s.phase).toBe("focus");
    expect(s.round).toBe(2);
    expect(s.remainingMs).toBe(25 * MIN);
  });

  it("skipping while idle just starts the timer", () => {
    expect(skipPhase({ ...cfg, startedAt: null }, 123)).toBe(123);
  });
});

describe("formatClock", () => {
  it("formats minutes and seconds, rounding up", () => {
    expect(formatClock(25 * MIN)).toBe("25:00");
    expect(formatClock(61_500)).toBe("1:02");
    expect(formatClock(-5)).toBe("0:00");
  });
});
