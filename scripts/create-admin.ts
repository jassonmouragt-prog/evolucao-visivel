import nextEnv from "@next/env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { z } from "zod";
import { adminUsers } from "../src/db/schema";
import { hashPassword } from "../src/lib/security";
nextEnv.loadEnvConfig(process.cwd(), true);
const email=z.email().parse(process.env.ADMIN_EMAIL).toLowerCase();
const password=z.string().min(14,"Senha deve possuir ao menos 14 caracteres.").parse(process.env.ADMIN_PASSWORD);
if(!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL.");
const client=postgres(process.env.DATABASE_URL,{max:1});
try { await drizzle(client).insert(adminUsers).values({email,passwordHash:hashPassword(password)});process.stdout.write("Administrador criado.\n"); }
finally { await client.end(); }
