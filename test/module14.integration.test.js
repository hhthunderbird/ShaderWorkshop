import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeConfig } from '../site/assets/playground/config.js';

test('demos if x mix: dois fragment 2D com o MESMO resultado, sem reference', () => {
  const comIf = normalizeConfig({
    mode: 'fragment',
    fragment: `void main(){
  float faixa = step(0.5, fract(v_uv.x * 8.0));
  vec3 cor;
  if (faixa > 0.5) { cor = vec3(0.9,0.3,0.2); } else { cor = vec3(0.2,0.4,0.9); }
  gl_FragColor = vec4(cor, 1.0);
}`,
  });
  const semBranch = normalizeConfig({
    mode: 'fragment',
    fragment: `void main(){
  float faixa = step(0.5, fract(v_uv.x * 8.0));
  vec3 cor = mix(vec3(0.2,0.4,0.9), vec3(0.9,0.3,0.2), faixa);
  gl_FragColor = vec4(cor, 1.0);
}`,
  });
  assert.equal(comIf.reference, null);
  assert.equal(semBranch.reference, null);
});

test('a pagina do M14 fecha o curso: demos duo if/mix, SVG, sem pixel-diff', () => {
  const html = readFileSync('site/modulos/14-otimizacao.html', 'utf8');
  assert.ok(html.includes('id="pg-if"'), 'falta o demo com if');
  assert.ok(html.includes('id="pg-mix"'), 'falta o demo sem branch (mix)');
  assert.ok(html.includes('class="duo"'), 'falta o lado-a-lado .duo');
  assert.ok(html.includes('warp-divergencia.svg'), 'falta o SVG de warp/divergencia');
  assert.ok(/divergência|divergencia/i.test(html), 'falta o conceito de divergencia de branch');
  assert.ok(!html.includes('reference:'), 'M14 e conceitual: sem pixel-diff');
  assert.ok(html.includes('Efeito Autoral'), 'falta o callback ao Projeto-Vitoria 3 do M12');
  for (const cls of ['brain', 'qa', 'cuidado', 'bullets', 'recordacao']) {
    assert.ok(html.includes(`class="${cls}"`), `falta dispositivo Head First: ${cls}`);
  }
});

test('o index linka o M14 e marca Marco 3 + curso completos', () => {
  const idx = readFileSync('site/index.html', 'utf8');
  assert.ok(idx.includes('14-otimizacao.html'), 'index nao linka o M14');
  assert.ok(idx.includes('Marco 3 completo'), 'index nao marca Marco 3 completo');
  assert.ok(/14\s*\/\s*14|curso completo/i.test(idx), 'index nao marca o curso completo (14/14)');
});

test('M14 tem secao de proximos passos com caminhos reais', () => {
  const html = readFileSync('site/modulos/14-otimizacao.html', 'utf8');
  assert.ok(/E agora|Próximos passos|Proximos passos/i.test(html), 'falta a secao de proximos passos');
  assert.ok(/Shadertoy/i.test(html), 'falta apontar o Shadertoy');
  assert.ok(/WebGPU/i.test(html), 'falta apontar o WebGPU');
  assert.ok(/Unity/i.test(html), 'falta apontar o Unity');
});
