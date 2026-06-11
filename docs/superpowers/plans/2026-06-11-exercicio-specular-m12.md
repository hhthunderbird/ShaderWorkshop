# Exercício Guiado de Specular (M12) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um exercício predict-observe de luz especular no M12 (o aluno escreve a linha do brilho), paralelo ao do M10.

**Architecture:** Conteúdo no M12 (HTML + config de playground) + 1 assert no teste de integração. Zero motor. Cena 3D → SEM pixel-diff (Mostrar-solução + critério qualitativo).

**Tech Stack:** HTML/CSS/JS vanilla, `node --test`, `npm run smoke`, Chrome MCP.

**Spec:** `docs/superpowers/specs/2026-06-11-exercicio-specular-m12-design.md`. **Baseline:** 133 testes node; smoke verde (16 módulos).

---

## Task 1: Exercício predict-observe de specular no M12

**Files:**
- Modify: `site/modulos/12-luz-especular.html` (seção + config)
- Test: `test/module12.integration.test.js` (acrescenta assert)

- [ ] **Step 1: Ler os arquivos**

Ler `site/modulos/12-luz-especular.html` (achar o `<h2>🏆 Projeto-Vitória 3: Efeito Autoral</h2>` ~linha 137 e o `<script type="module">` final ~linha 177 com os configs `pg-brilho`/`pg-projeto`) e `test/module12.integration.test.js`.

- [ ] **Step 2: Escrever o assert que falha**

Acrescentar a `test/module12.integration.test.js`:

```javascript
test('M12 tem exercicio predict-observe de specular (editavel brilho + solution), SEM pixel-diff', () => {
  const html = readFileSync('site/modulos/12-luz-especular.html', 'utf8');
  assert.ok(html.includes('id="pg-ex-brilho"'), 'falta o exercicio de specular');
  assert.ok(html.includes("editableRegions: ['brilho']"), 'falta a regiao editavel brilho');
  assert.ok(html.includes('pow(max(dot(N, H)'), 'falta a solucao do specular');
  assert.ok(!html.includes('reference:'), 'M12 e cena 3D: nenhum playground pode ter reference');
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npm test`
Expected: FAIL — o novo assert falha (exercício não existe).

- [ ] **Step 4: Inserir a seção do exercício antes do Projeto-Vitória**

Imediatamente ANTES da linha `<h2>🏆 Projeto-Vitória 3: Efeito Autoral</h2>`, inserir:

```html
  <h2>Sua vez: adicione o brilho</h2>
  <p>A esfera abaixo já tem a luz <strong>difusa</strong> (do M10), mas está <strong>fosca</strong> —
  o brilho ainda é <code>0.0</code>. Sua missão: troque o <code>0.0</code> pela receita do brilho
  especular, usando o <code>pow</code> do <code>dot</code> entre a normal <code>N</code> e o
  half-vector <code>H</code>.</p>
  <div class="afie">
    <p><strong>Preveja:</strong> quando você somar <code>pow(max(dot(N, H), 0.0), u_dureza)</code>,
    onde vai aparecer o brilho? E o que acontece com ele quando você aumenta a <em>dureza</em>?</p>
    <p>Escreva, clique ▶ Test Drive e confira: <strong>se aparecer um ponto branco que anda com a
    direção da luz e encolhe quando você aumenta a dureza, você acertou.</strong> Travou?
    💡 Mostrar solução.</p>
  </div>

  <shader-playground id="pg-ex-brilho"></shader-playground>
```

- [ ] **Step 5: Adicionar a config no `<script type="module">` final**

Dentro do `<script type="module">` final do M12, junto aos configs existentes (após o de `pg-projeto`, ou antes — qualquer posição dentro do bloco), acrescentar:

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

**CUIDADO (lição da sessão do M12):** o shader DECLARA `uniform float u_lang;` e `uniform float u_dureza;` no topo — uniforms de CONTROLE não são injetados pelo motor (só os auto-uniforms fixos). Sem isso, "undeclared identifier". As declarações já estão no código acima — mantê-las.

- [ ] **Step 6: Rodar testes node + smoke**

Run: `npm test`
Expected: PASS — 134 testes (133 + 1).
Run: `npm run smoke`
Expected: verde — 16 módulos; o M12 (com o novo shader) compila headless. (Este é o gate que pega `undeclared identifier` se as declarações faltarem.)

- [ ] **Step 7: Verificar no Chrome (shader novo — obrigatório)**

Abrir `http://localhost:8000/modulos/12-luz-especular.html`. Confirmar:
- `pg-ex-brilho` começa como esfera **fosca** (só gradiente difuso, SEM ponto branco).
- Clicar 💡 Mostrar solução → aparece o **ponto de brilho** branco; mover **dureza** muda o tamanho do ponto; mover **direção da luz** move o brilho.
- NÃO há botão Conferir (sem reference). Console sem erro GLSL.

- [ ] **Step 8: Commit + push**

```bash
git add site/modulos/12-luz-especular.html test/module12.integration.test.js
git commit -m "feat(m12): exercicio predict-observe de specular (escreve a linha do brilho, sem pixel-diff 3D)"
git push
```

## Notes
- NÃO adicionar `reference` (cena 3D). O teste afirma isso.
- Não tocar nos playgrounds existentes (`pg-brilho`, `pg-projeto`).
- Verificação no navegador é obrigatória (shader novo); o smoke pega erro de compilação, o Chrome confirma o comportamento fosco→brilho.

## Self-Review (cobertura do spec)
- **§3 componente `pg-ex-brilho` antes do Projeto-Vitória, difusa pronta, edita `brilho`, sem reference** → Steps 4/5 + teste Step 2. ✓
- **§4 config exata com declarações `u_lang`/`u_dureza`** → Step 5 (declarações incluídas + CUIDADO). ✓
- **§2 política sem pixel-diff** → teste `!reference:` + sem botão Conferir (Step 7). ✓
- **§5 testes (integração + Chrome + smoke)** → Steps 2/6/7. ✓
- **§7 risco uniforms não-declarados** → Step 5 CUIDADO + smoke (Step 6) pega. ✓
- **Consistência:** id `pg-ex-brilho` igual em HTML/teste; `editableRegions: ['brilho']`; solução `pow(max(dot(N, H)...`. ✓
- **Contagem:** 133 → 134 node; smoke 16 verde. ✓
