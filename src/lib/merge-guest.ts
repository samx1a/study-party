import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { goal, presence, room, roomMember, studyDay } from "@/db/schema";

// When a guest creates a real account (or signs in), move everything they did
// as a guest onto that account. The guest user is deleted right after.
export async function mergeGuestInto(guestId: string, userId: string) {
  if (guestId === userId) return;
  await db.transaction(async (tx) => {
    await tx.update(room).set({ ownerId: userId }).where(eq(room.ownerId, guestId));
    await tx.update(goal).set({ userId }).where(eq(goal.userId, guestId));

    // Memberships: copy over, keeping a ban if either had one.
    await tx.execute(sql`
      insert into ${roomMember} (room_id, user_id, banned, joined_at, last_seen_at)
      select room_id, ${userId}, banned, joined_at, last_seen_at from ${roomMember} where user_id = ${guestId}
      on conflict (room_id, user_id) do update set
        banned = ${roomMember.banned} or excluded.banned,
        last_seen_at = greatest(${roomMember.lastSeenAt}, excluded.last_seen_at)
    `);

    // Study days: add minutes together for days both studied.
    await tx.execute(sql`
      insert into ${studyDay} (user_id, day, minutes)
      select ${userId}, day, minutes from ${studyDay} where user_id = ${guestId}
      on conflict (user_id, day) do update set minutes = ${studyDay.minutes} + excluded.minutes
    `);

    await tx.delete(presence).where(and(eq(presence.userId, guestId)));
  });
}
