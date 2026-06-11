// Gera malhas em JS (sem loader). Retorna {positions, normals, uvs, indices}.
// Cubo centrado na origem, lado 1 (range [-0.5, 0.5]). Esfera raio 0.5.

export function cube() {
  // 6 faces, 4 vértices cada (normais por face). +X,-X,+Y,-Y,+Z,-Z
  const faces = [
    { n: [ 1, 0, 0], v: [[ 0.5,-0.5, 0.5],[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[ 0.5, 0.5, 0.5]] },
    { n: [-1, 0, 0], v: [[-0.5,-0.5,-0.5],[-0.5,-0.5, 0.5],[-0.5, 0.5, 0.5],[-0.5, 0.5,-0.5]] },
    { n: [ 0, 1, 0], v: [[-0.5, 0.5, 0.5],[ 0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5]] },
    { n: [ 0,-1, 0], v: [[-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5, 0.5]] },
    { n: [ 0, 0, 1], v: [[-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5]] },
    { n: [ 0, 0,-1], v: [[ 0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5, 0.5,-0.5]] },
  ];
  const positions = [], normals = [], uvs = [], indices = [];
  const uvCorners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  faces.forEach((f, fi) => {
    for (let i = 0; i < 4; i++) {
      positions.push(...f.v[i]);
      normals.push(...f.n);
      uvs.push(...uvCorners[i]);
    }
    const o = fi * 4;
    indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}

export function sphere(segments = 24) {
  const positions = [], normals = [], uvs = [], indices = [];
  const R = 0.5;
  for (let y = 0; y <= segments; y++) {
    const v = y / segments;
    const phi = v * Math.PI;            // 0..PI (polo a polo)
    for (let x = 0; x <= segments; x++) {
      const u = x / segments;
      const theta = u * 2 * Math.PI;    // 0..2PI (volta)
      const nx = Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(theta);
      normals.push(nx, ny, nz);
      positions.push(nx * R, ny * R, nz * R);
      uvs.push(u, 1 - v);
    }
  }
  const row = segments + 1;
  for (let y = 0; y < segments; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * row + x;
      const b = a + row;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}
