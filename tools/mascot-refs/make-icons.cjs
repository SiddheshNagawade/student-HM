// Turns the ChatGPT icon sheets and builder poses into flat SVGs that use only the app colours.
// Usage: node make-icons.cjs <images-dir> <out-dir>      (needs: npm i sharp @neplex/vectorizer)
// Sheets (hero on top, a row of 2 or 3 small icons below) are cut into separate files: fix-<item>-hero.svg, fix-<item>-1..3.svg
// The builder poses keep one shared crop so the frames line up: build-1..3.svg, and the log: build-log.svg
const sharp = require('sharp');
const { vectorize, ColorMode, Hierarchical, PathSimplifyMode } = require('@neplex/vectorizer');
const fs = require('fs');
const path = require('path');

const [imgDir, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const NAVY = [0, 34, 78], CREAM = [255, 251, 243], YELLOW = [255, 210, 101], TAN = [227, 185, 135], LBLUE = [189, 221, 255], WHITE = [255, 255, 255]
// 0 navy 1 cream 2 yellow 3 tan 4 light blue 5 background (traced as navy, clipped away afterwards)
const PAL = [NAVY, CREAM, YELLOW, TAN, LBLUE, NAVY];
const NEAR = [[CREAM, 1], [YELLOW, 2], [TAN, 3], [LBLUE, 4], [WHITE, 5]];
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

function classify(r, g, b) {
  const lum = 0.3 * r + 0.59 * g + 0.11 * b;
  if (lum < 125) return 0;
  let best = 5, bd = 1e9;
  for (const [c, k] of NEAR) { const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < bd) { bd = d; best = k; } }
  return best;
}

async function loadCls(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const cls = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) cls[i] = classify(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
  // background = white-ish connected to the border; enclosed white (shine marks, highlights) becomes cream
  const bg = new Uint8Array(w * h); const st = [];
  const push = (p) => { if (cls[p] === 5 && !bg[p]) { bg[p] = 1; st.push(p); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (st.length) { const p = st.pop(); const x = p % w, y = (p / w) | 0; if (x > 0) push(p - 1); if (x < w - 1) push(p + 1); if (y > 0) push(p - w); if (y < h - 1) push(p + w); }
  // big enclosed white gaps (a handle, the space between table legs) are background too
  const seen = new Uint8Array(w * h);
  for (let s0 = 0; s0 < w * h; s0++) {
    if (cls[s0] !== 5 || bg[s0] || seen[s0]) continue;
    const comp = [s0]; seen[s0] = 1;
    for (let k = 0; k < comp.length; k++) { const p = comp[k]; const x = p % w, y = (p / w) | 0; for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) if (q >= 0 && cls[q] === 5 && !bg[q] && !seen[q]) { seen[q] = 1; comp.push(q); } }
    if (comp.length > 6000) for (const p of comp) bg[p] = 1;
  }
  for (let i = 0; i < w * h; i++) { if (cls[i] === 5 && !bg[i]) cls[i] = 1; if (bg[i]) cls[i] = 5; }
  return { cls, w, h };
}

const opts = { colorMode: ColorMode.Color, hierarchical: Hierarchical.Stacked, mode: PathSimplifyMode.Spline, filterSpeckle: 8, colorPrecision: 8, layerDifference: 1, cornerThreshold: 60, lengthThreshold: 4, maxIterations: 10, spliceThreshold: 45, pathPrecision: 1 };

/** Cuts the box [x0,y0,x1,y1] out of cls, traces it, writes name.svg, returns {w,h}. */
async function emit(name, cls, W, box) {
  let [x0, y0, x1, y1] = box;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const rgb = Buffer.alloc(cw * ch * 3);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const c = PAL[cls[(y + y0) * W + (x + x0)]]; const o = (y * cw + x) * 3; rgb[o] = c[0]; rgb[o + 1] = c[1]; rgb[o + 2] = c[2]; }
  const png = await sharp(rgb, { raw: { width: cw, height: ch, channels: 3 } }).png().toBuffer();
  let svg = await vectorize(png, opts);
  const paths = (svg.match(/<path[^>]*\/>/g) || []).map((m) => {
    const fill = m.match(/fill="(#[0-9a-fA-F]{6})"/)[1]; const v = [1, 3, 5].map((k) => parseInt(fill.slice(k, k + 2), 16));
    let best = 0, bd = 1e9; PAL.forEach((c, idx) => { const d = (c[0] - v[0]) ** 2 + (c[1] - v[1]) ** 2 + (c[2] - v[2]) ** 2; if (d < bd) { bd = d; best = idx; } });
    return m.replace(fill, hex(PAL[best]));
  });
  const mask = Buffer.alloc(cw * ch * 3, 255);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (cls[(y + y0) * W + (x + x0)] !== 5) mask.fill(0, (y * cw + x) * 3, (y * cw + x) * 3 + 3);
  const maskPng = await sharp(mask, { raw: { width: cw, height: ch, channels: 3 } }).blur(2).threshold(128).png().toBuffer();
  const maskSvg = await vectorize(maskPng, { ...opts, colorMode: ColorMode.Binary });
  const clip = (maskSvg.match(/<path[^>]*\/>/g) || []).map((m) => m.replace(/ fill="[^"]*"/, ''));
  const id = name + '-clip';
  svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cw} ${ch}" width="${cw}" height="${ch}">\n<defs><clipPath id="${id}">${clip.join('')}</clipPath></defs>\n<g clip-path="url(#${id})">\n${paths.join('\n')}\n</g>\n</svg>\n`;
  fs.writeFileSync(path.join(outDir, name + '.svg'), svg);
  console.log(name, cw + 'x' + ch, (svg.length / 1024).toFixed(0) + ' KB');
  return { w: cw, h: ch };
}

const bboxOf = (cls, W, x0, y0, x1, y1) => {
  let a = x1, b = y1, c = x0, d = y0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (cls[y * W + x] !== 5) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; }
  return c < a ? null : [Math.max(0, a - 6), Math.max(0, b - 6), Math.min(W - 1, c + 6), Math.min(y1, d + 6)];
};
/** Bands of consecutive non-empty rows (or columns), separated by empty runs of at least `gap`. */
function bands(has, n, gap) {
  const out = []; let start = -1, empty = 0;
  for (let i = 0; i < n; i++) {
    if (has[i]) { if (start < 0) start = i; empty = 0; } else if (start >= 0) { empty++; if (empty >= gap) { out.push([start, i - empty]); start = -1; } }
  }
  if (start >= 0) out.push([start, n - 1 - empty]);
  return out;
}

const SHEETS = { light: 3, switch: 3, window: 3, door: 3, bed: 3, table: 3, lamp: 3, washroom: 3, stairs: 2 };

(async () => {
  const report = {};
  for (const [item, count] of Object.entries(SHEETS)) {
    const { cls, w, h } = await loadCls(path.join(imgDir, `sheet-${item}.png`));
    const rows = new Uint8Array(h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cls[y * w + x] !== 5) { rows[y] = 1; break; }
    const rb = bands(rows, h, 40);
    if (rb.length < 2) { console.log('!! ' + item + ': expected two rows, got', rb.length); continue; }
    const hero = rb[0], row = [rb[1][0], rb[rb.length - 1][1]];
    report[item] = {};
    const hb = bboxOf(cls, w, 0, hero[0], w - 1, hero[1]);
    report[item].hero = await emit(`fix-${item}-hero`, cls, w, hb);
    // split the icon row: the (count-1) widest empty gaps between non-empty columns
    const cols = new Uint8Array(w);
    for (let x = 0; x < w; x++) for (let y = row[0]; y <= row[1]; y++) if (cls[y * w + x] !== 5) { cols[x] = 1; break; }
    let cb = bands(cols, w, 12);
    while (cb.length > count) { // merge the closest two neighbours
      let bi = 0, bg = 1e9; for (let i = 0; i < cb.length - 1; i++) { const g = cb[i + 1][0] - cb[i][1]; if (g < bg) { bg = g; bi = i; } }
      cb.splice(bi, 2, [cb[bi][0], cb[bi + 1][1]]);
    }
    if (cb.length !== count) console.log('!! ' + item + ': icon columns', cb.length, 'expected', count);
    for (let i = 0; i < cb.length; i++) {
      const bb = bboxOf(cls, w, cb[i][0], row[0], cb[i][1], row[1]);
      report[item][i + 1] = await emit(`fix-${item}-${i + 1}`, cls, w, bb);
    }
  }
  // builder poses share one crop
  const B = []; for (const n of [1, 2, 3]) B.push(await loadCls(path.join(imgDir, `builder-${n}.png`)));
  const { w, h } = B[0]; let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (const { cls } of B) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cls[y * w + x] !== 5) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const box = [Math.max(0, x0 - 6), Math.max(0, y0 - 6), Math.min(w - 1, x1 + 6), Math.min(h - 1, y1 + 6)];
  report.build = { crop: box };
  for (let i = 0; i < 3; i++) report.build[i + 1] = await emit(`build-${i + 1}`, B[i].cls, w, box);
  const L = await loadCls(path.join(imgDir, 'log.png'));
  report.build.log = await emit('build-log', L.cls, L.w, bboxOf(L.cls, L.w, 0, 0, L.w - 1, L.h - 1));
  fs.writeFileSync(path.join(outDir, 'icons.json'), JSON.stringify(report, null, 1));
})();
