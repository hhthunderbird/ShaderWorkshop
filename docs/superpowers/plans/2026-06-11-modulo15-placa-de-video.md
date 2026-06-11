# Módulo 15 (Bônus) "Decifrando a Placa de Vídeo" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o Módulo 15 bônus — uma síntese que decifra a ficha técnica de uma GPU de jogos conectando cada spec ao que o aluno aprendeu (M1–M14), e cobre o buraco de memória/VRAM.

**Architecture:** Módulo conceitual (como M11/M13/M14): ZERO mudança de motor, nenhum shader. A interatividade é uma "ficha técnica" feita de `<details class="spec">` (HTML puro, sem JS). É bônus pós-curso — NÃO conta nos 14.

**Tech Stack:** HTML/CSS vanilla, `node --test` (integração), `npm run smoke` (continua verde, 0 playgrounds).

**Spec:** `docs/superpowers/specs/2026-06-11-modulo15-placa-de-video-design.md`.

**Convenções:** Web em `site/`. `<head>` padrão (headfirst.css + playground.css + playground.js — manter mesmo sem playground, por consistência). `<body class="hf">`. Dispositivos Head First: `brain`, `qa`, `cuidado`, `bullets`, `recordacao`. Baseline: **118 testes** node passam; `npm run smoke` verde (15 módulos).

---

## Task 1: Módulo 15 bônus — página, ficha interativa, SVGs, índice

**Files:**
- Create: `site/modulos/15-placa-de-video.html`
- Create: `site/assets/img/loop-shader-gpu-jogo.svg`
- Create: `site/assets/img/vram-banda.svg`
- Create: `site/professor/15-guia.md`
- Modify: `site/assets/css/headfirst.css` (acrescenta um bloco `.spec`)
- Modify: `site/index.html` (seção "🎁 Bônus" após o banner 14/14)
- Test: `test/module15.integration.test.js`

- [ ] **Step 1: Escrever o teste de integração que falha**

Criar `test/module15.integration.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Modulo 15 e a ficha tecnica anotada: termos-chave, details.spec, links de volta, memoria/VRAM', () => {
  const html = readFileSync('site/modulos/15-placa-de-video.html', 'utf8');
  // termos reais de uma ficha tecnica
  for (const termo of ['CUDA', 'TMU', 'ROP', 'VRAM', 'Tensor', 'RT ']) {
    assert.ok(html.includes(termo), `falta o termo ${termo}`);
  }
  assert.ok(html.includes('class="spec"'), 'falta a ficha interativa (details.spec)');
  // liga de volta aos modulos que ensinaram cada conceito
  for (const link of ['06-paralelismo.html', '09-texturas-e-uv.html', '11-hardware-fixo.html', '13-alem-de-pixels.html']) {
    assert.ok(html.includes(link), `ficha nao linka de volta pro ${link}`);
  }
  // cobre memoria/VRAM como conceito (banda)
  assert.ok(/banda/i.test(html) && /GB\/s/.test(html), 'falta a nocao de banda de memoria');
  // conceitual: sem pixel-diff, sem shader
  assert.ok(!html.includes('reference:'), 'M15 e conceitual: sem pixel-diff');
  assert.ok(!html.includes('<shader-playground'), 'M15 nao tem playground (sem shader)');
  // bonus, nao renumera
  assert.ok(/Bônus/.test(html), 'falta a marcacao de Bonus no breadcrumb');
  assert.ok(!/de 15/.test(html), 'M15 e bonus, nao deve renumerar o curso pra 15');
  // dispositivos Head First
  for (const cls of ['brain', 'qa', 'cuidado', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('o index tem uma secao Bonus que linka o Modulo 15 apos o 14/14', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('15-placa-de-video.html'), 'index nao linka o M15');
  assert.ok(idx.indexOf('14/14') < idx.indexOf('15-placa-de-video.html'), 'M15 deve vir DEPOIS do banner 14/14');
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `module15.integration.test.js` falha (HTML não existe).

- [ ] **Step 3: Criar `site/assets/img/loop-shader-gpu-jogo.svg`**

O loop: Jogo → (chama) Shaders → (rodam na) GPU → (desenha) Frame na tela → (repete 60×/s) → Jogo.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 300" width="660" font-family="sans-serif">
  <rect width="660" height="300" fill="#fbfbf7"/>
  <text x="20" y="28" font-size="16" font-weight="bold" fill="#333">Toda frame, o jogo roda shaders na GPU pra desenhar a tela</text>
  <g font-size="13" text-anchor="middle">
    <rect x="40" y="90" width="120" height="60" rx="8" fill="#e7f5ff" stroke="#1c7ed6"/><text x="100" y="125" fill="#1c7ed6">🎮 Jogo</text>
    <rect x="220" y="90" width="120" height="60" rx="8" fill="#e7f5ff" stroke="#1c7ed6"/><text x="280" y="118">Shaders</text><text x="280" y="136" font-size="11" fill="#666">(M1–M12)</text>
    <rect x="400" y="90" width="120" height="60" rx="8" fill="#fff4e6" stroke="#e8590c"/><text x="460" y="118">GPU</text><text x="460" y="136" font-size="11" fill="#666">núcleos (M6)</text>
    <rect x="560" y="90" width="80" height="60" rx="8" fill="#ebfbee" stroke="#2b8a3e"/><text x="600" y="118">Frame</text><text x="600" y="136" font-size="11" fill="#666">na tela</text>
  </g>
  <g stroke="#888" stroke-width="2" marker-end="url(#a)" fill="none">
    <line x1="160" y1="120" x2="216" y2="120"/>
    <line x1="340" y1="120" x2="396" y2="120"/>
    <line x1="520" y1="120" x2="556" y2="120"/>
  </g>
  <path d="M600 150 Q600 230 100 230 Q60 230 60 160" stroke="#9c36b5" stroke-width="2" fill="none" stroke-dasharray="6 4" marker-end="url(#a)"/>
  <text x="330" y="250" font-size="13" fill="#9c36b5" text-anchor="middle">repete 60× por segundo (M1)</text>
  <defs><marker id="a" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="context-stroke"/></marker></defs>
</svg>
```

- [ ] **Step 4: Criar `site/assets/img/vram-banda.svg`**

VRAM (armazém de texturas/framebuffer) + banda (esteira) alimentando os núcleos.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 300" width="660" font-family="sans-serif">
  <rect width="660" height="300" fill="#fbfbf7"/>
  <text x="20" y="28" font-size="16" font-weight="bold" fill="#333">VRAM é o armazém; a banda é a velocidade da esteira</text>
  <rect x="40" y="80" width="180" height="150" rx="8" fill="#fff4e6" stroke="#e8590c"/>
  <text x="130" y="105" font-size="14" text-anchor="middle" fill="#e8590c">VRAM (armazém)</text>
  <text x="130" y="130" font-size="11" text-anchor="middle" fill="#666">texturas (M9)</text>
  <text x="130" y="148" font-size="11" text-anchor="middle" fill="#666">+ framebuffer</text>
  <text x="130" y="172" font-size="12" text-anchor="middle" fill="#333">ex.: 8 GB</text>
  <text x="130" y="210" font-size="11" text-anchor="middle" fill="#888">+ resolução/textura = + GB</text>
  <line x1="220" y1="155" x2="430" y2="155" stroke="#1c7ed6" stroke-width="10"/>
  <text x="325" y="145" font-size="13" text-anchor="middle" fill="#1c7ed6">banda: ex. 272 GB/s</text>
  <text x="325" y="180" font-size="11" text-anchor="middle" fill="#888">se a esteira é lenta, os núcleos esperam (gargalo)</text>
  <g fill="#2b8a3e"><circle cx="470" cy="120" r="10"/><circle cx="500" cy="120" r="10"/><circle cx="530" cy="120" r="10"/><circle cx="470" cy="155" r="10"/><circle cx="500" cy="155" r="10"/><circle cx="530" cy="155" r="10"/><circle cx="470" cy="190" r="10"/><circle cx="500" cy="190" r="10"/><circle cx="530" cy="190" r="10"/></g>
  <text x="500" y="225" font-size="12" text-anchor="middle" fill="#2b8a3e">núcleos (M6)</text>
  <defs><marker id="a" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="context-stroke"/></marker></defs>
</svg>
```

- [ ] **Step 5: Acrescentar o estilo `.spec` no `headfirst.css`**

No fim de `site/assets/css/headfirst.css`, acrescentar:

```css
/* Ficha técnica do Módulo 15 (bônus): cada spec é um details clicável */
.spec { border: 1px solid #d0d7de; border-radius: 6px; margin: 6px 0; padding: 6px 12px; background: #fff; }
.spec > summary { cursor: pointer; font-weight: bold; font-family: ui-monospace, "Cascadia Code", Consolas, monospace; }
.spec > div { margin-top: 8px; color: #333; }
.spec[open] { background: #f8f9fa; }
```

- [ ] **Step 6: Criar o HTML do Módulo 15**

Criar `site/modulos/15-placa-de-video.html`, estrutura padrão. Breadcrumb: `<p><a href="../index.html">← Mapa do curso</a> · 🎁 Bônus · Módulo Extra</p>`. Conteúdo (o teste trava termos/`details.spec`/links/VRAM/dispositivos/`Bônus`/sem-shader). Escrever prosa Head First PT-BR genuína.

Seções IN ORDER:
1. `<h1>Decifrando a Placa de Vídeo</h1>` + abertura (gancho gamer): "Você já viu a ficha de uma placa — *'3072 CUDA cores, 8 GB GDDR6, 272 GB/s, RT cores, Tensor cores'* — e achou grego. Spoiler: cada linha dessas é uma coisa que **você já estudou** neste curso. Bora decifrar a sua."
2. `<h2>O elo: shader → GPU → jogo</h2>` + prosa: jogo desenha milhões de pixels 60×/s (M1) chamando shaders (M1–M12) que rodam na GPU toda frame; a ficha técnica responde "quanto músculo essa GPU tem pra isso?". `<figure><img src="../assets/img/loop-shader-gpu-jogo.svg" alt="Loop: jogo chama shaders, que rodam na GPU, que desenha o frame na tela, repetindo 60 vezes por segundo" width="660"><figcaption>...</figcaption></figure>`.
3. `<div class="brain">`: recall do M6 — "lembra que a GPU roda milhares de cópias do MESMO shader ao mesmo tempo? Esse número de 'soldados' aparece na ficha com um nome. Qual você acha que é?"
4. `<h2>Onde tudo isso mora: a memória (VRAM)</h2>` + prosa do conceito novo: texturas (M9) e o quadro sendo desenhado (framebuffer) moram na **VRAM** (armazém); + resolução/textura = + GB. A **banda (GB/s)** é a velocidade da esteira que leva os dados pros núcleos — gargalo comum. `<figure><img src="../assets/img/vram-banda.svg" alt="VRAM como armazém de texturas e framebuffer, conectada por uma esteira (a banda, em GB/s) aos núcleos da GPU" width="660"><figcaption>...</figcaption></figure>`.
5. `<h2>A ficha técnica, linha por linha</h2>` + intro ("Clique em cada linha pra ver o que é — e em que módulo você já viu isso:") + a ficha interativa, UM `<details class="spec">` por item (conteúdo exato abaixo).
6. `<h2>Onde tudo se junta: FPS</h2>` + prosa: todos esses números servem aos **quadros por segundo**. Mais músculo (núcleos + banda + clock) = mais FPS, **ou** a mesma fluidez numa resolução maior. Reativa "60×/s" (M1).
7. `<div class="qa"><dl>`: (a) "Mais VRAM = mais FPS? — Não necessariamente. VRAM é *espaço*; se já sobra, mais não acelera nada. O que vira FPS são núcleos + banda + clock. VRAM importa pra não *faltar* em resoluções/texturas altas."; (b) "Por que uma marca diz 'CUDA core' e outra 'Stream processor'? — Mesma ideia (um núcleo paralelo), sotaques de fabricante — igual GLSL × HLSL que você viu no curso."; (c) "RT e Tensor cores fazem o jogo inteiro? — Não, são especialistas; o grosso do trabalho ainda são os shaders nos núcleos comuns."
8. `<div class="cuidado">`: "Não escolha uma placa por UM número só (tipo 'tem mais GB!'). É o conjunto — e depende do jogo e da resolução que você quer rodar."
9. `<div class="recordacao"><h2>Recordação: caça ao par</h2>` + caça-ao-par: ( ) CUDA core / ( ) TMU / ( ) ROP / ( ) VRAM / ( ) RT core / ( ) Tensor core → A. busca textura (M9) · B. núcleo paralelo que roda o shader (M6) · C. escreve o pixel final (M11) · D. armazém de texturas · E. ray tracing (luz realista) · F. contas de IA/upscaling (M13).
10. `<p>` fechamento: "Você não só faz shaders — agora entende a máquina que os roda e consegue ler a ficha de qualquer placa. Da próxima vez que vir uma na loja, cada linha vai fazer sentido."
11. Nav: `<p style="margin-top:28px"><a href="14-otimizacao.html">← Voltar: Otimização</a> &nbsp;·&nbsp; <a href="../index.html">🗺️ Mapa do curso</a></p>`.

Ficha interativa — usar EXATAMENTE estes `<details class="spec">` (dentro de um contêiner, ex. `<div class="ficha">`):

```html
  <details class="spec"><summary>3072 CUDA cores / Stream processors</summary>
    <div>Os milhares de "soldados" que rodam cópias do seu shader em paralelo — mais núcleos, mais pixels e contas ao mesmo tempo. <a href="06-paralelismo.html">📚 você viu no Módulo 6</a>.</div></details>
  <details class="spec"><summary>Clock: 2.5 GHz (boost)</summary>
    <div>A velocidade de cada núcleo: quantas continhas por segundo ele faz. Núcleos rápidos × muitos núcleos = força bruta. <a href="06-paralelismo.html">📚 Módulo 6</a>.</div></details>
  <details class="spec"><summary>96 TMUs (Texture Mapping Units)</summary>
    <div>Circuitos dedicados a buscar o pedacinho certo da imagem — exatamente o <code>texture2D</code> que você usou. <a href="09-texturas-e-uv.html">📚 Módulo 9</a> / <a href="11-hardware-fixo.html">Módulo 11</a>.</div></details>
  <details class="spec"><summary>48 ROPs (Render Output Units)</summary>
    <div>Escrevem o pixel final na tela: testam profundidade (Z-buffer) e misturam cores. Hardware fixo. <a href="11-hardware-fixo.html">📚 Módulo 11</a>.</div></details>
  <details class="spec"><summary>8 GB GDDR6 (VRAM)</summary>
    <div>O armazém onde as texturas e o quadro sendo desenhado (framebuffer) moram. Mais resolução e texturas maiores ocupam mais GB. <a href="09-texturas-e-uv.html">📚 Módulo 9</a> + a seção de memória acima.</div></details>
  <details class="spec"><summary>Banda de memória: 272 GB/s</summary>
    <div>A velocidade da "esteira" que leva os dados da VRAM pros núcleos. Se for lenta, os núcleos ficam esperando — gargalo. (Veja a seção de memória acima.)</div></details>
  <details class="spec"><summary>24 RT cores</summary>
    <div>Hardware dedicado a <strong>ray tracing</strong>: simular o caminho da luz pra reflexos e sombras realistas — uma evolução da luz que você calculou à mão. <a href="10-normais-e-luz.html">📚 Módulo 10</a> / <a href="12-luz-especular.html">Módulo 12</a>.</div></details>
  <details class="spec"><summary>96 Tensor cores</summary>
    <div>Hardware pra contas de IA (multiplicar matrizes em massa). Em jogos, usado pra <em>upscaling</em> (ex.: DLSS) — a GPU como calculadora paralela. <a href="13-alem-de-pixels.html">📚 Módulo 13</a>.</div></details>
  <details class="spec"><summary>TDP: 200 W</summary>
    <div>Quanta energia a placa consome e vira calor — por isso ela tem cooler e ventoinhas. Mais força costuma custar mais watts.</div></details>
```

- [ ] **Step 7: Acrescentar a seção Bônus no index**

Em `site/index.html`, após o `<p>` do banner "🎉 Curso completo — 14/14 módulos." e antes de `</body>`, inserir:

```html
  <h2>🎁 Bônus <span style="color:#999">(extra)</span></h2>
  <ul>
    <li><a href="modulos/15-placa-de-video.html">Decifrando a Placa de Vídeo</a> — entenda a ficha técnica de uma GPU de jogos com tudo que você aprendeu.</li>
  </ul>
```

- [ ] **Step 8: Criar o guia do professor**

Criar `site/professor/15-guia.md` (padrão dos guias): tempo (1 aula, bônus/opcional), objetivo (síntese arquitetura×shader×jogo + memória), quando usar (depois do M14, ou como gancho motivador a qualquer momento avançado), pontos de tropeço (#1 "mais VRAM = mais FPS" — não; #2 confundir VRAM(espaço) com banda(velocidade)), gabarito da caça-ao-par (CUDA→B, TMU→A, ROP→C, VRAM→D, RT→E, Tensor→F), avaliação sugerida (aluno pega a ficha de uma placa real e explica 3 linhas com as próprias palavras).

- [ ] **Step 9: Rodar os testes node**

Run: `npm test`
Expected: PASS — 120 testes (118 + 2 do module15).

- [ ] **Step 10: GATE DE EXATIDÃO TÉCNICA (§7) — ANTES do commit**

Rodar passe de revisão de **verdade** das afirmações do M15 (advisor OU subagente técnico de GPU). Checar: CUDA core × Stream processor (núcleo paralelo — ok); TMU/ROP (funções corretas); VRAM(espaço) × banda(velocidade) não confundidas; RT cores = ray tracing; Tensor cores = matrizes/IA/DLSS corretamente atribuídos; a nuance "mais VRAM ≠ mais FPS" correta; nada contradiz M6/M9/M11/M13. Corrigir o que apontar antes de commitar. (É o gate real — o navegador não verifica afirmação de hardware.)

- [ ] **Step 11: Verificar no navegador + smoke**

Run: `npm run smoke` → deve seguir verde (M15 aparece como "0 playground(s) ok"). Abrir `http://localhost:8000/modulos/15-placa-de-video.html`: os 2 SVGs aparecem; clicar uma linha da ficha (`<details>`) expande a explicação e o link; o index mostra a seção Bônus linkando o M15. (Sem shader → verificação leve.)

- [ ] **Step 12: Commit + push**

```bash
git add site/modulos/15-placa-de-video.html site/professor/15-guia.md site/assets/img/loop-shader-gpu-jogo.svg site/assets/img/vram-banda.svg site/assets/css/headfirst.css site/index.html test/module15.integration.test.js
git commit -m "feat(curso): Modulo 15 bonus 'Decifrando a Placa de Video' (sintese arquitetura x shader x jogo + VRAM)"
git push
```

---

## Self-Review (cobertura do spec)

- **§2 bônus, não renumera, breadcrumb "Bônus", index após 14/14** → Step 6 (breadcrumb) + Step 7 (index) + teste (`!/de 15/`, `14/14` antes do link). ✓
- **§3 zero motor/sem shader; ficha = `<details class="spec">`** → Steps 5/6 + teste (`!<shader-playground`, `class="spec"`). ✓
- **§4 conteúdo (gancho, elo, VRAM, ficha 9 specs, FPS, dispositivos)** → Step 6 seções 1–11 com os 9 `<details>` exatos. ✓
- **§4 memória/VRAM + banda** → Step 6 seção 4 + SVG Step 4 + teste (`banda`/`GB/s`). ✓
- **§5 2 SVGs** → Steps 3/4. ✓
- **§6 testes (termos, details.spec, links de volta, VRAM, sem reference/shader, Bônus, dispositivos; index)** → Step 1. ✓
- **§7 gate de exatidão técnica** → Step 10 (antes do commit). ✓
- **§8 fora de escopo (genérico, sem modelo específico)** → a ficha usa números representativos, sem nomear modelo. ✓
- **smoke continua verde** → Step 11. ✓
- **Consistência:** termos do teste (`CUDA`,`TMU`,`ROP`,`VRAM`,`Tensor`,`RT `) todos presentes nos `<details>`; links de volta (`06`,`09`,`11`,`13`) presentes; classe `.spec` definida no CSS (Step 5) e usada no HTML (Step 6). ✓
- **Contagem:** 118 → 120 node. ✓
