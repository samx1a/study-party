"use client";

import { RoomAudioRenderer, useDataChannel } from "@livekit/components-react";
import { useCallback, useState } from "react";
import { LeaveIcon, LinkIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import type { RoomState } from "@/lib/room-types";
import { useRoomState } from "./use-room-state";
import { VideoStage } from "./video-stage";

type RoomEvent = { type: "room-updated" } | { type: "goals-updated" } | { type: "kicked"; userId: string };

export function RoomView(props: {
  initial: RoomState;
  userName: string;
  onLeave: () => void;
  onKicked: () => void;
}) {
  const { state, refresh } = useRoomState(props.initial.room.id, props.initial);
  const { room, me } = state;

  // The server nudges us over LiveKit when something changes; we refetch the real state.
  useDataChannel(
    "room-event",
    useCallback(
      (msg: { payload: Uint8Array }) => {
        let event: RoomEvent;
        try {
          event = JSON.parse(new TextDecoder().decode(msg.payload));
        } catch {
          return;
        }
        if (event.type === "kicked" && event.userId === me.id) props.onKicked();
        else refresh();
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [me.id, refresh],
    ),
  );

  async function removeParticipant(userId: string) {
    await fetch(`/api/rooms/${room.id}/kick`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4">
        <h1 className="truncate font-semibold">{room.name}</h1>
        <div className="flex items-center gap-2">
          <InviteButton roomId={room.id} />
          <Button variant="danger" size="sm" onClick={props.onLeave}>
            <LeaveIcon className="size-4" /> Leave
          </Button>
        </div>
      </header>

      <main className="min-h-0 flex-1 p-3">
        <VideoStage goals={state.goals} canRemove={me.isHost} onRemove={removeParticipant} />
      </main>

      <RoomAudioRenderer />
    </div>
  );
}

function InviteButton({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(`${location.origin}/r/${roomId}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      <LinkIcon className="size-4" /> {copied ? "Link copied!" : "Invite"}
    </Button>
  );
}
