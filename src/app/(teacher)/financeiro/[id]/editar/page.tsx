import {notFound} from "next/navigation";
import {requireTeacher} from "@/lib/auth";
import {ownedPayment} from "@/lib/payment-service";
import {PageHead} from "@/components/ui";
import {ActionForm,Fields,Field} from "@/components/action-form";
import {paymentFields,withValues} from "@/lib/fields";
import {paymentAction,paymentDeleteAction} from "../../payment-actions";
export default async function EditPayment({params}:{params:Promise<{id:string}>}){const access=await requireTeacher();const {id}=await params;const p=await ownedPayment(access.id,id).catch(()=>notFound());return <><PageHead title="Editar pagamento"/><section className="panel max-w-3xl"><ActionForm action={paymentAction} submit="Salvar alterações"><Field name="id" label="ID" type="hidden" value={id}/><Field name="studentId" label="Aluno" type="hidden" value={p.studentId}/><Fields fields={withValues(paymentFields(),p)}/></ActionForm><div className="divider mt-8"><ActionForm action={paymentDeleteAction} submit="Excluir pagamento" confirm="Excluir este registro financeiro permanentemente?"><Field name="id" label="ID" type="hidden" value={id}/></ActionForm></div></section></>;}
