// Gera a imagem-referência do exercício do Módulo 4 SEM navegador.
// 320x320 RGBA cinza: UNIÃO (max) de dois círculos suaves que se cruzam.
// Shader-alvo:
//   d1 = length(v_uv - vec2(0.35, 0.5)); d2 = length(v_uv - vec2(0.65, 0.5));
//   c1 = smoothstep(0.25, 0.24, d1);     c2 = smoothstep(0.25, 0.24, d2);
//   shape = max(c1, c2);  cor = vec3(shape)
// Os dois centros estão em y=0.5 -> a imagem é simétrica no eixo vertical,
// então a orientação (Y-flip do readPixels) não afeta a comparação.
// smoothstep/length implementados idênticos ao GLSL pra casar byte a byte.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// ATENÇÃO: precisa casar com o canvas em playground.js (_render: 320x320).
const W = 320, H = 320;

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
// smoothstep(e0, e1, x) do GLSL (funciona com e0 > e1 tambem)
function smoothstep(e0, e1, x) {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}
function len(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

// --- CRC32 (tabela) ---
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// --- pixels ---
const raw = Buffer.alloc(H * (1 + W * 4));
for (let py = 0; py < H; py++) {
  const row = py * (1 + W * 4);
  raw[row] = 0; // filter none
  const uvy = (py + 0.5) / H; // y-simétrico: mapa exato é irrelevante
  for (let px = 0; px < W; px++) {
    const o = row + 1 + px * 4;
    const uvx = (px + 0.5) / W;
    const d1 = len(uvx, uvy, 0.35, 0.5);
    const d2 = len(uvx, uvy, 0.65, 0.5);
    const c1 = smoothstep(0.25, 0.24, d1);
    const c2 = smoothstep(0.25, 0.24, d2);
    const v = Math.round(255 * Math.max(c1, c2));
    raw[o] = v; raw[o + 1] = v; raw[o + 2] = v; raw[o + 3] = 255;
  }
}

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync('site/assets/ref', { recursive: true });
writeFileSync('site/assets/ref/m4-dois-circulos.png', png);
console.log(`OK: site/assets/ref/m4-dois-circulos.png (${png.length} bytes)`);
