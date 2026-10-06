import { Brand } from "@/components/ui";
import { ActionForm,Field } from "@/components/action-form";
import { adminLoginAction } from "@/app/actions";
export default function AdminLogin(){return <main className="flex min-h-screen flex-col items-center justify-center gap-9 p-5"><Brand/><section className="panel w-full max-w-md"><h1 className="mb-7 text-2xl">Administração</h1><ActionForm action={adminLoginAction} submit="Entrar"><Field name="email" label="E-mail" type="email" required/><Field name="password" label="Senha" type="password" required/></ActionForm></section></main>;}
