# Kit do Professor — Design

**Data:** 2026-06-12. **Pré-requisito:** os 17 guias `site/professor/NN-guia.md` (00–16, já existem). **Item #9 do backlog (kit professor).**
**Origem:** backlog "melhorar o curso", em ordem numérica (#1/#2 dependem do usuário; #6/#8 feitos; **#9 é o último item acionável sem aluno/hardware real**). Os 17 guias do professor já existem (objetivos/roteiro/tropeços/gabarito por módulo), **e os 3 guias de projeto (M5/M10/M12) já trazem uma rubrica 0–5 no fim** — mas tudo é **órfão**: não há índice, não estão linkados do site, e as rubricas estão enterradas no fim de 3 guias dispersos.

**Achado de auditoria (06/12):** o gap NÃO é ausência de rubrica — é **descoberta e consolidação**. As rubricas existem (`## Avaliação do Projeto-Vitória (rubrica, 0–5)` nos guias 05/10/12), no esquema **0–5 pontos** (5 itens de 1pt + meta mínima de ingredientes do marco). O design NÃO inventa um esquema novo (seria conflitante); apenas **dá entrada e consolida** o que existe.

## 1. Escopo e objetivo

Criar a porta de entrada do material do professor e tornar as rubricas existentes descobríveis. **Decisão travada (via brainstorming + auditoria): versão enxuta, reusa o esquema 0–5 existente.**

Entregar **uma página HTML** (`site/professor/index.html`, estilo Head First do site) que:
1. Explica **como rodar o curso** (modelo híbrido, estrutura de marcos, tempo, método).
2. **Indexa os 17 guias** existentes (link pro guia + link pro módulo do aluno).
3. **Consolida as rubricas existentes** dos 3 Projetos-Vitória (M5/M10/M12) num só lugar, no esquema 0–5 que já está nos guias, cada uma linkando pro guia completo. **NÃO reescreve em esquema novo.**

E **linka essa página do `site/index.html`** (rodapé "Para professores").

**Escopo cortado (YAGNI):** sem slides (o "roteiro sugerido" de cada guia já cobre); sem folhas-do-aluno por módulo (os módulos já são folhas interativas — duplicaria); **sem converter os 17 guias `.md` em HTML** (a landing os linka; o GitHub os renderiza, e localmente abrem como texto); **sem inventar rubrica nova** (reusa o 0–5 existente — evita dois esquemas conflitantes).

## 2. Política respeitada
- **Zero motor/shader.** Nenhuma mudança em `assets/playground/`. `npm run smoke` segue 17 verde (o smoke varre só `site/modulos/`).
- Conteúdo coerente com o curso: método Head First (não dar aula expositiva — deixar explorar), não cobrar sintaxe, Projetos-Vitória são os artefatos avaliáveis.

## 3. Componente: `site/professor/index.html`

`<head>` com `headfirst.css` (sem playground — não há shader). `<body class="hf">`. Breadcrumb: `<p><a href="../index.html">← Mapa do curso</a> · Kit do Professor</p>`.

Seções em ordem (o teste trava os marcos):

1. **`<h1>Kit do Professor</h1>` + intro.** Modelo híbrido (autoestudo + camada professor). Método Head First: o aluno aprende mexendo; o professor é guia, não palestrante. Não cobrar sintaxe de cor (o curso ensina por exploração). Curso pensado pra ~zero programação.

2. **`<h2>Como rodar o curso</h2>`** — estrutura aninhada de marcos:
   - **M0 "Comece aqui"** (pré-curso, 1 aula curta): tour do playground.
   - **Marco 1 (M1–M6) = "curso curto":** fundamentos de fragment shaders → Projeto-Vitória 1 (M5).
   - **Marco 2 (M7–M11) = "curso médio":** 3D/malhas/textura/luz → Projeto-Vitória 2 (M10).
   - **Marco 3 (M12–M14) = "curso longo":** specular/compute/otimização → Projeto-Vitória 3 (M12).
   - **Bônus:** M15 (placa de vídeo), M16 (transparência) — pós-curso, opcionais.
   - Tempo: ~1 aula por módulo + tempo de projeto nos marcos. Pode parar em qualquer marco (cada um é um "curso" completo).
   - Nota sobre **salvar trabalho** (botão 💾 Salvar): o aluno guarda o Efeito Autoral entre aulas no mesmo navegador.

3. **`<h2>Os guias por módulo</h2>`** — tabela (`class="rubrica"` reusada pro estilo) com colunas **Módulo | Guia do professor | Módulo do aluno**, uma linha por módulo de **00 a 16** (17 linhas):
   - Guia: `<a href="NN-guia.md">Guia NN</a>`.
   - Aluno: `<a href="../modulos/NN-nome.html">abrir</a>` (usar os nomes reais dos arquivos — ver §5).
   - Nota curta: os guias trazem objetivos, roteiro sugerido (tempo), pontos de tropeço e gabarito.

4. **`<h2>Avaliação: as rubricas num só lugar</h2>`** + enquadramento: as rubricas **já vivem no fim dos guias** dos projetos (05/10/12), no esquema **0–5 pontos** (5 itens de 1pt; meta mínima = ingredientes do marco). Aqui elas ficam lado a lado, pra comparar. Tom: avaliação **sugerida** e formativa — incentivar originalidade, não complexidade (texto que já está nos guias).

   **A forma comum (explicada uma vez, antes das tabelas):** cada projeto vale 0–5; ganha 1 ponto por: (a) técnica-chave do marco com efeito visível, (b) 2ª técnica do marco, (c) cor/ajuste autoral (não o padrão), (d) entrega (PNG baixado e/ou shader copiado), (e) explica em 1–2 frases o que fez. **Meta mínima = os ingredientes do marco** (ver por projeto).

   **Tabela `class="rubrica"` consolidada** — colunas **Projeto | Técnicas esperadas (1+2) | Meta mínima | Rubrica completa**, uma linha por projeto (reusa os critérios JÁ escritos nos guias, NÃO inventa novos):
   - **M5 "Meu Padrão Animado"** — cor + função + forma + tempo (`u_time`) | ≥3 dos 4 ingredientes do Marco 1 | `<a href="05-guia.md">guia M5</a>`.
   - **M10 "Objeto Texturizado e Iluminado"** — textura + luz difusa (`max(dot(N,L),0.0)`) + cor autoral | ≥2 dos 3 (forma vem de graça) | `<a href="10-guia.md">guia M10</a>`.
   - **M12 "Efeito Autoral"** — especular (`pow(max(dot(N,H),0.0),exp)`) + difusa + textura/cor autoral | ≥3 ingredientes, especular obrigatório | `<a href="12-guia.md">guia M12</a>`.

   Nota: as listas de 1pt completas continuam no fim de cada guia (fonte única); a landing resume e linka. (Single source: a landing NÃO copia os 5 bullets — resume a forma comum + a especificidade por projeto, e manda pro guia.)

5. **`<h2>Onde os alunos travam (resumo)</h2>`** (curto) — aponta que cada guia tem a seção "Pontos de tropeço comuns"; lista 2–3 transversais (tela preta = erro de digitação → Reset; "dureza alta = brilho menor" no M12; UV muda de sentido entre M2 e M9). Fecha apontando o glossário (`../glossario.html`) e a página de erros amigáveis embutida no motor.

6. Nav final: `<a href="../index.html">← Voltar pro mapa do curso</a>`.

## 4. Link no site + estilo

- **`site/index.html`:** antes de `</body>` (após a seção Bônus), acrescentar um rodapé:
  ```html
  <hr>
  <p>👩‍🏫 <a href="professor/index.html"><strong>Para professores</strong></a> — como rodar o curso, guias por módulo e rubricas de avaliação.</p>
  ```
- **`site/assets/css/headfirst.css`:** adicionar um bloco de estilo de tabela genérico `.hf .rubrica` (o existente é escopado em `.sidebar`):
  ```css
  .hf .rubrica { border-collapse: collapse; margin: 12px 0; width: 100%; }
  .hf .rubrica th, .hf .rubrica td { border: 1px solid #bbb; padding: 6px 10px; text-align: left; font-size: 15px; vertical-align: top; }
  .hf .rubrica th { background: #e7e0ff; }
  ```

## 5. Nomes reais dos arquivos de módulo (para os links da tabela)
`00-comecando` · `01-shaders-e-gpu` · `02-pixel-e-cor` · `03-matematica-vira-imagem` · `04-formas-e-padroes` · `05-dando-vida-animacao` · `06-paralelismo` · `07-vertices-e-pipeline` · `08-vetores-e-coordenadas` · `09-texturas-e-uv` · `10-normais-e-luz` · `11-hardware-fixo` · `12-luz-especular` · `13-alem-de-pixels` · `14-otimizacao` · `15-placa-de-video` · `16-transparencia`. (Guias: `NN-guia.md`, todos existem.)

## 6. Testes e verificação
- **`test/professor-kit.integration.test.js`** (node):
  - `site/professor/index.html` existe; tem breadcrumb "Kit do Professor"; tem `<h2>` de "Como rodar o curso", "guias", "rubricas".
  - linka os 17 guias: para `n` de 00 a 16, o HTML contém `${n}-guia.md`.
  - linka os 17 módulos do aluno: contém `../modulos/00-comecando.html` … `../modulos/16-transparencia.html` (checar os nomes reais da §5).
  - consolida as 3 rubricas: contém "Meu Padrão Animado", "Objeto Texturizado e Iluminado" e "Efeito Autoral"; linka os 3 guias de projeto (`05-guia.md`, `10-guia.md`, `12-guia.md`) na seção de avaliação; menciona o esquema "0–5".
  - `site/index.html` linka `professor/index.html`.
- **Sem shader** → `npm run smoke` deve seguir **17 verde** (não regrediu; a página do professor não é varrida).
- **Sem gate Chrome** (HTML estático, sem WebGL). Verificação leve: abrir a página é opcional; a estrutura é coberta pelo teste node. (Se quiser conferir o render, `npm run serve` → http://localhost:8000/professor/index.html.)
- Baseline de testes node: **144** → +1 arquivo (`professor-kit.integration.test.js`).

## 7. Arquivos
**Criar:** `site/professor/index.html`, `test/professor-kit.integration.test.js`.
**Modificar:** `site/index.html` (rodapé "Para professores"), `site/assets/css/headfirst.css` (estilo `.rubrica`).

## 8. Riscos / pontos de atenção
- **Links `.md` locais:** servidos por `python http.server` abrem como texto cru (não renderizam Markdown). É aceitável (o professor lê o texto, ou abre no GitHub/editor). A landing avisa que os guias são arquivos de texto/Markdown.
- **Não inventar esquema novo (lição da auditoria):** as rubricas existentes são 0–5 pontos. A landing reusa esse esquema e linka pros guias (fonte única) — não cria um 2º esquema (3 níveis), que confundiria. O enquadramento "sugerida/formativa, incentive originalidade" já está nos guias e é repetido na landing.
- **Single source das rubricas:** os 5 bullets de 1pt continuam só nos guias; a landing resume a forma comum + especificidade por projeto e linka. Editar a rubrica = editar o guia (um lugar).
- **Nomes de arquivo:** os links da tabela dependem dos nomes exatos da §5 — conferir contra `site/modulos/` ao implementar (o teste cobre isso).
