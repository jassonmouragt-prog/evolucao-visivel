import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, sql } from "drizzle-orm";
import { database } from "@/db";
import { accessCodes, adminUsers, sessions, loginAttempts } from "@/db/schema";
import { newToken, tokenHash, SESSION_DAYS, verifyPassword, hashPassword } from "./security";
import { codeSchema } from "./validation";
import { AppError } from "./errors";
export { AppError } from "./errors";

export const teacherCookie = "ev_teacher";
export const adminCookie = "ev_admin";
const dummyHash = hashPassword("constant-timing-dummy-password");

export async function rateLimit(kind: string, credential: string) {
  const h = await headers();
  const ip = process.env.VERCEL ? h.get("x-vercel-forwarded-for")?.split(",")[0] : process.env.TRUST_PROXY === "true" ? h.get("x-forwarded-for")?.split(",")[0] : "untrusted-proxy";
  // Shared PostgreSQL counters work across serverless instances. Never store raw codes or IPs.
  for (const key of [`${kind}:ip:${ip ?? "unknown"}`, `${kind}:credential:${credential}`]) {
    const hashed = tokenHash(key);
    const [row] = await database().insert(loginAttempts).values({key:hashed,attempts:1}).onConflictDoUpdate({target:loginAttempts.key,set:{
      attempts:sql`CASE WHEN ${loginAttempts.windowStart} < now() - interval '15 minutes' THEN 1 ELSE ${loginAttempts.attempts} + 1 END`,
      windowStart:sql`CASE WHEN ${loginAttempts.windowStart} < now() - interval '15 minutes' THEN now() ELSE ${loginAttempts.windowStart} END`
    }}).returning();
    const max = key.includes(":ip:") ? 30 : 8;
    if (row.blockedUntil > new Date() || row.attempts > max) {
      if (row.blockedUntil <= new Date()) await database().update(loginAttempts).set({blockedUntil:new Date(Date.now()+15*60*1000)}).where(eq(loginAttempts.key,hashed));
      throw new AppError("Muitas tentativas. Aguarde 15 minutos e tente novamente.");
    }
    if (row.attempts > 3) await new Promise(resolve=>setTimeout(resolve,Math.min((row.attempts-3)*200,1200)));
  }
}
export async function issueSession(owner: {accessCodeId:string}|{adminId:string}) {
  const token=newToken();
  const expiresAt=new Date(Date.now()+SESSION_DAYS*86400000);
  await database().delete(sessions).where(sql`${sessions.expiresAt} < now()`);
  await database().insert(sessions).values({...owner,tokenHash:tokenHash(token),expiresAt});
  const name="adminId" in owner?adminCookie:teacherCookie;
  const jar=await cookies();
  const old=jar.get(name)?.value;
  if(old) await database().delete(sessions).where(eq(sessions.tokenHash,tokenHash(old)));
  jar.set(name,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",expires:expiresAt});
}
export async function loginTeacher(raw:string) {
  const parsed=codeSchema.safeParse(raw);
  await rateLimit("teacher",parsed.success?parsed.data:raw.slice(0,32));
  if(!parsed.success) throw new AppError("Código inválido ou acesso indisponível.");
  const [access]=await database().select().from(accessCodes).where(and(eq(accessCodes.code,parsed.data),eq(accessCodes.status,"active"))).limit(1);
  if(!access) throw new AppError("Código inválido ou acesso indisponível.");
  await issueSession({accessCodeId:access.id});
  await database().update(accessCodes).set({lastAccessAt:new Date()}).where(eq(accessCodes.id,access.id));
}
export async function loginAdmin(email:string,password:string) {
  await rateLimit("admin",email.trim().toLowerCase());
  const [admin]=await database().select().from(adminUsers).where(eq(adminUsers.email,email.trim().toLowerCase())).limit(1);
  const valid=verifyPassword(password,admin?.passwordHash??dummyHash);
  if(!admin||!valid) throw new AppError("E-mail ou senha inválidos.");
  await issueSession({adminId:admin.id});
}
export async function requireTeacher() {
  const token=(await cookies()).get(teacherCookie)?.value;
  if(!token) redirect("/acesso");
  const [row]=await database().select({access:accessCodes}).from(sessions).innerJoin(accessCodes,eq(sessions.accessCodeId,accessCodes.id)).where(and(eq(sessions.tokenHash,tokenHash(token)),gt(sessions.expiresAt,new Date()),eq(accessCodes.status,"active"))).limit(1);
  if(!row) redirect("/acesso");
  return row.access;
}
export async function requireAdmin() {
  const token=(await cookies()).get(adminCookie)?.value;
  if(!token) redirect("/admin/login");
  const [row]=await database().select({admin:adminUsers}).from(sessions).innerJoin(adminUsers,eq(sessions.adminId,adminUsers.id)).where(and(eq(sessions.tokenHash,tokenHash(token)),gt(sessions.expiresAt,new Date()))).limit(1);
  if(!row) redirect("/admin/login");
  return row.admin;
}
export async function logout(kind:"teacher"|"admin") {
  const jar=await cookies();const name=kind==="admin"?adminCookie:teacherCookie;const token=jar.get(name)?.value;
  if(token) await database().delete(sessions).where(eq(sessions.tokenHash,tokenHash(token)));
  jar.delete(name);
}
