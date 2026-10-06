import Link from "next/link";
import {requireResponsible} from "@/lib/responsible-auth";
export default async function WelcomePage(){
  const ctx=await requireResponsible();
  const who=ctx.contact?.name.trim().split(/\s+/)[0]??"responsável";
  return <section className="panel text-center">
    <p className="text-4xl" aria-hidden="true">👋</p>
    <h1 className="mt-4">Olá, {who}</h1>
    <p className="muted mx-auto mt-4 max-w-md">Aqui você pode acompanhar as principais informações de {ctx.student.name} sem precisar consultar o professor para cada atualização.</p>
    <Link className="button mt-7" href="/responsavel/inicio">Ver acompanhamento</Link>
  </section>;
}
