# Guia do Professor — Módulo 6: Por Baixo do Capô I (Paralelismo)

**Tempo estimado:** 1 aula. **Pré-requisito:** Módulos 1–5.
**Este módulo é conceitual** (sem exercício de código) e **FECHA o Marco 1**.

## Objetivos de aprendizagem
- Entender por que a GPU é rápida: a mesma regra roda em milhares de núcleos ao mesmo tempo.
- Entender que cada fragmento é independente (não acessa o vizinho) — e que essa independência é o
  que viabiliza o paralelismo.
- Diferenciar CPU (poucos núcleos, tarefas dependentes) de GPU (muitos núcleos, tarefas iguais e
  independentes).
- Introduzir a ideia de SIMT **sem** o jargão (sem "warp"); os nomes vêm em marcos futuros.

## Roteiro sugerido
1. (5 min) Gancho: retome a pergunta do M1 — "2 milhões de pixels, 60×/seg, como?".
2. (10 min) Analogia do pintor solo × exército (SVG). Enfatize: o exército não conversa entre si.
3. (15 min) Os dois playgrounds lado a lado. Deixe a turma OLHAR: o da CPU enche em fila (lento), o da
   GPU muda tudo junto. Faça a conta do "Afie o lápis" no quadro (a lentidão do sequencial choca).
4. (10 min) "Cada pixel é uma ilha": conecte com o fato de nunca terem acessado o pixel vizinho nos
   módulos anteriores. Não foi limitação do curso — é o modelo da GPU.
5. (5 min) Bullet points + caça ao par.
6. (5 min) **Fechamento do Marco 1** — recapitule os 6 módulos. Celebre o Projeto-Vitória do M5.

## Pontos de tropeço comuns
- **"Paralelo = mágica rápida":** não. É rápido porque o trabalho foi dividido em pedaços
  independentes. Reforce com a caixa "Cuidado!".
- **"GPU é sempre melhor que CPU":** não — são ferramentas pra trabalhos diferentes (ver Q&A).
- **Achar que o shader "vê a tela inteira":** ele vê só o próprio pixel. A ilusão de imagem vem de
  milhares de execuções independentes.

## Observação técnica
Os dois playgrounds usam a grade `floor(v_uv * 12.0)` só para visualização. O da "CPU" revela células
em ordem (`step(idx, ponteiro)` com `ponteiro` crescendo no tempo); o da "GPU" muda o brilho de TODAS
as células em fase (mesma `sin(u_time)`). É uma metáfora — na prática, mesmo o quadro da "CPU" roda na
GPU; o objetivo é só dar a SENSAÇÃO de sequencial × simultâneo.

## Gabarito
- Afie o lápis: estimativa livre. O ponto é perceber que "um por vez" para 2 milhões de pixels é
  inviável a 60 fps — daí a GPU.
- Caça ao par: CPU→C, GPU→A, paralelo→D, independente→B.

## Avaliação sugerida
Peça um parágrafo (3–5 frases) explicando, com as próprias palavras e a analogia do exército, por que
a GPU desenha rápido. Rubrica: cita paralelismo/muitos núcleos (1pt), cita independência dos pixels
(1pt), usa uma analogia coerente (1pt).

## Fechamento do Marco 1
Mensagem-chave: "vocês escreveram código que roda em milhares de núcleos da GPU, ao mesmo tempo,
60×/seg — e agora entendem por quê." A partir daqui o curso é opcional (Marcos 2 e 3); o curso curto
está completo e coerente por si só.
