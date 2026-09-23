"use client";

import { useEffect, useRef, useState } from "react";
import type { RoomState } from "@/lib/room-types";
import { type Phase, timerState, type TimerState } from "@/lib/timer";

// Re-computes the room timer a few times a second using the server-corrected clock.
export function useTimer(room: RoomState["room"], serverNow: () => number): TimerState {
  const cfg = {
    startedAt: room.timerStartedAt,
    focusMinutes: room.focusMinutes,
    breakMinutes: room.breakMinutes,
  };
  const [state, setState] = useState(() => timerState(cfg, serverNow()));

  useEffect(() => {
    const tick = () =>
      setState(
        timerState(
          { startedAt: room.timerStartedAt, focusMinutes: room.focusMinutes, breakMinutes: room.breakMinutes },
          serverNow(),
        ),
      );
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [room.timerStartedAt, room.focusMinutes, room.breakMinutes, serverNow]);

  return state;
}

// Calls `fn` whenever the phase changes (not on first render).
export function usePhaseChange(phase: Phase, fn: (next: Phase, prev: Phase) => void) {
  const prev = useRef(phase);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    if (prev.current !== phase) fnRef.current(phase, prev.current);
    prev.current = phase;
  }, [phase]);
}
