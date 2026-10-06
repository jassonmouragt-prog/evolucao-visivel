import { z } from "zod";
import { normalizeCode } from "./security";

const text = (max = 3000) => z.string().trim().max(max, "Texto muito longo.").transform(v => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,""));
const required = (max = 160) => text(max).pipe(z.string().min(1,"Preencha este campo."));
const optional = (schema: z.ZodType<string>) => z.preprocess(v => v === "" || v === undefined ? null : v, schema.nullable());
const email = optional(z.email("Informe um e-mail válido.").max(254));
export const date = z.iso.date("Informe uma data válida.").refine(v=>v >= "1900-01-01" && v <= "2200-12-31","Data fora do intervalo permitido.");
const optionalDate = optional(date);
const amount = z.coerce.number().min(0).max(99999999).refine(v=>Math.abs(v*100-Math.round(v*100))<0.0000001,"Use até duas casas decimais.").transform(v=>v.toFixed(2));
const score = z.coerce.number().int().min(1).max(5);
const image = optional(z.string().max(670000,"Imagem muito grande.").regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/,"Envie uma imagem PNG ou JPG.").refine(value=>{
  const bytes=Buffer.from(value.split(",")[1]??"","base64");
  if(bytes.length>500000)return false;
  if(value.startsWith("data:image/png"))return bytes.length>=24&&bytes.subarray(0,8).toString("hex")==="89504e470d0a1a0a"&&bytes.readUInt32BE(16)>0&&bytes.readUInt32BE(16)<=1200&&bytes.readUInt32BE(20)>0&&bytes.readUInt32BE(20)<=1200;
  return bytes.length>4&&bytes[0]===255&&bytes[1]===216;
},"Imagem inválida. Envie novamente uma imagem otimizada."));
export const codeSchema = z.string().trim().min(4).max(32).transform(normalizeCode).pipe(z.string().regex(/^[A-Z0-9][A-Z0-9-]{3,31}$/,"Código inválido."));
export const accessSchema = z.object({ customerName:required(),customerEmail:email,plan:z.enum(["individual","pro"]),studentLimit:z.coerce.number().int().min(1).max(1000),code:z.preprocess(v=>v===""?null:v,codeSchema.nullable()) });
export const profileSchema = z.object({ name:required(), professionalName:text(160),phone:text(40),email,mainSubject:required(),additionalSubjects:text(300),
  photoUrl:image,logoUrl:image });
export const studentSchema = z.object({name:required(),birthDate:optionalDate,age:z.preprocess(v=>v===""||v===undefined?null:v,z.coerce.number().int().min(1).max(120).nullable()),grade:required(),school:text(160),subject:required(),startDate:date,frequency:text(160),responsibleName:text(160),responsiblePhone:text(40),responsibleEmail:email,mainGoal:text(),difficulties:text(),strengths:text(),notes:text()});
export const lessonSchema = z.object({studentId:z.uuid(),date,startTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/,"Horário inválido."),duration:z.coerce.number().int().min(5).max(480),status:z.enum(["scheduled","completed","absent","cancelled","makeup"]),justifiedAbsence:z.preprocess(v=>v==="on"||v===true,z.boolean()),content:text(),activities:text(),lessonRating:z.enum(["Excelente","Muito boa","Boa","Com dificuldade","Precisou de bastante apoio"]),participation:z.enum(["Alta","Boa","Regular","Baixa"]),achievement:text(),difficulty:text(),homework:text(),nextFocus:text()}).refine(v=> !["completed","makeup"].includes(v.status)||v.content.length>0,{message:"Informe o conteúdo trabalhado.",path:["content"]});
export const packageSchema = z.object({studentId:z.uuid(),totalLessons:z.coerce.number().int().min(1).max(1000),value:amount,startDate:date,renewalDate:optionalDate}).refine(v=>!v.renewalDate||v.renewalDate>=v.startDate,{message:"Renovação deve ocorrer após o início.",path:["renewalDate"]});
export const progressSchema = z.object({studentId:z.uuid(),date,comprehension:score,autonomy:score,participation:score,organization:score,concentration:score,activityCompletion:score,mainImprovement:text(),attentionPoint:text()});
export const goalSchema = z.object({studentId:z.uuid(),title:required(),description:text(),targetDate:optionalDate,progress:score,status:z.enum(["ongoing","achieved","paused"])});
export const paymentSchema = z.object({studentId:z.uuid(),description:required(),amount:amount.refine(v=>Number(v)>0,"Valor deve ser maior que zero."),dueDate:date,paidAt:optionalDate,paymentMethod:text(80),status:z.enum(["paid","pending","overdue"])}).refine(v=>v.status!=="paid"||!!v.paidAt,{message:"Informe a data do pagamento.",path:["paidAt"]}).transform(v=>({...v,paidAt:v.status==="paid"?v.paidAt:null}));
export const periodSchema = z.object({studentId:z.uuid(),periodStart:date,periodEnd:date}).refine(v=>v.periodEnd>=v.periodStart,{message:"Fim do período deve ser após o início.",path:["periodEnd"]});
export const reportSchema = z.object({studentId:z.uuid(),periodStart:date,periodEnd:date,contents:text(12000),improvements:text(12000),attentionPoints:text(12000),participationRating:z.enum(["Excelente","Muito boa","Boa","Regular","Precisa melhorar"]),activitiesRating:z.enum(["Excelente","Muito boa","Boa","Regular","Precisa melhorar"]),generalProgress:z.enum(["Grande evolução","Boa evolução","Evolução gradual","Pouca evolução","Necessita atenção"]),nextGoals:text(12000),teacherMessage:text(12000)}).refine(v=>v.periodEnd>=v.periodStart,{message:"Período inválido.",path:["periodEnd"]});
export const uuidSchema = z.uuid();
