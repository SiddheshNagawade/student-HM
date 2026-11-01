// Turns the ChatGPT beaver PNGs into flat SVGs that use only the 4 app colours.
// Usage: node make-vectors.cjs <poses-dir> <out-dir>
const sharp = require('sharp');
const { vectorize, ColorMode, Hierarchical, PathSimplifyMode } = require('@neplex/vectorizer');
const fs = require('fs');
const path = require('path');

const [posesDir, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const NAVY = [0, 34, 78], CREAM = [255, 251, 243], YELLOW = [255, 210, 101], TAN = [227, 185, 135], WHITE = [255, 255, 255];
// index 4 is "background": traced as navy (it is clipped away afterwards, so any sliver outside the outline is navy too)
const PAL = [NAVY, CREAM, YELLOW, TAN, NAVY];
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

// series: frames, name, where the tail sits (null = no tail), centroid-x limit for "tail"
const SERIES = [
  { name: 'mascot-peek', frames: ['1a', '1b', '1c'], tailMaxX: 0.28 },
  { name: 'mascot-hang', frames: ['2a', '2b'], tailMaxX: 0.36 },
  { name: 'mascot-cheer', frames: ['3a', '3b-v2'], tailMaxX: null },
];

// 0 navy, 1 cream, 2 yellow, 3 tan, 4 white
function classify(r, g, b) {
  const lum = 0.3 * r + 0.59 * g + 0.11 * b;
  if (lum < 130) return 0;
  if (r - b >= 45) {
    // warm: yellow or tan (tan is split out later by position)
    return 2;
  }
  return b >= 249 ? 4 : 1;
}

async function load(frame, tailMaxX) {
  const { data, info } = await sharp(path.join(posesDir, frame + '.png')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const cls = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) cls[i] = classify(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);

  // tail: warm components whose centroid sits on the tail side
  if (tailMaxX !== null) {
    const seen = new Uint8Array(w * h);
    const stack = [];
    for (let s = 0; s < w * h; s++) {
      if (cls[s] !== 2 || seen[s]) continue;
      const comp = [];
      let sx = 0;
      stack.push(s); seen[s] = 1;
      while (stack.length) {
        const p = stack.pop();
        comp.push(p); sx += p % w;
        const x = p % w, y = (p / w) | 0;
        if (x > 0 && cls[p - 1] === 2 && !seen[p - 1]) { seen[p - 1] = 1; stack.push(p - 1); }
        if (x < w - 1 && cls[p + 1] === 2 && !seen[p + 1]) { seen[p + 1] = 1; stack.push(p + 1); }
        if (y > 0 && cls[p - w] === 2 && !seen[p - w]) { seen[p - w] = 1; stack.push(p - w); }
        if (y < h - 1 && cls[p + w] === 2 && !seen[p + w]) { seen[p + w] = 1; stack.push(p + w); }
      }
      if (comp.length > 40 && sx / comp.length / w < tailMaxX) for (const p of comp) cls[p] = 3;
    }
  }

  // background = white connected to the border; any other white (teeth, shine dots) becomes cream
  const bg = new Uint8Array(w * h);
  const st = [];
  const push = (p) => { if (cls[p] === 4 && !bg[p]) { bg[p] = 1; st.push(p); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (st.length) {
    const p = st.pop(); const x = p % w, y = (p / w) | 0;
    if (x > 0) push(p - 1); if (x < w - 1) push(p + 1); if (y > 0) push(p - w); if (y < h - 1) push(p + w);
  }
  // big enclosed white gaps (between an arm and the body, say) are background too; small ones are teeth / shine dots
  const seenW = new Uint8Array(w * h);
  for (let s0 = 0; s0 < w * h; s0++) {
    if (cls[s0] !== 4 || bg[s0] || seenW[s0]) continue;
    const comp = [s0]; seenW[s0] = 1;
    for (let k = 0; k < comp.length; k++) {
      const p = comp[k]; const x = p % w, y = (p / w) | 0;
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
      for (const q of nb) if (q >= 0 && cls[q] === 4 && !bg[q] && !seenW[q]) { seenW[q] = 1; comp.push(q); }
    }
    if (comp.length > 20000) for (const p of comp) bg[p] = 1;
  }
  for (let i = 0; i < w * h; i++) if (cls[i] === 4 && !bg[i]) cls[i] = 1;
  for (let i = 0; i < w * h; i++) if (bg[i]) cls[i] = 4;
  return { cls, w, h };
}

(async () => {
  const report = {};
  for (const s of SERIES) {
    const frames = [];
    for (const f of s.frames) frames.push(await load(f, s.tailMaxX));
    const { w, h } = frames[0];
    // one crop for the whole series so frames line up
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (const { cls } of frames)
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cls[y * w + x] !== 4) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const pad = 6;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    report[s.name] = { crop: [x0, y0, cw, ch], source: [w, h] };

    for (let i = 0; i < frames.length; i++) {
      const { cls } = frames[i];
      const rgb = Buffer.alloc(cw * ch * 3);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const c = PAL[cls[(y + y0) * w + (x + x0)]];
        const o = (y * cw + x) * 3; rgb[o] = c[0]; rgb[o + 1] = c[1]; rgb[o + 2] = c[2];
      }
      const png = await sharp(rgb, { raw: { width: cw, height: ch, channels: 3 } }).png().toBuffer();
      fs.writeFileSync(path.join(outDir, `${s.name}-${i + 1}.snapped.png`), png);
      let svg = await vectorize(png, {
        colorMode: ColorMode.Color,
        hierarchical: Hierarchical.Stacked,
        mode: PathSimplifyMode.Spline,
        filterSpeckle: 6,
        colorPrecision: 8,
        layerDifference: 1,
        cornerThreshold: 60,
        lengthThreshold: 4,
        maxIterations: 10,
        spliceThreshold: 45,
        pathPrecision: 1,
      });
      // snap every fill to the exact app colour
      const paths = (svg.match(/<path[^>]*\/>/g) || []).map((m) => {
        const fill = m.match(/fill="(#[0-9a-fA-F]{6})"/)[1];
        const v = [1, 3, 5].map((k) => parseInt(fill.slice(k, k + 2), 16));
        let best = 0, bd = 1e9;
        PAL.forEach((c, idx) => { const d = (c[0] - v[0]) ** 2 + (c[1] - v[1]) ** 2 + (c[2] - v[2]) ** 2; if (d < bd) { bd = d; best = idx; } });
        return m.replace(fill, hex(PAL[best]));
      });

      // silhouette of the character (everything that is not background), traced on its own and used as a clip
      const mask = Buffer.alloc(cw * ch * 3, 255);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (cls[(y + y0) * w + (x + x0)] !== 4) mask.fill(0, (y * cw + x) * 3, (y * cw + x) * 3 + 3);
      const maskPng = await sharp(mask, { raw: { width: cw, height: ch, channels: 3 } }).blur(2.2).threshold(128).png().toBuffer();
      const maskSvg = await vectorize(maskPng, {
        colorMode: ColorMode.Binary,
        hierarchical: Hierarchical.Stacked,
        mode: PathSimplifyMode.Spline,
        filterSpeckle: 6,
        colorPrecision: 8,
        layerDifference: 1,
        cornerThreshold: 60,
        lengthThreshold: 4,
        maxIterations: 10,
        spliceThreshold: 45,
        pathPrecision: 1,
      });
      const clipPaths = (maskSvg.match(/<path[^>]*\/>/g) || []).map((m) => m.replace(/ fill="[^"]*"/, ''));
      const id = `${s.name}-${i + 1}-clip`;
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cw} ${ch}" width="${cw}" height="${ch}">\n<defs><clipPath id="${id}">${clipPaths.join('')}</clipPath></defs>\n<g clip-path="url(#${id})">\n${paths.join('\n')}\n</g>\n</svg>\n`;
      const file = path.join(outDir, `${s.name}-${i + 1}.svg`);
      fs.writeFileSync(file, svg);
      console.log(file, (svg.length / 1024).toFixed(0) + ' KB', (svg.match(/<path/g) || []).length + ' paths');
    }
  }
  fs.writeFileSync(path.join(outDir, 'crops.json'), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report));
})();
