import {eq} from "drizzle-orm";
import {database} from "@/db";
import {students} from "@/db/schema";
import {requireTeacher} from "@/lib/auth";
import {PageHead,EmptyState} from "@/components/ui";
import {ActionForm,Field,Fields} from "@/components/action-form";
import {paymentFields} from "@/lib/fields";
import {paymentAction} from "../payment-actions";
export default async function NewPayment({searchParams}:{searchParams:Promise<{student?:string}>}){const access=await requireTeacher();const {student}=await searchParams;const rows=await database().select({id:students.id,name:students.name}).from(students).where(eq(students.accessCodeId,access.id)).orderBy(students.name).limit(1000);return <><PageHead title="Registrar pagamento"/>{rows.length?<section className="panel max-w-3xl"><ActionForm action={paymentAction} submit="Salvar pagamento"><Field name="studentId" label="Aluno" required options={rows.map(s=>({value:s.id,label:s.name}))} value={student}/><Fields fields={paymentFields()}/></ActionForm></section>:<EmptyState/>}</>;}
