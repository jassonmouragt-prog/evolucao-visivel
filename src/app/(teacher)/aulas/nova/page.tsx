import {and,eq} from "drizzle-orm";
import {database} from "@/db";
import {students} from "@/db/schema";
import {requireTeacher} from "@/lib/auth";
import {PageHead,EmptyState} from "@/components/ui";
import {ActionForm,Field,Fields} from "@/components/action-form";
import {lessonFields} from "@/lib/fields";
import {lessonAction} from "../lesson-actions";
export default async function NewLesson({searchParams}:{searchParams:Promise<{student?:string}>}){const access=await requireTeacher();const {student}=await searchParams;const rows=await database().select({id:students.id,name:students.name}).from(students).where(and(eq(students.accessCodeId,access.id),eq(students.active,true))).orderBy(students.name).limit(1000);return <><PageHead title="Registrar aula" description="Um minuto de registro. Um avanço que fica visível."/>{rows.length?<section className="panel max-w-3xl"><ActionForm action={lessonAction} submit="Salvar aula"><Field name="studentId" label="Aluno" required options={rows.map(s=>({value:s.id,label:s.name}))} value={rows.some(s=>s.id===student)?student:rows[0].id}/><Fields fields={lessonFields()}/></ActionForm></section>:<EmptyState/>}</>;}
