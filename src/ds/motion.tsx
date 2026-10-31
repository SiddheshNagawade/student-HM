/* ALIGN motion. Screens change with app-specific transitions; inside a screen only graphics move. */
import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, MotionProps } from 'framer-motion'

export const spring = { type: 'spring', stiffness: 520, damping: 40, mass: 0.9 } as const
export const springSoft = { type: 'spring', stiffness: 300, damping: 30 } as const
export const springPop = { type: 'spring', stiffness: 600, damping: 38 } as const
export const ease = [0.22, 1, 0.36, 1] as const

/* Text and cards do not animate: they are simply there when the screen arrives.
   Motion is kept for drawings, photos, stamps and ticks only (ArtIn, Pop, Stamp, Ink). */

/** Headline. Static on purpose: text never animates. */
export function Words({ text, className = '', as = 'h1' }: { text: string; className?: string; delay?: number; as?: 'h1' | 'h2' | 'p' | 'span' }) {
  const Tag = as as 'h1'
  return <Tag className={className}>{text}</Tag>
}

/** Plain block wrapper (kept for layout). No animation. */
export function Rise({ children, className = '', style, onClick, role, id }: { children: ReactNode; delay?: number; className?: string; y?: number; style?: React.CSSProperties; onClick?: () => void; role?: string; id?: string } & Partial<MotionProps>) {
  return <div className={className} style={style} onClick={onClick} role={role} id={id}>{children}</div>
}

/** Plain list wrapper. No animation. */
export function Stagger({ children, className = '' }: { children: ReactNode; className?: string; delay?: number; gap?: number }) {
  return <div className={className}>{children}</div>
}

/** Cards and notes: static. Use ArtIn for illustrations. */
export function Drop({ children, className = '' }: { children: ReactNode; delay?: number; className?: string; from?: number }) {
  return <div className={className}>{children}</div>
}

/** Illustration or photo settling into place: short, calm, no bounce. */
export function ArtIn({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={reduce ? false : { y: 10, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
      transition={{ duration: 0.32, ease, delay }}>{children}</motion.div>
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

/** Number. Static: digits do not flip. */
export function Roll({ value, className = '' }: { value: number | string; className?: string }) {
  return <span className={`tabular ${className}`}>{value}</span>
}

/** KPI number. Static: no counting animation. */
export function CountUp({ to, decimals = 0, suffix = '', className = '' }: { to: number; decimals?: number; suffix?: string; className?: string }) {
  return <span className={`tabular ${className}`}>{to.toFixed(decimals) + suffix}</span>
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
