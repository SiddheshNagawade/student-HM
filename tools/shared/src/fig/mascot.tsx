/* The ALIGN beaver as a living guide, not a picture.
   - peek(): when something happens, his big head rises from the edge of the screen, he waves or cheers,
     says one short line in a speech bubble, and ducks back down. Tap him to send him away sooner.
   - <Hanging>: for "no internet" and other errors he drops in from the top, hanging upside down by his
     feet, holding a sign that says what happened. He swings, settles, and climbs back up when it is fixed.
   The beaver drawings are the Figma ones; only how they move and where they appear is new. */
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

/* Mascot drawings are fetched once at start and kept in memory, so he still shows up when the internet is gone. */
const mem = new Map<string, string>()
export function preloadMascot(ids: string[]) {
  for (const id of ids) if (!mem.has(id)) { mem.set(id, figArt(id)); fetch(figArt(id)).then(r => r.blob()).then(b => mem.set(id, URL.createObjectURL(b))).catch(() => {}) }
}
const mascotSrc = (id: string) => mem.get(id) || figArt(id)

const BUBBLE = { background: '#FFFBF3', border: '2.5px solid #00224E', boxShadow: '0 4px 0 #00224E', color: '#00224E' }

/** Lives inside the app frame (same coordinate space as the Figma screens). */
export function PeekHost({ arts, w, h, size, side: defSide = 'left' }: { arts: Record<Mood, string>; w: number; h: number; size: number; side?: 'left' | 'right' }) {
  const [cur, setCur] = useState<(PeekOpts & { k: number }) | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => { preloadMascot(Object.values(arts)) }, [])
  const reduce = useReducedMotion()
  useEffect(() => {
    const f: Listener = o => {
      window.clearTimeout(timer.current)
      setCur({ ...o, k: Date.now() }); fx.pop()
      timer.current = window.setTimeout(() => setCur(null), o.ms ?? 2800)
    }
    listeners.add(f); return () => { listeners.delete(f); window.clearTimeout(timer.current) }
  }, [])
  const side = cur?.side ?? defSide
  const left = side === 'left'
  const show = size * 0.6 // how much of him rises above the edge: head, arms, a bit of tummy
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', pointerEvents: 'none', zIndex: 60 }}>
      <AnimatePresence>
        {cur && (
          <motion.div key={cur.k} style={{ position: 'absolute', bottom: 0, [left ? 'left' : 'right']: size * 0.08, width: size, height: show, pointerEvents: 'auto', cursor: 'pointer' }}
            onClick={() => setCur(null)}
            initial={reduce ? { opacity: 0 } : { y: show + 20 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0 } : { y: show + 30, transition: { duration: 0.28, ease: [0.5, 0, 0.75, 0] } }}
            transition={{ type: 'spring', stiffness: 330, damping: 17 }}>
            {/* the beaver: a quick happy wiggle once he is up */}
            <motion.img src={mascotSrc(arts[cur.mood ?? 'wave'])} alt="" draggable={false}
              style={{ position: 'absolute', left: 0, top: 0, width: size, maxWidth: 'none', height: 'auto', transformOrigin: '50% 90%', transform: left ? undefined : 'scaleX(-1)' }}
              initial={false} animate={reduce ? undefined : { rotate: cur.mood === 'think' ? [0, -6, -4] : [0, -7, 6, -4, 2, 0] }}
              transition={{ duration: 1.1, delay: 0.35, ease: 'easeInOut' }} />
            {/* what he says */}
            <motion.div initial={reduce ? false : { scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 20, delay: 0.3 }}
              style={{ position: 'absolute', bottom: show - size * 0.2, [left ? 'left' : 'right']: size * 0.78, transformOrigin: left ? '0% 100%' : '100% 100%',
                width: 'max-content', maxWidth: Math.min(w - size * 0.95, size * 1.5), padding: `${size * 0.05}px ${size * 0.075}px`, borderRadius: `${size * 0.1}px ${size * 0.1}px ${left ? `${size * 0.1}px 4px` : `4px ${size * 0.1}px`}`, ...BUBBLE }}>
              <div style={{ fontFamily: '"League Spartan", "Baloo 2", "Noto Sans Devanagari", sans-serif', fontWeight: 800, fontSize: size * 0.085, lineHeight: 1.15 }}>{cur.say}</div>
              {cur.sub && <div style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif', fontWeight: 500, fontSize: size * 0.055, lineHeight: 1.3, marginTop: 3, color: '#3E4F72' }}>{cur.sub}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** The beaver hanging upside down from the top edge, holding a sign. */
export function Hanging({ art, sign, title, sub, cx, top = 0, scale = 1, onTap, rope }: {
  art: string; sign: string; title: ReactNode; sub?: ReactNode; cx: number; top?: number; scale?: number; onTap?: () => void; rope?: boolean
}) {
  const reduce = useReducedMotion()
  const W = 300 * scale, B = 190 * scale, S = 340 * scale * 0.82, SH = 230 * scale * 0.82
  useEffect(() => { if (!reduce) { const t = setTimeout(() => fx.swoosh(), 80); const t2 = setTimeout(() => fx.paper(), 650); return () => { clearTimeout(t); clearTimeout(t2) } } }, [])
  return (
    <motion.div onClick={onTap} style={{ position: 'absolute', left: cx - W / 2, top, width: W, height: B + SH + 40 * scale, transformOrigin: '50% 0%', pointerEvents: onTap ? 'auto' : 'none', cursor: onTap ? 'pointer' : 'default', zIndex: 40 }}
      initial={reduce ? false : { y: -(B + SH + 160 * scale), rotate: 0 }}
      animate={{ y: 0, rotate: reduce ? 0 : [0, 0, 7, -5, 3, -1.5, 0] }}
      exit={{ y: -(B + SH + 200 * scale), transition: { duration: 0.45, ease: [0.5, 0, 0.75, 0] } }}
      transition={{ y: { type: 'spring', stiffness: 170, damping: 14 }, rotate: { duration: 2.2, times: [0, 0.22, 0.4, 0.58, 0.74, 0.88, 1], ease: 'easeInOut' } }}>
      {/* when there is a header in the way, he hangs on a dashed rope from the top edge instead */}
      {rope && <svg width={6} height={top + B * 0.12} style={{ position: 'absolute', left: W / 2 - 3, top: -top, overflow: 'visible' }} aria-hidden="true"><path d={`M3 0V${top + B * 0.12}`} stroke="#00224E" strokeWidth={2.6} strokeLinecap="round" strokeDasharray="3 8" /></svg>}
      {/* upside down: feet tucked behind the top edge, head and arms hanging down */}
      <img src={mascotSrc(art)} alt="" draggable={false} style={{ position: 'absolute', left: (W - B) / 2, top: rope ? B * 0.05 : -B * 0.3, width: B, maxWidth: 'none', height: 'auto', transform: 'rotate(180deg)' }} />
      {/* the sign he holds; its string goes up into his paws */}
      <div style={{ position: 'absolute', left: (W - S) / 2, top: B * (rope ? 1.02 : 0.7), width: S, height: SH }}>
        <img src={mascotSrc(sign)} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: S, height: SH }} />
        <div style={{ position: 'absolute', left: S * 0.12, right: S * 0.12, top: SH * 0.2, bottom: SH * 0.14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#00224E' }}>
          <div style={{ fontFamily: '"League Spartan", "Baloo 2", "Noto Sans Devanagari", sans-serif', fontWeight: 800, fontSize: 25 * scale, lineHeight: 1.1 }}>{title}</div>
          {sub && <div style={{ fontFamily: '"M PLUS Rounded 1c", "Noto Sans Devanagari", sans-serif', fontWeight: 500, fontSize: 14 * scale, lineHeight: 1.35, marginTop: 8 * scale, color: '#3E4F72' }}>{sub}</div>}
        </div>
      </div>
    </motion.div>
  )
}

/** When the internet drops: he drops in with the sign, then after a moment pulls back up so only his
    upside-down head is showing at the top. Tap the head and he comes down again. */
export function OfflineBuddy({ offline, art, sign, title, sub, cx, scale = 1, back }: { offline: boolean; art: string; sign: string; title: ReactNode; sub?: ReactNode; cx: number; scale?: number; back?: PeekOpts }) {
  const [full, setFull] = useState(true)
  useEffect(() => { preloadMascot([art, sign]) }, [])
  const was = useRef(offline)
  useEffect(() => {
    if (offline) { setFull(true); const t = setTimeout(() => setFull(false), 4200); return () => clearTimeout(t) }
    if (was.current && back) peek(back)
  }, [offline])
  useEffect(() => { was.current = offline }, [offline])
  const B = 190 * scale
  return (
    <AnimatePresence>
      {offline && full && <Hanging key="full" art={art} sign={sign} title={title} sub={sub} cx={cx} scale={scale} onTap={() => setFull(false)} />}
      {offline && !full && (
        <motion.button key="head" type="button" aria-label="No internet. Tap to see more" onClick={() => setFull(true)}
          initial={{ y: -B }} animate={{ y: 0 }} exit={{ y: -B }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          style={{ position: 'absolute', left: cx - B * 0.3, top: -B * 0.62, width: B * 0.6, height: B, padding: 0, border: 0, background: 'none', cursor: 'pointer', zIndex: 40, overflow: 'visible' }}>
          <img src={mascotSrc(art)} alt="" draggable={false} style={{ position: 'absolute', left: -B * 0.2, top: 0, width: B, maxWidth: 'none', transform: 'rotate(180deg)' }} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
