import {test,expect} from "@playwright/test";
import {eq} from "drizzle-orm";
import {database,closeDatabase} from "../../src/db";
import {accessCodes,students,lessons,teacherProfiles,adminUsers,reports,payments,loginAttempts,lessonPackages,sessions} from "../../src/db/schema";
import {today,monthPeriod} from "../../src/lib/format";
import {hashPassword} from "../../src/lib/security";
import {createAccess,changeAccessStatus} from "../../src/lib/admin-service";
import {buildReportDraft,saveReport} from "../../src/lib/report-service";
process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
process.env.SESSION_SECRET="e2e-only-not-a-production-secret-123456";
if(!process.env.DATABASE_URL?.includes("evolucao_test"))throw new Error("Banco isolado obrigatório.");
let a:typeof accessCodes.$inferSelect,b:typeof accessCodes.$inferSelect;
let studentB:typeof students.$inferSelect,lessonB:typeof lessons.$inferSelect,reportB:typeof reports.$inferSelect,paymentB:typeof payments.$inferSelect;
let adminId:string;
const prefix=crypto.randomUUID().slice(0,8);
const adminEmail=`${prefix}@example.test`;
const adminPassword="e2e-password-robusta-12345";
test.beforeAll(async()=>{
  a=await createAccess({customerName:"Priscila",customerEmail:null,plan:"individual",studentLimit:10,code:`A${prefix}`});b=await createAccess({customerName:"Professor B",customerEmail:null,plan:"individual",studentLimit:10,code:`B${prefix}`});
  await database().insert(teacherProfiles).values([{accessCodeId:a.id,name:"Priscila",mainSubject:"Matemática",onboardingCompleted:true},{accessCodeId:b.id,name:"Professor B",mainSubject:"Matemática",onboardingCompleted:true}]);
  [studentB]=await database().insert(students).values({accessCodeId:b.id,name:"Aluno privado de B",grade:"8º ano",subject:"Matemática",startDate:"2026-10-01"}).returning();
  [lessonB]=await database().insert(lessons).values({accessCodeId:b.id,studentId:studentB.id,date:"2026-10-05",startTime:"14:00",duration:60,status:"completed",content:"Conteúdo privado"}).returning();
  [paymentB]=await database().insert(payments).values({accessCodeId:b.id,studentId:studentB.id,description:"Pagamento privado",amount:"100.00",dueDate:"2026-10-01",status:"pending"}).returning();
  const draft=await buildReportDraft(b.id,{studentId:studentB.id,periodStart:"2026-10-01",periodEnd:"2026-10-31"});reportB=await saveReport(b.id,draft);
  const [admin]=await database().insert(adminUsers).values({email:adminEmail,passwordHash:hashPassword(adminPassword)}).returning();adminId=admin.id;
});
test.afterAll(async()=>{await database().delete(accessCodes).where(eq(accessCodes.id,a.id));await database().delete(accessCodes).where(eq(accessCodes.id,b.id));await database().delete(adminUsers).where(eq(adminUsers.id,adminId));await closeDatabase();});
async function login(page:import("@playwright/test").Page,code:string){await page.goto("/acesso");await page.getByLabel("Código de acesso").fill(code);await page.getByRole("button",{name:"Entrar no Evolução Visível"}).click();}
test("código inválido, válido, sessão HttpOnly e bloqueio",async({page,context})=>{
  await login(page,"CODIGO-INVALIDO");await expect(page.locator("form [role=alert]")).toContainText("Código inválido");
  await login(page,a.code);await expect(page).toHaveURL(/dashboard/);await expect(page.getByRole("heading",{name:"Olá, Priscila 👋"})).toBeVisible();
  const cookie=(await context.cookies()).find(c=>c.name==="ev_teacher");expect(cookie?.httpOnly).toBe(true);expect(cookie?.secure).toBe(true);expect(cookie?.sameSite).toBe("Lax");expect(await page.evaluate(()=>document.cookie)).not.toContain("ev_teacher");
  await database().update(sessions).set({expiresAt:new Date(Date.now()-1000)}).where(eq(sessions.accessCodeId,a.id));await page.goto("/dashboard");await expect(page).toHaveURL(/acesso/);await login(page,a.code);await expect(page).toHaveURL(/dashboard/);
  await changeAccessStatus(a.id,"blocked");await page.goto("/dashboard");await expect(page).toHaveURL(/acesso/);await login(page,a.code);await expect(page.locator("form [role=alert]")).toContainText("Código inválido");await changeAccessStatus(a.id,"active");
});
test("alterar IDs não revela aluno, aula, relatório, PDF ou pagamento de B",async({page})=>{
  await login(page,a.code);await expect(page).toHaveURL(/dashboard/);
  for(const path of [`/alunos/${studentB.id}`,`/alunos/${studentB.id}/editar`,`/alunos/${studentB.id}/aulas`,`/alunos/${studentB.id}/evolucao`,`/alunos/${studentB.id}/pacote`,`/alunos/${studentB.id}/financeiro`,`/aulas/${lessonB.id}/editar`,`/relatorios/${reportB.id}`,`/relatorios/${reportB.id}/editar`,`/financeiro/${paymentB.id}/editar`]){await page.goto(path);await expect(page.getByRole("heading",{name:"Página não encontrada"})).toBeVisible();expect(await page.locator("body").innerText()).not.toContain("Aluno privado de B");}
  const pdf=await page.request.get(`/api/relatorios/${reportB.id}/pdf`);expect(pdf.status()).toBe(404);
});
test("fluxo real: cadastrar, pacote, aula, evolução, relatório, PDF e arquivar",async({page})=>{
  await login(page,a.code);await expect(page).toHaveURL(/dashboard/);
  await page.goto("/alunos/novo");await page.getByLabel("Nome completo").fill("João Pedro");await page.getByLabel("Ano / série").fill("8º ano");await page.getByLabel("Disciplina").fill("Matemática");await page.getByLabel("Objetivo principal").fill("Resolver problemas com autonomia");await page.getByRole("button",{name:"Salvar aluno",exact:true}).click();await expect(page).toHaveURL(/\/alunos\/[a-f0-9-]+$/);
  const id=page.url().split("/").at(-1)!;
  await page.getByRole("link",{name:"Pacote",exact:true}).click();await page.getByLabel("Valor do pacote").fill("320");await page.getByRole("button",{name:"Salvar pacote",exact:true}).click();await expect(page.getByRole("heading",{name:"Pacote atual"})).toBeVisible();
  await page.goto(`/aulas/nova?student=${id}`);await page.getByLabel("Conteúdo trabalhado").fill("Equações de primeiro grau");await page.getByLabel("Principal avanço").fill("Resolve exercícios com menos ajuda");await page.getByRole("button",{name:"Salvar aula",exact:true}).click();await expect(page).toHaveURL(/\/aulas\?saved=1/);await expect(page.getByRole("status").first()).toContainText("Aula registrada");
  await page.goto(`/alunos/${id}/pacote`);await expect(page.getByText("7 aulas restantes",{exact:true})).toBeVisible();
  await page.goto(`/alunos/${id}/evolucao`);await page.getByLabel("Compreensão",{exact:true}).selectOption("4");await page.getByLabel("Maior evolução").fill("Mais autonomia");await page.getByRole("button",{name:"Registrar evolução",exact:true}).click();await expect(page.getByRole("status").first()).toContainText("Evolução registrada");
  await page.goto(`/relatorios/novo?student=${id}`);await page.getByRole("button",{name:"Preparar prévia",exact:true}).click();await expect(page.getByLabel("Conteúdos trabalhados")).toHaveValue("Equações de primeiro grau");await page.getByLabel("Mensagem do professor").fill("Seguimos avançando!");await page.getByRole("button",{name:"Salvar relatório",exact:true}).click();await expect(page).toHaveURL(/\/relatorios\/[a-f0-9-]+$/);
  const rid=page.url().split("/").at(-1)!;const response=await page.request.get(`/api/relatorios/${rid}/pdf`);expect(response.status()).toBe(200);expect(response.headers()["content-type"]).toBe("application/pdf");expect((await response.body()).subarray(0,4).toString()).toBe("%PDF");
  const downloadPromise=page.waitForEvent("download");await page.getByRole("link",{name:"Baixar PDF"}).click();const download=await downloadPromise;await download.saveAs(".impeccable/review/report.pdf");
  await page.goto(`/alunos/${id}`);await page.getByText("Gerenciar aluno",{exact:true}).click();await page.getByRole("button",{name:"Arquivar aluno",exact:true}).click();await page.getByRole("button",{name:"Confirmar",exact:true}).click();await expect(page).toHaveURL(/\/alunos$/);await page.goto("/alunos?filter=archived");await expect(page.getByRole("heading",{name:"João Pedro"})).toBeVisible();
});
test("admin login próprio, criar acesso, copiar entrega e bloquear",async({page})=>{
  await page.goto("/admin");await expect(page).toHaveURL(/admin\/login/);await page.getByLabel("E-mail").fill(adminEmail);await page.getByLabel("Senha").fill(adminPassword);await page.getByRole("button",{name:"Entrar",exact:true}).click();await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/acessos/novo");await page.getByLabel("Nome do cliente").fill("Mariana");await page.getByLabel("Código",{exact:true}).selectOption("manual");await page.getByLabel("Código personalizado").fill(`MAR${prefix}`);await page.getByRole("button",{name:"Criar acesso",exact:true}).click();await expect(page.getByRole("heading",{name:"Acesso criado"})).toBeVisible();const id=page.url().split("/").at(-1)!.split("?")[0];
  await page.getByRole("button",{name:"Bloquear acesso",exact:true}).click();await page.getByRole("button",{name:"Confirmar",exact:true}).click();await expect(page.getByRole("status").first()).toContainText("Acesso bloqueado");await database().delete(accessCodes).where(eq(accessCodes.id,id));
});
test("desktop e mobile: rotas, ausência de overflow e capturas",async({page})=>{
  const day=today(),period=monthPeriod();
  for(const [i,name] of ["João Pedro","Maria Clara","Lucas Gabriel"].entries()){
    const [s]=await database().insert(students).values({accessCodeId:a.id,name,grade:"8º ano",subject:i===1?"Português":"Matemática",startDate:period.start}).returning();
    await database().insert(lessonPackages).values({accessCodeId:a.id,studentId:s.id,totalLessons:8,usedLessons:i===0?7:3,value:"320.00",startDate:period.start,renewalDate:period.end});
    await database().insert(lessons).values([{accessCodeId:a.id,studentId:s.id,date:day,startTime:"14:00",duration:60,status:"completed",content:"Equações de primeiro grau",difficulty:i===0?"Problemas contextualizados":""},{accessCodeId:a.id,studentId:s.id,date:period.end,startTime:i===0?"14:00":i===1?"15:30":"17:00",duration:60,status:"scheduled"}]);
  }
  await login(page,a.code);await expect(page).toHaveURL(/dashboard/);
  for(const width of [1440,390]){await page.setViewportSize({width,height:900});for(const path of ["/dashboard","/alunos","/aulas/nova","/relatorios","/financeiro","/mensagens","/perfil","/configuracoes","/mais"]){await page.goto(path);await expect(page.locator("h1")).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`${path} em ${width}px`).toBe(true);}await page.goto("/dashboard");await expect(page.getByRole("heading",{name:"Olá, Priscila 👋"})).toBeVisible();await page.screenshot({path:`.impeccable/review/${width===1440?"desktop":"mobile"}.png`,fullPage:true});await page.goto("/");expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:`.impeccable/review/landing-${width}.png`,fullPage:true});}
});
test("brute force recebe bloqueio distribuído",async({page})=>{await database().delete(loginAttempts);for(let i=0;i<9;i++){await login(page,`INVALID-${prefix}`);await expect(page.locator("form [role=alert]")).toBeVisible();}await expect(page.locator("form [role=alert]")).toContainText("Muitas tentativas");await database().delete(loginAttempts);});
