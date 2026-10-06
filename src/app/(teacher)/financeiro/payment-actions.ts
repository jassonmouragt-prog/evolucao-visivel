"use server";
import {requireTeacher} from "@/lib/auth";
import {savePayment,deletePayment} from "@/lib/payment-service";
import {actionError} from "@/app/actions";
import type {ActionState} from "@/components/action-form";
import {uuidSchema} from "@/lib/validation";
import {revalidatePath} from "next/cache";
export async function paymentAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{const id=form.get("id")?uuidSchema.parse(form.get("id")):undefined;const row=await savePayment(access.id,Object.fromEntries(form) as Parameters<typeof savePayment>[1],id);revalidatePath("/", "layout");return {success:"Pagamento salvo.",redirectTo:`/alunos/${row.studentId}/financeiro`};}catch(e){return actionError(e);}}
export async function paymentDeleteAction(_:ActionState,form:FormData):Promise<ActionState>{const access=await requireTeacher();try{await deletePayment(access.id,uuidSchema.parse(form.get("id")));revalidatePath("/", "layout");return {success:"Pagamento excluído.",redirectTo:"/financeiro"};}catch(e){return actionError(e);}}
