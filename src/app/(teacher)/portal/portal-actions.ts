"use server";
import {requireTeacher} from "@/lib/auth";
import {actionError} from "@/app/actions";
import type {ActionState} from "@/components/action-form";
import {savePortalSettings,createMakeupSlot,changeMakeupSlotStatus,decideMakeupRequest} from "@/lib/responsible-service";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
export async function portalSettingsAction(_:ActionState,form:FormData):Promise<ActionState>{
  const access=await requireTeacher();
  try{
    await savePortalSettings(access.id,Object.fromEntries(form) as Parameters<typeof savePortalSettings>[1]);
    revalidatePath("/portal");
    revalidatePath("/","layout");
    return {success:"Preferências do portal salvas."};
  }catch(e){return actionError(e);}
}
export async function makeupSlotCreateAction(_:ActionState,form:FormData):Promise<ActionState>{
  const access=await requireTeacher();
  try{
    await createMakeupSlot(access.id,{date:String(form.get("date")??""),startTime:String(form.get("startTime")??""),endTime:String(form.get("endTime")??"")});
  }catch(e){return actionError(e);}
  redirect("/portal");
}
export async function makeupSlotStatusAction(_:ActionState,form:FormData):Promise<ActionState>{
  const access=await requireTeacher();
  try{
    await changeMakeupSlotStatus(access.id,String(form.get("id")??""),String(form.get("status"))==="unavailable"?"unavailable":"available");
  }catch(e){return actionError(e);}
  redirect("/portal");
}
export async function makeupRequestDecisionAction(_:ActionState,form:FormData):Promise<ActionState>{
  const access=await requireTeacher();
  const decision=String(form.get("decision"))==="approved"?"approved":"rejected";
  try{
    await decideMakeupRequest(access.id,String(form.get("id")??""),decision);
  }catch(e){return actionError(e);}
  redirect("/portal");
}
