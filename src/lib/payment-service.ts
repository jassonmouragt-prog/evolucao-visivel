import {and,eq} from "drizzle-orm";
import {database} from "@/db";
import {payments} from "@/db/schema";
import {ownedStudent} from "./tenancy";
import {paymentSchema,uuidSchema} from "./validation";
import {AppError} from "./errors";
import type {z} from "zod";
export async function ownedPayment(owner:string,id:string){uuidSchema.parse(id);const [row]=await database().select().from(payments).where(and(eq(payments.id,id),eq(payments.accessCodeId,owner)));if(!row)throw new AppError("Pagamento não encontrado.");return row;}
export async function savePayment(owner:string,input:z.input<typeof paymentSchema>,id?:string){const data=paymentSchema.parse(input);await ownedStudent(owner,data.studentId);if(id){const existing=await ownedPayment(owner,id);if(existing.studentId!==data.studentId)throw new AppError("Não é possível trocar o aluno de um pagamento.");const [row]=await database().update(payments).set(data).where(and(eq(payments.id,id),eq(payments.accessCodeId,owner))).returning();return row;}const [row]=await database().insert(payments).values({...data,accessCodeId:owner}).returning();return row;}
export async function deletePayment(owner:string,id:string){await ownedPayment(owner,id);await database().delete(payments).where(and(eq(payments.id,id),eq(payments.accessCodeId,owner)));}
