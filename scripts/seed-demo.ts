import nextEnv from "@next/env";
import { eq } from "drizzle-orm";
import { database, closeDatabase } from "../src/db";
import { accessCodes, teacherProfiles, students, lessons, lessonPackages, progressEntries, payments, studentGoals, activityLogs } from "../src/db/schema";
import { saveReport, buildReportDraft } from "../src/lib/report-service";
import { monthPeriod } from "../src/lib/format";
import { codeSchema } from "../src/lib/validation";

const DEMO_CODE = codeSchema.parse("DEM06-10H");
const reset = process.argv.includes("--reset");
if (!process.env.DATABASE_URL) nextEnv.loadEnvConfig(process.cwd(), false);
if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL.");

const day = (offset: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + offset * 86400000));
const ago = (days: number) => new Date(Date.now() - days * 86400000);

try {
  const db = database();
  const [existing] = await db.select().from(accessCodes).where(eq(accessCodes.code, DEMO_CODE));
  if (existing && !reset) {
    process.stdout.write(`Demo já existe. Código: ${DEMO_CODE}\nUse "npm run demo:seed -- --reset" para restaurar os dados.\n`);
  } else {
    if (existing) await db.delete(accessCodes).where(eq(accessCodes.id, existing.id));
    const period = monthPeriod();
    const month = (offset: number) => { const d = day(offset); return d < period.start ? period.start : d; };
    const [access] = await db.insert(accessCodes).values({ code: DEMO_CODE, customerName: "Demonstração", customerEmail: "demo@evolucao-visivel.test", plan: "individual", studentLimit: 10 }).returning();
    const owner = access.id;
    await db.insert(teacherProfiles).values({ accessCodeId: owner, name: "Ana Beatriz", professionalName: "Ana Beatriz · Acompanhamento particular", email: "contato@demo.test", phone: "(11) 98000-0000", mainSubject: "Matemática", onboardingCompleted: true });

    const data = [
      { name: "João Pedro", grade: "8º ano", subject: "Matemática", responsible: "Ana Paula", goal: "Resolver problemas com autonomia", difficulties: "Problemas contextualizados", time: "14:00", used: 7, completed: [-1, -3, -6, -9, -13, -20, -27], scheduled: 3, payment: "paid" as const },
      { name: "Maria Clara", grade: "6º ano", subject: "Português", responsible: "Carolina", goal: "Melhorar interpretação de textos", difficulties: "Compreensão de enunciados", time: "15:30", used: 3, completed: [-2, -8, -15], scheduled: 5, payment: "paid" as const },
      { name: "Lucas Gabriel", grade: "7º ano", subject: "Matemática", responsible: "Renata", goal: "Aumentar a nota de matemática", difficulties: "Falta de prática", time: "17:00", used: 3, completed: [-4, -11, -18], scheduled: 2, payment: "pending" as const }
    ];
    const startDate = day(-35);
    for (const [i, s] of data.entries()) {
      const [student] = await db.insert(students).values({ accessCodeId: owner, name: s.name, grade: s.grade, subject: s.subject, startDate, frequency: "2 vezes por semana", responsibleName: s.responsible, mainGoal: s.goal, difficulties: s.difficulties, strengths: "Curiosidade e boa participação" }).returning();
      const [pkg] = await db.insert(lessonPackages).values({ accessCodeId: owner, studentId: student.id, totalLessons: 8, usedLessons: s.used, value: "320.00", startDate, renewalDate: period.end }).returning();
      for (const [j, offset] of s.completed.entries()) {
        await db.insert(lessons).values({ accessCodeId: owner, studentId: student.id, packageId: pkg.id, date: month(offset), startTime: s.time, duration: 60, status: "completed", content: s.subject === "Português" ? "Interpretação de textos" : "Equações de primeiro grau", activities: "Leitura orientada e exercícios práticos", participation: "Boa", achievement: j === s.completed.length - 1 ? "Conseguiu resolver exercícios com menos ajuda." : "Mais confiança para explicar o raciocínio.", difficulty: s.difficulties, nextFocus: "Aprimorar a interpretação dos enunciados" });
      }
      await db.insert(lessons).values({ accessCodeId: owner, studentId: student.id, date: day(s.scheduled), startTime: s.time, duration: 60, status: "scheduled", content: "Próximo encontro" });
      await db.insert(progressEntries).values([
        { accessCodeId: owner, studentId: student.id, date: month(-30), comprehension: 2, autonomy: 2, participation: 3, organization: 3, concentration: 2, activityCompletion: 3 },
        { accessCodeId: owner, studentId: student.id, date: month(-2), comprehension: 4, autonomy: 3, participation: 4, organization: 4, concentration: 3, activityCompletion: 4, mainImprovement: "Resolve atividades com menos ajuda", attentionPoint: "Interpretação de problemas" }
      ]);
      await db.insert(studentGoals).values({ accessCodeId: owner, studentId: student.id, title: s.goal, progress: 3, status: "ongoing" });
      await db.insert(payments).values({ accessCodeId: owner, studentId: student.id, description: "Pacote do mês", amount: "320.00", dueDate: period.start, status: s.payment, paidAt: s.payment === "paid" ? month(-5) : null, paymentMethod: "Pix" });
      if (i < 2) {
        const draft = await buildReportDraft(owner, { studentId: student.id, periodStart: period.start, periodEnd: period.end });
        await saveReport(owner, { ...draft, teacherMessage: i === 0 ? "Ótimo período de evolução. Seguimos trabalhando autonomia e segurança nos problemas." : "Muita melhora na interpretação dos textos. Seguimos praticando todas as semanas." });
      }
      await db.insert(activityLogs).values({ accessCodeId: owner, message: `${s.name} foi cadastrado.`, createdAt: ago(35) });
    }
    await db.insert(activityLogs).values([
      { accessCodeId: owner, message: "João Pedro teve uma aula registrada.", createdAt: ago(1) },
      { accessCodeId: owner, message: "A evolução de Maria Clara foi atualizada.", createdAt: ago(2) },
      { accessCodeId: owner, message: "Relatório de Maria Clara foi gerado.", createdAt: ago(3) },
      { accessCodeId: owner, message: "O pacote de João Pedro foi renovado.", createdAt: ago(8) }
    ]);
    process.stdout.write(`Demo ${reset ? "restaurado" : "criado"}. Código: ${DEMO_CODE}\n`);
  }
} finally {
  await closeDatabase();
}
