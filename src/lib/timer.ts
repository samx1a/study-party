// The room timer is stored as a start time plus phase lengths. Every client
// computes the current phase from those, so nothing ever has to "tick" on the server.

export type Phase = "focus" | "break" | "idle";

export type TimerConfig = {
  startedAt: number | null; // ms since epoch, null = stopped
  focusMinutes: number;
  breakMinutes: number;
};

export type TimerState = {
  phase: Phase;
  round: number; // 1-based focus round; 0 when idle
  remainingMs: number; // time left in the current phase
  phaseLengthMs: number;
};

const MIN = 60_000;

export function timerState(cfg: TimerConfig, now: number): TimerState {
  if (cfg.startedAt === null || now < cfg.startedAt) {
    return { phase: "idle", round: 0, remainingMs: 0, phaseLengthMs: 0 };
  }
  const focus = cfg.focusMinutes * MIN;
  const brk = cfg.breakMinutes * MIN;
  const cycle = focus + brk;
  const elapsed = now - cfg.startedAt;
  const intoCycle = elapsed % cycle;
  const round = Math.floor(elapsed / cycle) + 1;

  if (intoCycle < focus) {
    return { phase: "focus", round, remainingMs: focus - intoCycle, phaseLengthMs: focus };
  }
  return { phase: "break", round, remainingMs: cycle - intoCycle, phaseLengthMs: brk };
}

// New start time that makes the *next* phase begin exactly at `now`.
export function skipPhase(cfg: TimerConfig, now: number): number {
  const state = timerState(cfg, now);
  if (state.phase === "idle" || cfg.startedAt === null) return now;
  return cfg.startedAt - state.remainingMs;
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
