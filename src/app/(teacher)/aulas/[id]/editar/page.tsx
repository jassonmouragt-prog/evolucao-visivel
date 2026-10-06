import {notFound} from "next/navigation";
import {requireTeacher} from "@/lib/auth";
import {ownedLesson} from "@/lib/lesson-service";
import {ownedStudent} from "@/lib/tenancy";
import {PageHead} from "@/components/ui";
import {ActionForm,Fields,Field} from "@/components/action-form";
import {lessonFields,withValues} from "@/lib/fields";
import {lessonAction,lessonDeleteAction} from "../../lesson-actions";
export default async function EditLesson({params}:{params:Promise<{id:string}>}){const access=await requireTeacher();const {id}=await params;const l=await ownedLesson(access.id,id).catch(()=>notFound());const s=await ownedStudent(access.id,l.studentId);return <><PageHead title="Detalhes da aula" description={s.name}/><section className="panel max-w-3xl"><ActionForm action={lessonAction} submit="Salvar alterações"><Field name="id" label="ID" type="hidden" value={id}/><Field name="studentId" label="Aluno" type="hidden" value={l.studentId}/><Fields fields={withValues(lessonFields(),l)}/></ActionForm><div className="divider mt-8"><ActionForm action={lessonDeleteAction} submit="Excluir aula" confirm="Excluir esta aula? O saldo do pacote será restituído, se a aula tiver sido contabilizada."><Field name="id" label="ID" type="hidden" value={id}/></ActionForm></div></section></>;}
