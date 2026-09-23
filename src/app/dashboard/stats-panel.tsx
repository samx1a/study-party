import { FlameIcon } from "@/components/icons";
import type { Stats } from "@/lib/stats";
import { STREAK_MIN_MINUTES } from "@/lib/streak";

function hours(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function weekday(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

export function StatsPanel({ stats }: { stats: Stats }) {
  const tiles = [
    {
      label: "Streak",
      value: `${stats.streak} ${stats.streak === 1 ? "day" : "days"}`,
      hint: `Best: ${stats.longestStreak}. A day counts at ${STREAK_MIN_MINUTES}+ min.`,
    },
    { label: "Today", value: hours(stats.todayMinutes) },
    { label: "Last 7 days", value: hours(stats.weekMinutes) },
    { label: "All time", value: hours(stats.totalMinutes) },
  ];
  const max = Math.max(60, ...stats.last7.map((d) => d.minutes));

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-lg">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <FlameIcon className="size-4 text-accent-ink" /> {stats.streak}-day streak
        </span>
        <span className="text-muted"> · best {stats.longestStreak}</span>
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
        {tiles.slice(1).map((t) => (
          <div key={t.label}>
            <dt className="text-muted">{t.label}</dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums">{t.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex h-28 items-end gap-2" aria-hidden>
        {stats.last7.map((d, i) => (
          <div
            key={d.day}
            className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            {/* Tooltip on hover; the hit area is the whole column, not just the bar. */}
            <span className="pointer-events-none absolute -top-1 z-10 rounded-md border border-border bg-surface px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              {weekday(d.day)}: {hours(d.minutes)}
            </span>
            <div
              className={
                i === 6 ? "w-full max-w-8 rounded-t bg-accent-ink" : "w-full max-w-8 rounded-t bg-accent"
              }
              style={{
                height: `${Math.max(d.minutes > 0 ? 4 : 1, (d.minutes / max) * 100)}%`,
                minHeight: 2,
              }}
            />
            <span className="text-xs text-muted">{weekday(d.day)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        A day counts toward your streak at {STREAK_MIN_MINUTES}+ minutes.
      </p>

      {/* Same data as a table for screen readers. */}
      <table className="sr-only">
        <caption>Minutes studied per day</caption>
        <tbody>
          {stats.last7.map((d) => (
            <tr key={d.day}>
              <th scope="row">{d.day}</th>
              <td>{d.minutes} minutes</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
