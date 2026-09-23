import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomClient } from "@/components/room/room-client";
import { ButtonLink } from "@/components/ui";
import { HttpError } from "@/lib/api";
import { getRoomState, joinRoom } from "@/lib/rooms";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Study room" };

export default async function RoomPage(props: PageProps<"/r/[id]">) {
  const { id } = await props.params;
  const me = await requireUser(`/r/${id}`);

  let joined;
  try {
    joined = await joinRoom(id, me.id);
  } catch (err) {
    if (err instanceof HttpError && err.code === "not_found") notFound();
    if (err instanceof HttpError && err.code === "banned") {
      return (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">You can&apos;t join this room</h1>
          <p className="text-muted">The host removed you from it.</p>
          <ButtonLink href="/dashboard" variant="secondary" className="mt-4">
            Dashboard
          </ButtonLink>
        </main>
      );
    }
    throw err;
  }

  const initial = await getRoomState(joined.room, me.id);
  return <RoomClient initial={initial} userName={me.name} />;
}
