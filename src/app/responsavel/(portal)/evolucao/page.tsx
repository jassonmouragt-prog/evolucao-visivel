import {redirect} from "next/navigation";
import {and,asc,desc,eq} from "drizzle-orm";
import {database} from "@/db";
import {progressEntries,reports} from "@/db/schema";
import {requireResponsible} from "@/lib/responsible-auth";
import {indicators} from "@/lib/fields";
import {formatDate,periodLabel} from "@/lib/format";
function Value({label,children}:{label:string;children:React.ReactNode}){return <div><p className="muted text-sm">{label}</p><p className="mt-1">{children}</p></div>;}
export default async function PortalEvolution(){
  const ctx=await requireResponsible();
  if(!ctx.settings.showProgress)redirect("/responsavel/inicio");
  const owner=ctx.link.accessCodeId;
  const sid=ctx.link.studentId;
  const db=database();
  const where=and(eq(progressEntries.accessCodeId,owner),eq(progressEntries.studentId,sid));
  const [last]=await db.select().from(progressEntries).where(where).orderBy(desc(progressEntries.date),desc(progressEntries.createdAt)).limit(1);
  const [first]=await db.select().from(progressEntries).where(where).orderBy(asc(progressEntries.date),asc(progressEntries.createdAt)).limit(1);
  const reportsList=ctx.settings.showReports?await db.select().from(reports).where(and(eq(reports.accessCodeId,owner),eq(reports.studentId,sid))).orderBy(desc(reports.periodStart)).limit(12):[];
  const baseline=last&&first&&first.id!==last.id?first:undefined;
  return <>
    {last?<section className="panel"><h2>{baseline?"Do início até aqui":"Avaliação mais recente"}</h2><p className="muted mt-1 text-sm">Notas de 1 a 5 · última avaliação em {formatDate(last.date)}</p><div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{indicators.map(i=><div key={i.key}><div className="mb-2 flex justify-between text-sm"><span>{i.label}</span><strong className="stat">{baseline?`${baseline[i.key]} → `:""}{last[i.key]}</strong></div><div className="flex gap-1" role="img" aria-label={`${i.label}: ${last[i.key]} de 5`}>{[1,2,3,4,5].map(n=><span key={n} className={`h-2 flex-1 rounded-sm ${n<=last[i.key]?"bg-blue":"bg-slate-100"}`}/>)}</div></div>)}</div>{(last.mainImprovement||last.attentionPoint)&&<div className="mt-7 grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-2"><Value label="Maior evolução percebida">{last.mainImprovement||"—"}</Value><Value label="Foco atual">{last.attentionPoint||"—"}</Value></div>}</section>:<section className="panel"><h2>Evolução</h2><p className="muted mt-3">Nenhuma avaliação registrada ainda.</p></section>}
    {ctx.settings.showReports&&<section className="panel"><h2>Relatórios</h2>{reportsList.length?<ul className="mt-4 space-y-3">{reportsList.map(r=><li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold">Relatório — {periodLabel(r.periodStart)}</p><p className="muted mt-1 text-sm">{formatDate(r.periodStart)} a {formatDate(r.periodEnd)} · {r.lessonsCount} aulas</p></div><div className="flex flex-wrap gap-2"><a className="button secondary" href={`/api/responsavel/relatorios/${r.id}/pdf`} target="_blank" rel="noopener">Visualizar</a><a className="button secondary" href={`/api/responsavel/relatorios/${r.id}/pdf?download=1`}>Baixar PDF</a></div></li>)}</ul>:<p className="muted mt-3 text-sm">Nenhum relatório disponível ainda.</p>}</section>}
  </>;
}
