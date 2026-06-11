// Gera a imagem-referência do exercício do Módulo 9 SEM navegador.
// 320x320 RGBA cinza: o padrão se REPETE 3x na horizontal via fract.
// Shader-alvo: vec3(fract(v_uv.x * 3.0))  (y-invariante -> imune ao Y-flip).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const W = 320, H = 320;
const N = 3.0;

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crc]);
}

const raw = Buffer.alloc(H * (1 + W * 4));
for (let py = 0; py < H; py++) {
  const row = py * (1 + W * 4); raw[row] = 0;
  for (let px = 0; px < W; px++) {
    const o = row + 1 + px * 4;
    const uvx = (px + 0.5) / W;
    const f = (uvx * N) - Math.floor(uvx * N); // fract
    const g = Math.round(255 * f);
    raw[o] = g; raw[o + 1] = g; raw[o + 2] = g; raw[o + 3] = 255;
  }
}

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
mkdirSync('site/assets/ref', { recursive: true });
writeFileSync('site/assets/ref/m9-fract-uv.png', png);
console.log(`OK: site/assets/ref/m9-fract-uv.png (${png.length} bytes)`);
