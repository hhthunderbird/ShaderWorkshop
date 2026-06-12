import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const PAGES = [
  'site/index.html', 'site/glossario.html', 'site/professor/index.html',
  ...['00-comecando','01-shaders-e-gpu','02-pixel-e-cor','03-matematica-vira-imagem',
      '04-formas-e-padroes','05-dando-vida-animacao','06-paralelismo','07-vertices-e-pipeline',
      '08-vetores-e-coordenadas','09-texturas-e-uv','10-normais-e-luz','11-hardware-fixo',
      '12-luz-especular','13-alem-de-pixels','14-otimizacao','15-placa-de-video','16-transparencia']
    .map((m) => `site/modulos/${m}.html`),
];

test('headfirst.css: tema por variaveis + bloco escuro', () => {
  const css = readFileSync('site/assets/css/headfirst.css', 'utf8');
  assert.ok(css.includes('[data-theme="escuro"]'), 'falta o tema escuro');
  assert.ok(/body\.hf\s*\{[^}]*var\(--bg\)/.test(css), 'body nao usa var(--bg)');
  assert.ok(css.includes('var(--ink)'), 'nao usa var(--ink)');
  assert.ok(css.includes('.theme-toggle'), 'falta o estilo do botao de tema');
});

test('playground.css: usa variaveis de tema', () => {
  const css = readFileSync('site/assets/css/playground.css', 'utf8');
  assert.ok(css.includes('var(--card)') && css.includes('var(--ink)'), 'playground nao usa variaveis');
});

test('theme.js: alterna, persiste e atualiza theme-color', () => {
  const js = readFileSync('site/assets/playground/theme.js', 'utf8');
  assert.ok(js.includes('data') && /escuro/.test(js), 'theme.js nao alterna data-theme');
  assert.ok(js.includes("localStorage") && js.includes("shaderworkshop:theme"), 'theme.js nao persiste');
  assert.ok(js.includes('theme-color'), 'theme.js nao atualiza meta theme-color');
});

test('todas as paginas injetam o theme-head + theme.js', () => {
  for (const p of PAGES) {
    const html = readFileSync(p, 'utf8');
    assert.ok(html.includes('<!-- theme-head -->'), `${p}: falta o theme-head`);
    assert.ok(/playground\/theme\.js/.test(html), `${p}: falta o theme.js`);
  }
});
