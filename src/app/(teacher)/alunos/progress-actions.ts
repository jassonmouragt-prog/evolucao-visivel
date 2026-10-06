"use server";
import {requireTeacher} from "@/lib/auth";
import {saveProgress,saveGoal} from "@/lib/progress-service";
import {actionError} from "@/app/actions";
import type {ActionState} from "@/components/action-form";
import {uuidSchema} from "@/lib/validation";
import {revalidatePath} from "next/cache";
export async function progressAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{const row=await saveProgress(access.id,Object.fromEntries(form) as Parameters<typeof saveProgress>[1]);revalidatePath(`/alunos/${row.studentId}`);revalidatePath(`/alunos/${row.studentId}/evolucao`);return {success:"Evolução registrada."};}catch(e){return actionError(e);}}
export async function goalAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{const id=form.get("id")?uuidSchema.parse(form.get("id")):undefined;const row=await saveGoal(access.id,Object.fromEntries(form) as Parameters<typeof saveGoal>[1],id);revalidatePath(`/alunos/${row.studentId}/evolucao`);return {success:"Objetivo salvo."};}catch(e){return actionError(e);}}
