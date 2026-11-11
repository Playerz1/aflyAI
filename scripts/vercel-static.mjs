import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const name of fs.readdirSync(root)) {
  if (!name.toLowerCase().endsWith('.html')) continue;
  const src = path.join(root, name);
  if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(out, name));
}
const assets = path.join(root, 'assets');
if (fs.existsSync(assets)) fs.cpSync(assets, path.join(out, 'assets'), { recursive: true });

// Copia as funções serverless da API para o output directory
const apiDir = path.join(root, 'api');
if (fs.existsSync(apiDir)) fs.cpSync(apiDir, path.join(out, 'api'), { recursive: true });

console.log('static output ready:', out);
