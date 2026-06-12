# Salvar Trabalho (localStorage) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o aluno salve o conteúdo do editor de qualquer playground com região editável em `localStorage` (botão 💾 Salvar) e o tenha restaurado automaticamente ao reabrir a página.

**Architecture:** Um módulo puro `localstore.js` (recebe o `storage` por parâmetro → testável em node) encapsula chave/save/load com try/catch. O `playground.js` ganha um wiring fino: botão 💾 Salvar quando há editor, restauração no `connectedCallback` (antes do compile), Reset não-destrutivo. ZERO mudança no motor GLSL.

**Tech Stack:** JS vanilla (Web Component), `node --test`, `npm run smoke` (Playwright), verificação por Playwright throwaway.

**Spec:** `docs/superpowers/specs/2026-06-12-salvar-trabalho-localstorage-design.md`.

**Convenções herdadas:**
- Web em `site/`. Testes em `test/`. Rodar: `npm test`. **Baseline atual: 141 testes + `npm run smoke` (17 módulos) verde.**
- Módulos puros do motor (`config.js`, `header.js`, `glslerrors.js`, `anim.js`, etc.) têm testes node próprios. `playground.js`/`gl.js` são verificados no browser, não por unit test.
- Modelo de persistência (decisão travada): **Save é o único que escreve o slot; Reset é não-destrutivo** (volta o editor ao original, não apaga o salvo). Sem `clear()`.
- **GOTCHA conhecido:** `_compile()` no sucesso faz `statusEl.textContent = ''` → mensagem de restauração tem de ser setada DEPOIS do `_compile`.

---

## Task 1: Módulo puro `localstore.js`

**Files:**
- Create: `site/assets/playground/localstore.js`
- Test: `test/localstore.test.js`

- [ ] **Step 1: Escrever o teste que falha**

Criar `test/localstore.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyFor, save, load } from '../site/assets/playground/localstore.js';

// mock de Storage sobre um Map
function mockStorage() {
  const m = new Map();
  return {
    setItem: (k, v) => m.set(k, String(v)),
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    removeItem: (k) => m.delete(k),
  };
}
// mock que sempre lança (localStorage bloqueado / quota)
const throwingStorage = {
  setItem: () => { throw new Error('quota'); },
  getItem: () => { throw new Error('blocked'); },
  removeItem: () => { throw new Error('blocked'); },
};

test('keyFor: deterministico, com prefixo, distingue ids', () => {
  assert.equal(keyFor('/m/12.html', 'pg-projeto'), 'shaderworkshop:/m/12.html#pg-projeto');
  assert.equal(keyFor('/m/12.html', 'pg-projeto'), keyFor('/m/12.html', 'pg-projeto'));
  assert.notEqual(keyFor('/m/12.html', 'pg-a'), keyFor('/m/12.html', 'pg-b'));
  assert.notEqual(keyFor('/m/10.html', 'pg-projeto'), keyFor('/m/12.html', 'pg-projeto'));
});

test('save/load: roundtrip e sobrescrita', () => {
  const s = mockStorage();
  const k = keyFor('/a.html', 'pg-x');
  assert.equal(load(s, k), null);            // ausente -> null
  assert.equal(save(s, k, 'float a = 0.5;'), true);
  assert.equal(load(s, k), 'float a = 0.5;');
  assert.equal(save(s, k, 'float a = 0.9;'), true);  // sobrescreve
  assert.equal(load(s, k), 'float a = 0.9;');
});

test('degrada em silencio: storage que lança nao propaga', () => {
  const k = keyFor('/a.html', 'pg-x');
  assert.equal(save(throwingStorage, k, 'x'), false);
  assert.equal(load(throwingStorage, k), null);
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `localstore.js` não existe (import lança).

- [ ] **Step 3: Criar o módulo**

Criar `site/assets/playground/localstore.js`:

```javascript
// Persistência do editor em localStorage. Funções puras: recebem o `storage`
// por parâmetro (injetável p/ teste). Tudo em try/catch -> degrada em silêncio
// se localStorage faltar, estiver bloqueado (modo privado) ou com quota cheia.
// Modelo não-destrutivo: só `save` escreve. Não há `clear` (sem chamador).

const PREFIX = 'shaderworkshop:';

// Chave estável por playground: caminho da página + id do elemento.
export function keyFor(pathname, id) {
  return PREFIX + pathname + '#' + (id || '');
}

// Grava texto. Retorna true se gravou, false se falhou.
export function save(storage, key, text) {
  try { storage.setItem(key, text); return true; } catch { return false; }
}

// Lê texto. Retorna a string salva, ou null se não há / falhou.
export function load(storage, key) {
  try { const v = storage.getItem(key); return (v === undefined ? null : v); } catch { return null; }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test`
Expected: PASS — 3 testes novos verdes (baseline 141 → 144).

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/localstore.js test/localstore.test.js
git commit -m "feat(motor): localstore.js (save/load do editor em localStorage, puro/injetavel)"
```

---

## Task 2: Wiring no `playground.js` — botão + salvar

**Files:**
- Modify: `site/assets/playground/playground.js`

> Sem unit test (Web Component precisa de browser). Garantia: não quebrar os 144 testes + prova Playwright na Task 4.

- [ ] **Step 1: Importar o localstore**

Em `site/assets/playground/playground.js`, após a linha de import do `./anim.js` (ou junto dos imports do topo), acrescentar:

```javascript
import { keyFor, save, load } from './localstore.js';
```

- [ ] **Step 2: Preparar storage + índice no `connectedCallback`**

No `connectedCallback`, logo após `this.controlValues = {}` ... `this.fullSource = this.cfg.fragment;` (antes de `this._t = 0;`), inserir:

```javascript
    this._store = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
    this._idx = [...document.querySelectorAll('shader-playground')].indexOf(this);
```

- [ ] **Step 3: Adicionar o helper de chave**

Adicionar um método na classe (perto de `_prefersReduced`):

```javascript
  _storeKey() {
    return keyFor(location.pathname, this.id || ('pg' + this._idx));
  }
```

- [ ] **Step 4: Adicionar o botão 💾 Salvar no `_render`**

No template de `_render`, dentro do bloco `.pg-buttons`, logo após o botão Reset (`<button class="pg-reset">↺ Reset</button>`), inserir (botão só quando há editor):

```javascript
          ${this.cfg.editableRegions.length ? '<button class="pg-save">💾 Salvar</button>' : ''}
```

- [ ] **Step 5: Ligar o listener do botão**

No `_render`, junto dos outros `addEventListener` (após o de `.pg-reset`), adicionar:

```javascript
    this.querySelector('.pg-save')?.addEventListener('click', () => this._save());
```

- [ ] **Step 6: Implementar `_save`**

Adicionar o método (perto de `_showSolution`):

```javascript
  _save() {
    if (!this.editor || !this._store) return;
    const ok = save(this._store, this._storeKey(), this.editor.value);
    if (ok) {
      this.statusEl.textContent = '💾 Salvo neste navegador.';
      this.statusEl.className = 'pg-status pg-ok';
    } else {
      this.statusEl.textContent = '⚠ Não consegui salvar (armazenamento cheio ou bloqueado).';
      this.statusEl.className = 'pg-status pg-erro';
    }
  }
```

- [ ] **Step 7: Rodar os testes (nada quebra)**

Run: `npm test`
Expected: PASS — 144 seguem verdes.

- [ ] **Step 8: Commit**

```bash
git add site/assets/playground/playground.js
git commit -m "feat(motor): botao Salvar (localStorage) nos playgrounds com editor"
```

---

## Task 3: Wiring no `playground.js` — restaurar ao abrir

**Files:**
- Modify: `site/assets/playground/playground.js`

- [ ] **Step 1: Implementar `_restore`**

Adicionar o método (perto de `_save`):

```javascript
  _restore() {
    if (!this.editor || !this._store) return;
    const texto = load(this._store, this._storeKey());
    if (texto === null) return;
    this.editor.value = texto;
    this.fullSource = reassemble(this.cfg.fragment, this.cfg.editableRegions[0], texto);
    this._restored = true;
  }
```

(`reassemble` já é importado no topo do arquivo — usado em `_applyEditorAndCompile`.)

- [ ] **Step 2: Chamar `_restore` e mostrar a mensagem na ordem certa**

No `connectedCallback`, trocar o trecho final:

```javascript
    this._render();
    this._compile();
    this._loop();
```
por:

```javascript
    this._render();
    this._restore();
    this._compile();
    if (this._restored) {
      this.statusEl.textContent = '↻ Retomei seu trabalho salvo.';
      this.statusEl.className = 'pg-status pg-ok';
    }
    this._loop();
```

(A mensagem vai DEPOIS do `_compile` porque o `_compile` no sucesso faz `statusEl.textContent = ''` — setar antes seria apagado.)

- [ ] **Step 3: Rodar os testes**

Run: `npm test`
Expected: PASS — 144 verdes.

- [ ] **Step 4: Verificar o smoke (nada de shader mudou)**

Run: `npm run smoke`
Expected: verde, 17 módulos. (O `_restore` não afeta compilação: sem salvo, `load` → null → segue o default.)

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/playground.js
git commit -m "feat(motor): restaura o editor salvo ao abrir (mensagem apos compile)"
```

---

## Task 4: Prova por Playwright (save → reload → restaurado)

**Files:**
- Create (temporário): `scripts/verify-localstore.mjs` (deletado no fim)

> A extensão Chrome costuma não conectar no ambiente de build. A prova do wiring (que só roda no browser) é um script Playwright throwaway, reusando o setup do `scripts/smoke.mjs` (server efêmero + swiftshader). Persistência testada DENTRO de um mesmo contexto de browser (localStorage sobrevive ao reload).

- [ ] **Step 1: Escrever o script de verificação**

Criar `scripts/verify-localstore.mjs`:

```javascript
// Verificação throwaway do #8 (localStorage). Salva no editor de um playground,
// recarrega a página e confirma que o texto voltou. Também confirma que um
// playground SEM editor não tem botão Salvar.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const SITE = join(process.cwd(), 'site');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0]);
    const fp = join(SITE, p === '/' ? 'index.html' : p);
    const body = await readFile(fp);
    res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('nf'); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}/modulos/12-luz-especular.html`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const MARCA = '/* TRABALHO-SALVO-123 */';

await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForFunction(() => { const e = document.getElementById('pg-projeto'); return e && e.querySelector('.pg-editor'); }, { timeout: 10000 });

// escreve uma marca no editor do projeto e salva
await page.evaluate((marca) => {
  const e = document.getElementById('pg-projeto');
  const ed = e.querySelector('.pg-editor');
  ed.value = marca + '\n' + ed.value;
  e.querySelector('.pg-save').click();
}, MARCA);

// um demo sem editor (pg-brilho? tem editor; usar pg-projeto vs um sem). Confere
// que existe ao menos um playground SEM botao salvar (demo sem editableRegions).
const semBotao = await page.evaluate(() => {
  return [...document.querySelectorAll('shader-playground')]
    .some((e) => !e.querySelector('.pg-editor') && !e.querySelector('.pg-save'));
});

// reload e confere que o editor voltou com a marca + mensagem de restauracao
await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
await page.waitForFunction(() => { const e = document.getElementById('pg-projeto'); return e && e.querySelector('.pg-editor'); }, { timeout: 10000 });
const r = await page.evaluate((marca) => {
  const e = document.getElementById('pg-projeto');
  const ed = e.querySelector('.pg-editor');
  const st = e.querySelector('.pg-status');
  return { temMarca: ed.value.includes(marca), status: st ? st.textContent : '' };
}, MARCA);

console.log('editor restaurou a marca?', r.temMarca, '| status:', JSON.stringify(r.status));
console.log('existe playground sem botao Salvar (demo)?', semBotao);
await browser.close();
await new Promise((res) => server.close(res));
const ok = r.temMarca && r.status.includes('Retomei') && semBotao;
console.log(ok ? 'VERIFY OK' : 'VERIFY FALHOU');
process.exit(ok ? 0 : 1);
```

- [ ] **Step 2: Rodar a verificação**

Run: `node scripts/verify-localstore.mjs`
Expected: `editor restaurou a marca? true`, status inclui "Retomei", `existe playground sem botao Salvar (demo)? true`, e `VERIFY OK` (exit 0).

Se falhar: o M12 tem 3 playgrounds — `pg-brilho` (mesh, com editor), `pg-projeto` (mesh, com editor, exportable) e `pg-ex-brilho` (com editor). Se NENHUM for sem-editor, o assert `semBotao` falha falso-negativo → trocar a página de teste por uma com um demo sem editor (ex. `02-pixel-e-cor.html`, cujo `pg-demo`/gradiente não tem editableRegions) ou ajustar o assert pra abrir um segundo módulo. Confirmar antes qual playground do M12/M2 não tem editor.

- [ ] **Step 3: Deletar o script throwaway**

```bash
rm scripts/verify-localstore.mjs
```

- [ ] **Step 4: Confirmar tree limpo**

Run: `git status --short`
Expected: vazio (o script foi deletado; nada a commitar nesta task).

---

## Task 5: Fechamento

**Files:** nenhum.

- [ ] **Step 1: Verificação final**

Run: `npm test` → Expected: PASS (144).
Run: `npm run smoke` → Expected: verde, 17 módulos.

- [ ] **Step 2: Push**

```bash
git push
```

- [ ] **Step 3: Fechamento**

Item #8 completo: `localstore.js` + botão 💾 Salvar em todo editor + restauração ao abrir (não-destrutiva). Sem mudança de motor GLSL. `main` em dia, working tree limpo.

---

## Self-Review (cobertura do spec)

- **§1 escopo (todo editor, botão explícito, restaurar ao abrir, Reset não-destrutivo)** → Task 2 (botão quando `editableRegions.length`), Task 3 (restaurar), `_reset` intacto (não mexe no salvo). ✓
- **§2 política (zero motor GLSL, degrada em silêncio)** → Task 1 (try/catch), Task 3 Step 4 (smoke 17). ✓
- **§3.1 localstore.js (keyFor/save/load, sem clear)** → Task 1. ✓
- **§3.2 wiring (import, _store, _idx, _storeKey, botão, _save, _restore, ordem do connectedCallback)** → Tasks 2 e 3. ✓
- **§3.2 GOTCHA mensagem após _compile** → Task 3 Step 2. ✓
- **§4 UX (botão no .pg-buttons, msg "neste navegador", sem CSS novo)** → Task 2 Steps 4/6. ✓
- **§5 testes (localstore.test.js; prova Playwright; smoke 17; regressão demo sem botão)** → Task 1 + Task 4 (inclui assert do demo sem botão). ✓
- **§7 riscos (chave estável/fallback _idx; set config re-inicializa → _restore idempotente; privacidade)** → Task 2 Step 2/3 (_idx, _storeKey); `_restore` é idempotente (lê e seta, sem efeito colateral). ✓
- **Consistência de nomes:** `keyFor`/`save`/`load`, `_store`/`_idx`/`_storeKey`/`_save`/`_restore`/`_restored`, classe `pg-save` — batem entre tasks. ✓
- **Contagem de testes:** 141 → 144 (T1: +3). T2–T5 sem teste node. ✓
