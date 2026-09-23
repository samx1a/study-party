import { z } from "zod";

// Validated server-side environment. Importing this from client code is a bug:
// the secrets below must never reach the browser.
const schema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url(),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  LIVEKIT_URL: z.string().url(),
  NEXT_PUBLIC_LIVEKIT_URL: z.string().url(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

// Parsed lazily so `next build` works without every variable set.
export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid or missing environment variables: ${missing}`);
    }
    cached = parsed.data;
  }
  return cached;
}
