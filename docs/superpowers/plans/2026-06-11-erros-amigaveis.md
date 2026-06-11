# Mensagens de Erro GLSL Amigáveis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Traduzir o log cru de compilação GLSL numa dica PT-BR pro iniciante, mantendo o erro técnico cru num `<details>` colapsável.

**Architecture:** Função pura `friendlyError(rawLog)` num módulo novo `glslerrors.js` (testável em node), consumida pelo `_compile` catch do `playground.js`. Beneficia todos os playgrounds. Sem número de linha na dica (o header injetado desloca as linhas do GLSL).

**Tech Stack:** JS vanilla (ES module), `node --test`, `npm run smoke`, Chrome MCP.

**Spec:** `docs/superpowers/specs/2026-06-11-erros-amigaveis-design.md`.

**Baseline:** 120 testes node passam; `npm run smoke` verde (16 módulos).

---

## Task 1: friendlyError + integração no motor

**Files:**
- Create: `site/assets/playground/glslerrors.js`
- Create: `test/glslerrors.test.js`
- Modify: `site/assets/playground/playground.js` (import + `escapeHtml` + `_compile` catch)
- Modify: `site/assets/css/playground.css` (estilo `.pg-erro-tec`)

- [ ] **Step 1: Escrever o teste que falha**

Criar `test/glslerrors.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { friendlyError } from '../site/assets/playground/glslerrors.js';

test('undeclared identifier -> causa + token', () => {
  const d = friendlyError("ERROR: 0:3: 'cor' : undeclared identifier");
  assert.match(d, /não foi declarado/);
  assert.ok(d.includes('cor'));
});

test('syntax error -> fala de ponto-e-virgula/parenteses', () => {
  const d = friendlyError("ERROR: 0:5: '' : syntax error");
  assert.match(d, /digitação|ponto-e-vírgula|parêntese/);
});

test('tipos que nao batem (constructor)', () => {
  const d = friendlyError("ERROR: 0:4: 'constructor' : not enough data provided for construction");
  assert.match(d, /tipos/);
});

test('funcao inexistente -> dica de funcao com token', () => {
  const d = friendlyError("ERROR: 0:2: 'foo' : no matching overloaded function found");
  assert.match(d, /função/);
  assert.ok(d.includes('foo'));
});

test('redefinition -> declarado duas vezes', () => {
  const d = friendlyError("ERROR: 0:6: 'x' : redefinition");
  assert.match(d, /duas vezes/);
});

test('log irreconhecivel ou vazio -> fallback', () => {
  assert.match(friendlyError('algo estranho sem padrao'), /não compilou/);
  assert.match(friendlyError(''), /não compilou/);
});

test('undeclared sem token -> fallback sem aspas vazias', () => {
  const d = friendlyError("ERROR: 0:1: '' : undeclared identifier");
  assert.match(d, /não compilou/);
  assert.ok(!d.includes("''"));
});

test('pula WARNING e acha a primeira linha ERROR:', () => {
  const log = "WARNING: 0:1: blah\nERROR: 0:3: 'cor' : undeclared identifier";
  assert.match(friendlyError(log), /não foi declarado/);
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `glslerrors.test.js` falha (módulo não existe).

- [ ] **Step 3: Criar `site/assets/playground/glslerrors.js`**

```javascript
// Traduz o log cru de compilação GLSL numa dica PT-BR pro iniciante.
// PURO: string -> string. Lidera por causa + token; SEM número de linha
// (o motor injeta o header antes do código do aluno, então a linha do GLSL
// não corresponde ao que o aluno vê no editor). O log cru, com as linhas
// reais, continua disponível no <details> técnico do playground.
export function friendlyError(rawLog) {
  const line = String(rawLog || '').split('\n').find((l) => l.includes('ERROR:')) || '';
  // formato típico: ERROR: <a>:<linha>: '<token>' : <mensagem>
  const m = line.match(/ERROR:\s*\d+:\d+:\s*'([^']*)'\s*:\s*(.*)$/);
  const token = m ? m[1] : '';
  const msg = (m ? m[2] : '').toLowerCase();
  const has = (s) => msg.includes(s);

  if (has('undeclared identifier') && token) {
    return `🔤 '${token}' não foi declarado ou está escrito errado — confira a digitação (maiúsculas e minúsculas contam).`;
  }
  if (has('redefinition') && token) {
    return `🔁 '${token}' foi declarado duas vezes. Remova a declaração repetida.`;
  }
  if (has('no matching') || has('undeclared function')) {
    return token
      ? `🛠️ A função '${token}' não existe ou os argumentos estão errados.`
      : '🛠️ Uma função usada não existe ou os argumentos estão errados.';
  }
  if (has('cannot convert') || has('wrong operand types') || has('constructor')) {
    return '🔢 Os tipos não batem — ex.: misturar número (float) com cor (vec3) numa conta. Confira os tipos.';
  }
  if (has('syntax error')) {
    return '✏️ Erro de digitação — provavelmente faltou um ponto-e-vírgula (;) no fim de uma linha, ou um parêntese/chave.';
  }
  return '⚠️ O shader não compilou — confira a digitação na parte que você editou.';
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test`
Expected: PASS — 128 testes (120 + 8 novos).

- [ ] **Step 5: Integrar no `playground.js`**

(a) Adicionar o import junto aos outros (após a linha `import { withHeader, withHeaderMesh } from './header.js';`):

```javascript
import { friendlyError } from './glslerrors.js';
```

(b) Adicionar um helper `escapeHtml` no escopo de módulo (junto de `rgbToHex`/`hexToRgb`, perto do fim do arquivo):

```javascript
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
```

(c) Trocar o bloco `catch` do `_compile`. Localizar EXATAMENTE:

```javascript
    } catch (e) {
      this.statusEl.textContent = '⚠ ' + e.message;
      this.statusEl.className = 'pg-status pg-erro';
      this.program = null;
    }
```

Substituir por:

```javascript
    } catch (e) {
      const dica = friendlyError(e.message);
      const extra = this.cfg.solution ? ' (↺ Reset desfaz · 💡 Mostrar solução mostra a resposta)' : '';
      this.statusEl.innerHTML = '⚠ ' + escapeHtml(dica + extra) +
        ' <details class="pg-erro-tec"><summary>🔧 erro técnico (avançado)</summary><pre>' +
        escapeHtml(e.message) + '</pre></details>';
      this.statusEl.className = 'pg-status pg-erro';
      this.program = null;
    }
```

- [ ] **Step 6: Estilo `.pg-erro-tec` no `playground.css`**

Acrescentar ao fim de `site/assets/css/playground.css`:

```css
.pg-erro-tec { margin-top: 6px; font-size: 0.85em; }
.pg-erro-tec summary { cursor: pointer; color: #888; }
.pg-erro-tec pre { white-space: pre-wrap; background: #f3f0f0; padding: 6px; border-radius: 4px; overflow-x: auto; margin: 4px 0 0; }
```

- [ ] **Step 7: Rodar testes node + smoke**

Run: `npm test`
Expected: 128 pass, 0 fail.
Run: `npm run smoke`
Expected: verde — 16 módulos, todos os shaders bons compilam (a mudança é só no caminho de ERRO; não afeta shaders que compilam).

- [ ] **Step 8: Verificar no Chrome (gate da integração)**

Servir (`npm run serve`) e abrir `http://localhost:8000/modulos/00-comecando.html`. No editor do `pg-tour`, quebrar de propósito (ex.: trocar `vec3 cor = vec3(0.2, 0.6, 1.0);` por `vec3 cor = vec3(nao, 0.6, 1.0);`) e clicar ▶ Test Drive. Confirmar:
- O status mostra a **dica amigável** (ex.: "🔤 'nao' não foi declarado...") — NÃO o log cru.
- Há um `<details>` "🔧 erro técnico (avançado)" que, expandido, mostra o log cru real.
- `↺ Reset` recupera (volta ao shader bom, canvas azul).
- Console sem erro de JS.

- [ ] **Step 9: Commit + push**

```bash
git add site/assets/playground/glslerrors.js test/glslerrors.test.js site/assets/playground/playground.js site/assets/css/playground.css
git commit -m "feat(motor): mensagens de erro GLSL amigaveis (friendlyError + erro tecnico colapsavel)"
git push
```

## Notes
- A dica usa texto plano (sem markdown/backticks) porque vai pra HTML — backtick apareceria literal.
- `escapeHtml` é obrigatório: o log cru contém `<`/`>` em erros de sintaxe e o token vai dentro da dica.
- Não tentar mapear número de linha pro editor (deferido no spec §6).

## Self-Review (cobertura do spec)
- **§2.1 módulo puro `glslerrors.js` + padrões (undeclared/syntax/tipos/função/redefinition/fallback) + token vazio + primeira linha ERROR:** → Step 3 (código) + Step 1 (testes cobrindo cada um, incl. WARNING-skip e token-vazio). ✓
- **§2.2 integração `_compile` (innerHTML + details + escapeHtml + empurrão se solution)** → Step 5. ✓
- **§2.3 sem número de linha na dica** → Step 3 (a função nunca emite linha). ✓
- **§3 CSS `.pg-erro-tec`** → Step 6 (em playground.css, onde moram as classes `.pg-*`). ✓
- **§4 testes node** → Step 1 (8 testes). ✓
- **§5 verificação Chrome** → Step 8. ✓
- **§7 escape HTML (XSS/layout)** → Step 5(b)(c). ✓
- **Consistência:** `friendlyError` nome igual em módulo/import/testes; `glslerrors.js` sem hífen (convenção); catch antigo casado exato. ✓
- **Contagem:** 120 → 128 node; smoke segue 16 verde. ✓

(NOTA: o teste do Step 1 tem 8 casos → 128, não 127; a contagem no plano usa 128.)
