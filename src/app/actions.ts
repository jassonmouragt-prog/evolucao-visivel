"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, loginAdmin, loginTeacher, logout, requireAdmin } from "@/lib/auth";
import { createAccess, editAccess, changeAccessStatus } from "@/lib/admin-service";
import { uuidSchema } from "@/lib/validation";
import {generateCode} from "@/lib/security";
import type { ActionState } from "@/components/action-form";

export async function actionError(error:unknown):Promise<ActionState> {
  if(error instanceof z.ZodError) return {error:"Revise os campos indicados.",fields:Object.fromEntries(error.issues.map(v=>[v.path.join("."),v.message]))};
  if(error instanceof AppError)return {error:error.message};
  if(error instanceof Error&&error.message.includes("NEXT_REDIRECT"))throw error;
  return {error:"Não foi possível concluir. Verifique a conexão e tente novamente."};
}
export async function teacherLoginAction(_:ActionState,form:FormData):Promise<ActionState> {try{await loginTeacher(String(form.get("code")??""));}catch(e){return actionError(e);}redirect("/dashboard");}
export async function adminLoginAction(_:ActionState,form:FormData):Promise<ActionState> {try{const email=z.email().parse(form.get("email"));const password=z.string().min(1).max(256).parse(form.get("password"));await loginAdmin(email,password);}catch(e){return actionError(e);}redirect("/admin");}
export async function teacherLogoutAction(){await logout("teacher");redirect("/acesso");}
export async function adminLogoutAction(){await logout("admin");redirect("/admin/login");}
export async function createAccessAction(_:ActionState,form:FormData):Promise<ActionState> {
  await requireAdmin();try {const row=await createAccess({customerName:form.get("customerName"),customerEmail:form.get("customerEmail"),plan:form.get("plan"),studentLimit:form.get("studentLimit"),code:form.get("code")} as Parameters<typeof createAccess>[0],form.get("codeMode")==="auto");return {redirectTo:`/admin/acessos/${row.id}?created=1`};}catch(e){return actionError(e);}
}
export async function generateAccessCodeAction(name:string){await requireAdmin();return generateCode(z.string().trim().min(1).max(160).parse(name));}
export async function editAccessAction(_:ActionState,form:FormData):Promise<ActionState> {
  await requireAdmin();try{const id=uuidSchema.parse(form.get("id"));await editAccess(id,Object.fromEntries(form) as Parameters<typeof editAccess>[1],form.get("regenerate")==="on");revalidatePath(`/admin/acessos/${id}`);return {success:"Acesso atualizado."};}catch(e){return actionError(e);}
}
export async function statusAccessAction(_:ActionState,form:FormData):Promise<ActionState> {
  await requireAdmin();try{const id=uuidSchema.parse(form.get("id"));const status=z.enum(["active","blocked"]).parse(form.get("status"));await changeAccessStatus(id,status);revalidatePath("/admin");revalidatePath("/admin/acessos");revalidatePath(`/admin/acessos/${id}`);return {success:status==="active"?"Acesso reativado.":"Acesso bloqueado e sessões encerradas."};}catch(e){return actionError(e);}
}
