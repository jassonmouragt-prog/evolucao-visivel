import Link from "next/link";
import {desc,eq,and,asc} from "drizzle-orm";
import {database} from "@/db";
import {makeupRequests,makeupSlots,responsibleStudentAccess,responsibleContacts,students} from "@/db/schema";
import {requireTeacher} from "@/lib/auth";
import {getPortalSettings} from "@/lib/responsible-service";
import {formatDate} from "@/lib/format";
import {PageHead} from "@/components/ui";
import {ActionForm,Field,Fields} from "@/components/action-form";
import {portalSettingsAction,makeupSlotCreateAction,makeupSlotStatusAction,makeupRequestDecisionAction} from "./portal-actions";
const slotBadge:{[k:string]:string}={available:"success",requested:"warning",confirmed:"success",unavailable:"danger"};
const slotLabel:{[k:string]:string}={available:"Aberto",requested:"Solicitado",confirmed:"Confirmado",unavailable:"Fechado"};
export const dynamic="force-dynamic";
export default async function PortalPage(){
  const access=await requireTeacher();
  const settings=await getPortalSettings(access.id);
  const db=database();
  const accesses=await db.select({row:responsibleStudentAccess,contact:responsibleContacts,student:students})
    .from(responsibleStudentAccess)
    .innerJoin(students,and(eq(students.id,responsibleStudentAccess.studentId),eq(students.accessCodeId,responsibleStudentAccess.accessCodeId)))
    .innerJoin(responsibleContacts,eq(responsibleContacts.id,responsibleStudentAccess.responsibleId))
    .where(eq(responsibleStudentAccess.accessCodeId,access.id))
    .orderBy(desc(responsibleStudentAccess.createdAt)).limit(60);
  const slots=await db.select().from(makeupSlots).where(eq(makeupSlots.accessCodeId,access.id)).orderBy(asc(makeupSlots.date),asc(makeupSlots.startTime)).limit(20);
  const pending=await db.select({req:makeupRequests,slot:makeupSlots,student:students.name,contact:responsibleContacts.name})
    .from(makeupRequests)
    .innerJoin(makeupSlots,eq(makeupSlots.id,makeupRequests.slotId))
    .innerJoin(students,and(eq(students.id,makeupRequests.studentId),eq(students.accessCodeId,access.id)))
    .innerJoin(responsibleStudentAccess,eq(responsibleStudentAccess.id,makeupRequests.responsibleAccessId))
    .innerJoin(responsibleContacts,eq(responsibleContacts.id,responsibleStudentAccess.responsibleId))
    .where(and(eq(makeupRequests.accessCodeId,access.id),eq(makeupRequests.status,"pending")))
    .orderBy(asc(makeupSlots.date),asc(makeupSlots.startTime)).limit(20);
  return <><PageHead title="Portal do Responsável" description="Configure o que os responsáveis dos seus alunos enxergam no portal."/>
  <div className="max-w-3xl space-y-6">
    <section className="panel"><h2>O que o responsável vê</h2><p className="muted mt-3 text-sm">O portal é somente leitura e mostra apenas as informações do aluno vinculado ao código. Desativar o portal impede novos acessos e desconecta sessões ativas na próxima visita.</p>
      <ActionForm action={portalSettingsAction} submit="Salvar preferências">
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field name="enabled" label="Portal ativo" type="checkbox" value={String(settings.enabled)}/>
          <Field name="showFinance" label="Mostrar financeiro" type="checkbox" value={String(settings.showFinance)}/>
          <Field name="showProgress" label="Mostrar evolução" type="checkbox" value={String(settings.showProgress)}/>
          <Field name="showLessonContent" label="Mostrar conteúdo das aulas" type="checkbox" value={String(settings.showLessonContent)}/>
          <Field name="showReports" label="Mostrar relatórios" type="checkbox" value={String(settings.showReports)}/>
        </div>
        <div className="divider my-6"/>
        <Fields fields={[
          {name:"rulesPayment",label:"Regras de pagamento",type:"textarea",value:settings.rulesPayment,placeholder:"Ex.: Pagamento até o dia 10 de cada mês."},
          {name:"rulesCancellation",label:"Regras de cancelamento",type:"textarea",value:settings.rulesCancellation},
          {name:"rulesReplacement",label:"Política de reposição",type:"textarea",value:settings.rulesReplacement,placeholder:"Ex.: Faltas com aviso prévio têm reposição."},
          {name:"schedules",label:"Horários",type:"textarea",value:settings.schedules,placeholder:"Ex.: Segunda e quarta, 14h às 18h."},
          {name:"materials",label:"Materiais",type:"textarea",value:settings.materials},
          {name:"otherInfo",label:"Outras informações",type:"textarea",value:settings.otherInfo}
        ]}/>
      </ActionForm>
    </section>
    <section className="panel"><h2>Acessos dos responsáveis</h2>
      {accesses.length?<ul className="mt-4 space-y-3">{accesses.map(({row,contact,student})=><li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-semibold">{contact.name}</p><p className="muted mt-1 text-sm"><Link className="text-blue hover:underline" href={`/alunos/${student.id}`}>{student.name}</Link> · {student.subject}</p></div><div className="flex items-center gap-3"><span className={`badge ${row.status==="active"?"success":"warning"}`}>{row.status==="active"?"Ativo":"Bloqueado"}</span><span className="font-mono text-sm font-semibold">{row.code}</span></div></li>)}</ul>:<p className="muted mt-3 text-sm">Nenhum acesso criado ainda. Abra o perfil de um aluno e use “Acesso do responsável”.</p>}
    </section>
    <section className="panel">
      <h2>Reposições</h2>
      <p className="muted mt-3 text-sm">Abra horários disponíveis e aprove ou rejeite os pedidos enviados pelos responsáveis.</p>
      <ActionForm action={makeupSlotCreateAction} submit="Abrir horário">
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Field name="date" label="Data" type="date" required/>
          <Field name="startTime" label="Início" type="time" required/>
          <Field name="endTime" label="Fim" type="time" required/>
        </div>
      </ActionForm>
      {pending.length?<div className="mt-7">
        <h3 className="text-base font-semibold">Solicitações pendentes</h3>
        <ul className="mt-3 space-y-3">
          {pending.map(({req,slot,student,contact})=>(
            <li key={req.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{formatDate(slot.date)} · {slot.startTime} às {slot.endTime}</p>
                  <p className="muted mt-1 text-sm">{student} · solicitado por {contact}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionForm action={makeupRequestDecisionAction} submit="Aprovar">
                    <Field name="id" label="Solicitação" type="hidden" value={req.id}/>
                    <Field name="decision" label="Decisão" type="hidden" value="approved"/>
                  </ActionForm>
                  <ActionForm action={makeupRequestDecisionAction} submit="Rejeitar" confirm="Rejeitar esta solicitação?">
                    <Field name="id" label="Solicitação" type="hidden" value={req.id}/>
                    <Field name="decision" label="Decisão" type="hidden" value="rejected"/>
                  </ActionForm>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>:null}
      {slots.length?<div className="mt-7">
        <h3 className="text-base font-semibold">Horários abertos</h3>
        <ul className="mt-3 space-y-3">
          {slots.map(s=>(
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
              <div>
                <p className="font-semibold">{formatDate(s.date)} · {s.startTime} às {s.endTime}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${slotBadge[s.status]}`}>{slotLabel[s.status]}</span>
                {(s.status==="available"||s.status==="unavailable")&&(
                  <ActionForm action={makeupSlotStatusAction} submit={s.status==="available"?"Fechar":"Reabrir"}>
                    <Field name="id" label="Horário" type="hidden" value={s.id}/>
                    <Field name="status" label="Situação" type="hidden" value={s.status==="available"?"unavailable":"available"}/>
                  </ActionForm>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>:<p className="muted mt-5 text-sm">Nenhum horário aberto ainda.</p>}
    </section>
  </div></>;
}
