import { ReactNode, createContext, useContext, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, ClipboardList, Bell, UserRound, FlaskConical, X } from 'lucide-react'
import { IconButton, Sheet, cx, useToast, ToastOpts, Button } from '../ds/ui'
import { NavApi } from '../ds/nav'
import { StatusBar, useFramed } from '../ds/stage'
import { fx } from '../ds/fx'
import { spring } from '../ds/motion'

export type Screen = 'welcome' | 'signin' | 'verify' | 'isyou' | 'where' | 'hours' | 'permission' | 'tabs'
  | 'what' | 'issue' | 'safety' | 'place' | 'dupe' | 'slot' | 'review' | 'sent'
  | 'track' | 'nearby' | 'code' | 'wrong' | 'part' | 'missed' | 'rate' | 'closed' | 'reopen'
  | 'eOffline' | 'eServer' | 'eSession' | 'eNotFound'
export type Tab = 'home' | 'requests' | 'inbox' | 'me'

export type DemoAction = { label: string; sub?: string; run: () => void }
type AppCtx = {
  nav: NavApi<Screen>; toast: (t: ToastOpts) => void; tab: Tab; setTab: (t: Tab) => void
  demo: DemoAction[]; setDemo: (d: DemoAction[]) => void; online: boolean
}
export const Ctx = createContext<AppCtx>(null!)
export const useApp = () => useContext(Ctx)
export { useToast }

/** A full screen: optional coloured top, scrolling body, pinned footer. */
export function Screen({ children, bg = 'bg-cream', className, footer, top, pad = true, scroll = true, dark }: {
  children: ReactNode; bg?: string; className?: string; footer?: ReactNode; top?: ReactNode; pad?: boolean; scroll?: boolean; dark?: boolean
}) {
  return (
    <div className={cx('absolute inset-0 flex flex-col', bg)}>
      <StatusBar dark={dark} />
      {top}
      <div className={cx('relative min-h-0 flex-1', scroll ? 'overflow-y-auto no-scrollbar' : 'overflow-hidden', pad && 'px-6', className)}>{children}</div>
      {footer && <div className="relative shrink-0 px-6 pb-8 pt-3">{footer}</div>}
    </div>
  )
}

export function TopBar({ title, sub, onBack, right, className, step }: { title?: ReactNode; sub?: ReactNode; onBack?: () => void; right?: ReactNode; className?: string; step?: [number, number] }) {
  const { nav } = useApp()
  return (
    <div className={cx('relative z-10 shrink-0 px-5 pt-[52px]', className)}>
      <div className="flex min-h-[48px] items-center gap-3">
        {onBack !== undefined || nav.depth > 1 ? <IconButton label="Back" onClick={onBack || (() => nav.back())}><ArrowLeft size={22} strokeWidth={2.5} /></IconButton> : null}
        <div className="min-w-0 flex-1">
          {title && <div className="truncate font-head text-[19px] font-extrabold leading-tight">{title}</div>}
          {sub && <div className="truncate text-[14px] text-mid">{sub}</div>}
        </div>
        {right}
      </div>
      {step && (
        <div className="mt-3 flex gap-1.5" aria-label={`Step ${step[0]} of ${step[1]}`}>
          {Array.from({ length: step[1] }, (_, i) => (
            <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy/10">
              <motion.span className="block h-full rounded-full bg-navy" initial={{ width: i < step[0] - 1 ? '100%' : 0 }} animate={{ width: i < step[0] ? '100%' : 0 }} transition={{ ...spring, delay: 0.1 }} />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export const Title = ({ children, sub, className }: { children: ReactNode; sub?: ReactNode; className?: string }) => (
  <div className={cx('mt-2', className)}>
    <h1 className="font-head text-h1 font-extrabold tracking-[-0.01em]">{children}</h1>
    {sub && <p className="mt-2 text-[16px] leading-relaxed text-mid">{sub}</p>}
  </div>
)

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home }, { id: 'requests', label: 'Requests', icon: ClipboardList }, { id: 'inbox', label: 'Alerts', icon: Bell }, { id: 'me', label: 'Profile', icon: UserRound },
]
export function TabBar({ badge }: { badge?: number }) {
  const { tab, setTab } = useApp()
  return (
    <nav className="relative z-20 shrink-0 border-t-2 border-navy bg-paper px-3 pb-6 pt-2" aria-label="Main">
      <div className="flex">
        {TABS.map(t => {
          const on = tab === t.id; const I = t.icon
          return (
            <button key={t.id} aria-current={on ? 'page' : undefined} onClick={() => { if (!on) { fx.select(); setTab(t.id) } }} className="relative flex h-14 flex-1 flex-col items-center justify-center gap-1">
              {on && <motion.span layoutId="tab-pill" className="absolute inset-x-2 inset-y-0.5 rounded-[14px] bg-sun2" transition={spring} />}
              <motion.span className="relative" animate={{ y: on ? -1 : 0, scale: on ? 1.08 : 1 }} transition={spring}>
                <I size={24} strokeWidth={on ? 2.6 : 2} />
                {t.id === 'inbox' && !!badge && <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-paper bg-ember px-1 text-[11px] font-bold text-white">{badge}</span>}
              </motion.span>
              <span className={cx('relative text-[12px]', on ? 'font-bold' : 'font-medium text-mid')}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/** Floating demo control: simulates what the supervisor and technician would do. */
export function DemoDock({ bottom = 112 }: { bottom?: number }) {
  const { demo } = useApp()
  const [open, setOpen] = useState(false)
  const framed = useFramed()
  if (!demo.length || framed) return null
  return (
    <>
      <motion.div className="absolute right-4 z-30" style={{ bottom }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}>
        <motion.span className="absolute inset-0 rounded-full bg-royal/30" animate={{ scale: [1, 1.5], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
        <IconButton label="Demo: simulate what happens next" side="left" variant="dark" size={48} onClick={() => setOpen(true)} className="!bg-royal"><FlaskConical size={22} /></IconButton>
      </motion.div>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-head text-h2 font-extrabold">Demo controls</h2>
          <IconButton label="Close" variant="ghost" size={36} onClick={() => setOpen(false)}><X size={20} /></IconButton>
        </div>
        <p className="mb-4 text-[14px] text-mid">In the real app the supervisor and technician do these. Pick one to see what the student sees.</p>
        <div className="flex flex-col gap-2.5">
          {demo.map(d => (
            <Button key={d.label} variant="secondary" size="md" className="!h-auto !justify-start !py-3 text-left" onClick={() => { setOpen(false); setTimeout(d.run, 250) }}>
              <span className="flex flex-col items-start gap-1"><span>{d.label}</span>{d.sub && <span className="font-body text-[13px] font-medium text-mid">{d.sub}</span>}</span>
            </Button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
