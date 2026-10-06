"use client";
import { createContext, useActionState, useContext, useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import {ImageField} from "./image-field";
import {useRouter} from "next/navigation";
export type ActionState = { error?:string; success?:string; fields?:Record<string,string>; values?:Record<string,string>; redirectTo?:string };
export type FormAction = (state:ActionState, form:FormData)=>Promise<ActionState>;
const FormErrors=createContext<Record<string,string>>({});
export function ActionForm({action,children,submit="Salvar",className="",confirm}:{action:FormAction;children:React.ReactNode;submit?:string;className?:string;confirm?:string}) {
  const router=useRouter();
  const [state,dispatch,pending]=useActionState(async (previous:ActionState,form:FormData)=>{const result=await action(previous,form);return result.error?{...result,values:Object.fromEntries([...form.entries()].filter((entry):entry is [string,string]=>typeof entry[1]==="string"))}:result;},{});
  const formRef=useRef<HTMLFormElement>(null);
  useEffect(()=>{if(state.error&&state.values&&formRef.current){for(const [key,value] of Object.entries(state.values)){const element=formRef.current.elements.namedItem(key);if(element instanceof HTMLInputElement&&element.type!=="file"){if(element.type==="checkbox")element.checked=value==="on";else element.value=value;}else if(element instanceof HTMLTextAreaElement||element instanceof HTMLSelectElement)element.value=value;}}},[state]);
  const [toast,setToast]=useState(false);
  useEffect(()=>{if(state.redirectTo)router.replace(state.redirectTo);},[state.redirectTo,router]);
  useEffect(()=>{if(state.success){const a=setTimeout(()=>setToast(true),0);const b=setTimeout(()=>setToast(false),5000);return()=>{clearTimeout(a);clearTimeout(b);};}},[state]);
  const [open,setOpen]=useState(false);
  return <><form ref={formRef} action={dispatch} className={className} onSubmit={e=>{if(confirm&&!open){e.preventDefault();setOpen(true);}}}>
    <FormErrors value={state.fields??{}}><fieldset disabled={pending} className="min-w-0 space-y-5">{children}</fieldset></FormErrors>
    {state.error&&<div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{state.error}</p>{state.fields&&<ul className="mt-2 list-inside list-disc">{Object.entries(state.fields).map(([key,message])=><li key={key}>{message}</li>)}</ul>}</div>}
    {state.success&&<p role="status" className="mt-4 text-sm text-green-800">{state.success}</p>}
    <button type="submit" disabled={pending} className="button mt-6">{pending?<><LoaderCircle size={16} className="animate-spin"/>Salvando…</>:submit}</button>
    {confirm&&open&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-5" onKeyDown={e=>{if(e.key==="Escape")setOpen(false);if(e.key==="Tab"){const buttons=e.currentTarget.querySelectorAll<HTMLButtonElement>("button");const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}><div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="panel max-w-md"><h2 id="confirm-title">Confirmar ação</h2><p className="muted mt-3">{confirm}</p><div className="mt-6 flex gap-3"><button autoFocus type="button" className="button secondary" onClick={()=>setOpen(false)}>Cancelar</button><button type="submit" className="button" disabled={pending} onClick={()=>setTimeout(()=>setOpen(false),0)}>Confirmar</button></div></div></div>}
  </form>{toast&&<div role="status" className="fixed bottom-24 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl bg-navy px-5 py-4 text-white shadow-lg"><Check size={18}/>{state.success}<button aria-label="Fechar aviso" onClick={()=>setToast(false)}><X size={16}/></button></div>}</>;
}
export type FieldSpec={name:string;label:string;type?:string;required?:boolean;options?:readonly string[]|readonly {value:string;label:string}[];value?:string|number|null;placeholder?:string;min?:number;max?:number;step?:string};
export function Field({name,label,type="text",required,options,value,placeholder,min,max,step}:FieldSpec) {
  const errors=useContext(FormErrors);
  const feedback=errors[name];
  if(type==="image")return <ImageField name={name} label={label} value={typeof value==="string"?value:undefined}/>;
  if(type==="hidden")return <input type="hidden" name={name} value={value??""}/>;
  if(type==="checkbox")return <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name={name} defaultChecked={value==="true"} className="h-5 w-5 accent-navy"/>{label}</label>;
  const aria={"aria-invalid":!!feedback,"aria-describedby":feedback?`${name}-error`:undefined};
  return <div className="field"><label htmlFor={name}>{label}{required&&<span className="ml-1" aria-hidden="true">*</span>}</label>{options?<select {...aria} id={name} name={name} defaultValue={value??""} required={required}>{options.map(o=>{const v=typeof o==="string"?o:o.value;return <option key={v} value={v}>{typeof o==="string"?o:o.label}</option>;})}</select>:type==="textarea"?<textarea {...aria} id={name} name={name} defaultValue={value??""} placeholder={placeholder} maxLength={12000} required={required}/>:<input {...aria} id={name} name={name} type={type} defaultValue={value??""} placeholder={placeholder} min={min} max={max} step={step} required={required} maxLength={type==="password"?256:3000}/> }{feedback&&<p id={`${name}-error`} className="text-xs text-red-800">{feedback}</p>}</div>;
}
export function Fields({fields}:{fields:FieldSpec[]}) { return <div className="grid gap-5 md:grid-cols-2">{fields.map(field=><div key={field.name} className={field.type==="textarea"?"md:col-span-2":""}><Field {...field}/></div>)}</div>; }
