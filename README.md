# Evolução Visível

Sistema individual de acompanhamento para professores particulares. Next.js App Router, React, TypeScript strict, Tailwind, PostgreSQL, Drizzle, Zod e PDF no servidor. Preparado para Vercel com PostgreSQL externo.

## Publicação

- **Sistema público:** https://evolucao-visivel.vercel.app
- **Entrada por código:** https://evolucao-visivel.vercel.app/acesso
- **Administração:** https://evolucao-visivel.vercel.app/admin/login
- **Repositório público:** https://github.com/jassonmouragt-prog/evolucao-visivel

Projeto Vercel: `jason-3c4d/evolucao-visivel`, conectado à branch `main` do GitHub. PostgreSQL Neon no plano Free, região São Paulo (`gru1`), conectado ao ambiente Production. Migrations aplicadas. O banco de produção começou vazio, sem o seed de desenvolvimento.

O administrador será configurado depois, conforme escolha do proprietário. Até criá-lo e cadastrar compradores, nenhum código de desenvolvimento libera acesso em produção. O segredo de sessão está configurado como variável privada na Vercel.

### Criar o administrador no banco publicado

Na máquina autorizada, com o projeto Vercel vinculado:

```powershell
vercel env pull .env.production.local --environment production --yes --scope jason-3c4d
$env:ADMIN_EMAIL='seu-email@exemplo.com'
$env:ADMIN_PASSWORD='use-uma-senha-longa-e-exclusiva'
node --env-file=.env.production.local --import tsx scripts/create-admin.ts
```

Esse arquivo de ambiente é privado e ignorado pelo Git e pelo upload do deploy. Nunca o publique ou use o seed contra o banco de produção. Remova as variáveis de administrador do terminal após o comando.

## Rodar localmente

Requisitos: Node.js 22 ou 24, npm e PostgreSQL 17. O Docker Compose fornece somente o banco de desenvolvimento, com limite de 256 MB.

```powershell
npm ci
docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev
```

Abra `http://localhost:3000`. Acesse `/acesso` com **PRI10-42M** para ver o seed fictício de Priscila. O seed só funciona em banco local e recusa produção/Vercel. Não roda automaticamente no build ou deploy.

Para um checkout novo, crie `.env.local` com base em `.env.example` e gere um segredo:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Coloque o resultado em `SESSION_SECRET`. O arquivo local fornecido nesta implementação contém apenas configuração de desenvolvimento e está ignorado pelo Git.

## Criar o administrador

Não existe conta administrativa padrão. Configure temporariamente as variáveis abaixo e execute o comando contra o banco desejado:

```powershell
$env:ADMIN_EMAIL='seu-email@exemplo.com'
$env:ADMIN_PASSWORD='use-uma-senha-longa-e-exclusiva'
npm run admin:create
```

A senha deve possuir pelo menos 14 caracteres e é armazenada com scrypt e salt aleatório. Remova essas variáveis do terminal depois de criar a conta. O comando rejeita e-mails duplicados, sem sobrescrever administradores.

Entre em `/admin/login`. Em **Novo acesso**, escolha código automático ou manual. O gerador permite pré-visualizar e gerar outro. Ao salvar, a página de entrega mostra o código e a mensagem editável. Bloquear ou trocar o código encerra as sessões daquele comprador.

## Funcionalidades

- Código individual normalizado e único, sessão HttpOnly e administração separada.
- Onboarding, perfil, foto e logo otimizados antes de salvar.
- Dashboard com agenda, indicadores, atenção e atividade recente.
- Alunos, busca, filtros, edição, pacote inicial, arquivamento e exclusão confirmada.
- Aulas agendadas ou registradas, faltas justificadas, reposições, edição e exclusão.
- Pacotes com saldo transacional, histórico e renovação.
- Evolução manual de 1 a 5, histórico e objetivos editáveis.
- Relatórios com prévia editável, dados do período, snapshots e PDF A4 paginado.
- Mensagens personalizáveis e cópia para envio manual.
- Financeiro simples por aluno, recebido no mês, pendências e atrasos.
- Sidebar desktop e navegação inferior mobile com registro de aula destacado.

### Regras importantes

- Individual: **10 alunos ativos**. Arquivados não contam. Cadastros e reativações concorrentes são serializados no banco para preservar o limite.
- Aulas **realizadas** e **reposições realizadas** consomem uma aula do pacote. Agendamentos, faltas e cancelamentos não consomem. Aulas avulsas são permitidas quando não há pacote.
- Pacote esgotado: renove antes de registrar nova aula realizada.
- Editar/excluir uma aula ajusta o pacote ao qual ela foi vinculada, inclusive um pacote encerrado. A renovação preserva o histórico anterior.
- Frequência mensal compara realizadas/reposições com realizadas/reposições/faltas; agendadas e canceladas ficam fora do denominador.
- Notas de evolução, participação, realização das atividades e evolução geral são decisões do professor. O relatório sugere textos a partir dos registros; as avaliações precisam ser revisadas.
- Relatórios aceitam períodos de até um ano. O PDF usa um layout próprio, com texto selecionável e paginação; não é impressão de HTML.
- Logo e foto são enviados como PNG/JPG otimizados, armazenados privadamente no perfil. O servidor não busca URLs remotas para gerar o PDF.
- Datas de rotina usam o fuso `America/Sao_Paulo`. Valores são armazenados em decimal, sem soma financeira em ponto flutuante.

## Vercel + PostgreSQL

1. Crie um PostgreSQL externo com TLS e backups. Use a URL de conexão/pooler recomendada pelo provedor em `DATABASE_URL`.
2. Importe o projeto na Vercel. Framework: Next.js. Instalação: `npm ci`. Build: `npm run build`. Node: 22 ou 24.
3. Configure as variáveis de produção:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL com TLS; nunca `NEXT_PUBLIC_` |
| `SESSION_SECRET` | Segredo aleatório exclusivo de produção, mínimo de 32 caracteres |
| `APP_URL` | Domínio HTTPS definitivo, sem barra final |
| `PURCHASE_URL` | Link externo da venda manual; usado nos CTAs da landing |
| `PRO_URL` | Link de contato/informações do plano PRO, opcional |

4. Aplique migrations **antes de liberar o acesso**, em um terminal com a URL do banco de produção:

```powershell
$env:DATABASE_URL='URL-POSTGRESQL-DE-PRODUCAO'
npm run db:migrate
```

5. Crie o primeiro administrador com `admin:create` contra esse banco e publique na Vercel. Não execute seed em produção.

O build não executa migrations ou seed. As migrations SQL estão versionadas em `drizzle/` e são reproduzíveis. Para alterações futuras: modifique `src/db/schema.ts`, execute `npm run db:generate`, revise o SQL e aplique `db:migrate`.

Na Vercel, o rate limit usa o header de IP fornecido pela plataforma. Fora dela, mantenha `TRUST_PROXY=false` a menos que exista um proxy confiável que sobrescreva `x-forwarded-for`. Os contadores ficam no PostgreSQL e funcionam entre instâncias serverless. Depois de repetidas tentativas, há atraso progressivo e bloqueio por 15 minutos.

Cookies são Secure em produção, HttpOnly e SameSite=Lax. Tokens de sessão são aleatórios e só seu hash HMAC fica no banco. Sessões expiram em 14 dias, e o status do comprador é verificado em cada acesso protegido. Trocar o segredo invalida sessões anteriores.

Sem `PURCHASE_URL`, a landing orienta o visitante a procurar o vendedor e permite acessar com um código existente. Nenhum pagamento ou gateway é simulado.

## Testes e validação

Execute sequencialmente para reduzir consumo de RAM:

```powershell
npm run typecheck
npm run lint
npm test
```

Integração e navegador usam **somente** um banco isolado com nome `evolucao_test`. Os scripts recusam execução contra outra URL. Crie o banco uma vez:

```powershell
docker compose exec -T db createdb -U postgres evolucao_test
$env:DATABASE_URL='postgres://postgres:development-only@localhost:55432/evolucao_test'
npm run db:migrate
$env:TEST_DATABASE_URL=$env:DATABASE_URL
Remove-Item Env:DATABASE_URL
npm run test:integration
npm run build
npx playwright install chromium
npm run test:e2e
```

Não mantenha `npm run dev` ativo durante o build ou os testes de navegador. Playwright usa um único worker e inicia/encerra o servidor de produção temporário.

Cobertura: código válido/inválido/bloqueado, sessão HttpOnly/Secure, rate limit, cadastro, limite concorrente, arquivamento, tenancy de leitura/edição/exclusão, foreign key cruzada, pacote, presença, evolução, objetivos, relatório, PDF paginado, financeiro, administrador e fluxo completo no navegador. As rotas de aluno/aula/relatório/pagamento e o endpoint PDF são testados com IDs de outro professor.

Capturas de revisão desktop/mobile ficam em `.impeccable/review/`, sem dados reais. `npm audit --omit=dev` verificou as dependências usadas em produção sem vulnerabilidades conhecidas na entrega.

## Estrutura

```text
src/app/                 Rotas, layouts, Server Actions e endpoint PDF
src/components/          Formulários, navegação e componentes acessíveis
src/db/                  Schema e conexão PostgreSQL
src/lib/                 Autenticação, validações e serviços de domínio
drizzle/                 Migrations SQL
scripts/                 Migration, administrador e seed de desenvolvimento
tests/                   Testes unitários, PostgreSQL e Playwright
PRODUCT.md               Contexto confirmado do produto
DESIGN.md                Identidade implementada
SESSION-PROGRESS.md       Registro de execução e validações
```

Para encerrar o banco local sem apagar dados: `docker compose stop db`. Para retomá-lo: `docker compose up -d db`.
