---
name: Evolução Visível
description: Acompanhe cada aula. Registre cada avanço. Mostre a evolução.
colors:
  navy: "#19354b"
  blue: "#315f83"
  cream: "#f7f8f5"
  white: "white"
  muted: "#5e7180"
  panel-border: "#e0e6e8"
  field-border: "#cbd7df"
  secondary-border: "#dce3e7"
  button-hover: "#2b506c"
  secondary-hover: "#eef4f8"
  focus: "#5883a3"
  label: "#2b4559"
  placeholder: "#627785"
  nav-text: "#d7e2ea"
  nav-active: "#304d64"
  badge-bg: "#eaf1f6"
  badge-text: "#315b78"
  success-bg: "#eaf4ed"
  success-text: "#376b4c"
  warning-bg: "#fbf1df"
  warning-text: "#825e22"
  danger-bg: "#f9eaea"
  danger-text: "#9e4444"
  danger-button-text: "#a33535"
  danger-button-border: "#edcaca"
typography:
  headline:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "clamp(26px, 3vw, 34px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontSize: "20px"
    fontWeight: 650
    letterSpacing: "-.015em"
  subtitle:
    fontSize: "17px"
    fontWeight: 650
  body:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "15px"
  paragraph:
    lineHeight: 1.65
  label:
    fontSize: "13px"
    fontWeight: 600
  button:
    fontSize: "14px"
    fontWeight: 600
rounded:
  field: "9px"
  button: "10px"
  avatar: "12px"
  panel: "16px"
  badge: "6px"
  tab: "8px"
spacing:
  field-gap: "7px"
  button-gap: "8px"
  nav-gap: "12px"
  head-gap: "20px"
  panel-padding: "24px"
  panel-padding-mobile: "18px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: "{rounded.button}"
    padding: "10px 18px"
  button-danger:
    backgroundColor: "{colors.white}"
    textColor: "{colors.danger-button-text}"
    rounded: "{rounded.button}"
    padding: "10px 18px"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
  panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "24px"
  badge:
    backgroundColor: "{colors.badge-bg}"
    textColor: "{colors.badge-text}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  nav-link:
    textColor: "{colors.nav-text}"
    rounded: "{rounded.field}"
    padding: "12px 16px"
  mobile-nav:
    backgroundColor: "{colors.white}"
---

# Design System: Evolução Visível

## Overview

**Creative North Star: "Caderno profissional de acompanhamento"**

A identidade é profissional, amigável e discreta: marinho estrutura a navegação e as ações, enquanto o fundo off-white e os painéis brancos tornam o conteúdo fácil de percorrer. A tipografia de trabalho e os detalhes suaves preservam a clareza sem estética infantil ou densidade de ERP.

Esta documentação extrai a implementação de `src/app/globals.css`, `src/components/navigation.tsx` e `src/components/ui.tsx`, com contexto de `PRODUCT.md` e `.impeccable/surface.md`. O modo Operate pertence ao brief da superfície. A revisão de quatro capturas foi registrada pela revisão independente como **SHIP no escopo visual**, com detector `[]`; não houve nova inspeção de capturas nesta documentação. Estados descritos abaixo são evidência de código, não comprovação de revisão visual desses estados.

**Key Characteristics:**
- Marinho estrutural, azul de apoio e superfícies claras.
- Tipografia de sistema, hierarquia compacta e numerais tabulares.
- Bordas suaves, cantos arredondados e sombras discretas.
- Sidebar no desktop e navegação inferior fixa no mobile.

## Colors

### Primary
- **Marinho (`navy`):** texto principal, sidebar, marca e ações primárias.

### Secondary
- **Azul (`blue`):** apoio visual, ícone do estado vazio e cursor de texto.

### Neutral
- **Off-white (`cream`):** fundo global, separando os painéis do plano da página.
- **Branco (`white`):** painéis, campos, botões secundários e navegação mobile; texto sobre marinho.
- **Texto secundário (`muted`):** descrições e informações de apoio.
- Bordas de painéis, campos e ações secundárias usam seus valores próprios do frontmatter; não são uma escala intercambiável.

Badges têm pares próprios de fundo e texto para padrão, sucesso, atenção e perigo. As cores de perigo do botão são distintas das do badge. Hover, foco e navegação ativa também têm valores observados próprios, sem uma rampa tonal adicional.

## Typography

A família compartilhada é `"Segoe UI", system-ui, sans-serif`, sem fonte externa. É a tipografia de trabalho da interface Operate; não se estabelece aqui uma nova família editorial ou display.

- **Título de página:** `headline`, aplicado ao h1; tamanho fluido, peso 650 e entrelinha compacta.
- **Título de seção:** `title`, aplicado ao h2; subtítulos usam `subtitle`, aplicado ao h3.
- **Corpo:** `body`; parágrafos usam a entrelinha de `paragraph`.
- **Labels:** `label`; ações usam `button`. A navegação desktop tem 14px, badges 12px e labels da navegação mobile 11px.
- Indicadores com a classe `stat` usam `font-variant-numeric: tabular-nums`.
- Títulos h1–h3 usam `text-wrap: balance`; valores longos preservam quebras e permitem quebra de palavras com entrelinha 1.7.

## Layout

A sidebar desktop é fixa, ocupa toda a altura e tem largura de 248px (`w-62`). Exibe marca, navegação principal, navegação complementar e identificação do professor com saída no rodapé. Aparece a partir de 768px (`md`).

Abaixo desse limite, a sidebar desaparece e a navegação inferior branca fica fixa, em cinco colunas: Início, Alunos, + Aula, Relatórios e Mais. A ação + Aula recebe marinho com texto branco. O padding inferior respeita `max(env(safe-area-inset-bottom), 8px)`, e cada link tem altura mínima de 52px.

O cabeçalho de página é flexível, permite quebra, alinha título e ação e usa gap de 20px e margem inferior de 28px. Até 767px, essa margem cai para 22px e o padding dos painéis passa de 24px para 18px. Campos empilham label e controle com gap de 7px; ações e controles de formulário têm altura mínima de 44px.

Não se estabelece uma largura máxima global ou uma grade universal a partir destes arquivos. A composição específica do painel permanece em `.impeccable/surface.md`.

## Elevation & Depth

A profundidade vem principalmente do contraste entre fundo off-white, painéis brancos e bordas finas. As sombras são ambientais e discretas: painéis usam `0 3px 12px #19354b03`; botões em hover usam `0 3px 8px #19354b12`. A navegação fixa usa z-index 30.

O foco não é uma sombra: `:focus-visible` aplica contorno de 3px na cor `focus`, afastado 3px. Botões transitam background e box-shadow em .15s. A preferência por movimento reduzido remove animações e transições e restaura scroll automático.

## Shapes

Os elementos principais usam cantos suavemente arredondados entre 9px e 16px: campos e links da sidebar, botões, avatares e painéis têm os valores próprios do frontmatter. Badges (6px) e tabs (8px) são exceções menores já implementadas, não novos padrões.

Painéis e controles têm borda de 1px. Avatares são quadrados de 44px; a marca tem símbolo em um quadrado de 36px com cantos de 12px. Os ícones são Lucide, não ilustrações escolares.

## Components

### Buttons

Ações compactas e claras. Primário em marinho com texto branco; secundário branco com texto marinho e borda suave; perigo branco com texto e borda próprios. Compartilham padding, raio e altura mínima. Hover primário muda o fundo; secundário passa a fundo azul muito claro. O botão de perigo herda a regra geral de hover, sem um hover exclusivo. `button:disabled` usa opacidade .55 e cursor `wait`. Todos recebem o foco global.

### Chips

Badges informativos, com tipografia de 12px/peso 600 e gap de 5px. Variantes success, warning e danger têm pares de cor definidos no frontmatter. Não há estado selecionado ou comportamento de filtro demonstrado nestes componentes.

### Cards / Containers

Painéis brancos com borda suave, raio maior e sombra ambiental. Padding responsivo descrito em Layout. O componente `EmptyState` reutiliza esse painel, centraliza ícone, título, descrição e ação; sua altura mínima é 256px. Seu estado visual não foi verificado nesta passagem.

### Inputs / Fields

Campos brancos com borda própria, texto marinho, placeholder e label em tons secundários específicos. Ocupam a largura disponível. Textareas têm altura mínima de 104px e redimensionamento vertical. Foco vem da regra global; estes arquivos não definem uma variante visual de erro de campo.

### Navigation

Na sidebar, links têm ícone, texto e gap de 12px. Hover e rota ativa compartilham fundo `nav-active` e texto branco. A seleção usa o início do pathname. No mobile, + Aula permanece destacada; os demais links usam fundo `slate-100` quando ativos e texto `slate-600` quando inativos, conforme as utilities existentes, sem introduzir cores de marca adicionais.

### Brand, Avatar and Values

A marca utiliza a arte oficial fornecida em `LOGO EVOLUÇÃO VISÍVEL.png`. Os derivados em `public/brand/` combinam o símbolo e o lettering originais na horizontal; a versão branca mantém a transparência para a sidebar marinho. A marca mede 144–160px nas superfícies claras e 180px na sidebar, com alvo clicável mínimo de 44px. O favicon utiliza o símbolo original, e o PDF incorpora a marca horizontal no cabeçalho de cada página. O arquivo original é preservado; origem e transformação estão registradas em `public/brand/provenance.json`, e o preparo pode ser reproduzido com `node scripts/prepare-logo.mjs`.

Avatares exibem as iniciais dos dois primeiros nomes e são ocultados da árvore de acessibilidade. `Value` organiza label e conteúdo, com fallback textual “Ainda não registrado.”. Esses comportamentos são extraídos do código, não estados adicionais aprovados por captura.

## Do's and Don'ts

### Do:
- **Do** preservar marinho estrutural, azul de apoio, fundo off-white e superfícies brancas.
- **Do** manter a tipografia de trabalho existente e numerais tabulares nos indicadores.
- **Do** reutilizar foco visível, alturas mínimas e adaptação da navegação já implementados.
- **Do** distinguir evidência de código de estados efetivamente revisados em capturas.

### Don't:
- **Don't** introduzir estética infantil, excesso de elementos escolares ou densidade de ERP.
- **Don't** inventar rampas de cor, tokens ou estados para completar a documentação.
- **Don't** tratar o SHIP visual informado como validação de outros estados ou funcionalidades.
