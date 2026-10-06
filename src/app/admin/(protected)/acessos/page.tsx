import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { database } from "@/db";
import { accessCodes } from "@/db/schema";
import { PageHead } from "@/components/ui";
import { CopyButton } from "@/components/copy";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";

export default async function AccessList({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const rows = await database().select({
    access: accessCodes,
    active: sql<number>`(select count(*)::int from students where students.access_code_id = ${accessCodes.id} and students.active)`
  }).from(accessCodes).orderBy(desc(accessCodes.createdAt)).limit(25).offset((page - 1) * 25);
  return <>
    <PageHead title="Acessos" description="Códigos pessoais, planos e status dos compradores.">
      <Link href="/admin/acessos/novo" className="button">Novo acesso</Link>
    </PageHead>
    <div className="space-y-4">{rows.map(({ access: r, active }) =>
      <article className="panel flex flex-wrap items-center justify-between gap-5" key={r.id}>
        <div>
          <Link className="font-semibold" href={`/admin/acessos/${r.id}`}>{r.customerName}</Link>
          <p className="muted mt-1 text-sm">{r.customerEmail || "Sem e-mail"} · {r.plan} · {active}/{r.studentLimit} alunos</p>
          <p className="muted mt-1 text-xs">Criado: {formatDate(r.createdAt)} · Último acesso: {formatDate(r.lastAccessAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`badge ${r.status === "active" ? "success" : "danger"}`}>{r.status === "active" ? "Ativo" : "Bloqueado"}</span>
          <span className="font-semibold">{r.code}</span>
          <CopyButton text={r.code}/>
          <Link href={`/admin/acessos/${r.id}`} className="button secondary">Ver acesso</Link>
        </div>
      </article>
    )}</div>
    <div className="mt-6 flex gap-3">
      {page > 1 && <Link className="button secondary" href={`?page=${page - 1}`}>Anterior</Link>}
      {rows.length === 25 && <Link className="button secondary" href={`?page=${page + 1}`}>Próxima</Link>}
    </div>
  </>;
}
