# Guia do Professor — Módulo 0: Comece aqui: o Playground

**Tempo estimado:** 10–15 min (início da 1ª aula, antes do Módulo 1).

## Objetivo

Orientar o aluno no uso da ferramenta antes de qualquer conteúdo de shader.
O objetivo NÃO é ensinar sintaxe — é reduzir o medo e criar familiaridade com
o ciclo "edito → rodo → erro → reseto".

## Quando usar

Na primeira aula, como aquecimento. Pode ser feito individualmente ou coletivo
na lousa. Não avance pro Módulo 1 sem pelo menos 1 Test Drive bem-sucedido.

## Roteiro sugerido

1. (2 min) Abrir o Módulo 0 e mostrar o playground ao vivo. Trocar um número do
   `vec3` sem explicar nada ainda — só ver a cor mudar.
2. (5 min) Exploração guiada: cada aluno troca os três valores (R, G, B) e tenta
   reproduzir uma cor pedida ("faça ficar verde", "como seria branco?").
3. (3 min) Mostrar o ↺ Reset e o 💡 Mostrar solução. Confirmar que nada quebra.
4. (5 min) Mostrar a seção "Onde eu escrevo?" — destacar as marcas `// >>> EDIT`
   e `// <<< EDIT`. Reforçar que o resto é caixa-preta gerenciada pelo motor.

## O que NÃO fazer

- **Não transformar em aula de sintaxe.** O glossário colapsado ("Lendo uma linha
  de código") é referência pra consulta, não conteúdo a ser explicado ou cobrado.
  Se um aluno perguntar "o que é `void`?", aponte o glossário e diga "a gente
  explica direitinho no Módulo 1 — por agora só mexa nos números".
- Não cobrar memorização de tokens. Não há exercício, não há caça ao par, não há
  Recordação — isso é intencional.
- Não pular o Módulo 0 achando que "é só uma introdução". A familiaridade com o
  Reset e o ciclo de erro é pré-requisito silencioso pro resto do curso.

## Pontos de tropeço comuns

- **Tela preta após edição:** quase sempre falta um `;`. Mostre o `⚠ ERROR` e
  peça pra usar o Reset — não corrija o código do aluno na hora.
- **"Posso mexer no resto do código?"** — Não; o motor bloqueia. Explique que
  isso é de propósito: o motor cuida da estrutura, o aluno cuida da criatividade.

## Nota sobre o glossário

O `<details class="sidebar">` no Módulo 0 lista 6 tokens básicos (`void main`,
`gl_FragColor`, `vec3`, `float`, `step`, `mix`). Está lá para o aluno que quer
entender o que está vendo — não para ser ensinado. Não o abra em aula salvo se
perguntado. Os tokens `step` e `mix` aparecem de verdade no Módulo 1.
