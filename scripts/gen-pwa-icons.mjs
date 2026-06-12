// Gera os PNGs do ícone do app a partir de um SVG inline, via Playwright.
// Rodar: node scripts/gen-pwa-icons.mjs  (precisa do chromium do Playwright)
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'site', 'assets', 'img');

// safe = fração central usada pelo motivo (maskable usa menos p/ caber na safe zone).
function svg(safe) {
  const pad = (1 - safe) / 2 * 512;
  const a = pad, b = 512 - pad, mid = 256;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1c7ed6"/>
      <stop offset="1" stop-color="#e8590c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <path d="M ${a} ${mid} C ${a + (b - a) * 0.25} ${mid - (b - a) * 0.28}, ${a + (b - a) * 0.45} ${mid - (b - a) * 0.28}, ${mid} ${mid}
           S ${b - (b - a) * 0.05} ${mid + (b - a) * 0.28}, ${b} ${mid}"
        fill="none" stroke="#ffffff" stroke-width="34" stroke-linecap="round" opacity="0.95"/>
</svg>`;
}

async function shoot(page, svgStr, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;padding:0}svg{display:block;width:${size}px;height:${size}px}</style>${svgStr}`,
    { waitUntil: 'networkidle' }
  );
  const buf = await page.screenshot({ omitBackground: false });
  await writeFile(join(OUT, file), buf);
  console.log('  ' + file + ' (' + size + 'px)');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
console.log('Gerando ícones do app:');
await shoot(page, svg(0.86), 192, 'app-icon-192.png');
await shoot(page, svg(0.86), 512, 'app-icon-512.png');
await shoot(page, svg(0.62), 512, 'app-icon-maskable.png'); // motivo menor (safe zone)
await shoot(page, svg(0.86), 180, 'apple-touch-icon.png');
await browser.close();
console.log('Ícones gerados em site/assets/img/.');
