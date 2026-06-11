# Guia do Professor — Módulo 12: Luz Especular & Brilho

**Tempo estimado:** 1 aula + tempo de projeto. **Pré-requisito:** M8 (dot/vetores), M10 (luz difusa), M11 (pipeline).
**Abre o Marco 3** com o primeiro efeito de iluminação especular do curso (Projeto-Vitória 3).

## Objetivos de aprendizagem
- Entender que o brilho especular depende do ângulo de visão (vetor V), diferente da difusa.
- Calcular o vetor V: `normalize(u_cameraPos - v_worldPos)`.
- Calcular o half-vector H: `normalize(L + V)`.
- Montar a receita Blinn-Phong: `pow(max(dot(N, H), 0.0), dureza)`.
- Entender o papel do expoente `dureza` no tamanho do ponto brilhante.

## Roteiro sugerido
1. (5 min) Retome o M10: "a difusa mudava quando você andava em volta do objeto? E um brilho de bola de
   bilhar?" Brain Power — deixa a resposta no ar antes de explicar.
2. (10 min) Apresente o vetor V. Mostre a linha `normalize(u_cameraPos - v_worldPos)`. Lembre M8:
   subtrai pontos → vetor; normaliza → direção pura.
3. (10 min) Apresente H = normalize(L + V). Não derive — mostre geometricamente: H fica no meio.
   Intuição: N perto de H → brilho.
4. (10 min) A receita completa: `pow(max(dot(N, H), 0.0), dureza)`. Mostre o papel do expoente com
   dois valores extremos (2 vs 128).
5. (10 min) Playground pg-brilho: mover dureza dos dois extremos, prever antes de testar (Afie o Lápis).
6. (resto) **Projeto-Vitória 3**: esfera texturizada + especular, bloco editável. Meta: ≥3 ingredientes
   incluindo o especular. Ao final: baixar imagem / copiar shader.

## Pontos de tropeço comuns
- **#1 — O brilho "grudado" na superfície:** o erro mais comum é achar que o especular fica fixo como
  a difusa. Mostre que se você girar a câmera (mudar u_cameraPos), o ponto se move. O especular depende
  de V — e V muda com o observador.
- **#2 — Dureza alta = ponto MENOR (contra-intuitivo):** alunos geralmente acham que "dureza alta =
  brilho forte/grande". É o oposto: expoente grande afila o brilho, mata a borda, deixa só o pico.
  Demonstre numericamente: pow(0.9, 2) = 0.81 vs pow(0.9, 64) ≈ 0.001.
- **Esquecer de normalizar H:** `H = L + V` sem normalizar faz o dot dar resultado errado dependendo
  do comprimento dos vetores.
- **Confundir V com a posição da câmera:** V é um vetor (direção), não a posição. `u_cameraPos` é a
  posição; V = normalize(u_cameraPos - v_worldPos) é a direção ponto→câmera.

## Gabarito
- Brain Power: difusa NÃO muda com o observador; o brilho especular MUDA — acompanha quem olha.
- Afie o Lápis: dureza 128 → ponto pequeno e duro; dureza 4 → mancha grande e suave.
- Caça ao par: V→B, H→C, pow→A, especular→D.

## Avaliação do Projeto-Vitória 3 (rubrica, 0–5)
- (1pt) Usa brilho especular com `pow(max(dot(N,H),0.0), exp)` com efeito visível.
- (1pt) Usa luz difusa (`max(dot(N,L),0.0)`) combinada com o especular.
- (1pt) Usa textura ou cor base autoral (não o padrão sem modificação).
- (1pt) Entrega imagem (PNG) e/ou shader copiado.
- (1pt) Explica em 1–2 frases o que o especular adiciona em relação à difusa sozinha.
**Meta mínima:** ≥3 ingredientes incluindo obrigatoriamente o especular.

## Observação técnica
`u_cameraPos` é injetado automaticamente pelo motor como `[0, 0, 3]` (câmera fixa). `v_worldPos`
é o varying com a posição do fragmento em espaço de mundo. O motor também entrega `u_lightDir`
(direção de luz fixa, padrão [0.5, 0.7, 1.0]) e `u_normalMatrix` — não precisam ser declarados
no shader. O expoente `pow` pode ser declarado como uniform (slider) ou hardcoded; ambas as
abordagens são válidas para o projeto.

## Nota de encerramento
Este é o primeiro brilho especular do curso — um marco concreto: pela primeira vez o aluno vê
uma superfície que parece "material" de verdade, não apenas colorida. A partir daqui é GPU power:
compute, otimizações, e os truques que fazem jogos parecerem jogos.
