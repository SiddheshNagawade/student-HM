import { ReactNode, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, ChevronRight, Clock3, Users, Footprints, Wrench, PackageSearch, CalendarX2, BellOff, CheckCheck, Home as HomeIcon, CalendarClock, Bell, Volume2, ShieldCheck, Phone, LogOut, Info, Inbox as InboxIcon, Zap, Droplets, Hammer, BrickWall } from '../ds/icons'
import { Art, Avatar, Beaver, Button, Card, EmptyState, ListRow, SectionLabel, Segmented, Steps, Tag, TagTone, Toggle, Tooltip, cx, Sheet } from '../ds/ui'
import { Rise, Drop, Words, Roll, spring, springPop } from '../ds/motion'
import { fx, useMuted, setMuted } from '../ds/fx'
import { StatusBar } from '../ds/stage'
import { ago, Trade } from '../data/iitr'
import { Screen, TabBar, DemoDock, useApp } from './shell'
import { store, roomCode, isActive, Req, STAGES, stageIndex, STATUS_LABEL, techOf, Status, Draft } from './store'

export const TRADE_ICON: Record<Trade, ReactNode> = { Electrical: <Zap size={20} />, Plumbing: <Droplets size={20} />, Carpentry: <Hammer size={20} />, Civil: <BrickWall size={20} /> }
const TONE: Record<Status, TagTone> = { reported: 'neutral', verified: 'info', scheduled: 'info', on_way: 'sun', visiting: 'sun', closed: 'success', waiting_part: 'warn', missed: 'danger', disputed: 'danger' }

export function useStartReport() {
  const { nav } = useApp()
  return (d?: Draft) => { store.set({ draft: d || {} }); nav.go(d?.item ? 'issue' : 'what') }
}

export function Tabs() {
  const { tab } = useApp()
  const unread = store.use(s => s.alerts).filter(a => !a.read).length
  const body = { home: <HomeTab />, requests: <RequestsTab />, inbox: <InboxTab />, me: <MeTab /> }[tab]
  return (
    <div className="absolute inset-0 flex flex-col bg-cream">
      <StatusBar />
      <div className="relative min-h-0 flex-1">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div key={tab} className="absolute inset-0 overflow-y-auto no-scrollbar" initial={false} exit={{ opacity: 0, transition: { duration: 0 } }}>
            {body}
          </motion.div>
        </AnimatePresence>
        <DemoDock bottom={16} />
      </div>
      <TabBar badge={unread} />
    </div>
  )
}

/* Room picture with tappable things that commonly break */
const HOTSPOTS: { x: number; y: number; label: string; d: Draft }[] = [
  { x: 50, y: 16, label: 'Ceiling fan', d: { trade: 'Electrical', item: 'fan', itemLabel: 'Ceiling fan' } },
  { x: 76, y: 18, label: 'Tube light', d: { trade: 'Electrical', item: 'light', itemLabel: 'Tube light' } },
  { x: 25, y: 31, label: 'Window', d: { trade: 'Carpentry', item: 'window', itemLabel: 'Window' } },
  { x: 69, y: 49, label: 'Switchboard', d: { trade: 'Electrical', item: 'socket', itemLabel: 'Socket / switch' } },
  { x: 87, y: 58, label: 'Door lock', d: { trade: 'Carpentry', item: 'door', itemLabel: 'Door / lock' } },
  { x: 64, y: 70, label: 'Desk and chair', d: { trade: 'Carpentry', item: 'chair', itemLabel: 'Chair / table' } },
]
function RoomPicker() {
  const start = useStartReport()
  return (
    <div className="relative mx-auto w-full max-w-[342px]">
      <Art n="room" className="w-full" alt="Your room" />
      {HOTSPOTS.map((h, i) => (
        <div key={h.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
          <Tooltip label={`Report: ${h.label}`}>
            <motion.button aria-label={`Report a problem with the ${h.label.toLowerCase()}`} onClick={() => { fx.select(); start(h.d) }}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...springPop, delay: 0.25 + i * 0.06 }} whileTap={{ scale: 0.85 }}
              className="relative flex h-11 w-11 items-center justify-center">
              <motion.span className="absolute h-7 w-7 rounded-full bg-sun/70" animate={{ scale: [1, 1.7], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }} />
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-navy bg-sun shadow-btn"><Plus size={16} strokeWidth={3.5} /></span>
            </motion.button>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}

function LiveCard({ r }: { r: Req }) {
  const { nav } = useApp()
  const t = techOf(r)
  const eta = store.use(s => s.eta)
  if (r.status === 'on_way' || r.status === 'visiting') {
    const here = r.status === 'visiting'
    return (
      <Card variant="raised" onClick={() => nav.go(here ? 'code' : 'nearby', { p: { id: r.id } })} className="!bg-navy p-5 text-cream">
        <div className="flex items-end gap-2">
          {here ? <span className="font-head text-[40px] font-extrabold leading-none">Here</span> : <><span className="font-head text-[56px] font-extrabold leading-[0.85]"><Roll value={eta} /></span><span className="mb-1 font-head text-[20px] font-bold">min</span></>}
          <span className="ml-auto"><Tag tone="sun">{here ? 'At your door' : 'On the way'}</Tag></span>
        </div>
        <div className="mt-3 font-head text-[20px] font-bold">{here ? `${t.name.split(' ')[0]} is at ${roomCode(store.get())}` : `${t.name.split(' ')[0]} is coming for your ${r.itemLabel.toLowerCase()}`}</div>
        <div className="mt-1 flex items-center justify-between text-[14px] text-cream/80">{here ? 'Show your closing code when it works' : 'Be in your room, or let the warden open it'}<ChevronRight size={20} /></div>
      </Card>
    )
  }
  return null
}

export function ReqCard({ r, delay = 0 }: { r: Req; delay?: number }) {
  const { nav } = useApp()
  const t = techOf(r)
  const sub = r.status === 'scheduled' ? `${r.day}, ${r.time} · ${t.name}` : r.status === 'waiting_part' ? r.part : r.status === 'closed' ? `Fixed by ${t.name} · ${ago(r.history[r.history.length - 1].at)}` : `${r.spot} · ${ago(r.createdAt)}`
  return (
    <Rise delay={delay}>
      <Card variant="outline" onClick={() => nav.go('track', { p: { id: r.id } })} className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-sand">{TRADE_ICON[r.trade]}</span>
          <div className="min-w-0 flex-1">
            <div className="font-head text-[18px] font-bold leading-tight">{r.itemLabel} · {r.issue.toLowerCase()}</div>
            <div className="mt-0.5 truncate text-[14px] text-mid">{sub}</div>
            <div className="mt-3 flex items-center gap-3">
              <Tag tone={TONE[r.status]}>{STATUS_LABEL[r.status]}</Tag>
              {r.status !== 'closed' && <Steps compact className="flex-1" steps={STAGES} current={stageIndex(r.status)} />}
            </div>
            {r.joined > 0 && <div className="mt-3 flex items-center gap-1.5 text-[13px] text-mid"><Users size={15} />{r.joined} others reported this too</div>}
          </div>
        </div>
      </Card>
    </Rise>
  )
}

function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' }

function HomeTab() {
  const s = store.use(x => x)
  const start = useStartReport()
  const active = s.reqs.filter(isActive)
  const live = active.find(r => r.status === 'on_way' || r.status === 'visiting')
  return (
    <div className="pb-6">
      <div className="bg-sun2 px-6 pb-4 pt-[56px]">
        <Rise><p className="text-[15px] font-semibold text-mid">{greeting()},</p></Rise>
        <Words text={s.name.split(' ')[0]} className="font-head text-h1 font-extrabold" />
        <Rise delay={0.08}><div className="mt-2 flex items-center gap-2"><Tag tone="dark" icon={<HomeIcon size={14} />}>{roomCode(s)}</Tag><span className="text-[15px] text-mid">{s.bhawan}</span></div></Rise>
        {live && <div className="mt-4"><LiveCard r={live} /></div>}
        <div className="mt-4"><RoomPicker /></div>
        <p className="mt-1 text-center text-[14px] font-semibold text-mid">Tap the yellow dots on what is broken</p>
      </div>
      <div className="px-6">
        <Rise delay={0.15} className="-mt-0 pt-4"><Button icon={<Plus size={22} strokeWidth={3} />} onClick={() => start()}>Report something else</Button></Rise>
        <SectionLabel className="mt-7" right={active.length ? <span className="text-[13px] text-mid">{active.length} open</span> : null}>In progress</SectionLabel>
        <div className="mt-3 flex flex-col gap-3">
          {active.length ? active.map((r, i) => <ReqCard key={r.id} r={r} delay={0.18 + i * 0.05} />)
            : <Card variant="flat" className="flex items-center gap-4 p-4"><Beaver pose="sit" size={64} /><div><div className="font-head text-[18px] font-bold">All good in {roomCode(s)}</div><div className="text-[14px] text-mid">Nothing is being fixed right now.</div></div></Card>}
        </div>
      </div>
    </div>
  )
}

function RequestsTab() {
  const reqs = store.use(s => s.reqs)
  const [v, setV] = useState<'open' | 'done'>('open')
  const list = reqs.filter(r => (v === 'open' ? isActive(r) : !isActive(r)))
  const start = useStartReport()
  return (
    <div className="px-6 pb-8 pt-[60px]">
      <Words text="Your requests" className="font-head text-h1 font-extrabold" />
      <Segmented className="mt-5 w-full" value={v} onChange={setV} options={[{ v: 'open', label: 'Open', count: reqs.filter(isActive).length }, { v: 'done', label: 'Fixed', count: reqs.filter(r => !isActive(r)).length }]} />
      <div className="mt-5 flex flex-col gap-3">
        {list.map((r, i) => <ReqCard key={r.id} r={r} delay={i * 0.05} />)}
        {!list.length && <EmptyState className="mt-8" pose={v === 'open' ? 'sit' : 'think'} title={v === 'open' ? 'Nothing open' : 'Nothing fixed yet'} body={v === 'open' ? 'When something breaks, report it and follow it here.' : 'Fixed problems and your ratings show up here.'}>{v === 'open' && <Button size="md" full={false} icon={<Plus size={20} />} onClick={() => start()}>Report a problem</Button>}</EmptyState>}
      </div>
    </div>
  )
}

const ALERT_ICON = { near: <Footprints size={20} />, done: <CheckCheck size={20} />, check: <ShieldCheck size={20} />, part: <PackageSearch size={20} />, missed: <CalendarX2 size={20} />, info: <Info size={20} /> }
const ALERT_BG = { near: 'bg-sun2', done: 'bg-green2', check: 'bg-sky2', part: 'bg-paper', missed: 'bg-ember2', info: 'bg-paper' }
function InboxTab() {
  const { nav } = useApp()
  const alerts = store.use(s => s.alerts)
  const today = alerts.filter(a => Date.now() - a.at < 20 * 3600e3), earlier = alerts.filter(a => Date.now() - a.at >= 20 * 3600e3)
  const open = (id?: string) => { if (id) nav.go('track', { p: { id } }) }
  const group = (title: string, list: typeof alerts, off: number) => list.length ? (
    <div className="mt-6">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-3 flex flex-col gap-3">
        {list.map((a, i) => (
          <Drop key={a.id} delay={off + i * 0.06} from={i % 2 ? 2 : -2}>
            <button onClick={() => { fx.tap(); store.set(s => ({ alerts: s.alerts.map(x => (x.id === a.id ? { ...x, read: true } : x)) })); open(a.reqId) }}
              className={cx('relative flex w-full items-start gap-3 rounded-[16px] border-2 border-navy p-4 text-left transition-transform hover:-translate-y-0.5', ALERT_BG[a.kind])}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border-2 border-navy bg-paper">{ALERT_ICON[a.kind]}</span>
              <span className="min-w-0 flex-1"><span className="block font-head text-[17px] font-bold leading-tight">{a.title}</span><span className="mt-0.5 block text-[14px] leading-snug text-mid">{a.body}</span><span className="mt-1.5 block text-[13px] text-faint">{ago(a.at)}</span></span>
              {!a.read && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-ember" aria-label="Unread" />}
            </button>
          </Drop>
        ))}
      </div>
    </div>
  ) : null
  return (
    <div className="px-6 pb-8 pt-[60px]">
      <div className="flex items-end justify-between">
        <Words text="Alerts" className="font-head text-h1 font-extrabold" />
        {alerts.some(a => !a.read) && <Button size="xs" variant="quiet" full={false} icon={<CheckCheck size={16} />} onClick={() => store.set(s => ({ alerts: s.alerts.map(a => ({ ...a, read: true })) }))}>Mark all read</Button>}
      </div>
      {group('Today', today, 0.05)}
      {group('Earlier', earlier, 0.15)}
      {!alerts.length && <EmptyState className="mt-12" pose="sit" title="Nothing new" body="We will tell you here when a technician is on the way or a part arrives." />}
    </div>
  )
}

function MeTab() {
  const { nav, setDemo } = useApp()
  const s = store.use(x => x)
  const muted = useMuted()
  const [office, setOffice] = useState(false)
  return (
    <div className="px-6 pb-8 pt-[60px]">
      <Words text="Profile" className="font-head text-h1 font-extrabold" />
      <Drop delay={0.08} className="mt-5">
        <div className="flex items-center gap-4 rounded-[20px] border-2 border-navy bg-paper p-4 shadow-btn">
          <Avatar name={s.name} size={60} />
          <div className="min-w-0"><div className="truncate font-head text-[22px] font-extrabold leading-tight">{s.name}</div><div className="truncate text-[14px] text-mid">{s.bhawan} · {roomCode(s)}</div><div className="truncate font-mono text-[13px] text-mid">{s.email || 'siddhi_s@ar.iitr.ac.in'}</div></div>
        </div>
      </Drop>
      <SectionLabel className="mt-7">Your room</SectionLabel>
      <div className="mt-1">
        <ListRow icon={<HomeIcon size={20} />} title="Room and Bhawan" sub={`${s.bhawan}, Block ${s.block}, ${roomCode(s)}`} onClick={() => nav.go('where')} />
        <ListRow icon={<CalendarClock size={20} />} title="Usual free hours" sub={`${s.hours.length} slots a week`} onClick={() => nav.go('hours', { p: { editing: true } })} />
      </div>
      <SectionLabel className="mt-6">Preferences</SectionLabel>
      <div className="mt-2 flex flex-col gap-4 rounded-[18px] bg-sand p-4">
        <Toggle on={s.alertsOn} onChange={v => store.set({ alertsOn: v })} label="Alerts" sub="Checked, on the way, fixed" />
        <Toggle on={!muted} onChange={v => setMuted(!v)} label="Sounds and vibration" sub="Little clicks and buzzes as you use the app" />
      </div>
      <SectionLabel className="mt-6">Help</SectionLabel>
      <div className="mt-1">
        <ListRow icon={<Phone size={20} />} title="Contact the Bhawan office" sub="Supervisor desk, 9 AM to 6 PM" onClick={() => setOffice(true)} />
        <ListRow icon={<ShieldCheck size={20} />} title="Privacy and data" sub="What technicians can and cannot see" onClick={() => setOffice(true)} />
        <ListRow icon={<LogOut size={20} />} title="Sign out" danger onClick={() => { store.set({ signedIn: false, onboarded: false }); setDemo([]); nav.reset('welcome', { tr: 'push' }) }} />
      </div>
      <p className="mt-6 text-center text-[13px] text-faint">ALIGN 2.0 · made for IIT Roorkee Bhawans</p>
      <Sheet open={office} onClose={() => setOffice(false)} title={`${s.bhawan} office`}>
        <div className="flex flex-col gap-3 text-[15px]">
          <Card variant="flat" className="p-4"><div className="font-semibold">Supervisor desk</div><div className="text-mid">Ground floor, Block A · 9 AM to 6 PM</div><div className="mt-1 font-mono">01332-28••••</div></Card>
          <Card variant="flat" className="p-4"><div className="font-semibold">What technicians see</div><div className="text-mid">Your first name, room code and the problem. Never your email, phone or enrolment number.</div></Card>
          <Button variant="secondary" size="md" onClick={() => setOffice(false)}>Done</Button>
        </div>
      </Sheet>
    </div>
  )
}
export { InboxIcon, Bell, Volume2, Clock3, Wrench }
