import { and,count,eq,sql } from "drizzle-orm";
import { database } from "@/db";
import { accessCodes,students,teacherProfiles,activityLogs,lessonPackages } from "@/db/schema";
import { AppError } from "./errors";
import { profileSchema,studentSchema,uuidSchema,packageSchema } from "./validation";
import { ownedStudent } from "./tenancy";
import type {z} from "zod";

export async function saveProfile(owner:string,input:z.input<typeof profileSchema>) {
  const data=profileSchema.parse(input);
  await database().insert(teacherProfiles).values({...data,accessCodeId:owner,onboardingCompleted:true}).onConflictDoUpdate({target:teacherProfiles.accessCodeId,set:{...data,onboardingCompleted:true}});
}
export async function saveStudent(owner:string,input:z.input<typeof studentSchema>,id?:string,initialPackage?:Omit<z.input<typeof packageSchema>,"studentId">) {
  const data=studentSchema.parse(input);
  const packageData=initialPackage?packageSchema.parse({...initialPackage,studentId:crypto.randomUUID()}):undefined;
  if(id){uuidSchema.parse(id);await ownedStudent(owner,id);}
  return database().transaction(async tx=>{
    const [access]=await tx.select().from(accessCodes).where(and(eq(accessCodes.id,owner),eq(accessCodes.status,"active"))).for("update");
    if(!access)throw new AppError("Acesso indisponível.");
    if(id){const [row]=await tx.update(students).set({...data,updatedAt:new Date()}).where(and(eq(students.id,id),eq(students.accessCodeId,owner))).returning();if(!row)throw new AppError("Aluno não encontrado.");return row;}
    const [active]=await tx.select({n:count()}).from(students).where(and(eq(students.accessCodeId,owner),eq(students.active,true)));
    if(active.n>=access.studentLimit)throw new AppError(`Você atingiu o limite de ${access.studentLimit} alunos ativos do seu acesso atual.`);
    const [row]=await tx.insert(students).values({...data,accessCodeId:owner}).returning();
    if(packageData)await tx.insert(lessonPackages).values({...packageData,studentId:row.id,accessCodeId:owner});
    await tx.insert(activityLogs).values({accessCodeId:owner,message:`${row.name} foi cadastrado.`});
    return row;
  });
}
export async function archiveStudent(owner:string,id:string,active=false) {
  uuidSchema.parse(id);await ownedStudent(owner,id);
  await database().transaction(async tx=>{
    const [access]=await tx.select().from(accessCodes).where(and(eq(accessCodes.id,owner),eq(accessCodes.status,"active"))).for("update");
    if(!access)throw new AppError("Acesso indisponível.");
    const [row]=await tx.select().from(students).where(and(eq(students.id,id),eq(students.accessCodeId,owner))).for("update");
    if(!row)throw new AppError("Aluno não encontrado.");
    if(active&&!row.active){const [current]=await tx.select({n:count()}).from(students).where(and(eq(students.accessCodeId,owner),eq(students.active,true)));if(current.n>=access.studentLimit)throw new AppError(`Você atingiu o limite de ${access.studentLimit} alunos ativos do seu acesso atual.`);}
    await tx.update(students).set({active,archivedAt:active?null:new Date(),updatedAt:new Date()}).where(and(eq(students.id,id),eq(students.accessCodeId,owner)));
  });
}
export async function deleteStudent(owner:string,id:string) {
  uuidSchema.parse(id);await ownedStudent(owner,id);
  await database().transaction(async tx=>{
    await tx.execute(sql`SELECT id FROM access_codes WHERE id = ${owner} AND status = 'active' FOR UPDATE`);
    await tx.delete(students).where(and(eq(students.id,id),eq(students.accessCodeId,owner)));
    await tx.insert(activityLogs).values({accessCodeId:owner,message:"Um aluno e seus registros foram excluídos."});
  });
}
