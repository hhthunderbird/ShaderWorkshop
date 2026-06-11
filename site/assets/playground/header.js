// Injeta declarações padrão (precision + uniforms automáticos + varying v_uv) no
// fragment shader do aluno, SÓ quando ainda não foram declaradas.
//
// CUIDADO: checar mera presença do token (src.includes('v_uv')) é errado — o aluno
// USA v_uv sem declarar, então a presença do uso suprimia a declaração e quebrava a
// compilação ("'v_uv' : undeclared identifier"). A checagem correta procura uma
// DECLARAÇÃO de verdade (uniform/varying/attribute <tipo> <nome>).
export function hasDeclaration(src, name) {
  // entre a keyword e o nome pode haver qualificador(es) de precisão + tipo
  // (ex.: `uniform mediump vec2 u_resolution;`), então casa 1+ tokens, não só 1.
  const re = new RegExp(`\\b(uniform|varying|attribute)\\s+\\w+(?:\\s+\\w+)*\\s+${name}\\b`);
  return re.test(src);
}

// Separa a diretiva `precision` do início do shader (se o aluno declarou) do resto.
// CUIDADO: GLSL ES exige `precision` ANTES do 1º uso do tipo. Se injetássemos
// `uniform float u_time;` antes da precision que o aluno escreveu, o float seria
// usado sem precisão -> "No precision specified for (float)". Por isso a precision
// é re-emitida no TOPO, antes dos uniforms injetados.
function splitPrecision(src) {
  const m = src.match(/^\s*(precision\s+\w+\s+float\s*;)\s*/);
  if (m) return { precision: m[1], body: src.slice(m[0].length) };
  return { precision: 'precision mediump float;', body: src };
}

export function withHeader(src) {
  const { precision, body } = splitPrecision(src);
  const addIfMissing = (decl, name) => (hasDeclaration(src, name) ? '' : decl + '\n');
  return (
    precision + '\n' +
    addIfMissing('uniform float u_time;', 'u_time') +
    addIfMissing('uniform vec2 u_resolution;', 'u_resolution') +
    addIfMissing('varying vec2 v_uv;', 'v_uv') +
    body
  );
}

// Header do modo mesh: além do v_uv, declara normal/worldPos e os uniforms 3D.
// u_tex é declarado já (usado a partir do M9); uniform não usado é otimizado fora.
export function withHeaderMesh(src) {
  const { precision, body } = splitPrecision(src);
  const addIfMissing = (decl, name) => (hasDeclaration(src, name) ? '' : decl + '\n');
  return (
    precision + '\n' +
    addIfMissing('uniform float u_time;', 'u_time') +
    addIfMissing('uniform vec3 u_lightDir;', 'u_lightDir') +
    addIfMissing('uniform vec3 u_cameraPos;', 'u_cameraPos') +
    addIfMissing('uniform sampler2D u_tex;', 'u_tex') +
    addIfMissing('varying vec2 v_uv;', 'v_uv') +
    addIfMissing('varying vec3 v_normal;', 'v_normal') +
    addIfMissing('varying vec3 v_worldPos;', 'v_worldPos') +
    body
  );
}
