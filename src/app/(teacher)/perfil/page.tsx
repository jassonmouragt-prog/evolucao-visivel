import {eq} from "drizzle-orm";
import {database} from "@/db";
import {teacherProfiles} from "@/db/schema";
import {requireTeacher} from "@/lib/auth";
import {PageHead} from "@/components/ui";
import {ActionForm,Fields} from "@/components/action-form";
import {profileFields,withValues} from "@/lib/fields";
import {profileAction} from "../teacher-actions";
export default async function ProfilePage(){const access=await requireTeacher();const [p]=await database().select().from(teacherProfiles).where(eq(teacherProfiles.accessCodeId,access.id));return <><PageHead title="Meu perfil" description="Seu nome e sua identidade acompanham os relatórios."/><section className="panel max-w-3xl"><ActionForm action={profileAction} submit="Salvar perfil"><Fields fields={withValues(profileFields,p??{name:access.customerName})}/></ActionForm></section></>;}
