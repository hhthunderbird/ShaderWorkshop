# Glossário + Placeholders de Imagem (M1/M6) — Design

**Data:** 2026-06-11. **Item #10 do backlog.**
**Origem:** auditoria — falta uma página de referência de termos (apoio ao aluno zero-programação, complementa o M0); e sobram 2 placeholders `[IMAGEM:]` (M1 placa de vídeo, M6 die de GPU) que dependiam de fotos reais.

## 1. Escopo e objetivo
Dois entregáveis independentes, um spec:
1. **Glossário** (`site/glossario.html`): dicionário de consulta dos termos do curso, alfabético, cada termo com definição curta + link pro módulo que ensina.
2. **Fechar os 2 placeholders** trocando-os por **SVG ilustrativo** (não foto) — remove as caixas `[IMAGEM:]`, fica 100% offline e ownable.

Estilo Head First PT-BR. Zero motor, zero shader.

## 2. Glossário (`site/glossario.html`, página top-level nova)
- `<head>` padrão (só `headfirst.css`; sem playground.css/js — não há playground). `<body class="hf">`.
- Breadcrumb: `<p><a href="index.html">← Mapa do curso</a> · 📖 Glossário</p>`.
- `<h1>Glossário</h1>` + 1 frase ("Bateu dúvida num termo? Procure aqui — e clique pra voltar ao módulo que ensina.").
- Um `<dl>` **alfabético** com ~35–40 termos. Cada entrada: `<dt>termo</dt><dd>definição curta + <a href="modulos/NN-...html">📚 Módulo N</a></dd>`.
- Termos (cobertura mínima; o teste afere um subconjunto): shader, GPU, CPU, pixel, fragment, vértice, coordenada/UV, RGB, vec2/vec3/vec4, float, uniform, varying, função, step, smoothstep, sin/cos, fract, mix, u_time, length, normalizar, dot (produto escalar), normal, luz difusa, especular (brilho), half-vector, MVP, malha (mesh), textura / texture2D, pipeline, rasterização, TMU, ROP, Z-buffer, paralelismo, warp, compute, VRAM, banda, FPS, framebuffer, ray tracing, GLSL/HLSL.
- Cada termo linka pro módulo que o introduz (mapa: shader/GPU/CPU/RGB/pixel→M1; UV/vec/coordenada→M2; funções→M3; length/formas→M4; uniform/u_time→M5; paralelismo→M6; vértice/malha/MVP/pipeline→M7; dot/normalizar/vetor→M8; textura/texture2D→M9; normal/luz difusa→M10; rasterização/TMU/ROP/Z-buffer→M11; especular/half-vector→M12; compute→M13; warp→M14; VRAM/banda/FPS/framebuffer/ray tracing→M15; GLSL/HLSL→M1 sidebar). Termos sem módulo único (ex.: varying) linkam ao mais próximo (M2/M7) ou ficam sem link.
- Linkado do **index** (linha "📖 Glossário" perto do topo, após o link do M0) e do **M0** (na seção de botões/qa, "consultar o 📖 Glossário a qualquer hora").
- **NÃO** vai em `site/modulos/` — fica em `site/` (top-level, como index). Links pros módulos usam `modulos/NN-...html`.

## 3. Placeholders → SVG
- **M1** (`site/modulos/01-shaders-e-gpu.html`): localizar a `<figure>` com `<div class="img-todo">[IMAGEM: ... placa de vídeo ...]</div>` e trocar por `<img src="../assets/img/gpu-board.svg" alt="...">` + figcaption. Criar `site/assets/img/gpu-board.svg` (ilustração de uma placa de vídeo: PCB + cooler/ventoinha + saídas de vídeo). Ilustrativo, não foto.
- **M6** (`site/modulos/06-paralelismo.html`): trocar a `<figure>`/`<div class="img-todo">[IMAGEM: ... die ...]` por `<img src="../assets/img/gpu-die.svg" alt="...">` + figcaption. Criar `site/assets/img/gpu-die.svg` (um "die" de chip com grade de muitos núcleos pequenos — reforça "milhares de núcleos" do paralelismo).
- Se houver outros `[IMAGEM:]` remanescentes em M1/M6, este pass NÃO os obriga (só os dois citados); mas se forem os mesmos, ficam resolvidos.

## 4. Testes
- `test/glossario.integration.test.js`: `site/glossario.html` existe; contém um subconjunto de termos-chave (ex.: `shader`, `dot`, `VRAM`, `especular`, `uniform`, `rasterização`); contém pelo menos N links `modulos/` (ex.: ≥10); breadcrumb "Glossário"; `index.html` linka `glossario.html`; `00-comecando.html` linka `glossario.html` (com `../glossario.html`).
- Placeholders: nos testes de integração do M1 e M6 (ou criar asserts), afirmar que o HTML referencia `gpu-board.svg` (M1) / `gpu-die.svg` (M6) e **não** contém mais `[IMAGEM:` (o die/placa). (Ler os testes existentes primeiro; se algum assert exigia `[IMAGEM:`, atualizar — como foi feito no M11/zbuffer.)
- `npm run smoke`: inalterado (glossário não está em `modulos/`; SVGs não afetam compilação). Segue 16 módulos verde.
- Chrome: glossário renderiza, links abrem o módulo certo; M1 mostra `gpu-board.svg`, M6 mostra `gpu-die.svg`, sem caixas `[IMAGEM:]`.

## 5. Fora de escopo
- Busca/filtro no glossário (é curto; Ctrl+F do navegador basta). YAGNI.
- Linkar o glossário no breadcrumb de todos os 16 módulos (decidido: só index + M0).
- Fotos reais de GPU (substituídas por SVG ilustrativo).
- Glossário interativo / tooltips inline nos módulos.

## 6. Riscos
- **Link de termo pro módulo errado:** revisar o mapa termo→módulo (§2) no build; baixo risco.
- **Assert de placeholder quebrando teste existente:** ler os testes do M1/M6 antes; atualizar asserts obsoletos (padrão já usado no M11).
- **SVG ilustrativo "cafona":** manter simples e esquemático (como os outros SVGs do curso), não realista.

## 7. Git
Direto em `main`. 1–2 commits (glossário; placeholders). Conventional Commits.
