/* ALIGN motion: quick springs, movement-led (things travel, fold, drop and stamp; nothing just fades). */
import { ReactNode, useEffect, useRef, useState, Children } from 'react'
import { motion, useReducedMotion, animate, useMotionValue, useTransform, MotionProps } from 'framer-motion'

export const spring = { type: 'spring', stiffness: 520, damping: 40, mass: 0.9 } as const
export const springSoft = { type: 'spring', stiffness: 300, damping: 30 } as const
export const springPop = { type: 'spring', stiffness: 680, damping: 26 } as const
export const ease = [0.22, 1, 0.36, 1] as const

/** Headline that rises word by word out of a mask, like type being set. */
export function Words({ text, className = '', delay = 0, as = 'h1' }: { text: string; className?: string; delay?: number; as?: 'h1' | 'h2' | 'p' | 'span' }) {
  const reduce = useReducedMotion()
  const Tag = as as 'h1'
  const words = text.split(' ')
  if (reduce) return <Tag className={className}>{text}</Tag>
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
          <motion.span className="inline-block" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ ...spring, delay: delay + i * 0.035 }}>
            {w}{i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/** Block that slides up into place (quick, slightly springy). */
export function Rise({ children, delay = 0, className = '', y = 16, ...p }: { children: ReactNode; delay?: number; className?: string; y?: number } & MotionProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={reduce ? false : { y, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ y: { ...spring, delay }, opacity: { duration: 0.12, delay } }} {...p}>{children}</motion.div>
  )
}

/** Children rise one after another. */
export function Stagger({ children, className = '', delay = 0.04, gap = 0.04 }: { children: ReactNode; className?: string; delay?: number; gap?: number }) {
  return <div className={className}>{Children.toArray(children).map((c, i) => <Rise key={i} delay={delay + i * gap}>{c}</Rise>)}</div>
}

/** Paper object dropped onto the surface: falls, tilts, settles flat. */
export function Drop({ children, delay = 0, className = '', from = -6 }: { children: ReactNode; delay?: number; className?: string; from?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={reduce ? false : { y: -36, rotate: from, scale: 1.04, opacity: 0 }}
      animate={{ y: 0, rotate: 0, scale: 1, opacity: 1 }}
      transition={{ ...springPop, delay, opacity: { duration: 0.08, delay } }}>{children}</motion.div>
  )
}

/** Scale in with overshoot. */
export function Pop({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return <motion.div className={className} initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...springPop, delay }}>{children}</motion.div>
}

/** Rubber stamp: comes down big from above, slams, shakes the paper. */
export function Stamp({ children, delay = 0.2, className = '', onLand }: { children: ReactNode; delay?: number; className?: string; onLand?: () => void }) {
  const reduce = useReducedMotion()
  useEffect(() => { const t = setTimeout(() => onLand?.(), (delay + 0.22) * 1000); return () => clearTimeout(t) }, [])
  return (
    <motion.div className={className} initial={reduce ? false : { scale: 2.4, rotate: -24, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 900, damping: 22, delay }}>{children}</motion.div>
  )
}

/** Shake for errors (wrong code). Change `k` to trigger. */
export function Shake({ k, children, className = '' }: { k: number; children: ReactNode; className?: string }) {
  return <motion.div key={k} className={className} animate={k ? { x: [0, -10, 9, -6, 4, 0] } : undefined} transition={{ duration: 0.36 }}>{children}</motion.div>
}

/** Number that rolls digit by digit like a flip counter. */
export function Roll({ value, className = '' }: { value: number | string; className?: string }) {
  const s = String(value)
  return (
    <span className={`inline-flex tabular overflow-hidden ${className}`} aria-label={s}>
      {s.split('').map((ch, i) => {
        const d = Number(ch)
        if (Number.isNaN(d)) return <span key={i}>{ch}</span>
        return (
          <span key={i} aria-hidden className="relative inline-block overflow-hidden" style={{ height: '1em', lineHeight: 1 }}>
            <span className="invisible">0</span>
            <motion.span className="absolute left-0 top-0 flex flex-col" animate={{ y: `${-d}em` }} transition={spring}>
              {Array.from({ length: 10 }, (_, n) => <span key={n} style={{ height: '1em', lineHeight: 1 }}>{n}</span>)}
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}

/** Animated count from 0 to `to` (KPI tiles). */
export function CountUp({ to, decimals = 0, suffix = '', className = '' }: { to: number; decimals?: number; suffix?: string; className?: string }) {
  const mv = useMotionValue(0)
  const txt = useTransform(mv, v => v.toFixed(decimals) + suffix)
  useEffect(() => { const c = animate(mv, to, { duration: 0.7, ease }); return () => c.stop() }, [to])
  return <motion.span className={`tabular ${className}`}>{txt}</motion.span>
}

/** Draws an SVG path like a pen line. */
export const Ink = ({ d, className = '', stroke = '#00224E', width = 2.5, delay = 0, dash }: { d: string; className?: string; stroke?: string; width?: number; delay?: number; dash?: string }) => (
  <motion.path d={d} className={className} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash}
    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease, delay }} />
)

/** Countdown helper: seconds remaining, ticking. */
export function useCountdown(start: number, running = true) {
  const [s, setS] = useState(start)
  const ref = useRef(start)
  useEffect(() => { ref.current = start; setS(start) }, [start])
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => { ref.current = Math.max(0, ref.current - 1); setS(ref.current) }, 1000)
    return () => clearInterval(t)
  }, [running])
  return s
}
