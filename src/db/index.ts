import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Reuse one connection pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

function client() {
  if (!globalForDb.pg) {
    // `prepare: false` keeps us compatible with poolers like Supabase's (PgBouncer).
    globalForDb.pg = postgres(env().DATABASE_URL, { prepare: false, max: 5 });
  }
  return globalForDb.pg;
}

export const db = drizzle({ client: client(), schema });
export { schema };
