"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Home,BookOpen,TrendingUp,Wallet,Info} from "lucide-react";
export function PortalNav({showFinance=true,showProgress=true}:{showFinance?:boolean;showProgress?:boolean}){
  const path=usePathname();
  const items=[{href:"/responsavel/inicio",label:"Início",icon:Home,show:true},
    {href:"/responsavel/aulas",label:"Aulas",icon:BookOpen,show:true},
    {href:"/responsavel/evolucao",label:"Evolução",icon:TrendingUp,show:showProgress},
    {href:"/responsavel/financeiro",label:"Financeiro",icon:Wallet,show:showFinance},
    {href:"/responsavel/informacoes",label:"Informações",icon:Info,show:true}].filter(i=>i.show);
  return <><nav className="tabs mx-auto hidden max-w-3xl px-5 md:flex" aria-label="Seções do portal">{items.map(i=><Link key={i.href} className={path.startsWith(i.href)?"active":""} href={i.href}>{i.label}</Link>)}</nav>
    <nav aria-label="Navegação do portal" className="fixed inset-x-0 bottom-0 z-30 grid border-t border-slate-200 bg-white px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 md:hidden" style={{gridTemplateColumns:`repeat(${items.length},minmax(0,1fr))`}}>{items.map(i=><Link key={i.href} className={`flex min-h-13 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${path.startsWith(i.href)?"bg-slate-100 text-navy":"text-slate-600"}`} href={i.href}><i.icon size={21}/>{i.label}</Link>)}</nav></>;
}
