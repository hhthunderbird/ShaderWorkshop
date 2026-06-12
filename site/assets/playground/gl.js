// Glue WebGL1. Verificado visualmente, não por unit test.

const QUAD_VERTEX = `
attribute vec2 a_position;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// Vertex shader padrão do modo mesh: aplica a MVP (caixa-preta) e repassa
// uv, normal (em mundo) e posição em mundo. O aluno normalmente NÃO edita isto.
const MESH_VERTEX = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_uv;
uniform mat4 u_mvp;
uniform mat4 u_model;
uniform mat3 u_normalMatrix;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_worldPos;
void main() {
  v_uv = a_uv;
  v_normal = normalize(u_normalMatrix * a_normal);
  v_worldPos = (u_model * vec4(a_position, 1.0)).xyz;
  gl_Position = u_mvp * vec4(a_position, 1.0);
}`;

export { MESH_VERTEX };

// Shaders de fundo opaco (backdrop) p/ o módulo de transparência. v_uv é
// injetado por withHeader (declaração-aware). Opaco (alpha 1.0).
export const BACKDROP_FRAGMENTS = {
  xadrez: `precision mediump float;
void main() {
  vec2 g = floor(v_uv * 8.0);
  float c = mod(g.x + g.y, 2.0);
  vec3 cor = mix(vec3(0.85), vec3(0.55), c);
  gl_FragColor = vec4(cor, 1.0);
}`,
};

export function createContext(canvas) {
  const gl =
    canvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: true }) ||
    canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL indisponível neste navegador/dispositivo');
  return gl;
}

function compileShader(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || 'erro de compilação do shader');
  }
  return sh;
}

// Para modo fragment: vertex é o QUAD_VERTEX fixo; user só escreve o fragment.
export function buildProgram(gl, fragmentSource, vertexSource = QUAD_VERTEX) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    throw new Error(log || 'erro de link do programa');
  }
  return prog;
}

// Cria os buffers do quad fullscreen UMA vez. Retorna as referências p/ rebind.
export function createQuadBuffers(gl) {
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return { posBuf, uvBuf, idxBuf };
}

// Liga os atributos do quad para `program`. Chamar antes de cada draw — as
// locations podem diferir entre programas (backdrop x aluno).
export function bindQuad(gl, program, bufs) {
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs.posBuf);
  const posLoc = gl.getAttribLocation(program, 'a_position');
  if (posLoc !== -1) { gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0); }
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs.uvBuf);
  const uvLoc = gl.getAttribLocation(program, 'a_uv');
  if (uvLoc !== -1) { gl.enableVertexAttribArray(uvLoc); gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0); }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs.idxBuf);
}

// Mantém a assinatura antiga: cria buffers, liga p/ `program`, retorna o nº de índices.
export function setupQuad(gl, program) {
  const bufs = createQuadBuffers(gl);
  bindQuad(gl, program, bufs);
  return 6;
}

// Cria buffers de uma malha {positions, normals, uvs, indices} e liga os atributos.
// Retorna a contagem de índices (p/ drawElements).
export function setupMesh(gl, program, geo) {
  const bind = (data, attr, size) => {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, attr);
    if (loc !== -1) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
  };
  bind(geo.positions, 'a_position', 3);
  bind(geo.normals, 'a_normal', 3);
  bind(geo.uvs, 'a_uv', 2);
  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);
  return geo.indices.length;
}

// Aplica todos os uniforms automáticos + de controle no programa dado.
function applyUniforms(gl, program, uniforms) {
  gl.useProgram(program);
  const set = (name, fn) => {
    const loc = gl.getUniformLocation(program, name);
    if (loc !== null) fn(loc);
  };
  if (uniforms.u_time !== undefined) set('u_time', (l) => gl.uniform1f(l, uniforms.u_time));
  if (uniforms.u_resolution) set('u_resolution', (l) => gl.uniform2f(l, uniforms.u_resolution[0], uniforms.u_resolution[1]));
  // Matrizes / luz do modo mesh (quando presentes).
  if (uniforms.u_mvp) set('u_mvp', (l) => gl.uniformMatrix4fv(l, false, new Float32Array(uniforms.u_mvp)));
  if (uniforms.u_model) set('u_model', (l) => gl.uniformMatrix4fv(l, false, new Float32Array(uniforms.u_model)));
  if (uniforms.u_normalMatrix) set('u_normalMatrix', (l) => gl.uniformMatrix3fv(l, false, new Float32Array(uniforms.u_normalMatrix)));
  if (uniforms.u_lightDir) set('u_lightDir', (l) => gl.uniform3f(l, uniforms.u_lightDir[0], uniforms.u_lightDir[1], uniforms.u_lightDir[2]));
  if (uniforms.u_cameraPos) set('u_cameraPos', (l) => gl.uniform3f(l, uniforms.u_cameraPos[0], uniforms.u_cameraPos[1], uniforms.u_cameraPos[2]));
  if (uniforms.texture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, uniforms.texture);
    set('u_tex', (l) => gl.uniform1i(l, 0));
  }
  for (const [name, val] of Object.entries(uniforms.controls || {})) {
    if (Array.isArray(val)) set(name, (l) => gl.uniform3f(l, val[0], val[1], val[2]));
    else set(name, (l) => gl.uniform1f(l, val));
  }
}

// Caminho padrão (1 draw, opaco). Comportamento idêntico ao de antes.
export function renderFrame(gl, program, indexCount, uniforms) {
  applyUniforms(gl, program, uniforms);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
}

// Caminho de transparência (2 draws): backdrop opaco -> objeto do aluno com
// blend src-over contra o framebuffer. DEPTH off (fragment 2D; garante o aluno por cima).
export function renderFragmentBackdrop(gl, backdropProgram, userProgram, bufs, userUniforms) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // passe 1: backdrop opaco
  gl.useProgram(backdropProgram);
  bindQuad(gl, backdropProgram, bufs);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  // passe 2: aluno com blend src-over (frente.rgb*a + fundo.rgb*(1-a))
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  applyUniforms(gl, userProgram, userUniforms);
  bindQuad(gl, userProgram, bufs);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  gl.disable(gl.BLEND); // deixa o estado limpo
}

// Carrega uma textura de uma URL. Placeholder 1px cinza enquanto carrega.
// WebGL1 NPOT-safe: CLAMP_TO_EDGE + LINEAR, sem mipmap. FLIP_Y deixa a imagem
// em pé (topo da imagem -> v_uv.y = 1). A repetição é feita no shader com fract.
export function loadTexture(gl, url, onReady) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const img = new Image();
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    if (onReady) onReady();
  };
  img.onerror = () => { console.warn('Textura não carregada: ' + url); };
  img.src = url;
  return tex;
}

export function readPixels(gl) {
  const w = gl.drawingBufferWidth;
  const h = gl.drawingBufferHeight;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return new Uint8ClampedArray(buf.buffer);
}
