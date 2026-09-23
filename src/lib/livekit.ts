import "server-only";
import {
  AccessToken,
  DataPacket_Kind,
  type ParticipantInfo,
  RoomServiceClient,
  ServerError,
  TrackSource,
} from "livekit-server-sdk";
import { env } from "@/lib/env";

let client: RoomServiceClient | undefined;

export function roomService() {
  if (!client) {
    const e = env();
    client = new RoomServiceClient(e.LIVEKIT_URL, e.LIVEKIT_API_KEY, e.LIVEKIT_API_SECRET);
  }
  return client;
}

// A join token for one room. Browsers can publish camera, mic, and screen,
// but NOT data messages: only our server can broadcast room events.
export async function createJoinToken(opts: { roomId: string; userId: string; name: string }) {
  const e = env();
  const at = new AccessToken(e.LIVEKIT_API_KEY, e.LIVEKIT_API_SECRET, {
    identity: opts.userId,
    name: opts.name,
    ttl: "2h",
  });
  at.addGrant({
    room: opts.roomId,
    roomJoin: true,
    canSubscribe: true,
    canPublish: true,
    canPublishData: false,
    canUpdateOwnMetadata: false,
    canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE],
  });
  return at.toJwt();
}

export async function listParticipants(roomId: string): Promise<ParticipantInfo[]> {
  try {
    return await roomService().listParticipants(roomId);
  } catch (err) {
    // The room doesn't exist in LiveKit until someone joins. Treat that as empty.
    if (err instanceof ServerError && err.status === 404) return [];
    throw err;
  }
}

export async function getParticipant(roomId: string, identity: string) {
  try {
    return await roomService().getParticipant(roomId, identity);
  } catch (err) {
    if (err instanceof ServerError && err.status === 404) return null;
    throw err;
  }
}

// True if this participant has their camera on (published and not muted) right now.
export function isOnCamera(p: ParticipantInfo) {
  return p.tracks.some((t) => t.source === TrackSource.CAMERA && !t.muted);
}

export async function ensureLiveKitRoom(roomId: string, maxParticipants: number) {
  // Idempotent: returns the existing room if it's already running.
  await roomService().createRoom({ name: roomId, maxParticipants, emptyTimeout: 5 * 60 });
}

export type RoomEvent =
  { type: "room-updated" } | { type: "goals-updated" } | { type: "kicked"; userId: string };

// Nudge everyone in the room to refetch state. Best effort: clients also poll,
// so a failure here only delays updates by a few seconds.
export async function broadcast(roomId: string, event: RoomEvent) {
  try {
    const data = new TextEncoder().encode(JSON.stringify(event));
    await roomService().sendData(roomId, data, DataPacket_Kind.RELIABLE, { topic: "room-event" });
  } catch (err) {
    if (err instanceof ServerError && err.status === 404) return; // nobody is in the room
    console.warn("[livekit] broadcast failed", err);
  }
}

export async function removeParticipant(roomId: string, identity: string) {
  try {
    await roomService().removeParticipant(roomId, identity);
  } catch (err) {
    if (err instanceof ServerError && err.status === 404) return;
    throw err;
  }
}
