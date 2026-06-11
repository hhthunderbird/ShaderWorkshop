# Guia do Professor — Módulo 4: Formas e Padrões

**Tempo estimado:** 1–2 aulas. **Pré-requisito:** Módulos 1–3 (usa `smoothstep` do M3).

## Objetivos de aprendizagem
- Entender "distância vira forma": círculo = pixels com `length(uv − centro) < raio`.
- Reconhecer `length` como o teorema de Pitágoras embutido.
- Combinar formas: união = `max`, interseção = `min` (noção simples de SDF).

## Roteiro sugerido
1. (5 min) Gancho: "como desenhar uma bolinha em vez de um degradê?". Puxe a ideia de distância.
2. (10 min) SVG do círculo: aponte centro, raio e a distância de um pixel. Conecte com Pitágoras
   (Brain Power).
3. (15 min) Playground do círculo (`pg-circ`): turma mexe nos sliders. Use o "Afie o lápis" do canto
   inferior esquerdo (reforça que Y=0 é embaixo).
4. (10 min) **Ímãs de código** — atividade no papel/quadro: a turma reordena as 4 linhas do shader
   do círculo. Ótimo pra fixar a ordem "declara antes de usar".
5. (15 min) União × interseção com o diagrama; depois o exercício dos dois círculos (`pg-ex`).
   Deixe tentarem `max` antes de revelar.
6. (5 min) Bullet points + caça ao par.

## Pontos de tropeço comuns
- **Y invertido:** mover o centro pra baixo exige `centro Y` pequeno. Recorrente desde o M2.
- **Sentido do `smoothstep`:** `smoothstep(raio, raio − 0.015, d)` dá 1 dentro e 0 fora (note a
  ordem invertida das bordas). Se inverter, a forma "vira do avesso" e `max`/`min` trocam de papel.
- **`max` vs `min`:** confundir qual é união. Ancore na máscara 0/1 (ver Q&A do aluno).
- **Esquecer que a máscara é 0/1:** se alguém somar as duas (`c1 + c2`), a sobreposição estoura
  acima de 1 (satura). União é `max`, não soma.

## Gabarito
- Ímãs de código (ordem correta):
  1. `void main() {`
  2. `float d = length(v_uv - vec2(0.5, 0.5));`
  3. `float shape = smoothstep(0.25, 0.24, d);`
  4. `gl_FragColor = vec4(vec3(shape), 1.0);`  (e fecha a chave `}`)
- Afie o lápis: canto inferior esquerdo → centro X baixo (~0.15), centro Y baixo (~0.15).
- Caça ao par: `length`→B, `max`→C, `min`→A, raio→D.
- Exercício: `float shape = max(c1, c2);`

## Avaliação sugerida
Peça uma composição autoral com pelo menos duas formas combinadas (união e/ou interseção) e um print.
Rubrica: usou `length` pra uma forma (1pt), combinou com `min`/`max` corretamente (1pt), explicou em
uma frase a diferença união × interseção (1pt).
Desafio extra: faça a INTERSEÇÃO dos dois círculos (troque `max` por `min`) e descreva a "lente".
