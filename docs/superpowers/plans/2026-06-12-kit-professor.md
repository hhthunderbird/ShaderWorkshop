# Kit do Professor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a landing `site/professor/index.html` (Head First) que explica como rodar o curso, indexa os 17 guias e consolida as rubricas 0–5 já existentes dos 3 Projetos-Vitória; linká-la do `index.html`.

**Architecture:** Conteúdo estático HTML/CSS — ZERO motor/shader. Reusa `headfirst.css` (+ um bloco `.rubrica` de tabela). As rubricas NÃO são reescritas: a landing resume a forma comum (esquema 0–5) e linka pros guias (fonte única). Um teste de integração node trava a estrutura.

**Tech Stack:** HTML/CSS estático, `node --test`, `npm run smoke` (só confirma que nada de shader regrediu).

**Spec:** `docs/superpowers/specs/2026-06-12-kit-professor-design.md`.

**Convenções herdadas:**
- Web em `site/`. Testes em `test/`. Rodar: `npm test`. **Baseline atual: 144 testes + `npm run smoke` (17 módulos) verde.**
- Página Head First: `<head>` com `headfirst.css`; `<body class="hf">`; breadcrumb; `<h1>`; seções; nav final.
- **Auditoria (fechada no spec):** as rubricas 0–5 já existem no fim dos guias 05/10/12. A landing **consolida e linka**, não reinventa.

---

## Task 1: Teste de integração (falha primeiro)

**Files:**
- Test: `test/professor-kit.integration.test.js`

- [ ] **Step 1: Escrever o teste**

Criar `test/professor-kit.integration.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const MODULOS = [
  '00-comecando', '01-shaders-e-gpu', '02-pixel-e-cor', '03-matematica-vira-imagem',
  '04-formas-e-padroes', '05-dando-vida-animacao', '06-paralelismo', '07-vertices-e-pipeline',
  '08-vetores-e-coordenadas', '09-texturas-e-uv', '10-normais-e-luz', '11-hardware-fixo',
  '12-luz-especular', '13-alem-de-pixels', '14-otimizacao', '15-placa-de-video', '16-transparencia',
];

test('kit professor: landing existe com as 3 secoes-chave', () => {
  const html = readFileSync('site/professor/index.html', 'utf8');
  assert.ok(html.includes('Kit do Professor'), 'falta o titulo/breadcrumb do kit');
  assert.ok(/Como rodar o curso/i.test(html), 'falta a secao Como rodar o curso');
  assert.ok(/guias/i.test(html), 'falta a secao de guias');
  assert.ok(/Avalia/i.test(html) && html.includes('0–5'), 'falta a secao de avaliacao com o esquema 0-5');
});

test('kit professor: indexa os 17 guias e os 17 modulos do aluno', () => {
  const html = readFileSync('site/professor/index.html', 'utf8');
  for (let i = 0; i <= 16; i++) {
    const n = String(i).padStart(2, '0');
    assert.ok(html.includes(`${n}-guia.md`), `falta link pro guia ${n}`);
  }
  for (const m of MODULOS) {
    assert.ok(html.includes(`../modulos/${m}.html`), `falta link pro modulo ${m}`);
  }
});

test('kit professor: consolida as 3 rubricas e linka os guias de projeto', () => {
  const html = readFileSync('site/professor/index.html', 'utf8');
  assert.ok(html.includes('Meu Padrão Animado'), 'falta a rubrica do M5');
  assert.ok(html.includes('Objeto Texturizado e Iluminado'), 'falta a rubrica do M10');
  assert.ok(html.includes('Efeito Autoral'), 'falta a rubrica do M12');
  for (const g of ['05-guia.md', '10-guia.md', '12-guia.md']) {
    assert.ok(html.includes(g), `secao de avaliacao nao linka ${g}`);
  }
});

test('kit professor: index do site linka a pagina do professor', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('professor/index.html'), 'index nao linka o kit do professor');
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — `site/professor/index.html` não existe (`readFileSync` lança); e o index ainda não linka.

---

## Task 2: Criar a landing `site/professor/index.html`

**Files:**
- Create: `site/professor/index.html`

- [ ] **Step 1: Criar o arquivo**

Criar `site/professor/index.html` com este conteúdo exato:

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kit do Professor — Curso de Shaders & GPU</title>
  <link rel="stylesheet" href="../assets/css/headfirst.css">
</head>
<body class="hf">
  <p><a href="../index.html">← Mapa do curso</a> · Kit do Professor</p>
  <h1>Kit do Professor</h1>
  <p>Este curso foi feito pra ser <strong>híbrido</strong>: o aluno aprende mexendo no playground
  (autoestudo), e você entra como <strong>guia</strong>, não como palestrante. O método é Head First —
  concreto antes de abstrato, errar faz parte, e ninguém precisa decorar sintaxe. Pensado pra turmas
  com <strong>zero programação</strong>.</p>
  <div class="brain">
    A regra de ouro: <strong>não dê a aula expositiva primeiro.</strong> Deixe o aluno prever e testar
    no playground; explique depois, em cima do que ele já viu acontecer na tela. Cada guia traz um
    roteiro com tempos pra te ajudar a segurar essa ordem.
  </div>

  <h2>Como rodar o curso</h2>
  <p>O curso é feito de <strong>marcos aninhados</strong> — cada marco é um "curso" completo, e você
  pode parar em qualquer um:</p>
  <div class="bullets">
    <ul>
      <li><strong>M0 — Comece aqui</strong> (pré-curso, 1 aula curta): tour do playground, sem conteúdo novo.</li>
      <li><strong>Marco 1 — "curso curto" (M1–M6):</strong> fundamentos de shaders de pixel (cor, math, formas, animação, paralelismo). Fecha no <strong>Projeto-Vitória 1</strong> (M5).</li>
      <li><strong>Marco 2 — "curso médio" (M7–M11):</strong> 3D, malhas, textura e luz. Fecha no <strong>Projeto-Vitória 2</strong> (M10).</li>
      <li><strong>Marco 3 — "curso longo" (M12–M14):</strong> brilho especular, GPU como calculadora, otimização. Fecha no <strong>Projeto-Vitória 3</strong> (M12).</li>
      <li><strong>Bônus (opcionais, pós-curso):</strong> M15 (decifrando a placa de vídeo) e M16 (transparência/alpha).</li>
    </ul>
  </div>
  <p><strong>Tempo:</strong> ~1 aula por módulo, mais tempo de projeto ao fim de cada marco.
  <strong>Salvar trabalho:</strong> o botão <strong>💾 Salvar</strong> guarda o shader do aluno no
  navegador (Efeito Autoral entre aulas — mesmo computador/navegador). Há também <strong>📷 Baixar
  imagem</strong> e <strong>📋 Copiar shader</strong> pra entrega.</p>

  <h2>Os guias, módulo a módulo</h2>
  <p>Cada guia traz <strong>objetivos</strong>, <strong>roteiro sugerido</strong> (com tempos),
  <strong>pontos de tropeço comuns</strong> e <strong>gabarito</strong>. São arquivos de texto
  (Markdown) — abrem direto no GitHub, ou como texto no editor.</p>
  <table class="rubrica">
    <tr><th>Módulo</th><th>Guia do professor</th><th>Módulo do aluno</th></tr>
    <tr><td>M0 — Comece aqui</td><td><a href="00-guia.md">Guia 00</a></td><td><a href="../modulos/00-comecando.html">abrir</a></td></tr>
    <tr><td>M1 — Shaders &amp; a GPU</td><td><a href="01-guia.md">Guia 01</a></td><td><a href="../modulos/01-shaders-e-gpu.html">abrir</a></td></tr>
    <tr><td>M2 — O Pixel e a Cor</td><td><a href="02-guia.md">Guia 02</a></td><td><a href="../modulos/02-pixel-e-cor.html">abrir</a></td></tr>
    <tr><td>M3 — Matemática que Vira Imagem</td><td><a href="03-guia.md">Guia 03</a></td><td><a href="../modulos/03-matematica-vira-imagem.html">abrir</a></td></tr>
    <tr><td>M4 — Formas e Padrões</td><td><a href="04-guia.md">Guia 04</a></td><td><a href="../modulos/04-formas-e-padroes.html">abrir</a></td></tr>
    <tr><td>M5 — Dando Vida (Animação) 🏆</td><td><a href="05-guia.md">Guia 05</a></td><td><a href="../modulos/05-dando-vida-animacao.html">abrir</a></td></tr>
    <tr><td>M6 — Paralelismo</td><td><a href="06-guia.md">Guia 06</a></td><td><a href="../modulos/06-paralelismo.html">abrir</a></td></tr>
    <tr><td>M7 — Vértices e Pipeline</td><td><a href="07-guia.md">Guia 07</a></td><td><a href="../modulos/07-vertices-e-pipeline.html">abrir</a></td></tr>
    <tr><td>M8 — Vetores e Coordenadas</td><td><a href="08-guia.md">Guia 08</a></td><td><a href="../modulos/08-vetores-e-coordenadas.html">abrir</a></td></tr>
    <tr><td>M9 — Texturas e UV</td><td><a href="09-guia.md">Guia 09</a></td><td><a href="../modulos/09-texturas-e-uv.html">abrir</a></td></tr>
    <tr><td>M10 — Normais e Luz 🏆</td><td><a href="10-guia.md">Guia 10</a></td><td><a href="../modulos/10-normais-e-luz.html">abrir</a></td></tr>
    <tr><td>M11 — Hardware Fixo</td><td><a href="11-guia.md">Guia 11</a></td><td><a href="../modulos/11-hardware-fixo.html">abrir</a></td></tr>
    <tr><td>M12 — Luz Especular &amp; Brilho 🏆</td><td><a href="12-guia.md">Guia 12</a></td><td><a href="../modulos/12-luz-especular.html">abrir</a></td></tr>
    <tr><td>M13 — Além de Pixels</td><td><a href="13-guia.md">Guia 13</a></td><td><a href="../modulos/13-alem-de-pixels.html">abrir</a></td></tr>
    <tr><td>M14 — Otimização</td><td><a href="14-guia.md">Guia 14</a></td><td><a href="../modulos/14-otimizacao.html">abrir</a></td></tr>
    <tr><td>M15 — Placa de Vídeo 🎁</td><td><a href="15-guia.md">Guia 15</a></td><td><a href="../modulos/15-placa-de-video.html">abrir</a></td></tr>
    <tr><td>M16 — Transparência 🎁</td><td><a href="16-guia.md">Guia 16</a></td><td><a href="../modulos/16-transparencia.html">abrir</a></td></tr>
  </table>
  <p style="font-size:15px;color:#555">🏆 = fecha um marco com Projeto-Vitória · 🎁 = bônus opcional.</p>

  <h2>Avaliação: as rubricas num só lugar</h2>
  <p>Cada Projeto-Vitória já tem uma <strong>rubrica sugerida 0–5</strong> no fim do seu guia. Aqui
  elas ficam lado a lado pra comparar. O tom é <strong>formativo</strong>: incentive originalidade, não
  complexidade — não existe resposta única num projeto aberto.</p>
  <p><strong>A forma comum (0–5):</strong> 1 ponto por (a) técnica-chave do marco com efeito visível ·
  (b) 2ª técnica do marco · (c) cor/ajuste autoral (não o padrão) · (d) entrega (PNG baixado e/ou
  shader copiado) · (e) explica em 1–2 frases o que fez. A <strong>meta mínima</strong> é usar os
  ingredientes do marco (varia por projeto, abaixo).</p>
  <table class="rubrica">
    <tr><th>Projeto-Vitória</th><th>Técnicas esperadas</th><th>Meta mínima</th><th>Rubrica completa</th></tr>
    <tr>
      <td><strong>M5 — Meu Padrão Animado</strong></td>
      <td>cor · função (sin/step/smoothstep/fract) · forma (<code>length</code>) · tempo (<code>u_time</code>)</td>
      <td>≥3 dos 4 ingredientes do Marco 1</td>
      <td><a href="05-guia.md">guia M5</a></td>
    </tr>
    <tr>
      <td><strong>M10 — Objeto Texturizado e Iluminado</strong></td>
      <td>textura · luz difusa (<code>max(dot(N,L),0.0)</code>) · cor autoral</td>
      <td>≥2 dos 3 (a forma vem de graça)</td>
      <td><a href="10-guia.md">guia M10</a></td>
    </tr>
    <tr>
      <td><strong>M12 — Efeito Autoral</strong></td>
      <td>especular (<code>pow(max(dot(N,H),0.0),exp)</code>) · difusa · textura/cor autoral</td>
      <td>≥3 ingredientes, especular obrigatório</td>
      <td><a href="12-guia.md">guia M12</a></td>
    </tr>
  </table>
  <p style="font-size:15px;color:#555">Os 5 itens de 1 ponto completos estão no fim de cada guia (fonte
  única) — esta tabela resume e aponta pra lá.</p>

  <h2>Onde os alunos travam (resumo)</h2>
  <p>Cada guia tem uma seção <strong>"Pontos de tropeço comuns"</strong>. Três tropeços transversais
  pra ficar de olho:</p>
  <div class="bullets">
    <ul>
      <li><strong>Tela preta/cinza ou ⚠ ERROR:</strong> quase sempre é erro de digitação (faltou um
      <code>;</code> ou um parêntese). <strong>↺ Reset</strong> restaura; o motor mostra uma dica em
      português do que deu errado.</li>
      <li><strong>"Dureza alta = brilho menor" (M12):</strong> contra-intuitivo — expoente grande
      <em>afila</em> o brilho. Demonstre com dois valores extremos.</li>
      <li><strong>UV muda de sentido entre M2 e M9:</strong> no M2 é a tela; no M9 é a superfície do
      objeto. Vale frisar quando chegar lá.</li>
    </ul>
  </div>
  <p>Para tirar dúvidas de termos, há o <a href="../glossario.html">glossário do curso</a> (45+ termos,
  cada um linkado ao módulo que ensina).</p>

  <p><a href="../index.html">← Voltar pro mapa do curso</a></p>
</body>
</html>
```

- [ ] **Step 2: Conferir os nomes dos arquivos de módulo**

Run: `ls site/modulos/`
Expected: os 17 arquivos batem com os `href` da tabela (00-comecando … 16-transparencia). Se algum nome divergir, corrigir o `href` correspondente no HTML.

---

## Task 3: Estilo `.rubrica` no headfirst.css

**Files:**
- Modify: `site/assets/css/headfirst.css`

- [ ] **Step 1: Acrescentar o bloco de estilo**

No fim de `site/assets/css/headfirst.css` (após a última linha, o fechamento do `@media` de reduced-motion), acrescentar:

```css

/* Tabela de rubrica / índice do kit do professor (o estilo de .sidebar table é escopado lá). */
.hf .rubrica { border-collapse: collapse; margin: 12px 0; width: 100%; }
.hf .rubrica th, .hf .rubrica td { border: 1px solid #bbb; padding: 6px 10px; text-align: left; font-size: 15px; vertical-align: top; }
.hf .rubrica th { background: #e7e0ff; }
```

---

## Task 4: Link no index do site

**Files:**
- Modify: `site/index.html`

- [ ] **Step 1: Acrescentar o rodapé "Para professores"**

Em `site/index.html`, localizar o fim da seção Bônus (o `</ul>` logo antes de `</body>`):

```html
    <li><a href="modulos/16-transparencia.html">Transparência: o Alpha</a> — vidro, água e fumaça: o 4º canal do vec4 e como o alpha mistura cores.</li>
  </ul>
```
Logo após esse `</ul>` (antes de `</body>`), inserir:

```html

  <hr>
  <p>👩‍🏫 <a href="professor/index.html"><strong>Para professores</strong></a> — como rodar o curso, guias por módulo e rubricas de avaliação.</p>
```

---

## Task 5: Verde + verificação + push

**Files:** nenhum.

- [ ] **Step 1: Rodar os testes**

Run: `npm test`
Expected: PASS — os 4 testes do kit verdes (baseline 144 → 148).

- [ ] **Step 2: Smoke (nada de shader mudou)**

Run: `npm run smoke`
Expected: verde, 17 módulos (a página do professor não é varrida; nada regrediu).

- [ ] **Step 3: Verificação leve (opcional, sem shader)**

`npm run serve` → abrir `http://localhost:8000/professor/index.html`: confirmar que as duas tabelas (`.rubrica`) têm borda/cabeçalho lilás, os links de guia/módulo abrem, e o link "Para professores" no `index.html` chega aqui. (Sem WebGL — não há gate Chrome.)

- [ ] **Step 4: Commit + push**

```bash
git add site/professor/index.html site/assets/css/headfirst.css site/index.html test/professor-kit.integration.test.js
git commit -m "feat(curso): Kit do Professor (landing: como rodar + indice dos 17 guias + rubricas 0-5 consolidadas)"
git push
```

- [ ] **Step 5: Fechamento**

Item #9 completo. Backlog restante: só #1 (piloto com alunos) e #2 (hardware real) — ambos dependem do usuário. `main` em dia, working tree limpo.

---

## Self-Review (cobertura do spec)

- **§1 escopo (landing: como rodar + índice dos 17 guias + rubricas 0–5 consolidadas; linka do index)** → Tasks 2 (HTML com as 3 seções), 4 (link). ✓
- **§2 política (zero motor/shader, smoke 17)** → nenhum arquivo de `assets/playground/`; Task 5 Step 2. ✓
- **§3.1–3.6 conteúdo (intro, como rodar, tabela de guias, rubricas consolidadas, tropeços, nav)** → Task 2 Step 1 (todas as seções presentes). ✓
- **§3.4 rubricas reusam 0–5, fonte única (resume + linka, não copia os 5 bullets)** → Task 2 (forma comum + tabela com link pro guia; nota de fonte única). ✓
- **§4 link no index + estilo .rubrica** → Tasks 4 e 3. ✓
- **§5 nomes reais dos arquivos** → Task 2 Step 2 (conferência com `ls`). ✓
- **§6 testes (existe; 17 guias + 17 módulos; 3 rubricas + guias linkados + esquema 0–5; index linka)** → Task 1. ✓
- **§8 riscos (links .md como texto — avisado na landing; não inventar esquema; single source)** → Task 2 (texto "arquivos de texto/Markdown"; rubricas linkam guias). ✓
- **Consistência:** os 17 slugs da tabela HTML batem com a lista `MODULOS` do teste; `05/10/12-guia.md` aparecem tanto na tabela de guias quanto na seção de avaliação. ✓
- **Contagem de testes:** 144 → 148 (T1: +4). ✓
