// Packs each screen's drawings into ONE file, so opening a screen is one request instead of one per drawing.
// Reads src/*/fig.json, writes public/fig/_b/<frame>.json = { "<drawing name>": "<svg text>" }.
// Runs before every build (npm "prebuild"), and by hand:  node scripts/make-bundles.cjs
const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..');
const figDir = path.join(root, 'public', 'fig'); const outDir = path.join(figDir, '_b');
fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
const jsons = fs.readdirSync(path.join(root, 'src')).map(d => path.join(root, 'src', d, 'fig.json')).filter(f => fs.existsSync(f));
const name = (id) => id.replace(':', '-');
let frames = 0, bytes = 0;
for (const j of jsons) {
  const data = JSON.parse(fs.readFileSync(j, 'utf8'));
  const list = Object.values(data.screens || data).filter(f => f && typeof f === 'object' && typeof f.i === 'string' && Array.isArray(f.k));
  for (const frame of list) {
    const names = new Set();
    const walk = (n) => {
      if (n.art) names.add(name(n.i));
      if (n.t === 'INS') { const mc = n.mc || ''; if (mc === 'Back') names.add('kit-217-72'); else if (mc === 'Speaker') names.add('kit-217-76'); else if (mc === 'LangPill') names.add('kit-217-81') }
      (n.k || []).forEach(walk);
    };
    frame.k.forEach(walk);
    const out = {};
    for (const n of names) { const f = path.join(figDir, n + '.svg'); if (fs.existsSync(f)) out[n] = fs.readFileSync(f, 'utf8') }
    const file = path.join(outDir, name(frame.i) + '.json');
    fs.writeFileSync(file, JSON.stringify(out)); frames++; bytes += fs.statSync(file).size;
  }
}
console.log(`packed ${frames} screens into public/fig/_b (${(bytes / 1048576).toFixed(1)} MB before compression)`);
