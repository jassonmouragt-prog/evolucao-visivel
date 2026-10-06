import Link from "next/link";
import {notFound} from "next/navigation";
import {and,desc,eq,sql} from "drizzle-orm";
import {database} from "@/db";
import {lessons} from "@/db/schema";
import {requireTeacher} from "@/lib/auth";
import {ownedStudent} from "@/lib/tenancy";
import {PageHead} from "@/components/ui";
import {StudentTabs} from "@/components/student-tabs";
import {LessonList} from "@/components/lesson-list";
import {monthPeriod} from "@/lib/format";
export default async function StudentLessons({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string;saved?:string}>}){const access=await requireTeacher();const {id}=await params;const s=await ownedStudent(access.id,id).catch(()=>notFound());const {page:p,saved}=await searchParams;const page=Math.max(1,Number(p)||1);const db=database();const rows=await db.select().from(lessons).where(and(eq(lessons.accessCodeId,access.id),eq(lessons.studentId,id))).orderBy(desc(lessons.date),desc(lessons.createdAt)).limit(15).offset((page-1)*15);const period=monthPeriod();const [presence]=await db.select({done:sql<number>`count(*) filter(where status in ('completed','makeup'))::int`,total:sql<number>`count(*) filter(where status in ('completed','makeup','absent'))::int`}).from(lessons).where(and(eq(lessons.accessCodeId,access.id),eq(lessons.studentId,id),sql`${lessons.date} BETWEEN ${period.start} AND ${period.end}`));return <><PageHead title={s.name} description="Histórico de aulas e presença"><Link href={`/aulas/nova?student=${id}`} className="button">Registrar aula</Link></PageHead><StudentTabs id={id} active="Aulas"/>{saved&&<p role="status" className="mb-5 rounded-lg bg-green-50 p-4 text-green-800">Aula registrada com sucesso.</p>}<p className="mb-6 font-medium">Frequência neste mês: {presence.done} de {presence.total} aulas realizadas</p><LessonList rows={rows}/>{!rows.length&&<p className="panel muted">Nenhuma aula registrada para este aluno.</p>}<div className="mt-6 flex gap-3">{page>1&&<Link className="button secondary" href={`?page=${page-1}`}>Anterior</Link>}{rows.length===15&&<Link className="button secondary" href={`?page=${page+1}`}>Próxima</Link>}</div></>;}
