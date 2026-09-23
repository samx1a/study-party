// Study time is stored per local calendar day ("YYYY-MM-DD" in the user's time zone).

export const STREAK_MIN_MINUTES = 20;

export function safeTimeZone(tz: string | null | undefined) {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

// "2026-09-23" for the given instant, as seen in `tz`.
export function dayKey(at: Date | number, tz: string) {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone(tz),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function addDays(day: string, n: number) {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

// Days in a row with at least STREAK_MIN_MINUTES. If today isn't there yet,
// count from yesterday so the streak doesn't look broken before you've studied.
export function currentStreak(minutesByDay: Map<string, number>, today: string, min = STREAK_MIN_MINUTES) {
  const hit = (day: string) => (minutesByDay.get(day) ?? 0) >= min;
  let day = hit(today) ? today : addDays(today, -1);
  let streak = 0;
  while (hit(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export function longestStreak(minutesByDay: Map<string, number>, min = STREAK_MIN_MINUTES) {
  const days = [...minutesByDay.entries()]
    .filter(([, m]) => m >= min)
    .map(([d]) => d)
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

// Heartbeats come about once a minute. Credit one minute only if the last beat
// was a normal gap ago: too soon = duplicate, too late = we weren't watching.
export const BEAT_MIN_GAP_MS = 45_000;
export const BEAT_MAX_GAP_MS = 150_000;

export function minutesToCredit(lastBeatAt: number | null, now: number) {
  if (lastBeatAt === null) return 0;
  const gap = now - lastBeatAt;
  return gap >= BEAT_MIN_GAP_MS && gap <= BEAT_MAX_GAP_MS ? 1 : 0;
}

export function isDuplicateBeat(lastBeatAt: number | null, now: number) {
  return lastBeatAt !== null && now - lastBeatAt < BEAT_MIN_GAP_MS;
}
