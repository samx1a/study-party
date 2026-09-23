"use client";

import { useIsMuted, useIsSpeaking, VideoTrack, type TrackReference } from "@livekit/components-react";
import { type Participant, Track } from "livekit-client";
import { EyeOffIcon, MicIcon, MicOffIcon, PauseIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

type Props = {
  participant: Participant;
  screen?: TrackReference;
  camera?: TrackReference;
  goals: { done: number; total: number };
  size: "grid" | "spotlight" | "strip";
  canRemove: boolean;
  onRemove: () => void;
  onClick: () => void;
};

export function ParticipantTile({
  participant,
  screen,
  camera,
  goals,
  size,
  canRemove,
  onRemove,
  onClick,
}: Props) {
  const name = participant.name || "Someone";
  const speaking = useIsSpeaking(participant);
  const micMuted = useIsMuted({ participant, source: Track.Source.Microphone });
  const small = size === "strip";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={cn(
        "group relative size-full cursor-pointer overflow-hidden rounded-xl border border-border bg-surface",
        speaking && "ring-2 ring-break-ink",
      )}
      data-testid="tile"
      data-name={name}
    >
      <TileMedia participant={participant} screen={screen} camera={camera} name={name} small={small} />

      <div className="absolute bottom-2 left-2 flex max-w-[70%] items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur">
        {micMuted ? (
          <MicOffIcon className="size-3.5 shrink-0 text-muted" />
        ) : (
          <MicIcon className="size-3.5 shrink-0 text-break-ink" />
        )}
        <span className="truncate">
          {name}
          {participant.isLocal && " (you)"}
        </span>
        {!small && goals.total > 0 && (
          <span className="shrink-0 text-white/70">
            · {goals.done}/{goals.total} goals
          </span>
        )}
      </div>

      {canRemove && !small && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Remove ${name} from this room? They won't be able to rejoin.`)) onRemove();
          }}
          className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-danger opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          Remove
        </button>
      )}
    </div>
  );
}

// Main area: your shared screen (with your camera in a bubble) if you're sharing,
// otherwise your camera fills the tile. Camera off = paused.
function TileMedia(props: {
  participant: Participant;
  screen?: TrackReference;
  camera?: TrackReference;
  name: string;
  small: boolean;
}) {
  const { participant, screen, camera, name, small } = props;
  const cameraOff = useIsMuted({ participant, source: Track.Source.Camera }) || !camera;
  const screenHidden = useIsMuted({ participant, source: Track.Source.ScreenShare });
  const screenLive = !!screen && !screenHidden;
  const mirror = participant.isLocal;

  return (
    <>
      {screenLive ? (
        <VideoTrack trackRef={screen} className="size-full bg-black object-contain" />
      ) : !cameraOff && camera ? (
        <VideoTrack trackRef={camera} className={cn("size-full object-cover", mirror && "-scale-x-100")} />
      ) : (
        <Placeholder small={small} tone="warn" icon={<PauseIcon className="size-5" />}>
          Paused, camera off
        </Placeholder>
      )}

      {screenLive && (
        <CameraBubble camera={cameraOff ? undefined : camera} name={name} small={small} mirror={mirror} />
      )}

      {!small && screen && screenHidden && (
        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
          <EyeOffIcon className="size-3.5" /> Screen hidden
        </span>
      )}
    </>
  );
}

function CameraBubble({
  camera,
  name,
  small,
  mirror,
}: {
  camera?: TrackReference;
  name: string;
  small: boolean;
  mirror: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute right-2 bottom-2 overflow-hidden rounded-full border-2 border-surface bg-surface-2 shadow-md",
        small ? "size-10" : "aspect-square w-[20%] min-w-14 max-w-32",
      )}
    >
      <span className="grid size-full place-items-center text-sm font-semibold text-muted">
        {initials(name)}
      </span>
      {camera && <CameraVideo camera={camera} mirror={mirror} />}
    </div>
  );
}

function CameraVideo({ camera, mirror }: { camera: TrackReference; mirror: boolean }) {
  const off = useIsMuted(camera);
  if (off) return null;
  return (
    <VideoTrack
      trackRef={camera}
      className={cn("absolute inset-0 size-full object-cover", mirror && "-scale-x-100")}
    />
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function Placeholder(props: {
  small: boolean;
  tone: "warn" | "muted";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-2 bg-surface-2",
        props.tone === "warn" ? "text-warn" : "text-muted",
      )}
    >
      {props.icon}
      {!props.small && <span className="text-sm">{props.children}</span>}
    </div>
  );
}
