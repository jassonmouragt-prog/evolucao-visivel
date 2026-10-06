import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminLogoutAction } from "@/app/actions";
import { Brand } from "@/components/ui";
export const dynamic="force-dynamic";
export default async function AdminLayout({children}:{children:React.ReactNode}){await requireAdmin();return <><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4"><Brand/><nav className="flex items-center gap-5 text-sm"><Link href="/admin">Resumo</Link><Link href="/admin/acessos">Acessos</Link><form action={adminLogoutAction}><button className="button secondary">Sair</button></form></nav></div></header><main className="mx-auto max-w-6xl px-5 py-10">{children}</main></>;}
