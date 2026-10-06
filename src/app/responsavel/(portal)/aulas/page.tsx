import {and,asc,desc,eq,gte,lt,ne,or} from "drizzle-orm";
import {database} from "@/db";
import {lessons,makeupRequests,makeupSlots} from "@/db/schema";
import {requireResponsible} from "@/lib/responsible-auth";
import {formatDate,lessonStatus,today} from "@/lib/format";
import {ActionForm,Field} from "@/components/action-form";
import {makeupCancelAction,makeupRequestAction} from "../../responsible-actions";
const badges:{[k:string]:string}={completed:"success",makeup:"success",scheduled:"",absent:"danger",cancelled:"warning"};
const requestBadge:{[k:string]:string}={pending:"warning",approved:"success",rejected:"danger",cancelled:""};
const requestLabel:{[k:string]:string}={pending:"Aguardando o professor",approved:"Aprovada",rejected:"Rejeitada",cancelled:"Cancelada"};
export default async function PortalLessons(){
  const ctx=await requireResponsible();
  const owner=ctx.link.accessCodeId;
  const sid=ctx.link.studentId;
  const day=today();
  const db=database();
  const scope=()=>and(eq(lessons.accessCodeId,owner),eq(lessons.studentId,sid));
  const upcoming=await db.select().from(lessons).where(and(scope(),eq(lessons.status,"scheduled"),gte(lessons.date,day))).orderBy(asc(lessons.date),asc(lessons.startTime)).limit(8);
  const past=await db.select().from(lessons).where(and(scope(),or(lt(lessons.date,day),ne(lessons.status,"scheduled")))).orderBy(desc(lessons.date),desc(lessons.startTime)).limit(40);
  const slots=await db.select().from(makeupSlots).where(and(eq(makeupSlots.accessCodeId,owner),eq(makeupSlots.status,"available"),gte(makeupSlots.date,day))).orderBy(asc(makeupSlots.date),asc(makeupSlots.startTime)).limit(8);
  const mine=await db.select({req:makeupRequests,slot:makeupSlots}).from(makeupRequests)
    .innerJoin(makeupSlots,eq(makeupSlots.id,makeupRequests.slotId))
    .where(and(eq(makeupRequests.accessCodeId,owner),eq(makeupRequests.responsibleAccessId,ctx.link.id)))
    .orderBy(desc(makeupRequests.createdAt)).limit(10);
  const text=(l:typeof lessons.$inferSelect)=>l.publicSummary||(ctx.settings.showLessonContent?l.content:"");
  return <>
    <section className="panel"><h2>Próximas aulas</h2>{upcoming.length?<ul className="mt-4 space-y-3">{upcoming.map(l=><li key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold">{formatDate(l.date)} · {l.startTime}</p><p className="muted mt-1 text-sm">{l.duration} min · {lessonStatus(l.status)}</p></div></li>)}</ul>:<p className="muted mt-3 text-sm">Nenhuma aula agendada no momento.</p>}</section>
    <section className="panel"><h2>Solicitar reposição</h2>{slots.length?<ul className="mt-4 space-y-3">{slots.map(s=><li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold">{formatDate(s.date)} · {s.startTime} às {s.endTime}</p><p className="muted mt-1 text-sm">Horário disponível para reposição</p></div><ActionForm action={makeupRequestAction} submit="Solicitar" confirm="Enviar solicitação para este horário?"><Field name="slotId" label="Horário" type="hidden" value={s.id}/></ActionForm></li>)}</ul>:<p className="muted mt-3 text-sm">Nenhum horário disponível no momento. O professor avisa por aqui quando abrir novas opções.</p>}</section>
    {mine.length?<section className="panel"><h2>Minhas solicitações</h2><ul className="mt-4 space-y-3">{mine.map(({req,slot})=><li key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold">{formatDate(slot.date)} · {slot.startTime} às {slot.endTime}</p><p className="muted mt-1 text-sm">Solicitado em {formatDate(req.createdAt)}</p></div><div className="flex items-center gap-3"><span className={`badge ${requestBadge[req.status]}`}>{requestLabel[req.status]}</span>{req.status==="pending"&&<ActionForm action={makeupCancelAction} submit="Cancelar" confirm="Cancelar esta solicitação?"><Field name="id" label="Solicitação" type="hidden" value={req.id}/></ActionForm>}</div></li>)}</ul></section>:null}
    <section className="panel"><h2>Histórico de aulas</h2>{past.length?<ul className="mt-4 space-y-3">{past.map(l=><li key={l.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{formatDate(l.date)} · {l.startTime}</p><p className="muted mt-1 text-sm">{l.duration} min</p></div><span className={`badge ${badges[l.status]??""}`}>{lessonStatus(l.status)}</span></div>{l.status!=="scheduled"&&text(l)&&<p className="prose-value mt-3 text-sm">{text(l)}</p>}</li>)}</ul>:<p className="muted mt-3 text-sm">Nenhuma aula registrada ainda.</p>}</section>
  </>;
}
