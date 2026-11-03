/* Align brand: the mark (a triangle joining three dots: student, technician, supervisor), the
   Kodchasan Bold wordmark, and a short opening that draws the mark once per visit.
   The mark has no background of its own. Pick the version for the surface it sits on:
   'light' for cream and yellow, 'blue' for the technician blue, 'dark' for navy and royal blue. */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export type Tone = 'light' | 'blue' | 'dark'
const BASE = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL
export const logoSrc = (tone: Tone = 'light') => `${BASE}logo-${tone}.svg`
const TRI: Record<Tone, string> = { light: '#7FA6E3', blue: '#CDEBF7', dark: '#CDEBF7' }
const RIM: Record<Tone, string> = { light: '#00224E', blue: '#00224E', dark: '#FFFBF3' }
const INK: Record<Tone, string> = { light: '#00224E', blue: '#00224E', dark: '#FFFBF3' }

/** The mark alone. `size` is its width. */
export const Mark = ({ size = 32, tone = 'light' }: { size?: number; tone?: Tone }) => (
  <img src={logoSrc(tone)} alt="" width={size} height={Math.round(size * 240 / 278)} draggable={false} style={{ display: 'block', flexShrink: 0, maxWidth: 'none' }} />
)

/** Mark + "Align". `size` is the font size of the word. */
export const Wordmark = ({ size = 24, tone = 'light', color }: { size?: number; tone?: Tone; color?: string }) => (
  <span role="img" aria-label="Align" style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.35) }}>
    <Mark size={Math.round(size * 1.3)} tone={tone} />
    <span aria-hidden="true" style={{ fontFamily: 'Kodchasan, sans-serif', fontWeight: 700, fontSize: size, lineHeight: 1, color: color || INK[tone], whiteSpace: 'nowrap' }}>Align</span>
  </span>
)

/** Opening: the triangle draws itself, the three dots pop in, the word appears, then it fades away.
    Plays once per visit (per browser tab); tap to skip. */
export function Splash({ bg, tone = 'light', id: storeKey = 'align.splash' }: { bg: string; tone?: Tone; id?: string }) {
  const reduce = useReducedMotion()
  const [show, setShow] = useState(() => { try { if (sessionStorage.getItem(storeKey)) return false; sessionStorage.setItem(storeKey, '1'); return true } catch { return false } })
  useEffect(() => { if (!show) return; const t = setTimeout(() => setShow(false), reduce ? 600 : 1700); return () => clearTimeout(t) }, [show])
  const d = (i: number) => (reduce ? 0 : 0.45 + i * 0.13)
  return (
    <AnimatePresence>
      {show && (
        <motion.div key="splash" onClick={() => setShow(false)} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
          style={{ position: 'absolute', inset: 0, zIndex: 90, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, cursor: 'pointer' }}>
          <svg width={150} height={130} viewBox="20 20 278 240" aria-hidden="true" style={{ overflow: 'visible' }}>
            <motion.path d="M158 62L64 218H251Z" fill="none" stroke={TRI[tone]} strokeWidth={15} strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }} />
            <motion.path d="M158 132L129 185H187Z" fill="none" stroke={TRI[tone]} strokeWidth={8} strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.35, delay: 0.3 }} />
            {([[158, 62, '#0E2DD2'], [64, 218, '#0794FF'], [251, 218, '#FFD265']] as const).map(([cx, cy, f], i) => (
              <motion.circle key={i} cx={cx} cy={cy} r={31} fill={f} stroke={RIM[tone]} strokeWidth={7}
                style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box' }}
                initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 14, delay: d(i) }} />
            ))}
          </svg>
          <motion.span initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: d(3) }}
            style={{ fontFamily: 'Kodchasan, sans-serif', fontWeight: 700, fontSize: 44, lineHeight: 1, color: INK[tone] }}>Align</motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
