# Marco 3 — "O Poder da GPU" (curso longo) — Design

**Data:** 2026-06-11. **Pré-requisito:** Marco 2 completo (M7–M11, motor `mesh` com geometria,
matriz, textura e luz difusa). **ÚLTIMO marco.**
**Continua:** `2026-06-11-marco2-superficies-design.md` e o spec mestre
`2026-06-10-curso-shaders-ensino-medio-design.md` (§4 esboçou Marco 3).

## 1. Escopo e objetivo

Marco 3 fecha o curso mostrando **por que a GPU é poderosa de verdade**: o brilho que dá realismo
(specular), a ideia de que a GPU calcula muito além de pixels (compute, conceitual), e o que custa
caro nela (otimização). Fecha com o **Projeto-Vitória 3: Efeito Autoral** — um playground aberto e
exportável onde o aluno combina tudo que aprendeu num efeito só seu.

Mantém tudo do curso: **Head First** (PT-BR, ensino médio, zero programação), **web própria**
(HTML/CSS/JS vanilla, offline, WebGL1/GLSL ES), **um componente `ShaderPlayground` config-driven**,
toggle GLSL⇄HLSL, camada do professor.

3 módulos (M12–M14), numeração contínua a partir do Marco 2.

## 2. Princípio mestre (herdado)

**Esconder a maquinaria pesada; ensinar o efeito e a intuição.** Marco 3 é majoritariamente
**conceitual** (M13 e M14 fecham o entendimento de hardware/escala, não introduzem exercícios de
código novos). O único módulo com técnica nova de shader é o M12 (specular). A dívida do Marco 2
fica honrada: **a matriz NÃO reaparece** — nenhum módulo do Marco 3 exige o aluno manipular matriz à
mão (M12 usa só vetores e `dot`/`pow`, já no repertório do M8/M10).

## 3. Arquitetura técnica — adições mínimas (YAGNI)

O motor já faz quase tudo. Marco 3 acrescenta **um único auto-uniform** e nada mais estrutural.

### 3.1 `u_cameraPos` (novo auto-uniform do modo mesh)
- O specular precisa da direção do olho: `V = normalize(u_cameraPos - v_worldPos)`.
- A view do motor é fixa: `view = translation(0, 0, -3)` → a câmera está em **mundo (0, 0, 3)**.
- `playground.js` envia `u_cameraPos = vec3(0, 0, 3)` por frame (constante, mas enviado como uniform
  pra ficar coerente com o vertex/fragment e permitir futura câmera).
- `header.js` (`withHeaderMesh`): declarar `uniform vec3 u_cameraPos;` quando ausente
  (declaração-aware, como os outros).
- **Acoplamento a registrar (build):** `u_cameraPos` é o negativo da translação da view. Se a view
  mudar, atualizar os dois juntos. Comentar isso no `playground.js`.

### 3.2 Nada de compute real
- WebGL1 **não tem** compute shaders. M13 é **conceitual + demo ilustrativo em fragment** (ver §4).
  Nenhuma API nova, nenhuma extensão. O motor não muda pro M13.

### 3.3 Sem pixel-diff em nenhum módulo do Marco 3
- M12: cena 3D iluminada (specular) → frágil entre GPUs (mesma política do Marco 2 §4). Predizer-
  observar + projeto aberto.
- M13/M14: conceituais. Verificação de build = "anima + console limpo", não pixel-match.

## 4. Marco 3 — detalhamento módulo-a-módulo

Formato (igual Marcos 1/2): **Objetivo · Conceitos · Analogia · Fonte · Demos · Math sidebar ·
Imagens · Professor.** Dispositivos Head First implícitos em todos.

### Módulo 12 — Luz Especular & Brilho
- **Objetivo:** Aluno acende o **brilho** num objeto — aquele ponto de luz que escorrega pela
  superfície e some quando você vira a cabeça. Faz a esfera parecer plástico/metal molhado, não giz.
- **Conceitos (ancorar no M10 — é a continuação direta da luz difusa):**
  1. **Difusa relembrada** (recuperação ativa): a luz do M10 é igual de todo ângulo. O brilho
     especular **NÃO** — depende de onde VOCÊ olha.
  2. **Vetor do olho** `V`: a direção do ponto da superfície até a câmera. Novo, mas é só mais um
     vetor (M8). `V = normalize(u_cameraPos - v_worldPos)`.
  3. **Half-vector** `H = normalize(L + V)` (caixa-preta leve): "a direção no meio do caminho entre a
     luz e o olho". Quando a normal aponta pra `H`, o brilho estoura.
  4. **Brilho** `pow(max(dot(N, H), 0.0), dureza)`: o mesmo `dot` (M8/M10), elevado a uma potência. A
     potência (`dureza`) controla o tamanho do ponto — alta = pontinho duro (metal); baixa = mancha
     mole (plástico fosco).
- **Analogia:** uma maçã encerada sob o sol: a parte difusa é o vermelho geral; o brilho branco é o
  reflexo do sol — e ele **anda** quando você mexe a cabeça.
- **Fonte:** #044, #045, #046 (specular/Blinn-Phong; usar half-vector, mais barato que reflect, e
  alinhado ao "esconder maquinaria").
- **Demos:** `mesh` (esfera) — difusa do M10 **+** specular. Slider **dureza** (expoente, ex. 2–128) e
  slider **direção da luz**. Objeto girando. Cena 3D → **sem pixel-diff**; predizer-observar.
  Projeto-Vitória 3 começa a ser preparado aqui (o efeito autoral parte do specular).
- **Math sidebar:** `pow` eleva à potência — "muda a velocidade com que o brilho cai". `dot(N,H)` é o
  mesmo alinhamento do M8/M10. Sem deduzir Blinn-Phong; mostrar a receita e o efeito de cada slider.
- **Imagens:** SVG dos vetores `N`, `L`, `V`, `H` num ponto da superfície curva; o ponto de brilho onde
  `N≈H`. [IMAGEM: esfera fosca × esfera brilhante lado a lado].
- **Professor:** tropeço — achar que o brilho está "preso" na superfície. Ele se move com o
  observador (por isso depende de `V`). Verificar no navegador que o `pow` não causa banding (usar
  `precision highp float` no fragment do specular se aparecer faixa).

### Módulo 13 — Para Além de Pixels: a GPU como Calculadora
- **Objetivo:** Aluno entende que a GPU não serve só pra desenhar — ela faz **muita conta de
  propósito geral, em paralelo**. É a noção de compute / GPGPU, sem código de compute.
- ⚠️ **HONESTIDADE TÉCNICA (gate de revisão):** WebGL1 **não tem** compute shaders. O módulo precisa
  dizer isso explicitamente numa caixa **Cuidado!** ("o que você vê aqui é uma *metáfora* rodando no
  fragment shader; compute shader de verdade é outra API, fora do nosso playground"). NÃO afirmar que
  o demo "é" compute.
- **Conceitos:**
  1. **O salto de mentalidade (o que é NOVO vs. M6):** no M6 o paralelismo era *por pixel* — milhares
     de cópias do MESMO trabalho, cada uma presa ao seu pixel da tela. Compute solta isso: a GPU vira
     uma **calculadora paralela de propósito geral** — milhares de "contas" que não precisam virar
     pixel nenhum (física de partículas, simulação, IA). Esse contraste **é o coração do módulo** e
     vai no texto + SVG (M6 = pintores cada um numa parede × M13 = exército fazendo qualquer conta).
  2. **Esquadrões (numthreads/dispatch):** você não dispara uma thread; dispara **grupos** delas.
     Analogia Gemini: pelotões/esquadrões recebendo a mesma ordem.
  3. Onde isso aparece no mundo: simulação de fluidos, partículas de jogo, treino de IA — tudo "GPU
     fazendo conta", não desenho.
- **Analogia (Gemini):** exército que, em vez de cada soldado pintar um quadradinho (M6), agora cada
  um resolve uma continha de um cálculo gigante — e há milhares deles, em esquadrões.
- **Fonte:** Gemini (numthreads/dispatch="esquadrões"; GPU como calculadora paralela).
- **Demos:** **demo ilustrativo procedural** em `fragment` — um "enxame de partículas" (vários pontos
  que se movem por uma fórmula de `u_time`, ex. órbitas/ruído), **com a caixa Cuidado! deixando claro
  que é metáfora visual de escala, não compute real**. O valor do demo é dar a SENSAÇÃO de "muitas
  coisas calculadas ao mesmo tempo", reforçando o contraste com o M6. Sem pixel-diff.
- **Math sidebar:** —  (ou nota curta: "aqui a conta não é cor, é posição/velocidade — só estamos
  desenhando o resultado pra você ver").
- **Imagens:** SVG do contraste M6 (1 trabalho × pixel) → M13 (qualquer conta, em esquadrões).
  [IMAGEM: visualização de simulação de partículas / fluido].
- **Professor:** deixar explícito o limite da ferramenta (WebGL1 ≠ compute). O objetivo é a **noção**,
  não escrever compute. Ligar ao M6 (mesmo hardware paralelo, uso mais livre).

### Módulo 14 — 🏗️ Por Baixo do Capô III: Otimização
- **Objetivo:** Aluno entende, em alto nível, **o que deixa um shader rápido ou lento** na GPU — e
  fecha o curso sabendo "pensar como a GPU".
- **Conceitos (SIMPLIFICADOS — intuição, não arquitetura exata):**
  1. **Warps/wavefronts:** a GPU não roda threads soltas; roda em **turmas que andam em sincronia**
     (todas executam a mesma linha ao mesmo tempo). Ancorar no exército do M6/M13 (pelotão marcha
     junto).
  2. **Divergência de branch (`if`):** se metade da turma vai pro `if` e metade pro `else`, a turma
     faz **os dois** e descarta — custa o dobro. É o ponto prático: `if` que separa vizinhos é caro.
  3. **`half` × `float` (precisão):** conta de menor precisão (`half`) é mais barata/rápida; usar
     precisão alta só onde precisa. (No WebGL1: `mediump`/`highp` — ligar ao `precision` que o motor
     injeta desde o M1.)
- **Analogia (Gemini):** pelotão que marcha em sincronia (warp); se metade vira à esquerda e metade à
  direita num cruzamento, o pelotão inteiro faz as duas rotas e joga uma fora (divergência).
- **Fonte:** Gemini (warps/wavefronts, branch divergence, half×float).
- **Demos:** **contraste `if` × sem-branch** (lado a lado, CSS `.duo`): um padrão feito com `if`
  divergente baseado na posição, outro feito com `mix`/`step` (sem branch) gerando o MESMO resultado
  visual — mostrando que o `if` dá pra evitar. ⚠️ **NÃO** fazer um demo que "mostra quais warps
  divergiram": GLSL ES 1.00 não dá acesso ao agrupamento de invocações/warp (isso é Vulkan/GL4.x,
  não WebGL1) — um shader que "vê warps" seria **fabricado** e fere a honestidade do marco. O conceito
  de warp/divergência fica no **SVG** e no texto, não num shader que finge enxergá-lo. Sem pixel-diff.
- **Math sidebar:** — (nota: `mix`/`step` muitas vezes substituem um `if`, evitando divergência).
- **Imagens:** SVG do pelotão sincronizado e do cruzamento que diverge. [IMAGEM: diagrama de
  warp/wavefront].
- **Professor:** é o **fecho do curso** — recapitular a jornada (pixel → forma → 3D → luz → poder da
  GPU). Manter simplificado; não é aula de microarquitetura. Conectar `precision` (M1) e paralelismo
  (M6/M13).

### 🏆 Projeto-Vitória 3 — Efeito Autoral
- **Onde:** ao final do **M12** (último módulo com técnica de shader nova — precisa do specular como
  ingrediente). O **M14**, no fechamento do curso, **manda o aluno de volta ao próprio Efeito Autoral**:
  "agora que você sabe o que é caro na GPU, olhe o seu shader — tem `if` que dá pra trocar por `mix`?".
  Amarra otimização (M14) ao artefato que o aluno fez (M12) — recuperação ativa sobre algo dele.
- **O quê:** playground **aberto e exportável** (reusa a flag `exportable` do Marco 1/2) onde o aluno
  combina os ingredientes do curso inteiro: forma (M7), textura (M9), luz difusa (M10), **specular
  (M12)**, cor/tempo autorais. Template rico, sem `reference` (sem pixel-diff).
- **Entrega:** "📷 Baixar imagem" + "📋 Copiar shader" pra compartilhar. Rubrica: usa ≥3 ingredientes
  do curso, incluindo o specular novo do M12.

## 5. Mapeamento de fontes (transcrições → módulos)
| Fonte | Módulo |
|---|---|
| #044, #045, #046 (specular / Blinn-Phong / half-vector) | M12 |
| Gemini (numthreads/dispatch "esquadrões", GPU calculadora) | M13 |
| Gemini (warps/wavefronts, branch divergence, half×float) | M14 |

## 6. Build (decomposição) — fatia vertical primeiro
1. **Fatia vertical:** motor (`u_cameraPos` em playground.js + declaração em header.js) + **Módulo
   12** (esfera com specular). Verificar no navegador (renderiza + anima + brilho responde aos
   sliders + console limpo; checar banding do `pow`) antes de seguir. Teste node: config aceita o
   fragment do specular; header injeta `u_cameraPos`.
2. **M13** (conceitual; demo enxame de partículas em fragment + caixa Cuidado! da metáfora).
3. **M14** (conceitual; demo `if`×`mix` lado a lado; warp/divergência só em SVG; **fechamento do
   curso** com callback ao Efeito Autoral do M12). Passe de exatidão técnica §7 antes do commit.
4. **Projeto-Vitória 3** dentro do M12 (exportável). Passe de exatidão §7 também no M13.
Cada módulo: HTML Head First + guia do professor + SVGs + testes + verificação no Chrome + commit.

## 7. Gate de precisão técnica (NOVO — risco específico do Marco 3)
M13 e M14 fazem **afirmações sobre hardware** (compute, warps, divergência, `half`) que NÃO dão pra
verificar no navegador (são conceituais; o Chrome só confirma que o demo anima, não que a afirmação é
verdadeira). Por isso:
- **Antes de commitar M13/M14, rodar um passe de revisão de exatidão técnica** das afirmações (sub-
  agente de revisão técnica ou advisor), focado em: (a) a metáfora de compute não engana ("é metáfora,
  não compute"); (b) warps/divergência/`half` estão simplificados mas NÃO errados; (c) nada contradiz
  o que foi dito no M6.
- O agente **didatica-neuro** revisa linguagem/carga cognitiva; este passe é **ortogonal** e revisa
  VERDADE. Os dois são necessários pra M13/M14.

## 8. Fora de escopo (não-objetivos)
- Compute shaders reais (WebGL1 não tem; é conceitual).
- Reflexões/refração reais, ambiente (cubemaps), PBR completo, sombras.
- Câmera orbital / controle de olho pelo usuário (a câmera continua fixa; `u_cameraPos` é constante).
- Aluno manipulando matriz à mão (dívida do Marco 2 honrada — não reabrir).
- WebGL2 / extensões; medição real de performance/profiler.
- Pixel-diff em qualquer módulo do Marco 3.

## 9. Riscos e mitigações
- **Dívida da matriz (do Marco 2):** o Marco 3 NÃO reabre — M12 usa só vetores/`dot`/`pow`; M13/M14
  conceituais. Andaime caixa-preta da MVP fica intacto. ✓
- **Compute em WebGL1 (inexistente):** §3.2 + caixa Cuidado! obrigatória no M13 + gate de exatidão §7.
- **Afirmações de hardware não-verificáveis no browser:** gate de exatidão técnica §7 (é o gate real
  do M13/M14, já que o Chrome só vê o demo animar).
- **`pow` banding no specular:** verificar no Chrome; usar `highp` se aparecer faixa.
- **Acoplamento `u_cameraPos` ↔ view:** comentar no playground.js (§3.1).
- **M14 não pode "mostrar warps" (GLSL ES não tem introspecção de warp):** demo é o contraste honesto
  `if`×`mix` lado a lado; warp/divergência só em SVG/texto (§4 M14). Pego no passe de exatidão §7.

## 10. Git
Branch opcional `feat/marco3-poder-gpu` ou direto em `main` (como Marcos 1/2 acabaram indo). Um commit
por fatia/módulo, mensagem Conventional Commits, push ao final de cada. Ao fim: **curso completo
14/14** — rodar finishing-a-development-branch se em branch.
