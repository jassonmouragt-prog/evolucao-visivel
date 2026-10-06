"use server";
import {requireTeacher} from "@/lib/auth";
import {actionError} from "@/app/actions";
import type {ActionState} from "@/components/action-form";
import {saveProfile,saveStudent,archiveStudent,deleteStudent} from "@/lib/student-service";
import {revalidatePath} from "next/cache";
import {uuidSchema} from "@/lib/validation";
import {z} from "zod";
export async function profileAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{await saveProfile(access.id,Object.fromEntries(form) as Parameters<typeof saveProfile>[1]);revalidatePath("/", "layout");return {success:"Perfil salvo.",redirectTo:"/dashboard"};}catch(e){return actionError(e);}}
export async function studentAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{const id=form.get("id")?uuidSchema.parse(form.get("id")):undefined;const initialPackage=form.get("totalLessons")?{totalLessons:form.get("totalLessons"),value:form.get("value"),startDate:form.get("packageStartDate"),renewalDate:form.get("renewalDate")}:undefined;const row=await saveStudent(access.id,Object.fromEntries(form) as Parameters<typeof saveStudent>[1],id,initialPackage as Parameters<typeof saveStudent>[3]);revalidatePath("/", "layout");return {redirectTo:`/alunos/${row.id}`,success:"Aluno salvo."};}catch(e){return actionError(e);}}
export async function studentStatusAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{const id=uuidSchema.parse(form.get("id"));const operation=z.enum(["archive","restore","delete"]).parse(form.get("operation"));if(operation==="delete")await deleteStudent(access.id,id);else await archiveStudent(access.id,id,operation==="restore");revalidatePath("/", "layout");return {redirectTo:"/alunos",success:"Aluno atualizado."};}catch(e){return actionError(e);}}
