import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui";
import { listMyRooms } from "@/lib/rooms";
import { getStats } from "@/lib/stats";
import { requireUser } from "@/lib/session";
import { CreateRoomForm } from "./create-room-form";
import { StatsPanel } from "./stats-panel";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const me = await requireUser("/dashboard");
  const [rooms, stats] = await Promise.all([listMyRooms(me.id), getStats(me.id, me.timezone ?? "UTC")]);

  return (
    <>
      <AppHeader name={me.name} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="font-display text-4xl">Hey {me.name.split(" ")[0]}.</h1>
        <p className="mt-1 text-muted">Pick a room, or start a new one and send the link to friends.</p>

        <div className="mt-8">
          <StatsPanel stats={stats} />
        </div>

        <section className="mt-6 grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <Card>
            <h2 className="font-semibold">New room</h2>
            <p className="mt-1 mb-4 text-sm text-muted">Anyone with the link can join after signing in.</p>
            <CreateRoomForm />
          </Card>

          <Card className="p-0">
            <h2 className="px-6 pt-6 font-semibold">Your rooms</h2>
            {rooms.length === 0 ? (
              <p className="px-6 pt-2 pb-6 text-sm text-muted">No rooms yet. Create one, or open a link a friend sent you.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border border-t border-border">
                {rooms.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/r/${r.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-surface-2"
                    >
                      <span>
                        <span className="font-medium">{r.name}</span>
                        <span className="ml-2 text-xs text-muted">
                          {r.ownerId === me.id ? "You're the host" : `Host: ${r.ownerName}`}
                        </span>
                      </span>
                      <span className="text-sm text-accent">Join →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </main>
    </>
  );
}
