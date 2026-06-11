# Guia do Professor — Módulo 9: Texturas & UV

**Tempo estimado:** 1 aula. **Pré-requisito:** M7 (mesh) e M8. Reusa `fract` do M3 e a ideia de UV do M2.

## Objetivos de aprendizagem
- Entender textura como imagem consultada por `texture2D(u_tex, uv)`.
- Entender UV como endereço 0..1 na imagem/superfície (e que mudou de sentido desde o M2).
- Usar `fract(uv*N)` pra ladrilhar (repetir) a textura.

## Roteiro sugerido
1. (10 min) Textura = imagem; `texture2D(imagem, uv)`. SVG do molde UV. **Frise a virada de sentido
   do UV** (M2 = tela; M9 = superfície) — Brain Power + Cuidado.
2. (10 min) Demo 2D (pg-tex): amostrar a imagem; depois trocar `v_uv` por `fract(v_uv*3.0)` e ver
   ladrilhar. Use o "Afie o lápis" (prever quantos ladrilhos ANTES).
3. (10 min) Demo 3D (pg-cubo-tex): cubo vestido. Conferir orientação pela barra branca/pontinho preto.
4. (10 min) Exercício (pg-ex): repetir o gradiente 3× com `fract`. (Procedural, mesma ideia do ladrilho.)
5. (5 min) Caça ao par + Pontos-chave.

## Pontos de tropeço comuns
- **UV "é a tela" (carryover errado do M2):** aqui é o endereço na imagem/superfície. Tropeço nº1.
- **Textura de cabeça pra baixo:** o "0,0" da imagem vs o "0,0" da UV. O motor já vira (FLIP_Y); use a
  barra branca do topo pra checar.
- **Esquecer `fract` ao ladrilhar:** sem `fract`, `uv*3` sai de 0..1 e a imagem estica/clampa em vez
  de repetir.

## Gabarito
- Afie o lápis: 3 (horizontal) × 3 (vertical) = 9 ladrilhos com `fract(v_uv*3.0)`.
- Demo: `texture2D(u_tex, fract(v_uv * 3.0))`.
- Exercício: `vec3 c = vec3(fract(v_uv.x * 3.0));`
- Caça ao par: textura→B, UV→A, texture2D→D, fract(uv*N)→C.

## Avaliação sugerida
Peça o cubo vestido com a textura repetida (escolhendo o N) e um print, explicando o que o N faz.
Rubrica: usou texture2D com UV (1pt), ladrilhou com fract (1pt), explicou o N (1pt).
