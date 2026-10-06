import Link from "next/link";
import {notFound} from "next/navigation";
import {and,desc,eq} from "drizzle-orm";
import {database} from "@/db";
import {reports} from "@/db/schema";
import {requireTeacher} from "@/lib/auth";
import {ownedStudent} from "@/lib/tenancy";
import {PageHead} from "@/components/ui";
import {StudentTabs} from "@/components/student-tabs";
import {ReportList} from "@/components/report-list";
export default async function StudentReports({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string}>}){const access=await requireTeacher();const {id}=await params;const s=await ownedStudent(access.id,id).catch(()=>notFound());const {page:p}=await searchParams;const page=Math.max(1,Number(p)||1);const rows=await database().select().from(reports).where(and(eq(reports.accessCodeId,access.id),eq(reports.studentId,id))).orderBy(desc(reports.generatedAt)).limit(15).offset((page-1)*15);return <><PageHead title={s.name} description="Relatórios de acompanhamento"><Link href={`/relatorios/novo?student=${id}`} className="button">Gerar relatório</Link></PageHead><StudentTabs id={id} active="Relatórios"/><ReportList rows={rows}/>{!rows.length&&<p className="panel muted">Nenhum relatório gerado para este aluno.</p>}<div className="mt-5 flex gap-3">{page>1&&<Link className="button secondary" href={`?page=${page-1}`}>Anterior</Link>}{rows.length===15&&<Link className="button secondary" href={`?page=${page+1}`}>Próxima</Link>}</div></>;}
