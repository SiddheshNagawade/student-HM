/* Extra life for the screens, drawn in the same hand as the Figma: navy outline, flat cream / yellow / blue fills.
   Everything here plays once and then rests. No text is ever animated.
   - ScoreDial: a half-circle of dots (like the dot charts) with a needle that swings and settles.
   - InkStamp: a rough brick stamp mark that comes down, presses, and sends out one ring of ink.
   - StepHop: a small token that hops from one step marker to the next, once.
   - EdgePeeker: a soft blob that peeks in over a screen edge, looks around, blinks once and ducks when tapped. */
import { ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { animate, motion, useReducedMotion } from 'framer-motion'
import { fx } from '../ds/fx'

const NAVY = '#00224E', CREAM = '#FFFBF3', YELLOW = '#FFD265', BLUE = '#BDDDFF', BRICK = '#B8530A', GREEN = '#1B7F52', TAN = '#E3B987'

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

/* ------------------------------------------------------------------ EdgePeeker */
type Side = 'bottom' | 'left' | 'right' | 'top'
const SIDE_ANGLE: Record<Side, number> = { bottom: 0, right: -90, top: 180, left: 90 }
const TONES = { yellow: YELLOW, blue: BLUE, cream: CREAM } as const
export type PeekerTone = keyof typeof TONES

/** A soft blob that peeks over the edge of the screen. `at` is the distance along that edge to the middle of the blob.
    It rises with a little overshoot, glances toward the screen, blinks once, and its eyes follow the finger or pointer.
    Tap it and it ducks, then comes back up once. */
export function EdgePeeker({ side = 'bottom', at, w = 96, tone = 'yellow', delay = 0.8, glance = 0, label = 'A friendly blob' }: {
  side?: Side; at: number; w?: number; tone?: PeekerTone; delay?: number; glance?: number; label?: string
}) {
  const reduce = useReducedMotion()
  const vis = Math.round(w * 0.8) // how much of the blob shows
  const [hidden, setHidden] = useState(!reduce)
  const [blink, setBlink] = useState(false)
  const pupils = useRef<SVGGElement>(null); const box = useRef<HTMLDivElement>(null)
  useEffect(() => { const t = setTimeout(() => setHidden(false), reduce ? 0 : delay * 1000); return () => clearTimeout(t) }, [])
  useEffect(() => { if (reduce) return; const t = setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 130) }, delay * 1000 + 1500); return () => clearTimeout(t) }, [])
  // the pupils follow the pointer, a few pixels at most
  useEffect(() => {
    const look = (px: number, py: number) => {
      const r = box.current?.getBoundingClientRect(), g = pupils.current; if (!r || !g) return
      const vx = px - (r.left + r.width / 2), vy = py - (r.top + r.height / 2), a = (SIDE_ANGLE[side] * Math.PI) / 180
      const lx = vx * Math.cos(a) + vy * Math.sin(a), ly = -vx * Math.sin(a) + vy * Math.cos(a)
      const d = Math.hypot(lx, ly) || 1, k = Math.min(1, d / 90) * 3.4
      g.style.transform = `translate(${((lx / d) * k).toFixed(2)}px, ${((ly / d) * k).toFixed(2)}px)`
    }
    const mv = (e: PointerEvent) => look(e.clientX, e.clientY)
    window.addEventListener('pointermove', mv)
    return () => window.removeEventListener('pointermove', mv)
  }, [side])
  useEffect(() => { const g = pupils.current; if (g && glance) g.style.transform = `translate(${glance * 3}px, -1px)` }, [glance])
  const fill = TONES[tone]
  const horiz = side === 'left' || side === 'right'
  const head = Math.round(w * 0.24) // room above the blob for its tuft, ears or antenna, and for the springy overshoot
  const bw = horiz ? vis + head : w, bh = horiz ? w : vis + head
  const pos = side === 'bottom' ? { left: at - w / 2, bottom: 0 } : side === 'top' ? { left: at - w / 2, top: 0 } : side === 'left' ? { left: 0, top: at - w / 2 } : { right: 0, top: at - w / 2 }
  const tap = () => { if (hidden) return; fx.tap(); setHidden(true); setTimeout(() => setHidden(false), 900) }
  return (
    <div ref={box} style={{ position: 'absolute', width: bw, height: bh, overflow: 'hidden', zIndex: 4, ...pos, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', width: w, height: vis + head, left: (bw - w) / 2, top: (bh - vis - head) / 2, transform: `rotate(${SIDE_ANGLE[side]}deg)` }}>
        <motion.div key="m" initial={false} animate={{ y: hidden ? vis + 6 : 0 }}
          transition={hidden ? { duration: 0.18, ease: 'easeIn' } : { type: 'spring', stiffness: 240, damping: 13 }} style={{ position: 'absolute', left: 0, top: head, width: w, height: vis, transformOrigin: '50% 100%', pointerEvents: 'auto', cursor: 'pointer' }}
          onClick={tap} role="button" aria-label={label}>
          <Blob w={w} vis={vis} fill={fill} tone={tone} pupils={pupils} blink={blink} />
        </motion.div>
      </div>
    </div>
  )
}

function Blob({ w, vis, fill, tone, pupils, blink }: { w: number; vis: number; fill: string; tone: PeekerTone; pupils: RefObject<SVGGElement | null>; blink: boolean }) {
  return (
    <svg width={w} height={vis} viewBox="0 0 96 77" fill="none" style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      {tone === 'yellow' && <g><path d="M48 12C47 4 49 -1 53 -5" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" /><path d="M53 -5C60 -9 67 -5 66 2C60 4 55 2 53 -5Z" fill={fill === YELLOW ? '#7BC79C' : GREEN} stroke={NAVY} strokeWidth="2.4" strokeLinejoin="round" /></g>}
      {tone === 'blue' && <g><circle cx="22" cy="12" r="9" fill={fill} stroke={NAVY} strokeWidth="2.6" /><circle cx="74" cy="12" r="9" fill={fill} stroke={NAVY} strokeWidth="2.6" /></g>}
      {tone === 'cream' && <g><path d="M50 10C52 1 50 -6 56 -11" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" /><circle cx="57" cy="-13" r="5.4" fill={YELLOW} stroke={NAVY} strokeWidth="2.4" /></g>}
      <path d="M5 120L5 80C2 42 19 8 48 8C77 8 94 42 91 80L91 120Z" fill={fill} stroke={NAVY} strokeWidth="2.8" strokeLinejoin="round" />
      {/* cheeks */}
      <ellipse cx="24" cy="48" rx="6.5" ry="4.2" fill={TAN} opacity="0.7" /><ellipse cx="72" cy="48" rx="6.5" ry="4.2" fill={TAN} opacity="0.7" />
      {/* eyes: whites, pupils that follow, a shine, and a lid for the one blink */}
      {[34, 62].map(x => <g key={x}>
        <ellipse cx={x} cy="38" rx="9" ry="10.5" fill={CREAM} stroke={NAVY} strokeWidth="2.2" />
        <ellipse cx={x} cy="38" rx="9" ry="10.5" fill={fill} style={{ transformBox: 'fill-box', transformOrigin: '50% 0%', transform: blink ? 'scaleY(1)' : 'scaleY(0)', transition: 'transform .06s' }} stroke={NAVY} strokeWidth="2.2" />
      </g>)}
      <g ref={pupils} style={{ transition: 'transform .12s ease-out', opacity: blink ? 0 : 1 }}>
        {[34, 62].map(x => <g key={x}><ellipse cx={x} cy="39" rx="4.6" ry="6" fill={NAVY} /><circle cx={x + 1.6} cy="36" r="1.7" fill={CREAM} /></g>)}
      </g>
      <path d="M41 56C44 61 52 61 55 56" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" />
      {/* the two little hands holding the edge */}
      <path d="M12 79C11 70 14 66 20 66C26 66 28 71 27 79Z" fill={fill} stroke={NAVY} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M69 79C68 71 70 66 76 66C82 66 85 70 84 79Z" fill={fill} stroke={NAVY} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M17 74L17 79M22 74L22 79M73 74L73 79M79 74L79 79" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
