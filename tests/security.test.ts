import { test } from "node:test";
import assert from "node:assert/strict";
import { generateCode,normalizeCode,hashPassword,verifyPassword,newToken,tokenHash } from "../src/lib/security";
import { codeSchema,progressSchema,packageSchema,paymentSchema } from "../src/lib/validation";
process.env.SESSION_SECRET="unit-tests-only-not-a-production-secret";
test("códigos normalizados e geração personalizada",()=>{assert.equal(normalizeCode("Prí1025"),"PRI1025");assert.match(generateCode("Príscila",new Date(2026,9,1)),/^PRI10-\d{2}[A-Z]$/);assert.equal(codeSchema.parse(" pri10-42m "),"PRI10-42M");assert.equal(codeSchema.safeParse("").success,false);});
test("senha e tokens seguros",()=>{const hash=hashPassword("senha-robusta-de-teste");assert.ok(verifyPassword("senha-robusta-de-teste",hash));assert.ok(!verifyPassword("errada",hash));const token=newToken();assert.notEqual(tokenHash(token),token);assert.notEqual(newToken(),token);});
test("validação rejeita valores de evolução e pacotes impossíveis",()=>{assert.equal(progressSchema.safeParse({studentId:crypto.randomUUID(),date:"2026-10-01",comprehension:6,autonomy:1,participation:1,organization:1,concentration:1,activityCompletion:1,mainImprovement:"",attentionPoint:""}).success,false);assert.equal(packageSchema.safeParse({studentId:crypto.randomUUID(),totalLessons:0,value:100,startDate:"2026-10-01",renewalDate:null}).success,false);});
test("valores monetários não arredondam silenciosamente centavos",()=>{const data={studentId:crypto.randomUUID(),description:"Aula",amount:1.99995,dueDate:"2026-10-01",paidAt:null,paymentMethod:"Pix",status:"pending"};assert.equal(paymentSchema.safeParse(data).success,false);assert.equal(paymentSchema.safeParse({...data,amount:0.29}).success,true);});
