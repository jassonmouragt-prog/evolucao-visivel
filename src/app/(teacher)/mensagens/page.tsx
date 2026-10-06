import {PageHead} from "@/components/ui";
import {EditableMessage} from "@/components/copy";
import {messageTemplates} from "@/lib/messages";
export default function MessagesPage(){return <><PageHead title="Mensagens" description="Um ponto de partida para conversar com os responsáveis. Substitua os campos entre chaves e ajuste ao seu jeito."/><div className="grid items-start gap-5 lg:grid-cols-2">{messageTemplates.map(m=><section className="panel" key={m.title}><h2 className="mb-5">{m.title}</h2><EditableMessage label="Personalizar mensagem" text={m.text}/></section>)}</div></>;}
