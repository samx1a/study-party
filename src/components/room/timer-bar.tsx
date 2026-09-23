"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatClock, type TimerState } from "@/lib/timer";

const LABEL = { focus: "Focus", break: "Break", idle: "Timer off" } as const;

export function TimerDisplay({ timer }: { timer: TimerState }) {
  return (
    <div className="flex items-center gap-3" data-testid="timer" data-phase={timer.phase}>
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-[13px] font-medium",
          timer.phase === "focus" && "bg-accent text-accent-ink",
          timer.phase === "break" && "bg-break text-break-ink",
          timer.phase === "idle" && "bg-surface-2 text-muted",
        )}
      >
        {LABEL[timer.phase]}
        {timer.phase !== "idle" && ` · round ${timer.round}`}
      </span>
      {timer.phase !== "idle" && (
        <span className="text-2xl font-semibold tracking-tight tabular-nums" aria-live="off">
          {formatClock(timer.remainingMs)}
        </span>
      )}
    </div>
  );
}

export function TimerControls({
  roomId,
  timer,
  onChanged,
}: {
  roomId: string;
  timer: TimerState;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function send(action: "start" | "stop" | "skip") {
    setBusy(true);
    try {
      await fetch(`/api/rooms/${roomId}/timer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (timer.phase === "idle") {
    return (
      <Button size="sm" onClick={() => send("start")} disabled={busy} data-testid="timer-start">
        Start focus
      </Button>
    );
  }
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" onClick={() => send("skip")} disabled={busy} data-testid="timer-skip">
        Skip to {timer.phase === "focus" ? "break" : "focus"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => send("stop")} disabled={busy}>
        Stop
      </Button>
    </div>
  );
}

// Thin progress line under the header, colored by phase.
export function TimerProgress({ timer }: { timer: TimerState }) {
  if (timer.phase === "idle") return <div className="h-0.5 bg-border" />;
  const pct = 100 * (1 - timer.remainingMs / timer.phaseLengthMs);
  return (
    <div className="h-0.5 bg-border">
      <div
        className={cn(
          "h-full transition-[width] duration-300",
          timer.phase === "focus" ? "bg-accent" : "bg-break",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
