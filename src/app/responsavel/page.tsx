import {Brand} from "@/components/ui";
import {ActionForm,Field} from "@/components/action-form";
import {responsibleLoginAction} from "./responsible-actions";
export default async function ResponsibleLoginPage({searchParams}:{searchParams:Promise<{status?:string}>}){
  const sp=await searchParams;
  return <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
    <div className="mb-10"><Brand/></div>
    <section className="panel w-full max-w-md p-8">
      <h1 className="text-2xl">Acompanhe de perto a evolução</h1>
      <p className="muted mb-8 mt-3">Digite o código fornecido pelo professor.</p>
      {sp.status==="indisponivel"&&<p role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">O acompanhamento está temporariamente indisponível. Fale com o professor.</p>}
      <ActionForm action={responsibleLoginAction} submit="Acessar">
        <Field name="code" label="Código de acesso" placeholder="Ex: JOA-8K31" required/>
      </ActionForm>
      <p className="muted mt-7 text-center text-xs">Seu acesso é individual e mostra apenas as informações vinculadas ao aluno.</p>
    </section>
    <p className="muted mt-8 text-center text-sm">Acompanhe cada aula. Entenda cada avanço.<br/>Sem precisar perguntar tudo pelo WhatsApp.</p>
  </main>;
}
