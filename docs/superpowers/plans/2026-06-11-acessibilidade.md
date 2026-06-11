# Acessibilidade do Motor/Curso — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pass de acessibilidade cross-cutting: controle de movimento (toggle ▶/⏸ + reduced-motion), foco visível, rótulos pra leitor de tela, contraste — beneficiando todos os playgrounds.

**Architecture:** Lógica de tempo da animação extraída pra `anim.js` puro (testável); o resto é DOM no `playground.js` + CSS. Sem mudança de conteúdo de módulo.

**Tech Stack:** JS vanilla (ES module), `node --test`, `npm run smoke`, Chrome MCP.

**Spec:** `docs/superpowers/specs/2026-06-11-acessibilidade-design.md`. **Baseline:** 128 testes node; smoke verde (16 módulos).

---

## Task 1: `anim.js` puro + teste node

**Files:**
- Create: `site/assets/playground/anim.js`
- Test: `test/anim.test.js`

- [ ] **Step 1: Escrever o teste que falha** — criar `test/anim.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceTime, defaultPlaying } from '../site/assets/playground/anim.js';

test('advanceTime soma dt quando playing', () => {
  assert.equal(advanceTime(1.0, 0.5, true), 1.5);
});
test('advanceTime congela quando pausado', () => {
  assert.equal(advanceTime(1.0, 0.5, false), 1.0);
});
test('advanceTime acumula ao longo de varios frames', () => {
  let t = 0;
  for (let i = 0; i < 4; i++) t = advanceTime(t, 0.25, true);
  assert.equal(t, 1.0);
});
test('advanceTime com dt 0 nao muda', () => {
  assert.equal(advanceTime(2.0, 0, true), 2.0);
});
test('defaultPlaying: toca se nao-reduced, pausa se reduced', () => {
  assert.equal(defaultPlaying(false), true);
  assert.equal(defaultPlaying(true), false);
});
```

- [ ] **Step 2: Rodar e confirmar que falha** — `npm test` → FAIL (módulo não existe).

- [ ] **Step 3: Criar `site/assets/playground/anim.js`:**

```javascript
// Lógica de tempo da animação — pura e testável (o resto do _loop é DOM/WebGL).
// Acumulador: pausar congela o tempo; retomar continua de onde parou.
export function advanceTime(t, dtSeconds, playing) {
  return playing ? t + dtSeconds : t;
}
// Default da reprodução: tocando, exceto se o SO pede reduced-motion.
export function defaultPlaying(prefersReduced) {
  return !prefersReduced;
}
```

- [ ] **Step 4: Rodar e confirmar que passa** — `npm test` → 133 pass (128 + 5).

- [ ] **Step 5: Commit:**

```bash
git add site/assets/playground/anim.js test/anim.test.js
git commit -m "feat(motor): anim.js puro (advanceTime/defaultPlaying) para controle de movimento"
```

---

## Task 2: Integração no motor — toggle ▶/⏸, acumulador, aria-labels

**Files:**
- Modify: `site/assets/playground/playground.js` (import, connectedCallback, _render, _loop, _reset, novo `_prefersReduced`)

- [ ] **Step 1: Import** — após `import { friendlyError } from './glslerrors.js';` acrescentar:

```javascript
import { advanceTime, defaultPlaying } from './anim.js';
```

- [ ] **Step 2: Inicializar estado de animação no `connectedCallback`** — localizar:

```javascript
    this.fullSource = this.cfg.fragment;
    this.start = performance.now();
    this._render();
```
Substituir por:
```javascript
    this.fullSource = this.cfg.fragment;
    this._t = 0;
    this._last = performance.now();
    this.playing = defaultPlaying(this._prefersReduced());
    this._render();
```

- [ ] **Step 3: Adicionar o helper `_prefersReduced`** — logo após o método `_render() { ... }` (ou em qualquer ponto da classe), acrescentar:

```javascript
  _prefersReduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
```

- [ ] **Step 4: `_render` — aria-labels + botão de animação**

(a) Trocar a linha do canvas:
```javascript
        <canvas class="pg-canvas" width="320" height="320"></canvas>
```
por:
```javascript
        <canvas class="pg-canvas" width="320" height="320" role="img" aria-label="resultado do shader (imagem)"></canvas>
```

(b) Trocar a linha do editor:
```javascript
        ${this.cfg.editableRegions.length ? '<textarea class="pg-editor" spellcheck="false"></textarea>' : ''}
```
por:
```javascript
        ${this.cfg.editableRegions.length ? '<textarea class="pg-editor" spellcheck="false" aria-label="editor de código do shader"></textarea>' : ''}
```

(c) No início do `_render()` (primeira linha do método, antes do `this.innerHTML =`), computar:
```javascript
    const animated = this.cfg.mode === 'mesh' || this.fullSource.includes('u_time');
```

(d) Acrescentar o botão de animação na barra de botões — após a linha do `pg-reset`:
```javascript
          <button class="pg-reset">↺ Reset</button>
```
inserir logo depois:
```javascript
          ${animated ? `<button class="pg-anim">${this.playing ? '⏸ Pausar' : '▶ Animar'}</button>` : ''}
```

(e) Adicionar o handler junto aos outros listeners (após o do `pg-reset`):
```javascript
    this.querySelector('.pg-anim')?.addEventListener('click', (e) => {
      this.playing = !this.playing;
      e.target.textContent = this.playing ? '⏸ Pausar' : '▶ Animar';
    });
```

- [ ] **Step 5: `_loop` — acumulador de tempo** — substituir o método `_loop` inteiro:

```javascript
  _loop() {
    const frame = () => {
      const now = performance.now();
      this._t = advanceTime(this._t, (now - this._last) / 1000, this.playing);
      this._last = now;
      if (this.program && this.gl) {
        const t = this._t;
        const base = {
          u_time: t,
          u_resolution: [this.canvas.width, this.canvas.height],
          controls: this.controlValues,
          texture: this.texObj || null,
        };
        if (this.cfg.mode === 'mesh') {
          const vel = this.controlValues.u_vel ?? 0.6;
          const model = multiply(rotateY(t * vel), rotateX(0.5));
          const view = translation(0, 0, -3);
          const proj = perspective(Math.PI / 4, 1, 0.1, 100);
          base.u_mvp = multiply(proj, multiply(view, model));
          base.u_model = model;
          base.u_normalMatrix = mat3FromMat4(model);
          base.u_lightDir = this.cfg.light;
          // Câmera fixa em mundo (0,0,3): é o NEGATIVO da translação da view
          // (translation(0,0,-3)). Se a view mudar, atualizar os dois juntos.
          base.u_cameraPos = [0, 0, 3];
        }
        renderFrame(this.gl, this.program, this.indexCount, base);
      }
      this._raf = requestAnimationFrame(frame);
    };
    frame();
  }
```

- [ ] **Step 6: `_reset` — restaurar animação ao default** — no método `_reset`, imediatamente antes da chamada final `this._compile();`, acrescentar:

```javascript
    this._t = 0;
    this.playing = defaultPlaying(this._prefersReduced());
    const animBtn = this.querySelector('.pg-anim');
    if (animBtn) animBtn.textContent = this.playing ? '⏸ Pausar' : '▶ Animar';
```

- [ ] **Step 7: Rodar testes node + smoke**

Run: `npm test` → 133 pass, 0 fail (sem novos testes aqui; confirma que nada quebrou).
Run: `npm run smoke` → verde, 16 módulos (a mudança no tempo não afeta compilação).

- [ ] **Step 8: Verificar no Chrome (gate da integração)**

Servir e abrir `http://localhost:8000/modulos/05-dando-vida-animacao.html` (tem `u_time`). Confirmar via DevTools/JS:
- O playground animado tem o botão "⏸ Pausar"; clicar → vira "▶ Animar" e a animação **congela** (amostrar `el._t` antes/depois com paint forçado: pausado não cresce; tocando cresce).
- `document.querySelector('.pg-canvas').getAttribute('aria-label')` retorna "resultado do shader (imagem)"; canvas tem `role="img"`.
- Num módulo com editor (ex.: M2), o `.pg-editor` tem `aria-label="editor de código do shader"`.
- Abrir `06-paralelismo.html` (modo mesh? não — fragment com u_time) e `07` (mesh) e confirmar que o botão de animação aparece nos animados e NÃO aparece em páginas sem movimento (ex.: M15 não tem playground; um fragment estático sem u_time, se houver, não mostra o botão).
- `↺ Reset` volta o botão pro estado default e reinicia o tempo.
- Console sem erro de JS.

- [ ] **Step 9: Commit + push**

```bash
git add site/assets/playground/playground.js
git commit -m "feat(motor): toggle Animar/Pausar (reduced-motion default) + aria-labels canvas/editor"
git push
```

---

## Task 3: CSS — foco visível, contraste, reduced-motion

**Files:**
- Modify: `site/assets/css/playground.css`
- Modify: `site/assets/css/headfirst.css`

- [ ] **Step 1: Foco visível + reduced-motion no `playground.css`** — acrescentar ao fim:

```css
/* Acessibilidade: foco visível em todos os controles do playground */
.pg button:focus-visible,
.pg-editor:focus-visible,
.pg input:focus-visible,
.pg-erro-tec summary:focus-visible {
  outline: 3px solid #1c7ed6;
  outline-offset: 2px;
}
```

- [ ] **Step 2: Contraste — corrigir cinzas de texto no `playground.css`**

Trocar a cor do `summary` do erro técnico (criado no item #4): localizar `.pg-erro-tec summary { cursor: pointer; color: #888; }` e trocar `#888` por `#6c6c6c`. Depois, procurar no arquivo qualquer outra cor de TEXTO `#888` ou `#999` (`grep -n "#888\|#999" site/assets/css/playground.css`) e trocar por `#6c6c6c` (só onde for `color:` de texto; não mexer em bordas/fundos). Se não houver outras, seguir.

- [ ] **Step 3: Foco visível + reduced-motion no `headfirst.css`** — acrescentar ao fim:

```css
/* Acessibilidade: foco visível em links e seções colapsáveis */
.hf a:focus-visible,
.hf details > summary:focus-visible {
  outline: 3px solid #1c7ed6;
  outline-offset: 2px;
}

/* Respeita prefers-reduced-motion: corta transições/animações de CSS.
   (A animação do canvas é controlada no motor, via botão Animar/Pausar.) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Contraste — cinzas de texto no `headfirst.css`**

Procurar cores de TEXTO `#888`/`#999` (`grep -n "#888\|#999" site/assets/css/headfirst.css`) e trocar por `#6c6c6c` SÓ onde for `color:` de texto de conteúdo (não bordas/fundos/decoração). Se não houver, seguir. (Cinzas inline em HTML — ex.: `style="color:#999"` nos rótulos "(curso médio)" — ficam fora deste pass, conforme spec §2.4.)

- [ ] **Step 5: Rodar testes + smoke**

Run: `npm test` → 133 pass. Run: `npm run smoke` → verde. (CSS não afeta nenhum dos dois; confirma que nada quebrou.)

- [ ] **Step 6: Verificar no Chrome**

Abrir um módulo (ex.: M1). Tabular (Tab) pelos botões/editor/links e confirmar **outline azul visível** em cada foco. Confirmar que o texto do erro técnico e cinzas de CSS estão mais escuros (legíveis). Console limpo.

- [ ] **Step 7: Commit + push**

```bash
git add site/assets/css/playground.css site/assets/css/headfirst.css
git commit -m "feat(a11y): foco visivel, contraste de texto e prefers-reduced-motion no CSS"
git push
```

---

## Self-Review (cobertura do spec)
- **§2.1 anim.js puro + acumulador + default reduced-motion + botão condicional** → Task 1 (módulo+teste) + Task 2 (Steps 2/4/5/6, botão só se `mesh`||`u_time`). ✓
- **§2.2 aria-labels canvas/editor** → Task 2 Step 4(a)(b). ✓
- **§2.3 foco visível** → Task 3 Steps 1/3. ✓
- **§2.4 contraste (pass CSS, inline fora)** → Task 3 Steps 2/4 (grep+bump CSS; inline anotado fora). ✓
- **§2.5 @media reduced-motion (CSS)** → Task 3 Step 3. ✓
- **§2.6 feedback não-só-cor** → já é texto+ícone (verificado no Chrome Task 2 Step 8 status); sem reescrita necessária. ✓
- **§3 testes node (anim) + Chrome + smoke** → Task 1 (node), Task 2 Step 8 / Task 3 Step 6 (Chrome), Steps 7/5 (smoke). ✓
- **§5 fallback matchMedia** → `_prefersReduced` checa `window.matchMedia &&` (Task 2 Step 3). ✓
- **Consistência:** `advanceTime`/`defaultPlaying`/`_prefersReduced`/`this.playing`/`this._t`/`this._last`/`.pg-anim` usados igual em módulo/import/playground. `this.start` removido (só era usado no _loop, agora acumulador). ✓
- **Contagem:** 128 → 133 node; smoke 16 verde. ✓
