import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Modulo 15 e a ficha tecnica anotada: termos-chave, details.spec, links de volta, memoria/VRAM', () => {
  const html = readFileSync('site/modulos/15-placa-de-video.html', 'utf8');
  for (const termo of ['CUDA', 'TMU', 'ROP', 'VRAM', 'Tensor', 'RT ']) {
    assert.ok(html.includes(termo), `falta o termo ${termo}`);
  }
  assert.ok(html.includes('class="spec"'), 'falta a ficha interativa (details.spec)');
  for (const link of ['06-paralelismo.html', '09-texturas-e-uv.html', '11-hardware-fixo.html', '13-alem-de-pixels.html']) {
    assert.ok(html.includes(link), `ficha nao linka de volta pro ${link}`);
  }
  assert.ok(/banda/i.test(html) && /GB\/s/.test(html), 'falta a nocao de banda de memoria');
  assert.ok(!html.includes('reference:'), 'M15 e conceitual: sem pixel-diff');
  assert.ok(!html.includes('<shader-playground'), 'M15 nao tem playground (sem shader)');
  assert.ok(/Bônus/.test(html), 'falta a marcacao de Bonus no breadcrumb');
  assert.ok(!/de 15/.test(html), 'M15 e bonus, nao deve renumerar o curso pra 15');
  for (const cls of ['brain', 'qa', 'cuidado', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('o index tem uma secao Bonus que linka o Modulo 15 apos o 14/14', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('15-placa-de-video.html'), 'index nao linka o M15');
  assert.ok(idx.indexOf('14/14') < idx.indexOf('15-placa-de-video.html'), 'M15 deve vir DEPOIS do banner 14/14');
});
