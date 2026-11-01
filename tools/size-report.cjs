// Prints what each app ships: the built JS and CSS, and the biggest drawings. Usage: node tools/size-report.cjs
const fs = require('fs'); const path = require('path'); const zlib = require('zlib');
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
for (const r of ['student-hm', 'technician-hm', 'supervisor-hm']) {
  const dir = `D:/Hostel maintainance/${r}`; console.log('== ' + r);
  const a = `${dir}/dist/assets`;
  if (fs.existsSync(a)) for (const f of fs.readdirSync(a)) { const b = fs.readFileSync(path.join(a, f)); console.log('  dist/assets/' + f.slice(0, 40).padEnd(40), kb(b.length).padStart(8), ' gzip', kb(zlib.gzipSync(b).length).padStart(7)) }
  const fig = `${dir}/public/fig`; const list = fs.readdirSync(fig).map(f => [f, fs.statSync(path.join(fig, f)).size]).sort((x, y) => y[1] - x[1]);
  const total = list.reduce((s, x) => s + x[1], 0); console.log(`  public/fig: ${list.length} files, ${(total / 1048576).toFixed(1)} MB; biggest:`);
  console.log('   ' + list.slice(0, 8).map(x => x[0] + ' ' + kb(x[1])).join(' | '));
  const jsonf = fs.readdirSync(`${dir}/src`).filter(x => !x.includes('.')).flatMap(d => fs.existsSync(`${dir}/src/${d}/fig.json`) ? [`${dir}/src/${d}/fig.json`] : []);
  for (const j of jsonf) console.log('  fig.json (screens as data): ' + kb(fs.statSync(j).size));
}
