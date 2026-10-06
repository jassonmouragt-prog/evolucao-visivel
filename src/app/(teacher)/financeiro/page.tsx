import Link from "next/link";
import {requireTeacher} from "@/lib/auth";
import {PageHead} from "@/components/ui";
import {FinanceView} from "@/components/finance-view";
export default async function FinancePage({searchParams}:{searchParams:Promise<{page?:string}>}){const access=await requireTeacher();const {page}=await searchParams;return <><PageHead title="Financeiro" description="O essencial para acompanhar seus recebimentos."><Link href="/financeiro/novo" className="button">Registrar pagamento</Link></PageHead><FinanceView owner={access.id} page={Math.max(1,Number(page)||1)}/></>;}
