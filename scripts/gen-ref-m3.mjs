// Gera a imagem-referência do exercício do Módulo 3 SEM navegador.
// 320x320 RGBA cinza: onda senoidal de brilho na horizontal.
// Mesma cor que o shader-alvo: vec3(sin(v_uv.x * 6.2831) * 0.5 + 0.5).
// Amostra no centro do pixel: t = (x + 0.5) / W. Usa o MESMO literal 6.2831 do
// shader pra casar exatamente. Onda é y-invariante (só depende de x).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// ATENÇÃO: precisa casar com o canvas em playground.js (_render: 320x320).
const W = 320, H = 320;
const TAU = 6.2831;

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

// --- pixels: filtro 0 por scanline + RGBA ---
const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  const row = y * (1 + W * 4);
  raw[row] = 0; // filter type none
  for (let x = 0; x < W; x++) {
    const o = row + 1 + x * 4;
    const t = (x + 0.5) / W;
    const v = Math.round(255 * (Math.sin(t * TAU) * 0.5 + 0.5));
    raw[o] = v;      // R
    raw[o + 1] = v;  // G
    raw[o + 2] = v;  // B
    raw[o + 3] = 255;
  }
}

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync('site/assets/ref', { recursive: true });
writeFileSync('site/assets/ref/m3-onda-sin.png', png);
console.log(`OK: site/assets/ref/m3-onda-sin.png (${png.length} bytes)`);
