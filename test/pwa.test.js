import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const PAGES = [
  'site/index.html', 'site/glossario.html', 'site/professor/index.html',
  ...['00-comecando','01-shaders-e-gpu','02-pixel-e-cor','03-matematica-vira-imagem',
      '04-formas-e-padroes','05-dando-vida-animacao','06-paralelismo','07-vertices-e-pipeline',
      '08-vetores-e-coordenadas','09-texturas-e-uv','10-normais-e-luz','11-hardware-fixo',
      '12-luz-especular','13-alem-de-pixels','14-otimizacao','15-placa-de-video','16-transparencia']
    .map((m) => `site/modulos/${m}.html`),
];

test('manifest: JSON valido com campos PWA obrigatorios', () => {
  const m = JSON.parse(readFileSync('site/manifest.webmanifest', 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.ok(m.name && m.short_name, 'falta name/short_name');
  assert.equal(m.start_url, '.');
  assert.ok(m.theme_color && m.background_color, 'falta theme/background color');
  const sizes = m.icons.map((i) => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'), 'faltam icones 192/512');
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'), 'falta icone maskable');
});

test('service worker existe e usa o precache', () => {
  const sw = readFileSync('site/sw.js', 'utf8');
  assert.ok(sw.includes('precache.json'), 'sw nao referencia precache.json');
  assert.ok(/addAll/.test(sw), 'sw nao faz precache (addAll)');
  assert.ok(/caches\.open/.test(sw), 'sw nao abre cache');
});

test('precache.json: array com index e ao menos um modulo', () => {
  const list = JSON.parse(readFileSync('site/precache.json', 'utf8'));
  assert.ok(Array.isArray(list) && list.length > 0, 'precache vazio');
  assert.ok(list.includes('index.html'), 'precache sem index.html');
  assert.ok(list.some((p) => p.startsWith('modulos/')), 'precache sem modulos');
  assert.ok(!list.includes('precache.json') && !list.includes('sw.js'), 'precache nao deve listar a si mesmo nem o sw');
});

test('todas as paginas injetam manifest + registram o service worker', () => {
  for (const p of PAGES) {
    const html = readFileSync(p, 'utf8');
    assert.ok(/rel="manifest"/.test(html), `${p}: falta rel=manifest`);
    assert.ok(/serviceWorker\.register/.test(html), `${p}: falta registro do SW`);
    assert.ok(/name="theme-color"/.test(html), `${p}: falta meta theme-color`);
  }
});
