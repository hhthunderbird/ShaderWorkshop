# Marco 2 — "Superfícies de Verdade" (curso médio) — Design

**Data:** 2026-06-11. **Pré-requisito:** Marco 1 completo (6 módulos, motor fragment).
**Continua:** `2026-06-10-curso-shaders-ensino-medio-design.md` (spec mestre; §4 esboçou Marco 2).

## 1. Escopo e objetivo

Marco 2 leva o aluno do quad 2D para **superfícies 3D de verdade**: malhas, vértices, pipeline,
texturas e luz. Fecha com o **Projeto-Vitória 2: Objeto Texturizado e Iluminado** (um objeto 3D
girando, com textura e luz difusa, exportável/compartilhável).

Mantém tudo do curso: **Head First** (PT-BR, ensino médio, zero programação), **web própria**
(HTML/CSS/JS vanilla, offline, WebGL1/GLSL ES), **um componente `ShaderPlayground` config-driven**,
toggle GLSL⇄HLSL, camada do professor.

5 módulos (M7–M11), numeração contínua a partir do Marco 1.

## 2. Princípio mestre (herdado, reforçado)

**Esconder a maquinaria pesada; ensinar o efeito e a intuição.** No Marco 1 o motor escondeu
`precision`, o quad e os varyings (via `withHeader`). No Marco 2 ele esconde a **álgebra de matriz**:
o aluno NUNCA multiplica matriz 4×4 à mão. A matriz MVP chega pronta como uniform; o aluno escreve
só `gl_Position = u_mvp * vec4(position, 1.0)`. A intuição (o que a matriz faz) é ensinada
visualmente no módulo-ponte M8.

## 3. Arquitetura técnica — modo `mesh`

Hoje o motor só tem modo `fragment` (quad fixo). O Marco 2 adiciona o modo `mesh`. Mantém a regra
do Marco 1: **mínimo-viável**, sem features especulativas (YAGNI).

### 3.1 Geometria (`site/assets/playground/geometry.js`, novo, puro/testável)
- Gera malhas em JS, sem loader externo: `cube()` e `sphere(segments)`.
- Cada malha retorna `{ positions: Float32Array, normals: Float32Array, uvs: Float32Array, indices: Uint16Array }`.
- `config.mesh`: `'cube' | 'sphere'` (default `'quad'` continua válido p/ retrocompat do Marco 1).
- Testável em node sem WebGL (verifica contagem de vértices, ranges, normais unitárias).

### 3.2 Matrizes (`site/assets/playground/mat4.js`, novo, puro/testável)
- Mini-lib 4×4 column-major: `identity`, `multiply`, `perspective`, `lookAt`, `rotateY`/`rotateX`,
  `scale`, `translate`, `normalMatrix` (inverse-transpose 3×3).
- Sem dependências. Testável em node (multiplicação, identidade, perspectiva conhecida).

### 3.3 Auto-uniforms do modo mesh (calculados no `playground.js`, enviados a cada frame)
- `u_mvp` (mat4): projeção · view · model. **Caixa-preta** — o aluno só usa.
- `u_model` (mat4): model (p/ posição em mundo, útil em luz).
- `u_normalMatrix` (mat3): inverse-transpose do model (transforma normais corretamente).
- `u_lightDir` (vec3): direção de uma luz direcional (default fixa; configurável via `config.light`).
- Rotação: model gira em torno de Y por `u_time * velocidade` (auto), com slider de velocidade opcional.
- View/projection fixas (câmera olhando o objeto de uma distância confortável). **Sem órbita.**

### 3.4 Vertex shader
- Modo `fragment` (Marco 1): vertex é o QUAD_VERTEX fixo (inalterado).
- Modo `mesh`: o motor fornece um **vertex shader padrão** que repassa `v_uv`, `v_normal`,
  `v_worldPos` e aplica `u_mvp`. O aluno **normalmente não escreve vertex shader** — escreve só o
  fragment (recebe os varyings prontos). `config.vertex` continua aceito p/ casos avançados (M7
  mostra o vertex padrão como leitura; editar é opcional/curado).
- Atributos: `a_position`, `a_normal`, `a_uv` (setupMesh em `gl.js`).

### 3.5 Texturas (`config.texture`)
- `config.texture: '<url>'` → o motor carrega a imagem, cria `sampler2D u_tex`, e o fragment usa
  `texture2D(u_tex, v_uv)`. Imagem de exemplo embutida em `site/assets/tex/`.
- Carregamento assíncrono; enquanto carrega, textura placeholder (1px) pra não quebrar.
- WebGL1: dimensões potência-de-2 ou `CLAMP_TO_EDGE` + `LINEAR` sem mipmap (evita restrição NPOT).

### 3.6 Header / declarações
- `withHeader` (mesh): injeta `precision`, `u_time`, e — quando ausentes — declara
  `varying vec2 v_uv; varying vec3 v_normal; varying vec3 v_worldPos; uniform vec3 u_lightDir;
  uniform sampler2D u_tex;` (declaração-aware, mesma lógica do `header.js`). Mantém retrocompat:
  modo fragment continua injetando só o conjunto do Marco 1.

### 3.7 config.js
- Aceita `mesh` (já há VALID_MODES com 'mesh'), `texture`, `light`. Normaliza com defaults.
- Mantém `exportable` (Projeto-Vitória 2 reusa).

## 4. Pixel-diff em 3D — política

3D iluminado/rotacionado é **frágil** pra pixel-diff exato (lighting, interpolação e rasterização
variam entre GPUs; rotação por tempo é não-determinística). Política:
- **Mantém pixel-diff SÓ onde a saída é determinística e 2D-ish**, contínua (robusta): visualização
  de produto escalar em cinza (M8), padrão de UV (M9). Gerar referência sem navegador como no Marco 1.
- **Cena 3D iluminada NÃO tem pixel-diff.** Usa predizer-observar (Afie o lápis) + mini-projeto
  aberto. O Projeto-Vitória 2 é aberto e exportável (flag `exportable`).
- Verificação no navegador (gate de build): o objeto 3D **renderiza e anima** (dois frames diferem),
  console limpo — não pixel-match.

## 5. Marco 2 — detalhamento módulo-a-módulo

Formato (igual Marco 1): **Objetivo · Conceitos · Analogia · Fonte · Demos · Math sidebar · Imagens ·
Professor.** Dispositivos Head First implícitos em todos.

### Módulo 7 — Saindo do Quad: Vértices & Pipeline
> ⚠️ **MÓDULO MAIS PESADO DO MARCO** (revisão didática): concentra muitos conceitos novos no salto
> 2D→3D. Carga intrínseca alta → **fatiar em sub-blocos sequenciados** (não despejar tudo de uma vez)
> e dar tempo. Um conceito por vez, com âncora concreta antes.
- **Objetivo:** Aluno vê um objeto 3D (cubo) girando que ELE controla, e entende que a tela 3D é uma
  malha de vértices projetada na tela.
- **Conceitos (nesta ordem, em sub-blocos — não tudo junto):**
  1. **Malha & vértice** (concreto primeiro): o cubo é feito de pontinhos (vértices) ligados em
     triângulos; o aluno gira e vê. Âncora antes de qualquer abstração.
  2. **O trabalho se divide:** o *vertex shader* decide a POSIÇÃO (1×/vértice); o *fragment* (que ele
     já conhece) continua decidindo a COR. Só depois do bloco 1.
  3. **MVP & pipeline** (por último): a matriz MVP (caixa-preta) leva o ponto 3D pra tela; pipeline =
     vértices → rasterização → fragmentos.
- **Analogia (Gemini):** linha de montagem detalhada — primeiro monta o esqueleto (vértices), depois
  pinta a superfície (fragmentos).
- **Fonte:** #007 (MVP), #023/#024 (pipeline).
- **Demos:** modo `mesh`, cubo girando. Fragment simples **cor por face ou por posição (coordenada
  local)** — NÃO usar normal aqui (normal só nasce em M10; evita referência adiante num módulo já
  saturado). Slider de velocidade de rotação. Leitura do vertex shader padrão (caixa "como funciona",
  não editável por padrão). Sem pixel-diff (cena 3D).
- **Math sidebar:** "o que a matriz MVP faz" em uma frase (move/gira/projeta), sem álgebra.
- **Imagens:** SVG do pipeline (vértices → triângulos → pixels). [IMAGEM: wireframe de uma malha].
- **Professor:** **reservar tempo — módulo de maior carga do marco**; seguir os sub-blocos sem
  atropelar. Tropeço — achar que "vertex shader pinta". Ele posiciona; quem pinta é o fragment.

### Módulo 8 — 🧮 Vetores & Coordenadas (ponte de matemática visual)
- **Objetivo:** Aluno ganha a intuição de vetor e produto escalar — as ferramentas que a luz vai usar.
- **Conceitos:** ponto × vetor (direção+tamanho); normalizar; **produto escalar** `dot(a,b)` como
  "quanto dois vetores apontam pro mesmo lado" (1 = mesma direção, 0 = perpendicular, −1 = oposto);
  noção de espaços de coordenadas (local/mundo/tela) sem formalismo.
- **Analogia:** duas lanternas — quanto mais alinhadas, mais o `dot` se aproxima de 1.
- **Fonte:** #026, #027, #063.
- **Demos:** `fragment` 2D mostrando `dot` entre a direção do pixel e uma direção-slider, pintado em
  cinza (escuro=oposto, claro=alinhado). **Pixel-diff aqui** (saída determinística em cinza, contínua).
- **Math sidebar (peso maior):** vetor, normalizar (`length`/`normalize`), `dot` visual.
- **Imagens:** SVG de dois vetores com o ângulo e o valor do `dot` anotado.
- **Professor:** este módulo é a ponte; reservar tempo. O `dot` volta forte no M10 (luz).

### Módulo 9 — Texturas & UV
- **Objetivo:** Aluno "veste" o objeto 3D com uma imagem.
- **Conceitos:** textura = imagem amostrada; coordenada UV mapeia cada ponto da superfície a um ponto
  da imagem; `texture2D(u_tex, v_uv)`.
- **Analogia:** embrulhar um presente — o papel (textura) gruda na caixa (malha) seguindo o molde (UV).
- **Fonte:** #011.
- **Demos:** (a) `fragment` 2D mostrando uma textura amostrada por UV — exercício pixel-diff de UV
  (ex.: repetir a textura com `fract(uv*N)`), determinístico/robusto. (b) `mesh` cubo/esfera vestido
  com a textura (cena 3D, sem pixel-diff).
- **Math sidebar:** UV de 0 a 1 — **recuperação ativa, não re-exposição**: "antes de ver, lembra o
  que era v_uv no M2?". E **nomear o falso-amigo**: no M2, UV = posição na *tela*; aqui, UV = endereço
  na *superfície/imagem*. Mesma faixa [0,1], sentido novo. `fract` repete o padrão — pedir previsão
  antes (reativa M3 por recuperação, não releitura).
- **Imagens:** SVG do molde UV (imagem 2D → superfície).
- **Professor:** tropeço nº1 — **UV mudou de sentido** (tela → superfície), não só inverteu/espelhou.
  Explicitar isso; depois orientação/flip da textura.

### Módulo 10 — Normais & Luz Difusa
- **Objetivo:** Aluno acende uma luz no objeto: faces viradas pra luz ficam claras; de costas, escuras.
- **Conceitos:** normal = "pra onde a superfície aponta"; luz difusa = `max(dot(N, L), 0.0)`; combinar
  com textura/cor.
- **Analogia:** a mão virada pro sol esquenta; virada pro lado, não (o `dot` mede esse "virar-se pra").
- **Fonte:** #021, #040–#042.
- **Demos:** `mesh` (esfera) com luz difusa; slider da direção da luz; objeto girando. Cena 3D, sem
  pixel-diff — predizer-observar (onde fica claro/escuro). Começa aqui o Projeto-Vitória 2.
- **Math sidebar:** `dot(N,L)` — **recuperação ativa** (predizer-antes-de-revelar: "o `dot` de uma
  face virada de costas pra luz dá quanto?") reativando M8, não re-explicando; por que `max(...,0)`
  (luz não fica negativa).
- **Imagens:** SVG da normal e do vetor-luz numa superfície curva; lado claro × lado escuro.
- **Projeto-Vitória 2:** *Objeto Texturizado e Iluminado* — aluno combina malha + textura + luz numa
  cena autoral; exporta imagem / copia shader.
- **Professor:** rubrica (usa malha + textura + luz; ≥2 dos 3).

### Módulo 11 — 🏗️ Por Baixo do Capô II: Hardware Fixo
- **Objetivo:** Aluno entende que parte do pipeline NÃO é shader — é hardware dedicado, e por que isso
  importa pra velocidade.
- **Conceitos (ancorar cada termo no que o aluno JÁ fez — minimizar termos novos):** rasterização
  (transformar triângulos em fragmentos) é hardware fixo — **ligar ao pipeline do M7**; **TMU**
  (buscar texel tem circuito próprio) — **ligar ao `texture2D` do M9**; **Z-buffer/ROP** (decidir o
  que está na frente e escrever o pixel) — ancorar em "quem está na frente ganha". Shaders = parte
  programável; o resto = "fábrica fixa". Nada de termo novo solto.
- **Analogia (Gemini):** a linha de montagem tem estações programáveis (shaders) e estações fixas
  (rasterizador, TMU, ROP) — tão otimizadas que viraram circuito.
- **Fonte:** Gemini (TMU/ROP, hardware fixo).
- **Demos:** visualização conceitual (não-shader ou shader simples) do triângulo virando fragmentos;
  ideia do Z-buffer (quem está na frente ganha). Sem pixel-diff.
- **Math sidebar:** —
- **Imagens:** SVG do pipeline com partes programáveis × fixas destacadas. [IMAGEM: diagrama de GPU].
- **Professor:** amarra o Marco 2 — fecha o "curso médio". Conecta com M6 (paralelismo) e prepara
  Marco 3 (compute/otimização).

## 6. Mapeamento de fontes (transcrições → módulos)
| Transcrição | Módulo |
|---|---|
| #007 MVP, #023/#024 pipeline | M7 |
| #026, #027, #063 vetores/coordenadas | M8 |
| #011 texturas | M9 |
| #021 normais, #040–#042 luz difusa | M10 |
| Gemini (TMU/ROP/hardware fixo) | M11 |

## 7. Build (decomposição) — fatia vertical primeiro
1. **Fatia vertical:** motor modo `mesh` (geometry.js, mat4.js, setupMesh em gl.js, auto-uniforms,
   withHeader p/ mesh, texture loading) + **Módulo 7** (cubo girando). Verificar no navegador
   (renderiza + anima + console limpo) antes de seguir. Testes node: geometry, mat4, config.
2. M8 (reusa fragment + pixel-diff do dot).
3. M9 (texture loading + cena mesh).
4. M10 (luz difusa + Projeto-Vitória 2).
5. M11 (conceitual, fecha o marco).
Cada módulo: HTML Head First + guia do professor + SVGs + testes + verificação no Chrome + commit.

## 8. Fora de escopo (não-objetivos)
- Loader de modelos (OBJ/GLTF), múltiplas malhas numa cena.
- Câmera orbital / controles de mouse 3D.
- Múltiplas luzes, sombras, PBR, specular (specular é Marco 3).
- Aluno escrevendo álgebra de matriz à mão.
- WebGL2 / extensões (alvo é WebGL1, hardware de escola).
- Pixel-diff de cena 3D iluminada.

## 9. Riscos e mitigações
- **Matriz assusta:** caixa-preta + M8 de intuição. Aluno só multiplica `u_mvp * pos`. **Dívida
  registrada:** o buraco NÃO se abre dentro do Marco 2 (matriz não reaparece aqui); SE o Marco 3
  exigir manipular matriz, o andaime terá de ser retirado lá — anotar no risco do Marco 3.
- **WebGL1 NPOT/textura:** usar CLAMP_TO_EDGE + LINEAR sem mipmap; texturas de exemplo potência-de-2.
- **Pixel-diff 3D frágil:** política §4 — só onde é determinístico/2D; resto é predizer-observar + projeto.
- **mat4/geometry com bug silencioso (não pego por teste node):** verificar a fatia vertical no
  navegador (objeto correto, gira certo, sem erro GLSL) — lição reincidente do Marco 1.
- **Escopo grande (5 módulos + motor 3D):** fatia vertical primeiro; cada módulo é um ciclo
  verificado+commitado, como no Marco 1.

## 10. Git
Branch opcional `feat/marco2-mesh` ou direto em `main` (como o Marco 1 acabou indo). Um commit por
fatia/módulo, mensagem Conventional Commits, push ao final de cada.
