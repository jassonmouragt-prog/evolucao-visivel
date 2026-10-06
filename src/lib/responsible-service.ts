import { and, eq, ilike } from "drizzle-orm";
import { database } from "@/db";
import { activityLogs, makeupRequests, makeupSlots, portalSettings, responsibleContacts, responsibleSessions, responsibleStudentAccess, students } from "@/db/schema";
import { AppError } from "./errors";
import { generateResponsibleCode } from "./security";
import { ownedStudent } from "./tenancy";
import { makeupSlotSchema, portalSettingsSchema, responsibleAccessSchema, uuidSchema } from "./validation";
import { formatDate, today } from "./format";
import type { z } from "zod";

export type PortalSettingsView = {
  enabled: boolean; showFinance: boolean; showProgress: boolean; showLessonContent: boolean; showReports: boolean;
  rulesPayment: string; rulesCancellation: string; rulesReplacement: string; schedules: string; materials: string; otherInfo: string;
};
export const defaultPortalSettings: PortalSettingsView = {
  enabled: true, showFinance: true, showProgress: true, showLessonContent: true, showReports: true,
  rulesPayment: "", rulesCancellation: "", rulesReplacement: "", schedules: "", materials: "", otherInfo: ""
};
export function portalSettingsView(row: typeof portalSettings.$inferSelect): PortalSettingsView {
  return { enabled: row.enabled, showFinance: row.showFinance, showProgress: row.showProgress, showLessonContent: row.showLessonContent, showReports: row.showReports, rulesPayment: row.rulesPayment, rulesCancellation: row.rulesCancellation, rulesReplacement: row.rulesReplacement, schedules: row.schedules, materials: row.materials, otherInfo: row.otherInfo };
}
export async function getPortalSettings(owner: string): Promise<PortalSettingsView> {
  const [row] = await database().select().from(portalSettings).where(eq(portalSettings.accessCodeId, owner)).limit(1);
  return row ? portalSettingsView(row) : defaultPortalSettings;
}
export async function savePortalSettings(owner: string, input: z.input<typeof portalSettingsSchema>) {
  const values = portalSettingsSchema.parse(input);
  const db = database();
  const [row] = await db.select().from(portalSettings).where(eq(portalSettings.accessCodeId, owner)).limit(1);
  if (row) await db.update(portalSettings).set({ ...values, updatedAt: new Date() }).where(eq(portalSettings.id, row.id));
  else await db.insert(portalSettings).values({ accessCodeId: owner, ...values });
}
export async function ownedResponsibleAccess(owner: string, id: string) {
  const [row] = await database().select().from(responsibleStudentAccess).where(and(eq(responsibleStudentAccess.id, id), eq(responsibleStudentAccess.accessCodeId, owner))).limit(1);
  if (!row) throw new AppError("Acesso do responsável não encontrado.");
  return row;
}
export async function listResponsibleAccess(owner: string, studentId: string) {
  return database().select({ access: responsibleStudentAccess, contact: responsibleContacts })
    .from(responsibleStudentAccess)
    .innerJoin(responsibleContacts, eq(responsibleContacts.id, responsibleStudentAccess.responsibleId))
    .where(and(eq(responsibleStudentAccess.accessCodeId, owner), eq(responsibleStudentAccess.studentId, studentId)))
    .orderBy(responsibleStudentAccess.createdAt);
}
export async function createResponsibleAccess(owner: string, studentId: string, input: z.input<typeof responsibleAccessSchema>, automatic = false) {
  const student = await ownedStudent(owner, studentId);
  const values = responsibleAccessSchema.parse(input);
  const db = database();
  const [known] = await db.select().from(responsibleContacts).where(and(eq(responsibleContacts.accessCodeId, owner), ilike(responsibleContacts.name, values.name))).limit(1);
  const contact = known ?? (await db.insert(responsibleContacts).values({ accessCodeId: owner, name: values.name, phone: values.phone, email: values.email }).returning())[0];
  for (let attempt = 0; attempt < 50; attempt++) {
    const code = attempt === 0 && values.code ? values.code : generateResponsibleCode(student.name);
    const [row] = await db.insert(responsibleStudentAccess).values({ accessCodeId: owner, responsibleId: contact.id, studentId, code, status: "active" })
      .onConflictDoNothing({ target: responsibleStudentAccess.code }).returning();
    if (row) {
      await db.insert(activityLogs).values({ accessCodeId: owner, message: `Acesso do responsável criado para ${student.name}.` });
      return row;
    }
    if (values.code && !automatic) throw new AppError("Este código já existe. Escolha outro código.");
  }
  throw new AppError("Não foi possível gerar um código. Tente novamente.");
}
export async function changeResponsibleStatus(owner: string, id: string, status: "active" | "blocked" | "revoked") {
  const row = await ownedResponsibleAccess(owner, id);
  await database().transaction(async tx => {
    await tx.update(responsibleStudentAccess).set({ status, updatedAt: new Date() }).where(eq(responsibleStudentAccess.id, row.id));
    if (status !== "active") await tx.delete(responsibleSessions).where(eq(responsibleSessions.responsibleAccessId, row.id));
  });
}
export async function regenerateResponsibleCode(owner: string, id: string) {
  const row = await ownedResponsibleAccess(owner, id);
  const student = await ownedStudent(owner, row.studentId);
  const db = database();
  let code = row.code;
  await db.transaction(async tx => {
    for (let attempt = 0; attempt < 50; attempt++) {
      code = generateResponsibleCode(student.name);
      const [duplicate] = await tx.select({ id: responsibleStudentAccess.id }).from(responsibleStudentAccess).where(eq(responsibleStudentAccess.code, code));
      if (!duplicate) break;
      if (attempt === 49) throw new AppError("Não foi possível gerar um código único.");
    }
    await tx.update(responsibleStudentAccess).set({ code, updatedAt: new Date() }).where(eq(responsibleStudentAccess.id, row.id));
    await tx.delete(responsibleSessions).where(eq(responsibleSessions.responsibleAccessId, row.id));
    await tx.insert(activityLogs).values({ accessCodeId: owner, message: `Código do responsável de ${student.name} foi regenerado.` });
  });
  return code;
}
export async function deleteResponsibleAccess(owner: string, id: string) {
  const row = await ownedResponsibleAccess(owner, id);
  const db = database();
  await db.transaction(async tx => {
    await tx.delete(responsibleStudentAccess).where(eq(responsibleStudentAccess.id, row.id));
    const [stillUsed] = await tx.select({ id: responsibleStudentAccess.id }).from(responsibleStudentAccess)
      .where(eq(responsibleStudentAccess.responsibleId, row.responsibleId)).limit(1);
    if (!stillUsed) await tx.delete(responsibleContacts).where(eq(responsibleContacts.id, row.responsibleId));
  });
}
export function responsibleAccessMessage(responsible: string, student: string, code: string) {
  const portal = process.env.APP_URL ?? "https://evolucao-visivel.vercel.app";
  const who = responsible.trim() || "responsável";
  return `Olá, ${who}! 😊\n\nAgora você pode acompanhar as principais informações de ${student} pelo Evolução Visível.\n\nSeu código de acesso é:\n${code}\n\nAcesse: ${portal}/responsavel\n\nPor lá você poderá acompanhar aulas, evolução, pagamentos e outras informações disponibilizadas por mim.\n\nEsse código é pessoal.`;
}
export async function createMakeupSlot(owner: string, input: z.input<typeof makeupSlotSchema>) {
  const data = makeupSlotSchema.parse(input);
  const db = database();
  return db.transaction(async tx => {
    const [row] = await tx.insert(makeupSlots).values({ accessCodeId: owner, ...data }).returning();
    await tx.insert(activityLogs).values({ accessCodeId: owner, message: `Horário de reposição aberto em ${formatDate(data.date)}, das ${data.startTime} às ${data.endTime}.` });
    return row;
  });
}
export async function changeMakeupSlotStatus(owner: string, id: string, status: "available" | "unavailable") {
  uuidSchema.parse(id);
  const db = database();
  const [row] = await db.select().from(makeupSlots).where(and(eq(makeupSlots.id, id), eq(makeupSlots.accessCodeId, owner))).limit(1);
  if (!row) throw new AppError("Horário não encontrado.");
  if (status === "unavailable" && row.status !== "available") throw new AppError("Este horário já tem uma solicitação.");
  await db.update(makeupSlots).set({ status }).where(eq(makeupSlots.id, row.id));
}
export async function decideMakeupRequest(owner: string, id: string, decision: "approved" | "rejected") {
  uuidSchema.parse(id);
  const db = database();
  await db.transaction(async tx => {
    const [req] = await tx.select().from(makeupRequests)
      .where(and(eq(makeupRequests.id, id), eq(makeupRequests.accessCodeId, owner), eq(makeupRequests.status, "pending"))).limit(1);
    if (!req) throw new AppError("Solicitação não encontrada.");
    const [student] = await tx.select({ name: students.name }).from(students).where(eq(students.id, req.studentId)).limit(1);
    await tx.update(makeupRequests).set({ status: decision, updatedAt: new Date() }).where(eq(makeupRequests.id, req.id));
    await tx.update(makeupSlots).set({ status: decision === "approved" ? "confirmed" : "available" }).where(eq(makeupSlots.id, req.slotId));
    await tx.insert(activityLogs).values({ accessCodeId: owner, message: `Solicitação de reposição de ${student?.name ?? "aluno"} foi ${decision === "approved" ? "aprovada" : "rejeitada"}.` });
  });
}
export async function requestMakeupSlot(owner: string, linkId: string, studentId: string, slotId: string) {
  uuidSchema.parse(slotId);
  const db = database();
  const [slot] = await db.select().from(makeupSlots).where(and(eq(makeupSlots.id, slotId), eq(makeupSlots.accessCodeId, owner))).limit(1);
  if (!slot) throw new AppError("Horário não encontrado.");
  if (slot.status !== "available") throw new AppError("Este horário não está mais disponível.");
  if (slot.date < today()) throw new AppError("Este horário já passou.");
  try {
    await db.transaction(async tx => {
      const [existing] = await tx.select({ id: makeupRequests.id }).from(makeupRequests)
        .where(and(eq(makeupRequests.slotId, slotId), eq(makeupRequests.status, "pending"))).limit(1);
      if (existing) throw new AppError("Este horário já possui uma solicitação pendente.");
      await tx.insert(makeupRequests).values({ accessCodeId: owner, slotId, studentId, responsibleAccessId: linkId });
      await tx.update(makeupSlots).set({ status: "requested" }).where(eq(makeupSlots.id, slotId));
      await tx.insert(activityLogs).values({ accessCodeId: owner, message: `Solicitação de reposição enviada para ${formatDate(slot.date)}, ${slot.startTime}.` });
    });
  } catch (e) {
    if (String(e).includes("makeup_slot_one_pending")) throw new AppError("Este horário já possui uma solicitação pendente.");
    throw e;
  }
}
export async function cancelMakeupRequest(owner: string, linkId: string, id: string) {
  uuidSchema.parse(id);
  const db = database();
  await db.transaction(async tx => {
    const [req] = await tx.select().from(makeupRequests)
      .where(and(eq(makeupRequests.id, id), eq(makeupRequests.accessCodeId, owner), eq(makeupRequests.responsibleAccessId, linkId), eq(makeupRequests.status, "pending"))).limit(1);
    if (!req) throw new AppError("Solicitação não encontrada.");
    await tx.update(makeupRequests).set({ status: "cancelled", updatedAt: new Date() }).where(eq(makeupRequests.id, req.id));
    await tx.update(makeupSlots).set({ status: "available" }).where(and(eq(makeupSlots.id, req.slotId), eq(makeupSlots.status, "requested")));
  });
}
