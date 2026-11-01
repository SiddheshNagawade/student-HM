/* App navigation: a screen stack with app-specific transitions.
   push  = new page slides over, old page tucks back and dims (iOS-like, springy)
   up    = sheet rises from the bottom (modal-ish steps)
   plane = paper plane flies across and the new screen is revealed in its wake (student)
   wave  = the blue field washes up over the screen and pulls back on the next one (technician)
   board = a board rises with the beaver holding on to its top edge, passes over, and the next screen is under it
   swap  = quick crossfade, nothing moves, for tabs and desktop sections */
import { ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, Variants } from 'framer-motion'
import { fx } from './fx'
import { spring } from './motion'

export type Tr = 'push' | 'up' | 'plane' | 'wave' | 'board' | 'swap' | 'none'
type Entry<S> = { s: S; p?: Record<string, unknown>; k: number }
export type NavApi<S extends string> = {
  screen: S; params: Record<string, unknown>; depth: number; dir: 1 | -1; tr: Tr; key: number
  go: (s: S, o?: { tr?: Tr; p?: Record<string, unknown> }) => void
  replace: (s: S, o?: { tr?: Tr; p?: Record<string, unknown> }) => void
  back: (o?: { tr?: Tr }) => void
  reset: (s: S, o?: { tr?: Tr; p?: Record<string, unknown> }) => void
  history: S[]
}

let K = 1
export function useNav<S extends string>(initial: S, defaultTr: Tr = 'push'): NavApi<S> {
  const [stack, setStack] = useState<Entry<S>[]>([{ s: initial, k: K++ }])
  const [meta, setMeta] = useState<{ dir: 1 | -1; tr: Tr }>({ dir: 1, tr: 'none' })
  const lastTr = useRef<Tr[]>([])
  const go = useCallback((s: S, o?: { tr?: Tr; p?: Record<string, unknown> }) => {
    const tr = o?.tr ?? defaultTr; lastTr.current.push(tr)
    setMeta({ dir: 1, tr }); setStack(st => [...st, { s, p: o?.p, k: K++ }])
    if (tr === 'push' || tr === 'up') fx.page()
  }, [defaultTr])
  const replace = useCallback((s: S, o?: { tr?: Tr; p?: Record<string, unknown> }) => {
    setMeta({ dir: 1, tr: o?.tr ?? defaultTr }); setStack(st => [...st.slice(0, -1), { s, p: o?.p, k: K++ }])
  }, [defaultTr])
  const back = useCallback((o?: { tr?: Tr }) => {
    const tr = o?.tr ?? lastTr.current.pop() ?? defaultTr
    setMeta({ dir: -1, tr: tr === 'plane' || tr === 'wave' || tr === 'board' ? 'push' : tr })
    setStack(st => (st.length > 1 ? st.slice(0, -1) : st))
  }, [defaultTr])
  const reset = useCallback((s: S, o?: { tr?: Tr; p?: Record<string, unknown> }) => {
    lastTr.current = []
    setMeta({ dir: 1, tr: o?.tr ?? 'swap' }); setStack([{ s, p: o?.p, k: K++ }])
  }, [])
  const top = stack[stack.length - 1]
  return { screen: top.s, params: top.p || {}, depth: stack.length, dir: meta.dir, tr: meta.tr, key: top.k, go, replace, back, reset, history: stack.map(e => e.s) }
}

const NavCtx = createContext<{ tr: Tr; dir: 1 | -1 }>({ tr: 'none', dir: 1 })
export const useTransitionInfo = () => useContext(NavCtx)

type C = { dir: 1 | -1; tr: Tr; reduce: boolean }
const variants = {
  enter: ({ dir, tr, reduce }: C) => {
    if (reduce || tr === 'none') return { x: 0, y: 0, opacity: 1 }
    if (tr === 'push') return dir > 0 ? { x: '100%', y: 0, zIndex: 2, filter: 'brightness(1)' } : { x: '-26%', y: 0, zIndex: 1, filter: 'brightness(0.86)' }
    if (tr === 'up') return dir > 0 ? { y: '100%', x: 0, zIndex: 2 } : { y: 0, x: 0, scale: 0.96, zIndex: 1, filter: 'brightness(0.86)' }
    if (tr === 'plane') return { clipPath: 'inset(0% 100% 0% 0%)', zIndex: 2 }
    if (tr === 'wave' || tr === 'board') return { opacity: 0, zIndex: 2 }
    return { opacity: 0, zIndex: 2 }
  },
  center: ({ tr }: C) => {
    const base = { x: 0, y: 0, scale: 1, opacity: 1, filter: 'brightness(1)', zIndex: 2 }
    if (tr === 'plane') return { ...base, clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.62, ease: [0.65, 0, 0.35, 1] } }
    if (tr === 'wave') return { ...base, transition: { opacity: { duration: 0, delay: 0.26 } } }
    if (tr === 'board') return { ...base, transition: { opacity: { duration: 0, delay: 0.36 } } }
    if (tr === 'swap') return { ...base, transition: { duration: 0.14, ease: 'easeOut' } }
    return { ...base, transition: spring }
  },
  exit: ({ dir, tr, reduce }: C) => {
    if (reduce || tr === 'none') return { opacity: 0, transition: { duration: 0 } }
    if (tr === 'push') return dir > 0 ? { x: '-26%', zIndex: 1, filter: 'brightness(0.86)', transition: spring } : { x: '100%', zIndex: 3, transition: spring }
    if (tr === 'up') return dir > 0 ? { scale: 0.96, zIndex: 1, filter: 'brightness(0.86)', transition: spring } : { y: '100%', zIndex: 3, transition: spring }
    if (tr === 'plane') return { zIndex: 1, x: '-12%', filter: 'brightness(0.9)', transition: { duration: 0.62, ease: [0.65, 0, 0.35, 1] } }
    if (tr === 'wave') return { opacity: 0, zIndex: 1, transition: { opacity: { duration: 0, delay: 0.26 } } }
    if (tr === 'board') return { opacity: 0, zIndex: 1, transition: { opacity: { duration: 0, delay: 0.36 } } }
    return { opacity: 0, zIndex: 1, transition: { duration: 0.08 } }
  },
} as unknown as Variants

/** Renders the current screen with the right transition. Put it inside a positioned box. */
export function Stage({ nav, children, waveColor = '#0794FF' }: { nav: NavApi<string>; children: ReactNode; waveColor?: string }) {
  const reduce = !!useReducedMotion()
  const custom: C = { dir: nav.dir, tr: nav.tr, reduce }
  const ctx = useMemo(() => ({ tr: nav.tr, dir: nav.dir }), [nav.tr, nav.dir])
  return (
    <NavCtx.Provider value={ctx}>
      <div className="absolute inset-0 overflow-hidden bg-navy">
        <AnimatePresence initial={false} custom={custom}>
          <motion.div key={nav.key} custom={custom} variants={variants} initial="enter" animate="center" exit="exit"
            className="absolute inset-0 will-change-transform" style={{ boxShadow: nav.tr === 'push' ? '-12px 0 30px -12px rgba(0,34,78,.35)' : undefined }}>
            {children}
          </motion.div>
        </AnimatePresence>
        {!reduce && nav.tr === 'plane' && nav.dir > 0 && <PlaneFly key={'p' + nav.key} />}
        {!reduce && nav.tr === 'wave' && nav.dir > 0 && <WaveWash key={'w' + nav.key} color={waveColor} />}
        {!reduce && nav.tr === 'board' && nav.dir > 0 && <BoardWipe key={'b' + nav.key} color={waveColor} />}
      </div>
    </NavCtx.Provider>
  )
}

/** Paper plane crossing the screen along the reveal edge, with a dashed trail. */
function PlaneFly() {
  useMemo(() => fx.swoosh(), [])
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path d="M-5 70 C 20 40, 40 85, 60 50 S 95 25, 110 30" fill="none" stroke="#00224E" strokeWidth="0.5" strokeDasharray="1.6 1.6" vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: 2.5 }} initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: [1, 1, 0] }} transition={{ duration: 0.75, ease: [0.65, 0, 0.35, 1], opacity: { times: [0, 0.8, 1], duration: 0.9 } }} />
      </svg>
      <motion.div className="absolute" style={{ width: 64, height: 64, marginLeft: -32, marginTop: -32 }}
        initial={{ left: '-10%', top: '70%', rotate: -20 }}
        animate={{ left: ['-10%', '30%', '60%', '112%'], top: ['70%', '58%', '50%', '28%'], rotate: [-20, 10, -14, -28] }}
        transition={{ duration: 0.66, ease: [0.65, 0, 0.35, 1] }}>
        <PlaneGlyph />
      </motion.div>
    </div>
  )
}
export const PlaneGlyph = ({ size = 64 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path d="M6 30 L58 8 L44 56 L30 38 Z" fill="#FFFBF3" stroke="#00224E" strokeWidth="3" strokeLinejoin="round" />
    <path d="M30 38 L58 8 L22 34" fill="#FFD265" stroke="#00224E" strokeWidth="3" strokeLinejoin="round" />
    <path d="M30 38 L28 50 L36 44" fill="#C9D7E6" stroke="#00224E" strokeWidth="3" strokeLinejoin="round" />
  </svg>
)

/** Blue field with a wavy crest washing up and over, then away. */
function WaveWash({ color }: { color: string }) {
  useMemo(() => fx.wave(), [])
  return (
    <motion.div className="pointer-events-none absolute inset-x-0 z-10" style={{ height: '130%', top: 0 }}
      initial={{ y: '100%' }} animate={{ y: ['100%', '-8%', '-8%', '-120%'] }} transition={{ duration: 0.56, times: [0, 0.45, 0.52, 1], ease: [0.65, 0, 0.35, 1] }}>
      <svg className="absolute -top-[38px] left-0 w-full" height="40" viewBox="0 0 400 40" preserveAspectRatio="none">
        <motion.path fill={color} animate={{ d: ['M0 20 Q50 0 100 20 T200 20 T300 20 T400 20 V40 H0Z', 'M0 20 Q50 40 100 20 T200 20 T300 20 T400 20 V40 H0Z'] }}
          transition={{ duration: 0.28, repeat: 1, repeatType: 'mirror' }} />
      </svg>
      <div className="w-full h-full" style={{ background: color }} />
      <svg className="absolute -bottom-[38px] left-0 w-full rotate-180" height="40" viewBox="0 0 400 40" preserveAspectRatio="none">
        <path fill={color} d="M0 20 Q50 0 100 20 T200 20 T300 20 T400 20 V40 H0Z" />
      </svg>
    </motion.div>
  )
}

/** A board rises from the bottom with the beaver holding its top edge, covers the screen, and keeps going up. */
function BoardWipe({ color }: { color: string }) {
  useMemo(() => fx.wave(), [])
  const base = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL
  const fill = color.toLowerCase() === '#ffd265' ? '#FFFBF3' : '#FFD265' // always a board that stands out from the screen behind it
  return (
    <motion.div className="pointer-events-none absolute inset-x-0 z-10" style={{ height: '125%', top: 0 }}
      initial={{ y: '100%' }} animate={{ y: ['100%', '-4%', '-4%', '-135%'] }} transition={{ duration: 0.72, times: [0, 0.42, 0.52, 1], ease: [0.65, 0, 0.35, 1] }}>
      <div className="absolute inset-0" style={{ background: fill, borderTop: '5px solid #00224E' }}>
        <div className="absolute left-0 right-0" style={{ top: 12, height: 3, background: '#00224E', opacity: 0.18 }} />
        {[12, 88].map(p => <span key={p} className="absolute rounded-full" style={{ left: p + '%', top: 22, width: 9, height: 9, background: '#FFFBF3', border: '2.4px solid #00224E' }} />)}
      </div>
      <motion.img src={`${base}fig/mascot-peek-1.svg`} alt="" draggable={false} className="absolute" style={{ left: '50%', width: 168, marginLeft: -84, bottom: '100%', marginBottom: -6 }}
        animate={{ rotate: [0, -3, 2, 0] }} transition={{ duration: 0.5, delay: 0.2 }} />
    </motion.div>
  )
}