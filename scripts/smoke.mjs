// Smoke test de compilação GLSL: carrega cada página de módulo num Chromium
// headless (WebGL por software via SwiftShader) e falha se algum shader não
// compilar. Os testes node (node --test) são cegos a GLSL; este fecha o buraco.
//
// Rodar: npm run smoke   (exit != 0 se qualquer playground falhar)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const SITE = join(process.cwd(), 'site');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
};

// --- servidor estático efêmero sobre site/ ---
const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const filePath = join(SITE, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(SITE)) { res.writeHead(403); return res.end(); }
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

// --- páginas de módulo (00..NN) ---
const files = (await readdir(join(SITE, 'modulos')))
  .filter((f) => f.endsWith('.html'))
  .sort();

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
});

let failures = 0;
const ERR_RE = /ERROR:|undeclared|No precision|INVALID|WebGL.*error/i;

for (const file of files) {
  const page = await browser.newPage();
  const consoleErrs = [];
  page.on('console', (m) => { if (m.type() === 'error' && ERR_RE.test(m.text())) consoleErrs.push(m.text()); });
  page.on('pageerror', (e) => consoleErrs.push('pageerror: ' + e.message));

  let report;
  try {
    await page.goto(`${base}/modulos/${file}`, { waitUntil: 'networkidle', timeout: 15000 });
    // espera todos os playgrounds terem rodado _compile (program deixa de ser undefined)
    await page.waitForFunction(() => {
      const els = [...document.querySelectorAll('shader-playground')];
      return els.length === 0 || els.every((e) => e.program !== undefined);
    }, { timeout: 10000 });

    report = await page.evaluate(() => {
      return [...document.querySelectorAll('shader-playground')].map((e) => {
        const s = e.querySelector('.pg-status');
        return {
          id: e.id || '(sem id)',
          compilou: !!e.program,
          erro: s ? s.className.includes('pg-erro') : false,
          status: s ? s.textContent.slice(0, 120) : '',
        };
      });
    });
  } catch (e) {
    report = [{ id: '(página)', compilou: false, erro: true, status: 'timeout/erro: ' + e.message.split('\n')[0] }];
  }

  const bad = report.filter((r) => !r.compilou || r.erro).concat(
    consoleErrs.map((t) => ({ id: '(console)', compilou: false, erro: true, status: t.slice(0, 120) }))
  );

  if (bad.length === 0) {
    console.log(`✓ ${file} — ${report.length} playground(s) ok`);
  } else {
    failures++;
    console.log(`✗ ${file}`);
    for (const b of bad) console.log(`    ${b.id}: ${b.status || 'não compilou (program null)'}`);
  }
  await page.close();
}

await browser.close();
await new Promise((r) => server.close(r));

console.log(failures === 0
  ? `\nSmoke OK: ${files.length} módulos, todos os shaders compilam.`
  : `\nSmoke FALHOU: ${failures} módulo(s) com shader quebrado.`);
process.exit(failures === 0 ? 0 : 1);
