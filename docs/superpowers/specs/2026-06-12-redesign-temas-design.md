# Redesign moderno + Seletor de Temas — Design

**Data:** 2026-06-12. **Pré-requisito:** curso em `site/` (CSS central `headfirst.css` + `playground.css`); PWA Fase 0 publicada. **Origem:** pedido do usuário ("estilo mais moderno mobile") + o seletor de temas adiado na Fase 0.

## 1. Escopo e objetivo

Modernizar o visual do curso (mobile-first) **e** adicionar um **seletor de temas claro/escuro** persistido. Direção escolhida (via mockups A/B/C + avaliação): **base "Moderno quente" (B)** — sans, cards, espaçamento moderno, **mantendo os dispositivos Head First com código de cor pedagógico** (brain rosa, cuidado âmbar, afie, etc.) — com **flair shader** (H1 em gradiente, glow sutil no canvas) e a **paleta escura do mockup C** como tema escuro. **Claro é o padrão**; respeita `prefers-color-scheme` na 1ª visita.

**Decisões travadas:**
- **Sem web fonts** (Inter etc.): a PWA é offline — usar só a stack `system-ui` (zero fetch). Headings e corpo em sans do sistema.
- **Theming por variáveis CSS** + `[data-theme="claro|escuro"]` no `<html>`. Nenhuma cor de tema hardcoded sobra nos componentes.
- **Sem FOUC:** um script inline síncrono no `<head>` seta o tema antes do paint.
- **Zero mudança no motor GLSL/conteúdo** dos módulos. Só CSS + 1 JS + injeção de `<head>`.

**Escopo cortado (YAGNI):** sem 3º tema (sépia/alto-contraste) agora — só claro/escuro; sem web fonts; sem reescrever os 6 SVGs (tratados via wrapper — §5).

## 2. Arquitetura de temas (variáveis CSS)

Definir um conjunto de variáveis no `:root`/`[data-theme]`. Grupos:

**Superfície/texto:** `--bg` (página), `--ink` (texto), `--muted` (secundário), `--line` (bordas), `--card` (superfície elevada), `--code` (fundo de `code`/`pre`).
**Acento:** `--accent` (rosa do curso), `--accent-ink` (texto sobre acento), `--focus` (anel de foco).
**Dispositivos (cor pedagógica preservada):** `--brain-bg`/`--brain-accent`, `--cuidado-bg`/`--cuidado-line`/`--cuidado-ink`, `--qa-bg`, `--afie-line`, `--magnets-bg`/`--magnets-line`, `--recordacao-bg`/`--recordacao-accent`, `--sidebar-bg`/`--sidebar-line`, `--th-bg` (cabeçalho de tabela), `--spec-bg`.
**Playground:** `--pg-bg`, `--pg-border`, `--pg-btn-bg`, `--editor-bg`, `--canvas-glow`, `--ok`, `--quase`, `--erro`.

**Paletas (valores no plano; aqui a intenção):**
| | CLARO (padrão, quente) | ESCURO (C) |
|--|--|--|
| `--bg` | `#faf9f6` | `#0d0f14` |
| `--card` | `#ffffff` | `#151821` |
| `--ink` | `#1f1c18` | `#e9edf5` |
| `--muted` | `#6b655a` | `#8b93a7` |
| `--line` | `#e7e1d6` | `#262b38` |
| `--accent` | `#d6336c` (rosa do curso) | `#ff6b9d` |
| `--brain-bg` | `#fff0f4` | `#241823` |
| `--cuidado-bg` | `#fff6e5` | `#2a2210` |
| `--qa-bg` | `#eef6ff` | `#0e1b24` |
| `--code` | `#f4efe6` | `#1a1e29` |
| `--focus` | `#1c7ed6` | `#4dabf7` |
Contraste AA conferido (texto vs fundo) em ambos.

**Tipografia:** corpo e headings → `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. H1/H2 com `font-weight:800/700`, `letter-spacing` levemente negativo. Tamanho base 16–17px, escala maior nos títulos.

**Flair shader (barato):**
- **H1 em gradiente:** `background:linear-gradient(90deg,#1c7ed6,#e8590c); -webkit-background-clip:text; color:transparent;` (a paleta do canvas). Fallback: se `background-clip:text` não pegar, cor sólida `--ink` (definir cor base antes do clip).
- **Glow no canvas:** `.pg-canvas{ box-shadow: 0 0 32px var(--canvas-glow) }` (sutil; `--canvas-glow` translúcido).

## 3. Mudança nos arquivos de estilo

### 3.1 `site/assets/css/headfirst.css`
Refatorar: trocar TODAS as cores hardcoded (linhas atuais: `#888`, `#fff`, `#fff0f4`, `#eef6ff`, `#fff6e5`, `#e0a000`, `#b35900`, `#bbb`, `#f3f3f3`, `#ddd`, `#495057`, `#f1f3f5`, `#ced4da`, `#c0392b`, `#7048e8`, `#f3f0ff`, `#6c6c6c`, `#e7e0ff`, `#d0d7de`, `#333`, `#f8f9fa`, `#1c7ed6`, e os `--hf-*`) por `var(--…)`. Definir os dois conjuntos de variáveis no topo (`:root,[data-theme="claro"]{…}` e `[data-theme="escuro"]{…}`). Trocar a fonte de corpo (Georgia→system sans) e de h1/h2 (Comic Sans→system sans bold). Manter a estrutura/classes (afie/brain/qa/cuidado/sidebar/bullets/magnets/recordacao/spec/rubrica) — só re-cor + arredondamento/sombra moderada.

### 3.2 `site/assets/css/playground.css`
Mesmo tratamento: `.pg`, `.pg-canvas`, botões, editor, status, hlsl, erro-tec → variáveis. Botão primário (`.pg-run`) ganha destaque (accent). Touch targets `min-height:44px` nos botões. Glow no canvas via `--canvas-glow`.

### 3.3 `site/assets/img/` (SVGs no escuro)
Os 6+ SVGs têm fundo claro fixo. **Não reescrever:** no tema escuro, dar um cartão claro de fundo:
```css
[data-theme="escuro"] .hf figure img { background:#fff; border-radius:8px; padding:6px; }
```
Mantém os SVGs legíveis sem editar cada um.

## 4. Seletor de temas

### 4.1 `site/assets/playground/theme.js` (novo)
- Renderiza o **botão flutuante 🌓** (fixo, canto sup. dir.), acessível (`aria-label`, foco visível).
- Clique alterna `document.documentElement.dataset.theme` claro↔escuro, **persiste** em `localStorage['shaderworkshop:theme']`, e atualiza `<meta name="theme-color">` ao vivo (claro=`#d6336c`, escuro=`#0d0f14`).
- Idempotente; sem dependência do motor (roda em todas as páginas, inclusive index/glossário/professor).

### 4.2 Script inline anti-FOUC (no `<head>`, síncrono)
Antes do CSS pintar, setar o tema:
```html
<script>(function(){try{var t=localStorage.getItem('shaderworkshop:theme');
if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'escuro':'claro';
document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='claro';}})();</script>
```

### 4.3 Injeção — `scripts/inject-theme-head.mjs`
Injeta (idempotente, marcador `<!-- theme-head -->`) em **todas** as páginas: o script inline anti-FOUC + `<script src="{P}assets/playground/theme.js" defer></script>` (prefixo depth-aware `''`/`'../'`, igual ao injetor da PWA). theme.js é adicionado ao `precache.json` automaticamente (gen-precache varre `site/`).

## 5. Testes e verificação
- **node** (`test/theme.test.js`): `headfirst.css` contém `[data-theme="escuro"]` e usa `var(--bg)`/`var(--ink)` no `body`; `playground.css` usa variáveis nos botões; `theme.js` existe (alterna data-theme + persiste + atualiza theme-color); **toda** página tem o marcador `<!-- theme-head -->` e referencia `theme.js`.
- **Playwright (throwaway):** carrega um módulo → confirma `data-theme` setado; clica 🌓 → vira escuro, `getComputedStyle(body).backgroundColor` muda; **reload** → tema escuro persiste (localStorage). Reusa setup do smoke.
- **Screenshots (entregável):** gerar PNG de um módulo em claro e escuro (Playwright) e te enviar pra aprovação visual antes de fechar.
- **`npm run smoke`** segue 17 verde (conteúdo/shader intactos).
- **Regressão PWA:** páginas seguem com `<!-- pwa-head -->`; deploy republica.
- Baseline node: **152** → +1 arquivo (`theme.test.js`).

## 6. Arquivos
**Criar:** `site/assets/playground/theme.js`, `scripts/inject-theme-head.mjs`, `test/theme.test.js`.
**Modificar:** `site/assets/css/headfirst.css` (variáveis + dois temas + fonte + flair), `site/assets/css/playground.css` (variáveis + dark + touch + glow), todas as páginas em `site/` (injeção do theme-head). `site/precache.json` é regenerado (inclui theme.js).

## 7. Riscos / atenção
- **FOUC:** mitigado pelo inline síncrono no head (§4.2). Conferir que vem ANTES dos `<link rel=stylesheet>` no head, OU que setar `data-theme` no `<html>` antes do body pintar basta (basta o atributo existir quando o CSS casar — o inline no topo do head garante).
- **Contraste/AA:** validar texto vs fundo nos dois temas (especialmente `--muted` e os fundos dos dispositivos no escuro). Ajustar valores se < 4.5:1.
- **H1 gradiente:** `background-clip:text` precisa de cor de fallback (navegador sem suporte mostra texto transparente = invisível). Definir `color:var(--ink)` e só então aplicar o clip; ou usar `@supports`.
- **SVGs no escuro:** o wrapper de cartão claro resolve legibilidade; conferir que não fica feio (padding/borda suaves).
- **Offline:** nada de web font (só system-ui) → sem fetch externo, PWA segue offline.
- **Reduced-motion:** as transições de cor do tema usam `transition` — já há `@media (prefers-reduced-motion)` cortando transições; manter.
- **localStorage bloqueado:** o try/catch no inline e no theme.js degrada pro tema claro/padrão sem quebrar.
