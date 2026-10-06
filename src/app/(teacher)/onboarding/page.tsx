import {PageHead} from "@/components/ui";
import {ActionForm,Fields} from "@/components/action-form";
import {profileAction} from "../teacher-actions";
import {profileFields,withValues} from "@/lib/fields";
import {requireTeacher} from "@/lib/auth";
export default async function Onboarding(){const access=await requireTeacher();return <div className="mx-auto max-w-2xl"><PageHead title="Bem-vindo ao Evolução Visível 👋" description="Organize seus alunos, registre cada aula e transforme o progresso em algo que seus alunos e responsáveis conseguem enxergar."/><section className="panel"><h2 className="mb-6">Configurar meu perfil</h2><ActionForm action={profileAction} submit="Começar"><Fields fields={withValues(profileFields,{name:access.customerName})}/></ActionForm></section></div>;}
