import {notFound} from "next/navigation";
import {requireTeacher} from "@/lib/auth";
import {ownedReport} from "@/lib/report-service";
import {PageHead} from "@/components/ui";
import {ReportForm} from "@/components/report-form";
export default async function EditReport({params}:{params:Promise<{id:string}>}){const access=await requireTeacher();const {id}=await params;const report=await ownedReport(access.id,id).catch(()=>notFound());return <><PageHead title="Editar relatório" description="Os dados de presença e evolução serão atualizados a partir do período ao salvar."/><section className="panel max-w-3xl"><ReportForm data={report} id={id}/></section></>;}
