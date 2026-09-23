import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { goal } from "@/db/schema";
import { handler, HttpError, parseBody, requireApiUser } from "@/lib/api";
import { broadcast } from "@/lib/livekit";
import { requireMember } from "@/lib/rooms";

type Ctx = RouteContext<"/api/rooms/[id]/goals/[goalId]">;

// You can only change your own goals.
async function ownGoal(ctx: Ctx) {
  const { id, goalId } = await ctx.params;
  const me = await requireApiUser();
  await requireMember(id, me.id);
  const where = and(eq(goal.id, goalId), eq(goal.roomId, id), eq(goal.userId, me.id));
  const [row] = await db.select({ id: goal.id }).from(goal).where(where).limit(1);
  if (!row) throw new HttpError(404, "Goal not found.", "not_found");
  return { roomId: id, where };
}

const patch = z.object({ done: z.boolean() });

export const PATCH = handler(async (req, ctx: Ctx) => {
  const { roomId, where } = await ownGoal(ctx);
  const { done } = await parseBody(req, patch);
  const [row] = await db
    .update(goal)
    .set({ done, completedAt: done ? new Date() : null })
    .where(where)
    .returning({ id: goal.id, userId: goal.userId, text: goal.text, done: goal.done });
  await broadcast(roomId, { type: "goals-updated" });
  return NextResponse.json(row);
});

export const DELETE = handler(async (_req, ctx: Ctx) => {
  const { roomId, where } = await ownGoal(ctx);
  await db.delete(goal).where(where);
  await broadcast(roomId, { type: "goals-updated" });
  return new NextResponse(null, { status: 204 });
});
