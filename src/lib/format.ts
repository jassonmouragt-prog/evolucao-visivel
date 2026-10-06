export function formatDate(value:Date|string|null|undefined) {if(!value)return "—";const d=typeof value==="string"?new Date(value.length===10?`${value}T12:00:00`:value):value;return new Intl.DateTimeFormat("pt-BR").format(d);}
export function money(value:string|number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(value));}
export function today(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}
export function monthPeriod(){const day=today();return {start:day.slice(0,8)+"01",end:day.slice(0,8)+String(new Date(Number(day.slice(0,4)),Number(day.slice(5,7)),0).getDate())};}
export const lessonStatuses=[{value:"completed",label:"Realizada"},{value:"scheduled",label:"Agendada"},{value:"absent",label:"Falta"},{value:"cancelled",label:"Cancelada"},{value:"makeup",label:"Reposição realizada"}];
export function lessonStatus(status:string){return lessonStatuses.find(v=>v.value===status)?.label??status;}
