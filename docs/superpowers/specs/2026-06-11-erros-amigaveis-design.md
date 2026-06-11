# Mensagens de Erro GLSL Amigáveis — Design

**Data:** 2026-06-11. **Pré-requisito:** motor `ShaderPlayground` existente. **Item #4 do backlog de melhorias.**
**Origem:** auditoria — aluno zero-programação que erra no editor (projetos abertos, tour do M0, exercícios) vê o **log cru de GLSL** (`ERROR: 0:3: 'cor' : undeclared identifier`), incompreensível pro iniciante. Fecha a história de debugging que o M0 começou.

## 1. Escopo e objetivo

Traduzir o erro de compilação de shader numa **dica em PT-BR** acionável pro iniciante, mantendo o erro técnico cru acessível pro curioso/professor. Mudança de **motor** — beneficia todos os ~31 playgrounds de uma vez. Sem mudança de conteúdo de módulo.

## 2. Arquitetura

### 2.1 `site/assets/playground/glslerrors.js` (novo, PURO, testável em node)
- Exporta `friendlyError(rawLog)` → string PT-BR amigável (a **causa**, sem número de linha).
- Puro string→string (igual config/header/pixeldiff): testável em node sem WebGL.
- Parseia o log buscando a **primeira linha que contém `ERROR:`** (pula WARNINGs ou ruído antes), formato `ERROR: <a>:<linha>: '<token>' : <mensagem>` (extrai `token` e `mensagem`; ambos podem vir vazios). Usa só essa linha-raiz (o resto costuma ser cascata).
- Mapeia por padrão da `<mensagem>` (case-insensitive), liderando por causa + token:
  - `undeclared identifier` → ``🔤 '<token>' não foi declarado ou está escrito errado — confira a digitação (maiúsculas e minúsculas contam).``
  - `syntax error` → ``✏️ Erro de digitação — provavelmente faltou um `;` no fim de uma linha, ou um parêntese/chave.``
  - `cannot convert` | `wrong operand types` | `constructor` → ``🔢 Os tipos não batem — ex.: misturar número (`float`) com cor (`vec3`) numa conta. Confira os tipos.``
  - `no matching overloaded function` | `'<token>' : no matching` | `undeclared function` → ``🛠️ A função '<token>' não existe ou os argumentos estão errados.``
  - `redefinition` → ``🔁 '<token>' foi declarado duas vezes. Remova a declaração repetida.``
  - **fallback** (qualquer outra) → ``⚠️ O shader não compilou — confira a digitação na parte que você editou.``
- Se `<token>` vier vazio, usar a frase sem o token (ex.: undeclared sem token → fallback genérico).
- Erros menos comuns (ex.: `l-value required`, `dimension mismatch`, atribuição inválida) caem no **fallback** de propósito — melhor uma dica genérica honesta que uma tradução errada. O `<details>` técnico sempre traz o log real pra esses casos.
- Entrada vazia/sem `ERROR:` reconhecível → retorna o fallback.

### 2.2 `site/assets/playground/playground.js` (`_compile` catch)
- Hoje: `this.statusEl.textContent = '⚠ ' + e.message` (log cru).
- Novo: monta a dica + o erro técnico colapsável:
  - `const dica = friendlyError(e.message);`
  - status passa a usar `innerHTML` com a dica + um `<details class="pg-erro-tec"><summary>🔧 erro técnico (avançado)</summary><pre>RAW</pre></details>`.
  - **ESCAPAR HTML** da dica e do log cru antes de injetar (o log contém `'<'`/`'>'` em erros de sintaxe; a dica contém o token). Helper local `escapeHtml(s)`.
  - Manter a classe `pg-status pg-erro` (estilo de erro existente).
- O "empurrão" (↺ Reset / 💡 Mostrar solução) NÃO entra na função pura — o motor já tem esses botões visíveis; opcionalmente o status acrescenta uma frase curta "Dica: ↺ Reset desfaz; 💡 Mostrar solução mostra a resposta." quando `this.cfg.solution` existe. (Mantém `friendlyError` puro e sem estado.)

### 2.3 Sem número de linha na dica (decisão)
O motor injeta o header (precision + uniforms) ANTES do código do aluno (`withHeader`/`withHeaderMesh`), então `0:N` do GLSL é deslocado em relação ao que o aluno vê — e o editor mostra só a **região editável**, não o shader inteiro. Logo, número de linha na dica engana. A dica lidera por **causa + token** (confiável); o número de linha real fica só no `<details>` do erro técnico.

## 3. CSS
- Acrescentar em `headfirst.css` (ou `playground.css`) um estilo discreto pra `.pg-erro-tec` (fonte menor, monospace no `<pre>`, recuo). Pequeno, escopado.

## 4. Testes
- `test/glsl-errors.test.js` (node): pra cada padrão, um log de exemplo real → asserta que a dica contém a frase-chave esperada e o token quando aplicável. Casos:
  - `ERROR: 0:3: 'cor' : undeclared identifier` → contém "não foi declarado" e "cor".
  - `ERROR: 0:5: '' : syntax error` → contém "digitação" e "`;`".
  - `ERROR: 0:4: 'constructor' : not enough data ...` → contém "tipos".
  - `ERROR: 0:2: 'foo' : no matching overloaded function` → contém "função" e "foo".
  - `ERROR: 0:6: 'x' : redefinition` → contém "duas vezes".
  - log irreconhecível / vazio → contém "não compilou" (fallback).
  - token vazio em undeclared → fallback (sem token órfão).
- (O smoke test não cobre isto — ele vê o shader COMPILAR; a qualidade da mensagem de ERRO é justamente o que ele não testa. Por isso o unit node é o gate.)
- Não há teste node do `_compile` (gl.js/playground.js são verificados no navegador) — a integração é verificada no Chrome (Step de verificação).

## 5. Verificação no navegador (gate)
Forçar um erro real num playground (ex.: digitar `cor x` no editor do M0 e Test Drive) e confirmar: aparece a dica amigável (não o log cru) + o `<details>` "erro técnico" com o log real; `↺ Reset` recupera. Console sem erro de JS.

## 6. Fora de escopo
- Mapear o número de linha do GLSL pra linha do editor (frágil pelo offset do header + região editável). Deferido; provavelmente não vale.
- Sublinhar/realçar o trecho do erro no editor (editor é `<textarea>` simples).
- Traduzir TODOS os erros possíveis de GLSL — só os padrões comuns de iniciante + fallback.
- Internacionalização (curso é PT-BR).

## 7. Riscos
- **XSS/quebra de layout pelo log cru:** §2.2 — escapar HTML da dica e do log antes de `innerHTML`.
- **Padrões de mensagem variam entre drivers/GPUs:** o parser casa por substring tolerante (`includes`/regex frouxo), com fallback garantido — nunca pior que hoje.
- **Regressão no caminho de erro do motor:** unit cobre a função pura; verificação no Chrome cobre a integração; o smoke segue garantindo que os shaders bons compilam.

## 8. Git
Direto em `main`. Um commit. Conventional Commits.
