# Guia do Professor — Módulo 11: Por Baixo do Capô II (Hardware Fixo)

**Tempo estimado:** 1 aula. **Conceitual** (sem exercício/pixel-diff). **FECHA o Marco 2** (curso médio).
**Pré-requisito:** M7–M10.

## Objetivos de aprendizagem
- Distinguir partes programáveis do pipeline (vertex, fragment) das partes fixas (hardware).
- Entender rasterização (triângulo → fragmentos), TMU (busca de texel) e Z-buffer (profundidade).
- Fechar o Marco 2 amarrando os módulos.

## Roteiro sugerido
1. (5 min) Retome o pipeline do M7; agora marque programável (verde) × fixo (cinza) no SVG.
2. (10 min) Rasterização com o playground (pg-raster): o triângulo passeia e a GPU descobre, por
   pixel, quem está dentro. Cada quadradinho = um fragmento.
3. (8 min) TMU: ligue ao `texture2D` do M9 (buscar texel é circuito dedicado).
4. (8 min) Z-buffer: ligue ao cubo do M7 (faces de trás não aparecem na frente).
5. (5 min) Caça ao par + Pontos-chave.
6. (5 min) **Fechamento do Marco 2** — recapitule M7→M11 e celebre o Projeto-Vitória 2.

## Pontos de tropeço comuns
- **"Fixo = sem importância":** fixo = não-reprogramável, mas faz muito trabalho.
- **Achar que rasterização é shader:** não — é a estação fixa ENTRE vertex e fragment.
- **Termos novos demais:** TMU/ROP/Z-buffer. Mantenha leve; ancore cada um no que já fizeram (M7/M9).

## Gabarito
- Caça ao par: rasterização→C, TMU→A, Z-buffer→B, shader→D.

## Avaliação sugerida
Peça um parágrafo (3–5 frases) explicando, com as próprias palavras, por que parte do pipeline é
hardware fixo e parte é programável — citando rasterização e Z-buffer. Rubrica: distingue
programável×fixo (1pt), exemplifica com rasterização ou Z-buffer (1pt), liga à velocidade/repetição (1pt).

## Fechamento do Marco 2
Mensagem-chave: "vocês construíram um objeto 3D texturizado e iluminado, do zero, e entendem o
caminho dele do vértice ao pixel — incluindo as partes que o hardware faz sozinho." O curso médio
está completo; Marco 3 é opcional.
