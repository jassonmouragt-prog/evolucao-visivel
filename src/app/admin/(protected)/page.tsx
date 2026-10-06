import Link from "next/link";
import { count,eq,gte } from "drizzle-orm";
import { database } from "@/db";
import { accessCodes,students } from "@/db/schema";
import { PageHead } from "@/components/ui";
import {requireAdmin} from "@/lib/auth";
export default async function AdminDashboard(){await requireAdmin();const db=database();const [active]=await db.select({n:count()}).from(accessCodes).where(eq(accessCodes.status,"active"));const [blocked]=await db.select({n:count()}).from(accessCodes).where(eq(accessCodes.status,"blocked"));const [total]=await db.select({n:count()}).from(students);const now=new Date();const [recent]=await db.select({n:count()}).from(accessCodes).where(gte(accessCodes.createdAt,new Date(now.getFullYear(),now.getMonth(),1)));return <><PageHead title="Visão dos acessos" description="Gerencie os professores que acompanham seus alunos com você."><Link className="button" href="/admin/acessos/novo">Novo acesso</Link></PageHead><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[["Acessos ativos",active.n],["Acessos bloqueados",blocked.n],["Alunos cadastrados",total.n],["Novos acessos do mês",recent.n]].map(([label,n])=><div className="panel" key={label}><p className="muted text-sm">{label}</p><p className="stat mt-4 text-3xl font-semibold">{n}</p></div>)}</div><Link href="/admin/acessos" className="button secondary mt-8">Gerenciar acessos</Link></>;}
