"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RoomState } from "@/lib/room-types";

const POLL_MS = 30_000;

// Room state from the server. Refetches on demand (after a LiveKit nudge) and
// every 30s as a safety net. Also tracks the gap between our clock and the server's.
export function useRoomState(roomId: string, initial: RoomState) {
  const [state, setState] = useState(initial);
  const [offset, setOffset] = useState(() => initial.serverNow - Date.now());
  const inflight = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    const sentAt = Date.now();
    try {
      const res = await fetch(`/api/rooms/${roomId}/state`, { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) return;
      const next: RoomState = await res.json();
      // Assume the server stamped the time halfway through the round trip.
      const receivedAt = Date.now();
      setOffset(next.serverNow - (sentAt + receivedAt) / 2);
      setState(next);
    } catch {
      // Offline or aborted; the next poll will catch up.
    }
  }, [roomId]);

  useEffect(() => {
    const t = setInterval(refresh, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { state, setState, refresh, serverNow: useCallback(() => Date.now() + offset, [offset]) };
}
