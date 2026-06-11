# Guia do Professor — Módulo 3: Matemática que Vira Imagem

**Tempo estimado:** 1–2 aulas (é o módulo mais matemático do Marco 1). **Pré-requisito:** Módulos 1–2.

## Objetivos de aprendizagem
- Entender função como "máquina": uma entrada, uma saída.
- Distinguir borda dura (`step`) de borda suave (`smoothstep`).
- Reconhecer `sin` como oscilação e mapear [−1,1]→[0,1] com `*0.5+0.5`.
- Entender `fract` como geradora de repetição.

## Roteiro sugerido
1. (5 min) Gancho: retome `mix(a,b,t)` do M2 como uma função já usada. Pergunte "e se a saída
   não subir reto?".
2. (10 min) Analogia interruptor × dimmer com o SVG das curvas. Deixe-os apontar onde cada curva
   "salta" ou "sobe suave".
3. (20 min) **Playground plotter (`pg-plot`)** — o coração da aula. Projete e faça a turma ditar
   fórmulas (use o "Afie o lápis"). Mexa MUITO no slider `k` com `fract` e `sin`. O fundo cinza
   mostra o valor; a linha verde mostra o formato — conecte os dois explicitamente.
4. (15 min) Exercício da onda (`pg-ex`). Deixe tentarem o `sin` antes de revelar o `*0.5+0.5`.
5. (5 min) Bullet points + caça ao par como saída.

## Pontos de tropeço comuns
- **`sin` "some metade":** sem `*0.5+0.5`, metade da onda fica negativa e a tela mostra preto.
  É o erro nº1 — deixe acontecer e use como descoberta.
- **Ordem dos argumentos:** `step(limite, x)` e `smoothstep(inicio, fim, x)` — o `x` vem por ÚLTIMO.
  Inverter dá resultado oposto. Reforce com a caixa "Cuidado!".
- **Radianos vs graus:** uma onda completa = `6.2831` (2π), não 360. Não precisa aprofundar π aqui;
  basta "6.2831 = uma volta".
- **`fract` confundido com arredondar:** `fract` joga fora a parte inteira e guarda a decimal —
  não arredonda.

## Gabarito
- Afie o lápis: as três fórmulas estão no enunciado; o efeito é, respectivamente, salto seco,
  serra repetida (mais repetições com `k` maior), e onda.
- Caça ao par: `step`→C, `smoothstep`→A, `sin`→B, `fract`→D.
- Exercício da onda: `vec3 c = vec3(sin(x * 6.2831) * 0.5 + 0.5);`

## Avaliação sugerida
Peça uma imagem autoral combinando DUAS funções (ex.: `fract` + `smoothstep` pra listras de borda
macia) com print do canvas. Rubrica: usou função sobre `v_uv` (1pt), resultado coerente com a
fórmula (1pt), explicou em uma frase o que cada função faz (1pt).
Desafio extra: anime a onda — adiantando o M5, some `u_time` dentro do `sin`.
