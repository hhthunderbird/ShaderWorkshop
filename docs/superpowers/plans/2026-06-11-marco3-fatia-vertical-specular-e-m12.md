# Marco 3 — "O Poder da GPU" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o Marco 3 (M12 Specular, M13 Compute conceitual, M14 Otimização + Projeto-Vitória 3), fechando o curso em 14/14 módulos.

**Architecture:** Reusa o motor `ShaderPlayground` (fragment + mesh) inteiro. A ÚNICA mudança estrutural é 1 auto-uniform novo no modo mesh: `u_cameraPos`. Todo o resto é conteúdo (HTML Head First + guias + SVG + testes de integração). M12 tem técnica nova (specular); M13/M14 são conceituais (sem pixel-diff, sem técnica de shader nova) e passam por um gate de exatidão técnica (§7 do spec) antes do commit.

**Tech Stack:** WebGL1/GLSL ES, JS vanilla (ES modules, sem build), `node --test`, Chrome MCP para verificação visual.

**Spec:** `docs/superpowers/specs/2026-06-11-marco3-design.md`.

**Convenções herdadas (Marcos 1/2):**
- Web vive em `site/`. Testes em `test/`. Geradores PNG em `scripts/` (NÃO há PNG neste marco — sem pixel-diff).
- Rodar testes: `npm test` (= `node --test`). Hoje: **95 testes passam.**
- Cada módulo: HTML Head First completo + `site/professor/NN-guia.md` + SVG(s) + `test/moduleNN.integration.test.js` + verificação no Chrome + commit (Conventional Commits) + push.
- Dispositivos Head First (classes CSS já existem em `headfirst.css`): `brain`, `qa`, `cuidado`, `bullets`, `sidebar` (`<details>`), `recordacao`, `afie`, `magnets`, `duo`.
- Config do playground vai embutida num `<script type="module">` no fim do HTML, setando `.config` por id.
- **GOTCHA de verificação (reincidente):** RAF é throttled na automação Chrome — screenshot força paint. Para conferir animação: amostrar pixel/console em 2 instantes (com paint forçado entre) e confirmar que DIFEREM. Passar estado via `console.log` + `read_console_messages` (window.__x ficou flaky). Hard reload (Ctrl+Shift+R) após editar JS (http.server não manda no-cache).

---

## Task 1: Motor — auto-uniform `u_cameraPos` (fatia vertical, parte motor)

O specular precisa da direção do olho. A câmera do motor é fixa: `view = translation(0, 0, -3)`, logo a câmera está em **mundo (0, 0, 3)**. Enviar `u_cameraPos = [0, 0, 3]` por frame no modo mesh; declarar no header; setar no renderFrame.

**Files:**
- Modify: `site/assets/playground/header.js:29-42` (withHeaderMesh)
- Modify: `site/assets/playground/gl.js:118-146` (renderFrame)
- Modify: `site/assets/playground/playground.js:191-200` (_loop, ramo mesh)
- Test: `test/header.test.js` (acrescenta caso)

- [ ] **Step 1: Escrever o teste que falha**

Acrescentar ao fim de `test/header.test.js`:

```javascript
test('withHeaderMesh injeta uniform u_cameraPos quando ausente (specular do M12)', () => {
  const src = `void main(){ vec3 V = normalize(u_cameraPos - v_worldPos); gl_FragColor = vec4(V, 1.0); }`;
  const out = withHeaderMesh(src);
  assert.match(out, /uniform vec3 u_cameraPos;/);
  assert.ok(out.indexOf('uniform vec3 u_cameraPos;') < out.indexOf('void main'));
});

test('withHeaderMesh nao duplica u_cameraPos se o aluno ja declarou', () => {
  const src = `uniform vec3 u_cameraPos;\nvoid main(){ gl_FragColor = vec4(u_cameraPos, 1.0); }`;
  const out = withHeaderMesh(src);
  assert.equal((out.match(/uniform vec3 u_cameraPos;/g) || []).length, 1);
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — os 2 novos testes falham (regex `uniform vec3 u_cameraPos;` não casa, pois withHeaderMesh ainda não injeta).

- [ ] **Step 3: Injetar `u_cameraPos` no header**

Em `site/assets/playground/header.js`, dentro de `withHeaderMesh`, acrescentar a linha de `u_cameraPos` junto às outras (depois de `u_lightDir`):

```javascript
export function withHeaderMesh(src) {
  const hasPrecision = /^\s*precision\s/m.test(src);
  const addIfMissing = (decl, name) => (hasDeclaration(src, name) ? '' : decl + '\n');
  return (
    (hasPrecision ? '' : 'precision mediump float;\n') +
    addIfMissing('uniform float u_time;', 'u_time') +
    addIfMissing('uniform vec3 u_lightDir;', 'u_lightDir') +
    addIfMissing('uniform vec3 u_cameraPos;', 'u_cameraPos') +
    addIfMissing('uniform sampler2D u_tex;', 'u_tex') +
    addIfMissing('varying vec2 v_uv;', 'v_uv') +
    addIfMissing('varying vec3 v_normal;', 'v_normal') +
    addIfMissing('varying vec3 v_worldPos;', 'v_worldPos') +
    src
  );
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm test`
Expected: PASS — 97 testes (95 + 2 novos).

- [ ] **Step 5: Setar `u_cameraPos` no renderFrame**

Em `site/assets/playground/gl.js`, dentro de `renderFrame`, logo após a linha do `u_lightDir` (linha ~131), acrescentar:

```javascript
  if (uniforms.u_cameraPos) set('u_cameraPos', (l) => gl.uniform3f(l, uniforms.u_cameraPos[0], uniforms.u_cameraPos[1], uniforms.u_cameraPos[2]));
```

- [ ] **Step 6: Enviar `u_cameraPos` por frame no _loop**

Em `site/assets/playground/playground.js`, dentro de `_loop`, no ramo `if (this.cfg.mode === 'mesh')`, após `base.u_lightDir = this.cfg.light;` acrescentar:

```javascript
          // Câmera fixa em mundo (0,0,3): é o NEGATIVO da translação da view
          // (translation(0,0,-3)). Se a view mudar, atualizar os dois juntos.
          base.u_cameraPos = [0, 0, 3];
```

- [ ] **Step 7: Commit**

```bash
git add site/assets/playground/header.js site/assets/playground/gl.js site/assets/playground/playground.js test/header.test.js
git commit -m "feat(motor): auto-uniform u_cameraPos no modo mesh (base do specular M12)"
```

(Verificação visual de `u_cameraPos` acontece junto da Task 2 — o specular do M12 é o primeiro consumidor.)

---

## Task 2: Módulo 12 — Luz Especular & Brilho + 🏆 Projeto-Vitória 3

**Files:**
- Create: `site/modulos/12-luz-especular.html`
- Create: `site/professor/12-guia.md`
- Create: `site/assets/img/specular-vetores.svg`
- Create: `test/module12.integration.test.js`
- Modify: `site/index.html:35` (lista do Marco 3 + M12)
- Modify: `site/modulos/11-hardware-fixo.html` (link "Próximo" → M12, se existir placeholder)

- [ ] **Step 1: Escrever o teste de integração que falha**

Criar `test/module12.integration.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';

test('config do specular: mesh sphere usa pow(dot(N,H)), com sliders dureza e luz', () => {
  const c = normalizeConfig({
    mode: 'mesh', mesh: 'sphere',
    fragment: `precision highp float;
void main(){
  vec3 N = normalize(v_normal);
  vec3 L = normalize(vec3(cos(u_lang), 0.4, sin(u_lang)));
  vec3 V = normalize(u_cameraPos - v_worldPos);
  vec3 H = normalize(L + V);
  float esp = pow(max(dot(N, H), 0.0), u_dureza);
  gl_FragColor = vec4(vec3(esp), 1.0);
}`,
    uniforms: [
      { name: 'u_lang', label: 'direção da luz', min: 0.0, max: 6.2831, value: 0.8 },
      { name: 'u_dureza', label: 'dureza do brilho', min: 2.0, max: 128.0, value: 32.0 },
    ],
  });
  assert.equal(c.mode, 'mesh');
  assert.equal(c.reference, null);            // cena 3D: sem pixel-diff
  assert.equal(c.uniforms.length, 2);
});

test('Projeto-Vitoria 3: playground aberto, exportavel, sem reference', () => {
  const c = normalizeConfig({
    mode: 'mesh', mesh: 'sphere',
    texture: '../assets/tex/exemplo.png',
    fragment: `void main(){ gl_FragColor = vec4(texture2D(u_tex, v_uv).rgb, 1.0); }`,
    editableRegions: ['arte'],
    exportable: true,
  });
  assert.equal(c.exportable, true);
  assert.equal(c.reference, null);
  assert.deepEqual(c.editableRegions, ['arte']);
});

test('a pagina do Modulo 12 tem os 2 playgrounds, o SVG e os dispositivos Head First', () => {
  const html = readFileSync('site/modulos/12-luz-especular.html', 'utf8');
  assert.ok(html.includes('id="pg-brilho"'), 'falta o demo de specular');
  assert.ok(html.includes('id="pg-projeto"'), 'falta o Projeto-Vitoria 3');
  assert.ok(html.includes('specular-vetores.svg'), 'falta o SVG dos vetores N/L/V/H');
  assert.ok(html.includes('pow('), 'falta a receita do brilho');
  assert.ok(html.includes('Projeto-Vitória'), 'falta a amarracao do Projeto-Vitoria 3');
  assert.ok(!html.includes('reference:'), 'M12 e cena 3D: nao deve ter pixel-diff');
  for (const cls of ['brain', 'qa', 'cuidado', 'bullets', 'afie', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('o index linka o M12 e abre o Marco 3', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('12-luz-especular.html'), 'index nao linka o M12');
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `module12.integration.test.js` falha (arquivo HTML não existe → `readFileSync` lança).

- [ ] **Step 3: Criar o SVG dos vetores**

Criar `site/assets/img/specular-vetores.svg` — uma superfície curva com um ponto P, e quatro setas anotadas a partir de P: `N` (normal, perpendicular à superfície), `L` (para a luz), `V` (para o olho/câmera), `H` (no meio entre L e V). Marcar o "ponto de brilho" onde `N ≈ H`. Texto: "brilho estoura quando a normal aponta pra H". Use `viewBox="0 0 640 360"`, traços e `<text>` legíveis (estilo dos SVGs do Marco 2, ex. `normal-luz.svg`).

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" font-family="sans-serif">
  <rect width="640" height="360" fill="#fbfbf7"/>
  <path d="M80 300 Q320 120 560 300" fill="none" stroke="#333" stroke-width="3"/>
  <text x="300" y="330" fill="#666" font-size="14">superfície</text>
  <!-- ponto P -->
  <circle cx="320" cy="178" r="5" fill="#111"/>
  <text x="328" y="176" font-size="14">P</text>
  <!-- N normal (pra cima) -->
  <line x1="320" y1="178" x2="320" y2="70" stroke="#2b8a3e" stroke-width="3" marker-end="url(#a)"/>
  <text x="326" y="80" fill="#2b8a3e" font-size="16">N</text>
  <!-- L pra luz (sup. esquerda) -->
  <line x1="320" y1="178" x2="190" y2="90" stroke="#e8590c" stroke-width="3" marker-end="url(#a)"/>
  <text x="175" y="86" fill="#e8590c" font-size="16">L (luz)</text>
  <!-- V pro olho (sup. direita) -->
  <line x1="320" y1="178" x2="450" y2="90" stroke="#1c7ed6" stroke-width="3" marker-end="url(#a)"/>
  <text x="455" y="86" fill="#1c7ed6" font-size="16">V (olho)</text>
  <!-- H meio do caminho (quase = N aqui) -->
  <line x1="320" y1="178" x2="320" y2="78" stroke="#9c36b5" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#a)"/>
  <text x="232" y="120" fill="#9c36b5" font-size="16">H = meio de L e V</text>
  <text x="120" y="40" font-size="15" fill="#333">O brilho estoura quando N aponta pra H.</text>
  <defs>
    <marker id="a" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
      <path d="M0 0 L6 3 L0 6 z" fill="context-stroke"/>
    </marker>
  </defs>
</svg>
```

- [ ] **Step 4: Criar o HTML do Módulo 12**

Criar `site/modulos/12-luz-especular.html` no padrão Head First dos módulos do Marco 2 (ver `site/modulos/10-normais-e-luz.html` como referência de estrutura: `<head>` com os 2 CSS + `playground.js`, `<body class="hf">`, breadcrumb, `<h1>`, seções, e o `<script type="module">` final). Conteúdo obrigatório (o teste do Step 1 trava ids/SVG/dispositivos):

Seções de prosa:
1. **Abertura** — liga ao M10: "a luz difusa do M10 é igual de todo ângulo; o brilho NÃO — ele depende de ONDE você olha, e some quando você vira a cabeça."
2. `brain` — recuperação ativa do M10: "o `dot(N,L)` da luz difusa dependia de onde você estava? (não). E o brilho?"
3. **Vetor do olho** `V` — "novo, mas é só mais um vetor (M8): da superfície até a câmera. `V = normalize(u_cameraPos - v_worldPos)`."
4. **Half-vector** `H = normalize(L + V)` (caixa-preta leve) — "a direção no meio do caminho entre a luz e o olho."
5. **A receita do brilho** (`bullets`): `pow(max(dot(N, H), 0.0), dureza)` — o mesmo `dot` (M8/M10) elevado a uma potência; a `dureza` controla o tamanho do ponto (alta=metal, baixa=plástico fosco).
6. `figure` com `specular-vetores.svg`.
7. **Test Drive** — `<shader-playground id="pg-brilho">` + `afie` (predizer: "com dureza alta, o brilho fica grande ou pequeno?").
8. `sidebar` (`<details>`) "Matemática de bolso: por que `pow`?" — pow muda a velocidade com que o brilho cai; expoente alto = cauda curta = pontinho.
9. `qa` — "De onde vem `u_cameraPos`? (o motor entrega, câmera fixa)"; "Por que H e não o reflexo? (half-vector é mais barato, mesmo efeito)"; "Isso é o brilho dos jogos? (é a base — Blinn-Phong)".
10. `cuidado` — "o brilho NÃO está preso na superfície: ele anda quando você (a câmera) se move. Por isso depende de `V`."
11. `bullets` (pontos-chave).
12. **🏆 Projeto-Vitória 3: Efeito Autoral** — `<shader-playground id="pg-projeto">` + `afie` com ideias (mexer na dureza, na cor base, ladrilhar textura) + meta da rubrica (≥3 ingredientes, incluindo specular).
13. `recordacao` — caça ao par (V→olho, H→meio L e V, pow→tamanho do brilho, specular→brilho que depende do ângulo).
14. Navegação: "← Anterior: Hardware Fixo" / "Próximo: Para Além de Pixels →" (M13).

Script final (config dos 2 playgrounds — **conteúdo exato**, é a parte que erra fácil):

```html
  <script type="module">
    document.getElementById('pg-brilho').config = {
      mode: 'mesh', mesh: 'sphere',
      fragment: `precision highp float;
void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(vec3(cos(u_lang), 0.4, sin(u_lang)));
  vec3 V = normalize(u_cameraPos - v_worldPos);
  vec3 H = normalize(L + V);
  float dif = max(dot(N, L), 0.0);
  float esp = pow(max(dot(N, H), 0.0), u_dureza);
  vec3 base = vec3(0.40, 0.55, 0.90);
  vec3 cor = base * (0.15 + 0.85 * dif) + vec3(1.0) * esp;
  gl_FragColor = vec4(cor, 1.0);
}`,
      uniforms: [
        { name: 'u_lang', label: 'direção da luz', min: 0.0, max: 6.2831, value: 0.8 },
        { name: 'u_dureza', label: 'dureza do brilho', min: 2.0, max: 128.0, value: 32.0 },
        { name: 'u_vel', label: 'rotação', min: 0.0, max: 1.5, value: 0.0 },
      ],
    };
    document.getElementById('pg-projeto').config = {
      mode: 'mesh', mesh: 'sphere',
      texture: '../assets/tex/exemplo.png',
      fragment: `precision highp float;
void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(u_lightDir);
  vec3 V = normalize(u_cameraPos - v_worldPos);
  vec3 H = normalize(L + V);
  float dif = max(dot(N, L), 0.0);
  float esp = pow(max(dot(N, H), 0.0), 32.0);
// >>> EDIT: arte
  vec3 cor = texture2D(u_tex, v_uv).rgb;
  vec3 final = cor * (0.2 + 0.8 * dif) + vec3(esp);
// <<< EDIT
  gl_FragColor = vec4(final, 1.0);
}`,
      uniforms: [{ name: 'u_vel', label: 'rotação', min: 0.0, max: 2.0, value: 0.5 }],
      editableRegions: ['arte'],
      exportable: true,
    };
  </script>
```

- [ ] **Step 5: Abrir o Marco 3 no index e linkar o M12**

Em `site/index.html`, substituir a linha `<h2 style="color:#999">Marco 3 — O Poder da GPU (curso longo)</h2>` (linha 35) por:

```html
  <h2>Marco 3 — O Poder da GPU <span style="color:#999">(curso longo)</span></h2>
  <ol start="12">
    <li><a href="modulos/12-luz-especular.html">Luz Especular &amp; Brilho</a></li>
  </ol>
  <p><strong>🏆 Projeto-Vitória:</strong> <a href="modulos/12-luz-especular.html">Efeito Autoral</a></p>
```

- [ ] **Step 6: Criar o guia do professor**

Criar `site/professor/12-guia.md` no padrão dos guias do Marco 2 (ver `site/professor/10-guia.md`): tempo estimado, objetivos de aprendizagem (V, H, pow, dureza), roteiro sugerido, pontos de tropeço (#1: achar que o brilho está preso na superfície — ele anda com o observador; #2: `pow` com expoente alto = ponto menor, contra-intuitivo), gabarito da caça-ao-par, rubrica do Projeto-Vitória 3 (≥3 ingredientes incluindo specular), e nota de fechamento ("primeiro brilho do curso; a partir daqui é poder de GPU").

- [ ] **Step 7: Rodar os testes**

Run: `npm test`
Expected: PASS — 101 testes (97 + 4 do module12).

- [ ] **Step 8: Verificar no Chrome (gate de build)**

Servir (`npm run serve`) e abrir `http://localhost:8000/modulos/12-luz-especular.html`. Confirmar:
- `pg-brilho`: esfera renderiza, tem um **ponto de brilho branco** distinto do gradiente difuso; mover o slider **direção da luz** move o brilho; mover **dureza** muda o tamanho do ponto (alta=pequeno/duro).
- **Banding do `pow`:** olhar o brilho — se aparecer faixa/degrau, confirmar que o fragment tem `precision highp float;` (já incluído). Se ainda houver banding visível, registrar (aceitável em hardware fraco).
- `pg-projeto`: esfera texturizada + iluminada + com brilho; editar o bloco `arte` e clicar Test Drive aplica; botões 📷/📋 presentes.
- Console limpo (sem erro GLSL). Animação: com `u_vel>0`, 2 frames (paint forçado entre) DIFEREM.

- [ ] **Step 9: Commit + push**

```bash
git add site/modulos/12-luz-especular.html site/professor/12-guia.md site/assets/img/specular-vetores.svg test/module12.integration.test.js site/index.html
git commit -m "feat(curso): Modulo 12 Luz Especular & Brilho + Projeto-Vitoria 3"
git push
```

---

## Task 3: Módulo 13 — Para Além de Pixels: a GPU como Calculadora (conceitual)

**Files:**
- Create: `site/modulos/13-alem-de-pixels.html`
- Create: `site/professor/13-guia.md`
- Create: `site/assets/img/m6-vs-m13.svg`
- Create: `test/module13.integration.test.js`
- Modify: `site/index.html` (acrescenta `<li>` do M13)
- Modify: `site/modulos/12-luz-especular.html` (link "Próximo" → M13, já previsto)

- [ ] **Step 1: Escrever o teste de integração que falha**

Criar `test/module13.integration.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';

test('demo enxame: fragment 2D, loop de pontos por u_time, sem reference', () => {
  const c = normalizeConfig({
    mode: 'fragment',
    fragment: `precision highp float;
void main(){
  vec3 cor = vec3(0.02, 0.02, 0.05);
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    vec2 p = vec2(0.5 + 0.4*sin(u_time*0.7+fi*1.3), 0.5 + 0.4*cos(u_time*0.9+fi*2.1));
    cor += vec3(0.15,0.4,0.9) * smoothstep(0.04, 0.0, distance(v_uv, p));
  }
  gl_FragColor = vec4(cor, 1.0);
}`,
  });
  assert.equal(c.mode, 'fragment');
  assert.equal(c.reference, null);          // conceitual
  assert.deepEqual(c.editableRegions, []);
});

test('a pagina do M13 e conceitual: demo, SVG, caixa Cuidado da metafora, sem pixel-diff', () => {
  const html = readFileSync('site/modulos/13-alem-de-pixels.html', 'utf8');
  assert.ok(html.includes('id="pg-enxame"'), 'falta o demo de enxame');
  assert.ok(html.includes('m6-vs-m13.svg'), 'falta o SVG do contraste com o M6');
  assert.ok(/compute/i.test(html), 'precisa nomear compute (e dizer que NAO roda aqui)');
  assert.ok(html.includes('class="cuidado"'), 'falta a caixa Cuidado da metafora (compute != WebGL1)');
  assert.ok(!html.includes('reference:'), 'M13 e conceitual: sem pixel-diff');
  for (const cls of ['brain', 'qa', 'bullets', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('o index linka o M13', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('13-alem-de-pixels.html'), 'index nao linka o M13');
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `module13.integration.test.js` falha (HTML não existe).

- [ ] **Step 3: Criar o SVG do contraste M6 × M13**

Criar `site/assets/img/m6-vs-m13.svg` — dois painéis lado a lado. Esquerda (M6): grade de pixels, cada "soldado" pintando 1 quadradinho (mesmo trabalho, preso à tela). Direita (M13): os mesmos soldados, agora em "esquadrões", cada um resolvendo uma continha qualquer (física, partícula, IA) — não vira pixel. Título: "M6: paralelismo preso ao pixel × M13: calculadora paralela de propósito geral." `viewBox="0 0 720 360"`, estilo dos SVGs anteriores.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 360" width="720" font-family="sans-serif">
  <rect width="720" height="360" fill="#fbfbf7"/>
  <text x="20" y="30" font-size="16" font-weight="bold" fill="#333">M6 — cada um pinta 1 pixel</text>
  <g transform="translate(20,50)">
    <!-- grade 5x5 com bonecos -->
    <g fill="#1c7ed6" opacity="0.85">
      <!-- linhas de quadradinhos -->
    </g>
    <rect x="0" y="0" width="300" height="240" fill="none" stroke="#aaa"/>
    <text x="0" y="270" font-size="13" fill="#666">mesmo trabalho, preso à tela</text>
  </g>
  <text x="380" y="30" font-size="16" font-weight="bold" fill="#333">M13 — cada um resolve uma conta</text>
  <g transform="translate(380,50)">
    <rect x="0" y="0" width="300" height="240" fill="none" stroke="#aaa"/>
    <text x="0" y="270" font-size="13" fill="#666">qualquer cálculo, em esquadrões (física, IA…)</text>
  </g>
  <line x1="360" y1="50" x2="360" y2="300" stroke="#ddd"/>
</svg>
```

(O autor pode enriquecer os bonecos/quadradinhos; o essencial é o contraste rotulado dos 2 painéis.)

- [ ] **Step 4: Criar o HTML do Módulo 13**

Criar `site/modulos/13-alem-de-pixels.html` no padrão Head First. Conteúdo obrigatório (teste do Step 1 trava id/SVG/cuidado/dispositivos):

Seções de prosa:
1. **Abertura** — "até agora a GPU desenhou. Mas ela faz MUITO mais conta do que pixel."
2. `brain` — recuperação do M6: "no M6, milhares de cópias do MESMO trabalho, cada uma presa a um pixel. E se a conta não precisasse virar pixel nenhum?"
3. **O salto de mentalidade (coração do módulo)** — `bullets`: M6 = paralelismo *por pixel* × compute = GPU vira **calculadora paralela de propósito geral** (física de fluidos, partículas, treino de IA — "GPU fazendo conta, não desenho").
4. `figure` com `m6-vs-m13.svg`.
5. **Esquadrões** — "você não dispara 1 thread; dispara grupos (numthreads/dispatch). Analogia: pelotões recebendo a mesma ordem."
6. **Test Drive** — `<shader-playground id="pg-enxame">` — "um enxame de pontos calculados ao mesmo tempo; dá a SENSAÇÃO de escala."
7. ⚠️ `cuidado` **(obrigatória — honestidade técnica):** "o que você vê aqui é uma **metáfora** rodando no nosso fragment shader. **Compute shader de verdade é outra API, que o nosso playground (WebGL1) não tem.** Isto NÃO é compute — é uma ilustração de 'muitas contas ao mesmo tempo'."
8. `qa` — "Então não dá pra fazer compute aqui? (não em WebGL1; é conceito + ilustração)"; "Onde isso é usado de verdade? (física de jogo, simulação, IA)"; "É o mesmo hardware do M6? (sim — mesma GPU paralela, uso mais livre)".
9. `bullets` (pontos-chave).
10. `recordacao` — caça ao par (compute→conta de propósito geral, esquadrão→grupo de threads, M6→paralelismo por pixel, WebGL1→não tem compute).
11. Navegação: "← Anterior: Luz Especular" / "Próximo: Otimização →" (M14).

Script final:

```html
  <script type="module">
    document.getElementById('pg-enxame').config = {
      mode: 'fragment',
      fragment: `precision highp float;
void main() {
  vec3 cor = vec3(0.02, 0.02, 0.05);
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    vec2 p = vec2(
      0.5 + 0.40 * sin(u_time * 0.70 + fi * 1.3),
      0.5 + 0.40 * cos(u_time * 0.90 + fi * 2.1)
    );
    cor += vec3(0.15, 0.40, 0.90) * smoothstep(0.04, 0.0, distance(v_uv, p));
  }
  gl_FragColor = vec4(cor, 1.0);
}`,
    };
  </script>
```

- [ ] **Step 5: Linkar o M13 no index**

Em `site/index.html`, dentro do `<ol start="12">` do Marco 3, acrescentar após o `<li>` do M12:

```html
    <li><a href="modulos/13-alem-de-pixels.html">Para Além de Pixels: a GPU como Calculadora</a></li>
```

- [ ] **Step 6: Criar o guia do professor**

Criar `site/professor/13-guia.md` (padrão dos guias): conceitual, sem exercício. Objetivos (noção de compute/GPGPU, contraste com M6, esquadrões). **Ponto de tropeço nº1: achar que o demo É compute** — o professor deve frisar o limite (WebGL1 ≠ compute). Roteiro, gabarito da caça-ao-par, avaliação (parágrafo: "o que muda do M6 pro compute?").

- [ ] **Step 7: GATE DE EXATIDÃO TÉCNICA (§7 do spec) — ANTES do commit**

Rodar um passe de revisão de **verdade** das afirmações do M13 (via advisor OU subagente de revisão técnica). Checar especificamente:
- (a) A metáfora do enxame não engana: o texto deixa claro "é metáfora, não compute"? A caixa `cuidado` está presente e correta?
- (b) "GPU como calculadora de propósito geral / GPGPU / esquadrões (numthreads/dispatch)" — simplificado mas NÃO errado?
- (c) Nada contradiz o que o M6 disse sobre paralelismo?
Corrigir o que o passe apontar antes de seguir. (Este é o gate REAL do M13 — o Chrome só confirma que o demo anima, não que a afirmação é verdadeira.)

- [ ] **Step 8: Rodar os testes**

Run: `npm test`
Expected: PASS — 104 testes (101 + 3 do module13).

- [ ] **Step 9: Verificar no Chrome**

Abrir `http://localhost:8000/modulos/13-alem-de-pixels.html`. Confirmar: `pg-enxame` mostra pontos azulados se movendo (enxame); console limpo; animação (2 frames com paint forçado DIFEREM). A caixa `cuidado` da metáfora está visível.

- [ ] **Step 10: Commit + push**

```bash
git add site/modulos/13-alem-de-pixels.html site/professor/13-guia.md site/assets/img/m6-vs-m13.svg test/module13.integration.test.js site/index.html
git commit -m "feat(curso): Modulo 13 Para Alem de Pixels (compute conceitual, metafora honesta)"
git push
```

---

## Task 4: Módulo 14 — Otimização + fechamento do curso (14/14)

**Files:**
- Create: `site/modulos/14-otimizacao.html`
- Create: `site/professor/14-guia.md`
- Create: `site/assets/img/warp-divergencia.svg`
- Create: `test/module14.integration.test.js`
- Modify: `site/index.html` (acrescenta `<li>` do M14 + marca "Marco 3 completo ✓" + banner de curso completo)
- Modify: `site/modulos/13-alem-de-pixels.html` (link "Próximo" → M14, já previsto)

- [ ] **Step 1: Escrever o teste de integração que falha**

Criar `test/module14.integration.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';

test('demos if x mix: dois fragment 2D com o MESMO resultado, sem reference', () => {
  const comIf = normalizeConfig({
    mode: 'fragment',
    fragment: `void main(){
  float faixa = step(0.5, fract(v_uv.x * 8.0));
  vec3 cor;
  if (faixa > 0.5) { cor = vec3(0.9,0.3,0.2); } else { cor = vec3(0.2,0.4,0.9); }
  gl_FragColor = vec4(cor, 1.0);
}`,
  });
  const semBranch = normalizeConfig({
    mode: 'fragment',
    fragment: `void main(){
  float faixa = step(0.5, fract(v_uv.x * 8.0));
  vec3 cor = mix(vec3(0.2,0.4,0.9), vec3(0.9,0.3,0.2), faixa);
  gl_FragColor = vec4(cor, 1.0);
}`,
  });
  assert.equal(comIf.reference, null);
  assert.equal(semBranch.reference, null);
});

test('a pagina do M14 fecha o curso: demos duo if/mix, SVG, sem pixel-diff', () => {
  const html = readFileSync('site/modulos/14-otimizacao.html', 'utf8');
  assert.ok(html.includes('id="pg-if"'), 'falta o demo com if');
  assert.ok(html.includes('id="pg-mix"'), 'falta o demo sem branch (mix)');
  assert.ok(html.includes('class="duo"'), 'falta o lado-a-lado .duo');
  assert.ok(html.includes('warp-divergencia.svg'), 'falta o SVG de warp/divergencia');
  assert.ok(/divergência|divergencia/i.test(html), 'falta o conceito de divergencia de branch');
  assert.ok(!html.includes('reference:'), 'M14 e conceitual: sem pixel-diff');
  assert.ok(html.includes('Efeito Autoral'), 'falta o callback ao Projeto-Vitoria 3 do M12');
  for (const cls of ['brain', 'qa', 'cuidado', 'bullets', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('o index linka o M14 e marca Marco 3 + curso completos', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('14-otimizacao.html'), 'index nao linka o M14');
  assert.ok(idx.includes('Marco 3 completo'), 'index nao marca Marco 3 completo');
  assert.ok(/14\s*\/\s*14|curso completo/i.test(idx), 'index nao marca o curso completo (14/14)');
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `module14.integration.test.js` falha (HTML não existe).

- [ ] **Step 3: Criar o SVG de warp/divergência**

Criar `site/assets/img/warp-divergencia.svg` — um pelotão de soldados em fila marchando em sincronia (warp); num cruzamento, metade vira à esquerda (`if`) e metade à direita (`else`); seta mostrando que o pelotão faz AS DUAS rotas e descarta uma (custo dobrado). Título: "Warp = turma que anda junto. `if` que separa a turma = ela faz os dois caminhos." `viewBox="0 0 720 320"`.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 320" width="720" font-family="sans-serif">
  <rect width="720" height="320" fill="#fbfbf7"/>
  <text x="20" y="34" font-size="16" font-weight="bold" fill="#333">Warp: a turma marcha junto</text>
  <!-- pelotão -->
  <g fill="#1c7ed6">
    <circle cx="60" cy="120" r="12"/><circle cx="95" cy="120" r="12"/>
    <circle cx="130" cy="120" r="12"/><circle cx="165" cy="120" r="12"/>
  </g>
  <text x="55" y="160" font-size="13" fill="#666">mesma linha, ao mesmo tempo</text>
  <!-- cruzamento -->
  <line x1="200" y1="120" x2="300" y2="120" stroke="#333" stroke-width="2"/>
  <text x="300" y="100" font-size="14" fill="#e8590c">if  →</text>
  <line x1="300" y1="120" x2="430" y2="70" stroke="#e8590c" stroke-width="2" marker-end="url(#a)"/>
  <text x="440" y="70" font-size="13" fill="#e8590c">metade vai pro if</text>
  <text x="300" y="160" font-size="14" fill="#9c36b5">else ↘</text>
  <line x1="300" y1="120" x2="430" y2="180" stroke="#9c36b5" stroke-width="2" marker-end="url(#a)"/>
  <text x="440" y="185" font-size="13" fill="#9c36b5">metade vai pro else</text>
  <text x="60" y="250" font-size="15" fill="#333">A turma faz OS DOIS caminhos e joga um fora → custa o dobro.</text>
  <text x="60" y="278" font-size="14" fill="#2b8a3e">Trocar o `if` por `mix`/`step` evita isso.</text>
  <defs>
    <marker id="a" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
      <path d="M0 0 L6 3 L0 6 z" fill="context-stroke"/>
    </marker>
  </defs>
</svg>
```

- [ ] **Step 4: Criar o HTML do Módulo 14**

Criar `site/modulos/14-otimizacao.html` no padrão Head First. Conteúdo obrigatório (teste do Step 1 trava ids/duo/SVG/dispositivos/callback):

Seções de prosa:
1. **Abertura** — "você já faz a GPU desenhar coisa linda. Último passo: pensar como ela pensa — o que é rápido e o que é caro."
2. `brain` — "se mil threads são uma 'turma', o que acontece se metade vai por um caminho e metade por outro?"
3. **Warps/wavefronts** — "a GPU não roda threads soltas; roda em turmas que andam em sincronia (todas na mesma linha ao mesmo tempo). Ancorar no exército do M6/M13 (pelotão marcha junto)."
4. **Divergência de branch** — "se metade da turma vai pro `if` e metade pro `else`, a turma faz OS DOIS e descarta — custa o dobro. `if` que separa vizinhos é caro."
5. `figure` com `warp-divergencia.svg`.
6. **Test Drive — `.duo`** — `<div class="duo">` com `<shader-playground id="pg-if">` e `<shader-playground id="pg-mix">` lado a lado: MESMO resultado visual (listras), um com `if`, outro com `mix`. "Olho não vê diferença; a GPU vê: o `mix` não divide a turma."
7. ⚠️ `cuidado` **(honestidade — limite da ilustração):** "não dá pra VER os warps no shader (o WebGL1 não expõe isso); o desenho do pelotão é uma metáfora. O ponto prático e real é: `if` que separa vizinhos pode custar caro; muitas vezes `mix`/`step` faz o mesmo sem `if`."
8. **`half` × `float` (precisão)** — `bullets`: "conta de menor precisão é mais barata; use precisão alta só onde precisa. (No nosso WebGL1 isso é `mediump`/`highp` — o mesmo `precision` que o motor injeta desde o M1.)"
9. `qa` — "Todo `if` é ruim? (não — só quando separa vizinhos da mesma turma)"; "`mix`/`step` sempre substitui `if`? (muitas vezes sim, pra escolher entre dois valores)"; "preciso decorar warp size? (não — a ideia é 'a turma anda junta')".
10. **🏆 Fechamento do curso + callback ao Efeito Autoral** — recapitular a jornada (pixel → forma → 3D → luz → brilho → poder da GPU) e **mandar o aluno de volta ao Projeto-Vitória 3 do M12**: "agora que você sabe o que é caro, abra o seu **Efeito Autoral** (M12) — tem algum `if` que dá pra trocar por `mix`?". Liga otimização ao artefato dele.
11. `bullets` (pontos-chave do curso inteiro).
12. `recordacao` — caça ao par (warp→turma que anda junto, divergência→turma faz os dois caminhos, `mix`→evita o branch, `half`/`mediump`→conta mais barata).
13. Navegação: "← Anterior: Para Além de Pixels" / "🗺️ Mapa do curso" (index — fim do curso, sem "Próximo").

Script final:

```html
  <script type="module">
    document.getElementById('pg-if').config = {
      mode: 'fragment',
      fragment: `void main() {
  float faixa = step(0.5, fract(v_uv.x * 8.0));
  vec3 cor;
  if (faixa > 0.5) {
    cor = vec3(0.90, 0.30, 0.20);
  } else {
    cor = vec3(0.20, 0.40, 0.90);
  }
  gl_FragColor = vec4(cor, 1.0);
}`,
    };
    document.getElementById('pg-mix').config = {
      mode: 'fragment',
      fragment: `void main() {
  float faixa = step(0.5, fract(v_uv.x * 8.0));
  vec3 cor = mix(vec3(0.20, 0.40, 0.90), vec3(0.90, 0.30, 0.20), faixa);
  gl_FragColor = vec4(cor, 1.0);
}`,
    };
  </script>
```

- [ ] **Step 5: Fechar o Marco 3 e o curso no index**

Em `site/index.html`, dentro do `<ol start="12">`, acrescentar após o `<li>` do M13:

```html
    <li><a href="modulos/14-otimizacao.html">🏗️ Por Baixo do Capô III: Otimização</a></li>
```

E logo após o `<ol>` do Marco 3 (após o `<p>` do Projeto-Vitória 3), acrescentar:

```html
  <p><span style="color:#37b24d;font-weight:bold">Marco 3 completo ✓</span></p>
  <p style="margin-top:24px;font-size:1.1em"><strong>🎉 Curso completo — 14/14 módulos.</strong>
  Do primeiro pixel ao poder da GPU.</p>
```

- [ ] **Step 6: Criar o guia do professor**

Criar `site/professor/14-guia.md` (padrão dos guias): conceitual, **fecha o curso**. Objetivos (warps/divergência, `if`×`mix`, precisão). Ponto de tropeço: "todo `if` é ruim" (não — só o divergente). Roteiro com o `.duo` if/mix. Gabarito da caça-ao-par. **Seção de fechamento do curso**: recapitular os 3 marcos, sugerir o callback ao Efeito Autoral (M12) como avaliação final autêntica. Avaliação: aluno abre o próprio Efeito Autoral e justifica uma escolha de performance.

- [ ] **Step 7: GATE DE EXATIDÃO TÉCNICA (§7 do spec) — ANTES do commit**

Rodar passe de revisão de **verdade** das afirmações do M14 (advisor OU subagente técnico). Checar:
- (a) Warps/wavefronts simplificado mas NÃO errado ("turma anda junto" é fiel).
- (b) Divergência de branch: a descrição (turma executa os dois lados e descarta) está correta?
- (c) `half`×`float` → no WebGL1 mapeia pra `mediump`/`highp`; o texto não promete `half` literal que não existe em GLSL ES 1.00?
- (d) A caixa `cuidado` deixa claro que "não dá pra ver warps no shader"?
- (e) Nada contradiz M6/M13.
Corrigir o que apontar antes de seguir.

- [ ] **Step 8: Rodar os testes**

Run: `npm test`
Expected: PASS — 107 testes (104 + 3 do module14).

- [ ] **Step 9: Verificar no Chrome**

Abrir `http://localhost:8000/modulos/14-otimizacao.html`. Confirmar: `pg-if` e `pg-mix` mostram **listras verticais idênticas** lado a lado (mesmo resultado visual); console limpo. Abrir o index e confirmar M14 linkado + "Marco 3 completo ✓" + banner "Curso completo — 14/14".

- [ ] **Step 10: Commit + push**

```bash
git add site/modulos/14-otimizacao.html site/professor/14-guia.md site/assets/img/warp-divergencia.svg test/module14.integration.test.js site/index.html
git commit -m "feat(curso): Modulo 14 Otimizacao + fechamento do curso (14/14)"
git push
```

---

## Encerramento

Após a Task 4, o curso está **completo (14/14)**. Se o trabalho rodou numa branch, invocar **superpowers:finishing-a-development-branch**. Se foi direto em `main` (como Marcos 1/2), apenas confirmar `npm test` verde (107 testes), working tree limpo e `main` em dia com origin.

## Self-Review (cobertura do spec)

- **§3.1 `u_cameraPos`** → Task 1 (header inject + renderFrame set + _loop, com comentário do acoplamento à view). ✓
- **§3.2 sem compute real** → Task 3 (fragment metáfora + caixa Cuidado). ✓
- **§3.3 sem pixel-diff** → todos os testes de config afirmam `reference === null`; nenhuma referência PNG gerada. ✓
- **§4 M12 specular + Projeto-Vitória 3 no M12** → Task 2 (pow(dot(N,H)), H=normalize(L+V), V=normalize(u_cameraPos-v_worldPos); sliders dureza/luz; pg-projeto exportável). ✓
- **§4 M13 contraste vs M6** → Task 3 (SVG m6-vs-m13 + prosa "coração do módulo"). ✓
- **§4 M14 demo honesto if×mix; warp só em SVG** → Task 4 (pg-if/pg-mix em .duo; caixa Cuidado "não dá pra ver warps"). ✓
- **§4 callback M14→Efeito Autoral** → Task 4 Step 4 seção 10. ✓
- **§6 build fatia vertical (u_cameraPos+M12) → M13 → M14** → ordem das tasks 1→4. ✓
- **§7 gate de exatidão técnica** → Task 3 Step 7 e Task 4 Step 7 (antes do commit). ✓
- **§9 banding do pow** → Task 2 Step 8 (verificação Chrome + `precision highp`). ✓
- **Type consistency:** auto-uniform `u_cameraPos` (vec3, `[0,0,3]`) idêntico em header/gl/playground; ids dos playgrounds (`pg-brilho`, `pg-projeto`, `pg-enxame`, `pg-if`, `pg-mix`) batem entre HTML e testes. ✓
- **Contagem de testes:** 95 → 97 (T1) → 101 (T2) → 104 (T3) → 107 (T4). ✓
