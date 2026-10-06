import {requireTeacher} from "@/lib/auth";
import {ownedReport,type ReportSnapshot} from "@/lib/report-service";
import {createReportPdf} from "@/lib/pdf";
export const runtime="nodejs";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const access=await requireTeacher();const {id}=await params;let report;try{report=await ownedReport(access.id,id);}catch{return new Response("Relatório não encontrado.",{status:404});}const bytes=await createReportPdf(report,JSON.parse(report.snapshot) as ReportSnapshot);return new Response(Buffer.from(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="evolucao-visivel-${report.periodStart}.pdf"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}
