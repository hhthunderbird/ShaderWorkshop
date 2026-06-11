// Matrizes 4x4 column-major (convenção WebGL). Cada matriz é um Array de 16.
// Índice [col*4 + row]. multiply(a,b) = a·b (aplica b, depois a).

export function identity() {
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
}

export function multiply(a, b) {
  const out = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = s;
    }
  }
  return out;
}

export function translation(x, y, z) {
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
}

export function scaling(x, y, z) {
  return [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
}

export function rotateY(rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];
}

export function rotateX(rad) {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];
}

export function perspective(fovyRad, aspect, near, far) {
  const f = 1 / Math.tan(fovyRad / 2);
  const nf = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ];
}

// 3x3 superior-esquerda (válida como normal matrix p/ rotação + escala uniforme,
// que é tudo que o curso usa). Column-major (Array de 9).
export function mat3FromMat4(m) {
  return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
}
