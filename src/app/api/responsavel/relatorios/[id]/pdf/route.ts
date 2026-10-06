import {and,eq} from "drizzle-orm";
import {database} from "@/db";
import {reports} from "@/db/schema";
import {createReportPdf} from "@/lib/pdf";
import type {ReportSnapshot} from "@/lib/report-service";
import {requireResponsible} from "@/lib/responsible-auth";
import {uuidSchema} from "@/lib/validation";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const ctx=await requireResponsible();
  if(!ctx.settings.showReports)return new Response("Relatório indisponível.",{status:404});
  const {id}=await params;
  if(!uuidSchema.safeParse(id).success)return new Response("Relatório não encontrado.",{status:404});
  const [report]=await database().select().from(reports).where(and(eq(reports.id,id),eq(reports.accessCodeId,ctx.link.accessCodeId),eq(reports.studentId,ctx.link.studentId))).limit(1);
  if(!report)return new Response("Relatório não encontrado.",{status:404});
  const bytes=await createReportPdf(report,JSON.parse(report.snapshot) as ReportSnapshot);
  const download=new URL(request.url).searchParams.get("download")==="1";
  return new Response(Buffer.from(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":`${download?"attachment":"inline"}; filename="relatorio-${report.periodStart}.pdf"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
