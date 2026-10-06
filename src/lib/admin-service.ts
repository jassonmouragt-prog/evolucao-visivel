import { and, count, eq, sql } from "drizzle-orm";
import { database } from "@/db";
import { accessCodes, sessions, students } from "@/db/schema";
import { generateCode } from "./security";
import { accessSchema } from "./validation";
import { AppError } from "./errors";
import type { z } from "zod";
export async function createAccess(input:z.input<typeof accessSchema>,automatic=false) {
  const values=accessSchema.parse(input);
  const studentLimit=values.plan==="individual"?10:values.studentLimit;
  for(let attempt=0;attempt<50;attempt++) {
    const code=attempt===0&&values.code?values.code:generateCode(values.customerName);
    const [row]=await database().insert(accessCodes).values({...values,studentLimit,code}).onConflictDoNothing({target:accessCodes.code}).returning();
    if(row)return row;
    if(values.code&&!automatic)throw new AppError("Este código já existe. Escolha outro código.");
  }
  throw new AppError("Não foi possível gerar um código. Tente novamente.");
}
export async function changeAccessStatus(id:string,status:"active"|"blocked") {
  await database().transaction(async tx=>{
    await tx.update(accessCodes).set({status,updatedAt:new Date()}).where(eq(accessCodes.id,id));
    if(status==="blocked")await tx.delete(sessions).where(eq(sessions.accessCodeId,id));
  });
}
export async function editAccess(id:string,input:z.input<typeof accessSchema>,regenerate=false) {
  const values=accessSchema.parse(input);
  let code=regenerate?generateCode(values.customerName):values.code;
  if(!code)throw new AppError("Informe o código.");
  await database().transaction(async tx=>{
    const [row]=await tx.select().from(accessCodes).where(eq(accessCodes.id,id)).for("update");
    if(!row)throw new AppError("Acesso não encontrado.");
    const [active]=await tx.select({n:count()}).from(students).where(and(eq(students.accessCodeId,id),eq(students.active,true)));
    const studentLimit=values.plan==="individual"?10:values.studentLimit;
    if(active.n>studentLimit)throw new AppError("Arquive alunos antes de reduzir o limite.");
    for(let attempt=0;attempt<50;attempt++){
      const [duplicate]=await tx.select({id:accessCodes.id}).from(accessCodes).where(and(eq(accessCodes.code,code!),sql`${accessCodes.id} <> ${id}`));
      if(!duplicate)break;
      if(!regenerate)throw new AppError("Este código já existe. Escolha outro código.");
      if(attempt===49)throw new AppError("Não foi possível gerar um código único.");
      code=generateCode(values.customerName);
    }
    if(!code)throw new AppError("Informe o código.");
    await tx.update(accessCodes).set({...values,studentLimit,code,updatedAt:new Date()}).where(eq(accessCodes.id,id));
    if(code!==row.code)await tx.delete(sessions).where(eq(sessions.accessCodeId,id));
  });
}
