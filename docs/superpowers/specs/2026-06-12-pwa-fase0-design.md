# PWA Fase 0 — App offline e instalável — Design

**Data:** 2026-06-12. **Pré-requisito:** curso estático em `site/`. **Origem:** avaliação `2026-06-12-app-webview-avaliacao.md` (Fase 0). Usuário escolheu começar pela PWA.

## 1. Escopo e objetivo

Transformar o curso estático numa **PWA**: instalável (ícone na tela, tela cheia/standalone) e **offline** (abre sem internet após a 1ª visita — caso de uso: escola sem Wi-Fi confiável). É a base das fases seguintes (TWA/loja, sala conectada).

**Decisões travadas (brainstorming):**
- **PWA pura.** O **seletor de temas (claro/escuro)** NÃO entra aqui — vira a 1ª peça do redesign (precisa de theming completo + dark audit + SVGs). Fase 0 usa **1 tema padrão**.
- `theme_color` padrão = **#d6336c** (accent rosa do curso); `background_color` (splash) = **#fffdf7** (papel).
- Hospedagem = **GitHub Pages** (repo já no GitHub); habilitar via `gh` no deploy (passo de publicação, confirmar antes).

**Escopo cortado (YAGNI):** sem seletor de temas/dark mode; sem push notifications; sem Web Share; sem TWA/empacotamento nativo (fases seguintes). Só: manifest + ícones + service worker offline + registro + deploy.

## 2. Política respeitada
- **Zero mudança no motor GLSL** e no conteúdo dos módulos. Só adiciona metadados de `<head>` + arquivos novos na raiz.
- `npm run smoke` segue 17 verde.
- **Gotcha central — subpath do GitHub Pages:** o site é servido sob `/<repo>/` (ex. `/ShaderWorkshop/`). Logo **manifest, ícones, SW e start_url usam caminhos RELATIVOS, cientes da profundidade** (raiz vs `/modulos/` vs `/professor/`). Nada de caminho absoluto `/sw.js` (quebraria sob subpath).

## 3. Componentes

### 3.1 `site/manifest.webmanifest` (novo)
```json
{
  "name": "Curso de Shaders, GPU e Pipeline Gráfica",
  "short_name": "Shaders",
  "description": "Curso interativo de shaders, GPU e pipeline gráfica para o ensino médio.",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#d6336c",
  "background_color": "#fffdf7",
  "icons": [
    { "src": "assets/img/app-icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/img/app-icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "assets/img/app-icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
`start_url`/`scope` relativos (`.`) → funcionam sob qualquer subpath. Paths de ícone relativos à localização do manifest (raiz de `site/`).

### 3.2 Ícone do app
- `site/assets/img/app-icon.svg` (fonte): quadrado de cantos arredondados com gradiente do playground (azul→laranja, a paleta do curso) + um motivo simples de "onda/shader". Versão **maskable** com margem de segurança (safe zone ~80% central, fundo cheio).
- Gerar PNGs `app-icon-192.png`, `app-icon-512.png`, `app-icon-maskable.png` (512) e `apple-touch-icon.png` (180) via **Playwright** (render do SVG num viewport do tamanho alvo → screenshot PNG). Reusa o Chromium do smoke; sem dependência nova. Script: `scripts/gen-pwa-icons.mjs`.

### 3.3 `site/sw.js` (service worker, novo)
- **Precache de TODOS os assets** (offline real). Lista vem de `site/precache.json` (gerada — §3.4).
- `CACHE = 'shaders-v1'` (versionado; bump no deploy quando assets mudam).
- `install`: `caches.open(CACHE)` → `addAll(lista)` → `skipWaiting()`.
- `activate`: apaga caches com nome diferente de `CACHE`; `clients.claim()`.
- `fetch`: **cache-first** (responde do cache; se faltar, rede; opcionalmente cacheia a resposta nova). Navegações que falham offline e não estão no cache caem num fallback simples (a própria `index.html` cacheada).
- Caminhos no precache são **relativos ao scope do SW** (raiz do site).

### 3.4 `scripts/gen-pwa-icons.mjs` + `scripts/gen-precache.mjs`
- `gen-precache.mjs`: varre `site/` e escreve `site/precache.json` = array de paths relativos. **Inclui** tudo (HTML, CSS, JS, SVG, PNG/texturas, `.md` dos guias → guia abre offline). **Exclui** só `precache.json` (o próprio) e `sw.js` (o SW se gerencia) (ex. `["index.html", "glossario.html", "modulos/01-shaders-e-gpu.html", "assets/css/headfirst.css", ...]`).
- Passo de **deploy/build leve** (não muda o runtime "sem build"). Rodar antes de publicar e quando adicionar assets.

### 3.5 Injeção nos `<head>` — `scripts/inject-pwa-head.mjs`
Adiciona (idempotente, só se faltar) em **todas** as páginas (`site/index.html`, `site/glossario.html`, `site/professor/index.html`, `site/modulos/*.html`), antes de `</head>`, com **prefixo relativo por profundidade** (`''` na raiz, `'../'` em `modulos/` e `professor/`):
```html
<link rel="manifest" href="{P}manifest.webmanifest">
<meta name="theme-color" content="#d6336c">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="{P}assets/img/apple-touch-icon.png">
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('{P}sw.js'));
  }
</script>
```
onde `{P}` = `''` (raiz) ou `'../'` (subpastas). O registro relativo + `scope` derivado do local do `sw.js` (raiz) cobrem todas as páginas e sobrevivem ao subpath do Pages.

## 4. Deploy (GitHub Pages)
- Habilitar Pages no repo (branch `main`, pasta… — o site vive em `site/`, não na raiz do repo). Duas opções: (a) Pages servindo de `/site` se o GitHub permitir subpasta (hoje Pages serve raiz ou `/docs`); (b) workflow Actions que publica `site/` como artefato Pages. **Recomendado: GitHub Actions Pages** (`actions/deploy-pages`) publicando o diretório `site/` — não exige mover arquivos.
- Eu habilito via `gh`/commit do workflow; **confirmo o comando antes** (é publicação pública). URL final: `https://<user>.github.io/<repo>/`.
- Teste local de PWA: `npm run serve` (localhost conta como contexto seguro) → instalável/SW funcionam em localhost.

## 5. Testes e verificação
- **node** (`test/pwa.test.js`): `site/manifest.webmanifest` é JSON válido com `name`, `start_url`, `display: standalone`, `theme_color`, ≥1 ícone 192 e 512; `site/sw.js` existe e referencia `precache.json`; `site/precache.json` é array não-vazio contendo `index.html` e ao menos um módulo; **toda** página (`index`, `glossario`, `professor/index`, os 17 módulos) contém `rel="manifest"` e `serviceWorker.register`.
- **Playwright (prova de offline, throwaway):** sobe o server, abre `index.html`, espera `navigator.serviceWorker.ready`, **seta `context.setOffline(true)`**, navega a um módulo → a página **carrega do cache** (título/elemento presente). Reusa setup do smoke. Deletado ao fim.
- **`npm run smoke`** segue 17 verde (conteúdo dos módulos intacto).
- Baseline node: **148** → +1 arquivo de teste.

## 6. Arquivos
**Criar:** `site/manifest.webmanifest`, `site/sw.js`, `site/precache.json` (gerado), `site/assets/img/app-icon.svg` + PNGs gerados (`app-icon-192.png`, `app-icon-512.png`, `app-icon-maskable.png`, `apple-touch-icon.png`), `scripts/gen-pwa-icons.mjs`, `scripts/gen-precache.mjs`, `scripts/inject-pwa-head.mjs`, `test/pwa.test.js`. (Deploy: workflow `.github/workflows/pages.yml` — na etapa de deploy, com confirmação.)
**Modificar:** todas as páginas em `site/` (injeção de `<head>` via script).

## 7. Riscos / pontos de atenção
- **Subpath do Pages** (já tratado): tudo relativo + depth-aware. Validar SW registra sob `/<repo>/` (testar com `npm run serve` num subpath, ou confiar no relativo).
- **Versão do cache:** mudar assets sem bumpar `CACHE` serve conteúdo velho. Mitigar: `gen-precache` poderia embutir um hash/contagem no nome do cache; mínimo = bump manual `shaders-vN` no deploy. Documentar.
- **Ícone maskable:** sem safe zone, o Android corta o ícone. Gerar com margem.
- **Tamanho do precache:** o curso tem PNGs de textura/referência; o precache total deve ser alguns MB — aceitável pra offline escolar. O `gen-precache` loga o total ao gerar pra conferência.
- **Deploy de subpasta:** Pages clássico não serve `/site` direto → usar Actions (`upload-pages-artifact` com `path: site`). Sem isso, precisaria mover o site pra raiz do repo (evitar).
- **`.md` dos guias offline:** incluídos no precache (abrem como texto). OK.
