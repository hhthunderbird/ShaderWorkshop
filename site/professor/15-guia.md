# Guia do Professor — Módulo Bônus: Decifrando a Placa de Vídeo

**Tempo estimado:** 1 aula. **Bônus/opcional** (pós-curso, não conta nos 14 módulos). **Conceitual** (sem exercício/pixel-diff).
**Pré-requisito:** M14 completo (ou qualquer ponto do curso como gancho motivador).

## Objetivos de aprendizagem
- Conectar a arquitetura da GPU (núcleos, memória, hardware fixo) ao que o aluno já estudou (M1–M14).
- Introduzir VRAM (espaço) vs. banda de memória (velocidade) — conceito não coberto nos módulos regulares.
- Capacitar o aluno a ler e interpretar a ficha técnica de uma GPU de jogos com as próprias palavras.

## Quando usar
- **Depois do M14:** fechamento natural, motivador ("agora você entende a máquina toda").
- **Gancho motivador no início do curso:** mostra pro aluno por que vale aprender — cada linha da ficha vai fazer sentido ao final.
- **Aula avulsa de orientação vocacional:** para quem quer entender hardware de jogos sem programar.

## Roteiro sugerido
1. (5 min) Mostre a ficha técnica real de uma GPU de jogos (qualquer uma da geração atual). Pergunte: "o que cada linha significa?"
2. (10 min) Percorra o loop shader→GPU→jogo (SVG da página): a tela é redesenhada 60× por segundo, e cada frame chama shaders nos núcleos da GPU.
3. (8 min) VRAM × Banda: use a analogia do armazém e da esteira. Destaque que VRAM é espaço (não velocidade) e que gargalo de banda é um problema diferente de "pouca VRAM".
4. (12 min) Ficha técnica linha por linha: peça os alunos a clicar cada `<details>` e apontar em qual módulo viram aquele conceito.
5. (5 min) Caça ao par + fechamento.

## Pontos de tropeço comuns
1. **"Mais VRAM = mais FPS"** — não. VRAM é espaço de armazenamento; o que vira FPS são núcleos, banda e clock. Reforce com a analogia: um armazém enorme não ajuda se a esteira for lenta.
2. **Confundir VRAM (espaço, GB) com banda (velocidade, GB/s)** — são métricas completamente diferentes. Um aparelho pode ter muita VRAM e banda baixa (ou vice-versa).
3. **Achar que RT e Tensor cores fazem "tudo"** — são unidades especializadas; o grosso ainda são os núcleos comuns rodando shaders.
4. **"CUDA core vs. Stream processor"** — fabricantes diferentes, mesmo conceito. Ancore no GLSL × HLSL que o aluno já viu no curso.

## Gabarito da caça ao par
- CUDA core → B (núcleo paralelo que roda o shader, M6)
- TMU → A (busca textura, M9)
- ROP → C (escreve o pixel final, M11)
- VRAM → D (armazém de texturas)
- RT core → E (ray tracing, luz realista)
- Tensor core → F (contas de IA/upscaling, M13)

## Avaliação sugerida
Peça ao aluno que pegue a ficha técnica de uma GPU real (de qualquer loja online) e explique, com as próprias palavras, pelo menos 3 linhas — citando o módulo do curso em que viu aquele conceito. Rubrica: identifica corretamente o componente (1pt por item), liga ao módulo certo (1pt por item), usa linguagem própria sem copiar o texto do módulo (1pt geral).
