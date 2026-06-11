# Curso de Pipeline Gráfica, Arquitetura de GPU e Shaders — Ensino Médio

**Data:** 2026-06-10
**Status:** Design aprovado (aguardando revisão do spec)
**Escopo deste spec:** Arquitetura técnica reutilizável + **Marco 1** módulo-a-módulo. Marcos 2–3 em esboço (viram spec próprio depois).

---

## 1. Visão geral

Curso introdutório de **pipeline gráfica, arquitetura de GPU e shaders** para alunos de **ensino médio** (PT-BR, ~zero de programação). Entregue como **site interativo estático** (HTML/CSS/JS, sem build, roda offline) com demos WebGL embutidos.

### Público
- Alunos de ensino médio brasileiro.
- Pré-requisito de programação: **nenhum**. Pré-requisito de matemática: álgebra básica + noção de plano cartesiano; vetores/trigonometria **não assumidos** (pontes de math dedicadas).

### Objetivo (misto progressivo)
Começa por letramento/visual (pintar pixels com código, recompensa imediata) e evolui até escrever shaders simples de verdade (cor, padrão, animação, textura, luz). Arquitetura de GPU e pipeline são **tópicos de primeira classe**, não temperos.

### Método pedagógico: Head First (O'Reilly)
Baseado em neurociência de aprendizagem (Kathy Sierra & Bert Bates): o cérebro filtra o que parece "não-importante"; o método derrota o filtro com **visual + tom conversacional + emoção + novidade + esforço ativo + redundância + repetição**. Ver §3 (dispositivos obrigatórios por módulo).

---

## 2. Arquitetura técnica

### 2.1 Princípio mestre (não-negociável)
**Um único componente de playground de shader, config-driven.** Demos NÃO são HTML artesanal por lição — são instâncias do mesmo widget, configuradas por um objeto. Isto é o que torna "web próprio" viável com 14 módulos.

### 2.2 Componente: `ShaderPlayground`
Widget JS embutível. Configurado por objeto declarativo. **Dois modos** (necessário pra cobrir o pipeline, não só fragment):

- **Modo `fragment`** — quad fullscreen, só fragment shader. Modelo mental "pinte 1 pixel". Usado nos Marcos 1 e início do 2.
- **Modo `mesh`** — malha simples (quad, cubo, esfera) + vertex shader + fragment shader. Mostra vértice→rasterização→fragmento *acontecendo*. Necessário pra MVP, normais, vertex animation, iluminação.

**Capacidades:**
- Editor de GLSL ES com **regiões editáveis** marcadas (resto travado, pra iniciante não quebrar tudo).
- **Uniforms-as-sliders**: a config declara uniforms (tempo, mouse, floats, cores) e o widget gera controles automáticos.
- Canvas ao vivo, atualização em tempo real.
- Botões: **Reset**, **Mostrar solução**, **Test Drive** (rodar).
- **Checagem de exercício** por **pixel-diff contra imagem-referência** com tolerância (resolve "exercício autocorrigido" do autoestudo). Verde quando o aluno chega perto o suficiente.

**Alvo técnico:**
- **WebGL1 / GLSL ES 1.00** (PC e Chromebook de escola, GPU integrada). Não assumir WebGL2.
- Degradação graciosa: mensagem clara se WebGL indisponível.
- Sem dependências de build. Vanilla JS. Funciona via `file://` (offline).

### 2.3 Esqueleto de página da lição (Head First)
Cada módulo é uma página que monta os dispositivos da §3. Estrutura padrão:
1. Abertura com gancho emocional/curiosidade (efeito "uau" ou pergunta intrigante).
2. Prosa conversacional (1ª/2ª pessoa) intercalada com diagramas anotados.
3. Playground(s) embutidos como "Test Drive".
4. Dispositivos Head First distribuídos (afie-o-lápis, Brain Power, Q&A, Cuidado!).
5. **Sidebars de matemática** colapsáveis (não bloqueiam quem já sabe; salvam quem esqueceu).
6. **Bullet Points** (resumo).
7. Recordação lúdica (cruzadinha/code magnets).
8. Ponte para o próximo módulo.

### 2.4 Camada do professor (híbrido)
Por módulo, página/markdown separado e togglável: **objetivos de aprendizagem, roteiro de condução, pontos de tropeço comuns, gabarito dos exercícios, sugestão de avaliação, tempo estimado.** O site funciona 100% sem ela (autoestudo); ela existe por cima pra aplicação em sala.

### 2.5 Política de imagens
- **Diagramas conceituais:** gerados como **SVG inline estilo desenhado à mão** (setas, notas manuscritas) — viram asset direto no repositório, sem download.
- **Visuais que dependem de shader:** são os próprios playgrounds ao vivo.
- **Imagens que não dá pra gerar** (foto de chip/GPU real, screenshot de jogo comercial, foto de pessoa real): inserir bloco-placeholder no local exato:
  ```
  [IMAGEM: <descrição do que deve aparecer>]
  Fonte sugerida: <link>
  ```
  O usuário baixa e cola no ponto marcado. Todo placeholder fica rastreável por busca de `[IMAGEM:`.

### 2.6 Estrutura de arquivos (proposta)
```
/curso/
  index.html                 # capa + mapa dos 3 marcos
  /assets/
    playground.js            # componente ShaderPlayground (2 modos)
    playground.css
    headfirst.css            # estilo dos dispositivos (Q&A, sidebars, etc.)
    /meshes/                 # malhas simples (quad, cubo, esfera) em JSON
    /img/                    # SVGs gerados + imagens coladas pelo usuário
    /ref/                    # imagens-referência dos exercícios (pixel-diff)
  /modulos/
    01-shaders-e-gpu.html
    02-pixel-e-cor.html
    ... (um por módulo)
  /professor/
    01-guia.md ...           # camada professor
```

---

## 3. Dispositivos Head First obrigatórios

Cada módulo DEVE conter, no mínimo:
- **≥1 "Afie o lápis"** — exercício de esforço ativo (prever resultado, completar código, desenhar).
- **≥1 "Brain Power"** — provocação que força o aluno a pensar antes de continuar.
- **"Não existe pergunta idiota"** — caixa Q&A com as dúvidas reais que surgem ali.
- **"Cuidado!"** — pegadinha/erro comum daquele tópico.
- **Bullet Points** — resumo ao fim.
- **1 recordação lúdica** — cruzadinha, caça-palavras OU **code magnets** (montar shader arrastando/ordenando linhas embaralhadas).
- Tom conversacional, diagramas anotados, ≥1 playground Test Drive.
- Redundância: cada conceito-chave aparece **visual + verbal + cinestésico** (mexer no playground).

Personagens/mascotes recorrentes nas margens (cérebro atende a rostos). Repetição espaçada: conceitos retornam entre módulos.

---

## 4. Estrutura de módulos (marcos aninhados)

Marcos aninhados: completar o Marco 1 já é um "curso curto" coerente; +Marco 2 = "curso médio"; +Marco 3 = "curso longo". **Cada marco fecha com um Projeto-Vitória tangível e compartilhável** — parar ali sente-se completo.

### MARCO 1 — "Pinte o Pixel" (curso curto, 6 módulos)
**Projeto-Vitória:** *Meu Padrão Animado* — o aluno cria um padrão colorido animado autoral e o exporta (imagem/GIF ou link local) para compartilhar.

> **Detalhamento completo de cada módulo do Marco 1 está na §5.** Resumo:
> 1. Shaders & a GPU
> 2. O Pixel e a Cor
> 3. Matemática que Vira Imagem
> 4. Formas e Padrões
> 5. Dando Vida: Animação
> 6. 🏗️ Por Baixo do Capô I: Paralelismo

### MARCO 2 — "Superfícies de Verdade" (curso médio, +5 módulos) — ESBOÇO
**Projeto-Vitória:** *Objeto Texturizado e Iluminado* — esfera/objeto 3D com textura e luz difusa.
7. **Saindo do Quad: Vértices & Pipeline** — playground modo-mesh, vertex shader, matriz MVP, rasterização. Fontes: transcr. #007 (MVP), #023/#024 (pipeline). Analogia Gemini: linha de montagem detalhada.
8. 🧮 **Vetores & Coordenadas** (módulo-ponte de matemática visual) — pontos×vetores, produto escalar, espaços de coordenadas. Fontes: #026, #027, #063.
9. **Texturas & UV** — texture mapping, sampling. Fonte: #011.
10. **Normais & Luz Difusa** — normais, `dot(N,L)`. Fontes: #021, #040–#042.
11. 🏗️ **Por Baixo do Capô II: Hardware fixo** — rasterização, TMU (textura é hardware dedicado), Z-buffer/ROP. Fonte: Gemini (TMU/ROP, hardware fixo).

### MARCO 3 — "O Poder da GPU" (curso longo, +3 módulos) — ESBOÇO
**Projeto-Vitória:** *Efeito Autoral* — combina aprendizados num efeito visual próprio.
12. **Luz Especular & Brilho** — specular, half-vector. Fontes: #044–#046.
13. **Para Além de Pixels: Compute Shaders (noção)** — GPU como calculadora paralela gigante; partículas simples. Fonte: Gemini (compute; `numthreads`/dispatch explicado como "esquadrões"). Conceitual + demo.
14. 🏗️ **Por Baixo do Capô III: Otimização** — warps/wavefronts **simplificado**, branch divergence (intuição), `half`×`float`. Fonte: Gemini (warps, branch divergence, precisão).

---

## 5. Marco 1 — detalhamento módulo-a-módulo

Formato por módulo: **Objetivo · Conceitos · Analogia · Fonte · Demos (playground) · Math sidebar · Imagens · Nota professor.** Dispositivos Head First da §3 são implícitos em todos.

### Módulo 1 — Shaders & a GPU
- **Objetivo:** Aluno entende o que é um shader e por que a GPU existe; faz sua primeira alteração de cor ao vivo.
- **Conceitos:** Shader = programinha que roda na placa de vídeo. CPU (poucos núcleos, sequencial) × GPU (milhares de núcleos, paralelo). Pixel/fragmento.
- **Analogia (Gemini):** *Linha de montagem de fábrica* — dado bruto entra, imagem sai. Semente do paralelismo: "milhares de pintores ao mesmo tempo".
- **Fonte:** transcr. #003 (What is Shader), #004 (Working of a Shader).
- **Demos:** `fragment`, shader trivial `gl_FragColor = vec3(R,G,B)` com 3 sliders de cor. Test Drive: muda a cor da tela inteira.
- **Math sidebar:** "O que é RGB?" (cor = 3 números de 0 a 1).
- **Imagens:** SVG CPU-vs-GPU (poucos núcleos grandes × muitos pequenos). `[IMAGEM: foto real de uma GPU/placa de vídeo]` — Fonte sugerida: Wikimedia Commons "graphics card".
- **Professor:** abrir com pergunta "como um jogo desenha 2 milhões de pixels 60×/seg?".

### Módulo 2 — O Pixel e a Cor
- **Objetivo:** Aluno pinta cada pixel em função da sua posição (coordenadas), criando um gradiente.
- **Conceitos:** Coordenadas UV (0..1 na tela), cada fragmento sabe onde está, cor a partir da posição. `gl_FragCoord`/uv.
- **Analogia:** mapa de assentos do cinema — cada poltrona (pixel) tem um endereço (linha, coluna).
- **Fonte:** #012 (Gradient Pattern).
- **Demos:** `fragment`, `color = vec3(uv.x, uv.y, 0.0)`. Região editável: a expressão da cor. Exercício pixel-diff: "faça um gradiente vermelho→azul horizontal".
- **Math sidebar:** plano cartesiano e intervalo [0,1]; normalização.
- **Imagens:** SVG de grade de pixels com eixos UV anotados.
- **Professor:** tropeço comum — confundir pixel (tela) com coordenada normalizada.

### Módulo 3 — Matemática que Vira Imagem
- **Objetivo:** Aluno usa funções (`step`, `smoothstep`, `sin`, `fract`) pra criar transições e ondas.
- **Conceitos:** funções mapeiam número→número; bordas duras (`step`) × suaves (`smoothstep`); `sin` pra ondulação; `fract` pra repetição.
- **Analogia:** interruptor (step) × dimmer (smoothstep).
- **Fonte:** #013 (Wave Functions), #017 (Smoothstep).
- **Demos:** `fragment` com gráfico ao vivo da função + resultado na tela. Sliders pros parâmetros.
- **Math sidebar (peso maior):** o que é uma função; seno visualizado como onda; por que `fract` repete.
- **Imagens:** SVG de curvas (step vs smoothstep vs sin) anotadas.
- **Professor:** este módulo carrega bastante matemática — reservar tempo; usar o gráfico ao vivo intensamente.

### Módulo 4 — Formas e Padrões
- **Objetivo:** Aluno desenha círculo, linha e combina formas (união/interseção).
- **Conceitos:** distância ao centro = círculo; máscara/threshold; combinar formas com `min`/`max` (noção SDF simplificada).
- **Analogia:** carimbos que se sobrepõem (união) ou só onde encostam (interseção).
- **Fonte:** #014 (Line Pattern), #015 (Union/Intersection), #016 (Circle Pattern).
- **Demos:** `fragment`, círculo via `length(uv-centro)`. Exercícios pixel-diff: "desenhe 2 círculos que se cruzam".
- **Math sidebar:** distância (Pitágoras/`length`).
- **Imagens:** SVG de círculo com raio e distância anotados; diagrama união×interseção.
- **Professor:** code magnets — montar o shader do círculo a partir de linhas embaralhadas.

### Módulo 5 — Dando Vida: Animação
- **Objetivo:** Aluno anima seus padrões usando o tempo.
- **Conceitos:** uniform = valor que a CPU manda pra GPU todo frame; `u_time`; animar deslocando/pulsando padrões.
- **Analogia:** o relógio da sala que todos os pintores olham ao mesmo tempo.
- **Fonte:** #019 (Pattern Animation).
- **Demos:** `fragment` com `u_time`; padrão que se move/pulsa. Playground do **Projeto-Vitória** começa aqui.
- **Math sidebar:** usar `sin(tempo)` pra oscilar entre valores.
- **Imagens:** SVG do fluxo CPU→(u_time)→GPU.
- **Projeto-Vitória 1:** *Meu Padrão Animado* — aluno combina cor + forma + função + tempo num padrão autoral; pode exportar/compartilhar.
- **Professor:** rubrica de avaliação do projeto (usa ≥3 conceitos do marco).

### Módulo 6 — 🏗️ Por Baixo do Capô I: Paralelismo
- **Objetivo:** Aluno entende *por que* tudo que fez é absurdamente rápido — primeiro mergulho de arquitetura.
- **Conceitos:** o mesmo fragment shader roda pra milhões de pixels **simultaneamente**; cada fragmento é independente (não conversa com o vizinho); por isso a GPU usa milhares de núcleos. Intro à ideia SIMT **sem** termo "warp" ainda.
- **Analogia (Gemini):** *exército de pintores* — em vez de 1 pintor pintando pixel a pixel (CPU), milhares pintam ao mesmo tempo, cada um no seu quadradinho.
- **Fonte:** Gemini (modelo SIMT simplificado, paralelismo maciço).
- **Demos:** visualização (não-shader ou shader) mostrando muitos núcleos "acendendo" juntos; comparar 1 núcleo (lento) × muitos (instantâneo).
- **Math sidebar:** —
- **Imagens:** SVG exército de pintores × pintor solo. `[IMAGEM: diagrama/foto de núcleos CUDA ou die-shot de GPU]` — Fonte sugerida: site da NVIDIA/AMD ou Wikimedia "GPU die".
- **Professor:** amarra o Marco 1 — "vocês escreveram código que roda em milhares de núcleos". Fechamento do curso curto.

---

## 6. Mapeamento de fontes

### 6.1 Transcrições → módulos
| Transcrição | Módulo |
|---|---|
| #003 What is Shader, #004 Working | M1 |
| #012 Gradient | M2 |
| #013 Wave, #017 Smoothstep | M3 |
| #014 Line, #015 Union/Intersection, #016 Circle | M4 |
| #019 Pattern Animation | M5 |
| #007 MVP, #023/#024 Pipeline | M7 |
| #026 Points/Vectors, #027 Vector Mult, #063 Coord Spaces | M8 |
| #011 Texture Mapping | M9 |
| #021 Normals, #040–#042 Diffuse | M10 |
| #044–#046 Specular | M12 |

> Transcrições são HLSL/Unity → **fonte conceitual apenas**. Todo código é **reescrito em GLSL ES**. Não há copy-paste.

### 6.2 Analogias Gemini → conceitos (espinha Head First)
| Analogia | Conceito | Onde |
|---|---|---|
| Linha de montagem de fábrica | Pipeline gráfico | M1 (semente), M7 (completo) |
| Exército / batalhão / soldado | Threads / grupos / thread individual | M6, M14 |
| Fila de banco (senha) | Operações atômicas | M13/M14 (só se chegar lá) |
| Armazém × mesa de trabalho | Hierarquia de memória (VRAM × cache) | M11, M14 |
| Relógio da sala | Uniform compartilhado | M5 |

---

## 7. Fora de escopo (não-objetivos)
- Wave intrinsics, indirect drawing, stream compaction, TBDR/framebuffer fetch (nível faculdade — ficam fora; no máximo citados como "existe um nível além").
- BRDF, IBL, refração, shadow mapping (transcrições #050+ não usadas no currículo).
- Unity/HLSL como ferramenta do aluno (só fonte conceitual).
- Backend/contas/login/persistência em nuvem (projetos exportam localmente).

## 8. Riscos e mitigações
- **Esforço de build alto** (14 mód × conteúdo rico). → Decomposição por marco; este spec entrega só arquitetura + Marco 1.
- **Reescrita GLSL ES** de todo código. → Aceito; transcrição é conceitual.
- **Pixel-diff de exercício** com falso-negativo (aluno certo marcado errado). → Tolerância calibrada + sempre permitir "Mostrar solução".
- **WebGL em hardware fraco.** → Alvo WebGL1, degradação graciosa, malhas mínimas.
- **Matemática estourando sidebar.** → M8 é módulo-ponte dedicado; M3 reserva tempo extra.

## 9. Decomposição (próximos ciclos)
- **Agora (este spec):** Arquitetura (§2/§3) + Marco 1 (§5).
- **Depois:** Marco 2 → spec próprio → plano → build. Marco 3 → idem. Cada um após o anterior estar pronto e testado.

## 10. Git
`C:\Projetos\ShaderWorkshop` não é repositório git. Spec salvo como arquivo. Inicializar git é opcional (recomendado antes do build, pra versionar o curso).

---

## Adendo (2026-06-10): Toggle GLSL ES ⇄ HLSL

Decisão aprovada pelo usuário: o curso usa **GLSL ES** (exigência do navegador), mas a diferença pra **HLSL (Unity)** deve ficar **clara no material**, e cada playground ganha um **toggle "🔁 Ver em HLSL"**.

- **Motor:** módulo puro `site/assets/playground/translate.js` (`translateToHLSL`) — mapa de tokens do subconjunto: `vecN→floatN`, `matN→floatNxN`, `mix→lerp`, `fract→frac`, `mod→fmod`, `texture2D→tex2D`, `gl_FragColor = X;→return X;`, remove `precision`/`uniform`. Função pura, unit-testada.
- **É um GUIA ILUSTRATIVO, não compilador.** Read-only ("não roda aqui"). Funciona bem nos snippets simples (Marco 1). Para shaders com I/O estrutural (vertex, semantics, samplers — Marco 2+), fornecer HLSL **curado** via `config.hlsl` (override do tradutor automático).
- **Conteúdo:** sidebar "Dois sotaques, mesma língua" no Módulo 1 com tabela de equivalência + nota sobre `mod`≠`fmod` em negativos. Replicar o explicador nos marcos seguintes.
- **Pegadinha conhecida:** `varying` não tem equivalente direto em HLSL (vira membro de struct com semantic); o tradutor não trata — só aparece se o aluno declarar `varying` no próprio fragmento, o que não ocorre nos módulos iniciais (o motor injeta `v_uv` por fora).
