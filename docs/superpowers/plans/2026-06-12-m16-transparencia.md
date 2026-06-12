# Módulo 16 Bônus "Transparência: o Alpha" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um módulo bônus pós-curso sobre transparência/alpha blending, com o motor `ShaderPlayground` ganhando um caminho de render de 2 passes (backdrop opaco + objeto do aluno com `gl.BLEND` src-over).

**Architecture:** O motor ganha um campo de config `backdrop` (opt-in). Quando presente, o modo fragment desenha primeiro um quad de fundo opaco (shader de xadrez fixo do motor) e depois o shader do aluno com `BLEND` ligado — o alpha mistura de verdade contra o framebuffer. Sem `backdrop`, o caminho atual fica 100% intacto. O conteúdo é um módulo Head First fragment-only (igual ao M15 bônus): NÃO conta nos 14.

**Tech Stack:** HTML/CSS/JS vanilla, WebGL1/GLSL ES, `node --test`, `npm run smoke` (Playwright), Chrome MCP para verificação visual.

**Spec:** `docs/superpowers/specs/2026-06-12-m16-transparencia-design.md`.

**Convenções herdadas:**
- Web em `site/`. Testes em `test/`. Rodar: `npm test`. **Baseline atual: 136 testes passam + `npm run smoke` verde (16 módulos).**
- `<head>` de módulo COM playground: `headfirst.css` + `playground.css` + `<script type="module" src="../assets/playground/playground.js">`. `<body class="hf">`. Configs por módulo num `<script type="module">` final setando `.config`.
- Região editável: bloco entre `// >>> EDIT: nome` e `// <<< EDIT`; `config.editableRegions: ['nome']`; `config.solution` (string) habilita "💡 Mostrar solução"; "✓ Conferir" só aparece com `config.reference`.
- **GOTCHA verificação:** testes node NÃO compilam GLSL. Shader NOVO exige Chrome (servir `npm run serve` → http://localhost:8000; hard reload Ctrl+Shift+R após editar JS/HTML; RAF throttled em automação — screenshot força paint) + `npm run smoke`.
- Política preservada: **sem `backdrop` → motor inalterado**. Cena 3D não tem pixel-diff (não se aplica aqui — M16 é fragment 2D, mas o exercício é predict-observe por decisão de custo do gen-ref).

---

## Task 1: Motor — campo `backdrop` no config

**Files:**
- Modify: `site/assets/playground/config.js`
- Test: `test/config.test.js` (acrescenta um teste)

- [ ] **Step 1: Escrever o teste que falha**

Acrescentar a `test/config.test.js` (seguir os imports já presentes no arquivo — `normalizeConfig` já é importado lá):

```javascript
test('backdrop: string conhecida vira valor, desconhecida/ausente vira null', () => {
  const base = { fragment: 'void main(){ gl_FragColor = vec4(1.0); }' };
  assert.equal(normalizeConfig({ ...base, backdrop: 'xadrez' }).backdrop, 'xadrez');
  assert.equal(normalizeConfig({ ...base, backdrop: 'inexistente' }).backdrop, null);
  assert.equal(normalizeConfig(base).backdrop, null);
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `backdrop` é `undefined`, asserts quebram.

- [ ] **Step 3: Adicionar o campo no normalizeConfig**

Em `site/assets/playground/config.js`, no objeto retornado (após a linha `texture: ...`), acrescentar:

```javascript
    backdrop: (typeof raw.backdrop === 'string' && ['xadrez'].includes(raw.backdrop)) ? raw.backdrop : null, // fundo opaco p/ ver alpha (modo fragment 2-pass)
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test`
Expected: PASS — novo teste verde, baseline +1.

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/config.js test/config.test.js
git commit -m "feat(motor): campo config.backdrop (opt-in p/ render 2-pass de transparencia)"
```

---

## Task 2: Motor — render de 2 passes em `gl.js`

**Files:**
- Modify: `site/assets/playground/gl.js`

> Sem unit test node (gl.js é "verificado visualmente, não por unit test" — vide topo do arquivo). A garantia é: (a) não quebrar os 136 testes + smoke verde, (b) gate Chrome na Task 5. Refator DRY: `setupQuad` passa a reusar `createQuadBuffers`/`bindQuad` (comportamento idêntico).

- [ ] **Step 1: Adicionar o shader de backdrop fixo**

No topo de `site/assets/playground/gl.js` (após `MESH_VERTEX` / antes de `createContext`), acrescentar:

```javascript
// Shaders de fundo opaco (backdrop) p/ o módulo de transparência. v_uv é
// injetado por withHeader (declaração-aware). Opaco (alpha 1.0).
export const BACKDROP_FRAGMENTS = {
  xadrez: `precision mediump float;
void main() {
  vec2 g = floor(v_uv * 8.0);
  float c = mod(g.x + g.y, 2.0);
  vec3 cor = mix(vec3(0.85), vec3(0.55), c);
  gl_FragColor = vec4(cor, 1.0);
}`,
};
```

- [ ] **Step 2: Refatorar `setupQuad` em `createQuadBuffers` + `bindQuad` (DRY)**

Substituir a função `setupQuad` inteira (atualmente cria buffers e liga atributos, retorna `6`) por estas três funções:

```javascript
// Cria os buffers do quad fullscreen UMA vez. Retorna as referências p/ rebind.
export function createQuadBuffers(gl) {
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return { posBuf, uvBuf, idxBuf };
}

// Liga os atributos do quad para `program`. Chamar antes de cada draw — as
// locations podem diferir entre programas (backdrop x aluno).
export function bindQuad(gl, program, bufs) {
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs.posBuf);
  const posLoc = gl.getAttribLocation(program, 'a_position');
  if (posLoc !== -1) { gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0); }
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs.uvBuf);
  const uvLoc = gl.getAttribLocation(program, 'a_uv');
  if (uvLoc !== -1) { gl.enableVertexAttribArray(uvLoc); gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0); }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs.idxBuf);
}

// Mantém a assinatura antiga: cria buffers, liga p/ `program`, retorna o nº de índices.
export function setupQuad(gl, program) {
  const bufs = createQuadBuffers(gl);
  bindQuad(gl, program, bufs);
  return 6;
}
```

- [ ] **Step 3: Extrair `applyUniforms` e adicionar `renderFragmentBackdrop`**

Substituir a função `renderFrame` inteira por: uma função privada `applyUniforms` (o corpo de set de uniforms de hoje), a `renderFrame` (idêntica em efeito, agora delegando) e a nova `renderFragmentBackdrop`:

```javascript
// Aplica todos os uniforms automáticos + de controle no programa dado.
function applyUniforms(gl, program, uniforms) {
  gl.useProgram(program);
  const set = (name, fn) => {
    const loc = gl.getUniformLocation(program, name);
    if (loc !== null) fn(loc);
  };
  if (uniforms.u_time !== undefined) set('u_time', (l) => gl.uniform1f(l, uniforms.u_time));
  if (uniforms.u_resolution) set('u_resolution', (l) => gl.uniform2f(l, uniforms.u_resolution[0], uniforms.u_resolution[1]));
  if (uniforms.u_mvp) set('u_mvp', (l) => gl.uniformMatrix4fv(l, false, new Float32Array(uniforms.u_mvp)));
  if (uniforms.u_model) set('u_model', (l) => gl.uniformMatrix4fv(l, false, new Float32Array(uniforms.u_model)));
  if (uniforms.u_normalMatrix) set('u_normalMatrix', (l) => gl.uniformMatrix3fv(l, false, new Float32Array(uniforms.u_normalMatrix)));
  if (uniforms.u_lightDir) set('u_lightDir', (l) => gl.uniform3f(l, uniforms.u_lightDir[0], uniforms.u_lightDir[1], uniforms.u_lightDir[2]));
  if (uniforms.u_cameraPos) set('u_cameraPos', (l) => gl.uniform3f(l, uniforms.u_cameraPos[0], uniforms.u_cameraPos[1], uniforms.u_cameraPos[2]));
  if (uniforms.texture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, uniforms.texture);
    set('u_tex', (l) => gl.uniform1i(l, 0));
  }
  for (const [name, val] of Object.entries(uniforms.controls || {})) {
    if (Array.isArray(val)) set(name, (l) => gl.uniform3f(l, val[0], val[1], val[2]));
    else set(name, (l) => gl.uniform1f(l, val));
  }
}

// Caminho padrão (1 draw, opaco). Comportamento idêntico ao de antes.
export function renderFrame(gl, program, indexCount, uniforms) {
  applyUniforms(gl, program, uniforms);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
}

// Caminho de transparência (2 draws): backdrop opaco -> objeto do aluno com
// blend src-over contra o framebuffer. DEPTH off (fragment 2D; garante o aluno por cima).
export function renderFragmentBackdrop(gl, backdropProgram, userProgram, bufs, userUniforms) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // passe 1: backdrop opaco
  gl.useProgram(backdropProgram);
  bindQuad(gl, backdropProgram, bufs);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  // passe 2: aluno com blend src-over (frente.rgb*a + fundo.rgb*(1-a))
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  applyUniforms(gl, userProgram, userUniforms);
  bindQuad(gl, userProgram, bufs);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.disable(gl.BLEND); // deixa o estado limpo
}
```

- [ ] **Step 4: Rodar os testes (nada deve quebrar)**

Run: `npm test`
Expected: PASS — os 136+1 (Task 1) seguem verdes (o refator de gl.js não tem unit test; só não pode quebrar imports/parse).

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/gl.js
git commit -m "feat(motor): render 2-pass de transparencia (backdrop opaco + BLEND src-over) em gl.js"
```

---

## Task 3: Motor — ligar o 2-pass no `playground.js`

**Files:**
- Modify: `site/assets/playground/playground.js`

> Sem unit test (Web Component, precisa de browser). Garantia: não quebrar os testes + gate Chrome na Task 5.

- [ ] **Step 1: Atualizar o import do gl.js**

Em `site/assets/playground/playground.js`, na linha de import do `./gl.js`, acrescentar `createQuadBuffers, renderFragmentBackdrop, BACKDROP_FRAGMENTS`:

De:
```javascript
import { createContext, buildProgram, setupQuad, setupMesh, MESH_VERTEX, renderFrame, readPixels, loadTexture } from './gl.js';
```
Para:
```javascript
import { createContext, buildProgram, setupQuad, setupMesh, MESH_VERTEX, renderFrame, renderFragmentBackdrop, createQuadBuffers, BACKDROP_FRAGMENTS, readPixels, loadTexture } from './gl.js';
```

- [ ] **Step 2: Compilar o programa de backdrop no `_compile`**

No `_compile`, a branch `else` do fragment (hoje):
```javascript
      } else {
        this.program = buildProgram(gl, withHeader(this.fullSource));
        this.indexCount = setupQuad(gl, this.program);
      }
```
Trocar por:
```javascript
      } else {
        this.program = buildProgram(gl, withHeader(this.fullSource));
        if (this.cfg.backdrop) {
          this.backdropProgram = buildProgram(gl, withHeader(BACKDROP_FRAGMENTS[this.cfg.backdrop]));
          this.quadBufs = this.quadBufs || createQuadBuffers(gl);
          this.indexCount = 6;
        } else {
          this.indexCount = setupQuad(gl, this.program);
        }
      }
```

- [ ] **Step 3: Ramificar o render no `_loop`**

No `_loop`, a chamada única de render (hoje a última linha do bloco `if (this.program && this.gl)`):
```javascript
        renderFrame(this.gl, this.program, this.indexCount, base);
```
Trocar por:
```javascript
        if (this.cfg.mode !== 'mesh' && this.cfg.backdrop) {
          renderFragmentBackdrop(this.gl, this.backdropProgram, this.program, this.quadBufs, base);
        } else {
          renderFrame(this.gl, this.program, this.indexCount, base);
        }
```

- [ ] **Step 4: Rodar os testes**

Run: `npm test`
Expected: PASS — baseline +1 (Task 1) seguem verdes.

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/playground.js
git commit -m "feat(motor): playground.js usa o render 2-pass quando config.backdrop presente"
```

---

## Task 4: Módulo 16 — HTML + teste de integração

**Files:**
- Create: `site/modulos/16-transparencia.html`
- Test: `test/module16.integration.test.js`

- [ ] **Step 1: Escrever o teste que falha**

Criar `test/module16.integration.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('M16: demo pg-alpha com backdrop xadrez + slider de alpha', () => {
  const html = readFileSync('site/modulos/16-transparencia.html', 'utf8');
  assert.ok(html.includes('id="pg-alpha"'), 'falta o demo pg-alpha');
  assert.ok(html.includes("backdrop: 'xadrez'"), 'pg-alpha nao usa backdrop xadrez');
  assert.ok(html.includes('u_alpha'), 'falta o slider u_alpha');
});

test('M16: exercicio pg-ex predict-observe (editavel alpha + solution, SEM pixel-diff)', () => {
  const html = readFileSync('site/modulos/16-transparencia.html', 'utf8');
  assert.ok(html.includes('id="pg-ex"'), 'falta o exercicio pg-ex');
  assert.ok(html.includes("editableRegions: ['alpha']"), 'falta a regiao editavel alpha');
  assert.ok(html.includes('solution:'), 'falta a solution do exercicio');
  assert.ok(!html.includes('reference:'), 'M16 nao deve ter reference (sem pixel-diff)');
});

test('M16: e modulo bonus (breadcrumb Bonus, NAO conta nos 14) + Cuidado de ordem', () => {
  const html = readFileSync('site/modulos/16-transparencia.html', 'utf8');
  assert.ok(html.includes('🎁 Bônus'), 'falta o breadcrumb de Bonus');
  assert.ok(!/de 14/.test(html), 'modulo bonus NAO deve se numerar "de 14"');
  assert.ok(html.includes('class="cuidado"'), 'falta o Cuidado de ordem de desenho');
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — HTML não existe, `readFileSync` lança.

- [ ] **Step 3: Criar o HTML do Módulo 16**

Criar `site/modulos/16-transparencia.html`:

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Módulo Bônus — Transparência: o Alpha</title>
  <link rel="stylesheet" href="../assets/css/headfirst.css">
  <link rel="stylesheet" href="../assets/css/playground.css">
  <script type="module" src="../assets/playground/playground.js"></script>
</head>
<body class="hf">
  <p><a href="../index.html">← Mapa do curso</a> · 🎁 Bônus · Módulo Extra</p>
  <h1>Transparência: o Alpha</h1>
  <p>Vidro, água, fumaça, o menu de pausa que deixa ver o jogo congelado atrás — tudo isso é
  <strong>transparência</strong>. Até agora, toda cor que você pintou terminava em <code>1.0</code>.
  Esse 4º número tem nome: <strong>alpha</strong>. Bora deixar a luz passar.</p>

  <h2>O 4º número do vec4</h2>
  <p>Lá no M2 você viu que uma cor é <code>vec4(r, g, b, a)</code> — e a gente sempre botou
  <code>a = 1.0</code> sem pensar. Esse último número é o <strong>alpha</strong>: <code>1.0</code> =
  totalmente opaco (tampa tudo), <code>0.0</code> = totalmente transparente (some).</p>
  <div class="brain">
    Mas tem uma pegadinha: pra <strong>ver</strong> a transparência, precisa ter algo
    <strong>atrás</strong>. Se o fundo for preto, baixar o alpha só deixa a cor mais escura — não
    parece "ver através". Por isso os demos abaixo têm um xadrez no fundo.
  </div>

  <h2>Veja o alpha funcionando</h2>
  <p>Abaixo, um círculo laranja por cima de um fundo xadrez. Arraste o <strong>alpha</strong> de
  <code>1.0</code> até <code>0.0</code> e veja o xadrez aparecer através do círculo — não é só
  escurecer, é <em>misturar</em> com o que está atrás.</p>
  <shader-playground id="pg-alpha"></shader-playground>

  <h2>A receita da mistura</h2>
  <figure>
    <img src="../assets/img/blend-formula.svg" alt="A cor da frente (laranja, alpha 0.5) sobre o fundo xadrez resulta numa mistura meio a meio: resultado = frente vezes alpha mais fundo vezes (1 menos alpha)" width="640">
    <figcaption>O motor (gl.BLEND) faz essa conta sozinho, pixel a pixel, contra o que já está pintado.</figcaption>
  </figure>
  <p>A regra é simples: <code>resultado = frente.rgb * a + fundo.rgb * (1 - a)</code>. Com
  <code>a = 1</code> sai só a frente; com <code>a = 0</code> sai só o fundo; com <code>a = 0.5</code>,
  meio a meio. É o mesmo <code>mix</code> que você viu no M3 — só que feito pela GPU automaticamente.</p>

  <h2>Ordem importa</h2>
  <figure>
    <img src="../assets/img/blend-ordem.svg" alt="Pintar na ordem certa (fundo, depois meio, depois frente) dá o resultado certo; pintar fora de ordem dá um resultado errado" width="640">
    <figcaption>Como a mistura é sempre contra o que já está no framebuffer, a ordem de desenho muda o resultado.</figcaption>
  </figure>
  <div class="cuidado">
    <strong>Cuidado com a ordem!</strong> A transparência mistura com o que <strong>já</strong> foi
    pintado. Então a regra de ouro é: <strong>desenhe o fundo primeiro e as coisas transparentes por
    último, de trás pra frente.</strong> Em 3D isso é mais chato — o Z-buffer (M11) sozinho não
    resolve, porque um objeto transparente precisa deixar passar quem está atrás dele. Por isso jogos
    <em>ordenam manualmente</em> os objetos transparentes antes de desenhar.
  </div>

  <h2>Sua vez: deixe ver através</h2>
  <div class="afie">
    <p><strong>Preveja antes de ver:</strong> o círculo abaixo começa com <code>a = 1.0</code> (opaco,
    tampa o xadrez). Se você trocar por <code>a = 0.5</code>, o que vai acontecer com o xadrez embaixo?</p>
    <p>Escreva, clique ▶ Test Drive e confira: <strong>se o xadrez começar a aparecer através do
    círculo, você acertou.</strong> Travou? 💡 Mostrar solução.</p>
  </div>
  <shader-playground id="pg-ex"></shader-playground>

  <div class="qa">
    <dl>
      <dt>Por que contra o preto só escurece, em vez de ficar transparente?</dt>
      <dd>Porque misturar com preto <code>(0,0,0)</code> puxa toda cor pra baixo. "Ver através" só
      aparece quando tem um fundo <em>com cor</em> atrás — por isso o xadrez.</dd>
      <dt>Alpha é a mesma coisa que opacidade?</dt>
      <dd>É o complemento: <code>a = 1</code> opaco, <code>a = 0</code> transparente. Quando um programa
      mostra "opacidade 70%", é <code>a = 0.7</code>.</dd>
    </dl>
  </div>

  <p><a href="../index.html">← Voltar pro mapa do curso</a></p>

  <script type="module">
    document.getElementById('pg-alpha').config = {
      mode: 'fragment',
      backdrop: 'xadrez',
      fragment: `precision mediump float;
uniform float u_alpha;
void main() {
  float d = length(v_uv - 0.5);
  float dentro = 1.0 - step(0.3, d);
  vec3 cor = vec3(1.0, 0.4, 0.1);
  gl_FragColor = vec4(cor, u_alpha * dentro);
}`,
      uniforms: [{ name: 'u_alpha', label: 'alpha (transparência)', min: 0.0, max: 1.0, value: 0.6 }],
    };
    document.getElementById('pg-ex').config = {
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
    };
  </script>
</body>
</html>
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test`
Expected: PASS — os 3 testes do module16 verdes.

- [ ] **Step 5: Commit**

```bash
git add site/modulos/16-transparencia.html test/module16.integration.test.js
git commit -m "feat(m16): modulo bonus 'Transparencia: o Alpha' (demo + exercicio predict-observe)"
```

---

## Task 5: SVGs + professor + index + glossário

**Files:**
- Create: `site/assets/img/blend-formula.svg`
- Create: `site/assets/img/blend-ordem.svg`
- Create: `site/professor/16-guia.md`
- Modify: `site/index.html` (card na seção Bônus)
- Modify: `site/glossario.html` (termos alpha + blending)
- Test: `test/module16.integration.test.js` (acrescenta asserts de index/glossário)

- [ ] **Step 1: Escrever os asserts que falham**

Acrescentar a `test/module16.integration.test.js`:

```javascript
test('M16: index e glossario linkam o modulo e os termos', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('16-transparencia.html'), 'index nao linka o M16');
  const glo = readFileSync('site/glossario.html', 'utf8');
  assert.ok(/alpha/i.test(glo), 'glossario nao tem o termo alpha');
  assert.ok(/blending/i.test(glo), 'glossario nao tem o termo blending');
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — index não referencia `16-transparencia.html`.

- [ ] **Step 3: Criar `site/assets/img/blend-formula.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 220" width="640" font-family="sans-serif">
  <rect width="640" height="220" fill="#fbfbf7"/>
  <text x="20" y="28" font-size="15" font-weight="bold" fill="#333">A receita da mistura (alpha = 0.5)</text>
  <!-- fundo xadrez -->
  <g>
    <rect x="30" y="60" width="120" height="120" fill="#d9d9d9"/>
    <rect x="30" y="60" width="60" height="60" fill="#b0b0b0"/>
    <rect x="90" y="120" width="60" height="60" fill="#b0b0b0"/>
    <text x="60" y="200" font-size="13" fill="#666">fundo</text>
  </g>
  <text x="165" y="125" font-size="28" fill="#333">+</text>
  <!-- frente laranja translucida -->
  <g>
    <rect x="210" y="60" width="120" height="120" fill="#e8590c" opacity="0.5"/>
    <text x="220" y="200" font-size="13" fill="#666">frente · 0.5</text>
  </g>
  <text x="345" y="125" font-size="28" fill="#333">=</text>
  <!-- resultado: xadrez visivel sob laranja -->
  <g>
    <rect x="390" y="60" width="120" height="120" fill="#d9d9d9"/>
    <rect x="390" y="60" width="60" height="60" fill="#b0b0b0"/>
    <rect x="450" y="120" width="60" height="60" fill="#b0b0b0"/>
    <rect x="390" y="60" width="120" height="120" fill="#e8590c" opacity="0.5"/>
    <text x="400" y="200" font-size="13" fill="#666">resultado</text>
  </g>
  <text x="20" y="215" font-size="13" fill="#2b8a3e">resultado = frente.rgb · a + fundo.rgb · (1 − a)</text>
</svg>
```

- [ ] **Step 4: Criar `site/assets/img/blend-ordem.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 240" width="640" font-family="sans-serif">
  <rect width="640" height="240" fill="#fbfbf7"/>
  <text x="20" y="28" font-size="15" font-weight="bold" fill="#333">A ordem de desenho muda o resultado</text>
  <!-- ordem certa -->
  <text x="30" y="58" font-size="13" fill="#2b8a3e">✓ fundo → meio → frente</text>
  <rect x="30" y="70" width="150" height="120" fill="#c7d2fe"/>
  <rect x="60" y="95" width="110" height="80" fill="#34d399" opacity="0.6"/>
  <rect x="95" y="115" width="80" height="60" fill="#e8590c" opacity="0.6"/>
  <text x="30" y="210" font-size="12" fill="#666">cada camada mistura com a de baixo, na ordem</text>
  <!-- ordem errada -->
  <text x="360" y="58" font-size="13" fill="#c92a2a">✗ frente desenhada antes do fundo</text>
  <rect x="360" y="70" width="150" height="120" fill="#c7d2fe"/>
  <rect x="395" y="115" width="80" height="60" fill="#e8590c" opacity="0.6"/>
  <rect x="390" y="95" width="110" height="80" fill="#34d399" opacity="0.6"/>
  <text x="360" y="210" font-size="12" fill="#666">o que veio antes some sob o que veio depois</text>
</svg>
```

- [ ] **Step 5: Criar `site/professor/16-guia.md`**

```markdown
# Guia do professor — Módulo Bônus: Transparência (o Alpha)

**Objetivo:** o aluno entende que o 4º canal do `vec4` (alpha) controla transparência; que para
enxergar transparência é preciso um fundo atrás; e que a ordem de desenho importa (de trás pra frente).

**Quando usar:** bônus pós-curso, opcional. 10–15 min. Bom como "extra" depois do Marco 3, ou para
turmas que perguntaram sobre vidro/água/fumaça.

**O que NÃO cobrar:** não é cálculo de blend equations nem premultiplied alpha. A meta é a intuição
"frente sobre fundo" e "ordem importa" — não a álgebra.

**Gancho honesto:** o `Cuidado!` sobre ordem/Z-buffer é a ponte para "por que 3D é mais difícil".
Conecta com o M11 (Z-buffer) sem prometer resolver ordenação de transparência em 3D — que de fato é
um problema aberto que jogos resolvem ordenando objetos manualmente.

**Demos:** `pg-alpha` (slider de alpha sobre xadrez) e `pg-ex` (o aluno escreve o `.a`,
predict-observe, sem Conferir automático — é cena com mistura, validação é visual).
```

- [ ] **Step 6: Adicionar o card no index (seção Bônus)**

Em `site/index.html`, na lista da seção Bônus, após o `<li>` do M15 (linha ~50), acrescentar:

```html
    <li><a href="modulos/16-transparencia.html">Transparência: o Alpha</a> — vidro, água e fumaça: o 4º canal do vec4 e como o alpha mistura cores.</li>
```

- [ ] **Step 7: Adicionar os termos no glossário (em ordem alfabética)**

Em `site/glossario.html`, inserir os dois termos na posição alfabética correta (ambos antes de "B"/no começo). Seguir a marcação dos termos vizinhos (mesma estrutura de `<dt>`/`<dd>` ou equivalente do arquivo — conferir o padrão de um termo existente antes de inserir). Conteúdo:

- **alpha** — o 4º número de uma cor `vec4(r, g, b, a)`. Controla a transparência: `1.0` opaco, `0.0` invisível. 📚 M16
- **blending (mistura alpha)** — quando a GPU mistura a cor nova com a que já está pintada, usando o alpha: `frente·a + fundo·(1−a)`. 📚 M16

(Se o glossário expõe uma contagem de termos no topo — ex. "45 termos" — incrementar para refletir os 2 novos. Conferir antes; o spec notou que pode não haver número.)

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `npm test`
Expected: PASS — o assert de index/glossário verde.

- [ ] **Step 9: Commit**

```bash
git add site/assets/img/blend-formula.svg site/assets/img/blend-ordem.svg site/professor/16-guia.md site/index.html site/glossario.html test/module16.integration.test.js
git commit -m "feat(m16): SVGs (formula/ordem), guia do professor, card no index, termos no glossario"
```

---

## Task 6: Verificação no Chrome + smoke + fechamento

**Files:** nenhum (verificação).

- [ ] **Step 1: Rodar o smoke (deve incluir o M16)**

Run: `npm run smoke`
Expected: verde, **17 módulos** (o smoke varre `site/modulos/*.html` por `readdir` → o novo arquivo entra sozinho). Se o M16 não compilar algum shader, o smoke falha (exit 1) — corrigir antes de seguir.

- [ ] **Step 2: Verificar no Chrome (shader NOVO — obrigatório)**

Servir: `npm run serve`. Abrir `http://localhost:8000/modulos/16-transparencia.html` (Ctrl+Shift+R). Confirmar:
- `pg-alpha`: aparece o **fundo xadrez** com um **círculo laranja** por cima. Arrastar o slider de alpha de 0.6 → 0.0 faz o xadrez aparecer **através** do círculo (mistura, não só escurece). Em 1.0, o círculo tampa o xadrez no meio.
- `pg-ex`: começa com o círculo azul **opaco** (xadrez só fora do círculo). Clicar **💡 Mostrar solução** (`a = 0.5`) faz o xadrez aparecer por baixo do círculo. **NÃO há botão Conferir** (sem reference).
- Console **sem erro GLSL** (especialmente: o backdrop do xadrez compila; `v_uv` resolvido nos dois passes).
- Os SVGs `blend-formula` e `blend-ordem` carregam.

- [ ] **Step 3: Verificação de regressão (backdrop não vazou pros outros)**

Abrir um módulo fragment SEM backdrop (ex. `http://localhost:8000/modulos/02-pixel-e-cor.html`) e confirmar que continua renderizando igual (o refator de `gl.js`/`setupQuad` não quebrou o caminho de 1 passe). Console limpo.

- [ ] **Step 4: Fechamento**

Sem branch a finalizar (trabalho direto em `main`, working tree limpo entre commits). O pass do item #6 está completo: motor com `backdrop` 2-pass + Módulo 16 bônus. `npm test` verde (baseline +2 testes: config + module16) e `npm run smoke` verde com 17 módulos.

---

## Self-Review (cobertura do spec)

- **§1 escopo (M16 bônus, fragment-only, não conta nos 14)** → Task 4 (breadcrumb Bônus, assert `!de 14`); mesh fora de escopo vira `Cuidado!` (Task 4 Step 3). ✓
- **§2 backdrop honesto (2 passes GL)** → Task 2 (`renderFragmentBackdrop`, blend src-over contra framebuffer). ✓
- **§3.1 config.backdrop** → Task 1. **§3.2 gl.js BACKDROP_FRAGMENTS + 2-pass** → Task 2. **§3.3 playground.js 2 programas** → Task 3. ✓
- **§4 conteúdo (8 seções: alpha/demo/receita/ordem/exercício/Q&A)** → Task 4 Step 3. ✓
- **§5 configs exatas (pg-alpha, pg-ex, xadrez)** → Task 4 Step 3 (HTML) + Task 2 Step 1 (xadrez). ✓
- **§6 SVGs (formula + ordem)** → Task 5 Steps 3–4. ✓
- **§7 index + glossário + professor** → Task 5 Steps 5–7. ✓
- **§8 testes + gate Chrome + smoke 17** → Task 1/4/5 (node) + Task 6 (Chrome + smoke). ✓
- **§10 riscos (BLEND vazando → `disable` ao fim; DEPTH off; withHeader no backdrop; gen-ref dispensado)** → Task 2 Step 3 (disable BLEND/DEPTH) + Task 6 Step 3 (regressão) + exercício predict-observe (Task 4). ✓
- **Consistência de nomes:** `backdrop`/`'xadrez'`, `BACKDROP_FRAGMENTS`, `renderFragmentBackdrop`, `createQuadBuffers`/`bindQuad`, ids `pg-alpha`/`pg-ex`, região `alpha` — batem entre tasks e testes. ✓
- **Contagem de testes:** 136 → 137 (T1 config) → 137 (T2/T3 sem teste) → 140 (T4: +3) → 141 (T5: +1) = **141**. (Asserts agrupados em poucos `test(...)`.) ✓
