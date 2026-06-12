# Módulo 16 Bônus "Transparência: o Alpha" — Design

**Data:** 2026-06-12. **Pré-requisito:** motor `ShaderPlayground` (fragment mode), M2 (vec4/cor), M4 (formas/`length`). **Item #6 do backlog (transparência/alpha).**
**Origem:** backlog "melhorar o curso", indo em ordem numérica (#1/#2 dependem do usuário → pulados; #6 é o primeiro acionável). O backlog sempre previu este item como "M16 — precisa `gl.BLEND`+backdrop no motor".

## 1. Escopo e objetivo

Ensinar **transparência via alpha blending** num módulo bônus pós-curso (igual ao M15 "Placa de Vídeo"): NÃO conta nos 14 módulos do curso. Cobre o 4º canal do `vec4` (o `.a` que sempre foi `1.0`), a fórmula src-over, a necessidade de um fundo pra enxergar o efeito, e a regra "ordem importa" (pintar de trás pra frente).

**Escopo travado (YAGNI):**
- Modo **fragment apenas**. Mesh + transparência (depth+alpha = bug clássico de ordenação) **NÃO** é feature — vira um `Cuidado!` que explica por que jogos ordenam objetos transparentes por último.
- Sem premultiplied alpha, sem outras blend equations além de src-over, sem ordenação automática. Só o caso canônico `SRC_ALPHA, ONE_MINUS_SRC_ALPHA`.

## 2. Decisão técnica central: backdrop honesto (2 passes no GL)

Pra `gl.BLEND` significar algo, o alpha precisa misturar contra **algo já no framebuffer**. Decisão travada: **passe de fundo no GL**.

- O motor desenha primeiro um **quad de fundo opaco** (shader de xadrez fixo do motor), depois o shader do aluno com `BLEND` ligado.
- Honesto: o alpha mistura de verdade contra o `dst` no framebuffer (`resultado = frente.rgb*a + fundo.rgb*(1-a)`).
- Rejeitadas: (B) `mix(fundo, frente, a)` no próprio shader = composição manual, mente sobre o que BLEND faz; (C) alpha vazar pra página via CSS = quem compõe é o browser, não `gl.BLEND`. O curso tem gate de exatidão técnica — o demo precisa ser o blend real.

## 3. Mudanças no motor

**Política preservada:** sem backdrop → comportamento atual 100% intacto (BLEND off, 1 draw). Nenhum módulo M0–M15 muda de render.

### 3.1 `site/assets/playground/config.js`
- Novo campo `backdrop`: aceita string `'xadrez'` (default null). Validação no padrão dos outros campos (`typeof === 'string'` e valor conhecido, senão null).
- A presença de `backdrop` é o que liga o caminho 2-pass + BLEND. Sem novo campo `blend` separado (YAGNI).

### 3.2 `site/assets/playground/gl.js`
- Novo export `BACKDROP_FRAGMENTS` (ou similar): um mapa `{ xadrez: '<glsl fixo>' }`. O xadrez usa `v_uv` + `step`/`mod` pra duas cores cinza-claro/cinza (padrão de tabuleiro reconhecível). Opaco (`gl_FragColor.a = 1.0`).
- `renderFrame` (ou uma variante/parâmetro): quando há backdrop, a sequência vira:
  1. `gl.disable(gl.DEPTH_TEST)` (fragment 2D não precisa de depth; garante que o passe 2 fique por cima do passe 1).
  2. `gl.disable(gl.BLEND)`; `clear`; desenha o **programa de backdrop** (quad fullscreen).
  3. `gl.enable(gl.BLEND)`; `gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)`; desenha o **programa do aluno** (mesmo quad).
  4. `gl.disable(gl.BLEND)` ao fim (deixa o estado limpo pro próximo frame/playground).
- Sem backdrop → o `clear` opaco + 1 draw de hoje, com BLEND garantidamente off.
- Detalhe de exatidão: o backdrop e o shader do aluno compartilham o mesmo quad/atributos (`a_pos`/`a_uv`); o motor só troca o `program` entre os dois draws.

### 3.3 `site/assets/playground/playground.js`
- `_compile`: quando `cfg.backdrop`, compila **dois** programas — o de backdrop (vertex padrão fragment + `BACKDROP_FRAGMENTS[cfg.backdrop]`) e o do aluno (como hoje). Guardar ambos.
- `_loop`/render: passar os dois programas pro render quando houver backdrop.
- O backdrop é fixo (não editável); só o programa do aluno passa por `withHeader`/região editável/erros amigáveis.
- Reset/re-config: re-compila os dois (seguir o padrão existente do setter `.config`).

## 4. Conteúdo do módulo (`site/modulos/16-transparencia.html`)

Estrutura Head First padrão (mesma `<head>`; `<body class="hf">`). Breadcrumb: `<p><a href="../index.html">← Mapa do curso</a> · 🎁 Bônus · Módulo Extra</p>` (igual M15, **sem** "de 14").

Seções em ordem (o teste de integração trava os marcos):
1. `<h1>Transparência: o Alpha</h1>` + gancho: vidro, água, fumaça, menus que deixam ver o jogo atrás. "Até agora toda cor terminava em `1.0`. Esse 4º número tem nome: **alpha**."
2. `<h2>O 4º número do vec4</h2>` — retoma `vec4(r, g, b, a)` do M2; `a = 1.0` opaco, `a = 0.0` invisível. **Pra ver alpha você precisa de um fundo** (sem fundo, contra preto, só escurece).
3. `<h2>Veja o alpha funcionando</h2>` + **`pg-alpha`** (demo): xadrez opaco + círculo colorido por cima, slider `u_alpha` 0→1. Texto: baixe o alpha e veja o xadrez vazar pelo círculo.
4. `<h2>A receita da mistura</h2>` + SVG `blend-formula.svg` + fórmula em prosa: `resultado = frente.rgb * a + fundo.rgb * (1 - a)`. Conectar: `a = 1` → só frente; `a = 0` → só fundo; `a = 0.5` → meio a meio. Mencionar que é o motor (`gl.BLEND`) que faz essa conta, automaticamente, contra o que já está pintado.
5. `<h2>Ordem importa</h2>` + SVG `blend-ordem.svg` (trás→frente) + `<div class="cuidado">`: como a mistura é contra o que **já** está no framebuffer, pintar fora de ordem dá resultado errado. Regra: **fundo primeiro, transparências por último, de trás pra frente.** Nota sobre 3D: por isso jogos não confiam só no Z-buffer pra transparência (objeto transparente deixaria passar quem está atrás dele) — ordenam manualmente. **(É o lugar do `Cuidado!` que justifica mesh-fora-de-escopo do motor.)**
6. `<h2>Sua vez: deixe ver através</h2>` + `<div class="afie">` de previsão + **exercício `pg-ex`**: o aluno escreve o `.a` do `gl_FragColor`. **Predict-observe + Mostrar solução, SEM pixel-diff** (backdrop 2-pass torna o gen-ref custoso; consistente com M10/M12).
7. `<div class="qa">` Head First: "Por que contra preto só escurece? (Porque misturar com preto `(0,0,0)` puxa tudo pra baixo — você precisa de um fundo com cor pra ver a transparência.)"; "Alpha é o mesmo que opacidade? (É o complemento: `a=1` opaco, `a=0` transparente. Alguns programas mostram 'opacidade 70%' = `a=0.7`.)".
8. Nav: voltar pro index (Bônus). Sem "Próximo" de curso (é folha bônus, igual M15).

## 5. Configs exatas (o que erra fácil)

**`pg-alpha` (demo):**
```js
{
  mode: 'fragment',
  backdrop: 'xadrez',
  fragment: `precision mediump float;
uniform float u_alpha;
void main() {
  float d = length(v_uv - 0.5);
  // fora do círculo: totalmente transparente (deixa o xadrez puro)
  float dentro = 1.0 - step(0.3, d);
  vec3 cor = vec3(1.0, 0.4, 0.1);
  gl_FragColor = vec4(cor, u_alpha * dentro);
}`,
  uniforms: [{ name: 'u_alpha', label: 'alpha (transparência)', min: 0.0, max: 1.0, value: 0.6 }],
}
```
(`v_uv` injetado pelo motor. `dentro` = 1 no círculo, 0 fora → fora fica `a=0` e mostra o xadrez cru; dentro, o `u_alpha` controla a mistura.)

**`pg-ex` (exercício):**
```js
{
  mode: 'fragment',
  backdrop: 'xadrez',
  fragment: `precision mediump float;
void main() {
  float d = length(v_uv - 0.5);
  float dentro = 1.0 - step(0.3, d);
  vec3 cor = vec3(0.2, 0.6, 1.0);
// >>> EDIT: alpha
  float a = 1.0;
// <<< EDIT
  gl_FragColor = vec4(cor, a * dentro);
}`,
  editableRegions: ['alpha'],
  solution: '  float a = 0.5;',
}
```
(Começa `a = 1.0` → círculo opaco tampa o xadrez. Solução `a = 0.5` → metade transparente, o xadrez aparece por baixo. `solution` → Mostrar solução; SEM `reference` → sem Conferir.)

O xadrez do motor (esboço, `BACKDROP_FRAGMENTS.xadrez`):
```glsl
precision mediump float;
void main() {
  vec2 g = floor(v_uv * 8.0);
  float c = mod(g.x + g.y, 2.0);
  vec3 cor = mix(vec3(0.85), vec3(0.55), c);
  gl_FragColor = vec4(cor, 1.0);
}
```
(`v_uv` injetado por `withHeader`. 8×8 células. Opaco.)

## 6. SVGs
- `site/assets/img/blend-formula.svg`: três quadros — frente (laranja, "a=0.5") **sobre** fundo (xadrez) **=** resultado misturado; com a fórmula `frente·a + fundo·(1−a)`.
- `site/assets/img/blend-ordem.svg`: duas pilhas — "ordem certa: fundo → meio → frente ✓" vs "fora de ordem ✗" — mostrando que o resultado muda.

## 7. Index + glossário + professor
- `site/index.html`: na seção Bônus (que já tem o M15), acrescentar o card do M16 "Transparência: o Alpha".
- `site/glossario.html`: acrescentar **alpha** (4º canal do vec4; transparência → M16) e **blending / alpha blending** (mistura da cor nova com a já pintada → M16), mantendo a ordem alfabética. Atualizar a contagem de termos se o arquivo a expuser.
- `site/professor/16-guia.md`: objetivo (alpha + por que precisa de fundo + ordem), quando usar (bônus, opcional, após o curso), o que NÃO cobrar (não é cálculo de blend equations; é a intuição "frente sobre fundo"), nota de que o `Cuidado!` de ordem/depth é o gancho honesto pra "por que 3D é mais difícil".

## 8. Testes e verificação
- **`test/config.test.js`** (ou onde os testes de config vivem): asserts do campo `backdrop` — string conhecida vira o valor, desconhecida/ausente vira null; sem `backdrop` o config segue como hoje.
- **`test/module16.integration.test.js`** (novo): o HTML tem `id="pg-alpha"`, `backdrop: 'xadrez'`, slider `u_alpha`, o exercício `id="pg-ex"` com `editableRegions: ['alpha']` + `solution` e **sem** `reference:`; tem `class="cuidado"` (ordem); breadcrumb Bônus; NÃO contém "de 14".
- **`test/module16` (index/glossário):** index referencia `16-transparencia.html`; glossário referencia `alpha`/`blending`. (Pode ser assert no mesmo arquivo.)
- **Shader NOVO (backdrop pass + 2 demos)** → **gate Chrome obrigatório**: servir `npm run serve`, abrir `/modulos/16-transparencia.html`, confirmar: `pg-alpha` mostra xadrez + círculo laranja; baixar o slider de alpha faz o xadrez aparecer dentro do círculo (não só escurecer); `pg-ex` começa opaco e Mostrar-solução revela o xadrez por baixo; console sem erro GLSL.
- **`npm run smoke`** deve virar **17 módulos** (o smoke varre `site/modulos/*.html`; confirmar que ele inclui o novo arquivo e fica verde).
- Contagem de testes node sobe (config + module16). Baseline atual: **136**.

## 9. Arquivos (resumo)
**Criar:** `site/modulos/16-transparencia.html`, `site/professor/16-guia.md`, `site/assets/img/blend-formula.svg`, `site/assets/img/blend-ordem.svg`, `test/module16.integration.test.js`.
**Modificar:** `site/assets/playground/config.js` (campo backdrop), `site/assets/playground/gl.js` (BACKDROP_FRAGMENTS + 2-pass), `site/assets/playground/playground.js` (compila 2 programas), `site/index.html` (card Bônus M16), `site/glossario.html` (alpha/blending), `test/config.test.js` (asserts backdrop).

## 10. Riscos / pontos de atenção
- **Estado de BLEND vazando entre playgrounds/frames:** vários playgrounds compartilham contexto? Não — cada `<shader-playground>` tem seu próprio canvas/contexto. Ainda assim, desligar BLEND ao fim do render evita surpresa se o motor reusar estado entre frames.
- **DEPTH_TEST off no fragment:** hoje o fragment mode liga DEPTH_TEST (inócuo com 1 quad). Com backdrop, desligar é necessário pros 2 quads coexistirem. Conferir que isso não afeta os outros demos fragment (eles não usam backdrop → caminho intacto).
- **`withHeader` no backdrop:** o shader de xadrez usa `v_uv` sem declarar → depende do `withHeader` declaração-aware injetar `varying vec2 v_uv`. Mesmo caminho dos shaders do aluno. Confirmar no Chrome.
- **gen-ref dispensado:** decisão consciente de não pixel-diff o exercício (replicar o blend src-over no node canvas seria frágil/custoso). Aceito — M10/M12 já são predict-observe.
