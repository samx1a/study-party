"use client";

import { RoomAudioRenderer, useDataChannel } from "@livekit/components-react";
import { useCallback, useState } from "react";
import { GearIcon, LeaveIcon, LinkIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import type { RoomState } from "@/lib/room-types";
import { playChime } from "@/lib/chime";
import { GoalsPanel } from "./goals-panel";
import { SettingsDialog } from "./settings-dialog";
import { ControlBar, PausedOverlay, useMyScreen } from "./controls";
import { TimerControls, TimerDisplay, TimerProgress } from "./timer-bar";
import { useHeartbeat } from "./use-heartbeat";
import { useRoomState } from "./use-room-state";
import { usePhaseChange, useTimer } from "./use-timer";
import { VideoStage } from "./video-stage";

type RoomEvent = { type: "room-updated" } | { type: "goals-updated" } | { type: "kicked"; userId: string };

export function RoomView(props: {
  initial: RoomState;
  userName: string;
  onLeave: () => void;
  onKicked: () => void;
}) {
  const { state, setState, refresh, serverNow } = useRoomState(props.initial.room.id, props.initial);
  const { room, me } = state;
  const timer = useTimer(room, serverNow);
  const screen = useMyScreen();
  useHeartbeat(room.id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  usePhaseChange(timer.phase, (next) => {
    if (next !== "idle") playChime(next);
    if (next !== "idle") document.title = `${next === "focus" ? "Focus" : "Break"} · ${room.name}`;
  });

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
      <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
        <h1 className="truncate font-semibold">{room.name}</h1>
        <div className="flex items-center gap-3">
          <TimerDisplay timer={timer} />
          <TimerControls roomId={room.id} timer={timer} onChanged={refresh} />
        </div>
        <div className="flex items-center justify-end gap-2">
          {me.isHost && (
            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} aria-label="Room settings">
              <GearIcon className="size-4" />
            </Button>
          )}
          <InviteButton roomId={room.id} />
          <Button variant="danger" size="sm" onClick={props.onLeave}>
            <LeaveIcon className="size-4" /> Leave
          </Button>
        </div>
      </header>
      <TimerProgress timer={timer} />

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1 p-3">
          <VideoStage goals={state.goals} canRemove={me.isHost} onRemove={removeParticipant} />
          {screen.paused && <PausedOverlay onShare={screen.share} />}
        </main>
        {sidebarOpen && (
          <GoalsPanel
            roomId={room.id}
            meId={me.id}
            goals={state.goals}
            onChange={(goals) => setState((s) => ({ ...s, goals }))}
            refresh={refresh}
          />
        )}
      </div>

      <ControlBar
        phase={timer.phase}
        screen={screen}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />

      {me.isHost && (
        <SettingsDialog room={room} open={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={refresh} />
      )}
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
