/* One-time animations for the Figma illustrations. Each plays once when its screen opens, never loops.
   They move the drawing the way the drawing suggests: the paper plane flies its dotted route,
   a sticky note is slapped onto the door, a stamp comes down, a ticket unrolls, the beaver walks in. */
import { ReactNode, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { fx } from '../ds/fx'

const ease = [0.22, 1, 0.36, 1] as const

/** Paper plane that flies along its own dotted trail, drawing the trail behind it. Paths are the Figma vectors. */
export function PlaneFlight({ w, h, trail, dash, trailW, plane, crease, planeW, creaseW, delay = 0.25, dur = 1.5, sound = true }: {
  w: number; h: number; trail: string; dash: string; trailW: number; plane: string; crease: string; planeW: number; creaseW: number; delay?: number; dur?: number; sound?: boolean
}) {
  const reduce = useReducedMotion()
  const path = useRef<SVGPathElement>(null); const mask = useRef<SVGPathElement>(null); const g = useRef<SVGGElement>(null)
  const id = useRef('pf' + Math.random().toString(36).slice(2)).current
  useEffect(() => {
    const p = path.current!, m = mask.current!, el = g.current!
    const L = p.getTotalLength(); const end = p.getPointAtLength(L); const pre = p.getPointAtLength(L - 2)
    const endA = Math.atan2(end.y - pre.y, end.x - pre.x)
    m.style.strokeDasharray = `${L}`
    const set = (t: number) => {
      const l = Math.max(0.5, L * t); const pt = p.getPointAtLength(l); const pb = p.getPointAtLength(Math.max(0, l - 2))
      const a = Math.atan2(pt.y - pb.y, pt.x - pb.x) - endA
      el.setAttribute('transform', `translate(${pt.x - end.x} ${pt.y - end.y}) rotate(${(a * 180) / Math.PI} ${end.x} ${end.y})`)
      m.style.strokeDashoffset = `${L * (1 - t)}`
      el.style.opacity = t < 0.02 ? '0' : '1'
    }
    if (reduce) { set(1); return }
    set(0)
    let raf = 0; const t0 = performance.now() + delay * 1000; let played = false
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / (dur * 1000)))
      if (t > 0 && !played && sound) { played = true; fx.swoosh() }
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      set(e); if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: 'block', overflow: 'hidden' }}>
      <defs><mask id={id} maskUnits="userSpaceOnUse" x="-20" y="-20" width={w + 40} height={h + 40}><path ref={mask} d={trail} stroke="#fff" strokeWidth={trailW + 8} strokeLinecap="round" fill="none" /></mask></defs>
      <path ref={path} d={trail} stroke="#00224E" strokeWidth={trailW} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} mask={`url(#${id})`} />
      <g ref={g}>
        <path d={plane} fill="#FFFBF3" stroke="#00224E" strokeWidth={planeW} strokeLinecap="round" strokeLinejoin="round" />
        <path d={crease} stroke="#00224E" strokeWidth={creaseW} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

/** A character (the beaver) settling into place: comes up from a little lower, a small tilt, done. */
export const Settle = ({ children, delay = 0.1 }: { children: ReactNode; delay?: number }) => {
  const reduce = useReducedMotion()
  return <motion.div initial={reduce ? false : { y: 18, rotate: -4, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay }} style={{ transformOrigin: '50% 100%' }}>{children}</motion.div>
}
/** A cheer: one hop. */
export const Hop = ({ children, delay = 0.2 }: { children: ReactNode; delay?: number }) => {
  const reduce = useReducedMotion()
  return <motion.div initial={reduce ? false : { y: 0 }} animate={reduce ? undefined : { y: [0, -22, 0, -8, 0] }} transition={{ duration: 0.9, delay, times: [0, 0.3, 0.6, 0.8, 1], ease: 'easeOut' }}>{children}</motion.div>
}
/** Walks in from the side with a small step bounce, then stops. */
export const WalkIn = ({ children, from = -220, delay = 0.15, dur = 1.4 }: { children: ReactNode; from?: number; delay?: number; dur?: number }) => {
  const reduce = useReducedMotion()
  const steps = 6
  return (
    <motion.div initial={reduce ? false : { x: from }} animate={{ x: 0 }} transition={{ duration: dur, delay, ease: [0.33, 0, 0.3, 1] }}>
      <motion.div initial={false} animate={reduce ? undefined : { y: Array.from({ length: steps * 2 + 1 }, (_, i) => (i % 2 ? -5 : 0)) }} transition={{ duration: dur, delay, ease: 'linear' }}>{children}</motion.div>
    </motion.div>
  )
}
/** Reveal a drawing left-to-right (a route, a progress line) or top-to-bottom (a ticket unrolling). */
export const Reveal = ({ children, dir = 'x', delay = 0.15, dur = 0.9 }: { children: ReactNode; dir?: 'x' | 'y'; delay?: number; dur?: number }) => {
  const reduce = useReducedMotion()
  return <motion.div initial={reduce ? false : { clipPath: dir === 'x' ? 'inset(0 100% 0 0)' : 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0% 0% 0)' }} transition={{ duration: dur, delay, ease }}>{children}</motion.div>
}
/** Paper note slapped onto a surface. */
export const Slap = ({ children, delay = 0.35, onLand }: { children: ReactNode; delay?: number; onLand?: () => void }) => {
  const reduce = useReducedMotion()
  useEffect(() => { const t = setTimeout(() => (onLand || fx.paper)(), (delay + 0.25) * 1000); return () => clearTimeout(t) }, [])
  return <motion.div initial={reduce ? false : { y: -40, rotate: -10, scale: 1.08, opacity: 0 }} animate={{ y: 0, rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 24, delay }} style={{ transformOrigin: '50% 0%' }}>{children}</motion.div>
}
/** Rubber stamp coming down once. */
export const StampDown = ({ children, delay = 0.55 }: { children: ReactNode; delay?: number }) => {
  const reduce = useReducedMotion()
  useEffect(() => { const t = setTimeout(() => fx.stamp(), (delay + 0.18) * 1000); return () => clearTimeout(t) }, [])
  return <motion.div initial={reduce ? false : { scale: 2.2, rotate: -18, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 700, damping: 22, delay }}>{children}</motion.div>
}
/** Small thing popping in (a star, a tally mark, a tag). */
export const PopIn = ({ children, delay = 0.2 }: { children: ReactNode; delay?: number }) => {
  const reduce = useReducedMotion()
  return <motion.div initial={reduce ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20, delay }}>{children}</motion.div>
}
/** Something rising into view (the moon over the evening slots, a building from the ground). */
export const RiseIn = ({ children, y = 24, delay = 0.1, dur = 0.7 }: { children: ReactNode; y?: number; delay?: number; dur?: number }) => {
  const reduce = useReducedMotion()
  return <motion.div initial={reduce ? false : { y, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: dur, delay, ease }}>{children}</motion.div>
}
/** A card placed down on the table (ID card, ticket). */
export const PlaceDown = ({ children, delay = 0.15 }: { children: ReactNode; delay?: number }) => {
  const reduce = useReducedMotion()
  return <motion.div initial={reduce ? false : { y: -26, rotate: -3, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 26, delay }}>{children}</motion.div>
}
/** A quick electric flicker (socket with sparks). */
export const Flicker = ({ children, delay = 0.3 }: { children: ReactNode; delay?: number }) => {
  const reduce = useReducedMotion()
  return <motion.div initial={false} animate={reduce ? undefined : { x: [0, -3, 3, -2, 2, 0], opacity: [1, 0.7, 1, 0.8, 1, 1] }} transition={{ duration: 0.45, delay }}>{children}</motion.div>
}
/** Dashed focus rings around tappable things, drawn once. */
export const RingsIn = ({ children, delay = 0.25 }: { children: ReactNode; delay?: number }) => {
  const reduce = useReducedMotion()
  return <motion.div initial={reduce ? false : { opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay, ease }}>{children}</motion.div>
}

/* The two paper planes in the Figma, as vectors. */
export const PLANE_VERIFY = { w: 260, h: 118, trail: 'M4.72 102.42C55.15 110.30 86.66 47.27 149.69 70.90C212.72 94.54 228.48 31.51 250.54 18.90', dash: '2.36 7.88', trailW: 2.04, plane: 'M224.60 22.21L267.23 -4.57L251.65 35.79L245.29 21.03L224.60 22.21Z', crease: 'M245.29 21.03L267.23 -4.57', planeW: 2.36, creaseW: 1.89 }
export const PLANE_SENT = { w: 330, h: 150, trail: 'M6 130C70 140 110 60 190 90C270 120 290 40 318 24', dash: '3 10', trailW: 2.6, plane: 'M285.07 28.19L339.18 -5.80L319.40 45.43L311.33 26.70L285.07 28.19Z', crease: 'M311.33 26.70L339.18 -5.80', planeW: 3, creaseW: 2.4 }

/** A fan that spins up and winds down to a stop, once (the "not spinning" fan). Rotates about the hub. */
export const SpinDown = ({ children, cx, cy, delay = 0.2, turns = 1.5 }: { children: ReactNode; cx: number; cy: number; delay?: number; turns?: number }) => {
  const reduce = useReducedMotion()
  return <motion.div initial={false} animate={reduce ? undefined : { rotate: [0, turns * 360] }} transition={{ duration: 2.2, delay, ease: [0.15, 0.6, 0.35, 1] }} style={{ transformOrigin: `${cx}px ${cy}px` }}>{children}</motion.div>
}
