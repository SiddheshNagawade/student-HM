// Commits and pushes all three apps to main.  Usage: node tools/ship.cjs "commit message"
const { execFileSync } = require('child_process');
const git = process.env.LOCALAPPDATA + '\\Programs\\Git\\cmd\\git.exe';
const msg = (process.argv[2] || 'Update') + '\n\nCo-Authored-By: Claude <noreply@anthropic.com>';
for (const r of ['student-hm', 'technician-hm', 'supervisor-hm']) {
  const cwd = 'D:/Hostel maintainance/' + r; console.log('== ' + r);
  const g = (...a) => { try { return execFileSync(git, a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) } catch (e) { return (e.stdout || '') + (e.stderr || '') } };
  g('add', '-A', '.', ':!tsconfig.tsbuildinfo', ':!tools/mascot-refs/preview');
  console.log(g('commit', '-q', '-m', msg).trim() || 'committed');
  console.log(g('log', '--oneline', '-1').trim());
  console.log(g('push', 'origin', 'HEAD:main').trim());
}
