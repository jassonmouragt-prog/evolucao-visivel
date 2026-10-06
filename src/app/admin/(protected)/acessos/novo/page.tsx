import { PageHead } from "@/components/ui";
import { ActionForm,Fields } from "@/components/action-form";
import { createAccessAction } from "@/app/actions";
import {CodeGenerator} from "@/components/code-generator";
export default function NewAccess(){return <><PageHead title="Novo acesso" description="Gere um código a partir do nome ou defina um código personalizado."/><section className="panel max-w-2xl"><ActionForm action={createAccessAction} submit="Criar acesso"><Fields fields={[{name:"customerName",label:"Nome do cliente",required:true},{name:"customerEmail",label:"E-mail (opcional)",type:"email"},{name:"plan",label:"Plano",options:[{value:"individual",label:"Individual · 10 alunos"},{value:"pro",label:"PRO"}],value:"individual"},{name:"studentLimit",label:"Limite de alunos (PRO)",type:"number",value:10,min:1,max:1000}]}/><CodeGenerator/></ActionForm></section></>;}
