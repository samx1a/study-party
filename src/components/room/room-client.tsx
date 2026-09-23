"use client";

import { RoomContext } from "@livekit/components-react";
import {
  DisconnectReason,
  type LocalTrack,
  type LocalVideoTrack,
  type Room,
  RoomEvent,
  Track,
} from "livekit-client";
import { useEffect, useState } from "react";
import { ButtonLink, Button } from "@/components/ui";
import { createStudyRoom } from "@/lib/media";
import type { RoomState } from "@/lib/room-types";
import { Prejoin } from "./prejoin";
import { RoomView } from "./room-view";

type Stage =
  | { name: "prejoin"; error?: string }
  | { name: "joining" }
  | { name: "in-room"; room: Room }
  | { name: "ended"; title: string; body: string; canRejoin: boolean };

export function RoomClient({
  initial,
  userName,
}: {
  initial: RoomState;
  userName: string;
}) {
  const roomId = initial.room.id;
  const [stage, setStage] = useState<Stage>({ name: "prejoin" });

  async function join(camera: LocalVideoTrack, screen: LocalTrack) {
    setStage({ name: "joining" });
    const res = await fetch(`/api/rooms/${roomId}/token`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      camera.stop();
      screen.stop();
      if (body.code === "banned") {
        setStage({
          name: "ended",
          title: "You were removed",
          body: body.error,
          canRejoin: false,
        });
      } else {
        setStage({
          name: "prejoin",
          error: body.error ?? "Couldn't join. Try again.",
        });
      }
      return;
    }

    const room = createStudyRoom();
    try {
      await room.connect(body.url, body.token);
      await room.localParticipant.publishTrack(camera, {
        source: Track.Source.Camera,
      });
      await room.localParticipant.publishTrack(screen, {
        source: Track.Source.ScreenShare,
      });
      // Handy for debugging and end-to-end tests; never exposed in production builds.
      if (process.env.NODE_ENV !== "production")
        (window as unknown as { __room: Room }).__room = room;
      setStage({ name: "in-room", room });
    } catch (err) {
      console.error(err);
      camera.stop();
      screen.stop();
      await room.disconnect();
      setStage({
        name: "prejoin",
        error:
          "Couldn't connect to the video server. Check your connection and try again.",
      });
    }
  }

  // Watch for being disconnected for good (kicked, room deleted, network gave up).
  const room = stage.name === "in-room" ? stage.room : null;
  useEffect(() => {
    if (!room) return;
    const onDisconnected = (reason?: DisconnectReason) => {
      room.localParticipant.trackPublications.forEach((p) => p.track?.stop());
      if (reason === DisconnectReason.CLIENT_INITIATED) return; // handled by leave()
      const ended =
        reason === DisconnectReason.PARTICIPANT_REMOVED
          ? {
              title: "You were removed",
              body: "The host removed you from this room.",
              canRejoin: false,
            }
          : reason === DisconnectReason.ROOM_DELETED
            ? {
                title: "Room closed",
                body: "The host deleted this room.",
                canRejoin: false,
              }
            : reason === DisconnectReason.DUPLICATE_IDENTITY
              ? {
                  title: "Opened in another tab",
                  body: "You joined this room from another tab or window.",
                  canRejoin: true,
                }
              : {
                  title: "Connection lost",
                  body: "We couldn't reconnect to the room.",
                  canRejoin: true,
                };
      setStage({ name: "ended", ...ended });
    };
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room]);

  // Leave the call if the component unmounts (navigating away).
  useEffect(() => {
    if (!room) return;
    return () => {
      room.disconnect();
    };
  }, [room]);

  if (stage.name === "in-room") {
    return (
      <RoomContext.Provider value={stage.room}>
        <RoomView
          initial={initial}
          userName={userName}
          onLeave={async () => {
            await stage.room.disconnect();
            setStage({
              name: "ended",
              title: "You left the room",
              body: "Nice work. See you next session.",
              canRejoin: true,
            });
          }}
          onKicked={async () => {
            // We disconnect ourselves here (client-initiated), so set the end screen directly.
            await stage.room.disconnect();
            setStage({
              name: "ended",
              title: "You were removed",
              body: "The host removed you from this room.",
              canRejoin: false,
            });
          }}
        />
      </RoomContext.Provider>
    );
  }

  if (stage.name === "ended") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{stage.title}</h1>
        <p className="max-w-md text-muted">{stage.body}</p>
        <div className="mt-4 flex gap-2">
          {stage.canRejoin && (
            <Button onClick={() => setStage({ name: "prejoin" })}>
              Rejoin
            </Button>
          )}
          <ButtonLink href="/dashboard" variant="secondary">
            Dashboard
          </ButtonLink>
        </div>
      </main>
    );
  }

  return (
    <Prejoin
      roomName={initial.room.name}
      joining={stage.name === "joining"}
      error={stage.name === "prejoin" ? stage.error : undefined}
      onJoin={join}
    />
  );
}
