import {requireResponsible} from "@/lib/responsible-auth";
import {responsibleLogoutAction} from "../responsible-actions";
import {Brand} from "@/components/ui";
import {PortalNav} from "@/components/portal-nav";
export const dynamic="force-dynamic";
export default async function PortalLayout({children}:{children:React.ReactNode}){
  const ctx=await requireResponsible();
  return <div className="flex min-h-screen flex-col">
    <header className="border-b border-slate-200 bg-white px-5 py-4">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Brand/>
        <form action={responsibleLogoutAction}><button className="button secondary" type="submit">Sair</button></form>
      </div>
      <div className="mx-auto mt-4 max-w-3xl">
        <h1 className="text-2xl">{ctx.student.name}</h1>
        <p className="muted mt-1 text-sm">{ctx.student.subject} · {ctx.student.grade}{ctx.teacher?` · Prof. ${ctx.teacher.name}`:""}</p>
      </div>
    </header>
    <PortalNav showFinance={ctx.settings.showFinance} showProgress={ctx.settings.showProgress}/>
    <main id="conteudo" className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-5 pb-28 pt-6 md:pb-12">{children}</main>
    <footer className="hidden px-5 pb-6 text-center text-xs text-slate-400 md:block">Evolução Visível · acompanhamento do responsável</footer>
  </div>;
}
