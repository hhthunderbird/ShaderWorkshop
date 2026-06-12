# Salvar Trabalho (localStorage) — Design

**Data:** 2026-06-12. **Pré-requisito:** motor `ShaderPlayground` (editor + região editável). **Item #8 do backlog (salvar trabalho).**
**Origem:** backlog "melhorar o curso", em ordem numérica (#1/#2 dependem do usuário → pulados; #6 feito; **#8 é o próximo acionável**). O aluno edita o Efeito Autoral (M12) e os exercícios, mas perde tudo ao fechar a aba. Já existem **Baixar PNG** e **Copiar shader** (export manual) — falta persistir entre sessões, no próprio navegador.

## 1. Escopo e objetivo

Permitir que o aluno **salve o conteúdo do editor** de qualquer playground que tenha região editável, e que esse trabalho seja **restaurado ao reabrir a página** — tudo em `localStorage` (por-navegador, sem nuvem).

**Decisões travadas (via brainstorming):**
- **Escopo: TODOS os editores** (não só os 3 Projetos-Vitória). Qualquer `<shader-playground>` com `editableRegions` ganha o recurso.
- **Gatilho: botão explícito `💾 Salvar`** (não auto-save). Como salvar é uma escolha do aluno, restaurar ao abrir não surpreende.
- Restaurar é automático ao carregar (se houver salvo). **Reset é não-destrutivo:** volta o editor ao original mas NÃO apaga o salvo. **`Save` é o único que escreve** o slot. Para descartar um trabalho salvo, o aluno faz Reset (editor volta ao original) e Save de novo (sobrescreve o slot com o original). Decisão deliberada: evita perder o Efeito Autoral num clique acidental de Reset.

**Escopo cortado (YAGNI):** sem nuvem/conta; sem múltiplos slots ou histórico de versões; sem export/import de arquivo (Baixar PNG + Copiar shader já cobrem compartilhar); **sem auto-save**.

## 2. Política respeitada
- **Zero mudança no motor GLSL** (nada de shader/render). Só estado do editor + UI. `npm run smoke` deve seguir 17 verde.
- Degrada em silêncio: `localStorage` ausente, bloqueado (modo privado) ou com quota estourada **não pode quebrar** o playground — try/catch em toda operação.

## 3. Componentes

### 3.1 `site/assets/playground/localstore.js` (novo, puro/injetável)
Módulo sem dependência de DOM, recebe o `storage` por parâmetro → testável em node com um mock. Em produção, o `playground.js` passa `window.localStorage`.

```javascript
const PREFIX = 'shaderworkshop:';

// Chave estável por playground: caminho da página + id do elemento.
export function keyFor(pathname, id) {
  return PREFIX + pathname + '#' + (id || '');
}

// Grava texto. Retorna true se gravou, false se falhou (quota/bloqueado).
export function save(storage, key, text) {
  try { storage.setItem(key, text); return true; } catch { return false; }
}

// Lê texto. Retorna a string salva, ou null se não há / falhou.
export function load(storage, key) {
  try { const v = storage.getItem(key); return (v === undefined ? null : v); } catch { return null; }
}
```
(Sem `clear()`: o modelo é não-destrutivo — só `save` escreve. Não há chamador para apagar, então não se implementa o que não se usa.)

(`getItem` de `localStorage` retorna `null` quando ausente; o mock de teste pode retornar `undefined` — daí o `=== undefined ? null`.)

### 3.2 `site/assets/playground/playground.js` (wiring fino)
- **Import:** `import { keyFor, save, load } from './localstore.js';`
- **Helper de chave:** método `_storeKey()` → `keyFor(location.pathname, this.id || ('pg' + this._idx))`. `this._idx` é um fallback posicional (índice do elemento entre os `shader-playground` da página) só usado quando não há `id`. Definir `this._idx` no `connectedCallback` via `[...document.querySelectorAll('shader-playground')].indexOf(this)`.
- **Storage:** `this._store = (typeof window !== 'undefined' && window.localStorage) || null;` (guarda; se null, recurso desligado).
- **Botão:** no `_render`, dentro de `.pg-buttons`, adicionar `💾 Salvar` **quando há editor** (`this.cfg.editableRegions.length`): `<button class="pg-save">💾 Salvar</button>`. Listener → `this._save()`.
- **Restaurar ao conectar:** no `connectedCallback`, depois de `this._render()` (que monta o editor) e ANTES do `_compile()`, chamar `this._restore()`:
  - Se `this._store` e há editor e `load(this._store, this._storeKey())` retorna texto não-nulo: setar `this.editor.value = textoSalvo`, `this.fullSource = reassemble(this.cfg.fragment, this.cfg.editableRegions[0], textoSalvo)`, e marcar uma flag `this._restored = true`.
  - **GOTCHA:** `_compile()` no sucesso faz `statusEl.textContent = ''` — então NÃO mostrar a mensagem dentro de `_restore`. Depois do `_compile()` no `connectedCallback`, se `this._restored`, setar `this.statusEl.textContent = '↻ Retomei seu trabalho salvo.'` e classe `pg-ok`. Assim a mensagem sobrevive ao clear do `_compile`.
- **Salvar:** `_save()` → se há editor e store: `save(this._store, this._storeKey(), this.editor.value)`; status `💾 Salvo neste navegador.` (classe `pg-ok`) ou, se `save` retornou false, `⚠ Não consegui salvar (armazenamento cheio ou bloqueado).` (classe `pg-erro`).
- **Reset NÃO mexe no salvo:** `_reset()` segue como hoje (volta editor/controles ao `cfg` default, recompila). Não toca em `localStorage`. O slot salvo só muda quando o aluno clica Salvar de novo (sobrescreve). Modelo não-destrutivo.

**Ordem no `connectedCallback` (importa):** `_render()` → `_restore()` → `_compile()` → (se `_restored`, setar status "↻…") → `_loop()`. O `_restore` precisa do editor já montado (`_render`) e precisa rodar antes do `_compile` pra compilar com o texto salvo; a mensagem vai depois do `_compile` (que limpa o status no sucesso).

## 4. UX
- `💾 Salvar` aparece ao lado de Reset/Conferir/Mostrar-solução/Baixar/Copiar, mesma estilização (classe `pg-save`, reusa o estilo genérico de `.pg-buttons button`). **Sem CSS novo.**
- Mensagens no `.pg-status` (já é `aria-live="polite"`): a de Salvar deixa claro que é **neste navegador** (não nuvem). A de restaurar avisa que o trabalho voltou.
- Salvar é por-página-por-playground: salvar o `pg-projeto` do M12 não afeta o do M10 (chaves distintas pelo pathname).

## 5. Testes e verificação
- **`test/localstore.test.js`** (node, mock storage = wrapper sobre um `Map`):
  - `keyFor` determinístico e com prefixo (`keyFor('/a.html','pg-x')` estável; ids diferentes → chaves diferentes).
  - roundtrip: `save` então `load` devolve o texto; sobrescrever com novo `save` → `load` devolve o novo.
  - `load` de chave ausente → null.
  - storage que lança em `setItem`/`getItem` (mock que joga) → `save` retorna false, `load` não propaga e retorna null.
- **Wiring (Web Component) → prova por Playwright** (mesmo método do #6, extensão Chrome costuma não conectar no build): abrir um módulo com editor, escrever um marcador no editor, clicar 💾 Salvar, **reload da página**, confirmar que o editor reabre com o texto salvo (e o status "↻ Retomei…"). Confirmar também que um playground SEM editor (demo) não tem o botão Salvar. Throwaway, deletado ao fim.
- **`npm run smoke`** deve seguir **17 verde** (sem mudança de shader).
- **Regressão:** playgrounds SEM editor (demos, ex. M2 gradiente) não mostram o botão Salvar e seguem iguais.
- Baseline de testes node: **141** → +1 arquivo (`localstore.test.js`, alguns `test(...)`).

## 6. Arquivos
**Criar:** `site/assets/playground/localstore.js`, `test/localstore.test.js`.
**Modificar:** `site/assets/playground/playground.js` (import + `_storeKey`/`_restore`/`_save`, botão, ordem do `connectedCallback`, `clear` no `_reset`).

## 7. Riscos / pontos de atenção
- **Chave estável:** depende de `location.pathname` + `id`. Os 3 Projetos-Vitória usam `id="pg-projeto"` em páginas distintas → o pathname distingue. Exercícios têm ids próprios (`pg-ex`, etc.). Sem id, o fallback posicional pode colidir se a página mudar a ordem dos playgrounds depois de um save — risco baixo e tolerável (pior caso: restaura no playground errado uma vez; Reset volta o editor ao original na hora, e um novo Save corrige o slot).
- **`set config` re-inicializa:** o `.config` setter chama `connectedCallback` de novo (módulo ES roda após upgrade). `_restore` roda lá → ok, restaura na (re)inicialização real, que é quando a config existe. Conferir que não dá dupla-restauração visível (idempotente: ler o salvo e setar o editor é idempotente).
- **`_idx` em re-render:** calcular `_idx` uma vez por conexão; `querySelectorAll` na hora do connect é estável.
- **Privacidade:** salva só o texto do shader do aluno, em `localStorage` local. Sem dado pessoal, sem rede. OK.
