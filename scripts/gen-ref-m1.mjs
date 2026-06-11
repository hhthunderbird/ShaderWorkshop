// Gera a imagem-referência do exercício do Módulo 1 SEM navegador.
// 320x320 RGBA: metade esquerda vermelha, metade direita azul.
// PNG escrito à mão (IHDR/IDAT/IEND) usando zlib nativo do node.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const W = 320, H = 320;

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
    const left = x < W / 2;
    raw[o] = left ? 255 : 0;     // R
    raw[o + 1] = 0;              // G
    raw[o + 2] = left ? 0 : 255; // B
    raw[o + 3] = 255;            // A
  }
}

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync('site/assets/ref', { recursive: true });
writeFileSync('site/assets/ref/m1-meio-a-meio.png', png);
console.log(`OK: site/assets/ref/m1-meio-a-meio.png (${png.length} bytes)`);
