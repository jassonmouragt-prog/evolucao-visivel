import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Lazy connection: importing a server module never connects during a static build.
let instance: ReturnType<typeof createDatabase> | undefined;
let connection: ReturnType<typeof postgres> | undefined;
function createDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
  const client = postgres(process.env.DATABASE_URL, { max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false });
  connection = client;
  return drizzle(client, { schema });
}
export function database() { return instance ??= createDatabase(); }
export async function closeDatabase() { await connection?.end(); instance=undefined; connection=undefined; }
export type Database = ReturnType<typeof database>;
