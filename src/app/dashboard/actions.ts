"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { HttpError } from "@/lib/api";
import { createRoom, ROOM_LIMITS } from "@/lib/rooms";
import { getSession } from "@/lib/session";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Give your room a name.")
  .max(ROOM_LIMITS.nameMax, `Keep it under ${ROOM_LIMITS.nameMax} characters.`);

export async function createRoomAction(
  _prev: { error?: string },
  form: FormData,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/dashboard");

  const parsed = nameSchema.safeParse(form.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let id: string;
  try {
    id = await createRoom(session.user.id, parsed.data);
  } catch (err) {
    if (err instanceof HttpError) return { error: err.message };
    throw err;
  }
  redirect(`/r/${id}`);
}
