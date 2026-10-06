import Link from "next/link";
import {PageHead} from "@/components/ui";
import {teacherLogoutAction} from "@/app/actions";
import {ChevronRight} from "lucide-react";
export default function MorePage(){return <><PageHead title="Seu espaço" description="Ferramentas para um acompanhamento mais completo."/><nav className="panel max-w-2xl" aria-label="Mais opções">{[{name:"Pacotes",url:"/pacotes"},{name:"Financeiro",url:"/financeiro"},{name:"Mensagens",url:"/mensagens"},{name:"Portal do Responsável",url:"/portal"},{name:"Perfil",url:"/perfil"},{name:"Configurações",url:"/configuracoes"},{name:"Histórico de aulas",url:"/aulas"}].map(i=><Link className="flex min-h-14 items-center justify-between border-b border-slate-100 py-3" href={i.url} key={i.name}>{i.name}<ChevronRight size={18}/></Link>)}<form action={teacherLogoutAction}><button className="button secondary mt-6">Sair</button></form></nav></>;}
