# Módulo 15 (Bônus) — "Decifrando a Placa de Vídeo" — Design

**Data:** 2026-06-11. **Pré-requisito:** curso 14/14 completo (idealmente até M14). **Tipo:** BÔNUS pós-curso.
**Origem:** lacuna levantada pelo usuário — o curso ensina arquitetura de GPU em pedaços (M1, M6, M11, M13, M14) mas nunca amarra isso a uma **placa de vídeo real** nem fecha o elo **shader × GPU × jogo**; e **memória/VRAM** nunca foi coberta.

## 1. Escopo e objetivo

Um módulo de **síntese**: pega tudo que o aluno construiu (M1–M14) e usa pra **decifrar a ficha técnica de uma placa de vídeo de jogos** — o produto que o aluno mais quer no setup gamer e que parece grego. Fecha dois buracos:
1. **O elo shader×GPU×jogo:** um jogo é uma pilha de shaders rodando na GPU toda frame; a ficha técnica diz quanto músculo a GPU tem pra isso.
2. **Memória/VRAM:** conceito nunca coberto (onde texturas e framebuffer moram; banda como gargalo). A analogia "armazém" das fontes Gemini, que nunca virou módulo.

Mantém: Head First PT-BR, ensino médio, zero programação, web vanilla. **CONCEITUAL** (como M11/M13/M14): sem pixel-diff, sem shader novo.

## 2. Posição na estrutura (decidido)

- **BÔNUS, NÃO conta nos 14.** Espelha a decisão do M0 (pré-curso): M15 é pós-curso. O marco "Curso completo — 14/14" continua válido e intocado.
- Breadcrumb: **"Bônus · Módulo Extra"** (NÃO "de 14"/"de 15").
- `index.html`: nova seção **"🎁 Bônus"** DEPOIS do banner "🎉 Curso completo — 14/14".
- Arquivo: `site/modulos/15-placa-de-video.html` (numeração de arquivo só pra ordenar; o texto trata como bônus).

## 3. Motor e demo

- **ZERO mudança de motor. Nenhum shader novo.** A interatividade é a **ficha técnica anotada**, feita em HTML puro.
- **Ficha técnica interativa:** cada linha de spec é um `<details class="spec">` — `<summary>` mostra a spec (ex.: "3072 CUDA cores"), o conteúdo expande pra "o que é + 📚 você viu isso no Mx" com link `<a href="0X-...html">` pro módulo. Zero JS, acessível, offline.
- O smoke test (`npm run smoke`) carrega a página sem playgrounds e reporta "0 playground(s) ok" — sem problema.

## 4. Conteúdo módulo-a-módulo (seções, em ordem)

Formato Head First. Dispositivos implícitos.

1. **Abertura (gancho gamer):** "Você já viu a ficha de uma placa: *'3072 CUDA cores, 8 GB GDDR6, 272 GB/s, RT cores, Tensor cores'*. Parece grego. Mas cada uma dessas linhas é uma coisa que **você já estudou** neste curso. Bora decifrar."
2. **O elo shader × GPU × jogo:** um jogo desenha milhões de pixels 60×/s (M1) chamando **shaders** (M1–M12) que rodam na GPU **toda frame**. A ficha técnica é a resposta pra "quanto músculo essa GPU tem pra rodar esses shaders rápido?". SVG do loop (jogo → shaders → GPU → frame na tela → repete).
3. **Memória / VRAM (conceito novo):** as texturas (M9) e o quadro que está sendo desenhado (framebuffer) precisam morar em algum lugar: a **VRAM** (memória da placa). Analogia **armazém**: quanto maior a resolução e as texturas, mais espaço (GB) ocupam. A **banda (GB/s)** é a velocidade da esteira que leva esses dados pros núcleos — gargalo comum (de nada adianta força se os dados não chegam a tempo). SVG: armazém (VRAM) + esteira (banda) alimentando o exército de núcleos (M6).
4. **A ficha técnica interativa anotada (o coração):** lista de `<details class="spec">`, cada um spec → explicação + link pro módulo:
   - **CUDA cores / Stream processors** → os milhares de "soldados" (M6) que rodam cópias do teu shader em paralelo. Mais núcleos = mais pixels/cálculos ao mesmo tempo. (→ M6)
   - **Clock (GHz / boost)** → a velocidade de cada núcleo (quantas continhas por segundo). (→ M6/M14)
   - **TMUs (Texture Mapping Units)** → circuitos dedicados a buscar texels (o `texture2D` do M9). (→ M9, M11)
   - **ROPs (Render Output Units)** → escrevem o pixel final na tela: teste de profundidade (Z-buffer) + mistura. (→ M11)
   - **VRAM (ex.: 8 GB GDDR6)** → o armazém onde texturas + framebuffer moram. (→ §3 deste módulo, M9)
   - **Banda de memória (ex.: 272 GB/s)** → a velocidade da esteira que move dados da VRAM pros núcleos. (→ §3)
   - **RT cores** → hardware dedicado a *ray tracing*: simular o caminho da luz pra reflexos/sombras realistas — uma evolução da luz que você fez à mão (M10/M12). (→ M10/M12)
   - **Tensor cores** → hardware pra contas de IA (multiplicação de matrizes em massa); em jogos, usados pra *upscaling* (ex.: DLSS) — é a GPU como calculadora paralela (M13). (→ M13)
   - **TDP (Watts)** → quanta energia vira calor; por isso a placa tem cooler/ventoinhas. (→ leve, sem módulo)
5. **FPS — onde tudo se junta:** todos esses números servem a uma coisa que o gamer sente: **quadros por segundo**. Mais músculo (núcleos + banda + clock) = mais FPS, **ou** a mesma fluidez numa resolução maior. Reativa os "60×/s" do M1.
6. **Dispositivos:**
   - `brain` — recall do M6: "lembra que a GPU roda milhares de cópias do MESMO shader? esse número tem nome na ficha. Qual você acha que é?"
   - `qa` — "Mais VRAM = mais FPS? (Não necessariamente — VRAM é espaço; se sobra espaço, mais não ajuda. O que vira FPS são núcleos+banda+clock. VRAM importa pra não FALTAR em resoluções/texturas altas.)"; "Por que duas marcas usam nomes diferentes (CUDA core × Stream processor)? (Mesma ideia — núcleo paralelo — sotaques de fabricante, igual GLSL×HLSL do curso.)"; "RT/Tensor cores fazem o jogo inteiro? (Não — são especialistas; o grosso ainda são os shaders nos núcleos comuns.)"
   - `cuidado` — "Não escolha uma placa por UM número só (ex.: só 'GB de VRAM'). É o conjunto — e depende do jogo e da resolução que você quer."
   - `recordacao` — caça-ao-par: CUDA core→soldado/thread (M6); TMU→buscar textura (M9); ROP→pixel final (M11); VRAM→armazém de texturas; RT core→ray tracing; Tensor core→IA/upscaling (M13).
7. **Fechamento:** "Você não só faz shaders — agora entende a máquina que os roda, e consegue ler a ficha de qualquer placa. Da próxima vez que vir uma RTX/RX numa loja, você sabe o que cada linha quer dizer."

## 5. Imagens
- SVG 1: o loop **jogo → shaders → GPU → frame → repete** (com "60×/s" marcado).
- SVG 2: **VRAM (armazém) + banda (esteira) → núcleos (exército M6)**.
- (Opcional) a própria ficha anotada já é o "diagrama" interativo; não precisa de SVG dela.

## 6. Testes
- `test/module15.integration.test.js`: a página existe; contém os termos-chave da ficha (`CUDA`, `TMU`, `ROP`, `VRAM`, `Tensor`, `RT`); tem `<details class="spec">` (ficha interativa); tem seção de memória/VRAM; linka de volta pra módulos (ex.: `06-paralelismo.html`, `09-texturas-e-uv.html`, `11-hardware-fixo.html`, `13-alem-de-pixels.html`); **não** tem `reference:` (conceitual); tem dispositivos Head First (`brain`, `qa`, `cuidado`, `recordacao`); breadcrumb "Bônus" (não "de 15"). `index.html` linka `15-placa-de-video.html` numa seção Bônus após o "14/14".
- `npm run smoke` deve continuar verde (M15 sem playground → "0 playground(s) ok").

## 7. Gate de exatidão técnica (§7, como M13/M14)
M15 faz **muitas afirmações de hardware** não verificáveis no navegador. ANTES do commit, rodar passe de revisão de **verdade** (advisor/subagente técnico) cobrindo: CUDA core × Stream processor (núcleo paralelo, ok); TMU/ROP (funções corretas); VRAM × banda (espaço × velocidade — não confundir); RT cores (ray tracing) e Tensor cores (matrizes/IA, DLSS) corretamente atribuídos; a nuance "mais VRAM ≠ mais FPS" correta; nada contradiz M6/M11/M13. É o gate real do módulo.

## 8. Fora de escopo
- Comparar/recomendar modelos específicos (envelhece, vira propaganda) — ficha é exemplo representativo genérico com termos reais.
- Benchmark / overclock / preços.
- Detalhe de microarquitetura além do nível "o que a linha da ficha significa".
- Ray tracing / DLSS de verdade (só menção conceitual).
- Mudança de motor / shader novo.

## 9. Build
Fatia única (módulo conceitual). HTML + guia do professor + 2 SVGs + teste de integração + **gate de exatidão §7** + commit. Direto em `main`. Subagent-driven.

## 10. Riscos
- **Afirmações de hardware erradas/datadas:** gate §7 (o gate real). Usar exemplo genérico (não datar em modelo).
- **Virar catálogo/propaganda:** §8 — exemplo representativo, foco em decifrar conceito, não recomendar compra.
- **Sobrecarga de termos novos (TMU/ROP/RT/Tensor de uma vez):** mitigado — cada um ancora num módulo já feito (o `<details>` mostra "você viu no Mx"); a ficha interativa deixa o aluno abrir um por vez no próprio ritmo.
