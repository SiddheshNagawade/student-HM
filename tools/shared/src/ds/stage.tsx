/* Where a phone app lives. Always full screen, on every device: the 390 x 844 Figma frame is scaled to fit and the screen's
   own background is carried out to the window edges, so there are no bars and no device bezel. The "review" panel (what this
   app is, sound on/off, restart, the other side's actions, a map of every screen) sits behind a small "Try it" button. */
import { ReactNode, createContext, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Volume2, VolumeX, RotateCcw, MapPin, FlaskConical } from './icons'
import { setMuted, useMuted, fx } from './fx'
import { cx, Tooltip } from './ui'
import { useViewport, useKeepFocusVisible, VP } from './viewport'
import { Backdrop, useBackdrop, colorOf } from '../fig/backdrop'

const Framed = createContext(false)
export const useFramed = () => useContext(Framed)
export type ScreenGroup = { title: string; items: { id: string; label: string }[] }

/** The 390 x 844 Figma frame, always kept whole and never stretched, in every window:
    - upright phone, tablet or laptop: scaled to fit (up to 2.4 times), centred; the screen's background carries on to the window edges
    - phone turned sideways or a very short window: not shrunk to a stamp; it keeps a readable size and you scroll up and down
    - keyboard open: the visible area is exactly what the keyboard leaves, the frame keeps its width, and the field you are typing in scrolls into view
    One tree for all of these, so the screen (and what you typed) survives a rotate or a resize. */
/** How big the frame is drawn in this window, and whether the window is too short to show it whole (then it scrolls). */
export function frameScale(vp: VP, bar = false) {
  const gap = bar ? BAR_GAP : 0 // a little air between the last thing on a screen and the bottom bar
  const fit = Math.min(vp.w / 390, vp.h / (844 + gap))
  // tablets held sideways and laptops: a phone-shaped column would be a thin strip, so it is drawn large (about half the width) and scrolls up and down
  const wide = !vp.kb && vp.w >= 700 && vp.w / vp.h > 1.15
  const roomy = !vp.kb && !wide && fit >= 0.78
  const raw = vp.kb ? Math.min(vp.w / 390, 1.3) : wide ? Math.min((vp.w * 0.46) / 390, 1.7) : roomy ? Math.min(fit, 2.4) : Math.min(vp.w / 390, 1)
  // a whole number of pixels wide, so the frame's side edges never fall between two screen pixels (that showed as a faint vertical line)
  return { k: Math.floor(390 * raw) / 390, scrolls: !roomy, gap }
}
export const BAR_H = 60
export const BAR_GAP = 14
function PhoneBox({ bg, vp, children, bar }: { bg: string; vp: VP; children: ReactNode; bar?: boolean }) {
  useKeepFocusVisible()
  const { k, scrolls, gap } = frameScale(vp, !!bar)
  const screen = useBackdrop()
  // with a bottom bar the screen sits on it (any spare room goes above, where the screen's own colour carries on), without one it is centred
  const left = Math.round((vp.w - 390 * k) / 2), top = scrolls ? 0 : bar ? Math.max(0, vp.h - Math.round((844 + gap) * k)) : Math.max(0, Math.round((vp.h - 844 * k) / 2))
  const areaH = scrolls ? Math.max(vp.h, (844 + gap) * k) : vp.h
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: vp.kb ? vp.top : 0, height: vp.h, background: (screen && colorOf(screen.f)) || bg, overflowX: 'hidden', overflowY: scrolls ? 'auto' : 'hidden', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
      <div style={{ position: 'relative', width: vp.w, height: areaH }}>
        {/* the screen's own background, carried out to the window edges (no bars, no bezel) */}
        {screen && <div style={{ position: 'absolute', left: 0, top: 0, width: vp.w, height: areaH, pointerEvents: 'none' }}><Backdrop s={screen} k={k} left={left} top={top} vw={vp.w} vh={areaH} solid={scrolls} /></div>}
        {/* placed on whole pixels, so its edges are crisp */}
        <div style={{ position: 'absolute', left, top, width: 390 * k, height: 844 * k }}>
          <div className="relative origin-top-left overflow-hidden" style={{ width: 390, height: 844, transform: `scale(${k})` }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

export type SimAction = { label: string; sub?: string; run: () => void }
type PanelProps = { app: string; tagline: string; accent: string; groups: ScreenGroup[]; current: string; onJump: (id: string) => void; onRestart: () => void; sim: SimAction[] }

function ReviewPanel({ app, tagline, accent, groups, current, onJump, onRestart, sim }: PanelProps) {
  const muted = useMuted()
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
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
    </div>
  )
}

export function PhoneStage({ app, tagline, accent = '#FFD265', groups, current, onJump, onRestart, children, bg = '#FFFBF3', sim = [], bar }: {
  app: string; tagline: string; accent?: string; groups: ScreenGroup[]; current: string; onJump: (id: string) => void; onRestart: () => void; children: ReactNode; bg?: string; sim?: SimAction[]
  /** A bottom bar (390 wide, BAR_H high, designed like the screens). It spans the whole window and sits on its bottom edge. */
  bar?: ReactNode
}) {
  const vp = useViewport(); const [open, setOpen] = useState(false)
  // the review button lives in the empty room beside the app (tablet, laptop). On a phone there is no room and nothing may cover
  // the app, so it stays away (add ?review to the address to bring it back there).
  const { k } = frameScale(vp, !!bar)
  const room = (vp.w - 390 * k) / 2
  const asked = typeof location !== 'undefined' && new URLSearchParams(location.search).has('review')
  const show = room >= 96 || asked
  return (
    <>
      <PhoneBox bg={bg} vp={vp} bar={!!bar}><Framed.Provider value={false}>{children}</Framed.Provider></PhoneBox>
      {bar && !vp.kb && (
        <div style={{ position: 'fixed', left: 0, right: 0, top: vp.top + vp.h - BAR_H * k, height: BAR_H * k, zIndex: 30, background: '#FFFBF3', borderTop: `${Math.max(1.5, 2.5 * k)}px solid #00224E`, boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: Math.round((vp.w - 390 * k) / 2), top: 0, width: 390, height: BAR_H, transform: `scale(${k})`, transformOrigin: '0 0' }}>{bar}</div>
        </div>
      )}
      {show && <div style={{ position: 'fixed', right: asked && room < 96 ? 16 : Math.max(12, (room - 150) / 2), bottom: 16, zIndex: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, maxHeight: vp.h - 24 }}>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18 }}
              className="scroll-thin flex min-h-0 w-[min(320px,calc(100vw-32px))] flex-col overflow-y-auto rounded-[18px] border-2 border-navy bg-[#FFFBF3] p-4 text-navy shadow-[0_4px_0_#00224E]" style={{ maxHeight: vp.h - 90 }}>
              <ReviewPanel app={app} tagline={tagline} accent={accent} groups={groups} current={current} onJump={id => { onJump(id); setOpen(false) }} onRestart={() => { onRestart(); setOpen(false) }} sim={sim.map(a => ({ ...a, run: () => { setOpen(false); a.run() } }))} />
            </motion.div>
          )}
        </AnimatePresence>
        <button type="button" aria-expanded={open} aria-label="Try it: restart, simulate the other side, jump to any screen" onClick={() => { fx.tap(); setOpen(o => !o) }}
          className="rounded-full border-2 border-navy bg-[#FFD265] px-4 py-2 font-head text-[15px] font-extrabold text-navy shadow-[0_3px_0_#00224E] active:translate-y-[3px] active:shadow-none">{open ? 'Close' : 'Try it'}</button>
      </div>}
    </>
  )
}

/** Fake status bar (only used when a phone frame is drawn around the app; the app is full screen now, so it stays off). */
export const StatusBar = ({ dark }: { dark?: boolean }) => !useContext(Framed) ? null : (
  <div className={cx('pointer-events-none absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-7 text-[14px] font-bold', dark ? 'text-white' : 'text-navy')}>
    <span>9:41</span>
    <span className="flex items-center gap-1.5">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
      <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity=".5" /><rect x="2" y="2" width="16" height="8" rx="1.5" fill="currentColor" /><rect x="23" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5" /></svg>
    </span>
  </div>
)
