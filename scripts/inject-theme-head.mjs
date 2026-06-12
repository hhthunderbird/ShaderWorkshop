// Injeta (idempotente) o script anti-FOUC de tema logo apos o <meta charset> e o
// theme.js (defer) antes de </head>. Prefixo depth-aware ('' raiz, '../' subpastas).
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = join(process.cwd(), 'site');
const MARK = '<!-- theme-head -->';
const INLINE = `${MARK}
  <script>(function(){try{var t=localStorage.getItem('shaderworkshop:theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'escuro':'claro';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='claro';}})();</script>`;

async function inject(file, prefix) {
  let html = await readFile(file, 'utf8');
  if (html.includes(MARK)) return false;
  html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  ' + INLINE);
  html = html.replace('</head>', `  <script src="${prefix}assets/playground/theme.js" defer></script>\n</head>`);
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
  if (await inject(join(SITE, rel), prefix)) { n++; console.log('  theme-head: ' + rel); }
}
console.log(`Injetado em ${n} pagina(s).`);
