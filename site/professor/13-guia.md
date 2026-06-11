# Guia do Professor — Módulo 13: Para Além de Pixels: a GPU como Calculadora

**Tempo estimado:** 1 aula. **Conceitual** (sem exercício/pixel-diff). **Marco 3 — módulo 2 de 3.**
**Pré-requisito:** M6 (paralelismo por pixel), M11 (hardware e pipeline).

## Objetivos de aprendizagem
- Compreender o conceito de compute/GPGPU: GPU como calculadora paralela de propósito geral.
- Reconhecer o contraste com o M6: paralelismo por pixel vs. compute livre de tela.
- Entender o que é um esquadrão (workgroup) e o comando dispatch.
- Distinguir claramente o demo ilustrativo (fragment shader / WebGL 1) do compute real.

## Roteiro sugerido
1. (5 min) Retome o M6 — o exército de pintores. Pergunte: "e se o resultado não precisasse virar pixel?"
2. (10 min) Apresente o SVG de contraste (M6 vs M13) e discuta a diferença de mentalidade.
3. (10 min) Explore o demo do enxame (pg-enxame). **Faça a honestidade antes de rodar:** "vamos ver
   uma metáfora. Isso NÃO é compute — é um fragment shader com loop."
4. (8 min) Leia a caixa Cuidado junto com a turma. Discuta: por que é importante deixar claro?
5. (5 min) Q&A integrado + caça ao par.
6. (5 min) Conexão futura: WebGPU, CUDA, o que há por vir no M14.

## Pontos de tropeço comuns

### Tropeço #1 — "Esse demo É compute"
Este é o mais importante. O demo do enxame é visualmente convincente e pode fazer os alunos
pensarem que estão "rodando compute". Enfatize com firmeza: é um `for` rodando dentro de um único
fragment shader no pipeline gráfico do WebGL 1. Compute de verdade exige uma API diferente
(WebGPU, Metal, CUDA, DirectX Compute) que o playground não tem. Se necessário, releia a caixa
Cuidado em voz alta com a turma.

### Tropeço #2 — "Compute é mais rápido que fragment"
Não é simples assim. Compute é mais *flexível* — livre da tela, com acesso a memória compartilhada
entre threads do grupo. Para pintar pixels, o fragment shader já é ótimo. Para física/IA/simulação,
compute é o caminho certo porque o resultado não precisa ir para a tela.

### Tropeço #3 — "É hardware diferente"
Não — é o mesmo hardware. Os núcleos que pintaram pixels nos módulos anteriores são os mesmos que
treinam modelos de IA. O que muda é a API e a forma como o trabalho é organizado.

## Roteiro de fala sugerido (abertura)
> "No M6, descobrimos o exército de soldados da GPU — cada um pintando exatamente um pixel, todos ao
> mesmo tempo. Hoje vamos liberar esse exército da obrigação de pintar. E se, em vez de pintar pixels,
> cada soldado resolvesse uma equação de física? Ou atualizasse a posição de uma partícula? Ou
> calculasse um peso de rede neural? O hardware é o mesmo — a missão é completamente diferente."

## Gabarito
- Caça ao par: compute→C, esquadrão→A, M6→B, WebGL 1→D.

## Avaliação sugerida
Peça um parágrafo (3–5 frases) respondendo: "O que muda, do M6 para o compute, na forma como a GPU
trabalha?" Rubrica: menciona que M6 é preso à tela/pixels (1pt), explica que compute libera dessa
amarração (1pt), cita pelo menos um uso real de compute (física, IA, simulação) (1pt). Bônus: menciona
que o hardware é o mesmo, só a API muda.

## Nota sobre o demo
O demo do enxame foi escolhido deliberadamente simples e honesto: é um fragment shader com um loop
de 40 iterações, cada uma posicionando um ponto de luz no espaço UV com base em `u_time`. A
honestidade da caixa Cuidado é parte do conteúdo pedagógico — não é só um aviso técnico. Ensinar
os limites da ferramenta é tão importante quanto ensinar o conceito.
