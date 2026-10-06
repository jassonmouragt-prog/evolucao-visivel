import {formatDate} from "./format";
export function reportMessage(data:{responsible:string;student:string;start:string;end:string;improvement:string;goal:string}){return `Olá, ${data.responsible||"responsável"}! Tudo bem?\n\nEstou enviando o acompanhamento de ${data.student} referente a ${formatDate(data.start)} a ${formatDate(data.end)}.\n\nTivemos avanços importantes principalmente em ${data.improvement||"nos conteúdos acompanhados durante as aulas"}.\n\nNo próximo período nosso foco será ${data.goal||"dar continuidade aos objetivos de aprendizagem"}.\n\nEstou enviando o relatório completo abaixo.`;}
export const messageTemplates=[
  {title:"Relatório mensal",text:"Olá, {responsável}! Tudo bem?\n\nEstou enviando o acompanhamento de {aluno} referente a {período}. Tivemos avanços em {avanço}. No próximo período, nosso foco será {objetivo}. Segue o relatório completo."},
  {title:"Boa evolução",text:"Olá, {responsável}! Quero compartilhar um avanço de {aluno}: {avanço}. É muito bom acompanhar essa conquista! Vamos continuar trabalhando com esse foco nas próximas aulas."},
  {title:"Dificuldade observada",text:"Olá, {responsável}! Nas últimas aulas, observei que {aluno} precisa de um pouco mais de apoio em {dificuldade}. Já estamos trabalhando esse ponto. Nosso próximo foco será {objetivo}."},
  {title:"Falta",text:"Olá, {responsável}! Senti a falta de {aluno} na aula de {data}. Está tudo bem? Podemos conversar para organizar os próximos encontros."},
  {title:"Lembrete de aula",text:"Olá, {responsável}! Passando para lembrar da aula de {aluno} em {data}, às {horário}. Até lá!"},
  {title:"Pacote terminando",text:"Olá, {responsável}! O pacote de {aluno} está chegando ao fim: restam {aulas} aulas. Vamos combinar a continuidade do acompanhamento?"},
  {title:"Renovação",text:"Olá, {responsável}! Vamos renovar o pacote de {aluno}? O novo pacote inclui {aulas} aulas, no valor de {valor}. Assim, damos continuidade ao trabalho em {objetivo}."},
  {title:"Pagamento pendente",text:"Olá, {responsável}! Tudo bem? Estou conferindo os registros e o pagamento de {descrição}, referente a {aluno}, no valor de {valor}, com vencimento em {data}, aparece pendente. Se já foi realizado, pode me avisar? Obrigado!"},
  {title:"Boas-vindas",text:"Olá, {responsável}! Seja bem-vindo ao acompanhamento de {aluno}. Vamos trabalhar juntos em {objetivo}. Ao longo das aulas, compartilharei os avanços e os pontos que merecem atenção. Conte comigo!"}
];
