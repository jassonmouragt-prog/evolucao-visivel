import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, sql } from "drizzle-orm";
import { database } from "@/db";
import { accessCodes, portalSettings, responsibleContacts, responsibleSessions, responsibleStudentAccess, students, teacherProfiles } from "@/db/schema";
import { newToken, tokenHash, SESSION_DAYS } from "./security";
import { rateLimit } from "./auth";
import { defaultPortalSettings, portalSettingsView, type PortalSettingsView } from "./responsible-service";
import { codeSchema } from "./validation";
import { AppError } from "./errors";

export const responsibleCookie = "ev_responsavel";
export const invalidCodeMessage = "Código inválido ou indisponível.";

export type ResponsibleContext = {
  link: typeof responsibleStudentAccess.$inferSelect;
  student: typeof students.$inferSelect;
  contact: { name: string; phone: string; email: string | null } | null;
  settings: PortalSettingsView;
  teacher: { name: string; professionalName: string; phone: string; mainSubject: string } | null;
  access: typeof accessCodes.$inferSelect;
};

async function issueResponsibleSession(responsibleAccessId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  const db = database();
  await db.delete(responsibleSessions).where(sql`${responsibleSessions.expiresAt} < now()`);
  await db.insert(responsibleSessions).values({ responsibleAccessId, tokenHash: tokenHash(token), expiresAt });
  const jar = await cookies();
  const old = jar.get(responsibleCookie)?.value;
  if (old) await db.delete(responsibleSessions).where(eq(responsibleSessions.tokenHash, tokenHash(old)));
  jar.set(responsibleCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

export async function loginResponsible(raw: string): Promise<{ firstAccess: boolean }> {
  const parsed = codeSchema.safeParse(raw);
  await rateLimit("responsible", parsed.success ? parsed.data : raw.slice(0, 32));
  if (!parsed.success) throw new AppError(invalidCodeMessage);
  const [row] = await database()
    .select({ link: responsibleStudentAccess, student: students, settings: portalSettings, access: accessCodes })
    .from(responsibleStudentAccess)
    .innerJoin(students, and(eq(students.id, responsibleStudentAccess.studentId), eq(students.accessCodeId, responsibleStudentAccess.accessCodeId)))
    .innerJoin(accessCodes, and(eq(accessCodes.id, responsibleStudentAccess.accessCodeId), eq(accessCodes.status, "active")))
    .leftJoin(portalSettings, eq(portalSettings.accessCodeId, responsibleStudentAccess.accessCodeId))
    .where(eq(responsibleStudentAccess.code, parsed.data))
    .limit(1);
  if (!row || row.link.status !== "active" || !row.student.active || row.settings?.enabled === false) throw new AppError(invalidCodeMessage);
  const firstAccess = !row.link.lastAccessAt;
  await issueResponsibleSession(row.link.id);
  await database().update(responsibleStudentAccess).set({ lastAccessAt: new Date() }).where(eq(responsibleStudentAccess.id, row.link.id));
  return { firstAccess };
}

export async function requireResponsible(): Promise<ResponsibleContext> {
  const token = (await cookies()).get(responsibleCookie)?.value;
  if (!token) redirect("/responsavel");
  const [row] = await database()
    .select({ link: responsibleStudentAccess, student: students, contact: responsibleContacts, settings: portalSettings, profile: teacherProfiles, access: accessCodes })
    .from(responsibleSessions)
    .innerJoin(responsibleStudentAccess, eq(responsibleSessions.responsibleAccessId, responsibleStudentAccess.id))
    .innerJoin(responsibleContacts, eq(responsibleContacts.id, responsibleStudentAccess.responsibleId))
    .innerJoin(students, and(eq(students.id, responsibleStudentAccess.studentId), eq(students.accessCodeId, responsibleStudentAccess.accessCodeId)))
    .innerJoin(accessCodes, and(eq(accessCodes.id, responsibleStudentAccess.accessCodeId), eq(accessCodes.status, "active")))
    .leftJoin(teacherProfiles, eq(teacherProfiles.accessCodeId, responsibleStudentAccess.accessCodeId))
    .leftJoin(portalSettings, eq(portalSettings.accessCodeId, responsibleStudentAccess.accessCodeId))
    .where(and(eq(responsibleSessions.tokenHash, tokenHash(token)), gt(responsibleSessions.expiresAt, new Date()),
      eq(responsibleStudentAccess.status, "active"), eq(students.active, true)))
    .limit(1);
  if (!row) redirect("/responsavel");
  const settings = row.settings ? portalSettingsView(row.settings) : defaultPortalSettings;
  if (!settings.enabled) redirect("/responsavel?status=indisponivel");
  return {
    link: row.link, student: row.student,
    contact: row.contact ? { name: row.contact.name, phone: row.contact.phone, email: row.contact.email } : null,
    settings,
    teacher: row.profile ? { name: row.profile.name, professionalName: row.profile.professionalName, phone: row.profile.phone, mainSubject: row.profile.mainSubject } : null,
    access: row.access
  };
}

export async function logoutResponsible() {
  const jar = await cookies();
  const token = jar.get(responsibleCookie)?.value;
  if (token) await database().delete(responsibleSessions).where(eq(responsibleSessions.tokenHash, tokenHash(token)));
  jar.delete(responsibleCookie);
}
