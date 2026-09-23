"use client";

import type { RoomState } from "@/lib/room-types";

export function RoomView(props: {
  initial: RoomState;
  userName: string;
  onLeave: () => void;
  onKicked: () => void;
}) {
  return <div>{props.initial.room.name}</div>;
}
