# Marco 1 — Fundação + Módulo 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o motor reutilizável `ShaderPlayground` (modos fragment + mesh, WebGL1) + o esqueleto de página Head First + o **Módulo 1 completo** ("Shaders & a GPU") como fatia vertical funcional do curso.

**Architecture:** Site estático vanilla JS, sem bundler. Lógica pura separada do WebGL/DOM para ser testável com `node:test`. O playground é um Web Component (`<shader-playground>`) configurado por atributos/JSON. Páginas de lição são HTML estático que consomem CSS Head First + instâncias do playground. Servido por `python -m http.server` (HTTP necessário p/ fetch de malhas).

**Tech Stack:** HTML5, CSS3, JavaScript ES modules (vanilla), WebGL1/GLSL ES 1.00, `node:test` (testes de lógica pura), Python http.server (dev), SVG inline (diagramas).

**Escopo deste plano (fatia vertical):** Fundação técnica + Módulo 1. Módulos 2–6 do Marco 1 ficam para um plano-sequência (`2026-XX-marco1-modulos-2a6.md`) reutilizando o mesmo motor e scaffold. Spec de referência: `docs/superpowers/specs/2026-06-10-curso-shaders-ensino-medio-design.md`.

---

## Estrutura de arquivos

```
/package.json                       # scripts de teste (node:test), sem deps de runtime
/curso/
  index.html                        # capa + mapa dos 3 marcos (Marco 1 ativo)
  /assets/
    /playground/
      config.js                     # validação/normalização da config (PURO)
      uniforms.js                    # decls de uniform -> specs de controle (PURO)
      pixeldiff.js                   # compara arrays de pixels -> score/passa (PURO)
      editable.js                    # regiões GLSL travadas/editáveis (PURO)
      gl.js                          # setup WebGL, compile, render (glue)
      playground.js                  # Web Component <shader-playground> (orquestra)
    /css/
      headfirst.css                 # dispositivos: afie-o-lapis, brain-power, qa, cuidado, sidebar, bullets
      playground.css                # layout do widget
    /meshes/
      quad.json                     # 2 triângulos fullscreen (modo fragment)
    /img/                           # SVGs + imagens coladas pelo usuário
    /ref/                           # imagens-referência de exercício (pixel-diff)
  /modulos/
    01-shaders-e-gpu.html           # Módulo 1 (aluno)
  /professor/
    01-guia.md                      # Módulo 1 (professor)
/test/
  config.test.js
  uniforms.test.js
  pixeldiff.test.js
  editable.test.js
```

---

## Task 1: Esqueleto do projeto + harness de teste

**Files:**
- Create: `package.json`
- Create: `test/smoke.test.js`
- Create: `curso/assets/playground/.gitkeep`

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "shaderworkshop-curso",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "serve": "python -m http.server 8000 --directory curso"
  }
}
```

- [ ] **Step 2: Escrever teste smoke que falha**

`test/smoke.test.js`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ok } from '../curso/assets/playground/config.js';

test('harness vivo', () => {
  assert.equal(ok(), true);
});
```

- [ ] **Step 3: Rodar e confirmar falha**

Run: `npm test`
Expected: FAIL — `Cannot find module .../config.js`

- [ ] **Step 4: Criar stub mínimo `curso/assets/playground/config.js`**

```javascript
export function ok() {
  return true;
}
```

- [ ] **Step 5: Rodar e confirmar passa**

Run: `npm test`
Expected: PASS — 1 test passed

- [ ] **Step 6: Commit**

```bash
git add package.json test/smoke.test.js curso/assets/playground/config.js
git commit -m "chore: esqueleto do curso + harness node:test"
```

---

## Task 2: `config.js` — validação/normalização da config do playground

**Files:**
- Modify: `curso/assets/playground/config.js`
- Create: `test/config.test.js`
- Delete: `test/smoke.test.js` (substituído)

A config descreve uma instância de playground. Forma:
```
{
  mode: 'fragment' | 'mesh',
  fragment: '<glsl>',           // obrigatório
  vertex: '<glsl>',             // obrigatório se mode==='mesh'
  mesh: 'quad',                 // nome do arquivo em /meshes (default 'quad')
  uniforms: [ {name,label,type,min,max,value} ],  // opcional, default []
  editableRegions: ['nome'],    // opcional, default []
  reference: 'ref/x.png' | null,// opcional p/ exercício
  tolerance: 0..1               // default 0.06
}
```

- [ ] **Step 1: Escrever testes que falham**

`test/config.test.js`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig } from '../curso/assets/playground/config.js';

test('preenche defaults', () => {
  const c = normalizeConfig({ fragment: 'void main(){}' });
  assert.equal(c.mode, 'fragment');
  assert.equal(c.mesh, 'quad');
  assert.deepEqual(c.uniforms, []);
  assert.deepEqual(c.editableRegions, []);
  assert.equal(c.reference, null);
  assert.equal(c.tolerance, 0.06);
});

test('exige fragment', () => {
  assert.throws(() => normalizeConfig({}), /fragment/);
});

test('mode mesh exige vertex', () => {
  assert.throws(
    () => normalizeConfig({ mode: 'mesh', fragment: 'x' }),
    /vertex/
  );
});

test('rejeita mode invalido', () => {
  assert.throws(
    () => normalizeConfig({ mode: 'foo', fragment: 'x' }),
    /mode/
  );
});

test('clampa tolerance em 0..1', () => {
  assert.equal(normalizeConfig({ fragment: 'x', tolerance: 2 }).tolerance, 1);
  assert.equal(normalizeConfig({ fragment: 'x', tolerance: -1 }).tolerance, 0);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/config.test.js`
Expected: FAIL — `normalizeConfig is not a function`

- [ ] **Step 3: Implementar `config.js`**

Substituir todo o conteúdo de `curso/assets/playground/config.js`:
```javascript
const VALID_MODES = ['fragment', 'mesh'];

export function normalizeConfig(raw) {
  if (!raw || typeof raw.fragment !== 'string' || raw.fragment.length === 0) {
    throw new Error('config: campo "fragment" (GLSL) é obrigatório');
  }
  const mode = raw.mode ?? 'fragment';
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`config: "mode" inválido: ${mode}`);
  }
  if (mode === 'mesh' && (typeof raw.vertex !== 'string' || raw.vertex.length === 0)) {
    throw new Error('config: mode "mesh" exige campo "vertex" (GLSL)');
  }
  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  return {
    mode,
    fragment: raw.fragment,
    vertex: raw.vertex ?? null,
    mesh: raw.mesh ?? 'quad',
    uniforms: Array.isArray(raw.uniforms) ? raw.uniforms : [],
    editableRegions: Array.isArray(raw.editableRegions) ? raw.editableRegions : [],
    reference: raw.reference ?? null,
    solution: raw.solution ?? null,
    tolerance: typeof raw.tolerance === 'number' ? clamp01(raw.tolerance) : 0.06,
  };
}
```

- [ ] **Step 4: Rodar e confirmar passa**

Run: `node --test test/config.test.js`
Expected: PASS — 5 tests passed

- [ ] **Step 5: Remover smoke test**

```bash
git rm test/smoke.test.js
```

- [ ] **Step 6: Commit**

```bash
git add curso/assets/playground/config.js test/config.test.js
git commit -m "feat(playground): normalizeConfig com defaults e validacao"
```

---

## Task 3: `uniforms.js` — decls de uniform → specs de controle

**Files:**
- Create: `curso/assets/playground/uniforms.js`
- Create: `test/uniforms.test.js`

Converte declarações de uniform em "specs de controle" (dados puros), que o orquestrador vira sliders/color-pickers. Tipos: `float` (slider), `color` (3 floats RGB). `u_time` e `u_resolution` são automáticos (não viram controle).

- [ ] **Step 1: Escrever testes que falham**

`test/uniforms.test.js`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toControlSpecs, AUTO_UNIFORMS } from '../curso/assets/playground/uniforms.js';

test('float vira slider com min/max/value', () => {
  const specs = toControlSpecs([
    { name: 'u_freq', label: 'Frequência', type: 'float', min: 0, max: 10, value: 3 },
  ]);
  assert.equal(specs.length, 1);
  assert.deepEqual(specs[0], {
    name: 'u_freq', label: 'Frequência', kind: 'slider',
    min: 0, max: 10, step: 0.01, value: 3,
  });
});

test('color vira control rgb com value [r,g,b]', () => {
  const specs = toControlSpecs([
    { name: 'u_cor', label: 'Cor', type: 'color', value: [1, 0, 0] },
  ]);
  assert.equal(specs[0].kind, 'color');
  assert.deepEqual(specs[0].value, [1, 0, 0]);
});

test('uniforms automaticos sao ignorados como controle', () => {
  const specs = toControlSpecs([{ name: 'u_time', type: 'float' }]);
  assert.equal(specs.length, 0);
});

test('AUTO_UNIFORMS contem u_time e u_resolution', () => {
  assert.ok(AUTO_UNIFORMS.includes('u_time'));
  assert.ok(AUTO_UNIFORMS.includes('u_resolution'));
});

test('float sem min/max usa defaults 0..1', () => {
  const s = toControlSpecs([{ name: 'u_x', label: 'X', type: 'float' }])[0];
  assert.equal(s.min, 0);
  assert.equal(s.max, 1);
  assert.equal(s.value, 0.5);
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/uniforms.test.js`
Expected: FAIL — `Cannot find module .../uniforms.js`

- [ ] **Step 3: Implementar `uniforms.js`**

```javascript
export const AUTO_UNIFORMS = ['u_time', 'u_resolution', 'u_mouse'];

export function toControlSpecs(decls) {
  const out = [];
  for (const d of decls) {
    if (AUTO_UNIFORMS.includes(d.name)) continue;
    if (d.type === 'color') {
      out.push({
        name: d.name,
        label: d.label ?? d.name,
        kind: 'color',
        value: Array.isArray(d.value) ? d.value : [1, 1, 1],
      });
    } else {
      // float (default)
      const min = typeof d.min === 'number' ? d.min : 0;
      const max = typeof d.max === 'number' ? d.max : 1;
      const value = typeof d.value === 'number' ? d.value : (min + max) / 2;
      out.push({
        name: d.name,
        label: d.label ?? d.name,
        kind: 'slider',
        min, max, step: 0.01, value,
      });
    }
  }
  return out;
}
```

- [ ] **Step 4: Rodar e confirmar passa**

Run: `node --test test/uniforms.test.js`
Expected: PASS — 5 tests passed

- [ ] **Step 5: Commit**

```bash
git add curso/assets/playground/uniforms.js test/uniforms.test.js
git commit -m "feat(playground): toControlSpecs (uniform -> spec de controle)"
```

---

## Task 4: `pixeldiff.js` — comparador de pixels para exercícios

**Files:**
- Create: `curso/assets/playground/pixeldiff.js`
- Create: `test/pixeldiff.test.js`

Compara dois `Uint8ClampedArray` RGBA (saída do aluno × referência). Retorna `{ score, pass }` onde score = 1 - (erro médio normalizado), pass = score >= (1 - tolerance).

- [ ] **Step 1: Escrever testes que falham**

`test/pixeldiff.test.js`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compare } from '../curso/assets/playground/pixeldiff.js';

const px = (r, g, b) => Uint8ClampedArray.from([r, g, b, 255]);

test('identico => score 1, pass true', () => {
  const a = px(100, 50, 200);
  const r = compare(a, px(100, 50, 200), 0.06);
  assert.equal(r.score, 1);
  assert.equal(r.pass, true);
});

test('oposto => score 0, pass false', () => {
  const r = compare(px(0, 0, 0), px(255, 255, 255), 0.06);
  assert.equal(r.score, 0);
  assert.equal(r.pass, false);
});

test('diferenca pequena dentro da tolerancia passa', () => {
  const r = compare(px(250, 250, 250), px(255, 255, 255), 0.06);
  assert.equal(r.pass, true);
  assert.ok(r.score > 0.94);
});

test('tamanhos diferentes lancam erro', () => {
  assert.throws(
    () => compare(px(0, 0, 0), Uint8ClampedArray.from([0, 0, 0, 255, 0, 0, 0, 255]), 0.06),
    /tamanho/
  );
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/pixeldiff.test.js`
Expected: FAIL — `Cannot find module .../pixeldiff.js`

- [ ] **Step 3: Implementar `pixeldiff.js`**

```javascript
// Compara dois buffers RGBA (Uint8ClampedArray). Ignora canal alpha.
export function compare(actual, reference, tolerance = 0.06) {
  if (actual.length !== reference.length) {
    throw new Error('pixeldiff: buffers de tamanho diferente');
  }
  let sum = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      sum += Math.abs(actual[i + c] - reference[i + c]) / 255;
      count++;
    }
  }
  const meanError = count === 0 ? 0 : sum / count;
  const score = 1 - meanError;
  return { score, pass: score >= 1 - tolerance };
}
```

- [ ] **Step 4: Rodar e confirmar passa**

Run: `node --test test/pixeldiff.test.js`
Expected: PASS — 4 tests passed

- [ ] **Step 5: Commit**

```bash
git add curso/assets/playground/pixeldiff.js test/pixeldiff.test.js
git commit -m "feat(playground): pixeldiff.compare para exercicios autocorrigidos"
```

---

## Task 5: `editable.js` — regiões GLSL travadas/editáveis

**Files:**
- Create: `curso/assets/playground/editable.js`
- Create: `test/editable.test.js`

Marca regiões editáveis no GLSL com comentários sentinela. Extrai o trecho editável (pro editor do aluno) e remonta o shader completo (travado + editado) antes de compilar.

Formato sentinela no GLSL:
```
// >>> EDIT: nome
  ...código editável...
// <<< EDIT
```

- [ ] **Step 1: Escrever testes que falham**

`test/editable.test.js`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractRegion, reassemble } from '../curso/assets/playground/editable.js';

const SRC = [
  'void main() {',
  '// >>> EDIT: cor',
  '  vec3 c = vec3(1.0, 0.0, 0.0);',
  '// <<< EDIT',
  '  gl_FragColor = vec4(c, 1.0);',
  '}',
].join('\n');

test('extractRegion devolve so o miolo editavel', () => {
  assert.equal(extractRegion(SRC, 'cor'), '  vec3 c = vec3(1.0, 0.0, 0.0);');
});

test('extractRegion regiao inexistente lanca', () => {
  assert.throws(() => extractRegion(SRC, 'nao_existe'), /regiao/);
});

test('reassemble troca o miolo e preserva o resto', () => {
  const novo = reassemble(SRC, 'cor', '  vec3 c = vec3(0.0, 0.0, 1.0);');
  assert.ok(novo.includes('vec3(0.0, 0.0, 1.0)'));
  assert.ok(novo.includes('gl_FragColor = vec4(c, 1.0);'));
  assert.ok(!novo.includes('vec3(1.0, 0.0, 0.0)'));
  // sentinelas permanecem para edicoes futuras
  assert.ok(novo.includes('// >>> EDIT: cor'));
});
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node --test test/editable.test.js`
Expected: FAIL — `Cannot find module .../editable.js`

- [ ] **Step 3: Implementar `editable.js`**

```javascript
function bounds(src, name) {
  const startMark = `// >>> EDIT: ${name}`;
  const endMark = '// <<< EDIT';
  const startLine = src.indexOf(startMark);
  if (startLine === -1) throw new Error(`editable: regiao "${name}" não encontrada`);
  const innerStart = src.indexOf('\n', startLine) + 1;
  const endLine = src.indexOf(endMark, innerStart);
  if (endLine === -1) throw new Error(`editable: fim da regiao "${name}" não encontrado`);
  return { innerStart, innerEnd: endLine };
}

export function extractRegion(src, name) {
  const { innerStart, innerEnd } = bounds(src, name);
  return src.slice(innerStart, innerEnd).replace(/\n$/, '');
}

export function reassemble(src, name, newInner) {
  const { innerStart, innerEnd } = bounds(src, name);
  const ensured = newInner.endsWith('\n') ? newInner : newInner + '\n';
  return src.slice(0, innerStart) + ensured + src.slice(innerEnd);
}
```

- [ ] **Step 4: Rodar e confirmar passa**

Run: `node --test test/editable.test.js`
Expected: PASS — 3 tests passed

- [ ] **Step 5: Commit**

```bash
git add curso/assets/playground/editable.js test/editable.test.js
git commit -m "feat(playground): editable regions (extract/reassemble GLSL)"
```

---

## Task 6: `gl.js` — núcleo WebGL (compile + render fragment)

**Files:**
- Create: `curso/assets/playground/gl.js`
- Create: `curso/assets/meshes/quad.json`

WebGL é verificado visualmente (não unit-testado headless). `gl.js` expõe funções puras de glue: criar contexto WebGL1, compilar programa, e renderizar um frame com uniforms.

- [ ] **Step 1: Criar malha quad fullscreen**

`curso/assets/meshes/quad.json`:
```json
{
  "positions": [-1, -1, 1, -1, -1, 1, 1, 1],
  "uvs": [0, 0, 1, 0, 0, 1, 1, 1],
  "indices": [0, 1, 2, 2, 1, 3]
}
```

- [ ] **Step 2: Implementar `gl.js`**

```javascript
// Glue WebGL1. Verificado visualmente, não por unit test.

const QUAD_VERTEX = `
attribute vec2 a_position;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export function createContext(canvas) {
  const gl =
    canvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: true }) ||
    canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL indisponível neste navegador/dispositivo');
  return gl;
}

function compileShader(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || 'erro de compilação do shader');
  }
  return sh;
}

// Para modo fragment: vertex é o QUAD_VERTEX fixo; user só escreve o fragment.
export function buildProgram(gl, fragmentSource, vertexSource = QUAD_VERTEX) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    throw new Error(log || 'erro de link do programa');
  }
  return prog;
}

export function setupQuad(gl, program) {
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
  const uvLoc = gl.getAttribLocation(program, 'a_uv');
  if (uvLoc !== -1) {
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
  }

  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return 6; // index count
}

// Aplica uniforms automáticos + de controle e desenha.
export function renderFrame(gl, program, indexCount, uniforms) {
  gl.useProgram(program);
  const set = (name, fn) => {
    const loc = gl.getUniformLocation(program, name);
    if (loc !== null) fn(loc);
  };
  if (uniforms.u_time !== undefined) set('u_time', (l) => gl.uniform1f(l, uniforms.u_time));
  if (uniforms.u_resolution) set('u_resolution', (l) => gl.uniform2f(l, uniforms.u_resolution[0], uniforms.u_resolution[1]));
  if (uniforms.u_mouse) set('u_mouse', (l) => gl.uniform2f(l, uniforms.u_mouse[0], uniforms.u_mouse[1]));
  for (const [name, val] of Object.entries(uniforms.controls || {})) {
    if (Array.isArray(val)) set(name, (l) => gl.uniform3f(l, val[0], val[1], val[2]));
    else set(name, (l) => gl.uniform1f(l, val));
  }
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
}

export function readPixels(gl) {
  const w = gl.drawingBufferWidth;
  const h = gl.drawingBufferHeight;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return new Uint8ClampedArray(buf.buffer);
}
```

- [ ] **Step 3: Commit**

```bash
git add curso/assets/playground/gl.js curso/assets/meshes/quad.json
git commit -m "feat(playground): nucleo WebGL1 (compile, quad, render, readPixels)"
```

> Nota: modo `mesh` (vertex shader do aluno + malhas cubo/esfera) é adicionado no plano-sequência do Módulo 7. O Módulo 1 usa apenas modo `fragment`. O `gl.js` já aceita `vertexSource` custom, então a extensão não quebra a API.

---

## Task 7: `playground.js` — Web Component `<shader-playground>`

**Files:**
- Create: `curso/assets/playground/playground.js`

Orquestra: lê config (atributo `data-config` JSON ou propriedade), monta DOM (canvas + editor + sliders + botões), roda o loop de render, e wira a checagem de exercício (pixel-diff contra `reference`).

- [ ] **Step 1: Implementar `playground.js`**

```javascript
import { normalizeConfig } from './config.js';
import { toControlSpecs } from './uniforms.js';
import { compare } from './pixeldiff.js';
import { extractRegion, reassemble } from './editable.js';
import { createContext, buildProgram, setupQuad, renderFrame, readPixels } from './gl.js';

class ShaderPlayground extends HTMLElement {
  connectedCallback() {
    let raw;
    try {
      raw = this._config || JSON.parse(this.getAttribute('data-config') || '{}');
      this.cfg = normalizeConfig(raw);
    } catch (e) {
      this.innerHTML = `<p class="pg-erro">Config inválida: ${e.message}</p>`;
      return;
    }
    this.controlSpecs = toControlSpecs(this.cfg.uniforms);
    this.controlValues = {};
    for (const s of this.controlSpecs) this.controlValues[s.name] = s.value;
    this.fullSource = this.cfg.fragment;
    this.start = performance.now();
    this._render();
    this._compile();
    this._loop();
  }

  set config(obj) { this._config = obj; }

  _render() {
    this.innerHTML = `
      <div class="pg">
        <canvas class="pg-canvas" width="320" height="320"></canvas>
        <div class="pg-controls"></div>
        ${this.cfg.editableRegions.length ? '<textarea class="pg-editor" spellcheck="false"></textarea>' : ''}
        <div class="pg-buttons">
          <button class="pg-run">▶ Test Drive</button>
          <button class="pg-reset">↺ Reset</button>
          ${this.cfg.reference ? '<button class="pg-check">✓ Conferir</button>' : ''}
          ${this.cfg.editableRegions.length ? '<button class="pg-solution">💡 Mostrar solução</button>' : ''}
        </div>
        <p class="pg-status" aria-live="polite"></p>
      </div>`;
    this.canvas = this.querySelector('.pg-canvas');
    this.statusEl = this.querySelector('.pg-status');

    // Sliders / color pickers
    const ctr = this.querySelector('.pg-controls');
    for (const s of this.controlSpecs) {
      const wrap = document.createElement('label');
      wrap.className = 'pg-control';
      if (s.kind === 'slider') {
        wrap.innerHTML = `<span>${s.label}</span>
          <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}">`;
        wrap.querySelector('input').addEventListener('input', (e) => {
          this.controlValues[s.name] = parseFloat(e.target.value);
        });
      } else {
        const hex = rgbToHex(s.value);
        wrap.innerHTML = `<span>${s.label}</span><input type="color" value="${hex}">`;
        wrap.querySelector('input').addEventListener('input', (e) => {
          this.controlValues[s.name] = hexToRgb(e.target.value);
        });
      }
      ctr.appendChild(wrap);
    }

    // Editor
    this.editor = this.querySelector('.pg-editor');
    if (this.editor) {
      this.editor.value = extractRegion(this.cfg.fragment, this.cfg.editableRegions[0]);
    }

    this.querySelector('.pg-run')?.addEventListener('click', () => this._applyEditorAndCompile());
    this.querySelector('.pg-reset')?.addEventListener('click', () => this._reset());
    this.querySelector('.pg-check')?.addEventListener('click', () => this._check());
    this.querySelector('.pg-solution')?.addEventListener('click', () => this._showSolution());
  }

  _applyEditorAndCompile() {
    if (this.editor) {
      this.fullSource = reassemble(this.cfg.fragment, this.cfg.editableRegions[0], this.editor.value);
    }
    this._compile();
  }

  _compile() {
    try {
      this.gl = this.gl || createContext(this.canvas);
      this.program = buildProgram(this.gl, withHeader(this.fullSource));
      this.indexCount = setupQuad(this.gl, this.program);
      this.statusEl.textContent = '';
      this.statusEl.className = 'pg-status';
    } catch (e) {
      this.statusEl.textContent = '⚠ ' + e.message;
      this.statusEl.className = 'pg-status pg-erro';
      this.program = null;
    }
  }

  _loop() {
    const frame = () => {
      if (this.program && this.gl) {
        renderFrame(this.gl, this.program, this.indexCount, {
          u_time: (performance.now() - this.start) / 1000,
          u_resolution: [this.canvas.width, this.canvas.height],
          controls: this.controlValues,
        });
      }
      this._raf = requestAnimationFrame(frame);
    };
    frame();
  }

  _reset() {
    this.fullSource = this.cfg.fragment;
    if (this.editor) this.editor.value = extractRegion(this.cfg.fragment, this.cfg.editableRegions[0]);
    for (const s of this.controlSpecs) this.controlValues[s.name] = s.value;
    this._render();
    this._compile();
  }

  async _check() {
    if (!this.cfg.reference) return;
    const actual = readPixels(this.gl);
    const ref = await loadReferencePixels(this.cfg.reference, this.canvas.width, this.canvas.height);
    const { score, pass } = compare(actual, ref, this.cfg.tolerance);
    const pct = Math.round(score * 100);
    this.statusEl.textContent = pass
      ? `✓ Mandou bem! (${pct}% igual ao alvo)`
      : `Quase! ${pct}% igual. Ajuste e tente de novo.`;
    this.statusEl.className = 'pg-status ' + (pass ? 'pg-ok' : 'pg-quase');
  }

  _showSolution() {
    if (this.cfg.solution && this.editor) {
      this.editor.value = this.cfg.solution;
      this._applyEditorAndCompile();
    }
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
  }
}

function withHeader(src) {
  // Cabeçalho GLSL ES padrão para todos os fragment shaders do curso.
  const header = `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_uv;
`;
  return src.includes('precision ') ? src : header + src;
}

function rgbToHex([r, g, b]) {
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

async function loadReferencePixels(url, w, h) {
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  // referência é desenhada com origem invertida p/ casar com readPixels (bottom-up)
  ctx.translate(0, h);
  ctx.scale(1, -1);
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

customElements.define('shader-playground', ShaderPlayground);
export { ShaderPlayground };
```

- [ ] **Step 2: Commit**

```bash
git add curso/assets/playground/playground.js
git commit -m "feat(playground): Web Component <shader-playground> com controles e check"
```

---

## Task 8: CSS do playground + dispositivos Head First

**Files:**
- Create: `curso/assets/css/playground.css`
- Create: `curso/assets/css/headfirst.css`

- [ ] **Step 1: Criar `playground.css`**

```css
.pg { border: 2px solid #2b2b2b; border-radius: 10px; padding: 12px; background: #fafafa; max-width: 360px; }
.pg-canvas { width: 320px; height: 320px; display: block; border-radius: 6px; background: #000; image-rendering: pixelated; }
.pg-controls { margin: 8px 0; display: flex; flex-direction: column; gap: 6px; }
.pg-control { display: flex; align-items: center; justify-content: space-between; font: 14px system-ui; gap: 8px; }
.pg-control input[type="range"] { flex: 1; }
.pg-editor { width: 100%; min-height: 90px; font: 13px ui-monospace, monospace; margin: 8px 0; border: 1px solid #bbb; border-radius: 6px; padding: 8px; box-sizing: border-box; }
.pg-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
.pg-buttons button { font: 14px system-ui; padding: 6px 10px; border: 1px solid #2b2b2b; border-radius: 6px; background: #fff; cursor: pointer; }
.pg-buttons button:hover { background: #efefef; }
.pg-status { font: 14px system-ui; min-height: 1.2em; margin: 6px 0 0; }
.pg-ok { color: #1a7f37; font-weight: bold; }
.pg-quase { color: #b35900; }
.pg-erro { color: #c0392b; font-family: ui-monospace, monospace; font-size: 13px; }
```

- [ ] **Step 2: Criar `headfirst.css`** (dispositivos da §3 do spec)

```css
:root { --hf-ink: #1c1c1c; --hf-accent: #d6336c; --hf-paper: #fffdf7; }
body.hf { max-width: 820px; margin: 0 auto; padding: 24px; font: 17px/1.6 Georgia, serif; color: var(--hf-ink); background: var(--hf-paper); }
.hf h1, .hf h2 { font-family: "Comic Sans MS", "Segoe Print", system-ui; }
.hf .afie { border: 2px dashed #888; border-radius: 8px; padding: 12px 16px; margin: 18px 0; background: #fff; }
.hf .afie::before { content: "✏️ Afie o lápis"; display: block; font-weight: bold; margin-bottom: 6px; }
.hf .brain { border-left: 5px solid var(--hf-accent); padding: 10px 16px; margin: 18px 0; background: #fff0f4; }
.hf .brain::before { content: "🧠 Brain Power"; display: block; font-weight: bold; color: var(--hf-accent); margin-bottom: 4px; }
.hf .qa { background: #eef6ff; border-radius: 8px; padding: 12px 16px; margin: 18px 0; }
.hf .qa::before { content: "Não existe pergunta idiota"; display: block; font-weight: bold; margin-bottom: 6px; }
.hf .qa dt { font-weight: bold; margin-top: 8px; }
.hf .cuidado { background: #fff6e5; border: 1px solid #e0a000; border-radius: 8px; padding: 10px 16px; margin: 18px 0; }
.hf .cuidado::before { content: "⚠️ Cuidado!"; display: block; font-weight: bold; color: #b35900; margin-bottom: 4px; }
.hf .sidebar { border: 1px solid #bbb; border-radius: 8px; margin: 18px 0; background: #f3f3f3; }
.hf .sidebar > summary { cursor: pointer; font-weight: bold; padding: 10px 16px; }
.hf .sidebar[open] > summary { border-bottom: 1px solid #ddd; }
.hf .sidebar > div { padding: 0 16px 12px; }
.hf .bullets { border-top: 3px double #888; padding-top: 12px; margin-top: 24px; }
.hf .bullets::before { content: "Pontos-chave"; display: block; font-weight: bold; margin-bottom: 6px; }
.hf figure { margin: 18px 0; text-align: center; }
.hf .img-todo { border: 2px dotted #c0392b; padding: 14px; color: #c0392b; font-family: ui-monospace, monospace; font-size: 14px; background: #fff; }
.hf .mascote { float: right; width: 90px; margin: 0 0 8px 12px; }
```

- [ ] **Step 3: Commit**

```bash
git add curso/assets/css/playground.css curso/assets/css/headfirst.css
git commit -m "feat(css): estilos do playground e dispositivos Head First"
```

---

## Task 9: Página de teste do playground (verificação visual)

**Files:**
- Create: `curso/_teste-playground.html`

Página isolada para verificar o motor antes de montar o Módulo 1.

- [ ] **Step 1: Criar `curso/_teste-playground.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Teste do Playground</title>
  <link rel="stylesheet" href="assets/css/playground.css">
  <script type="module" src="assets/playground/playground.js"></script>
</head>
<body>
  <h1>Teste 1 — cor por sliders</h1>
  <shader-playground id="t1"></shader-playground>

  <h1>Teste 2 — gradiente por UV + exercício editável</h1>
  <shader-playground id="t2"></shader-playground>

  <script type="module">
    document.getElementById('t1').config = {
      mode: 'fragment',
      fragment: `uniform vec3 u_cor;
void main() { gl_FragColor = vec4(u_cor, 1.0); }`,
      uniforms: [
        { name: 'u_cor', label: 'Cor', type: 'color', value: [0.2, 0.6, 1.0] },
      ],
    };
    document.getElementById('t2').config = {
      mode: 'fragment',
      fragment: `void main() {
// >>> EDIT: cor
  vec3 c = vec3(v_uv.x, v_uv.y, 0.0);
// <<< EDIT
  gl_FragColor = vec4(c, 1.0);
}`,
      editableRegions: ['cor'],
      solution: '  vec3 c = vec3(v_uv.x, 0.0, 1.0 - v_uv.x);',
    };
  </script>
</body>
</html>
```

- [ ] **Step 2: Subir servidor e verificar visualmente**

Run: `npm run serve` (em background) — depois abrir `http://localhost:8000/_teste-playground.html`

Use a skill `run` (ou o browser) para confirmar:
- Teste 1: canvas mostra cor; mover o color-picker muda a cor ao vivo.
- Teste 2: canvas mostra gradiente; editar a região + "Test Drive" recompila; "Reset" volta; "Mostrar solução" aplica.
- Console sem erros de compilação GLSL.

- [ ] **Step 3: Verificação obrigatória (evidência antes de seguir)**

REQUIRED SUB-SKILL: Use superpowers:verification-before-completion — confirmar com print/observação real do canvas renderizando, não suposição.

- [ ] **Step 4: Commit**

```bash
git add curso/_teste-playground.html
git commit -m "test(playground): pagina de verificacao visual do motor"
```

---

## Task 10: Diagrama SVG CPU×GPU (asset do Módulo 1)

**Files:**
- Create: `curso/assets/img/cpu-vs-gpu.svg`

- [ ] **Step 1: Criar `cpu-vs-gpu.svg`** (estilo desenhado, anotado)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 280" font-family="Comic Sans MS, system-ui">
  <rect width="640" height="280" fill="#fffdf7"/>
  <text x="160" y="30" text-anchor="middle" font-size="20" font-weight="bold">CPU</text>
  <text x="160" y="50" text-anchor="middle" font-size="13">poucos núcleos grandes</text>
  <g fill="#4c6ef5" stroke="#1c1c1c">
    <rect x="90" y="70" width="60" height="60" rx="6"/>
    <rect x="170" y="70" width="60" height="60" rx="6"/>
    <rect x="90" y="140" width="60" height="60" rx="6"/>
    <rect x="170" y="140" width="60" height="60" rx="6"/>
  </g>
  <text x="160" y="240" text-anchor="middle" font-size="13">faz 1 coisa de cada vez, muito rápido</text>

  <line x1="320" y1="40" x2="320" y2="240" stroke="#bbb" stroke-dasharray="4"/>

  <text x="480" y="30" text-anchor="middle" font-size="20" font-weight="bold">GPU</text>
  <text x="480" y="50" text-anchor="middle" font-size="13">milhares de núcleos pequenos</text>
  <g fill="#37b24d" stroke="#1c1c1c">
    <!-- grade 8x4 de mini-núcleos -->
    <!-- gerada manualmente -->
    <rect x="370" y="70" width="16" height="16"/><rect x="392" y="70" width="16" height="16"/><rect x="414" y="70" width="16" height="16"/><rect x="436" y="70" width="16" height="16"/><rect x="458" y="70" width="16" height="16"/><rect x="480" y="70" width="16" height="16"/><rect x="502" y="70" width="16" height="16"/><rect x="524" y="70" width="16" height="16"/>
    <rect x="370" y="92" width="16" height="16"/><rect x="392" y="92" width="16" height="16"/><rect x="414" y="92" width="16" height="16"/><rect x="436" y="92" width="16" height="16"/><rect x="458" y="92" width="16" height="16"/><rect x="480" y="92" width="16" height="16"/><rect x="502" y="92" width="16" height="16"/><rect x="524" y="92" width="16" height="16"/>
    <rect x="370" y="114" width="16" height="16"/><rect x="392" y="114" width="16" height="16"/><rect x="414" y="114" width="16" height="16"/><rect x="436" y="114" width="16" height="16"/><rect x="458" y="114" width="16" height="16"/><rect x="480" y="114" width="16" height="16"/><rect x="502" y="114" width="16" height="16"/><rect x="524" y="114" width="16" height="16"/>
    <rect x="370" y="136" width="16" height="16"/><rect x="392" y="136" width="16" height="16"/><rect x="414" y="136" width="16" height="16"/><rect x="436" y="136" width="16" height="16"/><rect x="458" y="136" width="16" height="16"/><rect x="480" y="136" width="16" height="16"/><rect x="502" y="136" width="16" height="16"/><rect x="524" y="136" width="16" height="16"/>
  </g>
  <text x="480" y="240" text-anchor="middle" font-size="13">faz milhares de coisas ao mesmo tempo</text>
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add curso/assets/img/cpu-vs-gpu.svg
git commit -m "asset(m1): diagrama SVG CPU vs GPU"
```

---

## Task 11: Módulo 1 — página do aluno

**Files:**
- Create: `curso/modulos/01-shaders-e-gpu.html`

Implementa a §5/Módulo 1 do spec com TODOS os dispositivos Head First obrigatórios (§3).

- [ ] **Step 1: Criar `curso/modulos/01-shaders-e-gpu.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Módulo 1 — Shaders & a GPU</title>
  <link rel="stylesheet" href="../assets/css/headfirst.css">
  <link rel="stylesheet" href="../assets/css/playground.css">
  <script type="module" src="../assets/playground/playground.js"></script>
</head>
<body class="hf">
  <p><a href="../index.html">← Mapa do curso</a> · Marco 1 · Módulo 1 de 6</p>
  <h1>Shaders &amp; a GPU</h1>
  <p><em>Como um joguinho desenha 2 milhões de pixels, 60 vezes por segundo, sem engasgar?</em>
  A resposta é um tipo de programa minúsculo e esquisito chamado <strong>shader</strong> — e um
  chip cheio de músculos chamado <strong>GPU</strong>. No fim deste módulo você vai escrever (sim,
  <em>você</em>) seu primeiro pedacinho de shader e mudar a cor da tela.</p>

  <h2>O que é um shader?</h2>
  <p>Um shader é um programinha que NÃO roda no cérebro principal do computador (a CPU). Ele roda
  lá na placa de vídeo. E o trabalho dele é responder uma pergunta boba, milhões de vezes:
  <strong>“que cor tem ESTE pixel?”</strong></p>

  <div class="brain">
    Antes de continuar: se a tela tem 2 milhões de pixels, e cada um precisa de uma cor...
    quantas vezes esse programinha vai rodar pra desenhar UM quadro do jogo? E 60 quadros por segundo?
  </div>

  <h2>Por que existe a GPU?</h2>
  <p>A CPU é genial, mas faz as coisas mais ou menos <em>uma de cada vez</em>. Pintar 2 milhões de
  pixels um por um, 60×/seg, ia derreter. A GPU resolve com força bruta: em vez de poucos núcleos
  grandes, ela tem <strong>milhares de núcleos pequenos</strong> pintando ao mesmo tempo.</p>

  <figure>
    <img src="../assets/img/cpu-vs-gpu.svg" alt="CPU com poucos núcleos grandes vs GPU com milhares de núcleos pequenos" width="640">
    <figcaption>CPU: poucos e fortes. GPU: muitos e simultâneos.</figcaption>
  </figure>

  <figure>
    <div class="img-todo">[IMAGEM: foto real de uma placa de vídeo (GPU) com o cooler]
    Fonte sugerida: https://commons.wikimedia.org/ (busque "graphics card") — baixe e salve em assets/img/gpu-foto.jpg, depois troque este bloco por &lt;img&gt;.</div>
  </figure>

  <p>Pensa numa <strong>linha de montagem de fábrica</strong>: entram números (a posição de cada
  pontinho do modelo 3D) e sai uma imagem pronta. Cada estação faz seu pedaço. A gente vai conhecer
  essa linha inteira ao longo do curso — por agora, foca na última estação: <em>pintar o pixel</em>.</p>

  <h2>Test Drive: sua primeira cor</h2>
  <p>O playground abaixo já tem um shader rodando. Ele faz uma coisa só: pinta a tela inteira com a
  cor que você escolher. Mexe no seletor de cor e veja a tela mudar <em>na hora</em>.</p>

  <shader-playground id="pg-cor"></shader-playground>

  <div class="afie">
    <p>Sem rodar ainda — <strong>preveja</strong>: se a cor for vermelho puro, quanto vale cada
    canal? Escreva nos três espacinhos (cada um vai de 0 a 1):</p>
    <p>R = ____  G = ____  B = ____</p>
    <p>Agora confira movendo o seletor pra vermelho. Acertou?</p>
  </div>

  <details class="sidebar">
    <summary>🧮 Matemática de bolso: o que é RGB?</summary>
    <div>
      <p>No computador, cor é só <strong>três números</strong>: quanto de <strong>R</strong>ermelho,
      <strong>G</strong> (verde) e <strong>B</strong> (azul). Aqui cada um vai de <code>0.0</code>
      (nada) a <code>1.0</code> (no talo). Branco = (1,1,1). Preto = (0,0,0). Roxo ≈ (0.5, 0, 0.5).</p>
    </div>
  </details>

  <div class="qa">
    <dl>
      <dt>Esse shader é uma linguagem nova?</dt>
      <dd>É GLSL — parecida com C. Você vai pegar aos poucos; por enquanto só leu uma linha.</dd>
      <dt>Por que a cor não tem o canal “alpha”?</dt>
      <dd>Tem! O <code>1.0</code> no fim (<code>vec4(cor, 1.0)</code>) é o alpha = opaco. Falaremos disso lá no módulo de transparência.</dd>
      <dt>Onde esse código roda mesmo?</dt>
      <dd>Na sua GPU, agora, dentro do navegador. Você está programando a placa de vídeo. 😎</dd>
    </dl>
  </div>

  <div class="cuidado">
    Um número de cor aqui vai de <strong>0 a 1</strong>, não de 0 a 255. Se você escrever
    <code>255.0</code>, a GPU entende “muito além do branco” e satura. Pense em porcentagem: 1.0 = 100%.
  </div>

  <div class="bullets">
    <ul>
      <li>Shader = programinha que decide a cor de cada pixel, rodando na GPU.</li>
      <li>A GPU tem milhares de núcleos pequenos pintando <em>ao mesmo tempo</em>.</li>
      <li>Cor = três números R, G, B, cada um de 0.0 a 1.0.</li>
      <li>O pipeline gráfico é uma linha de montagem; pintar o pixel é a última estação.</li>
    </ul>
  </div>

  <h2>Recordação: caça ao par</h2>
  <p>Ligue cada termo ao seu significado (escreva a letra):</p>
  <ul>
    <li>( ) Shader &nbsp;&nbsp; A. chip com milhares de núcleos</li>
    <li>( ) GPU &nbsp;&nbsp;&nbsp;&nbsp; B. programinha que pinta o pixel</li>
    <li>( ) RGB &nbsp;&nbsp;&nbsp;&nbsp; C. três números que formam uma cor</li>
  </ul>

  <p style="margin-top:28px"><a href="02-pixel-e-cor.html">Próximo: O Pixel e a Cor →</a>
  <span style="color:#999">(em construção no próximo plano)</span></p>

  <script type="module">
    document.getElementById('pg-cor').config = {
      mode: 'fragment',
      fragment: `uniform vec3 u_cor;
void main() {
  gl_FragColor = vec4(u_cor, 1.0);
}`,
      uniforms: [
        { name: 'u_cor', label: 'Cor da tela', type: 'color', value: [0.2, 0.6, 1.0] },
      ],
    };
  </script>
</body>
</html>
```

- [ ] **Step 2: Verificar visualmente**

Run: `npm run serve` → abrir `http://localhost:8000/modulos/01-shaders-e-gpu.html`
Confirmar: playground pinta e responde ao seletor; todos os dispositivos HF aparecem estilizados; SVG CPU×GPU visível; placeholder de imagem destacado.

- [ ] **Step 3: Commit**

```bash
git add curso/modulos/01-shaders-e-gpu.html
git commit -m "feat(m1): pagina do aluno - Shaders e a GPU (Head First completo)"
```

---

## Task 12: Módulo 1 — exercício com referência (pixel-diff)

**Files:**
- Create: `curso/assets/ref/m1-meio-a-meio.png` (gerado)
- Modify: `curso/modulos/01-shaders-e-gpu.html` (adicionar 2º playground-exercício)

- [ ] **Step 1: Gerar a imagem-referência** (320×320, metade esquerda vermelha, direita azul)

Criar e rodar `scripts/gen-ref-m1.mjs`:
```javascript
import { writeFileSync } from 'node:fs';
// PNG mínimo via canvas não está no node puro; geramos com a lib 'pngjs' do npm? Evitar deps.
// Alternativa sem deps: gerar via navegador. Ver Step 2.
console.log('Use o Step 2 (navegador) para gerar a referência.');
```

Como evitamos dependências, gere a referência pelo navegador: abrir `curso/_gen-ref.html`:
```html
<!doctype html><meta charset="utf-8">
<canvas id="c" width="320" height="320"></canvas>
<script>
  const ctx = document.getElementById('c').getContext('2d');
  ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 160, 320);
  ctx.fillStyle = '#0000ff'; ctx.fillRect(160, 0, 160, 320);
  // baixar
  const a = document.createElement('a');
  a.href = document.getElementById('c').toDataURL('image/png');
  a.download = 'm1-meio-a-meio.png';
  a.textContent = 'Baixar referência';
  document.body.appendChild(a);
</script>
```
Run: `npm run serve` → abrir `http://localhost:8000/_gen-ref.html` → clicar "Baixar referência" → mover o arquivo para `curso/assets/ref/m1-meio-a-meio.png`.

- [ ] **Step 2: Adicionar o playground-exercício** ao final do conteúdo de `01-shaders-e-gpu.html`, antes de "Recordação":

```html
  <h2>Afie o lápis: pinte metade e metade</h2>
  <p>Desafio: faça a metade <strong>esquerda</strong> da tela vermelha e a <strong>direita</strong>
  azul. Dica: <code>v_uv.x</code> vai de 0 (esquerda) a 1 (direita). A função <code>step(0.5, x)</code>
  devolve 0 antes de 0.5 e 1 depois. Edite, dê <em>Test Drive</em> e clique <em>Conferir</em>.</p>
  <shader-playground id="pg-ex"></shader-playground>
```

E no `<script>` final, adicionar:
```javascript
    document.getElementById('pg-ex').config = {
      mode: 'fragment',
      fragment: `void main() {
// >>> EDIT: cor
  vec3 c = vec3(v_uv.x, v_uv.y, 0.0);
// <<< EDIT
  gl_FragColor = vec4(c, 1.0);
}`,
      editableRegions: ['cor'],
      solution: '  float m = step(0.5, v_uv.x);\n  vec3 c = mix(vec3(1.0,0.0,0.0), vec3(0.0,0.0,1.0), m);',
      reference: '../assets/ref/m1-meio-a-meio.png',
      tolerance: 0.06,
    };
```

- [ ] **Step 3: Verificar o ciclo de exercício**

Run: `npm run serve` → abrir o Módulo 1 → no exercício, colar a solução via "Mostrar solução" → "Conferir" deve dar verde ("Mandou bem"). Editar errado → "Conferir" dá "Quase".

REQUIRED SUB-SKILL: Use superpowers:verification-before-completion — evidência real do verde antes de marcar pronto.

- [ ] **Step 4: Commit**

```bash
git add curso/assets/ref/m1-meio-a-meio.png curso/modulos/01-shaders-e-gpu.html curso/_gen-ref.html
git commit -m "feat(m1): exercicio pixel-diff meio-a-meio com referencia"
```

---

## Task 13: Módulo 1 — guia do professor

**Files:**
- Create: `curso/professor/01-guia.md`

- [ ] **Step 1: Criar `curso/professor/01-guia.md`**

```markdown
# Guia do Professor — Módulo 1: Shaders & a GPU

**Tempo estimado:** 1 aula (45–50 min).

## Objetivos de aprendizagem
- Definir shader e o papel da GPU (paralelismo) em linguagem simples.
- Entender cor como (R,G,B) em [0,1].
- Fazer a primeira alteração de shader (cor) com sucesso.

## Roteiro sugerido
1. (5 min) Gancho: pergunte "como um jogo desenha 2 milhões de pixels 60×/seg?". Colha palpites.
2. (10 min) CPU × GPU com o diagrama. Use a analogia da linha de montagem.
3. (15 min) Test Drive coletivo: todos mexem no seletor de cor. Puxe o "Afie o lápis" do vermelho.
4. (10 min) Exercício meio-a-meio. Deixe tentarem antes de revelar `step`.
5. (5 min) Bullet points + caça ao par como saída.

## Pontos de tropeço comuns
- **0–1 vs 0–255:** o erro nº1. Reforce "pense em porcentagem".
- **Pixel vs coordenada:** alguns acham que `v_uv` é "o pixel". É a posição normalizada.
- **"Onde isso roda":** reforce que é a GPU real deles, no navegador.

## Gabarito
- Afie o lápis (vermelho): R=1, G=0, B=0.
- Caça ao par: Shader→B, GPU→A, RGB→C.
- Exercício meio-a-meio: `step(0.5, v_uv.x)` + `mix(vermelho, azul, m)`.

## Avaliação sugerida
Peça uma cor autoral nomeada (ex.: "meu roxo favorito") com os 3 valores e um print do canvas.
Rubrica: usou [0,1] corretamente (1pt), cor confere com os números (1pt), print anexado (1pt).
```

- [ ] **Step 2: Commit**

```bash
git add curso/professor/01-guia.md
git commit -m "docs(m1): guia do professor"
```

---

## Task 14: Capa / mapa do curso

**Files:**
- Create: `curso/index.html`

- [ ] **Step 1: Criar `curso/index.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Curso de Shaders, GPU e Pipeline Gráfica</title>
  <link rel="stylesheet" href="assets/css/headfirst.css">
</head>
<body class="hf">
  <h1>Shaders, GPU &amp; Pipeline Gráfica</h1>
  <p>Um curso pra você entender — e <em>fazer</em> — a mágica que desenha os jogos. Sem enrolação,
  com muito “mão na massa”.</p>

  <h2>Marco 1 — Pinte o Pixel <span style="color:#37b24d">(curso curto)</span></h2>
  <ol>
    <li><a href="modulos/01-shaders-e-gpu.html">Shaders &amp; a GPU</a></li>
    <li>O Pixel e a Cor <span style="color:#999">(em breve)</span></li>
    <li>Matemática que Vira Imagem <span style="color:#999">(em breve)</span></li>
    <li>Formas e Padrões <span style="color:#999">(em breve)</span></li>
    <li>Dando Vida: Animação <span style="color:#999">(em breve)</span></li>
    <li>🏗️ Por Baixo do Capô I: Paralelismo <span style="color:#999">(em breve)</span></li>
  </ol>
  <p><strong>🏆 Projeto-Vitória:</strong> Meu Padrão Animado</p>

  <h2 style="color:#999">Marco 2 — Superfícies de Verdade (curso médio)</h2>
  <h2 style="color:#999">Marco 3 — O Poder da GPU (curso longo)</h2>
</body>
</html>
```

- [ ] **Step 2: Verificação final + rodar todos os testes**

Run: `npm test`
Expected: PASS — todos os testes de config/uniforms/pixeldiff/editable passam.

Run: `npm run serve` → navegar index → Módulo 1 → exercício verde. Confirmar visualmente.

- [ ] **Step 3: Commit**

```bash
git add curso/index.html
git commit -m "feat: capa e mapa do curso (Marco 1)"
```

---

## Task 15: Push final

- [ ] **Step 1: Rodar a suíte completa**

Run: `npm test`
Expected: PASS (todos).

- [ ] **Step 2: Push**

```bash
git push origin main
```
Expected: branch atualizada no remoto, sem conteúdo de `Curso/`/`Transcricoes/`/`cookies.txt` (protegidos por `.gitignore`).

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura do spec (fatia desta vertical):**
- §2.2 ShaderPlayground 2 modos → Tasks 6–7 (modo fragment completo; modo mesh adiado ao plano do M7, API já preparada). ✔ (com nota de adiamento explícita)
- §2.2 uniforms-as-sliders → Task 3 + Task 7. ✔
- §2.2 pixel-diff de exercício → Task 4 + Task 12. ✔
- §2.2 regiões editáveis + reset + solução → Task 5 + Task 7. ✔
- §2.2 WebGL1 → Task 6 (`webgl`/`experimental-webgl`). ✔
- §2.3 esqueleto Head First → Task 8 (CSS) + Task 11 (página usa todos os dispositivos). ✔
- §2.5 política de imagens (SVG + placeholder com link) → Task 10 (SVG) + Task 11 (bloco `[IMAGEM:]`). ✔
- §3 dispositivos obrigatórios → Task 11 contém afie-o-lápis, brain power, Q&A, cuidado, bullets, recordação. ✔
- §2.4 camada professor → Task 13. ✔
- §5 Módulo 1 (objetivo/conceitos/analogia/fonte/demos/sidebar/imagens/professor) → Tasks 10–13. ✔
- Marcos 2–3 e Módulos 2–6 → fora desta fatia (plano-sequência). ✔ (declarado no header)

**Placeholder scan:** O único `[IMAGEM:]` é intencional (política do spec, com link de fonte). Nenhum TODO/TBD de código. ✔

**Consistência de tipos:** `normalizeConfig` retorna mode, fragment, vertex, mesh, uniforms, editableRegions, reference, **solution**, tolerance — todos consumidos por `playground.js`. `solution` agora preservado (corrigido inline na Task 2/Step 3). `compare`/`toControlSpecs`/`extractRegion`/`reassemble` batem com os usos em `playground.js`. ✔
