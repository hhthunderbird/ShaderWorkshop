// Tradução ILUSTRATIVA de GLSL ES (o que roda no navegador) para HLSL (Unity).
// É um guia de equivalência para alunos que vão migrar pro Unity — NÃO um
// compilador. Cobre o subconjunto dos snippets simples (tipos + funções comuns
// + saída do fragmento). Shaders com estrutura de I/O (vertex, semantics,
// samplers) devem fornecer uma versão HLSL curada via config (campo `hlsl`).

const TYPE_MAP = [
  ['vec2', 'float2'],
  ['vec3', 'float3'],
  ['vec4', 'float4'],
  ['mat2', 'float2x2'],
  ['mat3', 'float3x3'],
  ['mat4', 'float4x4'],
];

const FUNC_MAP = [
  ['mix', 'lerp'],
  ['fract', 'frac'],
  ['mod', 'fmod'], // ATENÇÃO: mod e fmod diferem para negativos (ver nota no material)
  ['texture2D', 'tex2D'],
];

function swapWord(src, from, to) {
  return src.replace(new RegExp('\\b' + from + '\\b', 'g'), to);
}

export function translateToHLSL(glsl) {
  let s = glsl;
  for (const [g, h] of TYPE_MAP) s = swapWord(s, g, h);
  for (const [g, h] of FUNC_MAP) s = swapWord(s, g, h);
  // saída do fragmento: gl_FragColor = X;  ->  return X;
  s = s.replace(/gl_FragColor\s*=\s*([^;]+);/g, 'return $1;');
  // 'precision ... float;' não existe em HLSL — remove a linha inteira
  s = s.replace(/^[ \t]*precision\s+\w+\s+float\s*;[ \t]*\r?\n?/gm, '');
  // qualificador 'uniform ' some (no Unity vira variável global do material)
  s = s.replace(/\buniform\s+/g, '');
  return s;
}
