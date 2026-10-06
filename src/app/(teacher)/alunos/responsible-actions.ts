"use server";
import {requireTeacher} from "@/lib/auth";
import {actionError} from "@/app/actions";
import type {ActionState} from "@/components/action-form";
import {changeResponsibleStatus,createResponsibleAccess,deleteResponsibleAccess,regenerateResponsibleCode} from "@/lib/responsible-service";
import {revalidatePath} from "next/cache";
import {uuidSchema} from "@/lib/validation";
import {z} from "zod";
function refresh(studentId:string){revalidatePath(`/alunos/${studentId}`);}
export async function responsibleCreateAction(_:ActionState,form:FormData):Promise<ActionState>{
  const access=await requireTeacher();
  try{
    const studentId=uuidSchema.parse(form.get("studentId"));
    const row=await createResponsibleAccess(access.id,studentId,{name:form.get("name"),phone:form.get("phone"),email:form.get("email"),code:form.get("code")} as Parameters<typeof createResponsibleAccess>[2],form.get("codeMode")==="auto");
    refresh(studentId);
    return {redirectTo:`/alunos/${studentId}?acesso=${row.id}&status=criado`};
  }catch(e){return actionError(e);}
}
export async function responsibleStatusAction(_:ActionState,form:FormData):Promise<ActionState>{
  const access=await requireTeacher();
  try{
    const studentId=uuidSchema.parse(form.get("studentId"));
    const id=uuidSchema.parse(form.get("id"));
    const status=z.enum(["active","blocked"]).parse(form.get("status"));
    await changeResponsibleStatus(access.id,id,status);
    refresh(studentId);
    return {success:status==="active"?"Acesso reativado.":"Acesso bloqueado e sessões encerradas."};
  }catch(e){return actionError(e);}
}
export async function responsibleRegenerateAction(_:ActionState,form:FormData):Promise<ActionState>{
  const access=await requireTeacher();
  try{
    const studentId=uuidSchema.parse(form.get("studentId"));
    const id=uuidSchema.parse(form.get("id"));
    await regenerateResponsibleCode(access.id,id);
    refresh(studentId);
    return {redirectTo:`/alunos/${studentId}?acesso=${id}&status=regenerado`};
  }catch(e){return actionError(e);}
}
export async function responsibleDeleteAction(_:ActionState,form:FormData):Promise<ActionState>{
  const access=await requireTeacher();
  try{
    const studentId=uuidSchema.parse(form.get("studentId"));
    const id=uuidSchema.parse(form.get("id"));
    await deleteResponsibleAccess(access.id,id);
    refresh(studentId);
    return {success:"Acesso do responsável removido."};
  }catch(e){return actionError(e);}
}
