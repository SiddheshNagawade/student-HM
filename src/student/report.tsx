import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, X, AlertTriangle, ShieldAlert, ShieldCheck, Pencil, Users, Clock3, DoorOpen, Send, CloudOff, Zap, Droplets, Hammer, BrickWall, Sparkles, Check, MapPin, CalendarDays } from 'lucide-react'
import { Art, Beaver, Button, Card, Chip, Choice, LinkButton, Tag, TextArea, TextField, Toggle, cx, Divider } from '../ds/ui'
import { Drop, Rise, Words, Pop, spring, springPop } from '../ds/motion'
import { fx } from '../ds/fx'
import { ITEMS, PLACES, SLOT_TIMES, Trade, nextDays, addMin, TECHS } from '../data/iitr'
import { Screen, TopBar, Title, useApp } from './shell'
import { store, roomCode, submitDraft, joinRequest } from './store'

const TRADES: { t: Trade; icon: React.ReactElement; sub: string }[] = [
  { t: 'Electrical', icon: <Zap size={20} />, sub: 'Fan, light, socket' }, { t: 'Plumbing', icon: <Droplets size={20} />, sub: 'Tap, drain, flush' },
  { t: 'Carpentry', icon: <Hammer size={20} />, sub: 'Door, almirah, chair' }, { t: 'Civil', icon: <BrickWall size={20} />, sub: 'Tiles, walls' },
]
const STEPS = 4
const ItemArt = ({ art, trade, size = 52 }: { art?: string; trade: Trade; size?: number }) =>
  art ? <Art n={art === 'fan' ? 'drawing' : art} w={art === 'fan' ? size * 0.9 : size} /> : <span className="flex items-center justify-center rounded-[14px] bg-sand text-navy" style={{ width: size, height: size }}>{TRADES.find(x => x.t === trade)!.icon}</span>

export function What() {
  const { nav } = useApp()
  const d = store.use(s => s.draft)
  const [trade, setTrade] = useState<Trade>(d.trade || 'Electrical')
  return (
    <Screen top={<TopBar step={[1, STEPS]} />}>
      <Title>What broke?</Title>
      <div className="no-scrollbar -mx-6 mt-5 flex gap-2 overflow-x-auto px-6 pb-1">
        {TRADES.map(x => <Chip key={x.t} on={trade === x.t} onClick={() => setTrade(x.t)}>{x.t}</Chip>)}
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div key={trade} className="mt-5 grid grid-cols-2 gap-3 pb-6" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0, transition: { duration: 0.1 } }} transition={spring}>
          {ITEMS[trade].map(it => (
            <Choice key={it.id} on={d.item === it.id} title={it.label} art={<ItemArt art={it.art} trade={trade} />}
              onClick={() => { store.set({ draft: { ...d, trade, item: it.id, itemLabel: it.label, issue: undefined } }); setTimeout(() => nav.go('issue'), 180) }} />
          ))}
        </motion.div>
      </AnimatePresence>
    </Screen>
  )
}

export function Issue() {
  const { nav } = useApp()
  const d = store.use(s => s.draft)
  const item = ITEMS[d.trade || 'Electrical'].find(i => i.id === d.item) || ITEMS.Electrical[0]
  const [snap, setSnap] = useState(false)
  const dangerous = (d.issue || '').toLowerCase().includes('spark') || d.item === 'socket' || d.item === 'geyser'
  const takePhoto = () => { setSnap(true); fx.shutter(); setTimeout(() => { setSnap(false); store.set({ draft: { ...store.get().draft, photo: true } }) }, 260) }
  const spin = d.item === 'fan' && d.issue && d.issue !== 'Not spinning'
  return (
    <Screen top={<TopBar title={item.label} sub={`${d.trade} · ${roomCode(store.get())}`} step={[1, STEPS]} />}
      footer={<Button disabled={!d.issue} onClick={() => nav.go(dangerous ? 'safety' : 'place')}>Next</Button>}>
      <div className="relative mt-1 flex h-[132px] items-center justify-center overflow-hidden rounded-[20px] bg-sun2">
        <motion.div animate={spin ? { rotate: d.issue === 'Runs slow' ? 360 : [0, 6, -6, 0] } : { rotate: 0 }} transition={spin ? { repeat: Infinity, duration: d.issue === 'Runs slow' ? 3 : 0.25, ease: 'linear' } : spring}>
          <ItemArt art={item.art} trade={d.trade || 'Electrical'} size={100} />
        </motion.div>
        <AnimatePresence>{snap && <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} />}</AnimatePresence>
      </div>
      <Title className="mt-5">What is it doing?</Title>
      <div role="radiogroup" className="mt-4 flex flex-col gap-2.5">
        {item.issues.map((x, i) => <Rise key={x} delay={0.04 * i}><Choice layout="row" on={d.issue === x} title={x} onClick={() => store.set({ draft: { ...d, issue: x } })} /></Rise>)}
      </div>
      <div className="mt-6">
        <span className="mb-2 block text-[14px] font-semibold">Photo <span className="font-normal text-mid">(helps the technician bring the right part)</span></span>
        <AnimatePresence mode="wait" initial={false}>
          {d.photo ? (
            <motion.div key="p" initial={{ y: -30, rotate: -8, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={springPop}
              className="relative inline-block rounded-[6px] border-2 border-navy bg-paper p-2 pb-6 shadow-card">
              <Art n={d.item === 'chair' ? 'photo-chair' : 'photo-fan'} w={120} />
              <span className="absolute bottom-1 left-2 text-[12px] text-mid">just now</span>
              <button aria-label="Remove photo" onClick={() => { fx.deselect(); store.set({ draft: { ...d, photo: false } }) }} className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-navy bg-paper"><X size={16} /></button>
            </motion.div>
          ) : (
            <motion.button key="b" onClick={takePhoto} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} whileTap={{ scale: 0.97 }}
              className="flex h-[72px] w-full items-center gap-3 rounded-[16px] border-2 border-dashed border-navy/40 bg-paper px-4 text-left hover:border-navy">
              <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-sky2"><Camera size={22} /></span>
              <span><span className="block text-[16px] font-semibold">Take a photo</span><span className="text-[13px] text-mid">Optional</span></span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <TextArea className="mt-5 pb-4" label="Anything else?" placeholder={item.id === 'fan' ? 'For example: stops after 5 minutes, makes a ticking sound' : 'For example: started last night'} value={d.note || ''} onChange={e => store.set({ draft: { ...d, note: e.target.value } })} />
    </Screen>
  )
}

export function Safety() {
  const { nav } = useApp()
  const d = store.use(s => s.draft)
  const yes = d.urgent === true, no = d.urgent === false
  return (
    <Screen bg="bg-sand" top={<TopBar title="Quick safety check" step={[1, STEPS]} />} footer={<Button disabled={!yes && !no} variant={yes ? 'danger' : 'primary'} onClick={() => nav.go('place')}>{yes ? 'Report as dangerous' : 'Next'}</Button>}>
      <Drop className="mt-2 flex justify-center"><Art n="socket" w={190} /></Drop>
      <Title className="mt-4" sub="Be honest. It only changes how fast we come.">Sparks, a burning smell, or water near a socket?</Title>
      <div className="mt-5 flex flex-col gap-2.5">
        <Choice layout="row" on={no} title="No, it is safe" sub="Normal priority" icon={<ShieldCheck size={22} className="text-green" />} onClick={() => store.set({ draft: { ...d, urgent: false } })} />
        <Choice layout="row" on={yes} title="Yes, it looks dangerous" sub="The warden is called right away" icon={<ShieldAlert size={22} className="text-ember" />} onClick={() => { fx.error(); store.set({ draft: { ...d, urgent: true } }) }} />
      </div>
      <AnimatePresence>
        {yes && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 flex gap-3 rounded-[16px] border-2 border-ember bg-ember2 p-4">
              <AlertTriangle className="mt-0.5 shrink-0 text-ember" size={22} />
              <p className="text-[15px] leading-relaxed text-ink"><b>Step away from it.</b> If you can, switch off the MCB for your room. Do not touch wet switches.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  )
}

const PLACE_ART: Record<string, string | undefined> = { washroom: 'vignette-washroom-icon', corridor: 'vignette-corridor-icon', common: 'vignette', stairs: 'vignette-stairs' }
export function Place() {
  const { nav } = useApp()
  const s = store.use(x => x)
  const d = s.draft
  const shared = d.place && d.place !== 'room'
  const [floor, setFloor] = useState(s.floor)
  const next = () => {
    const p = PLACES.find(x => x.id === d.place)!
    const spot = d.place === 'room' ? `Room ${roomCode(s)}` : `${p.label}, ${floor === 'G' ? 'ground floor' : `floor ${floor}`}`
    store.set({ draft: { ...d, spot } })
    const dupe = shared && s.others.find(o => o.place === d.place && o.trade === d.trade)
    nav.go(dupe ? 'dupe' : 'slot', { p: dupe ? { id: dupe.id } : undefined })
  }
  return (
    <Screen top={<TopBar step={[2, STEPS]} />} footer={<Button disabled={!d.place} onClick={next}>Next</Button>}>
      <Title>Where is it?</Title>
      <div className="mt-5">
        <Choice layout="row" on={d.place === 'room'} title={`My room · ${roomCode(s)}`} sub="Only you are affected" icon={<MapPin size={22} />} onClick={() => store.set({ draft: { ...d, place: 'room' } })} />
      </div>
      <p className="mb-3 mt-6 text-[14px] font-semibold">Or a shared space</p>
      <div className="grid grid-cols-2 gap-3">
        {PLACES.filter(p => p.id !== 'room').map(p => (
          <Choice key={p.id} on={d.place === p.id} title={p.label} sub={p.sub} art={PLACE_ART[p.id] ? <Art n={PLACE_ART[p.id]!} w={56} /> : undefined} onClick={() => store.set({ draft: { ...d, place: p.id } })} />
        ))}
      </div>
      <AnimatePresence>
        {shared && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="mb-2 mt-6 text-[14px] font-semibold">Which floor?</p>
            <div className="flex flex-wrap gap-2 pb-6">{['G', '1', '2', '3'].map(f => <Chip key={f} on={floor === f} onClick={() => setFloor(f)}>{f === 'G' ? 'Ground' : `Floor ${f}`}</Chip>)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  )
}

export function Dupe() {
  const { nav } = useApp()
  const id = nav.params.id as string
  const o = store.use(s => s.others).find(r => r.id === id)
  if (!o) return null
  const t = TECHS.find(x => x.id === o.techId)!
  return (
    <Screen top={<TopBar title="Already reported" step={[2, STEPS]} />}
      footer={<div className="flex flex-col gap-1"><Button icon={<Users size={20} />} onClick={() => { const r = joinRequest(id); nav.reset('sent', { tr: 'plane', p: { id: r?.id, joined: true } }) }}>Join this report</Button><LinkButton onClick={() => nav.go('slot')}>Mine is a different problem</LinkButton></div>}>
      <Title sub="Joining is faster than a new report. You get the same alerts and the fix comes once for everyone.">Someone on your floor already told us</Title>
      <Drop delay={0.15} from={-3} className="mt-6">
        <div className="relative rounded-[8px] border-2 border-navy bg-paper p-5 shadow-[0_4px_0_#00224E]">
          <span className="absolute -top-3 left-6 h-5 w-16 rotate-[-4deg] rounded-[2px] bg-sun/80" />
          <div className="flex items-start justify-between gap-3">
            <div><div className="font-head text-[22px] font-extrabold leading-tight">{o.itemLabel} {o.issue.toLowerCase()}</div><div className="mt-1 text-[15px] text-mid">{o.spot}</div></div>
            <Tag tone="info">Visit booked</Tag>
          </div>
          <Divider dashed className="my-4" />
          <div className="flex flex-col gap-2 text-[15px]">
            <span className="flex items-center gap-2"><Clock3 size={18} className="text-mid" />{o.day}, {o.time} with {t.name}</span>
            <span className="flex items-center gap-2"><Users size={18} className="text-mid" />{o.joined} students already on it</span>
            {o.note && <span className="flex items-center gap-2"><Pencil size={18} className="text-mid" />"{o.note}"</span>}
          </div>
        </div>
      </Drop>
    </Screen>
  )
}

export function Slot() {
  const { nav } = useApp()
  const s = store.use(x => x)
  const d = s.draft
  const days = nextDays(5)
  const day = d.day || days[0].dow, time = d.time
  const usual = s.hours.some(h => h % 4 === 2) // evenings free
  return (
    <Screen top={<TopBar step={[3, STEPS]} />} footer={<Button disabled={!time} onClick={() => nav.go('review')}>Next</Button>}>
      <Title sub="Pick a 30 minute window. Most visits are in the evening, after classes.">When can they come?</Title>
      <div className="no-scrollbar -mx-6 mt-5 flex gap-2.5 overflow-x-auto px-6 pb-2">
        {days.map(x => {
          const on = day === x.dow
          return (
            <motion.button key={x.key} onClick={() => { fx.select(); store.set({ draft: { ...d, day: x.dow } }) }} whileTap={{ scale: 0.95 }} aria-pressed={on}
              className={cx('flex w-[74px] shrink-0 flex-col items-center rounded-[16px] border-2 px-2 pb-2.5 pt-2 transition-colors', on ? 'border-navy bg-sun shadow-btn' : 'border-line bg-paper hover:border-navy/50')}>
              <span className="text-[13px] font-semibold">{x.dow}</span>
              <span className="font-head text-[26px] font-extrabold leading-tight">{x.date}</span>
              <span className="mt-1 flex gap-0.5" aria-label={`${['quiet', 'normal', 'busy'][x.load - 1]} day`}>{[0, 1, 2].map(k => <span key={k} className={cx('h-1.5 w-3 rounded-full', k < x.load ? 'bg-navy' : 'bg-navy/15')} />)}</span>
            </motion.button>
          )
        })}
      </div>
      <p className="mt-1 text-[13px] text-mid">Bars show how busy the technicians are that day.</p>
      <p className="mb-2 mt-5 text-[14px] font-semibold">Evening, PM</p>
      <div className="grid grid-cols-2 gap-2.5">
        {SLOT_TIMES.map((t, i) => {
          const on = time === t; const pick = usual && i >= 4
          return (
            <motion.button key={t} onClick={() => { fx.select(); store.set({ draft: { ...d, day, time: t } }) }} whileTap={{ scale: 0.96 }} aria-pressed={on}
              className={cx('relative flex h-14 items-center justify-between rounded-[14px] border-2 px-4 transition-colors', on ? 'border-navy bg-sun2 shadow-btn' : 'border-line bg-paper hover:border-navy/50')}>
              <span className="font-mono text-[16px] font-medium">{t.replace(' PM', '')}–{addMin(t, 30).replace(' PM', '')}</span>
              {on ? <Pop><span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-cream"><Check size={14} strokeWidth={3.5} /></span></Pop> : pick ? <span className="rounded-full bg-green2 px-2 py-0.5 text-[12px] font-bold text-green">Free</span> : null}
            </motion.button>
          )
        })}
      </div>
      <Card variant="flat" className="mb-6 mt-5 p-4">
        <Toggle on={d.access === 'warden'} onChange={v => store.set({ draft: { ...d, access: v ? 'warden' : 'in' } })} label="Let the warden open if I'm out" sub={`Your room ${roomCode(s)} is opened and locked again`} />
      </Card>
    </Screen>
  )
}

export function Review() {
  const { nav, online } = useApp()
  const s = store.use(x => x)
  const d = s.draft
  const [busy, setBusy] = useState(false)
  const tech = TECHS.find(t => t.trade === d.trade) || TECHS[0]
  const rows: [string, string, string, () => void][] = [
    ['Problem', `${d.itemLabel} · ${(d.issue || '').toLowerCase()}`, [d.photo ? '1 photo' : 'No photo', d.urgent ? 'Marked dangerous' : ''].filter(Boolean).join(' · '), () => nav.go('issue')],
    ['Place', d.spot || `Room ${roomCode(s)}`, s.bhawan, () => nav.go('place')],
    ['When', `${d.day}, ${d.time} – ${addMin(d.time || '8:30 PM', 30)}`, 'Evening visit', () => nav.go('slot')],
    ['Access', d.access === 'warden' ? 'Warden opens the room' : "I'll be in the room", d.access === 'warden' ? 'If you are out' : 'Be there 5 minutes early', () => nav.go('slot')],
  ]
  const send = () => { setBusy(true); setTimeout(() => { const r = submitDraft(); nav.reset('sent', { tr: 'plane', p: { id: r.id } }) }, 550) }
  return (
    <Screen top={<TopBar title="Check and send" step={[4, STEPS]} right={!online ? <Tag tone="warn" icon={<CloudOff size={14} />}>Offline</Tag> : undefined} />}
      footer={<Button loading={busy} icon={online ? <Send size={20} /> : <CloudOff size={20} />} onClick={send}>{online ? 'Send report' : 'Save, send when online'}</Button>}>
      <Drop className="mt-3" from={-2}>
        <div className="relative rounded-[18px] border-2 border-navy bg-paper shadow-[0_4px_0_#00224E]">
          {rows.map(([k, v, sub, edit], i) => (
            <div key={k} className={cx('relative flex items-start gap-3 px-5 py-4', i > 0 && 'border-t-2 border-dashed border-navy/20')}>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-mid">{k}</div>
                <div className="mt-0.5 font-head text-[19px] font-bold leading-tight">{v}</div>
                {sub && <div className="mt-0.5 text-[14px] text-mid">{sub}</div>}
              </div>
              <Button variant="quiet" size="xs" full={false} icon={<Pencil size={14} />} onClick={edit}>Edit</Button>
            </div>
          ))}
        </div>
      </Drop>
      <Rise delay={0.15} className="mt-5 flex items-start gap-3 pb-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-navy bg-sky font-head font-extrabold"><span className="pt-0.5">{tech.name[0]}</span></span>
        <p className="text-[15px] leading-relaxed text-mid"><b className="text-navy">{tech.name}</b> ({tech.trade.toLowerCase()}, IWD) gets this once your Bhawan supervisor checks it.</p>
      </Rise>
    </Screen>
  )
}

export function Sent() {
  const { nav } = useApp()
  const id = nav.params.id as string; const joined = !!nav.params.joined
  const r = store.use(s => s.reqs).find(x => x.id === id)
  const steps = joined ? [['You are on the report', 'Same alerts as everyone'], [`${r ? TECHS.find(t => t.id === r.techId)?.name : 'The technician'} comes ${r?.day.toLowerCase()} at ${r?.time}`, 'One visit fixes it for all'], ['You get an alert', '10 minutes before']]
    : [['Supervisor checks it', 'Usually within an hour'], ['A technician is booked', 'For the slot you picked'], ['You get an alert', '10 minutes before they arrive']]
  return (
    <Screen bg="bg-sun" footer={<div className="flex flex-col gap-1"><Button variant="secondary" onClick={() => nav.reset('track', { tr: 'push', p: { id } })}>Follow it</Button><LinkButton tone="navy" onClick={() => nav.reset('tabs', { tr: 'up' })}>Back home</LinkButton></div>}>
      <div className="flex flex-col items-center pt-[72px] text-center">
        <Beaver pose="cele" size={150} bob />
        <Words text={joined ? 'You joined it.' : 'Report sent.'} className="mt-3 font-head text-[38px] font-extrabold" delay={0.5} />
        <Pop delay={0.7}><span className="mt-3 inline-flex h-9 items-center rounded-full border-2 border-navy bg-paper px-4 font-mono text-[16px]">#{id}</span></Pop>
      </div>
      <div className="mt-7 flex flex-col gap-2.5">
        {steps.map(([a, b], i) => (
          <Drop key={a} delay={0.8 + i * 0.1} from={i % 2 ? 2 : -2}>
            <div className="flex items-center gap-3 rounded-[16px] border-2 border-navy bg-paper p-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy font-head text-[15px] font-bold text-cream"><span className="pt-0.5">{i + 1}</span></span>
              <div className="text-left"><div className="text-[16px] font-semibold leading-snug">{a}</div><div className="text-[13px] text-mid">{b}</div></div>
            </div>
          </Drop>
        ))}
      </div>
    </Screen>
  )
}
export { Sparkles, DoorOpen, CalendarDays }
