import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
};

/**
 * Creates a shared Postgres client for the app process.
 */
const createClient = () => {
  const { DATABASE_URL } = getEnv();
  return postgres(DATABASE_URL, { max: 10, prepare: false });
};

const client = globalForDb.postgresClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
