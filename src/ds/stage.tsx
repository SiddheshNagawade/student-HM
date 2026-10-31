/* Where a phone app lives. On a real phone: full screen. On a laptop: a phone-sized device in the
   middle with a side panel (what this app is, sound on/off, restart, and a map of every screen so a
   reviewer can jump anywhere without clicking through the whole flow). */
import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Volume2, VolumeX, RotateCcw, MapPin, FlaskConical } from './icons'
import { setMuted, useMuted, fx } from './fx'
import { cx, Tooltip } from './ui'

const Framed = createContext(false)
export const useFramed = () => useContext(Framed)
export type ScreenGroup = { title: string; items: { id: string; label: string }[] }

function useWide() {
  const q = '(min-width: 900px) and (min-height: 640px)'
  const [w, setW] = useState(() => matchMedia(q).matches)
  useEffect(() => { const m = matchMedia(q); const f = () => setW(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  return w
}
function useScale() {
  const [s, setS] = useState(1)
  useEffect(() => { const f = () => setS(Math.min(1, (innerHeight - 48) / 844)); f(); addEventListener('resize', f); return () => removeEventListener('resize', f) }, [])
  return s
}

/** On a phone the 390 x 844 Figma frame is scaled to fit the screen exactly. */
function MobileFit({ bg, children }: { bg: string; children: ReactNode }) {
  const [k, setK] = useState(1)
  useEffect(() => { const f = () => setK(Math.min(innerWidth / 390, innerHeight / 844)); f(); addEventListener('resize', f); return () => removeEventListener('resize', f) }, [])
  return (
    <div className="fixed inset-0 flex justify-center overflow-hidden" style={{ background: bg }}>
      <div style={{ width: 390 * k, height: 844 * k }}><div className="relative origin-top-left overflow-hidden" style={{ width: 390, height: 844, transform: `scale(${k})` }}>{children}</div></div>
    </div>
  )
}

export type SimAction = { label: string; sub?: string; run: () => void }
export function PhoneStage({ app, tagline, accent = '#FFD265', groups, current, onJump, onRestart, children, bg = '#FFFBF3', sim = [] }: {
  app: string; tagline: string; accent?: string; groups: ScreenGroup[]; current: string; onJump: (id: string) => void; onRestart: () => void; children: ReactNode; bg?: string; sim?: SimAction[]
}) {
  const wide = useWide(); const scale = useScale(); const muted = useMuted()
  if (!wide) return <MobileFit bg={bg}>{children}</MobileFit>
  return (
    <div className="fixed inset-0 flex items-center justify-center gap-12 bg-[#EDE4CF] p-6">
      <aside className="flex h-full max-h-[844px] w-[300px] shrink-0 flex-col">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[12px] border-2 border-navy font-head text-[24px] font-extrabold" style={{ background: accent }}><span className="pt-1">A</span></span>
          <div><div className="font-head text-[22px] font-extrabold leading-none">ALIGN</div><div className="mt-1 text-[14px] font-semibold text-mid">{app}</div></div>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-mid">{tagline}</p>
        <div className="mt-4 flex gap-2">
          <Tooltip label={muted ? 'Turn sound and vibration on' : 'Mute sound and vibration'}>
            <button onClick={() => setMuted(!muted)} className="flex h-10 items-center gap-2 rounded-[12px] border-2 border-navy bg-paper px-3 text-[14px] font-bold shadow-btn active:translate-y-[3px] active:shadow-none">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}{muted ? 'Sound off' : 'Sound on'}
            </button>
          </Tooltip>
          <Tooltip label="Clear demo data and start again">
            <button onClick={() => { fx.tap(); onRestart() }} className="flex h-10 items-center gap-2 rounded-[12px] border-2 border-navy bg-paper px-3 text-[14px] font-bold shadow-btn active:translate-y-[3px] active:shadow-none"><RotateCcw size={17} />Restart</button>
          </Tooltip>
        </div>
        <AnimatePresence>
          {sim.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-6 flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-navy"><FlaskConical size={15} />Simulate the other side</div>
              <p className="mt-1 text-[13px] text-mid">What the {app.startsWith('Tech') ? 'student and supervisor' : app.startsWith('Student') ? 'supervisor and technician' : 'students and technicians'} would do next.</p>
              <div className="mt-2 flex flex-col gap-2">
                {sim.map(a => (
                  <button key={a.label} onClick={() => { fx.tap(); a.run() }} className="flex w-full flex-col items-start rounded-[14px] border-2 border-navy bg-[#FFFBF3] px-3 py-2 text-left shadow-[0_3px_0_#00224E] transition-transform active:translate-y-[3px] active:shadow-none">
                    <span className="text-[14px] font-bold text-navy">{a.label}</span>{a.sub && <span className="text-[12px] text-mid">{a.sub}</span>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-6 flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-mid"><MapPin size={15} />Every screen</div>
        <nav className="scroll-thin mt-2 min-h-0 flex-1 overflow-y-auto pr-2">
          {groups.map(g => (
            <div key={g.title} className="mb-3">
              <div className="px-2 py-1 text-[12px] font-bold text-faint">{g.title}</div>
              {g.items.map(i => {
                const on = i.id === current
                return (
                  <button key={i.id} onClick={() => { fx.tap(); onJump(i.id) }} className={cx('relative flex w-full items-center rounded-[10px] px-2 py-1.5 text-left text-[14px] transition-colors', on ? 'font-bold text-navy' : 'text-mid hover:bg-navy/5 hover:text-navy')}>
                    {on && <motion.span layoutId="stage-cur" className="absolute inset-0 rounded-[10px] bg-paper shadow-card" transition={{ type: 'spring', stiffness: 600, damping: 40 }} />}
                    <span className="relative">{i.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div style={{ width: 390 * scale, height: 844 * scale }} className="shrink-0">
        <div className="relative origin-top-left overflow-hidden rounded-[48px] shadow-phone" style={{ width: 390, height: 844, transform: `scale(${scale})`, background: bg }}>
          <Framed.Provider value={true}>{children}</Framed.Provider>
        </div>
      </div>
    </div>
  )
}

/** Fake status bar so the phone frame reads as a phone. */
export const StatusBar = ({ dark }: { dark?: boolean }) => !useContext(Framed) ? null : (
  <div className={cx('pointer-events-none absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-7 text-[14px] font-bold', dark ? 'text-white' : 'text-navy')}>
    <span>9:41</span>
    <span className="flex items-center gap-1.5">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
      <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity=".5" /><rect x="2" y="2" width="16" height="8" rx="1.5" fill="currentColor" /><rect x="23" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5" /></svg>
    </span>
  </div>
)
