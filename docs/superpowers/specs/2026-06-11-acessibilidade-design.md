# Acessibilidade do Motor/Curso — Design

**Data:** 2026-06-11. **Pré-requisito:** motor `ShaderPlayground`. **Item #7 do backlog.**
**Origem:** auditoria — curso de escola pública (inclusão), feedback dependente de cor, e ausência de `prefers-reduced-motion` nas animações (sensibilidade vestibular/distração comuns em sala).

## 1. Escopo e objetivo

Um pass de acessibilidade **cross-cutting** (motor + CSS) que beneficia os ~31 playgrounds de uma vez: controle de movimento, foco visível, rótulos pra leitor de tela, contraste e confirmação de feedback não-só-cor. Sem mudança de conteúdo de módulo.

## 2. Componentes

### 2.1 Controle de movimento (motor `playground.js`) + `anim.js` puro (novo)
- **`site/assets/playground/anim.js` (novo, PURO, testável):**
  - `advanceTime(t, dtSeconds, playing)` → `playing ? t + dtSeconds : t` (acumulador de tempo; pausar congela).
  - `defaultPlaying(prefersReduced)` → `!prefersReduced` (default tocando, exceto se o SO pede reduced-motion).
- **`playground.js`:**
  - `_loop` migra de "tempo = relógio de parede" (`(performance.now()-this.start)/1000`) pra acumulador: guarda `this._t` (segundos) e `this._last` (perf.now); cada frame `const now=performance.now(); this._t = advanceTime(this._t, (now-this._last)/1000, this.playing); this._last = now;` e usa `this._t` como `u_time` (e na rotação da malha). Pausar para de acumular; retomar continua de onde parou. O frame continua sendo desenhado (resize/uniformes/solução aparecem mesmo pausado).
  - `this.playing` inicial = `defaultPlaying(matchMedia('(prefers-reduced-motion: reduce)').matches)`.
  - **Botão de animação** no `_render`, só quando há movimento: `this.cfg.mode==='mesh' || this.fullSource.includes('u_time')`. Rótulo reflete o estado: `⏸ Pausar` (tocando) / `▶ Animar` (pausado). Clique alterna `this.playing` + atualiza o rótulo. (Reusa o gesto de teclado nativo do `<button>`.)
  - `_reset` reaplica o default de `playing` e zera `this._t`.

### 2.2 Rótulos pra leitor de tela (`playground.js` `_render`)
- `<canvas ... role="img" aria-label="resultado do shader (imagem)">`.
- editor `<textarea ... aria-label="editor de código do shader">`.

### 2.3 Foco visível (CSS)
- Em `playground.css`: `:focus-visible` com `outline: 3px solid #1c7ed6; outline-offset: 2px;` para `.pg button, .pg-editor, .pg input, .pg details summary`.
- Em `headfirst.css`: `:focus-visible` para `a, details > summary` (links e `.spec`/`.sidebar`).

### 2.4 Contraste (CSS, pass — não exaustivo)
- Corrigir cinzas usados em **texto** que falham WCAG AA (4.5:1 normal): trocar `#888`/`#999` por `#6c6c6c` (≈4.5:1 em fundo claro) nas REGRAS de CSS (ex.: `.pg-erro-tec summary` `#888` → `#6c6c6c`; quaisquer `#999`/`#888` de texto em `playground.css`/`headfirst.css`).
- **Fora deste pass:** cinzas decorativos em `style="color:#999"` inline (ex.: "(curso médio)" ao lado de um `<h2>` de alto contraste) — secundários, mudar ~15 pontos inline é churn sem ganho de leitura real. Anotado.

### 2.5 `@media (prefers-reduced-motion: reduce)` (CSS)
- Em `headfirst.css`/`playground.css`: zerar `transition`/`animation` de CSS pra quem pede reduced-motion (`* { animation: none !important; transition: none !important; }` dentro do media query). (A animação do canvas é tratada no motor §2.1; isto cobre só CSS.)

### 2.6 Feedback não-só-cor (auditoria + completar)
- Confirmar que o status já usa texto+ícone (`✓ Mandou bem` / `Quase!` / `⚠`) — não depende só de cor. Onde faltar ícone/texto, acrescentar. (Esperado: já OK; é uma verificação, não reescrita.)

## 3. Testes
- **`test/anim.test.js` (node):** `advanceTime` (avança quando playing; congela quando paused; dt 0; soma acumulada) e `defaultPlaying` (true quando !reduced; false quando reduced). É o pedaço de lógica arriscado (pausa) tornado puro e testável.
- **`playground.js` (DOM/WebGL): não testável em node** (convenção do projeto). Verificação no **Chrome**: botão Animar/Pausar aparece nos demos animados e alterna; com reduced-motion emulado o default é pausado; `aria-label` no canvas/editor; `:focus-visible` visível ao tabular; status com texto+ícone. **`npm run smoke` segue verde** (a mudança no caminho de tempo não afeta compilação).
- Playwright pode **emular reduced-motion** (`page.emulateMedia({ reducedMotion: 'reduce' })`) — usar na verificação manual do Chrome/controlador pra confirmar o default pausado.

## 4. Fora de escopo
- Auditoria WCAG completa / certificação. É um pass pragmático dos itens de maior impacto.
- Cinzas decorativos inline (§2.4).
- Descrição por-playground do canvas (decidido: aria-label genérico).
- Tradução/transcrição de áudio (não há áudio).
- Skip-links / landmarks na navegação do site (páginas são curtas e lineares; baixo ganho).

## 5. Riscos
- **Regressão na animação ao trocar pra acumulador:** `advanceTime` puro + teste node; verificação no Chrome (anima, pausa, retoma); smoke garante que shaders compilam. A verificação de "2 frames diferem" (anima) feita no Chrome confirma.
- **Botão de pausa em demo sem movimento:** mitigado — só aparece em `mesh` ou fragment com `u_time`.
- **`matchMedia` indisponível:** improvável em navegador alvo; default seguro (`defaultPlaying(false)` = tocando) se a query falhar (envolver em try ou checar `window.matchMedia`).

## 6. Git
Direto em `main`. Pode ser 1–2 commits (motor+anim; CSS). Conventional Commits.
