# Guia do Professor — Módulo 2: O Pixel e a Cor

**Tempo estimado:** 1 aula (45–50 min). **Pré-requisito:** Módulo 1.

## Objetivos de aprendizagem
- Entender que cada fragmento conhece sua posição (`v_uv`), em coordenadas normalizadas [0,1].
- Distinguir pixel (físico, inteiro) de coordenada normalizada (0 a 1).
- Pintar cor em função da posição → construir um gradiente.
- Usar `mix(a, b, t)` para interpolar entre duas cores.

## Roteiro sugerido
1. (5 min) Gancho: retome o M1 ("a tela toda de uma cor só") e pergunte: "e se cada pixel
   escolhesse a própria cor?". Use a analogia do **mapa de assentos do cinema**.
2. (10 min) Apresente `v_uv` com o SVG da grade. Faça-os apontar onde está (0,0), (1,1), (0.5,0.5).
3. (10 min) Test Drive coletivo do `pg-grad`. Peça previsões ANTES (Afie o lápis) e só depois rodem.
4. (15 min) Exercício do gradiente vermelho→azul (`pg-ex`). Deixe tentarem antes de revelar `mix`.
5. (5 min) Bullet points + caça ao par como saída.

## Pontos de tropeço comuns
- **Pixel × coordenada normalizada:** o erro nº1 deste módulo. Se o aluno fala em "320" ou "845",
  está pensando em pixel; o curso quer o número de 0 a 1. Reforce com a caixa "Cuidado!".
- **Eixo Y invertido:** no `v_uv`, y=0 é EMBAIXO (não em cima, como em muitos editores). O gradiente
  verde sobe — use isso pra deixar explícito.
- **Trocar a ordem do `mix`:** `mix(azul, vermelho, v_uv.x)` dá o gradiente invertido (azul→vermelho).
  É um "quase" no Conferir — ótimo momento pra discutir o sentido de `t`.
- **Confundir `mix` com soma:** `mix` não soma cores; ele faz uma média ponderada por `t`.

## Gabarito
- Afie o lápis: `vec3(v_uv.x, 0.0, 0.0)` → gradiente preto→vermelho (esq→dir), sem verde/azul.
  `vec3(v_uv.y, v_uv.y, v_uv.y)` → gradiente preto (baixo)→branco (cima), em tons de cinza.
- Caça ao par: `v_uv.x`→B, normalizar→C, `mix`→A, gradiente→D.
- Exercício: `vec3 c = mix(vec3(1.0,0.0,0.0), vec3(0.0,0.0,1.0), v_uv.x);`

## Avaliação sugerida
Peça um gradiente autoral entre duas cores escolhidas pelo aluno, com um print do canvas.
Rubrica: usou `v_uv` para variar a cor (1pt), usou `mix` corretamente (1pt), print anexado (1pt).
Desafio extra: gradiente na DIAGONAL (dica: combine `v_uv.x` e `v_uv.y`).
