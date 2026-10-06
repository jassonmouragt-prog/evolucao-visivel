import {eq} from "drizzle-orm";
import {database} from "@/db";
import {teacherProfiles} from "@/db/schema";
import {requireTeacher} from "@/lib/auth";
import {Navigation} from "@/components/navigation";
import {Brand} from "@/components/ui";
export const dynamic="force-dynamic";
export default async function TeacherLayout({children}:{children:React.ReactNode}){const access=await requireTeacher();const [profile]=await database().select().from(teacherProfiles).where(eq(teacherProfiles.accessCodeId,access.id)).limit(1);return <><Navigation name={profile?.name??access.customerName}/><div className="md:ml-62"><header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-10"><div className="md:hidden"><Brand/></div><p className="muted hidden text-sm md:block">Cada aula é um passo. Cada registro conta.</p><span className="badge hidden sm:inline-flex">Seu espaço de acompanhamento</span></header><main id="conteudo" className="mx-auto max-w-7xl px-5 pb-28 pt-8 md:px-10 md:pb-12 md:pt-10">{children}</main></div></>;}
