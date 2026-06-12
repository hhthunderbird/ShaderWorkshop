# Avaliação: evoluir o curso para um app (WebView/PWA) + sala conectada

**Data:** 2026-06-12. **Tipo:** AVALIAÇÃO/decisão (não é spec de build aprovado). **Origem:** pedido do usuário — "estilo mais moderno mobile + avaliar evolução para app WebView", com a visão de **app do professor gera QR → alunos entram → conexão professor↔aluno**.

> Este documento decide **direção e fases**, não implementa nada. Cada fase que virar build ganha seu próprio brainstorming → spec → plano.

## 1. Ponto de partida (o que ajuda e o que atrapalha)

**A favor (muito):**
- O curso é **100% estático** (HTML/CSS/JS, WebGL1), **sem backend, sem build**, já **offline-friendly**. Empacotar isso como app é barato.
- Um único `headfirst.css` + `playground.css` governam tudo → restyle é centralizado.
- WebGL1 roda na Android System WebView e no Chrome (motor do TWA) sem drama.

**Contra / a vigiar:**
- **Export PNG / "Baixar imagem"**: download dentro de WebView é um gotcha (Android precisa interceptar `DownloadListener`; iOS WKWebView é mais chato). Em PWA puro funciona melhor.
- **A visão "professor↔aluno conectado" quebra o offline-first**: conexão ao vivo exige internet + **backend** (o curso hoje não tem nenhum). São coisas opostas — resolver com **dois modos** (offline solo × online "modo turma").
- **LGPD / dados de menores**: qualquer conexão professor↔aluno mexe com alunos (menores). Manter salas **anônimas e efêmeras** (código de sala, sem cadastro/nome/foto) reduz risco a quase zero. Decisão a travar cedo.

## 2. As DUAS camadas (precisam ser separadas)

### Camada A — Empacotar o curso como app
Entrega: offline, ícone na tela, tela cheia, (opcional) loja. **Não precisa de backend.**

### Camada B — Sala de aula conectada (a visão nova)
Entrega: professor cria sala → QR → alunos entram → professor e alunos trocam coisas ao vivo. **Precisa de hospedagem + backend de tempo real.** É um **produto novo**, com custo e complexidade próprios. NÃO confundir com "fazer um WebView".

## 3. Camada A — opções de empacotamento

| Opção | Offline | Loja | iOS | Custo | Recursos nativos |
|------|--------|------|-----|-------|------------------|
| **PWA** (manifest + service worker) | ✅ (cache) | ❌ | parcial (Add to Home) | **baixo** | Web Share, Web Push (Android), BarcodeDetector |
| **TWA** (Bubblewrap → Play Store) | ✅ (usa a PWA) | ✅ Android | ❌ | médio (Play Console US$25 1×) | o da PWA (motor Chrome) |
| **Capacitor** (shell nativo Android+iOS) | ✅ (assets locais) | ✅ ambas | ✅ | médio-alto (Xcode + Apple US$99/ano) | plugins ricos: câmera/scanner QR, Filesystem, Share, Push |
| WebView na mão (Activity Android) | ✅ | ✅ | ❌ | alto (manutenção) | tudo, mas você escreve | 

Cortados: **Cordova** (legado — use Capacitor); **Electron/Tauri** (desktop, fora do alvo).

**Recomendação Camada A (Android-first):**
1. **PWA primeiro** — base universal, barata, resolve **offline + cara de app** em Android/iOS/desktop. É pré-requisito do resto.
2. **TWA** quando quiser **Play Store** (Android, escola BR). Reusa a PWA; motor Chrome = WebGL pleno.
3. **Capacitor** só se **iOS** virar requisito OU se quiser **scanner de QR nativo** e Share/Filesystem robustos. (Mas QR dá pra fazer em web — ver §4.)

### O que a PWA exige (Camada A, fase 0)
- `manifest.webmanifest`: nome, `display: standalone`, `theme_color`, `background_color`, ícones (192/512 px). 1 SVG/PNG de ícone.
- **Service worker** que faz cache de todos os assets (precache na instalação) → abre offline. Atenção: invalidar cache em deploy novo (versionar o SW).
- `<link rel="manifest">` + `<meta name="theme-color">` + `<meta name="apple-mobile-web-app-capable">` nos `<head>`.
- **Hospedagem HTTPS** (PWA exige HTTPS). Estático → **grátis**: GitHub Pages, Netlify, Cloudflare Pages. (O repo já está no GitHub → Pages é o caminho de menor atrito.)
- Custo de engenharia: **baixo** (1 manifest + 1 SW + metas nos heads + deploy). É um candidato natural a próximo build (brainstorming→spec→plano).

## 4. Camada B — sala de aula conectada (avaliação de alto nível)

**O que ela exige que hoje NÃO existe:**
- **Hospedagem** (estática resolve o conteúdo; mas a conexão ao vivo precisa de servidor).
- **Backend de tempo real**: salas, código de entrada, mensagens professor↔aluno. Opções:
  - **Firebase** (Realtime DB/Firestore + Auth anônima) — rápido de montar, plano grátis generoso, bom pra MVP.
  - **Supabase** (Postgres + Realtime) — alternativa open-source.
  - **PartyKit / Ably / Pusher** — camada WebSocket gerenciada, simples pra "salas".
  - Servidor WebSocket próprio (mais controle, mais manutenção).
- **Fluxo QR (dá pra fazer SEM nativo):** professor cria sala → código curto → renderiza QR no cliente (lib `qrcode`, pura JS). Aluno escaneia com **`BarcodeDetector`** (Android Chrome suporta) ou `getUserMedia` + `jsQR`; em app nativo, scanner do Capacitor. → entra na sala pelo código.
- **LGPD:** salas **anônimas e efêmeras** (só apelido opcional, sem cadastro). Não guardar dado pessoal de menor. Travar isso no design.

**"Muitas possibilidades" que isso destrava (pra dimensionar o valor):**
- Professor empurra "turma, faça este shader agora" (manda uma `config` pra todos).
- Professor vê as telas/shaders dos alunos em tempo real (miniaturas — reusa o `toDataURL` que já existe).
- Desafio ao vivo / quiz (predict-observe coletivo), galeria dos "Efeitos Autorais", presença.
- Tudo isso reusa o motor `ShaderPlayground` e o `localstore`/export que já existem.

**Veredito Camada B:** viável e empolgante, mas é **um projeto à parte**, com **backend, hospedagem paga-conforme-escala, e questões de privacidade**. Não fazer junto com o empacotamento. Merece seu **próprio brainstorming** quando a Camada A estiver de pé.

## 4.5 Direção escolhida p/ Camada B: sala LOCAL sem nuvem (mini-servidor do professor)

Decidido com o usuário (06/12): a sala conectada será **local, sem nuvem** — servidor no aparelho do professor, alunos web, sobre o **hotspot do professor**. Resolve a tensão offline e zera custo/LGPD-de-nuvem.

**Topologia:** estrela. Professor = hub (servidor HTTP + WebSocket). Alunos = navegador/PWA conectando em `http://<ip-prof>:porta`. Realtime via WebSocket. QR (opcional) só transporta o `ip:porta` (descoberta, não auth).

**Rede:** **hotspot do professor** (alunos entram na rede do aparelho dele). Garante LAN + offline, contorna o *client isolation* do Wi-Fi de escola. Toggle do hotspot é manual no Android (apps não ligam hotspot sem privilégio) — instruir o professor. Limite prático: bateria + ~10–30 alunos/aparelho.

**Dois sabores de servidor (suportar os dois — decisão do usuário):**
- **Notebook/PC (fácil):** servidor **Node** local (HTTP + `ws`). Serve o `site/` + a sala. Quase zero trabalho nativo. **É o MVP de desrisco.**
- **Celular/tablet Android (mais trabalho):** app **Capacitor** com servidor embutido (NanoHTTPD/Ktor ou plugin WS). Mesma lógica de sala; muda só o host.

**Caminho de desrisco (YAGNI):** **prototipar no Node/notebook primeiro** (prova o "modo turma": professor empurra um `ShaderPlayground` config pra turma, alunos devolvem miniatura via `toDataURL`, galeria/desafio). Validado o valor, **portar o mesmo servidor de sala pro app Android** (Capacitor). O protocolo WebSocket é idêntico nos dois.

**O que a sala reusa do que já existe:** motor `ShaderPlayground` (empurrar `config`), `toDataURL` (miniatura do aluno), `localstore` (trabalho salvo). O "modo turma" é uma camada por cima, não um motor novo.

**Partes difíceis a vigiar:** client isolation (→ hotspot resolve); descoberta de IP (→ QR/`teacher.local` mDNS); limite de alunos/banda no hotspot; servidor embutido no Android é o item mais custoso (por isso Node-primeiro).

**Privacidade:** salas anônimas e efêmeras, dado fica no aparelho do professor, nada na nuvem. Mínimo de LGPD.

## 5. Caminho recomendado (fases)

- **Fase 0 — PWA + hospedagem (Camada A):** manifest + service worker + deploy no GitHub Pages. Entrega **offline + instalável + cara de app**, grátis, baixo risco. **É o próximo build natural.** Pré-requisito de tudo.
- **Fase 1 — Play Store via TWA (Camada A):** se quiser presença na loja Android. Reusa a Fase 0.
- **Fase 2 — Sala conectada LOCAL (Camada B), projeto próprio:** servidor local do professor (NÃO nuvem). **Fase 2a:** MVP no **Node/notebook** (WebSocket de sala + "modo turma" reusando o motor). **Fase 2b:** portar o servidor pro **app Android (Capacitor)** + QR de descoberta + hotspot. Brainstorming dedicado.
- **Fase 3 — iOS / Capacitor:** só se iOS ou scanner nativo virarem requisito. Reusa tudo.
- **(Paralelo) Redesign moderno mobile:** o restyle visual que você pediu é **ortogonal** e pode rodar a qualquer momento — como é um `headfirst.css` central, casa bem com a Fase 0 (app novo + visual novo juntos). Vira seu próprio brainstorming.

## 6. Decisões a travar antes de cada fase
- **Fase 0:** onde hospedar (recomendo GitHub Pages — repo já lá); estratégia de cache/versão do service worker; qual ícone/cor do app.
- **Fase 2:** backend (Firebase?); **modelo de privacidade anônimo/efêmero (LGPD)**; o que exatamente o professor empurra/vê (escopo do "modo turma"); QR em web (`BarcodeDetector`) vs nativo.
- **Transversal:** o redesign mobile-moderno — manter a identidade Head First (serif/papel) ou modernizar a alma? (pergunta que ficou aberta quando pulamos pra cá).

## 7. Recomendação final (resumo)
1. **Comece pela Fase 0 (PWA + GitHub Pages).** Barata, resolve offline + app-feel, destrava o resto. Forte candidata ao próximo brainstorming→build.
2. **Play Store = TWA** (Android-first), depois da Fase 0.
3. **Sala conectada = projeto separado** (Fase 2), **LOCAL sem nuvem** (servidor no aparelho do professor + hotspot). Começar pelo **MVP em Node/notebook** (desrisco barato), depois portar pro app Android. Não acoplar ao empacotamento.
4. **iOS/Capacitor** só sob demanda real.
5. **Redesign** roda em paralelo, ancorado no `headfirst.css` central.
