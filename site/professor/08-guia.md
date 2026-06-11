# Guia do Professor — Módulo 8: Vetores & Coordenadas

**Tempo estimado:** 1–2 aulas. **Módulo-ponte de matemática** — reservar tempo; o `dot` daqui é a
base da luz (M10). **Pré-requisito:** M7 (e `length` do M4).

## Objetivos de aprendizagem
- Distinguir ponto (lugar) de vetor (seta: direção + tamanho).
- Entender `normalize` (tamanho 1) e o que o `dot` significa (alinhamento: 1 / 0 / −1).
- Conectar `dot` à futura luz (M10) — sem ainda calcular luz.

## Roteiro sugerido
1. (10 min) Ponto × vetor. Mostre que `v_uv - 0.5` já era um vetor (recupera M4). Brain Power.
2. (10 min) `normalize` (só a direção). `dot` com o SVG dos três casos (1 / 0 / −1) + analogia das
   lanternas.
3. (15 min) Playground do holofote (pg-dot): girar o slider, ler claro/escuro como dot alto/baixo.
   Use o "Afie o lápis" (prever ANTES de girar).
4. (10 min) Exercício (pg-ex): apontar o holofote pra direita com `dot(dir, vec2(1,0))`.
5. (5 min) Caça ao par + Pontos-chave. Feche prometendo: "no M10 isso vira luz".

## Pontos de tropeço comuns
- **Confundir vetor com ponto:** vetor é seta (pra onde + quanto), ponto é lugar.
- **Esquecer de normalizar:** sem `normalize`, o `dot` cresce com o tamanho das setas e perde o
  sentido de "alinhamento".
- **`dot` é número, não vetor:** e pode ser negativo (vira preto aqui).
- **Querer "a fórmula":** o importante é o SIGNIFICADO (1/0/−1), não decorar `a.x*b.x+a.y*b.y`.

## Gabarito
- Afie o lápis: slider pra direita → metade DIREITA branca; centro do lobo = onde a direção do pixel
  aponta igual ao slider (dot = 1).
- Exercício: `float g = dot(dir, vec2(1.0, 0.0)) * 0.5 + 0.5;`
- Caça ao par: vetor→B, normalize→C, dot→A, coordenada→D.

## Avaliação sugerida
Peça pro aluno prever, no holofote, onde fica claro/escuro para 3 ângulos do slider e conferir.
Rubrica: acerta o lado claro (1pt), explica com "alinhamento/dot" (1pt), liga ao que será a luz (1pt).
