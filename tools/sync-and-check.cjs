// Copies the shared code (tools/shared) into all three apps, then type-checks and builds each one.
// Usage:  node tools/sync-and-check.cjs [commit "message"]
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const root = 'D:/Hostel maintainance';
const nodeDir = process.env.LOCALAPPDATA + '/Programs/nodejs';
const env = { ...process.env, PATH: process.env.PATH + ';' + nodeDir.replace(/\//g, '\\') };
const shared = root + '/student-hm/tools/shared/src';
const files = ['fig/Fig.tsx', 'fig/backdrop.tsx', 'fig/preload.ts', 'fig/extras.tsx', 'fig/mascot.tsx', 'fig/anim.tsx', 'ds/stage.tsx', 'ds/viewport.ts', 'ds/nav.tsx', 'ds/fx.ts', 'ds/camera.tsx', 'fig/mascotState.ts'];
const log = []; const say = (s) => { log.push(s); console.log(s) };
for (const r of ['student-hm', 'technician-hm', 'supervisor-hm']) {
  for (const f of files) if (fs.existsSync(`${shared}/${f}`)) fs.copyFileSync(`${shared}/${f}`, `${root}/${r}/src/${f}`);
  fs.mkdirSync(`${root}/${r}/scripts`, { recursive: true }); fs.copyFileSync(`${root}/student-hm/tools/shared/scripts/make-bundles.cjs`, `${root}/${r}/scripts/make-bundles.cjs`);
  say('== ' + r);
  const run = (cmd) => { try { return execSync(cmd, { cwd: `${root}/${r}`, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) } catch (e) { return (e.stdout || '') + (e.stderr || '') } };
  const t = run('npx tsc -b').trim(); say(t ? t.split('\n').slice(0, 14).join('\n') : 'types ok');
  const b = run('npm run build'); say((b.match(/.*(built in|rror|packed).*/g) || ['(no build line)']).join('\n'));
}
say('DONE');
fs.writeFileSync(root + '/sync-check.log', log.join('\n'));
