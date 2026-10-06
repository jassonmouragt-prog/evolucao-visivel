import {requireResponsible} from "@/lib/responsible-auth";
export default async function PortalInfo(){
  const ctx=await requireResponsible();
  const s=ctx.settings;
  const sections=[{label:"Regras de pagamento",value:s.rulesPayment},{label:"Política de reposição",value:s.rulesReplacement},{label:"Cancelamento",value:s.rulesCancellation},{label:"Horários",value:s.schedules},{label:"Materiais",value:s.materials},{label:"Outras informações",value:s.otherInfo}].filter(x=>x.value.trim());
  const digits=(ctx.teacher?.phone??"").replace(/\D/g,"");
  const whatsapp=digits.length>=10?`https://wa.me/${digits.startsWith("55")?digits:`55${digits}`}`:null;
  return <>
    {sections.length?<section className="panel"><h2>Informações do professor</h2><div className="mt-5 space-y-6">{sections.map(x=><div key={x.label}><p className="muted text-sm">{x.label}</p><p className="prose-value mt-1">{x.value}</p></div>)}</div></section>:<section className="panel"><h2>Informações do professor</h2><p className="muted mt-3 text-sm">O professor ainda não cadastrou informações para o portal.</p></section>}
    <section className="panel"><h2>Ainda ficou com alguma dúvida?</h2>{whatsapp?<a className="button mt-4" href={whatsapp} target="_blank" rel="noopener">Falar com o professor</a>:<p className="muted mt-3 text-sm">Fale com o professor pelos canais combinados.</p>}</section>
  </>;
}
