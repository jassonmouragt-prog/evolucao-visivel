"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {actionError} from "@/app/actions";
import type {ActionState} from "@/components/action-form";
import {loginResponsible,logoutResponsible,requireResponsible} from "@/lib/responsible-auth";
import {requestMakeupSlot,cancelMakeupRequest} from "@/lib/responsible-service";
export async function responsibleLoginAction(_:ActionState,form:FormData):Promise<ActionState>{
  let firstAccess=false;
  try{firstAccess=(await loginResponsible(String(form.get("code")??""))).firstAccess;}catch(e){return actionError(e);}
  redirect(firstAccess?"/responsavel/bem-vindo":"/responsavel/inicio");
}
export async function responsibleLogoutAction(){await logoutResponsible();redirect("/responsavel");}
export async function makeupRequestAction(_:ActionState,form:FormData):Promise<ActionState>{
  try{
    const ctx=await requireResponsible();
    await requestMakeupSlot(ctx.link.accessCodeId,ctx.link.id,ctx.link.studentId,String(form.get("slotId")??""));
  }catch(e){return actionError(e);}
  revalidatePath("/responsavel/aulas");
  return {success:"Solicitação enviada. O professor irá analisar em breve."};
}
export async function makeupCancelAction(_:ActionState,form:FormData):Promise<ActionState>{
  try{
    const ctx=await requireResponsible();
    await cancelMakeupRequest(ctx.link.accessCodeId,ctx.link.id,String(form.get("id")??""));
  }catch(e){return actionError(e);}
  revalidatePath("/responsavel/aulas");
  return {success:"Solicitação cancelada."};
}
