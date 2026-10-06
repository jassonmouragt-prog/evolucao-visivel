import Link from "next/link";
import {formatDate} from "@/lib/format";
import type {reports} from "@/db/schema";
export function ReportList({rows}:{rows:(typeof reports.$inferSelect&{studentName?:string})[]}){return <div className="space-y-4">{rows.map(r=><article className="panel flex flex-wrap items-center justify-between gap-4" key={r.id}><div><h2 className="text-base">{r.studentName||"Relatório de acompanhamento"}</h2><p className="muted mt-1 text-sm">{formatDate(r.periodStart)} a {formatDate(r.periodEnd)} · {r.lessonsCount} aulas</p><span className="badge mt-3">{r.generalProgress}</span></div><Link className="button secondary" href={`/relatorios/${r.id}`}>Ver relatório / PDF</Link></article>)}</div>;}
