import {notFound} from "next/navigation";
import {requireTeacher} from "@/lib/auth";
import {ownedStudent} from "@/lib/tenancy";
import {PageHead} from "@/components/ui";
import {ActionForm,Fields,Field} from "@/components/action-form";
import {studentFields,withValues} from "@/lib/fields";
import {studentAction} from "../../../teacher-actions";
export default async function EditStudent({params}:{params:Promise<{id:string}>}){const access=await requireTeacher();const {id}=await params;const s=await ownedStudent(access.id,id).catch(()=>notFound());return <><PageHead title={`Editar ${s.name}`}/><section className="panel max-w-3xl"><ActionForm action={studentAction} submit="Salvar alterações"><Field name="id" label="ID" type="hidden" value={id}/><Fields fields={withValues(studentFields(),s)}/></ActionForm></section></>;}
