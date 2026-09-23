"use client";

import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { EyeOffIcon, ListIcon, MicIcon, MicOffIcon, ScreenIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { describeMediaError, SCREEN_CAPTURE } from "@/lib/media";
import type { Phase } from "@/lib/timer";

const HIDE_SECONDS = 30;

// Everything about *my* screen share: re-sharing, and hiding it for a moment.
export function useMyScreen() {
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const [hiddenFor, setHiddenFor] = useState(0); // seconds left, 0 = visible
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  const pub = () => localParticipant.getTrackPublication(Track.Source.ScreenShare);

  const show = useCallback(async () => {
    clearInterval(timer.current);
    setHiddenFor(0);
    await localParticipant.getTrackPublication(Track.Source.ScreenShare)?.unmute();
  }, [localParticipant]);

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
          localParticipant.getTrackPublication(Track.Source.ScreenShare)?.unmute();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function share() {
    setError(null);
    try {
      await localParticipant.setScreenShareEnabled(true, SCREEN_CAPTURE);
      setHiddenFor(0);
    } catch (err) {
      setError(describeMediaError(err, "screen"));
    }
  }

  useEffect(() => () => clearInterval(timer.current), []);

  const hidden = hiddenFor > 0;
  // If the share ended while hidden (browser "Stop sharing"), we're paused, not hidden.
  const paused = !isScreenShareEnabled && !(hidden && pub());
  return { paused, hidden, hiddenFor, hide, show, share, error };
}

export function ControlBar(props: {
  phase: Phase;
  screen: ReturnType<typeof useMyScreen>;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
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
    <footer className="flex shrink-0 flex-col items-center gap-1 pb-3">
      {(micError || screen.error) && <p className="text-xs text-danger">{micError ?? screen.error}</p>}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2">
        <Button
          variant={isMicrophoneEnabled ? "secondary" : "ghost"}
          onClick={toggleMic}
          disabled={focus}
          title={focus ? "Mics are off during focus. Chat on the break!" : undefined}
          data-testid="mic"
        >
          {isMicrophoneEnabled ? <MicIcon className="size-4 text-break" /> : <MicOffIcon className="size-4" />}
          {focus ? "Muted for focus" : isMicrophoneEnabled ? "Mute" : "Unmute"}
        </Button>

        <Button
          variant="ghost"
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          data-testid="camera"
        >
          <span className={cn("size-2 rounded-full", isCameraEnabled ? "bg-break" : "bg-muted")} />
          {isCameraEnabled ? "Camera on" : "Camera off"}
        </Button>

        {screen.hidden ? (
          <Button variant="secondary" onClick={screen.show} data-testid="show-screen">
            <EyeOffIcon className="size-4" /> Hidden · {screen.hiddenFor}s · Show now
          </Button>
        ) : (
          <Button variant="ghost" onClick={screen.hide} disabled={screen.paused} data-testid="hide-screen">
            <EyeOffIcon className="size-4" /> Hide screen {HIDE_SECONDS}s
          </Button>
        )}

        <Button variant="ghost" onClick={screen.share} title="Share a different window">
          <ScreenIcon className="size-4" /> Switch window
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button variant={props.sidebarOpen ? "secondary" : "ghost"} onClick={props.onToggleSidebar}>
          <ListIcon className="size-4" /> Goals
        </Button>
      </div>
    </footer>
  );
}

export function PausedOverlay({ onShare }: { onShare: () => void }) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-bg/90 p-6 text-center backdrop-blur-sm"
      data-testid="paused"
    >
      <h2 className="font-display text-4xl">You&apos;re paused</h2>
      <p className="max-w-md text-muted">
        Your screen share stopped. Share a window to keep studying with the group. Study time doesn&apos;t
        count while you&apos;re paused.
      </p>
      <Button size="lg" onClick={onShare} className="mt-2" data-testid="reshare">
        <ScreenIcon className="size-5" /> Share a window
      </Button>
    </div>
  );
}
