import nextEnv from "@next/env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
nextEnv.loadEnvConfig(process.cwd(), true);
if(!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL.");
const client=postgres(process.env.DATABASE_URL,{max:1});
try { await migrate(drizzle(client),{migrationsFolder:"./drizzle"}); process.stdout.write("Migrations aplicadas.\n"); }
finally { await client.end(); }
