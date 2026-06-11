// Gera uma textura de exemplo SEM dependências: 128x128 (potência de 2),
// 4 quadrantes de cores distintas + uma barra branca no TOPO e um ponto preto
// no canto inferior-esquerdo, pra que a ORIENTAÇÃO (topo/base, esquerda/direita)
// seja óbvia ao colar no objeto (detecta flip de UV na hora).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const W = 128, H = 128; // top-down (linha 0 = topo da imagem)

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
for (let y = 0; y < H; y++) {
  const row = y * (1 + W * 4); raw[row] = 0;
  for (let x = 0; x < W; x++) {
    const o = row + 1 + x * 4;
    const left = x < W / 2, top = y < H / 2;
    let r, g, b;
    if (top && left) { r = 220; g = 50; b = 50; }        // topo-esq vermelho
    else if (top && !left) { r = 60; g = 180; b = 70; }  // topo-dir verde
    else if (!top && left) { r = 60; g = 110; b = 220; } // base-esq azul
    else { r = 230; g = 200; b = 40; }                   // base-dir amarelo
    // barra branca nas 8 primeiras linhas (TOPO)
    if (y < 8) { r = 245; g = 245; b = 245; }
    // ponto preto no canto base-esquerdo
    if (x < 14 && y > H - 14) { r = 20; g = 20; b = 20; }
    raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
  }
}

const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
mkdirSync('site/assets/tex', { recursive: true });
writeFileSync('site/assets/tex/exemplo.png', png);
console.log(`OK: site/assets/tex/exemplo.png (${png.length} bytes)`);
