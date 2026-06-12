# Kit do Professor — Design

**Data:** 2026-06-12. **Pré-requisito:** os 16 guias `site/professor/NN-guia.md` (já existem). **Item #9 do backlog (kit professor).**
**Origem:** backlog "melhorar o curso", em ordem numérica (#1/#2 dependem do usuário; #6/#8 feitos; **#9 é o último item acionável sem aluno/hardware real**). Os 16 guias do professor já existem (objetivos/roteiro/tropeços/gabarito por módulo), **mas são órfãos**: não há índice, não estão linkados do site, e não há rubricas de avaliação dos Projetos-Vitória.

## 1. Escopo e objetivo

Criar a porta de entrada do material do professor e fechar o gap de avaliação. **Decisão travada (via brainstorming): versão enxuta.**

Entregar **uma página HTML** (`site/professor/index.html`, estilo Head First do site) que:
1. Explica **como rodar o curso** (modelo híbrido, estrutura de marcos, tempo, método).
2. **Indexa os 16 guias** existentes (link pro guia + link pro módulo do aluno).
3. Traz **rubricas de avaliação** dos 3 Projetos-Vitória (M5/M10/M12), formativas.

E **linka essa página do `site/index.html`** (rodapé "Para professores").

**Escopo cortado (YAGNI):** sem slides (o "roteiro sugerido" de cada guia já cobre); sem folhas-do-aluno por módulo (os módulos já são folhas interativas — duplicaria); **sem converter os 16 guias `.md` em HTML** (a landing os linka; o GitHub os renderiza, e localmente abrem como texto). Sem nota numérica dura — avaliação formativa (ensino médio, projeto aberto).

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

4. **`<h2>Avaliação: rubricas dos Projetos-Vitória</h2>`** + enquadramento: **avaliação formativa, não prova**. O objetivo é o aluno fazer escolhas e conseguir explicá-las; não há resposta única (projeto aberto). Três tabelas `class="rubrica"`, uma por projeto, cada uma com 4 critérios × 3 níveis (**Em desenvolvimento · Satisfatório · Excelente**):

   **Critérios (comuns aos 3, com o miolo adaptado por projeto):**
   - **Funciona** — compila e mostra algo na tela (sem ⚠ ERROR).
   - **Técnicas do marco** — usou os ingredientes esperados (ver por projeto).
   - **Autoria & capricho** — fez escolhas próprias (cores, valores, composição) além de copiar a solução.
   - **Compreensão** — consegue explicar, em conversa, o que cada parte do shader faz.

   **Miolo de "Técnicas do marco" por projeto:**
   - **M5 "Meu Padrão Animado":** dos 4 ingredientes do Marco 1 (cor, função, forma, tempo) — Em desenvolvimento = 1–2; Satisfatório = 3 (a meta do módulo); Excelente = os 4 combinados com intenção.
   - **M10 "Objeto Texturizado e Iluminado":** dos ingredientes do Marco 2 (textura, luz, cor autoral; forma vem de graça) — Em desenvolvimento = 1; Satisfatório = 2 (a meta); Excelente = os 3 bem integrados.
   - **M12 "Efeito Autoral":** ingredientes do Marco 3 incluindo o **especular** — Em desenvolvimento = só difusa/cor; Satisfatório = especular + ≥1 outro (≥3 no total, a meta); Excelente = especular + textura + luz com ajuste fino de dureza/cor.

   Linhas "Funciona / Autoria / Compreensão" usam descritores genéricos (ex. Compreensão: *Em desenvolvimento* = precisa de ajuda pra ler o código; *Satisfatório* = explica as linhas que editou; *Excelente* = explica o shader todo e o porquê das escolhas).

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
  - tem as 3 rubricas: contém "Meu Padrão Animado", "Objeto Texturizado e Iluminado" (ou "Efeito"/título do M10) e "Efeito Autoral"; contém os 3 níveis "Em desenvolvimento", "Satisfatório", "Excelente".
  - `site/index.html` linka `professor/index.html`.
- **Sem shader** → `npm run smoke` deve seguir **17 verde** (não regrediu; a página do professor não é varrida).
- **Sem gate Chrome** (HTML estático, sem WebGL). Verificação leve: abrir a página é opcional; a estrutura é coberta pelo teste node. (Se quiser conferir o render, `npm run serve` → http://localhost:8000/professor/index.html.)
- Baseline de testes node: **144** → +1 arquivo (`professor-kit.integration.test.js`).

## 7. Arquivos
**Criar:** `site/professor/index.html`, `test/professor-kit.integration.test.js`.
**Modificar:** `site/index.html` (rodapé "Para professores"), `site/assets/css/headfirst.css` (estilo `.rubrica`).

## 8. Riscos / pontos de atenção
- **Links `.md` locais:** servidos por `python http.server` abrem como texto cru (não renderizam Markdown). É aceitável (o professor lê o texto, ou abre no GitHub/editor). A landing avisa que os guias são arquivos de texto/Markdown.
- **Rubrica não vira nota dura:** enquadrar como formativa evita resistência pedagógica e bate com o tom do curso (projeto aberto, sem resposta única). Os níveis descrevem evidências observáveis, não pontos.
- **Nomes de arquivo:** os links da tabela dependem dos nomes exatos da §5 — conferir contra `site/modulos/` ao implementar (o teste cobre isso).
