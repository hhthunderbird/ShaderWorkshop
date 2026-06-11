# Guia do Professor — Módulo 7: Vértices & Pipeline

**Tempo estimado:** 1–2 aulas. **MÓDULO DE MAIOR CARGA DO MARCO 2** — não atropelar; seguir os
sub-blocos (malha → split posição/cor → MVP/pipeline). **Pré-requisito:** Marco 1 completo.

## Objetivos de aprendizagem
- Entender que um objeto 3D é uma malha de vértices.
- Distinguir vertex shader (posiciona) de fragment shader (pinta).
- Aceitar a matriz MVP como caixa-preta que move/gira/projeta (intuição vem no M8).

## Roteiro sugerido
1. (10 min) Sub-bloco 1: cubo girando (pg-cubo). "É feito de pontinhos." Só isso.
2. (15 min) Sub-bloco 2: os dois trabalhadores. Reforce: você só escreve a cor; a posição já vem pronta.
3. (10 min) Sub-bloco 3: a matriz MVP (caixa-preta) + a linha de montagem (SVG do pipeline).
4. (10 min) Test Drive do pg-cor: editar a cor do cubo (por v_uv / v_worldPos).
5. (5 min) Caça ao par + Pontos-chave.

## Pontos de tropeço comuns
- **"Vertex shader pinta":** não — posiciona. Quem pinta é o fragment. (Tropeço nº1.)
- **Querer entender a matriz agora:** segure a ansiedade; é caixa-preta de propósito. M8 dá a intuição.
- **Carga alta:** este é o módulo mais pesado do marco; se a turma travar, pare no sub-bloco 1–2 e
  continue na aula seguinte.

## Gabarito
- Caça ao par: vértice→B, vertex shader→A, fragment shader→D, rasterização→C.
