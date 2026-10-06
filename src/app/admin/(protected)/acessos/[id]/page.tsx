import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { database } from "@/db";
import { accessCodes } from "@/db/schema";
import { PageHead } from "@/components/ui";
import { ActionForm, Fields, Field } from "@/components/action-form";
import { editAccessAction, statusAccessAction } from "@/app/actions";
import { CopyButton, EditableMessage } from "@/components/copy";
import { uuidSchema } from "@/lib/validation";
import { requireAdmin } from "@/lib/auth";

export default async function AccessDetail({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const [r] = await database().select().from(accessCodes).where(eq(accessCodes.id, id));
  if (!r) notFound();
  const { created } = await searchParams;
  const url = process.env.APP_URL ?? "http://localhost:3000";
  const message = `Olá, ${r.customerName}! 💙\n\nSeu acesso ao Evolução Visível já está liberado.\n\nSeu código pessoal é:\n${r.code}\n\nAcesse:\n${url}/acesso\n\nDigite seu código e você já poderá começar a cadastrar seus alunos.\n\nGuarde esse código, pois ele está vinculado ao seu acesso.`;
  return <>
    <PageHead title={created ? "Acesso criado" : r.customerName} description="Alterar o código encerra as sessões existentes."/>
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section className="panel">
        <h2 className="mb-6">Dados do acesso</h2>
        <ActionForm action={editAccessAction} submit="Atualizar acesso">
          <Field name="id" type="hidden" label="ID" value={id}/>
          <Fields fields={[
            {name:"customerName",label:"Cliente",value:r.customerName,required:true},
            {name:"customerEmail",label:"E-mail",type:"email",value:r.customerEmail},
            {name:"plan",label:"Plano",options:["individual","pro"],value:r.plan},
            {name:"studentLimit",label:"Limite PRO",type:"number",min:1,max:1000,value:r.studentLimit},
            {name:"code",label:"Código",required:true,value:r.code}
          ]}/>
          <Field name="regenerate" type="checkbox" label="Gerar outro código automaticamente"/>
        </ActionForm>
        <div className="divider mt-7 pt-2">
          <ActionForm action={statusAccessAction} submit={r.status === "active" ? "Bloquear acesso" : "Reativar acesso"}
            confirm={r.status === "active" ? "Bloquear este acesso e encerrar todas as sessões do professor?" : "Reativar este acesso?"}>
            <Field name="id" type="hidden" label="ID" value={id}/>
            <Field name="status" type="hidden" label="Status" value={r.status === "active" ? "blocked" : "active"}/>
          </ActionForm>
        </div>
      </section>
      <section className="panel">
        <h2 className="mb-4">Entrega do acesso</h2>
        <p className="mb-4 text-2xl font-semibold">{r.code}</p>
        <CopyButton text={r.code} label="Copiar código"/>
        <div className="divider mt-7 pt-7"><EditableMessage text={message} label="Mensagem de entrega"/></div>
      </section>
    </div>
  </>;
}
