"use client";

import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CameraIcon,
  EyeOffIcon,
  GearIcon,
  LeaveIcon,
  ListIcon,
  MicIcon,
  MicOffIcon,
  ScreenIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { describeMediaError, SCREEN_CAPTURE } from "@/lib/media";
import type { Phase } from "@/lib/timer";

const HIDE_SECONDS = 30;

// My camera is required: if it's off, I'm paused until I turn it back on.
export function useMyCamera() {
  const { localParticipant, isCameraEnabled } = useLocalParticipant();
  const [error, setError] = useState<string | null>(null);

  async function turnOn() {
    setError(null);
    try {
      await localParticipant.setCameraEnabled(true);
    } catch (err) {
      setError(describeMediaError(err, "camera"));
    }
  }

  return { paused: !isCameraEnabled, turnOn, error };
}

// My screen share is optional: start, stop, or hide it for a moment.
export function useMyScreen() {
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const [hiddenFor, setHiddenFor] = useState(0); // seconds left, 0 = visible
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  const pub = useCallback(
    () => localParticipant.getTrackPublication(Track.Source.ScreenShare),
    [localParticipant],
  );

  const show = useCallback(async () => {
    clearInterval(timer.current);
    setHiddenFor(0);
    await pub()?.unmute();
  }, [pub]);

  async function hide() {
    const p = pub();
    if (!p) return;
    await p.mute();
    setHiddenFor(HIDE_SECONDS);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setHiddenFor((s) => {
        if (s <= 1) {
          clearInterval(timer.current);
          pub()?.unmute();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function start() {
    setError(null);
    try {
      await localParticipant.setScreenShareEnabled(true, SCREEN_CAPTURE);
    } catch (err) {
      // Closing the window picker isn't an error worth shouting about.
      if (err instanceof Error && err.name === "NotAllowedError") return;
      setError(describeMediaError(err, "screen"));
    }
  }

  async function stop() {
    clearInterval(timer.current);
    setHiddenFor(0);
    await localParticipant.setScreenShareEnabled(false);
  }

  useEffect(() => () => clearInterval(timer.current), []);

  const hidden = hiddenFor > 0 && !!pub();
  return { sharing: isScreenShareEnabled || hidden, hidden, hiddenFor, hide, show, start, stop, error };
}

export function ControlBar(props: {
  phase: Phase;
  screen: ReturnType<typeof useMyScreen>;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isHost: boolean;
  onOpenSettings: () => void;
  onLeave: () => void;
}) {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const [micError, setMicError] = useState<string | null>(null);
  const focus = props.phase === "focus";
  const { screen } = props;

  // Focus time is quiet time: force the mic off whenever focus starts.
  useEffect(() => {
    if (focus) localParticipant.setMicrophoneEnabled(false).catch(() => {});
  }, [focus, localParticipant]);

  async function toggleMic() {
    setMicError(null);
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      setMicError("Mic blocked. Allow it from the address bar.");
    }
  }

  return (
    <footer className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 pt-1 pb-4">
      <p className="truncate text-xs text-danger">{micError ?? screen.error}</p>

      {/* Center: the things you touch most, like Google Meet. */}
      <div className="flex items-center gap-2">
        <ControlButton
          onClick={toggleMic}
          disabled={focus}
          active={isMicrophoneEnabled}
          title={focus ? "Mics are off during focus. Chat on the break!" : undefined}
          data-testid="mic"
        >
          {isMicrophoneEnabled ? <MicIcon className="size-4" /> : <MicOffIcon className="size-4" />}
          {focus ? "Muted for focus" : isMicrophoneEnabled ? "Mute" : "Unmute"}
        </ControlButton>

        {screen.sharing ? (
          <ControlButton onClick={screen.stop} active data-testid="stop-share">
            <ScreenIcon className="size-4" /> Stop sharing
          </ControlButton>
        ) : (
          <ControlButton onClick={screen.start} data-testid="share-screen">
            <ScreenIcon className="size-4" /> Share screen
          </ControlButton>
        )}

        {screen.sharing &&
          (screen.hidden ? (
            <ControlButton onClick={screen.show} active data-testid="show-screen">
              <EyeOffIcon className="size-4" /> Hidden {screen.hiddenFor}s · Show
            </ControlButton>
          ) : (
            <ControlButton onClick={screen.hide} data-testid="hide-screen">
              <EyeOffIcon className="size-4" /> Hide {HIDE_SECONDS}s
            </ControlButton>
          ))}
      </div>

      {/* Right: panels, host settings, and leave. */}
      <div className="flex items-center justify-end gap-2">
        <ControlButton onClick={props.onToggleSidebar} active={props.sidebarOpen} data-testid="goals-toggle">
          <ListIcon className="size-4" /> Goals
        </ControlButton>
        {props.isHost && (
          <ControlButton onClick={props.onOpenSettings} aria-label="Room settings" title="Room settings">
            <GearIcon className="size-4" />
          </ControlButton>
        )}
        <button
          onClick={props.onLeave}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-danger px-5 text-sm font-semibold text-white hover:opacity-90"
        >
          <LeaveIcon className="size-4" /> Leave
        </button>
      </div>
    </footer>
  );
}

function ControlButton({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        active ? "bg-accent text-accent-ink hover:bg-accent-hover" : "bg-surface-2 text-text hover:bg-border",
        className,
      )}
      {...props}
    />
  );
}

export function PausedOverlay({ onTurnOn, error }: { onTurnOn: () => void; error: string | null }) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-bg/95 p-6 text-center backdrop-blur-sm"
      data-testid="paused"
    >
      <h2 className="text-3xl font-semibold tracking-tight">You&apos;re paused</h2>
      <p className="max-w-md text-muted">
        Your camera is off. Turn it back on to keep studying with the group. Study time doesn&apos;t count
        while you&apos;re paused.
      </p>
      {error && <p className="max-w-md text-sm text-danger">{error}</p>}
      <Button size="lg" onClick={onTurnOn} className="mt-2" data-testid="camera-on">
        <CameraIcon className="size-5" /> Turn camera on
      </Button>
    </div>
  );
}
