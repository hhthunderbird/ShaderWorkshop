import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const MODULOS = [
  '00-comecando', '01-shaders-e-gpu', '02-pixel-e-cor', '03-matematica-vira-imagem',
  '04-formas-e-padroes', '05-dando-vida-animacao', '06-paralelismo', '07-vertices-e-pipeline',
  '08-vetores-e-coordenadas', '09-texturas-e-uv', '10-normais-e-luz', '11-hardware-fixo',
  '12-luz-especular', '13-alem-de-pixels', '14-otimizacao', '15-placa-de-video', '16-transparencia',
];

test('kit professor: landing existe com as 3 secoes-chave', () => {
  const html = readFileSync('site/professor/index.html', 'utf8');
  assert.ok(html.includes('Kit do Professor'), 'falta o titulo/breadcrumb do kit');
  assert.ok(/Como rodar o curso/i.test(html), 'falta a secao Como rodar o curso');
  assert.ok(/guias/i.test(html), 'falta a secao de guias');
  assert.ok(/Avalia/i.test(html) && html.includes('0–5'), 'falta a secao de avaliacao com o esquema 0-5');
});

test('kit professor: indexa os 17 guias e os 17 modulos do aluno', () => {
  const html = readFileSync('site/professor/index.html', 'utf8');
  for (let i = 0; i <= 16; i++) {
    const n = String(i).padStart(2, '0');
    assert.ok(html.includes(`${n}-guia.md`), `falta link pro guia ${n}`);
  }
  for (const m of MODULOS) {
    assert.ok(html.includes(`../modulos/${m}.html`), `falta link pro modulo ${m}`);
  }
});

test('kit professor: consolida as 3 rubricas e linka os guias de projeto', () => {
  const html = readFileSync('site/professor/index.html', 'utf8');
  assert.ok(html.includes('Meu Padrão Animado'), 'falta a rubrica do M5');
  assert.ok(html.includes('Objeto Texturizado e Iluminado'), 'falta a rubrica do M10');
  assert.ok(html.includes('Efeito Autoral'), 'falta a rubrica do M12');
  for (const g of ['05-guia.md', '10-guia.md', '12-guia.md']) {
    assert.ok(html.includes(g), `secao de avaliacao nao linka ${g}`);
  }
});

test('kit professor: index do site linka a pagina do professor', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('professor/index.html'), 'index nao linka o kit do professor');
});
