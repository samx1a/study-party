"use client";

import { useParticipants, useTracks, type TrackReference } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RoomGoal } from "@/lib/room-types";
import { ParticipantTile } from "./participant-tile";

type Props = {
  goals: RoomGoal[];
  canRemove: boolean;
  onRemove: (userId: string) => void;
};

// Lays out everyone's tile. Click a tile to spotlight it (big) with the rest in a strip.
export function VideoStage({ goals, canRemove, onRemove }: Props) {
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: false });
  const [spotlight, setSpotlight] = useState<string | null>(null);

  const byIdentity = useMemo(() => {
    const map = new Map<string, { camera?: TrackReference; screen?: TrackReference }>();
    for (const t of tracks) {
      const entry = map.get(t.participant.identity) ?? {};
      if (t.source === Track.Source.Camera) entry.camera = t;
      if (t.source === Track.Source.ScreenShare) entry.screen = t;
      map.set(t.participant.identity, entry);
    }
    return map;
  }, [tracks]);

  const goalCounts = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const g of goals) {
      const c = map.get(g.userId) ?? { done: 0, total: 0 };
      c.total += 1;
      if (g.done) c.done += 1;
      map.set(g.userId, c);
    }
    return map;
  }, [goals]);

  // Spotlighted person left: go back to the grid.
  const active = spotlight && participants.some((p) => p.identity === spotlight) ? spotlight : null;

  const tile = (identity: string, size: "grid" | "spotlight" | "strip") => {
    const p = participants.find((x) => x.identity === identity)!;
    const t = byIdentity.get(identity) ?? {};
    return (
      <ParticipantTile
        key={identity}
        participant={p}
        camera={t.camera}
        screen={t.screen}
        goals={goalCounts.get(identity) ?? { done: 0, total: 0 }}
        size={size}
        canRemove={canRemove && !p.isLocal}
        onRemove={() => onRemove(identity)}
        onClick={() => setSpotlight(active === identity ? null : identity)}
      />
    );
  };

  if (active) {
    const others = participants.filter((p) => p.identity !== active);
    return (
      <div className="flex size-full flex-col gap-3">
        <div className="min-h-0 flex-1">{tile(active, "spotlight")}</div>
        {others.length > 0 && (
          <div className="flex h-28 shrink-0 gap-3 overflow-x-auto">
            {others.map((p) => (
              <div key={p.identity} className="aspect-video h-full shrink-0">
                {tile(p.identity, "strip")}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <FitGrid count={participants.length}>{participants.map((p) => tile(p.identity, "grid"))}</FitGrid>;
}

const GAP = 12;

// Picks the column count that makes 16:9 tiles as large as possible in the space available.
function FitGrid({ count, children }: { count: number; children: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  let best = { cols: 1, w: 0 };
  for (let cols = 1; cols <= Math.max(1, count); cols++) {
    const rows = Math.ceil(count / cols);
    const w = Math.min((box.w - GAP * (cols - 1)) / cols, ((box.h - GAP * (rows - 1)) / rows) * (16 / 9));
    if (w > best.w) best = { cols, w };
  }

  return (
    <div ref={ref} className="flex size-full items-center justify-center">
      {/* Flex-wrap (not grid) so a half-empty last row is centered. */}
      <div
        className="flex flex-wrap justify-center"
        style={{ gap: GAP, width: best.cols * Math.floor(best.w) + GAP * (best.cols - 1) }}
      >
        {children.map((c, i) => (
          <div key={i} className="aspect-video" style={{ width: Math.floor(best.w) }}>
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
