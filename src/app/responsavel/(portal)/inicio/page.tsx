import Link from "next/link";
import {and,desc,eq,gte,ne,sql} from "drizzle-orm";
import {count} from "drizzle-orm";
import {database} from "@/db";
import {lessons,lessonPackages,payments,progressEntries,reports} from "@/db/schema";
import {requireResponsible} from "@/lib/responsible-auth";
import {formatDate,money,periodLabel,today} from "@/lib/format";
function Card({label,children}:{label:string;children:React.ReactNode}){return <div className="panel"><p className="muted text-xs font-semibold uppercase tracking-wide">{label}</p><div className="mt-2">{children}</div></div>;}
export default async function PortalHome(){
  const ctx=await requireResponsible();
  const s=ctx.settings;
  const owner=ctx.link.accessCodeId;
  const sid=ctx.link.studentId;
  const db=database();
  const scope=and;
  const [next]=await db.select().from(lessons).where(scope(eq(lessons.accessCodeId,owner),eq(lessons.studentId,sid),eq(lessons.status,"scheduled"),gte(lessons.date,today()))).orderBy(lessons.date,lessons.startTime).limit(1);
  const [pkg]=await db.select().from(lessonPackages).where(scope(eq(lessonPackages.accessCodeId,owner),eq(lessonPackages.studentId,sid),eq(lessonPackages.status,"current"))).limit(1);
  const [openPayment]=await db.select().from(payments).where(scope(eq(payments.accessCodeId,owner),eq(payments.studentId,sid),ne(payments.status,"paid"))).orderBy(payments.dueDate).limit(1);
  const payment=openPayment??(await db.select().from(payments).where(scope(eq(payments.accessCodeId,owner),eq(payments.studentId,sid))).orderBy(desc(payments.dueDate)).limit(1))[0];
  const progress=s.showProgress?(await db.select().from(progressEntries).where(scope(eq(progressEntries.accessCodeId,owner),eq(progressEntries.studentId,sid))).orderBy(desc(progressEntries.date),desc(progressEntries.createdAt)).limit(1))[0]:undefined;
  const report=s.showReports?(await db.select().from(reports).where(scope(eq(reports.accessCodeId,owner),eq(reports.studentId,sid))).orderBy(desc(reports.periodStart)).limit(1))[0]:undefined;
  const done=pkg?pkg.usedLessons:(await db.select({n:count()}).from(lessons).where(scope(eq(lessons.accessCodeId,owner),eq(lessons.studentId,sid),sql`${lessons.status} IN ('completed','makeup')`)))[0].n;
  const who=ctx.contact?.name.trim().split(/\s+/)[0]??"responsável";
  const paymentBadge=!payment?<span className="muted">Não informado</span>:payment.status==="paid"?<span className="badge success">Pago</span>:payment.status==="pending"?<span className="badge warning">Pendente</span>:<span className="badge danger">Atrasado</span>;
  return <>
    <section className="panel"><p className="muted text-sm">Olá, {who} 👋</p><p className="mt-2 text-lg font-semibold">Acompanhamento de {ctx.student.name}</p><p className="muted mt-1 text-sm">Veja abaixo o resumo das informações disponíveis.</p></section>
    <div className="grid gap-4 sm:grid-cols-2">
      <Card label="Próxima aula">{next?<><p className="text-lg font-semibold">{formatDate(next.date)}</p><p className="muted text-sm">{next.startTime}</p></>:<p className="muted">Não informado</p>}</Card>
      <Card label="Aulas realizadas"><p className="stat text-3xl font-semibold">{done}</p></Card>
      <Card label="Aulas restantes">{pkg?<p className="stat text-3xl font-semibold">{pkg.totalLessons-pkg.usedLessons}</p>:<p className="muted">Não informado</p>}</Card>
      <Card label="Pagamento">{paymentBadge}</Card>
      <Card label="Próximo vencimento">{payment&&s.showFinance?<p className="text-lg font-semibold">{formatDate(payment.dueDate)}</p>:<p className="muted">Não informado</p>}</Card>
      <Card label="Pacote atual">{pkg&&s.showFinance?<><p className="text-lg font-semibold">{pkg.totalLessons} aulas · {money(pkg.value)}</p><p className="muted text-sm">{pkg.usedLessons} de {pkg.totalLessons} utilizadas</p></>:<p className="muted">Não informado</p>}</Card>
    </div>
    {progress&&<section className="panel"><h2>Evolução recente</h2>{progress.mainImprovement||progress.attentionPoint?<p className="prose-value mt-3 italic">{progress.mainImprovement||progress.attentionPoint}</p>:<p className="muted mt-3">Sem comentários registrados.</p>}<Link className="button secondary mt-5" href="/responsavel/evolucao">Ver evolução completa</Link></section>}
    {s.showReports&&<section className="panel"><h2>Último relatório</h2>{report?<><p className="mt-3 font-semibold">Relatório — {periodLabel(report.periodStart)}</p><a className="button mt-5" href={`/api/responsavel/relatorios/${report.id}/pdf`} target="_blank" rel="noopener">Visualizar relatório</a></>:<p className="muted mt-3">Nenhum relatório disponível ainda.</p>}</section>}
  </>;
}
