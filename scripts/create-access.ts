import nextEnv from "@next/env";
import { ilike } from "drizzle-orm";
import { database, closeDatabase } from "../src/db";
import { accessCodes } from "../src/db/schema";
import { generateCode } from "../src/lib/security";
import { accessSchema } from "../src/lib/validation";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const honorific = /^(prof|profa|professor|professora|dr|dra|doutor|doutora)\.?$/i;

const name = arg("name");
if (!name || process.argv.includes("--help")) {
  process.stdout.write(
    'Uso: npm run access:create -- --name "Prof. Jullya" [--email cliente@email.com] [--plan individual|pro] [--limit 10] [--code JUL10-42M]\n',
  );
  process.exit(name ? 0 : 1);
}

const input = accessSchema.parse({
  customerName: name,
  customerEmail: arg("email") ?? "",
  plan: arg("plan") ?? "individual",
  studentLimit: Number(arg("limit") ?? 10),
  code: arg("code") ?? "",
});

if (!process.env.DATABASE_URL) nextEnv.loadEnvConfig(process.cwd(), false);
if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL.");

try {
  const db = database();
  const [existing] = await db.select().from(accessCodes).where(ilike(accessCodes.customerName, input.customerName));
  if (existing) {
    process.stdout.write(`Acesso já existe. Cliente: ${existing.customerName} · Código: ${existing.code} · Plano: ${existing.plan} · Situação: ${existing.status}\n`);
    process.exit(0);
  }
  const studentLimit = input.plan === "individual" ? 10 : input.studentLimit;
  const base = input.customerName.split(/\s+/).filter(w => !honorific.test(w)).join(" ") || input.customerName;
  let code = input.code ?? generateCode(base);
  for (let attempt = 0; attempt < 50; attempt++) {
    const [row] = await db
      .insert(accessCodes)
      .values({ ...input, studentLimit, code })
      .onConflictDoNothing({ target: accessCodes.code })
      .returning();
    if (row) {
      process.stdout.write(
        `Acesso criado. Cliente: ${row.customerName} · Código: ${row.code} · Plano: ${row.plan} · Limite: ${row.studentLimit} alunos · Situação: ${row.status}\n`,
      );
      process.exit(0);
    }
    if (input.code) throw new Error("Este código já existe. Escolha outro código.");
    code = generateCode(base);
  }
  throw new Error("Não foi possível gerar um código único.");
} finally {
  await closeDatabase();
}
