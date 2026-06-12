# Guia do professor — Módulo Bônus: Transparência (o Alpha)

**Objetivo:** o aluno entende que o 4º canal do `vec4` (alpha) controla transparência; que para
enxergar transparência é preciso um fundo atrás; e que a ordem de desenho importa (de trás pra frente).

**Quando usar:** bônus pós-curso, opcional. 10–15 min. Bom como "extra" depois do Marco 3, ou para
turmas que perguntaram sobre vidro/água/fumaça.

**O que NÃO cobrar:** não é cálculo de blend equations nem premultiplied alpha. A meta é a intuição
"frente sobre fundo" e "ordem importa" — não a álgebra.

**Gancho honesto:** o `Cuidado!` sobre ordem/Z-buffer é a ponte para "por que 3D é mais difícil".
Conecta com o M11 (Z-buffer) sem prometer resolver ordenação de transparência em 3D — que de fato é
um problema aberto que jogos resolvem ordenando objetos manualmente.

**Demos:** `pg-alpha` (slider de alpha sobre xadrez) e `pg-ex` (o aluno escreve o `.a`,
predict-observe, sem Conferir automático — é cena com mistura, validação é visual).
