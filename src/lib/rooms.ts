import "server-only";
import { and, asc, desc, eq, gt } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { db } from "@/db";
import { goal, room, roomMember, user, type Room } from "@/db/schema";
import { GOAL_WINDOW_HOURS, type RoomState } from "@/lib/room-types";
import { HttpError } from "@/lib/api";

// No look-alike characters (0/O, 1/l/I), so links survive being read aloud.
const newRoomId = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 10);

export const ROOM_LIMITS = {
  nameMax: 60,
  focusMin: 5,
  focusMax: 120,
  breakMin: 1,
  breakMax: 60,
  maxRoomsPerUser: 20,
};

export async function createRoom(ownerId: string, name: string) {
  const owned = await db.$count(room, eq(room.ownerId, ownerId));
  if (owned >= ROOM_LIMITS.maxRoomsPerUser) {
    throw new HttpError(400, `You can own up to ${ROOM_LIMITS.maxRoomsPerUser} rooms. Delete one first.`);
  }
  const id = newRoomId();
  await db.transaction(async (tx) => {
    await tx.insert(room).values({ id, name, ownerId });
    await tx.insert(roomMember).values({ roomId: id, userId: ownerId });
  });
  return id;
}

export async function getRoom(roomId: string) {
  const [row] = await db.select().from(room).where(eq(room.id, roomId)).limit(1);
  return row;
}

// Opening a room link makes you a member. Banned members stay banned.
export async function joinRoom(roomId: string, userId: string) {
  const r = await getRoom(roomId);
  if (!r) throw new HttpError(404, "This room doesn't exist.", "not_found");
  const [member] = await db
    .insert(roomMember)
    .values({ roomId, userId })
    .onConflictDoUpdate({
      target: [roomMember.roomId, roomMember.userId],
      set: { lastSeenAt: new Date() },
    })
    .returning();
  if (member.banned) throw new HttpError(403, "The host removed you from this room.", "banned");
  return { room: r, member };
}

// For API routes: must already be a non-banned member.
export async function requireMember(roomId: string, userId: string) {
  const [row] = await db
    .select({ room, banned: roomMember.banned })
    .from(roomMember)
    .innerJoin(room, eq(room.id, roomMember.roomId))
    .where(and(eq(roomMember.roomId, roomId), eq(roomMember.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError(404, "Room not found.", "not_found");
  if (row.banned) throw new HttpError(403, "The host removed you from this room.", "banned");
  return row.room;
}

export async function requireHost(roomId: string, userId: string) {
  const r = await requireMember(roomId, userId);
  if (r.ownerId !== userId) throw new HttpError(403, "Only the host can do that.", "not_host");
  return r;
}

export async function listMyRooms(userId: string) {
  return db
    .select({
      id: room.id,
      name: room.name,
      ownerId: room.ownerId,
      ownerName: user.name,
      lastSeenAt: roomMember.lastSeenAt,
    })
    .from(roomMember)
    .innerJoin(room, eq(room.id, roomMember.roomId))
    .innerJoin(user, eq(user.id, room.ownerId))
    .where(and(eq(roomMember.userId, userId), eq(roomMember.banned, false)))
    .orderBy(desc(roomMember.lastSeenAt));
}

export async function getRoomState(r: Room, userId: string): Promise<RoomState> {
  const since = new Date(Date.now() - GOAL_WINDOW_HOURS * 3600_000);
  const goals = await db
    .select({ id: goal.id, userId: goal.userId, userName: user.name, text: goal.text, done: goal.done })
    .from(goal)
    .innerJoin(user, eq(user.id, goal.userId))
    .where(and(eq(goal.roomId, r.id), gt(goal.createdAt, since)))
    .orderBy(asc(goal.createdAt));

  return {
    serverNow: Date.now(),
    me: { id: userId, isHost: r.ownerId === userId },
    room: {
      id: r.id,
      name: r.name,
      ownerId: r.ownerId,
      focusMinutes: r.focusMinutes,
      breakMinutes: r.breakMinutes,
      timerStartedAt: r.timerStartedAt?.getTime() ?? null,
      maxParticipants: r.maxParticipants,
    },
    goals,
  };
}
