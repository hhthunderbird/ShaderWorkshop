# Polimento do Curso (pós-auditoria) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar as lacunas de onboarding/base e os ajustes didáticos da auditoria: criar o Módulo 0 (orientação pré-curso) e aplicar 6 melhorias cirúrgicas nos módulos existentes.

**Architecture:** Reusa o motor `ShaderPlayground` inteiro (ZERO mudança de motor). Tudo é conteúdo HTML Head First + 1 SVG + testes de integração. Módulo 0 é pré-curso (NÃO renumera os 14). Política preservada: cena 3D NÃO tem pixel-diff.

**Tech Stack:** HTML/CSS/JS vanilla, WebGL1/GLSL ES, `node --test`, Chrome MCP para verificação visual.

**Spec:** `docs/superpowers/specs/2026-06-11-polimento-curso-design.md`.

**Convenções herdadas:**
- Web em `site/`. Testes em `test/`. Rodar: `npm test`. **Baseline atual: 110 testes passam.**
- Cada módulo HTML: `<head>` com `headfirst.css` + `playground.css` + `playground.js`; `<body class="hf">`; breadcrumb; `<h1>`; seções; nav; `<script type="module">` final setando `.config`.
- Dispositivos Head First (classes já em `headfirst.css`): `brain`, `qa`, `cuidado`, `bullets`, `sidebar` (`<details>`), `recordacao`, `afie`, `magnets`, `duo`.
- **GOTCHA de verificação:** testes node NÃO compilam GLSL. Shader NOVO exige verificação no Chrome (servir `npm run serve` → http://localhost:8000; hard reload Ctrl+Shift+R após editar JS/HTML; RAF é throttled em automação — screenshot força paint).
- Região editável: bloco entre `// >>> EDIT: nome` e `// <<< EDIT`; `config.editableRegions: ['nome']`; `config.solution` (string) habilita "💡 Mostrar solução"; "✓ Conferir" só aparece com `config.reference`.

---

## Task 1: Módulo 0 — "Comece aqui: o Playground"

**Files:**
- Create: `site/modulos/00-comecando.html`
- Create: `test/module0.integration.test.js`
- Modify: `site/index.html` (entrada "Comece aqui" acima do Marco 1)
- Modify: `site/modulos/01-shaders-e-gpu.html:12` (back-nav pro M0 no breadcrumb)

- [ ] **Step 1: Escrever o teste de integração que falha**

Criar `test/module0.integration.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';

test('config do tour: fragment editavel, sem reference (so explorar)', () => {
  const c = normalizeConfig({
    mode: 'fragment',
    fragment: `void main() {
// >>> EDIT: cor
  vec3 cor = vec3(0.2, 0.6, 1.0);
// <<< EDIT
  gl_FragColor = vec4(cor, 1.0);
}`,
    editableRegions: ['cor'],
    solution: '  vec3 cor = vec3(1.0, 0.4, 0.1);',
  });
  assert.equal(c.mode, 'fragment');
  assert.equal(c.reference, null);
  assert.deepEqual(c.editableRegions, ['cor']);
  assert.ok(c.solution.includes('vec3'));
});

test('o Modulo 0 orienta: playground, glossario de leitura, debugging, link pro M1', () => {
  const html = readFileSync('site/modulos/00-comecando.html', 'utf8');
  assert.ok(html.includes('<shader-playground'), 'falta o playground do tour');
  // glossario cobre os tokens da 1a tarefa do M1 + estruturais
  for (const tok of ['void main', 'gl_FragColor', 'vec3', 'float', 'step', 'mix']) {
    assert.ok(html.includes(tok), `glossario nao cobre ${tok}`);
  }
  assert.ok(html.includes('class="cuidado"'), 'falta o Cuidado! de debugging');
  assert.ok(/Reset/.test(html) && /Mostrar solu/.test(html), 'tour nao explica os botoes');
  assert.ok(html.includes('01-shaders-e-gpu.html'), 'M0 nao linka o M1');
  assert.ok(html.includes('Módulo 0'), 'breadcrumb do M0 ausente');
  // NAO renumerar: M0 nao deve se chamar "de 15"
  assert.ok(!html.includes('de 15'), 'M0 nao deve renumerar o curso pra 15');
});

test('o index linka o Modulo 0 acima do Marco 1', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('00-comecando.html'), 'index nao linka o M0');
  assert.ok(idx.indexOf('00-comecando.html') < idx.indexOf('Marco 1'), 'M0 deve vir antes do Marco 1');
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `module0.integration.test.js` falha (HTML não existe → readFileSync lança).

- [ ] **Step 3: Criar o HTML do Módulo 0**

Criar `site/modulos/00-comecando.html`. Estrutura padrão (mesma `<head>` dos outros módulos; `<body class="hf">`). Breadcrumb: `<p><a href="../index.html">← Mapa do curso</a> · Comece aqui · Módulo 0</p>`.

**Regra dura (do spec §2):** interativo-PRIMEIRO. NÃO é aula de sintaxe. O glossário é referência colapsável "pra ler, não escrever".

Seções IN ORDER (o teste trava: `<shader-playground>`, os 6 tokens, `class="cuidado"`, "Reset"/"Mostrar solução", link M1):

1. `<h1>Comece aqui: o Playground</h1>` + abertura curta e acolhedora: "Antes de pintar pixels, 2 minutos pra conhecer a ferramenta. Você vai brincar com um quadradinho de cor — sem medo de quebrar nada."
2. `<h2>Mexa sem medo</h2>` + `<shader-playground id="pg-tour"></shader-playground>` + texto: "Troque os números do `vec3` (são Vermelho, Verde, Azul, de 0 a 1) e clique **▶ Test Drive**. Erre à vontade: **↺ Reset** volta tudo, **💡 Mostrar solução** mostra uma resposta."
3. `<h2>Os botões</h2>` + `<div class="bullets"><ul>`: ▶ Test Drive (roda o que você escreveu) · ↺ Reset (volta ao original) · ✓ Conferir (aparece quando o exercício tem um alvo: compara seu resultado com ele) · 💡 Mostrar solução (mostra uma resposta pronta) · 🔁 Ver em HLSL (mostra como ficaria no Unity — ilustrativo).
4. `<div class="cuidado">` (debugging): "Tela preta/cinza ou ⚠ ERROR? Quase sempre é erro de digitação — faltou um `;` no fim da linha ou um parêntese. **↺ Reset** restaura o código certo; **💡 Mostrar solução** mostra a resposta. Não entre em pânico: errar é parte do jogo."
5. `<h2>Onde eu escrevo?</h2>` + texto do contrato dos markers: "Você só mexe na parte clara, entre as marcas `// >>> EDIT` e `// <<< EDIT`. O resto (mais apagado) é o **motor** — ele cuida da parte chata pra você."
6. `<details class="sidebar"><summary>🔤 Lendo uma linha de código pela 1ª vez (opcional)</summary><div>` + `<ul>` glossário, enquadrado "não precisa decorar — é só pra reconhecer quando ler":
   - `void main() { ... }` — a receita que a GPU roda pra cada pixel.
   - `;` — fim de uma instrução (como o ponto final de uma frase).
   - `gl_FragColor` — a **cor que sai** (o resultado final do pixel).
   - `vec3(r, g, b)` — um trio de números (uma cor: vermelho, verde, azul).
   - `float` — um número (com vírgula, tipo 0.5).
   - `step` e `mix` — duas funçõezinhas que você vai usar já no Módulo 1 (degrau e mistura) — a gente explica direitinho lá.
7. `<div class="qa"><dl>`: "Preciso saber programar? (Não! O curso ensina do zero. Aqui você só troca números e vê o que muda.)"; "E se eu apagar algo importante? (↺ Reset traz tudo de volta. Nada quebra de verdade.)".
8. Nav `<p>`: `<a href="01-shaders-e-gpu.html">Começar: Módulo 1 — Shaders &amp; a GPU →</a>`.

Script final (config do tour — conteúdo exato):

```html
  <script type="module">
    document.getElementById('pg-tour').config = {
      mode: 'fragment',
      fragment: `void main() {
// >>> EDIT: cor
  vec3 cor = vec3(0.2, 0.6, 1.0);
// <<< EDIT
  gl_FragColor = vec4(cor, 1.0);
}`,
      editableRegions: ['cor'],
      solution: '  vec3 cor = vec3(1.0, 0.4, 0.1);',
    };
  </script>
```

- [ ] **Step 4: Linkar o M0 no index, acima do Marco 1**

Em `site/index.html`, entre o parágrafo de abertura (linha ~12) e `<h2>Marco 1 ...`, inserir:

```html
  <p style="margin:18px 0"><strong>👉 <a href="modulos/00-comecando.html">Comece aqui — Módulo 0: o Playground</a></strong> (2 min pra conhecer a ferramenta)</p>
```

- [ ] **Step 5: Back-nav do M1 pro M0**

Em `site/modulos/01-shaders-e-gpu.html`, linha 12, trocar o breadcrumb:

De:
```html
  <p><a href="../index.html">← Mapa do curso</a> · Marco 1 · Módulo 1 de 6</p>
```
Para:
```html
  <p><a href="../index.html">← Mapa do curso</a> · <a href="00-comecando.html">← Comece aqui</a> · Marco 1 · Módulo 1 de 6</p>
```

- [ ] **Step 6: Criar o guia do professor**

Criar `site/professor/00-guia.md` (curto, padrão dos guias): objetivo (orientar a ferramenta + leitura mínima de código antes do M1), quando usar (1ª aula, 10–15 min), o que NÃO fazer (não transformar em aula de sintaxe — é exploração guiada), e nota de que o glossário é referência, não conteúdo a cobrar.

- [ ] **Step 7: Rodar os testes**

Run: `npm test`
Expected: PASS — 113 testes (110 + 3 do module0).

- [ ] **Step 8: Verificar no Chrome (shader NOVO — obrigatório)**

Servir e abrir `http://localhost:8000/modulos/00-comecando.html`. Confirmar: `pg-tour` renderiza um quadrado azul; editar os números do `vec3` + Test Drive muda a cor; Reset volta; Mostrar solução aplica a cor laranja; console sem erro GLSL. Conferir que o link "Módulo 1 →" e o index abrem certo.

- [ ] **Step 9: Commit + push**

```bash
git add site/modulos/00-comecando.html site/professor/00-guia.md test/module0.integration.test.js site/index.html site/modulos/01-shaders-e-gpu.html
git commit -m "feat(curso): Modulo 0 'Comece aqui' (onboarding do playground + glossario de leitura)"
git push
```

---

## Task 2: M7 — sub-blocos nomeados + afie de previsão

**Files:**
- Modify: `site/modulos/07-vertices-e-pipeline.html`
- Test: `test/module7.integration.test.js` (acrescenta asserts)

- [ ] **Step 1: Ler os arquivos**

Ler `site/modulos/07-vertices-e-pipeline.html` inteiro e `test/module7.integration.test.js`. Identificar os 3 momentos do conteúdo (malha/vértice → vertex×fragment → MVP/pipeline) e o `<shader-playground id="pg-cubo">`.

- [ ] **Step 2: Escrever o assert que falha**

Acrescentar a `test/module7.integration.test.js` (dentro do teste que lê o HTML, ou um novo teste):

```javascript
test('M7 tem sub-blocos numerados e um afie de previsao antes do cubo', () => {
  const html = readFileSync('site/modulos/07-vertices-e-pipeline.html', 'utf8');
  assert.ok(/1\.\s*A malha/i.test(html), 'falta o sub-bloco "1. A malha"');
  assert.ok(/2\.\s*Dois trabalhadores/i.test(html), 'falta o sub-bloco "2. Dois trabalhadores"');
  assert.ok(/3\.\s*O pipeline/i.test(html), 'falta o sub-bloco "3. O pipeline"');
  assert.ok(html.includes('class="afie"'), 'falta o afie de previsao no M7');
  assert.ok(/vértices?/i.test(html) && /quantas vezes/i.test(html), 'o afie nao pergunta sobre quantas vezes roda');
});
```
(Se o arquivo não tiver `import { readFileSync }` etc., seguir o padrão dos outros testes do arquivo.)

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — o novo assert falha (sub-blocos/afie ainda não existem).

- [ ] **Step 4: Renomear os `<h2>` em sub-blocos numerados**

No `07-vertices-e-pipeline.html`, ajustar os títulos de seção do conteúdo principal pra refletir os 3 sub-blocos (preservando o texto existente; só prefixar/renomear os `<h2>` correspondentes):
- O `<h2>` que introduz malha/vértice → `<h2>1. A malha: pontinhos ligados em triângulos</h2>`
- O `<h2>` que introduz vertex×fragment → `<h2>2. Dois trabalhadores: quem posiciona e quem pinta</h2>`
- O `<h2>` que introduz MVP/pipeline → `<h2>3. O pipeline: do vértice ao pixel</h2>`
(Se algum desses momentos não tiver `<h2>` próprio hoje, criar o `<h2>` no início do parágrafo correspondente.)

- [ ] **Step 5: Adicionar o afie de previsão antes do `pg-cubo`**

Imediatamente ANTES do `<shader-playground id="pg-cubo">`, inserir:

```html
  <div class="afie">
    <p><strong>Preveja antes de ver:</strong> este cubo tem 8 cantos (vértices) e cada pixel da tela
    que ele cobre é um fragmento.</p>
    <p>Por quadro, o <strong>vertex shader</strong> (que posiciona) roda quantas vezes? ____
    E o <strong>fragment shader</strong> (que pinta cada pixel) roda mais ou menos vezes que ele? ____</p>
    <p>Resposta: o vertex roda ~1 vez por vértice (pouquíssimas); o fragment roda 1 vez por pixel
    coberto (muitíssimas). É por isso que dividir o trabalho em dois faz sentido.</p>
  </div>
```

- [ ] **Step 6: Rodar os testes**

Run: `npm test`
Expected: PASS — 114 testes (113 + 1).

- [ ] **Step 7: Commit + push**

```bash
git add site/modulos/07-vertices-e-pipeline.html test/module7.integration.test.js
git commit -m "feat(m7): sub-blocos numerados + afie de previsao (vertex vs fragment) — auditoria didatica"
git push
```

---

## Task 3: M10 — exercício predict-observe da luz difusa (sem pixel-diff)

**Files:**
- Modify: `site/modulos/10-normais-e-luz.html`
- Test: `test/module10.integration.test.js` (acrescenta assert)

- [ ] **Step 1: Ler os arquivos**

Ler `site/modulos/10-normais-e-luz.html` (achar onde termina a explicação da difusa e começa o Projeto-Vitória) e `test/module10.integration.test.js`.

- [ ] **Step 2: Escrever o assert que falha**

Acrescentar a `test/module10.integration.test.js`:

```javascript
test('M10 tem exercicio predict-observe da difusa: editavel + solution, SEM pixel-diff', () => {
  const html = readFileSync('site/modulos/10-normais-e-luz.html', 'utf8');
  assert.ok(html.includes('id="pg-exercicio"'), 'falta o exercicio predict-observe');
  assert.ok(html.includes("editableRegions: ['luz']"), 'falta a regiao editavel luz');
  assert.ok(html.includes('max(dot(N, L), 0.0)'), 'falta a solucao da difusa');
  // o exercicio NAO pode ter reference (cena 3D nao tem pixel-diff)
  assert.ok(!html.includes('reference:'), 'M10 e cena 3D: nenhum playground pode ter reference');
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — assert falha (exercício não existe).

- [ ] **Step 4: Adicionar a seção do exercício antes do Projeto-Vitória**

Imediatamente ANTES da seção `🏆 Projeto-Vitória` do M10, inserir a prosa + o playground:

```html
  <h2>Sua vez: acenda a luz com as próprias mãos</h2>
  <p>Agora você escreve a conta. A esfera abaixo começa <strong>chapada</strong> (claridade fixa em
  1.0 — sem volume). Sua missão: troque o <code>1.0</code> pela receita da luz difusa, usando o
  <code>dot</code> entre a normal <code>N</code> e a direção da luz <code>L</code>.</p>
  <div class="afie">
    <p><strong>Preveja:</strong> quando você usar <code>max(dot(N, L), 0.0)</code>, qual parte da
    esfera vai ficar clara? E a parte virada pro lado contrário da luz?</p>
    <p>Escreva, clique ▶ Test Drive e confira: <strong>se a esfera ganhar um lado claro (virado pra
    luz) e um lado escuro, você acertou.</strong> Travou? 💡 Mostrar solução.</p>
  </div>

  <shader-playground id="pg-exercicio"></shader-playground>
```

E no `<script type="module">` final do M10, acrescentar a config (a chamada `.config` do novo id):

```html
    document.getElementById('pg-exercicio').config = {
      mode: 'mesh', mesh: 'sphere',
      fragment: `void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(u_lightDir);
// >>> EDIT: luz
  float dif = 1.0;
// <<< EDIT
  vec3 cor = vec3(0.55, 0.7, 1.0) * dif;
  gl_FragColor = vec4(cor, 1.0);
}`,
      solution: '  float dif = max(dot(N, L), 0.0);',
      editableRegions: ['luz'],
      uniforms: [{ name: 'u_vel', label: 'rotação', min: 0.0, max: 1.5, value: 0.0 }],
    };
```

(Sem `reference` → sem Conferir; tem `solution` → Mostrar solução aparece. `u_lightDir` é auto-uniform do motor; default fixo.)

- [ ] **Step 5: Rodar os testes**

Run: `npm test`
Expected: PASS — 115 testes (114 + 1).

- [ ] **Step 6: Verificar no Chrome (shader NOVO — obrigatório)**

Abrir `http://localhost:8000/modulos/10-normais-e-luz.html`. Confirmar: `pg-exercicio` começa como esfera de cor chapada (sem gradiente de luz); clicar 💡 Mostrar solução faz aparecer o lado claro/escuro (gradiente difuso); console sem erro GLSL. (Não há Conferir — confirmar que o botão Conferir NÃO aparece.)

- [ ] **Step 7: Commit + push**

```bash
git add site/modulos/10-normais-e-luz.html test/module10.integration.test.js
git commit -m "feat(m10): exercicio predict-observe da luz difusa (Mostrar-solucao, sem pixel-diff 3D)"
git push
```

---

## Task 4: M12 — checkpoint de consolidação + fix data Blinn-Phong

**Files:**
- Modify: `site/modulos/12-luz-especular.html`
- Test: `test/module12.integration.test.js` (acrescenta assert)

- [ ] **Step 1: Ler os arquivos**

Ler `site/modulos/12-luz-especular.html` (achar a seção do half-vector H, a frase da "receita do brilho", e a menção à história "anos 80") e `test/module12.integration.test.js`.

- [ ] **Step 2: Escrever o assert que falha**

Acrescentar a `test/module12.integration.test.js`:

```javascript
test('M12 tem checkpoint de consolidacao (dot(N,H)) e nao data o Blinn-Phong como anos 80', () => {
  const html = readFileSync('site/modulos/12-luz-especular.html', 'utf8');
  assert.ok(/dot\(N, ?H\)/.test(html) && /(grande ou pequeno|tamanho do brilho)/i.test(html),
    'falta o checkpoint sobre o que dot(N,H) alto causa no brilho');
  assert.ok(!/anos 80/i.test(html), 'Blinn-Phong nao deve ser datado como "anos 80" (e de 1977)');
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — assert falha.

- [ ] **Step 4: Inserir o checkpoint entre o half-vector e a receita**

Logo APÓS a seção que apresenta o half-vector `H = normalize(L + V)` e ANTES da "receita do brilho" (`pow(...)`), inserir:

```html
  <div class="brain">
    Pare e pense (você já sabe o <code>dot</code> desde o M8): se a normal <code>N</code> aponta
    quase na direção de <code>H</code>, o <code>dot(N, H)</code> fica <strong>alto</strong> (perto de 1).
    Isso vai deixar o brilho <strong>grande ou pequeno</strong> naquele ponto? E quando você eleva
    esse número a uma potência grande (<code>pow(..., 64.0)</code>), o ponto de brilho cresce ou encolhe?
    Segure seu palpite — a receita logo abaixo confirma.
  </div>
```

- [ ] **Step 5: Corrigir a data do Blinn-Phong**

Localizar a frase que diz que o brilho/Blinn-Phong é usado "dos anos 80" (ou "anos 80 até hoje") e trocar por uma datação correta — Blinn-Phong é de 1977. Ex.: trocar "dos anos 80 até hoje" por "desde os anos 1970 até hoje". Manter o resto da frase e o tom.

- [ ] **Step 6: Rodar os testes**

Run: `npm test`
Expected: PASS — 116 testes (115 + 1).

- [ ] **Step 7: Commit + push**

```bash
git add site/modulos/12-luz-especular.html test/module12.integration.test.js
git commit -m "feat(m12): checkpoint de consolidacao dot(N,H) + corrige data do Blinn-Phong (1977)"
git push
```

---

## Task 5: M14 — seção "E agora? Próximos passos"

**Files:**
- Modify: `site/modulos/14-otimizacao.html`
- Test: `test/module14.integration.test.js` (acrescenta assert)

- [ ] **Step 1: Ler os arquivos**

Ler `site/modulos/14-otimizacao.html` (achar a seção de fechamento do curso / "Missão Final") e `test/module14.integration.test.js`.

- [ ] **Step 2: Escrever o assert que falha**

Acrescentar a `test/module14.integration.test.js`:

```javascript
test('M14 tem secao de proximos passos com caminhos reais', () => {
  const html = readFileSync('site/modulos/14-otimizacao.html', 'utf8');
  assert.ok(/E agora|Próximos passos|Proximos passos/i.test(html), 'falta a secao de proximos passos');
  assert.ok(/Shadertoy/i.test(html), 'falta apontar o Shadertoy');
  assert.ok(/WebGPU/i.test(html), 'falta apontar o WebGPU');
  assert.ok(/Unity/i.test(html), 'falta apontar o Unity');
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — assert falha.

- [ ] **Step 4: Inserir a seção "E agora?" perto do fechamento**

Após a seção de fechamento do curso (a "Missão Final" / recap), e antes da navegação final, inserir:

```html
  <h2>E agora? Próximos passos</h2>
  <p>Você terminou — mas isto é só o começo do que dá pra fazer. Pra onde ir:</p>
  <div class="bullets">
    <ul>
      <li><strong><a href="https://www.shadertoy.com" target="_blank" rel="noopener">Shadertoy</a></strong>
      — um playground de shaders no navegador, igual ao nosso, com milhares de exemplos pra estudar e remixar.</li>
      <li><strong>WebGPU</strong> — a próxima geração do WebGL; é onde os <em>compute shaders</em> de verdade
      (lembra do M13?) rodam no navegador.</li>
      <li><strong>Unity (Shader Graph / HLSL)</strong> — o "outro sotaque" que você viu no botão 🔁: leve
      suas ideias pra fazer shaders em jogos de verdade.</li>
      <li><strong><a href="https://thebookofshaders.com/?lan=pt" target="_blank" rel="noopener">The Book of Shaders</a></strong>
      — um livro online (em português) que vai fundo em fragment shaders, do jeito que você já curte.</li>
    </ul>
  </div>
  <p>O mais importante: continue mexendo no seu <strong>Efeito Autoral</strong> (M12). Todo shader que
  você admira começou exatamente assim — alguém trocando números e vendo o que muda.</p>
```

- [ ] **Step 5: Rodar os testes**

Run: `npm test`
Expected: PASS — 117 testes (116 + 1).

- [ ] **Step 6: Commit + push**

```bash
git add site/modulos/14-otimizacao.html test/module14.integration.test.js
git commit -m "feat(m14): secao 'E agora?' com proximos passos (Shadertoy, WebGPU, Unity, Book of Shaders)"
git push
```

---

## Task 6: M8 `cos` + M11 `zbuffer.svg`

**Files:**
- Modify: `site/modulos/08-vetores-e-coordenadas.html`
- Create: `site/assets/img/zbuffer.svg`
- Modify: `site/modulos/11-hardware-fixo.html` (trocar o placeholder `.img-todo` pelo SVG)
- Test: `test/module11.integration.test.js` (acrescenta assert)

- [ ] **Step 1: Ler os arquivos**

Ler `site/modulos/08-vetores-e-coordenadas.html` (achar o `<details class="sidebar">` de matemática) e `site/modulos/11-hardware-fixo.html` (achar o bloco `<div class="img-todo">[IMAGEM: ... die ...]`) e `test/module11.integration.test.js`.

- [ ] **Step 2: Escrever o assert que falha**

Acrescentar a `test/module11.integration.test.js`:

```javascript
test('M11 usa o zbuffer.svg no lugar do placeholder de imagem', () => {
  const html = readFileSync('site/modulos/11-hardware-fixo.html', 'utf8');
  assert.ok(html.includes('zbuffer.svg'), 'M11 nao referencia o zbuffer.svg');
  assert.ok(!/\[IMAGEM:[^\]]*die/i.test(html), 'placeholder do die de GPU ainda presente');
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — assert falha (zbuffer.svg ainda não referenciado).

- [ ] **Step 4: Criar `site/assets/img/zbuffer.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320" width="640" font-family="sans-serif">
  <rect width="640" height="320" fill="#fbfbf7"/>
  <text x="20" y="30" font-size="16" font-weight="bold" fill="#333">Z-buffer: quando dois caem no mesmo pixel, o mais perto ganha</text>
  <!-- camera/olho -->
  <text x="20" y="180" font-size="13" fill="#666">olho 👁</text>
  <!-- retangulo perto (z menor) -->
  <rect x="180" y="110" width="160" height="120" fill="#1c7ed6" opacity="0.9"/>
  <text x="200" y="175" font-size="14" fill="#fff">z = 0.3 (perto)</text>
  <!-- retangulo longe (z maior), parcialmente atras -->
  <rect x="300" y="80" width="160" height="120" fill="#e8590c" opacity="0.55"/>
  <text x="360" y="120" font-size="14" fill="#333">z = 0.8 (longe)</text>
  <!-- pixel disputado -->
  <rect x="300" y="110" width="40" height="40" fill="none" stroke="#111" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="250" y="270" font-size="15" fill="#2b8a3e">No pixel disputado, vence o de z menor (0.3): o azul aparece, o laranja fica escondido.</text>
</svg>
```

- [ ] **Step 5: Trocar o placeholder do M11 pelo SVG**

Em `site/modulos/11-hardware-fixo.html`, localizar o bloco do placeholder do die de GPU (o `<figure>` com `<div class="img-todo">[IMAGEM: ... die ...]...</div>`) e substituí-lo por:

```html
  <figure>
    <img src="../assets/img/zbuffer.svg" alt="Dois retângulos se sobrepondo vistos pelo olho: o azul em z=0.3 (perto) e o laranja em z=0.8 (longe); no pixel disputado o azul (z menor) vence e aparece" width="640">
    <figcaption>O Z-buffer guarda a profundidade de cada pixel e deixa passar só o mais perto.</figcaption>
  </figure>
```

- [ ] **Step 6: Adicionar a frase do `cos` no sidebar do M8**

Em `site/modulos/08-vetores-e-coordenadas.html`, dentro do `<details class="sidebar">` de matemática (no `<div>` interno), acrescentar ao fim um parágrafo:

```html
      <p><strong>E o <code>cos</code>?</strong> Aparece em alguns demos pra girar uma direção. É a
      mesma onda do <code>sin</code> (que você viu no M3), só começando num ponto diferente:
      <code>cos(0) = 1</code> e <code>sin(0) = 0</code>. Por isso <code>sin</code> e <code>cos</code>
      juntos desenham um círculo.</p>
```

(Se o M8 não tiver `<details class="sidebar">`, criar um curto com `<summary>🧮 Matemática de bolso: sin & cos</summary>` contendo esse parágrafo.)

- [ ] **Step 7: Rodar os testes**

Run: `npm test`
Expected: PASS — 118 testes (117 + 1).

- [ ] **Step 8: Verificar no Chrome (opcional — sem shader novo)**

Abrir `http://localhost:8000/modulos/11-hardware-fixo.html` e confirmar que o `zbuffer.svg` aparece no lugar do placeholder (dois retângulos, legenda "z menor ganha"). Não há shader novo; verificação leve.

- [ ] **Step 9: Commit + push**

```bash
git add site/modulos/08-vetores-e-coordenadas.html site/modulos/11-hardware-fixo.html site/assets/img/zbuffer.svg test/module11.integration.test.js
git commit -m "feat(m8,m11): explica cos no sidebar do M8 + zbuffer.svg no lugar do placeholder do M11"
git push
```

---

## Encerramento

Após a Task 6, o pass de polimento está completo: Módulo 0 + 6 ajustes didáticos. `npm test` deve mostrar **118 testes** verdes. Trabalho direto em `main` (working tree limpo, em dia com origin). Sem branch a finalizar.

## Self-Review (cobertura do spec)

- **§3.1 Módulo 0 (tour interativo + glossário colapsável + Cuidado debugging + contrato markers)** → Task 1 (seções 1–8; glossário em `<details>` "ler não escrever"; tokens float/vec3/step/mix + estruturais). ✓
- **§3.2 numeração (M0 pré-curso, não renumera; nav M1→M0; index acima do Marco 1; teste da cadeia)** → Task 1 Steps 4/5 + teste do Step 1 (assert `!de 15`, `00 < Marco 1`). ✓
- **§3.3 M7 sub-blocos+afie** → Task 2. **M10 predict-observe sem reference** → Task 3 (assert `!reference:`). **M12 checkpoint + fix data** → Task 4. **M14 "E agora?"** → Task 5. **cos no M8** → Task 6. **zbuffer.svg no M11** → Task 6. ✓
- **§4 gate Chrome por shader novo** → Task 1 Step 8 (pg-tour) e Task 3 Step 6 (pg-exercicio). ✓
- **§4 testes de integração** → cada task estende o teste do módulo (module0 novo; M7/M10/M12/M14/M11 asserts). ✓
- **§6 deferidos** → não implementados (correto): transparência, smoke GLSL, leaks, fotos, linha M4, aspect-ratio. ✓
- **Consistência de tipos/ids:** ids novos `pg-tour` (M0), `pg-exercicio` (M10) batem entre HTML e testes; `editableRegions: ['cor']`/`['luz']` e `solution` consistentes; nenhum `reference` em cena 3D. ✓
- **Contagem de testes:** 110 → 113 (T1) → 114 (T2) → 115 (T3) → 116 (T4) → 117 (T5) → 118 (T6). ✓
