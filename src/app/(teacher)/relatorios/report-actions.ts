"use server";
import {requireTeacher} from "@/lib/auth";
import {saveReport} from "@/lib/report-service";
import {actionError} from "@/app/actions";
import type {ActionState} from "@/components/action-form";
import {uuidSchema} from "@/lib/validation";
import {revalidatePath} from "next/cache";
export async function reportAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{const id=form.get("id")?uuidSchema.parse(form.get("id")):undefined;const row=await saveReport(access.id,Object.fromEntries(form) as Parameters<typeof saveReport>[1],id);revalidatePath("/", "layout");return {success:"Relatório salvo.",redirectTo:`/relatorios/${row.id}`};}catch(e){return actionError(e);}}
