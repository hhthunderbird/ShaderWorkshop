# Exercício Guiado de Specular (M12) — Design

**Data:** 2026-06-11. **Pré-requisito:** M12 existente. **Item #5 do backlog (mais exercícios na metade difícil).**
**Origem:** auditoria pedagógica — M9 é o último Conferir automático; a metade difícil perde prática guiada. M10 ganhou um exercício predict-observe no polimento; **o M12 (specular) ainda só tem o projeto aberto, sem exercício guiado.** Esta é a única lacuna real de prática guiada restante.

## 1. Escopo e objetivo

Adicionar um exercício **predict-observe** de luz especular no M12, paralelo ao do M10: o aluno escreve a linha do brilho com as próprias mãos antes do Projeto-Vitória. Fecha o ciclo de prática ativa na metade difícil do curso. **Escopo mínimo: só o M12.**

## 2. Política respeitada
Cena 3D iluminada **NÃO tem pixel-diff** (fragilidade cross-GPU). O exercício é predict-observe: `Mostrar solução` + critério qualitativo na prosa; **sem `reference`/Conferir**.

## 3. Componente

Novo `<shader-playground id="pg-ex-brilho">` no `site/modulos/12-luz-especular.html`, inserido **antes** da seção `🏆 Projeto-Vitória`.
- Esfera com a **difusa pronta**; o aluno escreve só a linha do brilho.
- Região editável `brilho`: começa `float esp = 0.0;` (esfera fosca). Solução: `float esp = pow(max(dot(N, H), 0.0), u_dureza);`.
- `N`, `L`, `V`, `H`, `dif` já calculados no shader (acima da região editável). Combinação fixa: `vec3 cor = base * (0.15 + 0.85 * dif) + vec3(esp); gl_FragColor = vec4(cor, 1.0);`.
- `precision highp float;` (banding do `pow`).
- Sliders: `u_lang` (direção da luz), `u_dureza` (dureza do brilho), `u_vel` (rotação).
- `solution` definida → botão Mostrar solução; SEM `reference` → sem Conferir.
- Prosa: um `<div class="afie">` de previsão antes do playground ("o que muda quando você soma o brilho à difusa?") e o critério de acerto qualitativo ("se aparecer um ponto branco que anda com a direção da luz e encolhe quando você aumenta a dureza, você acertou. Travou? 💡 Mostrar solução.").
- Um `<h2>` curto tipo "Sua vez: adicione o brilho".

## 4. Config exata (o ponto que erra fácil)

```javascript
document.getElementById('pg-ex-brilho').config = {
  mode: 'mesh', mesh: 'sphere',
  fragment: `precision highp float;
uniform float u_lang;
uniform float u_dureza;
void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(vec3(cos(u_lang), 0.4, sin(u_lang)));
  vec3 V = normalize(u_cameraPos - v_worldPos);
  vec3 H = normalize(L + V);
  float dif = max(dot(N, L), 0.0);
// >>> EDIT: brilho
  float esp = 0.0;
// <<< EDIT
  vec3 base = vec3(0.40, 0.55, 0.90);
  vec3 cor = base * (0.15 + 0.85 * dif) + vec3(esp);
  gl_FragColor = vec4(cor, 1.0);
}`,
  solution: '  float esp = pow(max(dot(N, H), 0.0), u_dureza);',
  editableRegions: ['brilho'],
  uniforms: [
    { name: 'u_lang', label: 'direção da luz', min: 0.0, max: 6.2831, value: 0.8 },
    { name: 'u_dureza', label: 'dureza do brilho', min: 2.0, max: 128.0, value: 32.0 },
    { name: 'u_vel', label: 'rotação', min: 0.0, max: 1.5, value: 0.0 },
  ],
};
```
(`u_lang`/`u_dureza` declarados implicitamente? NÃO — são uniforms de controle; precisam ser declarados no source OU já estão no source via uso. CUIDADO: igual ao `pg-brilho`, o shader USA `u_lang`/`u_dureza` mas o motor NÃO injeta uniforms de controle. Como o `pg-brilho` resolve declarando `uniform float u_lang; uniform float u_dureza;` no topo — **este exercício deve fazer o mesmo**: adicionar essas duas declarações após `precision highp float;`. O plano explicita.)

## 5. Testes
- `test/module12.integration.test.js` (acrescenta): `pg-ex-brilho` existe; `editableRegions: ['brilho']`; a solução contém `pow(max(dot(N, H)`; o arquivo continua sem `reference:` (cena 3D).
- **Chrome** (shader novo): a esfera começa **fosca** (só difusa, sem ponto branco); `💡 Mostrar solução` adiciona o ponto de brilho; mover dureza muda o tamanho; console limpo. `npm run smoke` segue verde.

## 6. Fora de escopo
- Pixel-diff em cena 3D (política).
- Code-magnets (decidido fora deste item).
- Outros módulos (M8/M9 já têm exercício; M10 já ganhou o predict-observe).
- Mudança de motor.

## 7. Riscos
- **Uniforms de controle não-declarados** (lição da sessão do M12): o source DEVE declarar `uniform float u_lang; uniform float u_dureza;` (o motor não injeta controles). Garantido pelo plano + pego pelo smoke (compila headless).
- **Banding do pow:** `precision highp float;` no source.

## 8. Git
Direto em `main`. Um commit.
