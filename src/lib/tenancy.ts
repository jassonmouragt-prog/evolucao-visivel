import { and, eq } from "drizzle-orm";
import { database } from "@/db";
import { students } from "@/db/schema";
import { AppError } from "./errors";
import { uuidSchema } from "./validation";

export async function ownedStudent(accessCodeId:string, id:string) {
  if(!uuidSchema.safeParse(id).success) throw new AppError("Aluno não encontrado.");
  const [student]=await database().select().from(students).where(and(eq(students.id,id),eq(students.accessCodeId,accessCodeId))).limit(1);
  if(!student) throw new AppError("Aluno não encontrado.");
  return student;
}
