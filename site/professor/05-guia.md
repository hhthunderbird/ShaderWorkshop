# Guia do Professor — Módulo 5: Dando Vida (Animação)

**Tempo estimado:** 1 aula + tempo de projeto. **Pré-requisito:** Módulos 1–4.
**Este módulo FECHA o Marco 1** ("curso curto") com o Projeto-Vitória.

## Objetivos de aprendizagem
- Entender `u_time` como o relógio que a CPU envia à GPU a cada quadro.
- Entender o conceito de **uniform** (valor igual pra todos os pixels), generalizando os sliders.
- Fazer cor/forma/tamanho **dependerem do tempo** para criar movimento.
- Integrar cor + função + forma + tempo num projeto autoral.

## Roteiro sugerido
1. (5 min) Gancho: "tudo que fizemos era foto; e pra dar movimento?". Mostre o pulso (`pg-pulso`).
2. (10 min) Conceito de uniform com o SVG do relógio. Conecte: sliders e tempo são uniforms; a
   diferença pro `v_uv` é que uniform é igual pra todos os pixels.
3. (10 min) `sin(u_time)` pra oscilar. Use o "Afie o lápis" (prever rápido/lento e o intervalo do raio).
4. (5 min) Caixa "Cuidado!": animação = depender do tempo, não um botão de play.
5. (resto) **Projeto-Vitória** — autoral. Apresente os 4 ingredientes e a meta (≥3). Circule ajudando.
   Ao final, peça que baixem a imagem e/ou copiem o shader pra entregar.

## Pontos de tropeço comuns
- **Shader que ignora o tempo:** fica parado. Verifique se o `u_time` aparece na fórmula.
- **Velocidade vs amplitude:** multiplicar `u_time` muda a velocidade; multiplicar o `sin` muda o
  tamanho do vai-e-vem. Alunos confundem.
- **`sin` "estoura" a cor:** sem `*0.5+0.5`, metade do tempo o valor é negativo (apaga). Mesmo truque
  do M3.
- **Exportar em file://:** "Copiar shader" usa a área de transferência, que pode ser bloqueada ao
  abrir o arquivo direto (file://). O motor cai num fallback que SELECIONA o texto — oriente Ctrl+C.
  Servindo via `npm run serve` (localhost), o copiar funciona normal.

## Gabarito
- Afie o lápis: velocidade maior → pulso mais rápido. Raio de `0.25 + 0.1*sin` oscila de 0.15 a 0.35.
- Caça ao par: `u_time`→B, uniform→A, `sin(u_time)`→C, animação→D.

## Avaliação do Projeto-Vitória (rubrica sugerida, 0–5)
- (1pt) Usa **cor** de forma intencional (não o cinza padrão).
- (1pt) Usa pelo menos uma **função** (smoothstep/sin/fract/step) com propósito.
- (1pt) Usa pelo menos uma **forma** via `length`/distância.
- (1pt) **Anima**: algo depende de `u_time` (movimento visível).
- (1pt) Entrega a imagem (PNG) e/ou o shader copiado, e descreve em 1–2 frases o que fez.
**Meta mínima:** usar ≥3 dos 4 ingredientes do marco. Incentive originalidade, não complexidade.

## Fechamento do Marco 1
Amarre: "vocês escreveram código que roda em milhares de núcleos da GPU, ao mesmo tempo, 60×/seg —
e agora ele se mexe." O *porquê* disso ser tão rápido é o Módulo 6.
