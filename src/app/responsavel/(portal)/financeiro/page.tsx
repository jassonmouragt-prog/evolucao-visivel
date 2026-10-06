import {redirect} from "next/navigation";
import {and,desc,eq,ne} from "drizzle-orm";
import {database} from "@/db";
import {lessonPackages,payments} from "@/db/schema";
import {requireResponsible} from "@/lib/responsible-auth";
import {formatDate,money} from "@/lib/format";
function paymentBadge(status:"paid"|"pending"|"overdue"){return status==="paid"?<span className="badge success">Pago</span>:status==="pending"?<span className="badge warning">Pendente</span>:<span className="badge danger">Atrasado</span>;}
export default async function PortalFinance(){
  const ctx=await requireResponsible();
  if(!ctx.settings.showFinance)redirect("/responsavel/inicio");
  const owner=ctx.link.accessCodeId;
  const sid=ctx.link.studentId;
  const db=database();
  const scope=and;
  const [pkg]=await db.select().from(lessonPackages).where(scope(eq(lessonPackages.accessCodeId,owner),eq(lessonPackages.studentId,sid),eq(lessonPackages.status,"current"))).limit(1);
  const [open]=await db.select().from(payments).where(scope(eq(payments.accessCodeId,owner),eq(payments.studentId,sid),ne(payments.status,"paid"))).orderBy(payments.dueDate).limit(1);
  const next=open??(await db.select().from(payments).where(scope(eq(payments.accessCodeId,owner),eq(payments.studentId,sid))).orderBy(desc(payments.dueDate)).limit(1))[0];
  const history=await db.select().from(payments).where(scope(eq(payments.accessCodeId,owner),eq(payments.studentId,sid))).orderBy(desc(payments.dueDate)).limit(12);
  return <>
    <section className="panel"><h2>Pacote atual</h2>{pkg?<><div className="mt-4 flex items-baseline justify-between gap-3"><strong className="stat text-3xl font-semibold">{pkg.usedLessons}/{pkg.totalLessons}</strong><span>{money(pkg.value)}</span></div><label className="mt-3 block text-sm" htmlFor="pacote">Aulas utilizadas</label><progress id="pacote" value={pkg.usedLessons} max={pkg.totalLessons} className="mt-2 h-2 w-full accent-blue"/><p className="muted mt-4 text-sm">Restam {pkg.totalLessons-pkg.usedLessons} aulas · início {formatDate(pkg.startDate)}{pkg.renewalDate?` · renovação prevista ${formatDate(pkg.renewalDate)}`:""}</p></>:<p className="muted mt-3">Nenhum pacote cadastrado.</p>}</section>
    <section className="panel"><h2>Próximo vencimento</h2>{next?<div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-lg font-semibold">{formatDate(next.dueDate)}</p><p className="muted mt-1 text-sm">{next.description} · {money(next.amount)}</p></div>{paymentBadge(next.status)}</div>:<p className="muted mt-3">Nenhum pagamento cadastrado.</p>}</section>
    <section className="panel"><h2>Histórico de pagamentos</h2>{history.length?<ul className="mt-4 space-y-3">{history.map(p=><li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold">{p.description}</p><p className="muted mt-1 text-sm">Vencimento {formatDate(p.dueDate)}{p.paidAt?` · pago em ${formatDate(p.paidAt)}`:""}</p></div><div className="flex items-center gap-3"><span className="stat font-semibold">{money(p.amount)}</span>{paymentBadge(p.status)}</div></li>)}</ul>:<p className="muted mt-3 text-sm">Nenhum pagamento registrado ainda.</p>}</section>
  </>;
}
