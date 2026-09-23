import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/ui";
import { listMyRooms } from "@/lib/rooms";
import { getStats } from "@/lib/stats";
import { requireUser } from "@/lib/session";
import { CreateRoomForm } from "./create-room-form";
import { StatsPanel } from "./stats-panel";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const me = await requireUser("/dashboard");
  const [rooms, stats] = await Promise.all([
    listMyRooms(me.id),
    getStats(me.id, me.timezone ?? "UTC"),
  ]);

  return (
    <>
      <AppHeader name={me.name} guest={!!me.isAnonymous} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hey {me.name.split(" ")[0]}
        </h1>

        {me.isAnonymous && (
          <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl bg-accent/60 px-4 py-3 text-sm text-accent-ink sm:flex-row sm:items-center">
            <p>
              You&apos;re a guest. Create a free account to keep your streak on
              any device.
            </p>
            <ButtonLink
              href="/sign-up?next=/dashboard"
              size="sm"
              variant="secondary"
            >
              Save my progress
            </ButtonLink>
          </div>
        )}

        <section className="mt-8">
          <h2 className="font-semibold">Your rooms</h2>
          <div className="mt-3">
            <CreateRoomForm />
          </div>
          {rooms.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No rooms yet. Create one above, then send the link to friends.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {rooms.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/r/${r.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-surface-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {r.name}
                      </span>
                      <span className="text-xs text-muted">
                        {r.ownerId === me.id
                          ? "You're the host"
                          : `Host: ${r.ownerName}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-accent-ink">
                      Join
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-semibold">Your studying</h2>
          <div className="mt-3">
            <StatsPanel stats={stats} />
          </div>
        </section>
      </main>
    </>
  );
}
