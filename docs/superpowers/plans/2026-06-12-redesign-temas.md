# Redesign moderno + Seletor de Temas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernizar o visual (sans, cards, mobile-first, flair shader) e adicionar seletor de temas claro/escuro persistido, via theming por variáveis CSS + um `theme.js` injetado em todas as páginas.

**Architecture:** `headfirst.css` e `playground.css` viram totalmente baseados em variáveis CSS, com dois conjuntos (`[data-theme="claro|escuro"]`). Um script inline anti-FOUC no `<head>` seta o tema antes do paint; `theme.js` renderiza o botão 🌓 e persiste. ZERO mudança no motor GLSL/conteúdo.

**Tech Stack:** CSS variáveis, JS vanilla, `node --test`, Playwright (prova + screenshots), GitHub Pages (redeploy no push).

**Spec:** `docs/superpowers/specs/2026-06-12-redesign-temas-design.md`.

**Convenções herdadas:**
- **Baseline: 152 testes + smoke 17 verde.** Web em `site/`. Páginas (20): `index.html`, `glossario.html`, `professor/index.html`, `modulos/*.html` (17).
- Injeção idempotente depth-aware (`''` raiz, `'../'` subpastas), igual ao injetor da PWA.
- Sem web fonts (offline). Claro = padrão; `prefers-color-scheme` na 1ª visita.
- **Deploy automático no push** (Pages já habilitado) → a Task de push republica o site. Por isso: gerar screenshots e **pausar pra tua aprovação visual ANTES do push**.

---

## Task 1: Teste de tema (falha primeiro)

**Files:**
- Test: `test/theme.test.js`

- [ ] **Step 1: Escrever o teste**

Criar `test/theme.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const PAGES = [
  'site/index.html', 'site/glossario.html', 'site/professor/index.html',
  ...['00-comecando','01-shaders-e-gpu','02-pixel-e-cor','03-matematica-vira-imagem',
      '04-formas-e-padroes','05-dando-vida-animacao','06-paralelismo','07-vertices-e-pipeline',
      '08-vetores-e-coordenadas','09-texturas-e-uv','10-normais-e-luz','11-hardware-fixo',
      '12-luz-especular','13-alem-de-pixels','14-otimizacao','15-placa-de-video','16-transparencia']
    .map((m) => `site/modulos/${m}.html`),
];

test('headfirst.css: tema por variaveis + bloco escuro', () => {
  const css = readFileSync('site/assets/css/headfirst.css', 'utf8');
  assert.ok(css.includes('[data-theme="escuro"]'), 'falta o tema escuro');
  assert.ok(/body\.hf\s*\{[^}]*var\(--bg\)/.test(css), 'body nao usa var(--bg)');
  assert.ok(css.includes('var(--ink)'), 'nao usa var(--ink)');
  assert.ok(css.includes('.theme-toggle'), 'falta o estilo do botao de tema');
});

test('playground.css: usa variaveis de tema', () => {
  const css = readFileSync('site/assets/css/playground.css', 'utf8');
  assert.ok(css.includes('var(--card)') && css.includes('var(--ink)'), 'playground nao usa variaveis');
});

test('theme.js: alterna, persiste e atualiza theme-color', () => {
  const js = readFileSync('site/assets/playground/theme.js', 'utf8');
  assert.ok(js.includes('data') && /escuro/.test(js), 'theme.js nao alterna data-theme');
  assert.ok(js.includes("localStorage") && js.includes("shaderworkshop:theme"), 'theme.js nao persiste');
  assert.ok(js.includes('theme-color'), 'theme.js nao atualiza meta theme-color');
});

test('todas as paginas injetam o theme-head + theme.js', () => {
  for (const p of PAGES) {
    const html = readFileSync(p, 'utf8');
    assert.ok(html.includes('<!-- theme-head -->'), `${p}: falta o theme-head`);
    assert.ok(/playground\/theme\.js/.test(html), `${p}: falta o theme.js`);
  }
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — sem `[data-theme]`/`theme.js`/injeção.

---

## Task 2: Reescrever `headfirst.css` (variáveis + 2 temas + fonte + flair)

**Files:**
- Modify (substituição total): `site/assets/css/headfirst.css`

- [ ] **Step 1: Substituir o arquivo inteiro**

Substituir TODO o conteúdo de `site/assets/css/headfirst.css` por:

```css
/* Temas: claro (padrão) e escuro. Todas as cores via variáveis. */
:root, [data-theme="claro"] {
  --bg:#faf9f6; --card:#ffffff; --ink:#1f1c18; --muted:#6b655a; --line:#e7e1d6; --code:#f4efe6;
  --accent:#d6336c; --accent-ink:#ffffff; --focus:#1c7ed6;
  --brain-bg:#fff0f4; --brain-accent:#d6336c;
  --cuidado-bg:#fff6e5; --cuidado-line:#e0a000; --cuidado-ink:#b35900;
  --qa-bg:#eef6ff; --afie-line:#b9b09c;
  --magnets-bg:#f1f3f5; --magnets-line:#495057;
  --recordacao-bg:#f3f0ff; --recordacao-accent:#7048e8;
  --sidebar-bg:#f3f3f3; --sidebar-line:#cfcabb; --th-bg:#efe7ff;
  --spec-bg:#ffffff; --spec-open-bg:#f6f4ef; --img-todo:#c0392b;
  --ok:#1a7f37; --quase:#b35900; --erro:#c0392b;
  --shadow:0 1px 2px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.05);
  --canvas-glow:rgba(28,126,214,.18);
}
[data-theme="escuro"] {
  --bg:#0d0f14; --card:#151821; --ink:#e9edf5; --muted:#8b93a7; --line:#262b38; --code:#1a1e29;
  --accent:#ff6b9d; --accent-ink:#0d0f14; --focus:#4dabf7;
  --brain-bg:#241823; --brain-accent:#ff6b9d;
  --cuidado-bg:#2a2210; --cuidado-line:#caa23a; --cuidado-ink:#f0c060;
  --qa-bg:#0e1b24; --afie-line:#3a3f4d;
  --magnets-bg:#1a1e29; --magnets-line:#3a4150;
  --recordacao-bg:#1d1830; --recordacao-accent:#a78bfa;
  --sidebar-bg:#1a1e29; --sidebar-line:#2c3240; --th-bg:#241d33;
  --spec-bg:#151821; --spec-open-bg:#1b1f2a; --img-todo:#ff8a7a;
  --ok:#51cf66; --quase:#f0a44d; --erro:#ff6b6b;
  --shadow:0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.3);
  --canvas-glow:rgba(34,211,238,.20);
}

body.hf { max-width: 800px; margin: 0 auto; padding: 24px 20px 64px;
  font: 16px/1.65 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--ink); background: var(--bg);
  transition: background .2s ease, color .2s ease; }
.hf a { color: var(--accent); }
.hf p { margin: .7em 0; }
.hf code { background: var(--code); padding: .12em .4em; border-radius: 5px; font: .86em ui-monospace, monospace; }

.hf h1, .hf h2, .hf h3 { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; letter-spacing: -.015em; }
.hf h1 { font-size: 2rem; line-height: 1.12; font-weight: 800; margin: .15em 0 .5em; color: var(--ink); }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .hf h1 { background: linear-gradient(90deg, #1c7ed6, #e8590c);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
}
.hf h2 { font-size: 1.35rem; font-weight: 700; margin: 1.7em 0 .5em; }

.hf .afie { border: 2px dashed var(--afie-line); border-radius: 12px; padding: 14px 18px; margin: 20px 0; background: var(--card); box-shadow: var(--shadow); }
.hf .afie::before { content: "✏️ Afie o lápis"; display: block; font-weight: bold; margin-bottom: 6px; }
.hf .brain { border-left: 5px solid var(--brain-accent); border-radius: 12px; padding: 12px 18px; margin: 20px 0; background: var(--brain-bg); box-shadow: var(--shadow); }
.hf .brain::before { content: "🧠 Brain Power"; display: block; font-weight: bold; color: var(--brain-accent); margin-bottom: 4px; }
.hf .qa { background: var(--qa-bg); border-radius: 14px; padding: 14px 18px; margin: 20px 0; box-shadow: var(--shadow); }
.hf .qa::before { content: "Não existe pergunta idiota"; display: block; font-weight: bold; margin-bottom: 6px; }
.hf .qa dt { font-weight: bold; margin-top: 8px; }
.hf .cuidado { background: var(--cuidado-bg); border: 1px solid var(--cuidado-line); border-radius: 14px; padding: 12px 18px; margin: 20px 0; box-shadow: var(--shadow); }
.hf .cuidado::before { content: "⚠️ Cuidado!"; display: block; font-weight: bold; color: var(--cuidado-ink); margin-bottom: 4px; }
.hf .sidebar { border: 1px solid var(--sidebar-line); border-radius: 12px; margin: 20px 0; background: var(--sidebar-bg); }
.hf .sidebar > summary { cursor: pointer; font-weight: bold; padding: 12px 18px; }
.hf .sidebar[open] > summary { border-bottom: 1px solid var(--line); }
.hf .sidebar > div { padding: 0 18px 12px; }
.hf .bullets { border-top: 3px double var(--line); padding-top: 12px; margin-top: 24px; }
.hf .bullets::before { content: "Pontos-chave"; display: block; font-weight: bold; margin-bottom: 6px; }
.hf .duo { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
@media (max-width: 640px) { .hf .duo { grid-template-columns: 1fr; } }
.hf .magnets { border: 2px dashed var(--magnets-line); border-radius: 12px; padding: 10px 18px 14px; margin: 20px 0; background: var(--magnets-bg); }
.hf .magnets::before { content: "🧲 Ímãs de código"; display: block; font-weight: bold; margin: 4px 0 6px; }
.hf .magnets pre { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font-family: ui-monospace, monospace; font-size: 14px; overflow-x: auto; }
.hf figure { margin: 20px 0; text-align: center; }
.hf figure img { max-width: 100%; height: auto; }
[data-theme="escuro"] .hf figure img { background: #fff; border-radius: 10px; padding: 6px; }
.hf .img-todo { border: 2px dotted var(--img-todo); padding: 14px; color: var(--img-todo); font-family: ui-monospace, monospace; font-size: 14px; background: var(--card); }
.hf .mascote { float: right; width: 90px; margin: 0 0 8px 12px; }
.hf .recordacao { border: 2px solid var(--recordacao-accent); border-radius: 12px; padding: 10px 18px 14px; margin: 20px 0; background: var(--recordacao-bg); }
.hf .recordacao h2 { margin-top: 8px; }
.hf .recordacao::before { content: "🎯 Hora de fixar"; display: block; font-weight: bold; color: var(--recordacao-accent); margin: 8px 0 0; }
.hf .proximo-soon { color: var(--muted); cursor: default; }
.hf .sidebar table { border-collapse: collapse; margin: 8px 0; width: 100%; }
.hf .sidebar th, .hf .sidebar td { border: 1px solid var(--line); padding: 5px 9px; text-align: left; font-size: 15px; }
.hf .sidebar th { background: var(--th-bg); }
.hf .cuidado-inline { color: var(--cuidado-ink); font-size: 14px; margin: 8px 0 0; }

/* Ficha técnica do Módulo 15 (bônus) */
.hf .spec { border: 1px solid var(--line); border-radius: 8px; margin: 6px 0; padding: 6px 12px; background: var(--spec-bg); }
.hf .spec > summary { cursor: pointer; font-weight: bold; font-family: ui-monospace, "Cascadia Code", Consolas, monospace; }
.hf .spec > div { margin-top: 8px; color: var(--muted); }
.hf .spec[open] { background: var(--spec-open-bg); }

/* Foco visível */
.hf a:focus-visible, .hf details > summary:focus-visible, .theme-toggle:focus-visible {
  outline: 3px solid var(--focus); outline-offset: 2px;
}

/* Botão flutuante de tema (renderizado por theme.js) */
.theme-toggle { position: fixed; top: 12px; right: 12px; z-index: 50;
  font: 600 16px system-ui; line-height: 1; padding: 9px 12px; border-radius: 999px;
  border: 1px solid var(--line); background: var(--card); color: var(--ink); cursor: pointer; box-shadow: var(--shadow); }
.theme-toggle:hover { border-color: var(--accent); }

/* Tabela de rubrica / kit do professor */
.hf .tabela-scroll { overflow-x: auto; margin: 12px 0; }
.hf .rubrica { border-collapse: collapse; margin: 12px 0; width: 100%; }
.hf .rubrica th, .hf .rubrica td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; font-size: 15px; vertical-align: top; }
.hf .rubrica th { background: var(--th-bg); }

/* Respeita prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
```

- [ ] **Step 2: Conferir que não sobrou cor de tema hardcoded crítica**

Run: `grep -nE "#[0-9a-fA-F]{3,6}" site/assets/css/headfirst.css | grep -vE "data-theme|linear-gradient|#fff;|rgba\(|1c7ed6, #e8590c"`
Expected: só aparecem as definições dentro dos blocos `:root`/`[data-theme]`, o `#fff` do wrapper de SVG e o gradiente do H1. Nenhuma cor solta nas regras de componente.

---

## Task 3: Reescrever `playground.css` (variáveis + dark + touch + glow)

**Files:**
- Modify (substituição total): `site/assets/css/playground.css`

- [ ] **Step 1: Substituir o arquivo inteiro**

Substituir TODO o conteúdo de `site/assets/css/playground.css` por:

```css
.pg { border: 1px solid var(--line); border-radius: 16px; padding: 14px; background: var(--card); max-width: 360px; box-shadow: var(--shadow); }
.pg-canvas { width: 320px; max-width: 100%; height: auto; aspect-ratio: 1 / 1; display: block; border-radius: 10px; background: #000; image-rendering: pixelated; box-shadow: 0 0 32px var(--canvas-glow); }
.pg-controls { margin: 10px 0; display: flex; flex-direction: column; gap: 8px; }
.pg-control { display: flex; align-items: center; justify-content: space-between; font: 14px system-ui; gap: 8px; color: var(--ink); }
.pg-control input[type="range"] { flex: 1; accent-color: var(--accent); }
.pg-editor { width: 100%; min-height: 92px; font: 13px ui-monospace, monospace; margin: 8px 0; border: 1px solid var(--line); border-radius: 10px; padding: 10px; box-sizing: border-box; background: var(--card); color: var(--ink); }
.pg-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.pg-buttons button { font: 600 14px system-ui; padding: 10px 14px; min-height: 44px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); color: var(--ink); cursor: pointer; }
.pg-buttons button:hover { border-color: var(--accent); }
.pg-buttons .pg-run { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.pg-status { font: 14px system-ui; min-height: 1.2em; margin: 8px 0 0; color: var(--ink); }
.pg-ok { color: var(--ok); font-weight: bold; }
.pg-quase { color: var(--quase); }
.pg-erro { color: var(--erro); font-family: ui-monospace, monospace; font-size: 13px; }
.pg-hlsl { margin: 8px 0; border: 1px solid var(--recordacao-accent); border-radius: 10px; background: var(--recordacao-bg); }
.pg-hlsl-nota { font: 13px system-ui; margin: 0; padding: 8px 12px; color: var(--recordacao-accent); }
.pg-hlsl-code { margin: 0; padding: 10px; font: 13px ui-monospace, monospace; white-space: pre-wrap; overflow-x: auto; border-top: 1px solid var(--line); color: var(--ink); }

.pg-erro-tec { margin-top: 6px; font-size: 0.85em; }
.pg-erro-tec summary { cursor: pointer; color: var(--muted); }
.pg-erro-tec pre { white-space: pre-wrap; background: var(--code); padding: 8px; border-radius: 6px; overflow-x: auto; margin: 4px 0 0; color: var(--ink); }

/* Foco visível em todos os controles do playground */
.pg button:focus-visible, .pg-editor:focus-visible, .pg input:focus-visible, .pg-erro-tec summary:focus-visible {
  outline: 3px solid var(--focus); outline-offset: 2px;
}
```

---

## Task 4: `theme.js` (botão + persistência + meta)

**Files:**
- Create: `site/assets/playground/theme.js`

- [ ] **Step 1: Criar o arquivo**

Criar `site/assets/playground/theme.js`:

```javascript
// Seletor de tema (claro/escuro). O tema inicial já é setado por um script inline
// anti-FOUC no <head>; aqui só renderizamos o botão e tratamos a troca + persistência.
(function () {
  const KEY = 'shaderworkshop:theme';
  const root = document.documentElement;
  const cur = () => (root.dataset.theme === 'escuro' ? 'escuro' : 'claro');

  function setMeta(t) {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'escuro' ? '#0d0f14' : '#d6336c');
  }
  function label(t) { return t === 'escuro' ? 'Mudar para tema claro' : 'Mudar para tema escuro'; }

  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.type = 'button';
  btn.textContent = '🌓';
  btn.setAttribute('aria-label', label(cur()));
  btn.setAttribute('aria-pressed', cur() === 'escuro' ? 'true' : 'false');

  function apply(t) {
    root.dataset.theme = t;
    try { localStorage.setItem(KEY, t); } catch (e) { /* storage bloqueado: ok */ }
    setMeta(t);
    btn.setAttribute('aria-label', label(t));
    btn.setAttribute('aria-pressed', t === 'escuro' ? 'true' : 'false');
  }

  btn.addEventListener('click', () => apply(cur() === 'escuro' ? 'claro' : 'escuro'));
  (document.body || root).appendChild(btn);
  setMeta(cur());
})();
```

- [ ] **Step 2: Conferir sintaxe**

Run: `node -c site/assets/playground/theme.js`
Expected: sem erro.

---

## Task 5: Injetar o theme-head em todas as páginas

**Files:**
- Create: `scripts/inject-theme-head.mjs`
- Modify (via script): as 20 páginas
- Modify: `site/precache.json` (regenerar — inclui theme.js)

- [ ] **Step 1: Criar o injetor**

Criar `scripts/inject-theme-head.mjs`:

```javascript
// Injeta (idempotente) o script anti-FOUC de tema logo apos o <meta charset> e o
// theme.js (defer) antes de </head>. Prefixo depth-aware ('' raiz, '../' subpastas).
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = join(process.cwd(), 'site');
const MARK = '<!-- theme-head -->';
const INLINE = `${MARK}
  <script>(function(){try{var t=localStorage.getItem('shaderworkshop:theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'escuro':'claro';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='claro';}})();</script>`;

async function inject(file, prefix) {
  let html = await readFile(file, 'utf8');
  if (html.includes(MARK)) return false;
  html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  ' + INLINE);
  html = html.replace('</head>', `  <script src="${prefix}assets/playground/theme.js" defer></script>\n</head>`);
  await writeFile(file, html);
  return true;
}

const pages = [
  ['index.html', ''],
  ['glossario.html', ''],
  ['professor/index.html', '../'],
  ...(await readdir(join(SITE, 'modulos'))).filter((f) => f.endsWith('.html')).map((f) => [`modulos/${f}`, '../']),
];

let n = 0;
for (const [rel, prefix] of pages) {
  if (await inject(join(SITE, rel), prefix)) { n++; console.log('  theme-head: ' + rel); }
}
console.log(`Injetado em ${n} pagina(s).`);
```

- [ ] **Step 2: Rodar a injeção + regenerar precache**

Run: `node scripts/inject-theme-head.mjs && node scripts/gen-precache.mjs`
Expected: "Injetado em 20" (ou menos se já houver); precache regerado (agora inclui `assets/playground/theme.js`). Rodar a injeção de novo → 0 (idempotente).

- [ ] **Step 3: Conferir ordem (anti-FOUC vem cedo) + paths**

Run: `grep -n "theme-head\|theme.js" site/index.html site/modulos/01-shaders-e-gpu.html`
Expected: o `<!-- theme-head -->` aparece logo após o charset (cedo no head); `theme.js` com `src` relativo certo (`assets/...` na raiz, `../assets/...` no módulo).

---

## Task 6: Verde + smoke + prova + SCREENSHOTS (pausa pra aprovação)

**Files:**
- Create (temporário): `scripts/verify-theme.mjs` (deletado no fim)

- [ ] **Step 1: Testes + smoke**

Run: `npm test` → Expected: PASS (152 → 156, +4 do theme.test).
Run: `npm run smoke` → Expected: verde, 17 módulos.

- [ ] **Step 2: Prova de tema + screenshots (Playwright)**

Criar `scripts/verify-theme.mjs`:

```javascript
// Prova throwaway: toggle persiste + gera screenshots claro/escuro de um modulo.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const SITE = join(process.cwd(), 'site');
const MIME = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json' };
const server = createServer(async (req,res)=>{ try{ const p=decodeURIComponent(req.url.split('?')[0]); const fp=join(SITE,p==='/'?'index.html':p); const b=await readFile(fp); res.writeHead(200,{'Content-Type':MIME[extname(fp)]||'application/octet-stream'}); res.end(b);}catch{res.writeHead(404);res.end('nf');} });
await new Promise((r)=>server.listen(0,r));
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:420, height:1500 } });
await page.goto(base + '/modulos/12-luz-especular.html', { waitUntil:'networkidle' });

const t0 = await page.evaluate(() => document.documentElement.dataset.theme);
await page.screenshot({ path:'mockups/real-claro.png', fullPage:true });
await page.click('.theme-toggle');
const t1 = await page.evaluate(() => document.documentElement.dataset.theme);
await page.waitForTimeout(300);
await page.screenshot({ path:'mockups/real-escuro.png', fullPage:true });
await page.reload({ waitUntil:'networkidle' });
const t2 = await page.evaluate(() => document.documentElement.dataset.theme);

console.log('tema inicial:', t0, '| apos toggle:', t1, '| apos reload (persistiu?):', t2);
const ok = t1 !== t0 && t2 === t1;
await browser.close();
await new Promise((r)=>server.close(r));
process.exit(ok ? 0 : 1);
```

Run: `node scripts/verify-theme.mjs`
Expected: `tema inicial: claro | apos toggle: escuro | apos reload (persistiu?): escuro`, exit 0. Gera `mockups/real-claro.png` e `mockups/real-escuro.png`.

- [ ] **Step 3: Enviar screenshots e PAUSAR pra aprovação visual**

Enviar `mockups/real-claro.png` e `mockups/real-escuro.png` ao usuário (SendUserFile). **Parar** e pedir OK do visual antes de commitar/publicar. Se pedir ajuste de cor/espaçamento, voltar à Task 2/3, reexecutar o verify e reenviar.

- [ ] **Step 4: Limpar o throwaway**

Run: `rm scripts/verify-theme.mjs`
(As screenshots em `mockups/` não são commitadas — são rascunho.)

---

## Task 7: Commit + deploy (após aprovação visual)

**Files:** nenhum novo.

- [ ] **Step 1: Commit**

```bash
git add site/assets/css/headfirst.css site/assets/css/playground.css site/assets/playground/theme.js scripts/inject-theme-head.mjs site/precache.json test/theme.test.js site/index.html site/glossario.html site/professor/index.html site/modulos/*.html
git commit -m "feat(curso): redesign moderno (sans/cards/flair shader) + seletor de temas claro/escuro"
```

- [ ] **Step 2: Push (republica a PWA no Pages)**

```bash
git push
```
Expected: o workflow Pages roda; o site atualizado (com tema) fica em `https://hhthunderbird.github.io/ShaderWorkshop/`. Conferir `gh run list --workflow=pages.yml --limit 1` = success.

- [ ] **Step 3: Fechamento**

Redesign + temas entregue e publicado. Backlog de app: Fase 0 PWA ✓, redesign+temas ✓. Próximas: Fase 2a (sala Node) ou Fase 1 (TWA). `main` em dia.

---

## Self-Review (cobertura do spec)

- **§1 direção B + flair shader + dark do C, claro padrão, sem web fonts** → Task 2 (body sans, H1 gradiente, dois temas; system-ui). ✓
- **§2 variáveis (grupos superfície/acento/dispositivos/playground) + paletas + tipografia + flair** → Task 2 (headfirst) + Task 3 (playground). ✓
- **§3.1/3.2 refactor dos dois CSS p/ variáveis** → Tasks 2 e 3 (substituição total, grep de verificação). ✓
- **§3.3 SVG no escuro (cartão claro)** → Task 2 (`[data-theme="escuro"] .hf figure img`). ✓
- **§4.1 theme.js (botão/persist/meta)** → Task 4. **§4.2 anti-FOUC inline** → Task 5 (INLINE após charset). **§4.3 injeção depth-aware + precache** → Task 5. ✓
- **§5 testes (css var/dark, playground var, theme.js, injeção) + Playwright (toggle+persist) + screenshots + smoke 17** → Task 1 + Task 6. ✓
- **§7 riscos (FOUC inline cedo; H1 fallback @supports; SVG wrapper; offline system-ui; reduced-motion; localStorage try/catch)** → Tasks 2/4/5. ✓
- **Consistência:** `data-theme="claro|escuro"`, chave `shaderworkshop:theme`, marcador `<!-- theme-head -->`, classe `.theme-toggle`, variáveis batem entre CSS/JS/teste. ✓
- **Contagem:** 152 → 156 (T1 +4). ✓
- **Gate visual:** Task 6 Step 3 pausa pra aprovação antes do push (Task 7). ✓
