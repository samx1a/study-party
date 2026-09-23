import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { goal } from "@/db/schema";
import { handler, HttpError, parseBody, requireApiUser } from "@/lib/api";
import { broadcast } from "@/lib/livekit";
import { GOAL_MAX_LENGTH, GOAL_WINDOW_HOURS, GOALS_PER_PERSON } from "@/lib/room-types";
import { requireMember } from "@/lib/rooms";

const body = z.object({
  text: z.string().trim().min(1, "Write a goal first.").max(GOAL_MAX_LENGTH, "Keep goals short."),
});

export const POST = handler(async (req, ctx: RouteContext<"/api/rooms/[id]/goals">) => {
  const { id } = await ctx.params;
  const me = await requireApiUser();
  await requireMember(id, me.id);
  const { text } = await parseBody(req, body);

  const since = new Date(Date.now() - GOAL_WINDOW_HOURS * 3600_000);
  const mine = await db.$count(goal, and(eq(goal.roomId, id), eq(goal.userId, me.id), gt(goal.createdAt, since)));
  if (mine >= GOALS_PER_PERSON) throw new HttpError(400, `Up to ${GOALS_PER_PERSON} goals per session.`);

  const [row] = await db
    .insert(goal)
    .values({ id: nanoid(12), roomId: id, userId: me.id, text })
    .returning({ id: goal.id, userId: goal.userId, text: goal.text, done: goal.done });
  await broadcast(id, { type: "goals-updated" });
  return NextResponse.json(row, { status: 201 });
});
