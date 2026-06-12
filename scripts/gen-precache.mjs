// Varre site/ e gera site/precache.json (lista de assets p/ o service worker).
// Exclui o proprio precache.json e o sw.js. So usa node built-ins (roda em CI sem npm install).
// Rodar: node scripts/gen-precache.mjs
import { readdir, writeFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const SITE = join(process.cwd(), 'site');
const SKIP = new Set(['precache.json', 'sw.js']);

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const st = await stat(full);
    if (st.isDirectory()) out.push(...await walk(full));
    else {
      const rel = relative(SITE, full).split(sep).join('/');
      if (!SKIP.has(rel)) out.push(rel);
    }
  }
  return out;
}

const list = (await walk(SITE)).sort();
await writeFile(join(SITE, 'precache.json'), JSON.stringify(list, null, 0) + '\n');
console.log(`precache.json: ${list.length} arquivos.`);
