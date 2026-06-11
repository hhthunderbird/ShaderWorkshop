# Glossário + Placeholders (M1/M6) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma página de glossário (referência alfabética de termos com link pro módulo) e trocar os 2 placeholders `[IMAGEM:]` (M1/M6) por SVGs ilustrativos.

**Architecture:** Conteúdo HTML/SVG + testes. Zero motor, zero shader. Glossário fica em `site/` (top-level); links pros módulos usam `modulos/NN-...html`.

**Tech Stack:** HTML/CSS/SVG vanilla, `node --test`, `npm run smoke`, Chrome MCP.

**Spec:** `docs/superpowers/specs/2026-06-11-glossario-placeholders-design.md`. **Baseline:** 134 testes node; smoke verde (16 módulos).

**Mapa módulo→arquivo (pros links do glossário):** M1=`modulos/01-shaders-e-gpu.html` · M2=`02-pixel-e-cor.html` · M3=`03-matematica-vira-imagem.html` · M4=`04-formas-e-padroes.html` · M5=`05-dando-vida-animacao.html` · M6=`06-paralelismo.html` · M7=`07-vertices-e-pipeline.html` · M8=`08-vetores-e-coordenadas.html` · M9=`09-texturas-e-uv.html` · M10=`10-normais-e-luz.html` · M11=`11-hardware-fixo.html` · M12=`12-luz-especular.html` · M13=`13-alem-de-pixels.html` · M14=`14-otimizacao.html` · M15=`15-placa-de-video.html`.

---

## Task 1: Página de glossário

**Files:**
- Create: `site/glossario.html`
- Modify: `site/index.html` (link pro glossário, perto do topo)
- Modify: `site/modulos/00-comecando.html` (link pro glossário, antes da nav)
- Test: `test/glossario.integration.test.js`

- [ ] **Step 1: Escrever o teste que falha** — criar `test/glossario.integration.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('glossario: pagina existe, tem termos-chave e links pros modulos', () => {
  const html = readFileSync('site/glossario.html', 'utf8');
  for (const termo of ['shader', 'dot', 'VRAM', 'especular', 'uniform', 'rasteriza']) {
    assert.ok(html.includes(termo), `glossario nao tem o termo ${termo}`);
  }
  const links = (html.match(/href="modulos\//g) || []).length;
  assert.ok(links >= 10, `glossario tem poucos links pros modulos (${links})`);
  assert.ok(html.includes('Glossário'), 'falta o titulo/breadcrumb Glossário');
});

test('index e M0 linkam o glossario', () => {
  assert.ok(readFileSync('site/index.html', 'utf8').includes('glossario.html'), 'index nao linka o glossario');
  assert.ok(readFileSync('site/modulos/00-comecando.html', 'utf8').includes('../glossario.html'), 'M0 nao linka o glossario');
});
```

- [ ] **Step 2: Rodar e confirmar que falha** — `npm test` → FAIL (glossario.html não existe).

- [ ] **Step 3: Criar `site/glossario.html`**

`<head>` padrão só com `headfirst.css` (sem playground.css/js). `<body class="hf">`. Breadcrumb: `<p><a href="index.html">← Mapa do curso</a> · 📖 Glossário</p>`. `<h1>Glossário</h1>` + 1 frase ("Bateu dúvida num termo? Procure aqui — e clique pra voltar ao módulo que ensina."). Depois um `<dl>` com TODAS as entradas abaixo, **em ordem alfabética**, cada uma no formato:

`<dt>TERMO</dt><dd>DEFINIÇÃO <a href="modulos/ARQUIVO">📚 Módulo N</a></dd>`

Entradas (termo — definição — módulo). Renderizar exatamente estas, alfabético:

- **banda** — velocidade da memória da placa (GB/s); se for lenta, os núcleos esperam. — M15
- **compute** — usar a GPU pra qualquer conta em paralelo, não só desenhar pixels. — M13
- **CPU** — o "cérebro" do computador: poucos núcleos grandes e versáteis. — M1
- **dot (produto escalar)** — mede o quanto dois vetores apontam pro mesmo lado (1 = juntos, 0 = perpendiculares). — M8
- **especular (brilho)** — o ponto de luz que depende de onde você olha; `pow(max(dot(N,H),0),dureza)`. — M12
- **float** — um número (com vírgula, tipo 0.5). — M1
- **FPS** — quadros por segundo; o que o jogador sente como fluidez. — M15
- **fract** — a parte depois da vírgula de um número; serve pra repetir padrões. — M3
- **fragment shader** — o shader que roda por pixel e decide a cor final. — M1
- **framebuffer** — o quadro que está sendo desenhado, guardado na memória. — M15
- **função** — uma máquina: entra número, sai outro (ex.: `sin`, `step`). — M3
- **GLSL / HLSL** — linguagens de shader (navegador / Unity); "dois sotaques" da mesma ideia. — M1
- **GPU** — chip com milhares de núcleos pequenos, feito pra muita conta ao mesmo tempo. — M1
- **half-vector (H)** — a direção no meio do caminho entre a luz e o olho. — M12
- **length** — o tamanho de um vetor (distância). — M4
- **luz difusa** — luz que espalha igual em todas as direções; `max(dot(N,L),0)`. — M10
- **malha (mesh)** — objeto 3D feito de vértices ligados em triângulos. — M7
- **mix** — mistura entre dois valores (0 = primeiro, 1 = segundo). — M3
- **MVP** — a matriz (caixa-preta) que leva um ponto 3D pro lugar certo na tela. — M7
- **normal** — a direção pra onde a superfície aponta num ponto. — M10
- **normalizar** — encolher um vetor pra tamanho 1 (sobra só a direção). — M8
- **paralelismo** — fazer muitas coisas ao mesmo tempo (a GPU roda o shader em milhares de pixels juntos). — M6
- **pipeline** — o caminho que um vértice percorre até virar pixel. — M7
- **pixel** — cada pontinho da tela. — M1
- **ray tracing** — simular o caminho da luz pra reflexos e sombras realistas. — M15
- **rasterização** — transformar triângulos em fragmentos (os pixels que eles cobrem). — M11
- **RGB** — uma cor = 3 números (Vermelho, Verde, Azul), de 0 a 1. — M1
- **ROP** — circuito que escreve o pixel final (teste de profundidade + mistura). — M11
- **shader** — programinha que roda na GPU e decide a cor de cada pixel. — M1
- **sin / cos** — ondas que sobem e descem; base de animação e de círculos. — M3
- **smoothstep** — um degrau suave (transição macia entre 0 e 1). — M3
- **step** — função degrau: 0 antes do limiar, 1 depois. — M3
- **textura** — uma imagem amostrada dentro do shader. — M9
- **texture2D** — busca a cor da textura numa coordenada UV. — M9
- **TMU** — circuito dedicado a buscar (e filtrar) o texel da textura. — M11
- **u_time** — o tempo em segundos; é o que faz a animação acontecer. — M5
- **uniform** — um valor que vem de fora do shader (ex.: um slider). — M5
- **UV / coordenada** — endereço de 0 a 1 de cada ponto (na tela no M2; na superfície no M9). — M2 (def. liga M2; pode citar M9 no texto)
- **vec2 / vec3 / vec4** — par / trio / quarteto de números (ex.: uma cor RGB é `vec3`). — M2
- **vértice** — um dos pontinhos que formam uma malha 3D. — M7
- **vertex shader** — o shader que decide a posição de cada vértice. — M7
- **vetor** — uma direção com tamanho. — M8
- **VRAM** — a memória da placa, onde texturas e o framebuffer moram. — M15
- **warp** — uma "turma" de threads que anda em sincronia na GPU. — M14
- **Z-buffer** — decide quem está na frente quando dois pontos caem no mesmo pixel. — M11

(O `<dt>` é o termo em negrito natural do `<dl>`; a definição e o link vão no `<dd>`. Usar o mapa módulo→arquivo do topo pro `href`.)

Nav final: `<p style="margin-top:28px"><a href="index.html">🗺️ Mapa do curso</a></p>`.

- [ ] **Step 4: Linkar no index** — em `site/index.html`, logo após o parágrafo `<p ...>👉 ... Comece aqui — Módulo 0 ...</p>` (a linha do M0), inserir:

```html
  <p style="margin:8px 0"><strong>📖 <a href="glossario.html">Glossário</a></strong> — consulte qualquer termo do curso.</p>
```

- [ ] **Step 5: Linkar no M0** — em `site/modulos/00-comecando.html`, imediatamente antes da linha de nav final (`<p style="margin-top:28px"><a href="01-shaders-e-gpu.html">...`), inserir:

```html
  <p>📖 Dica: bateu dúvida num termo? Consulte o <a href="../glossario.html">Glossário</a> a qualquer hora.</p>
```

- [ ] **Step 6: Rodar testes** — `npm test` → 136 pass (134 + 2). `npm run smoke` → verde (glossário não está em `modulos/`, não afeta o smoke).

- [ ] **Step 7: Verificar no Chrome** — abrir `http://localhost:8000/glossario.html`: lista alfabética renderiza; clicar um termo (ex.: "dot") abre o módulo certo. Abrir `index.html` e `modulos/00-comecando.html` e confirmar o link "Glossário". Console limpo.

- [ ] **Step 8: Commit + push**

```bash
git add site/glossario.html site/index.html site/modulos/00-comecando.html test/glossario.integration.test.js
git commit -m "feat(curso): pagina de Glossario (alfabetico, link pro modulo) + links no index e M0"
git push
```

---

## Task 2: Placeholders M1/M6 → SVG ilustrativo

**Files:**
- Create: `site/assets/img/gpu-board.svg`
- Create: `site/assets/img/gpu-die.svg`
- Modify: `site/modulos/01-shaders-e-gpu.html` (troca a figure)
- Modify: `site/modulos/06-paralelismo.html` (troca a figure)
- Test: `test/module1.integration.test.js` e `test/module6.integration.test.js` (atualiza asserts obsoletos)

- [ ] **Step 1: Atualizar os asserts obsoletos (que falharão ao remover o placeholder)**

Em `test/module1.integration.test.js`, localizar `assert.ok(html.includes('[IMAGEM:'), 'falta placeholder de imagem');` e substituir por:
```javascript
  assert.ok(html.includes('gpu-board.svg'), 'M1 nao usa o gpu-board.svg');
  assert.ok(!html.includes('[IMAGEM:'), 'M1 nao deve ter placeholder de imagem');
```
Em `test/module6.integration.test.js`, localizar `assert.ok(html.includes('[IMAGEM:'), 'falta placeholder do die-shot da GPU');` e substituir por:
```javascript
  assert.ok(html.includes('gpu-die.svg'), 'M6 nao usa o gpu-die.svg');
  assert.ok(!html.includes('[IMAGEM:'), 'M6 nao deve ter placeholder de imagem');
```

- [ ] **Step 2: Rodar e confirmar que falha** — `npm test` → FAIL (M1/M6 ainda têm `[IMAGEM:`, não têm os SVGs).

- [ ] **Step 3: Criar `site/assets/img/gpu-board.svg`** (ilustração esquemática de placa de vídeo):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320" width="640" font-family="sans-serif">
  <rect width="640" height="320" fill="#fbfbf7"/>
  <!-- PCB -->
  <rect x="60" y="70" width="500" height="180" rx="8" fill="#2b3a4a"/>
  <!-- cooler/ventoinhas -->
  <circle cx="200" cy="160" r="60" fill="#1b2630" stroke="#4a5a6a" stroke-width="3"/>
  <circle cx="380" cy="160" r="60" fill="#1b2630" stroke="#4a5a6a" stroke-width="3"/>
  <g stroke="#3a4a5a" stroke-width="4">
    <line x1="200" y1="160" x2="200" y2="105"/><line x1="200" y1="160" x2="248" y2="188"/><line x1="200" y1="160" x2="152" y2="188"/>
    <line x1="380" y1="160" x2="380" y2="105"/><line x1="380" y1="160" x2="428" y2="188"/><line x1="380" y1="160" x2="332" y2="188"/>
  </g>
  <!-- conectores de video -->
  <rect x="60" y="250" width="40" height="22" fill="#888"/>
  <rect x="110" y="250" width="40" height="22" fill="#888"/>
  <!-- conector PCIe (dentes) -->
  <rect x="160" y="250" width="180" height="14" fill="#caa84a"/>
  <text x="60" y="50" font-size="15" fill="#333">Uma placa de vídeo: a GPU mora aqui, embaixo do cooler.</text>
</svg>
```

- [ ] **Step 4: Criar `site/assets/img/gpu-die.svg`** (chip com grade densa de núcleos via `<pattern>` — completo, sem gerar rects à mão):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 340" width="640" font-family="sans-serif">
  <rect width="640" height="340" fill="#fbfbf7"/>
  <text x="40" y="40" font-size="15" fill="#333">Dentro do chip: milhares de núcleos pequenos, lado a lado.</text>
  <defs>
    <pattern id="cores" width="26" height="24" patternUnits="userSpaceOnUse">
      <rect x="3" y="3" width="20" height="18" fill="#1c7ed6"/>
    </pattern>
  </defs>
  <!-- substrato do chip -->
  <rect x="120" y="60" width="400" height="240" rx="10" fill="#1b2630"/>
  <!-- die preenchido com a grade de núcleos (pattern) -->
  <rect x="160" y="90" width="320" height="180" fill="url(#cores)"/>
  <rect x="160" y="90" width="320" height="180" fill="none" stroke="#4a5a6a" stroke-width="2"/>
  <text x="170" y="320" font-size="13" fill="#666">cada quadradinho azul = um núcleo (roda uma cópia do shader)</text>
</svg>
```
(O `<pattern>` ladrilha um quadradinho azul a cada 26×24px sobre o die → uma grade densa de "muitos núcleos", sem precisar escrever dezenas de `<rect>`.)

- [ ] **Step 5: Trocar a figure do M1** — em `site/modulos/01-shaders-e-gpu.html`, localizar:
```html
  <figure>
    <div class="img-todo">[IMAGEM: foto real de uma placa de vídeo (GPU) com o cooler]
    Fonte sugerida: https://commons.wikimedia.org/ (busque "graphics card") — baixe e salve em assets/img/gpu-foto.jpg, depois troque este bloco por &lt;img&gt;.</div>
  </figure>
```
Substituir por:
```html
  <figure>
    <img src="../assets/img/gpu-board.svg" alt="Ilustração de uma placa de vídeo: a placa (PCB) com duas ventoinhas do cooler, saídas de vídeo e o conector PCIe" width="640">
    <figcaption>Uma placa de vídeo. A GPU é o chip embaixo do cooler.</figcaption>
  </figure>
```

- [ ] **Step 6: Trocar a figure do M6** — em `site/modulos/06-paralelismo.html`, localizar:
```html
  <figure>
    <div class="img-todo">[IMAGEM: foto de um "die" de GPU ou diagrama dos núcleos CUDA/stream processors]
    Fonte sugerida: https://commons.wikimedia.org/ (busque "GPU die" ou "CUDA cores") — baixe e salve em assets/img/gpu-die.jpg e troque este bloco por &lt;img&gt;.</div>
  </figure>
```
Substituir por:
```html
  <figure>
    <img src="../assets/img/gpu-die.svg" alt="Esquema do die de uma GPU: uma grade densa de muitos núcleos pequenos, lado a lado" width="640">
    <figcaption>Dentro do chip: milhares de núcleos pequenos. Cada um roda uma cópia do shader.</figcaption>
  </figure>
```

- [ ] **Step 7: Rodar testes + smoke** — `npm test` → 136 pass (os asserts atualizados passam). `npm run smoke` → verde.

- [ ] **Step 8: Verificar no Chrome** — abrir `01-shaders-e-gpu.html` e `06-paralelismo.html`: os SVGs aparecem no lugar das caixas `[IMAGEM:]`; `document.body.innerHTML.includes('[IMAGEM:')` é `false` em ambos. Console limpo.

- [ ] **Step 9: Commit + push**

```bash
git add site/assets/img/gpu-board.svg site/assets/img/gpu-die.svg site/modulos/01-shaders-e-gpu.html site/modulos/06-paralelismo.html test/module1.integration.test.js test/module6.integration.test.js
git commit -m "feat(curso): SVGs ilustrativos no lugar dos placeholders de imagem do M1 e M6"
git push
```

---

## Self-Review (cobertura do spec)
- **§2 glossário alfabético, link pro módulo, sem playground, link index+M0** → Task 1 (dl completo + Steps 4/5 + teste). ✓
- **§3 placeholders M1/M6 → SVG** → Task 2 (cria 2 SVGs, troca as 2 figures). ✓
- **§4 testes (glossário + placeholders) + smoke inalterado + Chrome** → Task 1 Step 1/6/7, Task 2 Step 1/7/8. ✓
- **§4 atualizar asserts obsoletos `[IMAGEM:`** → Task 2 Step 1 (M1 linha 63, M6 linha 55). ✓
- **§5 fora de escopo (sem busca, sem breadcrumb-em-todo-módulo)** → não implementado. ✓
- **Consistência:** `gpu-board.svg`/`gpu-die.svg`/`glossario.html` iguais em criação, uso e teste; href do glossário usa o mapa módulo→arquivo. ✓
- **Contagem:** 134 → 136 node (Task 1 +2; Task 2 atualiza asserts, sem mudar contagem). smoke 16 verde. ✓
