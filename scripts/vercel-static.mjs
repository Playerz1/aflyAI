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
console.log('static output ready:', out);
