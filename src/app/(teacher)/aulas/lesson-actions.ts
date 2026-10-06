"use server";
import {requireTeacher} from "@/lib/auth";
import {saveLesson,deleteLesson,renewPackage} from "@/lib/lesson-service";
import {actionError} from "@/app/actions";
import type {ActionState} from "@/components/action-form";
import {uuidSchema} from "@/lib/validation";
import {revalidatePath} from "next/cache";
export async function lessonAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{const id=form.get("id")?uuidSchema.parse(form.get("id")):undefined;const row=await saveLesson(access.id,Object.fromEntries(form) as Parameters<typeof saveLesson>[1],id);revalidatePath("/", "layout");return {success:"Aula registrada com sucesso.",redirectTo:`/alunos/${row.studentId}/aulas?saved=1`};}catch(e){return actionError(e);}}
export async function lessonDeleteAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{await deleteLesson(access.id,uuidSchema.parse(form.get("id")));revalidatePath("/", "layout");return {success:"Aula excluída.",redirectTo:"/aulas"};}catch(e){return actionError(e);}}
export async function packageAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{const row=await renewPackage(access.id,Object.fromEntries(form) as Parameters<typeof renewPackage>[1]);revalidatePath("/", "layout");return {success:"Pacote renovado.",redirectTo:`/alunos/${row.studentId}/pacote`};}catch(e){return actionError(e);}}
