import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from "pdf-lib";
import type {reports} from "@/db/schema";
import type {ReportSnapshot} from "./report-service";
import {formatDate} from "./format";
import {readFile} from "node:fs/promises";
import {join} from "node:path";

let brandImage:Promise<Buffer>|undefined;
function loadBrandImage(){return brandImage??=readFile(join(process.cwd(),"public","brand","logo-horizontal.png"));}

// Dedicated A4 layout with actual PDF text and explicit pagination; no browser renderer.
export async function createReportPdf(report:typeof reports.$inferSelect,snapshot:ReportSnapshot){
  const pdf=await PDFDocument.create();pdf.setTitle(`Acompanhamento de ${snapshot.studentName}`);pdf.setAuthor(snapshot.teacherName);pdf.setCreator("Evolução Visível");
  const regular=await pdf.embedFont(StandardFonts.Helvetica);const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const brand=await pdf.embedPng(await loadBrandImage());
  const navy=rgb(.098,.208,.294), muted=rgb(.32,.40,.46), blue=rgb(.86,.92,.96);
  let page!:PDFPage;let y=0;
  const clean=(value:string)=>[...value.replace(/\t/g,"  ").replace(/→/g," -> ")].map(c=>{if(c==="\n")return c;try{regular.encodeText(c);return c;}catch{return "";}}).join("");
  const draw=(value:string,x:number,pos:number,size=10,font:PDFFont=regular,color=muted)=>page.drawText(clean(value),{x,y:pos,size,font,color});
  function newPage(){page=pdf.addPage([595.28,841.89]);page.drawRectangle({x:44,y:795,width:508,height:3,color:navy});page.drawImage(brand,{x:44,y:755,width:126,height:28});y=725;}
  function ensure(height:number){if(y-height<66)newPage();}
  function wrap(text:string,font:PDFFont,size:number,maxWidth:number){const lines:string[]=[];for(const paragraph of clean(text).split("\n")){let line="";for(const word of paragraph.split(/\s+/)){const proposed=line?line+" "+word:word;if(font.widthOfTextAtSize(proposed,size)>maxWidth){if(line)lines.push(line);line="";if(font.widthOfTextAtSize(word,size)>maxWidth){let chunk="";for(const c of word){if(font.widthOfTextAtSize(chunk+c,size)>maxWidth){lines.push(chunk);chunk="";}chunk+=c;}line=chunk;}else line=word;}else line=proposed;}lines.push(line);}return lines;}
  function section(title:string,value:string){const lines=wrap(value||"Não registrado.",regular,10.5,500);const height=48+lines.length*16;ensure(height<=650?height:65);y-=15;draw(title,44,y,12,bold,navy);y-=8;page.drawLine({start:{x:44,y},end:{x:551,y},thickness:.5,color:blue});y-=20;for(const line of lines){ensure(16);draw(line,44,y,10.5);y-=16;}y-=5;}
  newPage();draw("Relatório de Acompanhamento",44,y,23,bold,navy);y-=27;draw(`${formatDate(report.periodStart)} a ${formatDate(report.periodEnd)}`,44,y,11);y-=35;
  if(snapshot.logoUrl?.startsWith("data:image/")){const match=snapshot.logoUrl.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/);if(match){const bytes=Buffer.from(match[2],"base64");if(bytes.length<=500000){try{const logo=match[1]==="png"?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);const scale=Math.min(70/logo.width,40/logo.height);page.drawImage(logo,{x:480,y:720,width:logo.width*scale,height:logo.height*scale});}catch{/* A malformed optional logo does not invalidate a report. */}}}}
  const studentLines=wrap(snapshot.studentName,bold,12,475);
  const teacherLines=wrap(snapshot.professionalName||snapshot.teacherName,regular,11,475);
  const subjectLines=wrap(snapshot.subject,regular,11,475);
  const metadataHeight=65+(studentLines.length+teacherLines.length+subjectLines.length)*17;
  page.drawRectangle({x:44,y:y-metadataHeight+16,width:507,height:metadataHeight,color:rgb(.95,.97,.98)});
  for(const group of [{label:"ALUNO",lines:studentLines,font:bold,size:12},{label:"PROFESSOR",lines:teacherLines,font:regular,size:11},{label:"DISCIPLINA",lines:subjectLines,font:regular,size:11}]){
    draw(group.label,58,y,8,bold);y-=18;
    for(const line of group.lines){draw(line,58,y,group.size,group.font,navy);y-=17;}
    y-=4;
  }
  y-=18;
  section("Aulas e presença",snapshot.attendance.replace(/\b1 aulas realizadas\b/g,"1 aula realizada").replace(/\b1 faltas\b/g,"1 falta").replace(/\(1 justificadas\)/g,"(1 justificada)"));
  section("Conteúdos trabalhados",report.contents);section("Principais avanços",report.improvements);section("Pontos de atenção",report.attentionPoints);
  section("Participação e atividades",`Participação: ${report.participationRating}\nRealização das atividades: ${report.activitiesRating}`);
  section("Evolução",`${report.generalProgress}\n${snapshot.progress}`);section("Objetivos acompanhados",snapshot.goals);section("Próximos objetivos",report.nextGoals);section("Mensagem do professor",report.teacherMessage);
  if(snapshot.phone||snapshot.email)section("Contato",[snapshot.phone,snapshot.email].filter(Boolean).join(" · "));
  const pages=pdf.getPages();pages.forEach((p,i)=>{p.drawLine({start:{x:44,y:48},end:{x:551,y:48},thickness:.5,color:blue});p.drawText("Relatório gerado através do Evolução Visível.",{x:44,y:32,size:8,font:regular,color:muted});p.drawText(`${i+1} / ${pages.length}`,{x:515,y:32,size:8,font:regular,color:muted});});
  return pdf.save();
}
