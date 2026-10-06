import Link from "next/link";
import {and,desc,eq} from "drizzle-orm";
import {database} from "@/db";
import {reports,students} from "@/db/schema";
import {requireTeacher} from "@/lib/auth";
import {PageHead,EmptyState} from "@/components/ui";
import {ReportList} from "@/components/report-list";
export default async function ReportsPage({searchParams}:{searchParams:Promise<{page?:string}>}){const access=await requireTeacher();const {page:p}=await searchParams;const page=Math.max(1,Number(p)||1);const rows=await database().select({report:reports,name:students.name}).from(reports).innerJoin(students,and(eq(students.id,reports.studentId),eq(students.accessCodeId,access.id))).where(eq(reports.accessCodeId,access.id)).orderBy(desc(reports.generatedAt)).limit(20).offset((page-1)*20);return <><PageHead title="Relatórios" description="Mostre o cuidado e a evolução por trás de cada aula."><Link className="button" href="/relatorios/novo">Gerar relatório</Link></PageHead>{rows.length?<ReportList rows={rows.map(r=>({...r.report,studentName:r.name}))}/>:<EmptyState title="O progresso merece ser compartilhado" description="Selecione um aluno e um período para preparar seu primeiro relatório." href="/relatorios/novo" action="Gerar relatório"/>}<div className="mt-6 flex gap-3">{page>1&&<Link className="button secondary" href={`?page=${page-1}`}>Anterior</Link>}{rows.length===20&&<Link className="button secondary" href={`?page=${page+1}`}>Próxima</Link>}</div></>;}
