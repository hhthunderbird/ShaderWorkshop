// Glue WebGL1. Verificado visualmente, não por unit test.

const QUAD_VERTEX = `
attribute vec2 a_position;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

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

export function setupQuad(gl, program) {
  const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
  const uvLoc = gl.getAttribLocation(program, 'a_uv');
  if (uvLoc !== -1) {
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
  }

  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return 6; // index count
}

// Aplica uniforms automáticos + de controle e desenha.
export function renderFrame(gl, program, indexCount, uniforms) {
  gl.useProgram(program);
  const set = (name, fn) => {
    const loc = gl.getUniformLocation(program, name);
    if (loc !== null) fn(loc);
  };
  if (uniforms.u_time !== undefined) set('u_time', (l) => gl.uniform1f(l, uniforms.u_time));
  if (uniforms.u_resolution) set('u_resolution', (l) => gl.uniform2f(l, uniforms.u_resolution[0], uniforms.u_resolution[1]));
  if (uniforms.u_mouse) set('u_mouse', (l) => gl.uniform2f(l, uniforms.u_mouse[0], uniforms.u_mouse[1]));
  for (const [name, val] of Object.entries(uniforms.controls || {})) {
    if (Array.isArray(val)) set(name, (l) => gl.uniform3f(l, val[0], val[1], val[2]));
    else set(name, (l) => gl.uniform1f(l, val));
  }
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
}

export function readPixels(gl) {
  const w = gl.drawingBufferWidth;
  const h = gl.drawingBufferHeight;
  const buf = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  return new Uint8ClampedArray(buf.buffer);
}
