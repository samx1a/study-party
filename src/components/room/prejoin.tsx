"use client";

import type { LocalTrack, LocalVideoTrack } from "livekit-client";
import { TrackEvent } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink, ErrorText } from "@/components/ui";
import { canShareScreen, createCameraTrack, createScreenTrack, describeMediaError } from "@/lib/media";
import { cn } from "@/lib/cn";

type Props = {
  roomName: string;
  joining: boolean;
  error?: string;
  onJoin: (camera: LocalVideoTrack, screen: LocalTrack) => void;
};

function Preview({ track, mirror }: { track: LocalTrack | null; mirror?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!track || !el) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);
  return (
    <video
      ref={ref}
      muted
      playsInline
      autoPlay
      className={cn("size-full object-contain", mirror && "-scale-x-100 object-cover")}
    />
  );
}

export function Prejoin({ roomName, joining, error, onJoin }: Props) {
  const [camera, setCamera] = useState<LocalVideoTrack | null>(null);
  const [screen, setScreen] = useState<LocalTrack | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const handedOff = useRef(false);
  const tracksRef = useRef<{ camera: LocalTrack | null; screen: LocalTrack | null }>({ camera: null, screen: null });

  useEffect(() => {
    setSupported(canShareScreen());
  }, []);

  useEffect(() => {
    tracksRef.current = { camera, screen };
  }, [camera, screen]);

  // Stop the camera/screen if the person leaves the page without joining.
  useEffect(() => {
    return () => {
      if (handedOff.current) return;
      tracksRef.current.camera?.stop();
      tracksRef.current.screen?.stop();
    };
  }, []);

  // If they click "Stop sharing" in the browser bar before joining, clear the screen.
  useEffect(() => {
    if (!screen) return;
    const onEnded = () => setScreen(null);
    screen.on(TrackEvent.Ended, onEnded);
    return () => {
      screen.off(TrackEvent.Ended, onEnded);
    };
  }, [screen]);

  async function startCamera() {
    setCamError(null);
    try {
      setCamera(await createCameraTrack());
    } catch (err) {
      setCamError(describeMediaError(err, "camera"));
    }
  }

  async function pickScreen() {
    setScreenError(null);
    try {
      screen?.stop();
      setScreen(await createScreenTrack());
    } catch (err) {
      setScreenError(describeMediaError(err, "screen"));
    }
  }

  if (!supported) {
    return (
      <Shell roomName={roomName}>
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <h2 className="font-display text-3xl">Open this on a computer</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Study Party needs screen sharing, which phones and tablets don&apos;t support. Open this link in
            Chrome, Edge, Firefox, or Safari on a laptop or desktop.
          </p>
          <ButtonLink href="/dashboard" variant="secondary" className="mt-6">
            Back to dashboard
          </ButtonLink>
        </div>
      </Shell>
    );
  }

  const ready = !!camera && !!screen;

  return (
    <Shell roomName={roomName}>
      <div className="grid gap-4 md:grid-cols-2">
        <Step
          n={1}
          title="Camera"
          done={!!camera}
          hint="Friends see you in a small bubble."
          media={camera ? <Preview track={camera} mirror /> : null}
          action={
            camera ? null : (
              <Button onClick={startCamera} data-testid="start-camera">
                Turn on camera
              </Button>
            )
          }
          error={camError}
        />
        <Step
          n={2}
          title="Screen"
          done={!!screen}
          hint="Share one window, like your notes or IDE. Not your whole screen."
          media={screen ? <Preview track={screen} /> : null}
          action={
            <Button variant={screen ? "secondary" : "primary"} onClick={pickScreen} data-testid="pick-screen">
              {screen ? "Pick a different window" : "Choose a window"}
            </Button>
          }
          error={screenError}
        />
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <ErrorText>{error}</ErrorText>
        <Button
          size="lg"
          className="w-full max-w-xs"
          disabled={!ready || joining}
          onClick={() => {
            if (!camera || !screen) return;
            handedOff.current = true;
            onJoin(camera, screen);
          }}
          data-testid="join"
        >
          {joining ? "Joining…" : ready ? "Join room" : "Turn on camera and screen to join"}
        </Button>
        <p className="text-center text-xs text-muted">
          Your mic starts muted and stays muted during focus time. Nothing is recorded.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ roomName, children }: { roomName: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10">
      <p className="text-sm text-muted">Joining</p>
      <h1 className="mb-8 font-display text-4xl">{roomName}</h1>
      {children}
    </main>
  );
}

function Step(props: {
  n: number;
  title: string;
  hint: string;
  done: boolean;
  media: React.ReactNode;
  action: React.ReactNode;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-6 place-items-center rounded-full text-xs font-bold",
            props.done ? "bg-break text-bg" : "bg-surface-2 text-muted",
          )}
        >
          {props.done ? "✓" : props.n}
        </span>
        <h2 className="font-semibold">{props.title}</h2>
      </div>
      <div className="grid aspect-video place-items-center overflow-hidden rounded-xl bg-bg">
        {props.media ?? <p className="px-6 text-center text-sm text-muted">{props.hint}</p>}
      </div>
      {props.error && <ErrorText>{props.error}</ErrorText>}
      {props.action}
    </div>
  );
}
