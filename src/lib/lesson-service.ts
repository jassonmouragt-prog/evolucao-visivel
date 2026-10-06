import {and,eq,sql} from "drizzle-orm";
import {database} from "@/db";
import {accessCodes,students,lessons,lessonPackages,activityLogs} from "@/db/schema";
import {AppError} from "./errors";
import {lessonSchema,packageSchema,uuidSchema} from "./validation";
import type {z} from "zod";

export async function ownedLesson(owner:string,id:string){uuidSchema.parse(id);const [row]=await database().select().from(lessons).where(and(eq(lessons.accessCodeId,owner),eq(lessons.id,id)));if(!row)throw new AppError("Aula não encontrada.");return row;}
const consumes=(status:string)=>status==="completed"||status==="makeup";
export async function saveLesson(owner:string,input:z.input<typeof lessonSchema>,id?:string){const data=lessonSchema.parse(input);if(id)uuidSchema.parse(id);return database().transaction(async tx=>{
  const [access]=await tx.select({id:accessCodes.id}).from(accessCodes).where(and(eq(accessCodes.id,owner),eq(accessCodes.status,"active"))).for("share");if(!access)throw new AppError("Acesso indisponível.");
  const [s]=await tx.select().from(students).where(and(eq(students.id,data.studentId),eq(students.accessCodeId,owner))).for("update");if(!s)throw new AppError("Aluno não encontrado.");if(!s.active)throw new AppError("Reative o aluno antes de registrar novas aulas.");
  let original:typeof lessons.$inferSelect|undefined;
  if(id){[original]=await tx.select().from(lessons).where(and(eq(lessons.id,id),eq(lessons.accessCodeId,owner))).for("update");if(!original)throw new AppError("Aula não encontrada.");if(original.studentId!==data.studentId)throw new AppError("Não é possível trocar o aluno de uma aula registrada.");}
  let packageId:string|null=null;
  if(original?.packageId&&consumes(original.status))await tx.update(lessonPackages).set({usedLessons:sql`${lessonPackages.usedLessons}-1`}).where(and(eq(lessonPackages.id,original.packageId),eq(lessonPackages.accessCodeId,owner)));
  if(consumes(data.status)){
    const [pkg]=original?.packageId?await tx.select().from(lessonPackages).where(and(eq(lessonPackages.id,original.packageId),eq(lessonPackages.accessCodeId,owner))).for("update"):await tx.select().from(lessonPackages).where(and(eq(lessonPackages.studentId,data.studentId),eq(lessonPackages.accessCodeId,owner),eq(lessonPackages.status,"current"))).for("update");
    if(pkg){if(pkg.usedLessons>=pkg.totalLessons)throw new AppError("O pacote está esgotado. Renove antes de registrar uma aula realizada.");packageId=pkg.id;await tx.update(lessonPackages).set({usedLessons:sql`${lessonPackages.usedLessons}+1`}).where(and(eq(lessonPackages.id,pkg.id),eq(lessonPackages.accessCodeId,owner)));}
  }
  const [row]=id?await tx.update(lessons).set({...data,packageId,updatedAt:new Date()}).where(and(eq(lessons.id,id),eq(lessons.accessCodeId,owner))).returning():await tx.insert(lessons).values({...data,packageId,accessCodeId:owner}).returning();
  await tx.insert(activityLogs).values({accessCodeId:owner,message:`${s.name} teve uma aula ${id?"atualizada":"registrada"}.`});return row;
});}
export async function deleteLesson(owner:string,id:string){const original=await ownedLesson(owner,id);await database().transaction(async tx=>{
  await tx.select({id:students.id}).from(students).where(and(eq(students.id,original.studentId),eq(students.accessCodeId,owner))).for("update");
  const [row]=await tx.select().from(lessons).where(and(eq(lessons.id,id),eq(lessons.accessCodeId,owner))).for("update");if(!row)throw new AppError("Aula não encontrada.");
  if(row.packageId&&consumes(row.status))await tx.update(lessonPackages).set({usedLessons:sql`${lessonPackages.usedLessons}-1`}).where(and(eq(lessonPackages.id,row.packageId),eq(lessonPackages.accessCodeId,owner)));
  await tx.delete(lessons).where(and(eq(lessons.id,id),eq(lessons.accessCodeId,owner)));
});}
export async function renewPackage(owner:string,input:z.input<typeof packageSchema>){const data=packageSchema.parse(input);return database().transaction(async tx=>{
  const [s]=await tx.select().from(students).where(and(eq(students.id,data.studentId),eq(students.accessCodeId,owner))).for("update");if(!s)throw new AppError("Aluno não encontrado.");if(!s.active)throw new AppError("Reative o aluno antes de renovar o pacote.");
  await tx.update(lessonPackages).set({status:"closed"}).where(and(eq(lessonPackages.studentId,s.id),eq(lessonPackages.accessCodeId,owner),eq(lessonPackages.status,"current")));
  const [row]=await tx.insert(lessonPackages).values({...data,accessCodeId:owner}).returning();await tx.insert(activityLogs).values({accessCodeId:owner,message:`O pacote de ${s.name} foi renovado.`});return row;
});}
