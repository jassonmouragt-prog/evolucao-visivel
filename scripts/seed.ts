import nextEnv from "@next/env";
import {eq} from "drizzle-orm";
import {database,closeDatabase} from "../src/db";
import {accessCodes,teacherProfiles,students,lessons,lessonPackages,progressEntries,payments,studentGoals} from "../src/db/schema";
import {saveReport,buildReportDraft} from "../src/lib/report-service";
import {today,monthPeriod} from "../src/lib/format";
nextEnv.loadEnvConfig(process.cwd(),true);
if(process.env.NODE_ENV==="production"||process.env.VERCEL)throw new Error("Seed fictício proibido em produção.");
if(!process.env.DATABASE_URL?.includes("localhost")&&!process.env.DATABASE_URL?.includes("127.0.0.1"))throw new Error("Seed permitido apenas em banco local de desenvolvimento.");
try{
  const [existing]=await database().select().from(accessCodes).where(eq(accessCodes.code,"PRI10-42M"));
  if(existing){process.stdout.write("Seed já existe; dados preservados.\n");}
  else{
    const day=today();const period=monthPeriod();const [access]=await database().insert(accessCodes).values({code:"PRI10-42M",customerName:"Priscila",customerEmail:"priscila@example.test"}).returning();
    await database().insert(teacherProfiles).values({accessCodeId:access.id,name:"Priscila",professionalName:"Priscila · Acompanhamento particular",mainSubject:"Matemática",phone:"(11) 90000-0000",onboardingCompleted:true});
    for(const [i,name] of ["João Pedro","Maria Clara","Lucas Gabriel"].entries()){
      const [s]=await database().insert(students).values({accessCodeId:access.id,name,grade:i===0?"8º ano":i===1?"6º ano":"7º ano",subject:i===1?"Português":"Matemática",startDate:period.start,frequency:"2 vezes por semana",responsibleName:i===0?"Ana Paula":i===1?"Carolina":"Renata",mainGoal:i===1?"Melhorar interpretação de textos":"Resolver problemas com autonomia",difficulties:i===1?"Compreensão de enunciados":"Problemas contextualizados",strengths:"Curiosidade e boa participação"}).returning();
      const [pkg]=await database().insert(lessonPackages).values({accessCodeId:access.id,studentId:s.id,totalLessons:8,usedLessons:i===0?7:3,value:"320.00",startDate:period.start,renewalDate:period.end}).returning();
      for(let j=0;j<pkg.usedLessons;j++)await database().insert(lessons).values({accessCodeId:access.id,studentId:s.id,packageId:pkg.id,date:day,startTime:"14:00",duration:60,status:"completed",content:i===1?"Interpretação de textos":"Equações de primeiro grau",activities:"Leitura orientada e exercícios práticos",participation:"Boa",achievement:j===pkg.usedLessons-1?"Conseguiu resolver exercícios com menos ajuda.":"Mais confiança para explicar o raciocínio.",difficulty:"Problemas contextualizados",nextFocus:"Aprimorar a interpretação dos enunciados"});
      await database().insert(lessons).values({accessCodeId:access.id,studentId:s.id,date:period.end,startTime:i===0?"14:00":i===1?"15:30":"17:00",duration:60,status:"scheduled",content:"Próximo encontro"});
      await database().insert(progressEntries).values([{accessCodeId:access.id,studentId:s.id,date:period.start,comprehension:2,autonomy:2,participation:3,organization:3,concentration:2,activityCompletion:3},{accessCodeId:access.id,studentId:s.id,date:day,comprehension:4,autonomy:3,participation:4,organization:4,concentration:3,activityCompletion:4,mainImprovement:"Resolve atividades com menos ajuda",attentionPoint:"Interpretação de problemas"}]);
      await database().insert(studentGoals).values({accessCodeId:access.id,studentId:s.id,title:"Melhorar interpretação de problemas",progress:3,status:"ongoing"});
      await database().insert(payments).values({accessCodeId:access.id,studentId:s.id,description:"Pacote do mês",amount:"320.00",dueDate:period.start,status:i===2?"pending":"paid",paidAt:i===2?null:day,paymentMethod:"Pix"});
      if(i===1){const draft=await buildReportDraft(access.id,{studentId:s.id,periodStart:period.start,periodEnd:period.end});await saveReport(access.id,{...draft,teacherMessage:"É muito bom acompanhar esse progresso. Seguimos construindo autonomia, uma aula de cada vez."});}
    }
    process.stdout.write("Seed de desenvolvimento criado. Código: PRI10-42M\n");
  }
}finally{await closeDatabase();}
