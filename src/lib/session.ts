import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

// One session lookup per request, no matter how many components ask.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

// For pages: send signed-out visitors to enter a name (or sign in), then back here.
export async function requireUser(returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/join?next=${encodeURIComponent(returnTo)}`);
  return session.user;
}
