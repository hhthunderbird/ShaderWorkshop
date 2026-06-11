# Marco 2 — Fatia Vertical (motor modo `mesh` + Módulo 7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o modo `mesh` ao motor `ShaderPlayground` (malhas 3D, matriz MVP caixa-preta, varyings de normal/uv) e entregar o Módulo 7 ("Saindo do Quad: Vértices & Pipeline") com um cubo 3D girando.

**Architecture:** Dois módulos puros novos — `mat4.js` (matrizes 4×4 column-major) e `geometry.js` (gera cubo/esfera) — testáveis em node sem WebGL. O `gl.js` ganha `setupMesh` + um vertex shader padrão `MESH_VERTEX`. O `playground.js` ganha o caminho `mode === 'mesh'`: monta a geometria, calcula `u_mvp`/`u_model`/`u_normalMatrix` por frame via `mat4.js`, e injeta os varyings 3D via `header.js`. O aluno escreve só o fragment; o vertex é padrão (caixa-preta). Textura e luz difusa ficam para os planos do M9/M10 — esta fatia só expõe os varyings/uniforms para eles.

**Tech Stack:** JS vanilla ES modules, WebGL1/GLSL ES, `node --test` (sem browser para os módulos puros), verificação visual no Chrome para o caminho WebGL.

---

## Estrutura de arquivos

- **Criar** `site/assets/playground/mat4.js` — matrizes 4×4 column-major (puro).
- **Criar** `site/assets/playground/geometry.js` — gera malhas cubo/esfera (puro).
- **Criar** `test/mat4.test.js`, `test/geometry.test.js`, `test/module7.integration.test.js`.
- **Criar** `site/modulos/07-vertices-e-pipeline.html`, `site/professor/07-guia.md`, `site/assets/img/pipeline.svg`.
- **Modificar** `site/assets/playground/config.js` — normalizar `mesh`/`light`.
- **Modificar** `site/assets/playground/gl.js` — `setupMesh`, `MESH_VERTEX`, uniforms de matriz em `renderFrame`.
- **Modificar** `site/assets/playground/header.js` — injeção de varyings/uniforms no modo mesh.
- **Modificar** `site/assets/playground/playground.js` — caminho `mode === 'mesh'`.
- **Modificar** `site/index.html` (link M7) e `site/modulos/06-paralelismo.html` (link "Próximo").

---

## Task 1: `mat4.js` — matrizes 4×4 (column-major)

**Files:**
- Create: `site/assets/playground/mat4.js`
- Test: `test/mat4.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/mat4.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identity, multiply, perspective, translation, rotateY, mat3FromMat4 } from '../site/assets/playground/mat4.js';

const approx = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);
const approxArr = (a, b, eps = 1e-5) => { assert.equal(a.length, b.length); for (let i = 0; i < a.length; i++) approx(a[i], b[i], eps); };

test('identity é a matriz identidade 4x4', () => {
  approxArr(identity(), [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
});

test('multiply por identidade devolve a propria matriz', () => {
  const m = translation(2, 3, 4);
  approxArr(multiply(m, identity()), m);
  approxArr(multiply(identity(), m), m);
});

test('translation coloca a translacao na 4a coluna (column-major)', () => {
  approxArr(translation(2, 3, 4), [1,0,0,0, 0,1,0,0, 0,0,1,0, 2,3,4,1]);
});

test('rotateY(PI/2) gira +X para -Z (column-major, regra da mao direita)', () => {
  const m = rotateY(Math.PI / 2);
  // aplica em (1,0,0,1): coluna 0 da matriz = imagem de X. Esperado ~ (0,0,-1)
  approx(m[0], 0); approx(m[2], -1);
});

test('multiply compoe na ordem A*B (aplica B depois A)', () => {
  // T(1,0,0) * R: a rotacao acontece primeiro, depois translada
  const r = rotateY(Math.PI / 2);
  const t = translation(1, 0, 0);
  const m = multiply(t, r);
  // imagem de (0,0,0,1) = so a translacao -> (1,0,0)
  approx(m[12], 1); approx(m[13], 0); approx(m[14], 0);
});

test('perspective produz matriz com -1 em [11] (w = -z)', () => {
  const p = perspective(Math.PI / 2, 1, 0.1, 100);
  approx(p[11], -1);
  approx(p[5], 1); // 1/tan(fovy/2) com fovy=90 => 1
});

test('mat3FromMat4 extrai a 3x3 superior-esquerda (column-major)', () => {
  const m = [1,2,3,0, 4,5,6,0, 7,8,9,0, 10,11,12,1];
  approxArr(mat3FromMat4(m), [1,2,3, 4,5,6, 7,8,9]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/mat4.test.js`
Expected: FAIL — `Cannot find module '.../mat4.js'`.

- [ ] **Step 3: Write minimal implementation**

```js
// site/assets/playground/mat4.js
// Matrizes 4x4 column-major (convenção WebGL). Cada matriz é um Array de 16.
// O índice [col*4 + row]. multiply(a,b) = a·b (aplica b, depois a).

export function identity() {
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
}

export function multiply(a, b) {
  const out = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = s;
    }
  }
  return out;
}

export function translation(x, y, z) {
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
}

export function scaling(x, y, z) {
  return [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
}

export function rotateY(rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  // column-major: coluna 0 = (c,0,-s), coluna 2 = (s,0,c)
  return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];
}

export function rotateX(rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];
}

export function perspective(fovyRad, aspect, near, far) {
  const f = 1 / Math.tan(fovyRad / 2);
  const nf = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ];
}

// 3x3 superior-esquerda (válida como normal matrix p/ rotação + escala uniforme,
// que é tudo que o curso usa). Column-major (Array de 9).
export function mat3FromMat4(m) {
  return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/mat4.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/mat4.js test/mat4.test.js
git commit -m "feat(motor): mat4.js (matrizes 4x4 column-major) para o modo mesh"
```

---

## Task 2: `geometry.js` — gera cubo e esfera

**Files:**
- Create: `site/assets/playground/geometry.js`
- Test: `test/geometry.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/geometry.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cube, sphere } from '../site/assets/playground/geometry.js';

test('cube: 24 vertices (4 por face), 36 indices, normais unitarias', () => {
  const g = cube();
  assert.equal(g.positions.length, 24 * 3);
  assert.equal(g.uvs.length, 24 * 2);
  assert.equal(g.normals.length, 24 * 3);
  assert.equal(g.indices.length, 36);
  // cada normal tem comprimento ~1
  for (let i = 0; i < g.normals.length; i += 3) {
    const n = Math.hypot(g.normals[i], g.normals[i + 1], g.normals[i + 2]);
    assert.ok(Math.abs(n - 1) < 1e-6, `normal unitaria, got ${n}`);
  }
  // posicoes do cubo no range [-0.5, 0.5]
  for (const p of g.positions) assert.ok(p >= -0.5001 && p <= 0.5001);
  // indices apontam pra vertices validos
  for (const idx of g.indices) assert.ok(idx >= 0 && idx < 24);
});

test('sphere(8): normais unitarias e posicoes sobre a esfera unitaria (raio 0.5)', () => {
  const g = sphere(8);
  assert.ok(g.positions.length > 0);
  assert.equal(g.positions.length, g.normals.length);
  assert.equal(g.positions.length / 3 * 2, g.uvs.length);
  for (let i = 0; i < g.positions.length; i += 3) {
    const r = Math.hypot(g.positions[i], g.positions[i + 1], g.positions[i + 2]);
    assert.ok(Math.abs(r - 0.5) < 1e-5, `raio 0.5, got ${r}`);
    const n = Math.hypot(g.normals[i], g.normals[i + 1], g.normals[i + 2]);
    assert.ok(Math.abs(n - 1) < 1e-5, `normal unitaria, got ${n}`);
  }
  assert.equal(g.indices.length % 3, 0);
});

test('saidas sao tipadas (Float32Array / Uint16Array)', () => {
  const g = cube();
  assert.ok(g.positions instanceof Float32Array);
  assert.ok(g.indices instanceof Uint16Array);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/geometry.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
// site/assets/playground/geometry.js
// Gera malhas em JS (sem loader). Retorna {positions, normals, uvs, indices}.
// Cubo centrado na origem, lado 1 (range [-0.5, 0.5]). Esfera raio 0.5.

export function cube() {
  // 6 faces, 4 vértices cada (normais por face). +X,-X,+Y,-Y,+Z,-Z
  const faces = [
    { n: [ 1, 0, 0], v: [[ 0.5,-0.5, 0.5],[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[ 0.5, 0.5, 0.5]] },
    { n: [-1, 0, 0], v: [[-0.5,-0.5,-0.5],[-0.5,-0.5, 0.5],[-0.5, 0.5, 0.5],[-0.5, 0.5,-0.5]] },
    { n: [ 0, 1, 0], v: [[-0.5, 0.5, 0.5],[ 0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5]] },
    { n: [ 0,-1, 0], v: [[-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5, 0.5]] },
    { n: [ 0, 0, 1], v: [[-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5]] },
    { n: [ 0, 0,-1], v: [[ 0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5, 0.5,-0.5]] },
  ];
  const positions = [], normals = [], uvs = [], indices = [];
  const uvCorners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  faces.forEach((f, fi) => {
    for (let i = 0; i < 4; i++) {
      positions.push(...f.v[i]);
      normals.push(...f.n);
      uvs.push(...uvCorners[i]);
    }
    const o = fi * 4;
    indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}

export function sphere(segments = 24) {
  const positions = [], normals = [], uvs = [], indices = [];
  const R = 0.5;
  for (let y = 0; y <= segments; y++) {
    const v = y / segments;
    const phi = v * Math.PI;            // 0..PI (polo a polo)
    for (let x = 0; x <= segments; x++) {
      const u = x / segments;
      const theta = u * 2 * Math.PI;    // 0..2PI (volta)
      const nx = Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(theta);
      normals.push(nx, ny, nz);
      positions.push(nx * R, ny * R, nz * R);
      uvs.push(u, 1 - v);
    }
  }
  const row = segments + 1;
  for (let y = 0; y < segments; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * row + x;
      const b = a + row;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/geometry.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/geometry.js test/geometry.test.js
git commit -m "feat(motor): geometry.js (gera cubo e esfera) para o modo mesh"
```

---

## Task 3: `config.js` — normalizar `mesh` e `light`

**Files:**
- Modify: `site/assets/playground/config.js`
- Test: `test/config.test.js` (adicionar casos)

- [ ] **Step 1: Write the failing test (append a `test/config.test.js`)**

```js
test('mesh: cube/sphere/quad sao validos; default mesh continua quad', () => {
  assert.equal(normalizeConfig({ fragment: 'x' }).mesh, 'quad');
  assert.equal(normalizeConfig({ mode: 'mesh', fragment: 'x', mesh: 'cube' }).mesh, 'cube');
  assert.equal(normalizeConfig({ mode: 'mesh', fragment: 'x', mesh: 'sphere' }).mesh, 'sphere');
});

test('light: default direcional; aceita override vec3', () => {
  assert.deepEqual(normalizeConfig({ fragment: 'x' }).light, [0.5, 0.7, 1.0]);
  assert.deepEqual(
    normalizeConfig({ fragment: 'x', light: [1, 0, 0] }).light,
    [1, 0, 0]
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/config.test.js`
Expected: FAIL — `mesh` é `'quad'` mas `light` é `undefined` (campo não existe ainda).

- [ ] **Step 3: Edit `config.js`**

Em `normalizeConfig`, dentro do objeto retornado, após a linha `exportable: raw.exportable === true,` adicione:

```js
    light: Array.isArray(raw.light) && raw.light.length === 3 ? raw.light : [0.5, 0.7, 1.0],
```

(O campo `mesh` já é normalizado: `mesh: raw.mesh ?? 'quad'`. Confirme que `VALID_MODES` inclui `'mesh'` — já inclui.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/config.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/config.js test/config.test.js
git commit -m "feat(motor): config aceita light (direcao de luz) para o modo mesh"
```

---

## Task 4: `header.js` — injeção de varyings/uniforms no modo mesh

**Files:**
- Modify: `site/assets/playground/header.js`
- Test: `test/header.test.js` (adicionar casos)

O `withHeader` atual injeta o conjunto do modo fragment. O modo mesh precisa de varyings extras
(`v_normal`, `v_worldPos`) e dos uniforms de matriz/luz/textura — declaração-aware (não duplicar).
Adicionamos um parâmetro `mode`.

- [ ] **Step 1: Write the failing test (append a `test/header.test.js`)**

```js
import { withHeaderMesh } from '../site/assets/playground/header.js';

test('withHeaderMesh injeta varyings 3D e uniforms quando ausentes', () => {
  const src = `void main(){ gl_FragColor = vec4(v_normal * 0.5 + 0.5, 1.0); }`;
  const out = withHeaderMesh(src);
  assert.match(out, /varying vec3 v_normal;/);
  assert.match(out, /varying vec2 v_uv;/);
  assert.match(out, /varying vec3 v_worldPos;/);
  assert.match(out, /uniform vec3 u_lightDir;/);
  assert.ok(out.indexOf('varying vec3 v_normal;') < out.indexOf('void main'));
});

test('withHeaderMesh nao duplica o que o aluno ja declarou', () => {
  const src = `varying vec3 v_normal;\nvoid main(){ gl_FragColor = vec4(v_normal,1.0); }`;
  const out = withHeaderMesh(src);
  assert.equal((out.match(/varying vec3 v_normal;/g) || []).length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/header.test.js`
Expected: FAIL — `withHeaderMesh` não existe.

- [ ] **Step 3: Edit `header.js` (adicionar export, reusando `hasDeclaration`)**

```js
// Header do modo mesh: além do v_uv, declara normal/worldPos e os uniforms 3D.
// NÃO injeta u_time aqui pra ficar mínimo? Injeta sim — animação usa u_time.
export function withHeaderMesh(src) {
  const hasPrecision = /^\s*precision\s/m.test(src);
  const addIfMissing = (decl, name) => (hasDeclaration(src, name) ? '' : decl + '\n');
  return (
    (hasPrecision ? '' : 'precision mediump float;\n') +
    addIfMissing('uniform float u_time;', 'u_time') +
    addIfMissing('uniform vec3 u_lightDir;', 'u_lightDir') +
    addIfMissing('uniform sampler2D u_tex;', 'u_tex') +
    addIfMissing('varying vec2 v_uv;', 'v_uv') +
    addIfMissing('varying vec3 v_normal;', 'v_normal') +
    addIfMissing('varying vec3 v_worldPos;', 'v_worldPos') +
    src
  );
}
```

(Nota: `u_tex` é declarado mas só usado a partir do M9; declarar agora é inócuo — uniform não usado é
otimizado fora e `getUniformLocation` retorna null, que `renderFrame` já trata.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/header.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/header.js test/header.test.js
git commit -m "feat(motor): withHeaderMesh (varyings 3D + uniforms) para o modo mesh"
```

---

## Task 5: `gl.js` — `MESH_VERTEX`, `setupMesh`, uniforms de matriz

**Files:**
- Modify: `site/assets/playground/gl.js`

WebGL puro, verificado visualmente (não por unit test). Adiciona o vertex shader padrão do modo mesh,
o setup de buffers de malha (com índices e 3 atributos) e o envio dos uniforms de matriz em
`renderFrame`.

- [ ] **Step 1: Adicionar `MESH_VERTEX` no topo de `gl.js` (após `QUAD_VERTEX`)**

```js
// Vertex shader padrão do modo mesh: aplica a MVP (caixa-preta) e repassa
// uv, normal (em mundo) e posição em mundo. O aluno normalmente NÃO edita isto.
const MESH_VERTEX = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;
uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normalMatrix;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_worldPos;
void main() {
  v_uv = a_uv;
  v_normal = normalize(u_normalMatrix * a_normal);
  v_worldPos = (u_model * vec4(a_position, 1.0)).xyz;
  gl_Position = u_mvp * vec4(a_position, 1.0);
}`;

export { MESH_VERTEX };
```

- [ ] **Step 2: Adicionar `setupMesh` (após `setupQuad`)**

```js
// Cria buffers de uma malha {positions, normals, uvs, indices} e liga os atributos.
// Retorna a contagem de índices (p/ drawElements).
export function setupMesh(gl, program, geo) {
  const bind = (data, attr, size) => {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, attr);
    if (loc !== -1) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  };
  bind(geo.positions, 'a_position', 3);
  bind(geo.normals, 'a_normal', 3);
  bind(geo.uvs, 'a_uv', 2);
  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);
  return geo.indices.length;
}
```

- [ ] **Step 3: Estender `renderFrame` para enviar matrizes e habilitar profundidade**

No `renderFrame`, após o bloco que seta `u_mouse` e antes do loop de `controls`, adicione o envio das
matrizes (quando presentes em `uniforms`):

```js
  if (uniforms.u_mvp) set('u_mvp', (l) => gl.uniformMatrix4fv(l, false, new Float32Array(uniforms.u_mvp)));
  if (uniforms.u_model) set('u_model', (l) => gl.uniformMatrix4fv(l, false, new Float32Array(uniforms.u_model)));
  if (uniforms.u_normalMatrix) set('u_normalMatrix', (l) => gl.uniformMatrix3fv(l, false, new Float32Array(uniforms.u_normalMatrix)));
  if (uniforms.u_lightDir) set('u_lightDir', (l) => gl.uniform3f(l, uniforms.u_lightDir[0], uniforms.u_lightDir[1], uniforms.u_lightDir[2]));
```

E, logo antes do `gl.clear(...)`, habilite o teste de profundidade (necessário p/ 3D sólido):

```js
  gl.enable(gl.DEPTH_TEST);
```

E troque a linha do clear para limpar também o depth buffer:

```js
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT_PLACEHOLDER);
```

> **Atenção (sem placeholder na prática):** a constante correta é `gl.DEPTH_BUFFER_BIT`. Escreva:
> `gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);`

- [ ] **Step 4: Verificação rápida de sintaxe (node importa o módulo)**

Run: `node -e "import('./site/assets/playground/gl.js').then(m=>console.log(typeof m.setupMesh, typeof m.MESH_VERTEX))"`
Expected: `function string`

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/gl.js
git commit -m "feat(motor): gl.js ganha MESH_VERTEX, setupMesh e uniforms de matriz/luz + depth test"
```

---

## Task 6: `playground.js` — caminho `mode === 'mesh'`

**Files:**
- Modify: `site/assets/playground/playground.js`

Integra tudo: no modo mesh, monta a geometria, compila o programa com o `MESH_VERTEX` + fragment do
aluno (via `withHeaderMesh`), e a cada frame calcula `u_mvp`/`u_model`/`u_normalMatrix` com `mat4.js`
e passa pra `renderFrame`.

- [ ] **Step 1: Adicionar imports no topo de `playground.js`**

```js
import { withHeader, withHeaderMesh } from './header.js';
import { MESH_VERTEX, setupMesh } from './gl.js';
import { cube, sphere } from './geometry.js';
import { identity, multiply, perspective, translation, rotateX, rotateY, mat3FromMat4 } from './mat4.js';
```

(Ajuste a linha de import existente de `gl.js` para incluir `MESH_VERTEX, setupMesh`, e a de
`header.js` para incluir `withHeaderMesh`.)

- [ ] **Step 2: No `_compile`, ramificar por modo**

Substitua o corpo do `try` em `_compile()` por:

```js
    try {
      this.gl = this.gl || createContext(this.canvas);
      const gl = this.gl;
      if (this.cfg.mode === 'mesh') {
        this.geo = this.geo || (this.cfg.mesh === 'sphere' ? sphere(28) : cube());
        this.program = buildProgram(gl, withHeaderMesh(this.fullSource), MESH_VERTEX);
        this.indexCount = setupMesh(gl, this.program, this.geo);
      } else {
        this.program = buildProgram(gl, withHeader(this.fullSource));
        this.indexCount = setupQuad(gl, this.program);
      }
      this.statusEl.textContent = '';
      this.statusEl.className = 'pg-status';
    } catch (e) {
      this.statusEl.textContent = '⚠ ' + e.message;
      this.statusEl.className = 'pg-status pg-erro';
      this.program = null;
    }
```

(Garanta que `setupQuad` continua importado de `gl.js`.)

- [ ] **Step 3: No `_loop`, montar os uniforms de matriz no modo mesh**

Substitua o corpo de `frame` em `_loop()` por:

```js
    const frame = () => {
      if (this.program && this.gl) {
        const t = (performance.now() - this.start) / 1000;
        const base = {
          u_time: t,
          u_resolution: [this.canvas.width, this.canvas.height],
          controls: this.controlValues,
        };
        if (this.cfg.mode === 'mesh') {
          const vel = this.controlValues.u_vel ?? 0.6;
          const model = multiply(rotateY(t * vel), rotateX(0.5));
          const view = translation(0, 0, -3);
          const proj = perspective(Math.PI / 4, 1, 0.1, 100);
          const mvp = multiply(proj, multiply(view, model));
          base.u_mvp = mvp;
          base.u_model = model;
          base.u_normalMatrix = mat3FromMat4(model);
          base.u_lightDir = this.cfg.light;
        }
        renderFrame(this.gl, this.program, this.indexCount, base);
      }
      this._raf = requestAnimationFrame(frame);
    };
    frame();
```

- [ ] **Step 4: Verificação de sintaxe (node importa sem WebGL — só checa parse)**

Run: `node -e "import('./site/assets/playground/playground.js').then(()=>console.log('ok')).catch(e=>{console.log('parse',e.message)})"`
Expected: imprime `ok` OU um erro de `customElements`/`HTMLElement` is not defined (ambiente node) — **isso é esperado** e prova que o PARSE passou. Um `SyntaxError` aqui seria falha real a corrigir.

- [ ] **Step 5: Commit**

```bash
git add site/assets/playground/playground.js
git commit -m "feat(motor): playground modo mesh (geometria + MVP por frame via mat4)"
```

---

## Task 7: Módulo 7 — página HTML + SVG + teste de integração

**Files:**
- Create: `site/modulos/07-vertices-e-pipeline.html`
- Create: `site/assets/img/pipeline.svg`
- Create: `test/module7.integration.test.js`

- [ ] **Step 1: Criar `site/assets/img/pipeline.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 200" width="720" height="200" font-family="system-ui, sans-serif">
  <rect width="720" height="200" fill="#fff"/>
  <text x="360" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#333">A linha de montagem: do vértice ao pixel</text>
  <!-- 3 estagios -->
  <g transform="translate(20,50)">
    <rect x="0" y="0" width="200" height="110" rx="8" fill="#e7f5ff" stroke="#1971c2" stroke-width="2"/>
    <text x="100" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#1971c2">1. Vértices</text>
    <!-- pontos de um triangulo -->
    <circle cx="55" cy="80" r="5" fill="#1971c2"/><circle cx="145" cy="80" r="5" fill="#1971c2"/><circle cx="100" cy="45" r="5" fill="#1971c2"/>
    <text x="100" y="104" text-anchor="middle" font-size="10" fill="#666">o vertex shader os POSICIONA</text>
  </g>
  <text x="240" y="108" font-size="22" fill="#888">→</text>
  <g transform="translate(260,50)">
    <rect x="0" y="0" width="200" height="110" rx="8" fill="#fff9db" stroke="#e8590c" stroke-width="2"/>
    <text x="100" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#e8590c">2. Rasterização</text>
    <polygon points="55,80 145,80 100,45" fill="none" stroke="#e8590c"/>
    <text x="100" y="104" text-anchor="middle" font-size="10" fill="#666">vira muitos fragmentos (pixels)</text>
  </g>
  <text x="480" y="108" font-size="22" fill="#888">→</text>
  <g transform="translate(500,50)">
    <rect x="0" y="0" width="200" height="110" rx="8" fill="#ebfbee" stroke="#2f9e44" stroke-width="2"/>
    <text x="100" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#2f9e44">3. Fragmentos</text>
    <g fill="#2f9e44"><rect x="60" y="60" width="10" height="10"/><rect x="72" y="60" width="10" height="10"/><rect x="84" y="60" width="10" height="10"/><rect x="120" y="60" width="10" height="10"/><rect x="90" y="48" width="10" height="10"/></g>
    <text x="100" y="104" text-anchor="middle" font-size="10" fill="#666">o fragment shader os PINTA</text>
  </g>
</svg>
```

- [ ] **Step 2: Criar `site/modulos/07-vertices-e-pipeline.html`**

Página Head First seguindo os sub-blocos do spec (M7: malha → split posição/cor → MVP/pipeline).
Dois playgrounds: `pg-cubo` (cubo girando, fragment colorindo por face/posição) e `pg-cor` (mesmo
cubo, fragment editável que colore por `v_uv` ou posição). Cor por POSIÇÃO/face, **não por normal**.

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Módulo 7 — Saindo do Quad: Vértices &amp; Pipeline</title>
  <link rel="stylesheet" href="../assets/css/headfirst.css">
  <link rel="stylesheet" href="../assets/css/playground.css">
  <script type="module" src="../assets/playground/playground.js"></script>
</head>
<body class="hf">
  <p><a href="../index.html">← Mapa do curso</a> · Marco 2 · Módulo 7 de 11</p>
  <h1>Saindo do Quad: Vértices &amp; Pipeline</h1>
  <p>Até aqui sua tela era um retângulo plano (um <em>quad</em>). Hora de sair dele: vamos desenhar um
  objeto 3D de verdade — um cubo — que gira na sua frente. E você vai ver que, por baixo, continua
  sendo o mesmo jogo de pintar pixels.</p>

  <h2>1. Um objeto é feito de pontinhos</h2>
  <p>Todo objeto 3D é uma <strong>malha</strong>: um monte de pontos no espaço (os <strong>vértices</strong>)
  ligados em triângulos. Um cubo tem 8 cantos; a GPU liga esses cantos em triângulos e preenche as
  faces. Olhe o cubo abaixo girando — cada quina é um vértice.</p>

  <shader-playground id="pg-cubo"></shader-playground>

  <div class="brain">
    A tela é plana, mas o cubo parece 3D. Como? Alguém precisa decidir ONDE, na telinha 2D, cada
    cantinho do cubo aparece — levando em conta a profundidade e a rotação. Quem faz essa conta?
  </div>

  <h2>2. Dois trabalhadores: quem posiciona e quem pinta</h2>
  <p>Aqui entra a novidade. No Marco 1 você só escrevia <strong>uma</strong> coisa: a cor do pixel (o
  <em>fragment shader</em>). Agora aparece um segundo trabalhador: o <strong>vertex shader</strong>.</p>
  <div class="bullets">
    <ul>
      <li>O <strong>vertex shader</strong> roda uma vez <em>por vértice</em> e decide a
      <strong>POSIÇÃO</strong> de cada ponto na tela.</li>
      <li>O <strong>fragment shader</strong> (seu velho conhecido) roda por pixel e decide a
      <strong>COR</strong>.</li>
    </ul>
  </div>
  <p>Neste curso, o vertex shader já vem pronto pra você (ele faz a conta da posição). Você continua
  escrevendo só a cor — como sempre. Quer espiar o vertex pronto? Está na caixa abaixo.</p>

  <details class="sidebar">
    <summary>👀 Espiando o vertex shader pronto (você não precisa editar)</summary>
    <div>
      <p>Ele recebe a posição de cada vértice e a multiplica por uma matriz mágica (a
      <code>u_mvp</code>) que cuida da rotação, da perspectiva e de projetar o ponto 3D na tela 2D:</p>
      <pre>gl_Position = u_mvp * vec4(a_position, 1.0);</pre>
      <p>Você <strong>não</strong> precisa montar essa matriz — o motor monta pra você. Por enquanto,
      basta saber: ela leva o ponto 3D pro lugar certo da tela.</p>
    </div>
  </details>

  <h2>3. A matriz MVP e a linha de montagem</h2>
  <p>Aquela matriz <code>u_mvp</code> faz três coisas de uma vez: <strong>move, gira e projeta</strong>
  o objeto na tela. É uma caixa-preta por agora (no próximo módulo a gente entende as ferramentas por
  dentro). O caminho completo, do ponto à imagem, é a <strong>linha de montagem</strong> (o pipeline):</p>

  <figure>
    <img src="../assets/img/pipeline.svg" alt="Três estágios: vértices posicionados pelo vertex shader, rasterização virando fragmentos, e fragmentos pintados pelo fragment shader" width="720">
    <figcaption>Vértices → rasterização (vira pixels) → fragmentos pintados. Você programa as pontas; o meio é automático.</figcaption>
  </figure>

  <h2>Test Drive: pinte o cubo do seu jeito</h2>
  <p>O cubo abaixo deixa você editar só a COR (o fragment). Tente colorir pela posição
  (<code>v_worldPos</code>) ou pela coordenada da face (<code>v_uv</code>). Dê <em>Test Drive</em> e
  veja girar.</p>
  <shader-playground id="pg-cor"></shader-playground>

  <details class="sidebar">
    <summary>🗣️ Dois sotaques: e no Unity (HLSL)?</summary>
    <div>
      <p>A ideia é idêntica: existe um vertex e um fragment; a matriz vira <code>float4x4</code> e a
      multiplicação se escreve quase igual. Clique <strong>🔁 Ver em HLSL</strong> pra comparar (é
      ilustrativo — o 3D de verdade do Unity tem mais detalhes que veremos adiante).</p>
    </div>
  </details>

  <div class="qa">
    <dl>
      <dt>O vertex shader pinta alguma coisa?</dt>
      <dd>Não! Ele só POSICIONA os vértices. Quem pinta é o fragment. Confundir os dois é o tropeço
      nº1 deste módulo.</dd>
      <dt>Preciso entender a matriz MVP agora?</dt>
      <dd>Não. Ela é caixa-preta por enquanto: leva o ponto 3D pra tela. No Módulo 8 a gente abre as
      ferramentas (vetores) que explicam a intuição.</dd>
      <dt>Por que o cubo tem "cantos" de cor?</dt>
      <dd>Porque você está colorindo pela posição/face de cada ponto. Cada face do cubo tem suas
      coordenadas — e elas viram cor.</dd>
    </dl>
  </div>

  <div class="cuidado">
    <strong>Vertex posiciona, fragment pinta.</strong> Não tente "pintar" no vertex nem "mover
    vértice" no fragment — cada trabalhador tem seu papel na linha de montagem.
  </div>

  <div class="bullets">
    <ul>
      <li>Objeto 3D = malha de vértices ligados em triângulos.</li>
      <li>Vertex shader decide a POSIÇÃO (1×/vértice); fragment decide a COR (1×/pixel).</li>
      <li>A matriz <code>u_mvp</code> (caixa-preta) move, gira e projeta o ponto 3D na tela.</li>
      <li>Pipeline: vértices → rasterização → fragmentos. Você programa as pontas.</li>
    </ul>
  </div>

  <div class="recordacao">
    <h2>Recordação: caça ao par</h2>
    <p>Ligue cada termo ao seu significado (escreva a letra):</p>
    <ul>
      <li>( ) vértice &nbsp;&nbsp;&nbsp;&nbsp; A. decide a posição de cada ponto na tela</li>
      <li>( ) vertex shader &nbsp; B. um ponto da malha 3D</li>
      <li>( ) fragment shader &nbsp; C. transforma triângulos em pixels</li>
      <li>( ) rasterização &nbsp; D. decide a cor de cada pixel</li>
    </ul>
  </div>

  <p style="margin-top:28px"><a href="06-paralelismo.html">← Anterior: Paralelismo</a>
  &nbsp;·&nbsp;
  <span class="proximo-soon">Próximo: Vetores &amp; Coordenadas →
  <span style="color:#999">(em construção no próximo plano)</span></span></p>

  <script type="module">
    document.getElementById('pg-cubo').config = {
      mode: 'mesh', mesh: 'cube',
      fragment: `void main() {
  // cor pela posicao na face (coordenada local via v_uv) + leve variacao por profundidade
  vec3 c = vec3(v_uv, 1.0 - v_uv.x * v_uv.y);
  gl_FragColor = vec4(c, 1.0);
}`,
      uniforms: [{ name: 'u_vel', label: 'velocidade', min: 0.0, max: 2.0, value: 0.6 }],
    };
    document.getElementById('pg-cor').config = {
      mode: 'mesh', mesh: 'cube',
      fragment: `void main() {
// >>> EDIT: cor
  vec3 c = vec3(v_uv.x, v_uv.y, 0.5);
// <<< EDIT
  gl_FragColor = vec4(c, 1.0);
}`,
      editableRegions: ['cor'],
      solution: '  vec3 c = v_worldPos + 0.5;',
      uniforms: [{ name: 'u_vel', label: 'velocidade', min: 0.0, max: 2.0, value: 0.6 }],
    };
  </script>
</body>
</html>
```

- [ ] **Step 3: Criar `test/module7.integration.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';
import { cube } from '../site/assets/playground/geometry.js';

test('config do cubo normaliza em modo mesh com malha cube', () => {
  const c = normalizeConfig({ mode: 'mesh', mesh: 'cube', fragment: 'void main(){ gl_FragColor=vec4(v_uv,0.0,1.0); }' });
  assert.equal(c.mode, 'mesh');
  assert.equal(c.mesh, 'cube');
});

test('a malha cube tem 24 vertices e 36 indices', () => {
  const g = cube();
  assert.equal(g.positions.length / 3, 24);
  assert.equal(g.indices.length, 36);
});

test('a pagina do Modulo 7 tem os dois playgrounds mesh e os dispositivos', () => {
  const html = readFileSync('site/modulos/07-vertices-e-pipeline.html', 'utf8');
  assert.ok(html.includes('id="pg-cubo"'), 'falta pg-cubo');
  assert.ok(html.includes('id="pg-cor"'), 'falta pg-cor');
  assert.ok(html.includes("mode: 'mesh'"), 'falta modo mesh');
  assert.ok(html.includes('pipeline.svg'), 'falta o SVG do pipeline');
  assert.ok(!html.includes('v_normal'), 'M7 nao deve usar normal (so nasce no M10)');
  for (const cls of ['brain', 'qa', 'cuidado', 'bullets', 'sidebar', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});
```

- [ ] **Step 4: Rodar a suíte toda**

Run: `node --test`
Expected: todos os testes passam (Marco 1 + novos do mesh + M7).

- [ ] **Step 5: Commit**

```bash
git add site/modulos/07-vertices-e-pipeline.html site/assets/img/pipeline.svg test/module7.integration.test.js
git commit -m "feat(curso): Modulo 7 -- Vertices & Pipeline (cubo 3D girando, modo mesh)"
```

---

## Task 8: Guia do professor, links e verificação no navegador

**Files:**
- Create: `site/professor/07-guia.md`
- Modify: `site/index.html`, `site/modulos/06-paralelismo.html`

- [ ] **Step 1: Criar `site/professor/07-guia.md`**

```markdown
# Guia do Professor — Módulo 7: Vértices & Pipeline

**Tempo estimado:** 1–2 aulas. **MÓDULO DE MAIOR CARGA DO MARCO 2** — não atropelar; seguir os
sub-blocos (malha → split posição/cor → MVP/pipeline). **Pré-requisito:** Marco 1 completo.

## Objetivos de aprendizagem
- Entender que um objeto 3D é uma malha de vértices.
- Distinguir vertex shader (posiciona) de fragment shader (pinta).
- Aceitar a matriz MVP como caixa-preta que move/gira/projeta (intuição vem no M8).

## Roteiro sugerido
1. (10 min) Sub-bloco 1: cubo girando (pg-cubo). "É feito de pontinhos." Só isso.
2. (15 min) Sub-bloco 2: os dois trabalhadores. Reforce: você só escreve a cor; a posição já vem pronta.
3. (10 min) Sub-bloco 3: a matriz MVP (caixa-preta) + a linha de montagem (SVG do pipeline).
4. (10 min) Test Drive do pg-cor: editar a cor do cubo (por v_uv / v_worldPos).
5. (5 min) Caça ao par + Pontos-chave.

## Pontos de tropeço comuns
- **"Vertex shader pinta":** não — posiciona. Quem pinta é o fragment. (Tropeço nº1.)
- **Querer entender a matriz agora:** segure a ansiedade; é caixa-preta de propósito. M8 dá a intuição.
- **Carga alta:** este é o módulo mais pesado do marco; se a turma travar, pare no sub-bloco 1–2 e
  continue na aula seguinte.

## Gabarito
- Caça ao par: vértice→B, vertex shader→A, fragment shader→D, rasterização→C.
```

- [ ] **Step 2: Ativar link no `site/index.html`**

Localize a seção do Marco 2 (atualmente `<h2 style="color:#999">Marco 2 — Superfícies de Verdade (curso médio)</h2>`)
e substitua por uma versão com lista e o link do M7 ativo:

```html
  <h2>Marco 2 — Superfícies de Verdade <span style="color:#999">(curso médio)</span></h2>
  <ol start="7">
    <li><a href="modulos/07-vertices-e-pipeline.html">Saindo do Quad: Vértices &amp; Pipeline</a></li>
    <li>🧮 Vetores &amp; Coordenadas <span style="color:#999">(em breve)</span></li>
    <li>Texturas &amp; UV <span style="color:#999">(em breve)</span></li>
    <li>Normais &amp; Luz Difusa <span style="color:#999">(em breve)</span></li>
    <li>🏗️ Por Baixo do Capô II: Hardware Fixo <span style="color:#999">(em breve)</span></li>
  </ol>
```

- [ ] **Step 3: Corrigir o "Próximo" no `site/modulos/06-paralelismo.html`**

Localize `<span class="proximo-soon">Marco 2 — Superfícies de Verdade ...</span>` e troque por:

```html
  <a href="07-vertices-e-pipeline.html">Próximo: Marco 2 — Vértices &amp; Pipeline →</a>
```

- [ ] **Step 4: Verificação no navegador (gate — WebGL não é testado em node)**

Servir e abrir no Chrome:

Run: `npm run serve` (background) e abrir `http://localhost:8000/modulos/07-vertices-e-pipeline.html`.
Hard reload (Ctrl+Shift+R) por causa do cache de módulos do http.server.

Conferir (objetivos do gate da fatia vertical):
- Os dois cubos **renderizam em 3D** (não um quadrado plano) e **giram**.
- A rotação anima: amostrar um pixel em dois instantes (com paint forçado por screenshot entre eles) e
  confirmar que **diferem** — ou simplesmente observar girando no screenshot.
- `pg-cor`: editar a cor, Test Drive aplica; "Mostrar solução" troca pra `v_worldPos + 0.5`.
- Console **sem erro de GLSL/WebGL** (`read_console_messages onlyErrors`).
- Profundidade correta: faces de trás não aparecem na frente (depth test ligado).
Se algo quebrar (cubo plano, não gira, erro de atributo/uniform), é bug de WebGL não pego pelos testes
node — corrigir em `gl.js`/`playground.js` antes de seguir.

- [ ] **Step 5: Commit**

```bash
git add site/professor/07-guia.md site/index.html site/modulos/06-paralelismo.html
git commit -m "feat(curso): guia do professor M7 + links do Marco 2 no index/M6"
```

---

## Self-Review (preenchido)

- **Cobertura do spec (fatia vertical §7):** geometry.js (T2), mat4.js (T1), setupMesh em gl.js (T5),
  auto-uniforms MVP (T5/T6), withHeader p/ mesh (T4), M7 (T7) — coberto. Texture loading: **adiado
  explicitamente** para o plano do M9 (decisão registrada no cabeçalho e no spec §3.5); não é gap.
- **Placeholders:** o passo do `gl.clear` traz uma constante-armadilha proposital (`DEPTH_BIT_PLACEHOLDER`)
  com a correção explícita logo abaixo (`gl.DEPTH_BUFFER_BIT`) — é instrução, não placeholder. Sem TBD/TODO.
- **Consistência de tipos/nomes:** `cube()/sphere()` retornam `{positions,normals,uvs,indices}` (T2)
  e são consumidos assim em setupMesh (T5) e playground (T6). `withHeaderMesh` (T4) usado em T6.
  `MESH_VERTEX`/`setupMesh` exportados em T5, importados em T6. `u_vel` default 0.6 bate entre HTML
  (T7) e o `_loop` (T6). `mat3FromMat4` (T1) usado em T6.
- **Riscos:** o gate de verificação no navegador (T8 passo 4) cobre o caminho WebGL que os testes node
  não pegam (lição reincidente do Marco 1).
```
