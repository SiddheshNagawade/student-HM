/* Extra life for the screens, drawn in the same hand as the Figma: navy outline, flat cream / yellow fills.
   Everything here plays once and then rests. No text is ever animated.
   - ScoreDial: a half-circle of dots (like the dot charts) with a needle that swings and settles.
   - InkStamp: a rough brick stamp mark that comes down, presses, and sends out one ring of ink.
   - StepHop: a small token that hops from one step marker to the next, once. */
import { ReactNode, useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { fx } from '../ds/fx'
import { useAssets } from './preload'

const NAVY = '#00224E', CREAM = '#FFFBF3', YELLOW = '#FFD265', BRICK = '#B8530A'

/* ------------------------------------------------------------------ ScoreDial */
/** Half-circle of dots. `value` is 0 to 1 along the arc; dots past `cap` are the "over" zone (brick).
    On first show the needle sweeps up from empty; when `value` changes it swings to the new reading. */
export function ScoreDial({ value, w = 220, dots = 15, dotR, cap = 0.8, sound = false, delay = 0.25, children }: {
  value: number; w?: number; dots?: number; dotR?: number; cap?: number | null; sound?: boolean; delay?: number; children?: ReactNode
}) {
  const reduce = useReducedMotion()
  const h = Math.round(w * 0.6), cx = w / 2, cy = Math.round(w * 0.53), R = w * 0.4, dr = dotR ?? Math.max(3, w * 0.028)
  const [frac, setFrac] = useState(reduce ? value : 0)
  const at = useRef(reduce ? value : 0); const run = useRef<{ stop: () => void } | null>(null); const first = useRef(true)
  useEffect(() => {
    run.current?.stop()
    const to = Math.max(0, Math.min(1, value))
    const set = (v: number) => { at.current = v; setFrac(v) }
    if (reduce) { set(to); return }
    run.current = animate(at.current, to, { type: 'spring', stiffness: 90, damping: 9, mass: 0.9, delay: first.current ? delay : 0, onUpdate: set })
    first.current = false
    return () => run.current?.stop()
  }, [value])
  const lastLit = useRef(0)
  const lit = Array.from({ length: dots }, (_, k) => (k + 0.5) / dots <= frac)
  const litN = lit.filter(Boolean).length
  useEffect(() => { if (sound && litN > lastLit.current) fx.tick(litN % 6); lastLit.current = litN }, [litN])
  const ang = Math.max(0, Math.min(1.08, frac)) * 180 // degrees of swing from the left end
  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
        {/* the ground line, wobbling a little like the chart axis */}
        <path d={`M${cx - R - dr - 6} ${cy + dr + 5}C${cx - R * 0.5} ${cy + dr + 7} ${cx + R * 0.3} ${cy + dr + 3} ${cx + R + dr + 6} ${cy + dr + 5}`} stroke={NAVY} strokeWidth={2.4} strokeLinecap="round" />
        {/* the line past which a day is too full */}
        {cap !== null && (() => { const a = Math.PI * (1 - cap), x1 = cx + (R - dr - 7) * Math.cos(a), y1 = cy - (R - dr - 7) * Math.sin(a), x2 = cx + (R + dr + 9) * Math.cos(a), y2 = cy - (R + dr + 9) * Math.sin(a); return <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={NAVY} strokeWidth={1.8} strokeDasharray="3 4" strokeLinecap="round" /> })()}
        {lit.map((on, k) => {
          const f = (k + 0.5) / dots, a = Math.PI * (1 - f), over = cap !== null && f > cap
          const x = cx + R * Math.cos(a), y = cy - R * Math.sin(a), col = over ? BRICK : NAVY
          return <circle key={k} cx={x} cy={y} r={dr} fill={on ? col : CREAM} stroke={on ? NAVY : col} strokeWidth={2} style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: on ? 'scale(1.12)' : 'scale(0.86)', transition: 'transform .22s cubic-bezier(.3,1.6,.5,1)' }} />
        })}
        <g transform={`rotate(${ang} ${cx} ${cy})`}>
          <path d={`M${cx - 6} ${cy + 0.5}C${cx - R * 0.4} ${cy - 2.5} ${cx - R * 0.65} ${cy + 1.5} ${cx - R * 0.8} ${cy}`} stroke={NAVY} strokeWidth={Math.max(3, w * 0.02)} strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r={Math.max(6, w * 0.045)} fill={YELLOW} stroke={NAVY} strokeWidth={2.6} />
      </svg>
      {children && <div style={{ position: 'absolute', left: 0, right: 0, top: cy + dr + 12, textAlign: 'center', pointerEvents: 'none' }}>{children}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ InkStamp */
/** A stamp mark: a rough ring with a tick, in brick ink. Comes down, presses, one ripple of ink, rests. */
export function InkStamp({ size = 120, delay = 0, rot = -8 }: { size?: number; delay?: number; rot?: number }) {
  const reduce = useReducedMotion()
  const mark = useRef<SVGSVGElement>(null); const ring = useRef<HTMLDivElement>(null)
  // driven by hand: the mark falls and squashes onto the page, then one ring of ink spreads out and fades
  useEffect(() => {
    const m = mark.current!, r = ring.current!
    if (reduce) { m.style.transform = `rotate(${rot}deg)`; return }
    const t0 = performance.now() + delay * 1000; let raf = 0, hit = false
    const eIn = (t: number) => t * t, eOut = (t: number) => 1 - (1 - t) * (1 - t)
    m.style.opacity = '0'; r.style.opacity = '0'
    const tick = (now: number) => {
      const t = (now - t0) / 1000
      if (t >= 0) {
        const a = Math.min(1, t / 0.24) // falling
        const b = Math.max(0, Math.min(1, (t - 0.24) / 0.2)) // settling after the hit
        const s = t < 0.24 ? 2.1 - 1.2 * eIn(a) : 0.9 + 0.1 * eOut(b)
        const y = t < 0.24 ? -26 * (1 - eIn(a)) : 0, rt = t < 0.24 ? rot - 16 * (1 - eIn(a)) : rot
        m.style.opacity = String(Math.min(1, t / 0.08)); m.style.transform = `translateY(${y}px) rotate(${rt}deg) scale(${s})`
        if (t >= 0.24 && !hit) { hit = true; fx.stamp() }
        const q = Math.max(0, Math.min(1, (t - 0.24) / 0.62))
        r.style.opacity = q > 0 && q < 1 ? String(0.5 * (1 - q)) : '0'; r.style.transform = `scale(${0.8 + 0.75 * eOut(q)})`
      }
      if (t < 0.9) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div style={{ position: 'relative', width: size, height: size, pointerEvents: 'none' }}>
      <div ref={ring} style={{ position: 'absolute', inset: size * 0.06, borderRadius: '50%', border: `${Math.max(3, size * 0.035)}px solid ${BRICK}`, opacity: 0 }} />
      <svg ref={mark} width={size} height={size} viewBox="0 0 120 120" fill="none" style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply' }} aria-hidden="true">
        <path d="M60 8C88 7 112 30 112 60C112 90 88 113 59 112C30 112 8 89 8 59C8 29 31 9 60 8Z" stroke={BRICK} strokeWidth="7" strokeLinecap="round" />
        <path d="M60 19C82 19 101 37 101 60C101 83 82 101 60 101C38 101 19 83 19 60C19 38 38 19 60 19Z" stroke={BRICK} strokeWidth="2.4" strokeDasharray="4 7" strokeLinecap="round" />
        <path d="M36 62L53 79L85 42" stroke={BRICK} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="104" cy="22" r="3" fill={BRICK} /><circle cx="12" cy="96" r="2.4" fill={BRICK} /><circle cx="97" cy="104" r="2" fill={BRICK} />
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ BuilderLoader */
const BASE = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL
const BUILD = [1, 2, 3].map(n => `${BASE}fig/build-${n}.svg`), LOG = `${BASE}fig/build-log.svg`
// where each of the 6 logs rests (a 3 - 2 - 1 pile), in a 360 x 300 scene
const SLOTS = [[205, 270], [257, 270], [309, 270], [231, 241], [283, 241], [257, 212]] as const
/** The beaver builds a log pile, one hammer hit per log, then cheers. Plays once over `ms` and calls `onDone`.
    Everything is drawn from the traced poses (public/fig/build-*.svg); the timing is driven by hand so it never jumps. */
export function BuilderLoader({ ms = 3600, scale = 1, onDone, sound = true }: { ms?: number; scale?: number; onDone?: () => void; sound?: boolean }) {
  const reduce = useReducedMotion()
  const [t, setT] = useState(reduce ? ms : 0)
  const ready = useAssets([...BUILD, LOG]) // the clock starts only when every picture is here
  const done = useRef(false); const hits = useRef(0)
  const HIT = 6, LEAD = 380, TAIL = 520, step = (ms - LEAD - TAIL) / HIT
  useEffect(() => {
    if (!ready) return
    if (reduce) { const k = setTimeout(() => onDone?.(), 500); return () => clearTimeout(k) }
    const t0 = performance.now(); let raf = 0
    const tick = (now: number) => {
      const e = now - t0; setT(e)
      const k = Math.floor((e - LEAD - step * 0.5) / step) // the hit lands halfway through each step
      while (hits.current <= k && hits.current < HIT) { if (sound) fx.tick(hits.current % 6); hits.current++ }
      if (e >= ms && !done.current) { done.current = true; if (sound) fx.success(); onDone?.() }
      if (e < ms + 50) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready])
  if (!ready) return <div style={{ width: 360 * scale, height: 300 * scale }} />
  const k = Math.floor((t - LEAD) / step), within = ((t - LEAD) - k * step) / step // which hit, and how far into it (0 to 1)
  const building = t >= LEAD && k < HIT
  const finished = t >= LEAD + HIT * step
  const frame = finished ? 2 : building ? (within < 0.5 ? 0 : 1) : 0
  const squash = building && within >= 0.5 && within < 0.75 ? Math.sin(((within - 0.5) / 0.25) * Math.PI) * 0.035 : 0
  const logs = SLOTS.map((s, i) => {
    const hitAt = LEAD + i * step + step * 0.5 // when the hammer lands for log i
    const a = (t - hitAt) / (step * 0.55) // 0 to 1 while it falls and settles
    if (a < 0) return null
    const p = Math.min(1, a)
    const fall = (1 - p) * (1 - p) * -150 // starts above, eases down
    const bounce = p >= 1 ? 0 : p > 0.7 ? -Math.sin(((p - 0.7) / 0.3) * Math.PI) * 6 : 0
    return <img key={i} src={LOG} alt="" draggable={false} style={{ position: 'absolute', left: s[0], top: s[1] + fall + bounce - 34, width: 54, opacity: Math.min(1, p * 4), transform: `rotate(${(1 - p) * (i % 2 ? 16 : -16)}deg)` }} />
  })
  // a few chips fly off at every hit
  const chips = building ? Array.from({ length: 4 }, (_, c) => {
    const q = (t - (LEAD + k * step + step * 0.5)) / 420
    if (q < 0 || q > 1) return null
    const vx = [34, 58, 22, 70][c], vy = [-70, -52, -88, -40][c]
    return <span key={c} style={{ position: 'absolute', left: 168 + vx * q, top: 262 + vy * q + 120 * q * q, width: 7, height: 7, borderRadius: 2, background: c % 2 ? '#E3B987' : '#FFD265', border: '1.5px solid #00224E', opacity: 1 - q, transform: `rotate(${q * 220}deg)` }} />
  }) : null
  return (
    <div role="img" aria-label="Building" style={{ position: 'relative', width: 360 * scale, height: 300 * scale }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 360, height: 300, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
        <div style={{ position: 'absolute', left: -8, top: 54, width: 230, height: 244, transformOrigin: '50% 100%', transform: `scaleY(${1 - squash}) scaleX(${1 + squash})` }}>
          {BUILD.map((u, i) => <img key={u} src={u} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: i === frame ? 1 : 0 }} />)}
        </div>
        {logs}{chips}
      </div>
    </div>
  )
}

/** A full-screen cover with the builder scene in the middle (for "sending" and "closing" moments). */
export function BuildOverlay({ bg = '#FFF1C7', ms = 3600, scale = 1, onDone, label, z = 60 }: { bg?: string; ms?: number; scale?: number; onDone?: () => void; label?: string; z?: number }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: z, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="status" aria-live="polite">
      {label && <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{label}</span>}
      <BuilderLoader ms={ms} scale={scale} onDone={onDone} />
    </div>
  )
}

/* ------------------------------------------------------------------ ToolLoader */
const TOOL = (n: string) => `${BASE}fig/tool-${n}.svg`
export type ToolKind = 'rocket' | 'wrench' | 'bulb'
/** Pen-sketched tools doing one job, played once over `ms`, then `onDone`.
    rocket = a screwdriver with a booster zooms across the screen (something is being processed)
    wrench = a spanner ratchets a nut tight (something is being fixed in place)
    bulb   = a bulb flickers twice and lights up (something is being checked). Timing is driven by hand. */
export function ToolLoader({ kind, ms, onDone, scale = 1, sound = true }: { kind: ToolKind; ms?: number; onDone?: () => void; scale?: number; sound?: boolean }) {
  const reduce = useReducedMotion()
  const total = ms ?? (kind === 'rocket' ? 1300 : kind === 'wrench' ? 1700 : 1500)
  const [t, setT] = useState(reduce ? 1 : 0) // 0 to 1 over the whole run
  const box = useRef<HTMLDivElement>(null); const [W, setW] = useState(390)
  const flags = useRef({ done: false, n: 0 })
  const ready = useAssets(kind === 'rocket' ? [TOOL('driver'), TOOL('flame')] : kind === 'wrench' ? [TOOL('bolt'), TOOL('wrench')] : [TOOL('bulb0'), TOOL('bulb1')]) // the clock starts only when the pictures are here
  useEffect(() => { if (box.current) setW(box.current.offsetWidth || 390) }, [])
  useEffect(() => {
    if (!ready) return
    if (reduce) { const k = setTimeout(() => onDone?.(), 450); return () => clearTimeout(k) }
    if (sound && kind === 'rocket') fx.swoosh()
    const t0 = performance.now(); let raf = 0
    const tick = (now: number) => {
      const e = Math.max(0, Math.min(1, (now - t0) / total)); setT(e) // (the first frame can be stamped a hair before t0)
      if (e >= 1 && !flags.current.done) { flags.current.done = true; if (sound && kind !== 'rocket') fx.success(); onDone?.() }
      if (e < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready])
  if (!ready) return <div ref={box} style={{ width: '100%', height: kind === 'rocket' ? 220 * scale : 10 }} />
  const tickOnce = (n: number) => { if (sound && flags.current.n < n) { flags.current.n = n; fx.tick(n % 6) } }

  if (kind === 'rocket') {
    const dW = 190, dH = dW * 473 / 1199, fW = 170, fH = fW * 622 / 1173
    const u = Math.pow(t, 2.3), x = -dW - fW + (W + dW + fW + 40) * u
    const y = Math.sin(t * Math.PI * 3.2) * 7 * (1 - t * 0.4), rot = Math.cos(t * Math.PI * 3.2) * 3 - u * 4
    const flick = 1 + 0.1 * Math.sin(t * 90), stretch = 0.75 + 1.0 * u
    return (
      <div ref={box} role="img" aria-label="Working on it" style={{ position: 'relative', width: '100%', height: 220 * scale, overflow: 'visible' }}>
        {[-30, -12, 8, 26, 44].map((dy, i) => <span key={i} style={{ position: 'absolute', left: x - fW * stretch - (30 + i * 14), top: 110 + dy - 4, width: (50 + i * 22) * u, height: 4, borderRadius: 3, background: i % 2 ? '#FFD265' : '#00224E', opacity: Math.min(1, u * 3) * (t > 0.92 ? 0 : 0.85) }} />)}
        <div style={{ position: 'absolute', left: x, top: 110 - dH / 2 + y, width: dW, height: dH, transform: `rotate(${rot}deg)`, transformOrigin: '30% 50%' }}>
          <img src={TOOL('flame')} alt="" draggable={false} style={{ position: 'absolute', right: dW - 30, top: (dH - fH) / 2, width: fW, height: fH, transformOrigin: '100% 50%', transform: `scale(${stretch * flick}, ${flick})`, opacity: Math.min(1, t * 6) }} />
          <img src={TOOL('driver')} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        </div>
      </div>
    )
  }

  if (kind === 'wrench') {
    const bW = 124, bH = bW * 1166 / 739, wW = 178, wH = wW * 1118 / 1194
    const pivot = [wW * 0.555, wH * 0.115], nut = [bW * 0.5, bH * 0.135] // the open jaw sits on the nut, and the wrench turns about it
    // three ratchet strokes: swing forward fast, ease back a little, rest
    const STROKES = 3, per = 0.78 / STROKES
    const p = Math.max(0, (t - 0.1) / per), k = Math.min(STROKES - 1, Math.floor(p)), f = Math.min(1, p - k)
    const fwd = f < 0.6 ? 1 - Math.pow(1 - f / 0.6, 3) : 1, back = f > 0.75 ? (f - 0.75) / 0.25 : 0
    const ang = -40 + k * 34 + fwd * 52 - back * 18 + (t > 0.88 ? Math.sin((t - 0.88) * 80) * 2 * (1 - (t - 0.88) / 0.12) : 0)
    if (t > 0.1 && f > 0.02) tickOnce(k + 1)
    const shake = t > 0.88 ? Math.sin((t - 0.88) * 140) * 3 * (1 - (t - 0.88) / 0.12) : 0
    return (
      <div role="img" aria-label="Tightening" style={{ position: 'relative', width: 260 * scale, height: 230 * scale, margin: '0 auto' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 260, height: 230, transform: `scale(${scale}) translateX(${shake}px)`, transformOrigin: '0 0' }}>
          <div style={{ position: 'absolute', left: 70, top: 28, width: bW, height: bH }}>
            <img src={TOOL('bolt')} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
            <div style={{ position: 'absolute', left: nut[0] - pivot[0], top: nut[1] - pivot[1], width: wW, height: wH, transformOrigin: `${pivot[0]}px ${pivot[1]}px`, transform: `rotate(${ang}deg)` }}>
              <img src={TOOL('wrench')} alt="" draggable={false} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
          {t > 0.9 && [[-6, 10], [118, 4], [58, -14]].map(([sx, sy], i) => <span key={i} style={{ position: 'absolute', left: 70 + sx + 30, top: 28 + sy + 10, width: 5, height: 18, borderRadius: 3, background: '#FFD265', border: '1.5px solid #00224E', transform: `rotate(${[-40, 40, 0][i]}deg) translateY(${-(t - 0.9) * 90}px)`, opacity: 1 - (t - 0.9) / 0.1 }} />)}
        </div>
      </div>
    )
  }

  // bulb: off, two quick flickers, then on for good
  const on = (a: number, b: number) => t >= a && t < b
  const lit = on(0.3, 0.38) || on(0.5, 0.57) || t >= 0.72
  if (lit && t > 0.3) tickOnce(t >= 0.72 ? 3 : t >= 0.5 ? 2 : 1)
  const pulse = t >= 0.72 ? 1 + 0.07 * Math.sin(Math.min(1, (t - 0.72) / 0.2) * Math.PI) : 1
  const bW = 150, bH = bW * 1211 / 1054
  return (
    <div role="img" aria-label="Checking" style={{ position: 'relative', width: bW * scale, height: bH * scale, margin: '0 auto' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: bW, height: bH, transform: `scale(${scale * pulse})`, transformOrigin: '50% 45%' }}>
        <img src={TOOL('bulb0')} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <img src={TOOL('bulb1')} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: lit ? 1 : 0, transition: 'opacity .05s' }} />
      </div>
    </div>
  )
}

/** A cover over the whole screen with one tool loader in the middle, for the moments when something is being processed. */
export function ToolOverlay({ bg = 'rgba(255,251,243,.96)', ms = 2800, scale = 1, onDone, label }: { kind?: ToolKind; bg?: string; ms?: number; scale?: number; onDone?: () => void; label?: string }) {
  // one standard loader for every app and every kind of wait: the beaver hammers a pile together (the old rocket / spanner / bulb scenes are retired)
  return <BuildOverlay bg={bg} ms={ms} scale={scale} onDone={onDone} label={label} z={70} />
}

/* ------------------------------------------------------------------ StepHop */
/** A token that hops along an arc from one point to another once, then is gone (the real marker pops in where it lands).
    `from` and `to` are the centres of the two markers, in screen coordinates. */
export function StepHop({ from, to, size = 44, delay = 0.05, arc = 46, onLand, children }: {
  from: { x: number; y: number }; to: { x: number; y: number }; size?: number; delay?: number; arc?: number; onLand?: () => void; children?: ReactNode
}) {
  const reduce = useReducedMotion()
  const [gone, setGone] = useState(false)
  const el = useRef<HTMLDivElement>(null)
  // driven by hand (a parabola with a squash on landing) so the token is hidden until its turn and never jumps
  useEffect(() => {
    if (reduce) { onLand?.(); setGone(true); return }
    const node = el.current!; const dx = to.x - from.x, dy = to.y - from.y, DUR = 780
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    let raf = 0, landed = false; const t0 = performance.now() + delay * 1000
    node.style.opacity = '0'
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - t0) / DUR))
      if (t > 0) {
        const u = ease(t), lift = 4 * u * (1 - u) * arc
        const squash = t > 0.82 ? Math.sin(((t - 0.82) / 0.18) * Math.PI) * 0.14 : 0
        node.style.opacity = t > 0.9 ? String(Math.max(0, 1 - (t - 0.9) / 0.1)) : '1'
        node.style.transform = `translate(${dx * u}px, ${dy * u - lift}px) scale(${1 + 0.1 * Math.sin(u * Math.PI) + squash}, ${1 + 0.1 * Math.sin(u * Math.PI) - squash})`
        if (t >= 0.85 && !landed) { landed = true; onLand?.() }
      }
      if (t < 1) raf = requestAnimationFrame(tick); else setGone(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  if (reduce || gone) return null
  return (
    <div ref={el} style={{ position: 'absolute', left: from.x - size / 2, top: from.y - size / 2, width: size, height: size, pointerEvents: 'none', zIndex: 6, opacity: 0, willChange: 'transform' }}>
      {children}
    </div>
  )
}
