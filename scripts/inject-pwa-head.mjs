// Injeta metadados PWA no <head> de todas as paginas (idempotente, depth-aware).
// Prefixo relativo: '' na raiz de site/, '../' em subpastas (modulos/, professor/).
// Rodar: node scripts/inject-pwa-head.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = join(process.cwd(), 'site');
const MARK = '<!-- pwa-head -->';

function block(prefix) {
  return `${MARK}
  <link rel="manifest" href="${prefix}manifest.webmanifest">
  <meta name="theme-color" content="#d6336c">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <link rel="apple-touch-icon" href="${prefix}assets/img/apple-touch-icon.png">
  <script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('${prefix}sw.js'));}</script>`;
}

async function inject(file, prefix) {
  let html = await readFile(file, 'utf8');
  if (html.includes(MARK)) return false; // idempotente
  html = html.replace('</head>', block(prefix) + '\n</head>');
  await writeFile(file, html);
  return true;
}

const pages = [
  ['index.html', ''],
  ['glossario.html', ''],
  ['professor/index.html', '../'],
  ...(await readdir(join(SITE, 'modulos'))).filter((f) => f.endsWith('.html')).map((f) => [`modulos/${f}`, '../']),
];

let n = 0;
for (const [rel, prefix] of pages) {
  if (await inject(join(SITE, rel), prefix)) { n++; console.log('  injetado: ' + rel); }
}
console.log(`PWA head injetado em ${n} pagina(s).`);
