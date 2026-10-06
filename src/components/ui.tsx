import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Users } from "lucide-react";
export function Brand({light=false}:{light?:boolean}) {
  return <Link href="/" aria-label="Evolução Visível — início" className="inline-flex min-h-11 shrink-0 items-center">
    <Image src={light?"/brand/logo-horizontal-white.png":"/brand/logo-horizontal.png"} alt="Evolução Visível" width={720} height={160} className={light?"h-auto w-45":"h-auto w-36 sm:w-40"} priority/>
  </Link>;
}
export function PageHead({title,description,children}:{title:string;description?:string;children?:React.ReactNode}) { return <header className="page-head"><div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{children}</header>; }
export function EmptyState({title="Comece pelo seu primeiro aluno",description="Cadastre seu aluno e comece a registrar aulas e acompanhar sua evolução.",href="/alunos/novo",action="Cadastrar aluno"}:{title?:string;description?:string;href?:string;action?:string}) { return <section className="panel flex min-h-64 flex-col items-center justify-center text-center"><Users size={30} className="mb-5 text-blue"/><h2>{title}</h2><p className="muted mb-6 mt-3 max-w-md">{description}</p><Link className="button" href={href}>{action}<ArrowUpRight size={16}/></Link></section>; }
export function Avatar({name}:{name:string}) { return <span className="avatar" aria-hidden="true">{name.split(" ").filter(Boolean).slice(0,2).map(v=>v[0]).join("")}</span>; }
export function Value({label,children}:{label:string;children:React.ReactNode}) { return <div className="mb-5"><h3 className="mb-2 text-sm">{label}</h3><div className="prose-value">{children||"Ainda não registrado."}</div></div>; }
