import {PageHead} from "@/components/ui";
import {ActionForm,Fields} from "@/components/action-form";
import {studentFields} from "@/lib/fields";
import {studentAction} from "../../teacher-actions";
import Link from "next/link";
import {today} from "@/lib/format";
export default function NewStudent(){return <><PageHead title="Novo aluno" description="Comece com os dados essenciais. Você pode completar o acompanhamento depois."/><section className="panel max-w-3xl"><ActionForm action={studentAction} submit="Salvar aluno"><Fields fields={studentFields()}/><details className="divider pt-5"><summary className="cursor-pointer font-semibold">Pacote inicial (opcional)</summary><p className="muted my-4 text-sm">Preencha a quantidade de aulas para adicionar um pacote junto com o cadastro.</p><Fields fields={[{name:"totalLessons",label:"Número de aulas contratadas",type:"number",min:1,max:1000},{name:"value",label:"Valor do pacote (R$)",type:"number",min:0,step:"0.01"},{name:"packageStartDate",label:"Início do pacote",type:"date",value:today()},{name:"renewalDate",label:"Renovação prevista",type:"date"}]}/></details></ActionForm></section><Link className="mt-5 inline-block text-sm text-blue" href={process.env.PRO_URL||"/configuracoes"}>Conhecer Evolução Visível PRO</Link></>;}
