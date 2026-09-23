import { Card } from "@/components/ui";
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
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
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
    <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <div className="grid grid-cols-2 gap-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <p className="text-sm text-muted">{t.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{t.value}</p>
            {t.hint && <p className="mt-1 text-xs text-muted">{t.hint}</p>}
          </Card>
        ))}
      </div>

      <Card className="flex flex-col p-5">
        <p className="text-sm text-muted">Minutes studied, last 7 days</p>
        <div className="mt-4 flex flex-1 items-end gap-2" aria-hidden>
          {stats.last7.map((d, i) => (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
              {/* Tooltip on hover; the hit area is the whole column, not just the bar. */}
              <span className="pointer-events-none absolute -top-1 z-10 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs whitespace-nowrap text-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {weekday(d.day)}: {hours(d.minutes)}
              </span>
              <div
                className={i === 6 ? "w-full max-w-7 rounded-t bg-accent" : "w-full max-w-7 rounded-t bg-accent/55"}
                style={{ height: `${Math.max(d.minutes > 0 ? 4 : 1, (d.minutes / max) * 100)}%`, minHeight: 2 }}
              />
              <span className="text-xs text-muted">{weekday(d.day)}</span>
            </div>
          ))}
        </div>
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
      </Card>
    </section>
  );
}
