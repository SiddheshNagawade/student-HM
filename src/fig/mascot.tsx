/* The ALIGN beaver as a living guide, not a picture.
   - peek(): when something happens, his big head rises from the bottom edge of the screen like Duo does,
     reacts frame by frame (a wave, a cheer, a thumbs up, a wink), says one short line in a speech bubble
     above his hat, and ducks back down. Tap him to send him away sooner.
   - <Hanging>: for "no internet" and other errors he drops in from the top, hanging upside down by his
     feet, holding a sign that says what happened. He swings once, frame by frame, and settles.
   - <OfflineBuddy>: the same hanging beaver, which after a moment pulls up so only his head shows.
   The poses are hand-drawn frames (public/fig/mascot-*.svg, made from tools/mascot-refs/poses);
   only how they move and where they appear is code. Text never animates: it is drawn on the sign or in the bubble. */
import { ReactNode, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { figArt } from './Fig'
import { fx } from '../ds/fx'

export type Mood = 'wave' | 'cheer' | 'thumbs' | 'think' | 'point'
export type PeekOpts = { say: ReactNode; sub?: ReactNode; mood?: Mood; side?: 'left' | 'right'; ms?: number }
type Listener = (o: PeekOpts) => void
const listeners = new Set<Listener>()
/** Make the beaver peek in and say something. */
export const peek = (o: PeekOpts) => listeners.forEach(f => f(o))
if (import.meta.env.DEV) (window as unknown as { __peek: typeof peek }).__peek = peek // lets the test script trigger him

/* The frames. Width / height of each set, taken from the exported drawings. */
const PEEK = { ids: ['mascot-peek-1', 'mascot-peek-2', 'mascot-peek-3'], ar: 917 / 1082 }
const CHEER = { ids: ['mascot-cheer-1', 'mascot-cheer-2'], ar: 1233 / 1175 }
const HANG = { ids: ['mascot-hang-1', 'mascot-hang-2'], ar: 1248 / 997 }
const ALL_FRAMES = [...PEEK.ids, ...CHEER.ids, ...HANG.ids]

/* Drawings are fetched once at start and kept in memory, so he still shows up when the internet is gone. */
const mem = new Map<string, string>()
export function preloadMascot(ids: string[] = ALL_FRAMES) {
  for (const id of ids) if (!mem.has(id)) { mem.set(id, figArt(id)); fetch(figArt(id)).then(r => r.blob()).then(b => mem.set(id, URL.createObjectURL(b))).catch(() => {}) }
}
const src = (id: string) => mem.get(id) || figArt(id)

/** Steps through [frame, how long to hold it before the next one] once, never looping. */
function useSequence(seq: [number, number][], key: unknown) {
  const [i, setI] = useState(seq[0][0])
  useEffect(() => {
    setI(seq[0][0])
    let t: number | undefined
    const step = (n: number) => { if (n >= seq.length - 1) return; t = window.setTimeout(() => { setI(seq[n + 1][0]); step(n + 1) }, seq[n][1]) }
    step(0)
    return () => window.clearTimeout(t)
  }, [key])
  return i
}

const BUBBLE = { background: '#FFFBF3', border: '2.5px solid #00224E', boxShadow: '0 4px 0 #00224E', color: '#00224E' }

/* What each mood does: which set of drawings, and the frames in order (frame, hold in ms). */
const MOODS: Record<Mood, { set: typeof PEEK; seq: [number, number][]; tilt?: boolean }> = {
  wave: { set: PEEK, seq: [[0, 480], [1, 220], [0, 140], [1, 220], [0, 140], [1, 260], [0, 0]] },
  point: { set: PEEK, seq: [[0, 560], [2, 0]] },
  think: { set: PEEK, seq: [[0, 0]], tilt: true },
  cheer: { set: CHEER, seq: [[0, 0]] },
  thumbs: { set: CHEER, seq: [[1, 0]] },
}

function PeekBeaver({ cur, w, size, left, reduce }: { cur: PeekOpts & { k: number }; w: number; size: number; left: boolean; reduce: boolean | null }) {
  const m = MOODS[cur.mood ?? 'wave']
  const bw = m.set === CHEER ? size * 0.88 : size
  const bh = bw * m.set.ar
  const f = useSequence(m.seq, cur.k)
  const bubbleMax = w - 24
  return (
    <>
      {/* he rises with a little overshoot, then squashes and settles */}
      <motion.div style={{ position: 'absolute', bottom: 0, [left ? 'left' : 'right']: Math.max(8, w * 0.03), width: bw, height: bh, pointerEvents: 'auto', cursor: 'pointer', transformOrigin: '50% 100%' }}
        initial={reduce ? { opacity: 0 } : { y: bh + 30 }} animate={{ y: 0, opacity: 1 }}
        exit={reduce ? { opacity: 0 } : { y: bh + 40, transition: { duration: 0.26, ease: [0.5, 0, 0.75, 0] } }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, mass: 0.9 }}>
        <motion.div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 100%' }}
          initial={false}
          animate={reduce ? undefined : m.tilt ? { rotate: [0, -7, -5], scaleY: [1, 0.96, 1] } : { scaleY: [1, 0.93, 1.03, 1], scaleX: [1, 1.04, 0.99, 1] }}
          transition={{ duration: m.tilt ? 0.9 : 0.55, delay: 0.28, ease: 'easeOut' }}>
          {m.set.ids.map((id, n) => (
            <img key={id} src={src(id)} alt="" draggable={false}
              style={{ position: 'absolute', left: 0, top: 0, width: bw, height: bh, maxWidth: 'none', opacity: n === f ? 1 : 0, transform: left ? undefined : 'scaleX(-1)' }} />
          ))}
        </motion.div>
        {/* what he says: a bubble above his hat, with its tail pointing down at him */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: bh - bh * 0.03, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <motion.div initial={reduce ? false : { scale: 0.2, opacity: 0, y: 14 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 20, delay: 0.32 }}
            style={{ position: 'relative', transformOrigin: '50% 100%', width: 'max-content', maxWidth: bubbleMax, marginBottom: 12, padding: `${size * 0.04}px ${size * 0.07}px`, borderRadius: size * 0.09, textAlign: 'center', ...BUBBLE }}>
            <div style={{ fontFamily: '"League Spartan", "Baloo 2", "Noto Sans Devanagari", sans-serif', fontWeight: 800, fontSize: Math.max(17, size * 0.075), lineHeight: 1.15 }}>{cur.say}</div>
            {cur.sub && <div style={{ fontFamily: '"M PLUS Rounded 1c", "Noto Sans Devanagari", sans-serif', fontWeight: 500, fontSize: Math.max(13, size * 0.05), lineHeight: 1.3, marginTop: 3, color: '#3E4F72' }}>{cur.sub}</div>}
            <span aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: -9, width: 14, height: 14, marginLeft: -7, background: '#FFFBF3', borderRight: '2.5px solid #00224E', borderBottom: '2.5px solid #00224E', transform: 'rotate(45deg)' }} />
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}

/** Lives inside the app frame (same coordinate space as the Figma screens). `size` is how wide his peeking head is. */
export function PeekHost({ w, h, size, side: defSide = 'left' }: { w: number; h: number; size: number; side?: 'left' | 'right' }) {
  const [cur, setCur] = useState<(PeekOpts & { k: number }) | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => { preloadMascot() }, [])
  const reduce = useReducedMotion()
  useEffect(() => {
    const f: Listener = o => {
      window.clearTimeout(timer.current)
      setCur({ ...o, k: Date.now() }); fx.pop()
      timer.current = window.setTimeout(() => setCur(null), o.ms ?? 3000)
    }
    listeners.add(f); return () => { listeners.delete(f); window.clearTimeout(timer.current) }
  }, [])
  const left = (cur?.side ?? defSide) === 'left'
  return (
    <div onClick={() => setCur(null)} style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', pointerEvents: 'none', zIndex: 60 }}>
      <AnimatePresence>{cur && <PeekBeaver key={cur.k} cur={cur} w={w} size={size} left={left} reduce={reduce} />}</AnimatePresence>
    </div>
  )
}

/* The hanging beaver's swing, frame by frame: still, leans left, leans right (the same drawing flipped), and back.
   The words on the sign are part of the sign, so they lean with it. */
const SWING: [number, number][] = [[0, 700], [1, 240], [2, 260], [1, 230], [2, 250], [1, 230], [0, 0]]
const POSE = [
  { art: 0, flip: false, rot: 0, dx: 0, dy: 0 },
  { art: 1, flip: false, rot: -7, dx: 0.038, dy: -0.02 },
  { art: 1, flip: true, rot: 7, dx: -0.026, dy: -0.02 },
]
const SIGN = { left: 0.12, width: 0.76, top: 0.715, height: 0.215 } // where the blank board sits inside the drawing

/** The beaver hanging upside down from the top edge, holding a sign. `cx` is the middle of him, `top` how far down his feet start. */
export function Hanging({ title, sub, cx, top = 0, scale = 1, onTap, rope }: {
  title: ReactNode; sub?: ReactNode; cx: number; top?: number; scale?: number; onTap?: () => void; rope?: boolean
}) {
  const reduce = useReducedMotion()
  const W = 330 * scale, H = W * HANG.ar
  const f = useSequence(reduce ? [[0, 0]] : SWING, 'swing')
  const p = POSE[f]
  useEffect(() => { preloadMascot(HANG.ids) }, [])
  useEffect(() => { if (!reduce) { const t = setTimeout(() => fx.swoosh(), 80); const t2 = setTimeout(() => fx.paper(), 700); return () => { clearTimeout(t); clearTimeout(t2) } } }, [])
  return (
    <motion.div onClick={onTap} style={{ position: 'absolute', left: cx - W / 2, top, width: W, height: H, pointerEvents: onTap ? 'auto' : 'none', cursor: onTap ? 'pointer' : 'default', zIndex: 40 }}
      initial={reduce ? false : { y: -(H + 160 * scale) }} animate={{ y: 0 }}
      exit={{ y: -(H + 200 * scale), transition: { duration: 0.45, ease: [0.5, 0, 0.75, 0] } }}
      transition={{ y: { type: 'spring', stiffness: 170, damping: 14 } }}>
      {/* when there is a header in the way, he hangs on a dashed rope from the top edge instead */}
      {rope && <svg width={6} height={top + 8} style={{ position: 'absolute', left: W / 2 - 3, top: -top, overflow: 'visible' }} aria-hidden="true"><path d={`M3 0V${top + 8}`} stroke="#00224E" strokeWidth={2.6} strokeLinecap="round" strokeDasharray="3 8" /></svg>}
      {HANG.ids.map((id, n) => (
        <img key={id} src={src(id)} alt="" draggable={false}
          style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, maxWidth: 'none', opacity: n === p.art ? 1 : 0, transform: n === 1 && p.flip ? 'scaleX(-1)' : undefined }} />
      ))}
      <div style={{ position: 'absolute', left: W * SIGN.left, width: W * SIGN.width, top: H * SIGN.top, height: H * SIGN.height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#00224E',
        transform: `translate(${p.dx * W}px, ${p.dy * H}px) rotate(${p.rot}deg)` }}>
        <div style={{ fontFamily: '"League Spartan", "Baloo 2", "Noto Sans Devanagari", sans-serif', fontWeight: 800, fontSize: 24 * scale, lineHeight: 1.1, textWrap: 'balance' }}>{title}</div>
        {sub && <div style={{ fontFamily: '"M PLUS Rounded 1c", "Noto Sans Devanagari", sans-serif', fontWeight: 500, fontSize: 14 * scale, lineHeight: 1.3, marginTop: 5 * scale, color: '#3E4F72', textWrap: 'balance' }}>{sub}</div>}
      </div>
    </motion.div>
  )
}

/** When the internet drops: he drops in with the sign, then after a moment pulls back up so only his
    upside-down head is showing at the top. Tap the head and he comes down again. */
export function OfflineBuddy({ offline, title, sub, cx, scale = 1, back }: { offline: boolean; title: ReactNode; sub?: ReactNode; cx: number; scale?: number; back?: PeekOpts }) {
  const [full, setFull] = useState(true)
  useEffect(() => { preloadMascot(HANG.ids) }, [])
  const was = useRef(offline)
  useEffect(() => {
    if (offline) { setFull(true); const t = setTimeout(() => setFull(false), 4600); return () => clearTimeout(t) }
    if (was.current && back) peek(back)
  }, [offline])
  useEffect(() => { was.current = offline }, [offline])
  const W = 330 * scale, H = W * HANG.ar
  const seen = H * 0.46 // just his head, from the neck to the hat
  return (
    <AnimatePresence>
      {offline && full && <Hanging key="full" title={title} sub={sub} cx={cx} scale={scale} onTap={() => setFull(false)} />}
      {offline && !full && (
        <motion.button key="head" type="button" aria-label="No internet. Tap to see more" onClick={() => setFull(true)}
          initial={{ y: -seen }} animate={{ y: 0 }} exit={{ y: -seen }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          style={{ position: 'absolute', left: cx - W * 0.23, top: 0, width: W * 0.46, height: seen, padding: 0, border: 0, background: 'none', cursor: 'pointer', zIndex: 40, overflow: 'hidden', clipPath: `inset(0 round 0 0 ${W * 0.2}px ${W * 0.2}px)` }}>
          <img src={src(HANG.ids[0])} alt="" draggable={false} style={{ position: 'absolute', left: -(0.495 - 0.23) * W, top: -H * 0.2, width: W, height: H, maxWidth: 'none' }} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
