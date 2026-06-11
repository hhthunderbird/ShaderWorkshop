# Polimento do Curso (pós-auditoria) — Design

**Data:** 2026-06-11. **Pré-requisito:** Curso 14/14 completo + Tier A da auditoria já aplicado (commits até `466783a`).
**Origem:** auditoria integral (5 lentes: código, exatidão técnica, didática-neuro, texto, lacunas). Tier A (correções diretas) FEITO. Este spec cobre **Tier B + C**.

## 1. Escopo e objetivo

Fechar as lacunas de **onboarding/base** e os **ajustes didáticos** apontados pela auditoria, SEM adicionar currículo novo além de um Módulo 0 de orientação. O curso continua 14 módulos de conteúdo; o Módulo 0 é **pré-curso** (orientação da ferramenta + alfabetização mínima de leitura de código), não um 15º módulo de conteúdo.

Mantém tudo: Head First PT-BR, ensino médio, zero programação, web vanilla WebGL1/GLSL ES, componente `ShaderPlayground`, camada do professor.

## 2. Princípio mestre (reforçado, com um aviso)

**Esconder a maquinaria; ensinar o efeito.** O Módulo 0 é o ponto de maior RISCO desse princípio: uma página de "onboarding" que despeja sintaxe vira uma aula de GLSL e **espanta exatamente o aluno zero-programação que ela existe pra resgatar**.

**Regra dura do Módulo 0:** ele é **interativo-primeiro**. A espinha é "clique nesse playground seguro e veja o que muda". O glossário de sintaxe é um **cartão de referência colapsável, pra LER não escrever**, enquadrado como "se ficar curioso sobre um símbolo". Implementador que escrever o Módulo 0 como "lição de sintaxe GLSL" errou o módulo.

## 3. Componentes

### 3.1 Módulo 0 — "Comece aqui: o Playground" (`site/modulos/00-comecando.html`, novo)
Objetivo: orientar a ferramenta + dar alfabetização mínima de LEITURA de código antes do M1.
- **Tour interativo (espinha):** um `<shader-playground>` real, trivial e editável (ex.: um fragment que pinta uma cor sólida com 1 região editável), pra o aluno clicar com segurança. Texto aponta cada controle: ▶ Test Drive (roda o que você escreveu), ↺ Reset (volta ao original), ✓ Conferir (compara com o alvo, quando o exercício tem um), 💡 Mostrar solução, 🔁 Ver em HLSL. Mostra onde é o canvas (resultado) e onde é o editor.
- **Contrato dos markers editáveis:** "você só mexe entre `// >>> EDIT` e `// <<< EDIT`; o resto (cinza) é o motor."
- **Glossário "Lendo uma linha pela 1ª vez" (`<details class="sidebar">`, colapsado, pra ler não escrever):** cobre EXATAMENTE os tokens que a 1ª tarefa do M1 exige — `float` (um número), `vec3(r,g,b)` (trio de números = uma cor), `step` (função degrau, vista de novo no M3), `mix` (mistura entre dois valores) — mais os 3 estruturais: `void main(){ }` (a receita que roda pra cada pixel), `;` (fim de uma instrução), `gl_FragColor` (a cor que sai). Enquadramento: "não precisa decorar — é só pra você reconhecer quando ler."
- **Cuidado! de debugging:** "se a tela ficar preta/cinza ou aparecer ⚠ ERROR, é quase sempre erro de digitação. ↺ Reset restaura o código original; 💡 Mostrar solução mostra a resposta certa. Erro mais comum: faltou um `;` no fim da linha ou um parêntese."
- **Tom:** acolhedor, "não tem pergunta idiota", curtíssimo. Dispositivos Head First usados de leve.
- **Motor: ZERO mudança.** Usa o playground existente com um fragment trivial.

### 3.2 Estrutura / numeração (decidido aqui, não no plano)
- Breadcrumb do M0: **"Comece aqui · Módulo 0"** — **NÃO renumerar os 14**. Os breadcrumbs "Módulo N de 14" e o banner "14/14" continuam válidos; M0 é orientação pré-curso.
- M1 ganha back-nav pro M0 (ou o M0 é o único com "Próximo → M1"; M1 mantém "← Mapa do curso" e pode ganhar "← Comece aqui (M0)").
- `index.html`: entrada "Comece aqui — Módulo 0" **acima** do Marco 1.
- Teste de integração afere a cadeia nova: M0 existe, tem playground, tem o glossário (tokens-chave), tem o Cuidado! de debugging, linka M1; e `index` linka o M0.

### 3.3 Ajustes didáticos (módulos existentes)
- **M7 (`07-vertices-e-pipeline.html`):** adicionar `<h2>` numerados de sub-bloco ("1. A malha", "2. Dois trabalhadores", "3. O pipeline") pra o aluno solo enxergar onde pausar; adicionar um `<div class="afie">` antes do `pg-cubo` com previsão: "o cubo tem 8 cantos (vértices). Por quadro: o vertex shader roda quantas vezes? E o fragment (que roda por pixel)?". Sem mudança de motor.
- **M10 (`10-normais-e-luz.html`):** adicionar um exercício **predict-observe** ANTES do Projeto-Vitória — um `<shader-playground>` com a linha da difusa numa região editável, com `solution` definida e critério qualitativo na prosa ("se a esfera ganhar um lado claro virado pra luz e um lado escuro, você acertou"). **SEM `reference`/pixel-diff** (política §4 do Marco 2 — cena 3D não tem pixel-diff). O motor já dá Test Drive + Reset + Mostrar solução quando há `solution` sem `reference` (botão Conferir só aparece com `reference`). Fecha o buraco de feedback na metade difícil sem reabrir fragilidade cross-GPU.
- **M12 (`12-luz-especular.html`):** adicionar um checkpoint de consolidação (`<div class="brain">` ou `afie`) entre a apresentação do half-vector H e a receita completa: "o `dot(N,H)` alto significa que a normal aponta quase pra H. Isso deixa o brilho **grande ou pequeno**? E com `pow` de expoente alto?". **Dobrar aqui o fix menor da data:** o texto diz brilho usado "dos anos 80" — Blinn-Phong é de **1977**; corrigir pra "desde os anos 1970" ou "desde 1977" (in-file, sem scope creep).
- **M14 (`14-otimizacao.html`):** adicionar seção **"E agora? Próximos passos"** perto do fechamento — aponta caminhos reais: Shadertoy (playground GLSL no navegador), WebGPU (compute de verdade), Unity Shader Graph / HLSL (a ponte que o curso prometeu), e 1–2 links de referência. 4–5 bullets, zero conceito novo.
- **`cos` (M3 ou M8):** uma frase no `<details class="sidebar">` de matemática: "o `cos` é a mesma onda do `sin`, só começa num ponto diferente — `cos(0) = 1`, `sin(0) = 0`." (`cos` aparece em código travado a partir do M8 sem nunca ser explicado.) Decisão: colocar no **M8** (primeiro uso real em código que o aluno vê).
- **`zbuffer.svg` (M11):** substituir o placeholder `[IMAGEM: die de GPU]` (`.img-todo`) do M11 por um SVG real: dois retângulos sobrepostos vistos de lado/cima, com rótulos de profundidade (`z=0.3` perto, `z=0.8` longe), um pixel disputado, legenda "z menor ganha — o da frente aparece". (Visualiza o conceito que hoje é só texto.)

## 4. Testes
- **M0:** novo `test/module0.integration.test.js` — página existe, tem `<shader-playground>`, contém os tokens do glossário (`void main`, `gl_FragColor`, `vec3`, `float`, `step`, `mix`), tem `class="cuidado"` (debugging), linka `01-shaders-e-gpu.html`; `index.html` linka `00-comecando.html`.
- **M7/M10/M12/M14:** estender os testes de integração existentes (ou criar asserts) pros novos elementos (sub-blocos `<h2>` do M7; o `pg-` do exercício do M10 com `solution` e SEM `reference:`; o checkpoint do M12; a seção "Próximos passos"/"E agora" do M14).
- **Gate de navegador (obrigatório por shader NOVO):** os testes node são **cegos a compilação GLSL** (provado 2× nesta sessão: o fix de precision e o `u_lang`/`u_dureza` passaram 100% dos testes node com canvas preto). Portanto o **demo do Módulo 0** e o **exercício predict-observe do M10** são shaders NOVOS → cada um exige verificação no Chrome (renderiza + sem erro de console), não só `npm test`. O plano deve cravar esse gate por shader novo.

## 5. Build (decomposição) — fatia por fatia, cada uma verificada
1. **Módulo 0** (página + glossário + tour + index + nav M0↔M1 + teste). Verificar no Chrome (demo do tour compila e responde ao editar). Commit.
2. **M7** (sub-blocos + afie). Commit.
3. **M10** (exercício predict-observe). **Verificar no Chrome** (shader novo compila, esfera acende, Mostrar-solução aplica). Commit.
4. **M12** (checkpoint + fix data). Commit.
5. **M14** ("E agora?"). Commit.
6. **M8** (`cos`) + **M11** (`zbuffer.svg`). Commit.
Cada fatia: edição + teste node + (quando há shader novo) Chrome + commit. Subagent-driven com revisão, como nos marcos.

## 6. Fora de escopo (deferidos — decisão registrada, não vazamento)
- **Transparência / alpha-blending:** alpha-como-valor já explicado no M1. Transparência de verdade precisa de `gl.BLEND` + backdrop visível no motor pra ensinar honesto (senão alpha só "escurece" contra o preto = intuição errada). Candidata a **Módulo 15 futuro**, não a este pass.
- **Cegueira de GLSL nos testes (achado de engenharia de maior valor da auditoria):** o suite node não compila GLSL → erros de shader só aparecem no navegador. Merece **task futura própria**: um smoke test headless (puppeteer/playwright) que compila cada shader dos módulos e falha no console error — encerraria a dependência de verificação manual carregada a cada módulo.
- **Vazamentos de VBO/shader-object** a cada recompile (`gl.js` não chama `deleteBuffer`/`deleteShader`) — limitado a uma sessão; deferido.
- **Fotos reais de GPU** (placeholders `[IMAGEM:]` em M1 e M6) — usuário fornece; não bloqueia.
- **Exercício de padrão de linha no M4** (fonte #014 do spec, nunca construído) — menor.
- **Nota de aspect-ratio no M4** (círculos distorcem em canvas não-quadrado; o playground é quadrado) — menor.
- **Sidebars "Dois sotaques" (HLSL) somem após M4** — o botão do toggle continua em todo módulo; só a prosa lateral fade. Menor.

## 7. Riscos e mitigações
- **Módulo 0 vira aula de sintaxe e espanta o iniciante:** §2 regra dura — interativo-primeiro, glossário colapsável "ler não escrever", cobre só os tokens da 1ª tarefa do M1. Verificar o tom no review didático.
- **Renumeração acidental:** §3.2 — M0 é pré-curso, NÃO mexe nos "de 14" nem no "14/14".
- **Shader novo quebra só no navegador:** §4 gate de Chrome por shader novo (M0, M10).
- **Exercício do M10 reabrir pixel-diff 3D:** proibido — é predict-observe (sem `reference`), só Mostrar-solução.

## 8. Git
Direto em `main` (como o resto do curso). Um commit por fatia, Conventional Commits, push ao fim de cada.
