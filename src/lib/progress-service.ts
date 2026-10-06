import {and,eq} from "drizzle-orm";
import {database} from "@/db";
import {progressEntries,studentGoals,activityLogs} from "@/db/schema";
import {ownedStudent} from "./tenancy";
import {progressSchema,goalSchema,uuidSchema} from "./validation";
import {AppError} from "./errors";
import type {z} from "zod";
export async function saveProgress(owner:string,input:z.input<typeof progressSchema>){const data=progressSchema.parse(input);const student=await ownedStudent(owner,data.studentId);return database().transaction(async tx=>{const [row]=await tx.insert(progressEntries).values({...data,accessCodeId:owner}).returning();await tx.insert(activityLogs).values({accessCodeId:owner,message:`A evolução de ${student.name} foi atualizada.`});return row;});}
export async function saveGoal(owner:string,input:z.input<typeof goalSchema>,id?:string){const data=goalSchema.parse(input);await ownedStudent(owner,data.studentId);if(id){uuidSchema.parse(id);const [row]=await database().update(studentGoals).set(data).where(and(eq(studentGoals.id,id),eq(studentGoals.accessCodeId,owner),eq(studentGoals.studentId,data.studentId))).returning();if(!row)throw new AppError("Objetivo não encontrado.");return row;}const [row]=await database().insert(studentGoals).values({...data,accessCodeId:owner}).returning();return row;}
