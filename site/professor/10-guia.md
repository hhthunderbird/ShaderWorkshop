# Guia do Professor — Módulo 10: Normais & Luz Difusa

**Tempo estimado:** 1 aula + tempo de projeto. **Pré-requisito:** M7 (mesh), M8 (dot), M9 (textura).
**Fecha o conteúdo novo do Marco 2** com o Projeto-Vitória 2.

## Objetivos de aprendizagem
- Entender normal como "pra onde a superfície aponta".
- Calcular luz difusa: `max(dot(N, L), 0.0)`.
- Combinar luz com textura/cor num objeto autoral.

## Roteiro sugerido
1. (5 min) Cobre a aposta do M8 (dot alto = claro?). Brain Power. Recupera, não re-explica.
2. (10 min) Normal (SVG): no topo da esfera aponta pra cima, na lateral pro lado. `v_normal` vem pronto.
3. (10 min) A receita `max(dot(N,L), 0.0)`. Revele a resposta da aposta: claro quando dot ALTO.
4. (10 min) Playground da esfera (pg-luz): girar a luz, ver o lado claro passear. Afie o lápis (prever).
5. (resto) **Projeto-Vitória 2**: cubo texturizado + iluminado, autoral. Apresentar a meta (≥2 de
   textura/luz/cor). Ao final: baixar imagem / copiar shader.

## Pontos de tropeço comuns
- **Esquecer o `max(...,0)`:** faces de costas ganham brilho negativo → erro/escurecimento estranho.
- **Não normalizar N e L:** o brilho fica "torto" (o dot mede tamanho junto). Mesmo aviso do M8.
- **Achar que a normal é a posição:** normal é DIREÇÃO (pra onde aponta), não onde está.
- **Luz ambiente 0:** sem o termo ambiente (o `0.25`), a sombra fica preta total — é uma escolha
  estética; mostre os dois.

## Gabarito
- Aposta/Afie o lápis: claro quando o dot é ALTO; o ponto onde a normal aponta direto pra luz é o
  mais claro (dot ≈ 1).
- Caça ao par: normal→B, dot(N,L)→D, max(...,0)→A, luz difusa→C.

## Avaliação do Projeto-Vitória 2 (rubrica, 0–5)
- (1pt) Usa textura no objeto (texture2D + UV).
- (1pt) Usa luz difusa (`max(dot(N,L),0.0)`) com efeito visível.
- (1pt) Cor/ajuste autoral (não o padrão).
- (1pt) Entrega imagem (PNG) e/ou shader copiado.
- (1pt) Explica em 1–2 frases o que fez (textura + luz).
**Meta mínima:** ≥2 dos 3 ingredientes (textura, luz, cor autoral). Incentive originalidade.

## Observação técnica
v_normal é a normal em espaço de mundo (o motor já aplica a normalMatrix); u_lightDir é uma direção
de luz em mundo (config.light). O dot entre as duas é a luz difusa. A esfera do pg-luz pode ficar sem
rotação (u_vel=0) — numa esfera lisa a rotação é invisível; o que importa é a luz se mover.
