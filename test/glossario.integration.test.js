import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('glossario: pagina existe, tem termos-chave e links pros modulos', () => {
  const html = readFileSync('site/glossario.html', 'utf8');
  for (const termo of ['shader', 'dot', 'VRAM', 'especular', 'uniform', 'rasteriza']) {
    assert.ok(html.includes(termo), `glossario nao tem o termo ${termo}`);
  }
  const links = (html.match(/href="modulos\//g) || []).length;
  assert.ok(links >= 10, `glossario tem poucos links pros modulos (${links})`);
  assert.ok(html.includes('Glossário'), 'falta o titulo/breadcrumb Glossário');
});

test('index e M0 linkam o glossario', () => {
  assert.ok(readFileSync('site/index.html', 'utf8').includes('glossario.html'), 'index nao linka o glossario');
  assert.ok(readFileSync('site/modulos/00-comecando.html', 'utf8').includes('../glossario.html'), 'M0 nao linka o glossario');
});
