const IDS = ['232:981','232:1083','232:1209'];
const page = await figma.getNodeByIdAsync('217:32');
await figma.setCurrentPageAsync(page);
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const paint = ps => { if (!Array.isArray(ps)) return undefined; const p = ps.find(p => p.visible !== false); if (!p) return undefined; if (p.type === 'SOLID') return hex(p.color) + (p.opacity !== undefined && p.opacity < 1 ? '@' + p.opacity.toFixed(2) : ''); return p.type; };
const RAIL = new Set(['rail', 'logo', 'rail selected', 'ic', 'me', 'logo A']);
const dump = (n, ox, oy, depth) => {
  if (n.visible === false) return null;
  if (depth === 1 && RAIL.has(n.name) && n.x < 90) return null;
  if (depth === 1 && n.type === 'TEXT' && n.characters === 'M' && n.x < 60) return null;
  const b = n.absoluteBoundingBox || { x: 0, y: 0, width: n.width, height: n.height };
  const o = { i: n.id, t: n.type.slice(0, 3), n: n.name, x: Math.round(b.x - ox), y: Math.round(b.y - oy), w: Math.round(b.width), h: Math.round(b.height) };
  if ('fills' in n) { const f = paint(n.fills); if (f) o.f = f; }
  if ('strokes' in n && n.strokes.length) { o.s = paint(n.strokes) + '/' + (n.strokeWeight === figma.mixed ? 2 : +(+n.strokeWeight).toFixed(1)) + (n.dashPattern && n.dashPattern.length ? '/d' : ''); }
  if ('cornerRadius' in n && n.cornerRadius && n.cornerRadius !== figma.mixed) o.r = n.cornerRadius;
  if ('effects' in n && n.effects.length) { const e = n.effects.find(e => e.visible && e.type === 'DROP_SHADOW'); if (e) o.e = `${e.offset.x},${e.offset.y},${e.radius},${hex(e.color)}`; }
  if (n.opacity !== undefined && n.opacity < 1) o.o = +n.opacity.toFixed(2);
  if (n.type === 'TEXT') {
    o.c = n.characters; const segs = n.getStyledTextSegments(['fontName', 'fontSize', 'fills']);
    const fn = segs[0].fontName; o.fn = fn.family + ' ' + fn.style; o.fs = segs[0].fontSize; o.f = paint(segs[0].fills);
    if (segs.length > 1) o.seg = segs.map(s => [s.start, s.end, s.fontName.style, paint(s.fills), s.fontSize]);
    const lh = n.lineHeight; if (lh !== figma.mixed && lh.unit !== 'AUTO') o.lh = lh.unit === 'PIXELS' ? lh.value : lh.value + '%';
    if (n.textAlignHorizontal !== 'LEFT') o.al = n.textAlignHorizontal[0];
    const ls = n.letterSpacing; if (ls !== figma.mixed && ls.value) o.ls = ls.value + (ls.unit === 'PERCENT' ? '%' : '');
    if (n.textCase && n.textCase !== 'ORIGINAL' && n.textCase !== figma.mixed) o.tc = n.textCase;
    if (n.textDecoration && n.textDecoration !== 'NONE' && n.textDecoration !== figma.mixed) o.td = n.textDecoration;
    return o;
  }
  if (n.type === 'INSTANCE') { o.mc = n.mainComponent ? n.mainComponent.name : '?'; o.txt = n.findAll(c => c.type === 'TEXT').map(c => c.characters); return o; }
  if ('children' in n && n.children.length) {
    const hasText = n.findOne(c => c.type === 'TEXT');
    if (!hasText && depth > 0) { o.art = 1; return o; }
    o.k = n.children.map(c => dump(c, ox, oy, depth + 1)).filter(Boolean);
  } else if (!['RECTANGLE', 'FRAME', 'ELLIPSE'].includes(n.type)) { o.art = 1; }
  return o;
};
const res = {};
for (const id of IDS) { const s = await figma.getNodeByIdAsync(id); const b = s.absoluteBoundingBox; res[id] = dump(s, b.x, b.y, 0); }
return res;