import Link from "next/link";
import {notFound} from "next/navigation";
import {requireTeacher} from "@/lib/auth";
import {ownedStudent} from "@/lib/tenancy";
import {PageHead} from "@/components/ui";
import {StudentTabs} from "@/components/student-tabs";
import {FinanceView} from "@/components/finance-view";
export default async function StudentFinance({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string}>}){const access=await requireTeacher();const {id}=await params;const s=await ownedStudent(access.id,id).catch(()=>notFound());const {page}=await searchParams;return <><PageHead title={s.name} description="Financeiro do aluno"><Link href={`/financeiro/novo?student=${id}`} className="button">Registrar pagamento</Link></PageHead><StudentTabs id={id} active="Financeiro"/><FinanceView owner={access.id} studentId={id} page={Math.max(1,Number(page)||1)}/></>;}
