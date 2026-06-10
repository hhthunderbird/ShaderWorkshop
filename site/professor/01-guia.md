# Guia do Professor — Módulo 1: Shaders & a GPU

**Tempo estimado:** 1 aula (45–50 min).

## Objetivos de aprendizagem
- Definir shader e o papel da GPU (paralelismo) em linguagem simples.
- Entender cor como (R,G,B) em [0,1].
- Fazer a primeira alteração de shader (cor) com sucesso.

## Roteiro sugerido
1. (5 min) Gancho: pergunte "como um jogo desenha 2 milhões de pixels 60×/seg?". Colha palpites.
2. (10 min) CPU × GPU com o diagrama. Use a analogia da linha de montagem.
3. (15 min) Test Drive coletivo: todos mexem no seletor de cor. Puxe o "Afie o lápis" do vermelho.
4. (10 min) Exercício meio-a-meio. Deixe tentarem antes de revelar `step`.
5. (5 min) Bullet points + caça ao par como saída.

## Pontos de tropeço comuns
- **0–1 vs 0–255:** o erro nº1. Reforce "pense em porcentagem".
- **Pixel vs coordenada:** alguns acham que `v_uv` é "o pixel". É a posição normalizada.
- **"Onde isso roda":** reforce que é a GPU real deles, no navegador.

## Gabarito
- Afie o lápis (vermelho): R=1, G=0, B=0.
- Caça ao par: Shader→B, GPU→A, RGB→C.
- Exercício meio-a-meio: `step(0.5, v_uv.x)` + `mix(vermelho, azul, m)`.

## Avaliação sugerida
Peça uma cor autoral nomeada (ex.: "meu roxo favorito") com os 3 valores e um print do canvas.
Rubrica: usou [0,1] corretamente (1pt), cor confere com os números (1pt), print anexado (1pt).
