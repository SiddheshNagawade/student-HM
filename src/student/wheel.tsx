/* "When can they come?" time wheel.
   The Figma screen puts the half-hour slots on a dotted arc. Here that arc is the rim of a wheel:
   scroll, drag sideways, use the arrow keys, or tap a slot, and the wheel turns. The slot at the top
   is the chosen one, drawn with the Figma's white "selected" card; the others use the Figma's cream card.
   Technicians work 10 AM to 6 PM, so the slots run 10:00 AM to 5:30 PM. */
import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { figArt } from '../fig/Fig'
import { fx } from '../ds/fx'

export const SLOT_START = Array.from({ length: 16 }, (_, i) => 600 + i * 30) // minutes after midnight
const hm = (m: number) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')}` }
const ap = (m: number) => (m < 720 ? 'AM' : 'PM')
export const slotShort = (i: number) => hm(SLOT_START[i])
export const slotRange = (i: number) => { const a = SLOT_START[i], b = a + 30; return ap(a) === ap(b) ? `${hm(a)} to ${hm(b)} ${ap(b)}` : `${hm(a)} ${ap(a)} to ${hm(b)} ${ap(b)}` }
/** Index of a slot from a stored range text, or -1. */
export const slotOf = (range: string) => SLOT_START.findIndex((_, i) => slotRange(i) === range)
/** Slots that have already gone today (start is less than 45 minutes away). */
export const goneToday = (i: number) => { const d = new Date(); return SLOT_START[i] < d.getHours() * 60 + d.getMinutes() + 45 }

const CX = 195, CY = 352.6, RIM = 169, R = 160, STEP = 37 // degrees between slots
const rad = (d: number) => (d * Math.PI) / 180

export function TimeWheel({ value, onChange, disabled }: { value: number; onChange: (i: number) => void; disabled: (i: number) => boolean }) {
  const reduce = useReducedMotion()
  const [pos, setPos] = useState(value)
  const posRef = useRef(value); const anim = useRef<{ stop: () => void } | null>(null)
  const lastTick = useRef(Math.round(value)); const drag = useRef<{ x: number; p: number; moved: boolean } | null>(null)
  const wheelAcc = useRef(0)
  const set = (p: number) => {
    posRef.current = p; setPos(p)
    const r = Math.round(p); if (r !== lastTick.current) { lastTick.current = r; fx.tick(r % 6) }
  }
  const nearestOk = (p: number) => {
    const n = SLOT_START.length; let best = -1
    for (let i = 0; i < n; i++) if (!disabled(i) && (best < 0 || Math.abs(i - p) < Math.abs(best - p))) best = i
    return best < 0 ? Math.max(0, Math.min(n - 1, Math.round(p))) : best
  }
  const go = (to: number) => {
    anim.current?.stop()
    if (reduce) { set(to); onChange(to); return }
    anim.current = animate(posRef.current, to, { type: 'spring', stiffness: 260, damping: 26, onUpdate: set })
    if (to !== value) onChange(to)
  }
  // follow outside changes (for example "use my usual free hours")
  useEffect(() => { if (Math.round(posRef.current) !== value && !drag.current) go(value) }, [value])
  useEffect(() => () => anim.current?.stop(), [])

  const step = (d: number) => { let t = Math.round(posRef.current) + d; while (t >= 0 && t < SLOT_START.length && disabled(t)) t += d; if (t >= 0 && t < SLOT_START.length) go(t) }
  const items = SLOT_START.map((_, i) => {
    const off = i - pos
    if (Math.abs(off) > 1.75) return null
    const a = -90 + off * STEP
    const x = CX + R * Math.cos(rad(a)), y = CY + R * Math.sin(rad(a))
    const w = Math.max(0, 1 - Math.abs(off) * 1.6) // how "selected" this card looks
    const s = 1 + 0.3 * w
    const gone = disabled(i)
    return (
      <button key={i} type="button" tabIndex={-1} aria-label={slotRange(i) + (gone ? ', already gone' : '')} disabled={gone}
        onClick={() => { if (!drag.current?.moved && !gone) go(i) }}
        style={{ position: 'absolute', left: x - 37, top: y - 31, width: 74, height: 62, padding: 0, border: 0, background: 'none', cursor: gone ? 'default' : 'pointer',
          transform: `scale(${s})`, opacity: Math.max(0, Math.min(1, 1 - (Math.abs(off) - 1) * 1.45)) * (gone ? 0.4 : 1), userSelect: 'none', WebkitUserSelect: 'none', zIndex: Math.round(w * 10), pointerEvents: 'auto' }}>
        <img src={figArt('226:433')} alt="" draggable={false} style={{ position: 'absolute', left: 0, top: 0, width: 74, height: 62, opacity: 1 - w }} />
        <img src={figArt('226:429')} alt="" draggable={false} style={{ position: 'absolute', left: 0, top: 0, width: 74, height: 62, opacity: w }} />
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 6, fontFamily: '"DM Mono", monospace', fontWeight: 500, fontSize: 16, color: '#00224E', textDecoration: gone ? 'line-through' : undefined }}>{slotShort(i)}</span>
      </button>
    )
  })
  return (
    <div role="slider" tabIndex={0} aria-label="Visit time" aria-valuemin={0} aria-valuemax={SLOT_START.length - 1} aria-valuenow={value} aria-valuetext={slotRange(value)}
      onKeyDown={e => { if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) } if (e.key === 'ArrowRight') { e.preventDefault(); step(1) } }}
      onWheel={e => { wheelAcc.current += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (Math.abs(wheelAcc.current) >= 40) { step(Math.sign(wheelAcc.current)); wheelAcc.current = 0 } }}
      onPointerDown={e => { anim.current?.stop(); drag.current = { x: e.clientX, p: posRef.current, moved: false } }}
      onPointerMove={e => {
        const d = drag.current; if (!d) return
        const k = (e.currentTarget.getBoundingClientRect().width / 390) || 1
        const dx = (e.clientX - d.x) / k
        if (Math.abs(dx) > 4) { d.moved = true; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId) }
        if (d.moved) set(Math.max(-0.4, Math.min(SLOT_START.length - 0.6, d.p - dx / (R * rad(STEP)))))
      }}
      onPointerUp={() => { const d = drag.current; if (d?.moved) go(nearestOk(posRef.current)); setTimeout(() => { drag.current = null }, 0) }}
      onPointerCancel={() => { drag.current = null; go(nearestOk(posRef.current)) }}
      style={{ position: 'absolute', left: 0, top: 96, width: 390, height: 226, overflow: 'hidden', touchAction: 'pan-y', cursor: 'grab', outline: 'none', pointerEvents: 'auto', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <div style={{ position: 'absolute', left: 0, top: -96, width: 390, height: 330 }}>
        <svg width={390} height={330} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} aria-hidden="true">
          <circle cx={CX} cy={CY} r={RIM} fill="none" stroke="#00224E" strokeWidth={2.6} strokeLinecap="round" strokeDasharray="3 10"
            transform={`rotate(${-pos * STEP} ${CX} ${CY})`} />
        </svg>
        {items}
      </div>
    </div>
  )
}

/** A daytime sun in the same hand-drawn line as the Figma moon it replaces (visits are 10 AM to 6 PM). */
export function Sun() {
  const reduce = useReducedMotion()
  const ref = useRef<SVGGElement>(null)
  useEffect(() => { if (reduce || !ref.current) return; const a = animate(0, 45, { duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3, onUpdate: v => ref.current?.setAttribute('transform', `rotate(${v} 32 32)`) }); return () => a.stop() }, [])
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <g ref={ref}>{Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <path key={i} d={`M${32 + 19 * Math.cos(a)} ${32 + 19 * Math.sin(a)}L${32 + 27 * Math.cos(a)} ${32 + 27 * Math.sin(a)}`} stroke="#00224E" strokeWidth="2.6" strokeLinecap="round" /> })}</g>
      <path d="M45.5 32C45.6 39.6 39.3 45.8 31.8 45.6C24.4 45.4 18.4 39.5 18.5 31.9C18.6 24.4 24.6 18.3 32.1 18.4C39.5 18.6 45.4 24.5 45.5 32Z" fill="#FFFBF3" stroke="#00224E" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  )
}
