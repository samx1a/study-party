import "server-only";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export async function requireApiUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new HttpError(401, "Sign in first.", "unauthorized");
  return session.user;
}

export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new HttpError(400, "Expected a JSON body.", "bad_json");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input.", "invalid");
  }
  return parsed.data;
}

// Blocks cross-site writes (CSRF). Browsers always send Origin on POST/PATCH/DELETE
// from fetch; a mismatch means another site is trying to act as the signed-in user.
function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients; still need a valid session cookie
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host || new URL(origin).host !== host) {
    throw new HttpError(403, "Cross-site request blocked.", "bad_origin");
  }
}

// Wraps a route handler so thrown HttpErrors become clean JSON responses.
export function handler<Ctx>(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong.", code: "internal" }, { status: 500 });
    }
  };
}
