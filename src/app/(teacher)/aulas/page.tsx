import Link from "next/link";
import {and,desc,eq} from "drizzle-orm";
import {database} from "@/db";
import {lessons,students} from "@/db/schema";
import {requireTeacher} from "@/lib/auth";
import {PageHead,EmptyState} from "@/components/ui";
import {LessonList} from "@/components/lesson-list";
export default async function LessonsPage({searchParams}:{searchParams:Promise<{page?:string}>}){const access=await requireTeacher();const {page:p}=await searchParams;const page=Math.max(1,Number(p)||1);const rows=await database().select({lesson:lessons,name:students.name}).from(lessons).innerJoin(students,and(eq(students.id,lessons.studentId),eq(students.accessCodeId,access.id))).where(eq(lessons.accessCodeId,access.id)).orderBy(desc(lessons.date),desc(lessons.startTime)).limit(20).offset((page-1)*20);return <><PageHead title="Aulas" description="A agenda e os registros que constroem o acompanhamento."><Link className="button" href="/aulas/nova">Registrar / agendar aula</Link></PageHead>{rows.length?<LessonList rows={rows.map(r=>({...r.lesson,studentName:r.name}))}/>:<EmptyState title="Cada aula merece um registro" description="Registre a primeira aula ou agende um próximo encontro." href="/aulas/nova" action="Registrar aula"/>}<div className="mt-6 flex gap-3">{page>1&&<Link className="button secondary" href={`?page=${page-1}`}>Anterior</Link>}{rows.length===20&&<Link className="button secondary" href={`?page=${page+1}`}>Próxima</Link>}</div></>;}
