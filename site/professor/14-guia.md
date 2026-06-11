# Guia do Professor — Módulo 14: Por Baixo do Capô III (Otimização)

**Tempo estimado:** 1 aula. **Conceitual** (sem exercício/pixel-diff). **FECHA o Marco 3 e o curso inteiro (14/14).**
**Pré-requisito:** M6 (paralelismo), M11 (hardware fixo), M13 (GPU como calculadora).

## Objetivos de aprendizagem
- Entender warps/wavefronts: threads rodam em grupos que executam a mesma instrução ao mesmo tempo.
- Compreender divergência de branch: um `if` que divide o pelotão faz o hardware executar ambos os caminhos (custo duplo).
- Reconhecer que `mix`/`step` frequentemente substitui `if` sem criar branch.
- Entender o trade-off de precisão (`mediump`/`half` vs `highp`/`float`).
- Fechar o curso conectando os três marcos e motivando o aluno a revisar seu Efeito Autoral.

## Roteiro sugerido
1. (5 min) Retome o exército do M6: agora revele que a GPU controla os soldados em *pelotões* (warps).
   O pelotão sempre anda junto — mesma instrução, ao mesmo tempo.
2. (10 min) Divergência: desenhe o cruzamento no quadro (ou use o SVG). O pelotão chega no `if`;
   metade quer ir pro bloco A, metade pro bloco B. A turma não pode se separar — faz os dois e descarta.
3. (10 min) `.duo` if/mix: abra os dois demos lado a lado. "Qual a diferença visual?" (nenhuma).
   "Qual a diferença interna?" (o `if` pode divergir; o `mix` não tem branch).
4. (5 min) Precisão: ancore no `precision mediump float;` que o motor já injeta desde M1. Agora eles
   sabem *por que* esse default existe.
5. (5 min) Caça ao par + Pontos-chave.
6. (10 min) **Fechamento do curso** — recapitule os três marcos, celebre, e lance a missão final:
   revisitar o Efeito Autoral (M12) com olhos de otimização.

## Pontos de tropeço comuns
- **"Todo `if` é ruim":** não — só o que divide pixels vizinhos. Se a condição é uniforme (todos
  passam ou todos não passam), o custo é zero. Deixe isso claro ou o aluno vai evitar `if` em todo lugar.
- **"Vejo o warp no shader":** impossível em WebGL1. A caixa `Cuidado` na página é obrigatória;
  reforce na aula. O diagrama é metáfora, não instrução.
- **Confundir warp com thread:** warp = grupo de threads que executam juntos. Thread = invocação
  individual do shader.

## Gabarito
- Caça ao par: warp→B, divergência→C, mix→A, half/mediump→D.

## Avaliação sugerida (Missão Final)
O aluno abre seu **Efeito Autoral** (M12) e responde em 2–3 frases:
> "Tem algum `if` no meu shader que divide pixels vizinhos? Daria pra trocar por `mix` ou `step`?
> Por que (ou por que não)?"

Rubrica:
- Identifica corretamente se há um `if` potencialmente divergente (1pt).
- Justifica com o conceito de warp/pelotão (1pt).
- Propõe ou descarta a substituição com argumento técnico (1pt).

Essa avaliação é a mais honesta do curso: o aluno aplica o conceito no próprio código autoral.

## Fechamento do curso

### Os três marcos
| Marco | Tema | Entrega |
|-------|------|---------|
| Marco 1 — Pinte o Pixel | Shaders 2D, cor, formas, animação, paralelismo | Padrão Animado |
| Marco 2 — Superfícies de Verdade | Pipeline 3D, vértices, texturas, normais, luz difusa, hardware fixo | Objeto Texturizado e Iluminado |
| Marco 3 — O Poder da GPU | Brilho especular, compute (metáfora), warps e otimização | Efeito Autoral |

### Mensagem de encerramento
"Vocês saíram do primeiro `vec3` de cor e chegaram a entender o que acontece por dentro quando um shader roda — warps, divergência, precisão, hardware fixo. Isso não é tutorial de como usar uma API: é entender a máquina. O Efeito Autoral de vocês roda em milhares de núcleos em paralelo, 60 vezes por segundo. Isso é programar a GPU."

### Callback ao Efeito Autoral (Projeto-Vitória 3 / M12)
A missão final não é um exercício novo — é voltar ao código autoral com novos olhos. Esse retorno é o fechamento pedagógico mais rico: o aluno vê que o conhecimento do Marco 3 muda a forma como lê o que já criou. Não há resposta certa ou errada; o que importa é a justificativa com base no conceito de warp.
