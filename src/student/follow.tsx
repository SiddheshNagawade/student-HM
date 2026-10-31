import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Phone, Clock3, DoorOpen, PackageSearch, RotateCcw, Star as StarIcon, MessageSquareWarning, Camera, Wrench, UserX, Check, Truck, ShieldCheck, LifeBuoy } from '../ds/icons'
import { Art, Avatar, Beaver, Button, Card, Chip, Choice, LinkButton, Sheet, Stars, Tag, TextArea, Timeline, TimelineItem, Toggle, cx, Divider, EmptyState } from '../ds/ui'
import { Drop, Rise, Words, Roll, Pop, Stamp, Shake, ArtIn, spring, springPop } from '../ds/motion'
import { fx } from '../ds/fx'
import { ago, clock, dayTime, nextDays, SLOT_TIMES, addMin } from '../data/iitr'
import { Screen, TopBar, Title, useApp } from './shell'
import { store, roomCode, techOf, update, pushAlert, STATUS_LABEL, Req, Status } from './store'
import { TRADE_ICON } from './tabs'

const useReq = () => { const { nav } = useApp(); const id = nav.params.id as string; return store.use(s => s.reqs).find(r => r.id === id) }

const FUTURE: Record<Status, string[]> = {
  reported: ['Checked by the supervisor', 'Visit booked', 'Technician on the way', 'Fixed, closed with your code'],
  verified: ['Visit booked', 'Technician on the way', 'Fixed, closed with your code'],
  scheduled: ['Technician on the way', 'Fixed, closed with your code'], waiting_part: ['Part arrives, visit booked', 'Fixed, closed with your code'],
  missed: ['New visit', 'Fixed, closed with your code'], on_way: ['Fixed, closed with your code'], visiting: ['Fixed, closed with your code'], disputed: ['Supervisor decides', 'Fixed for good'], closed: [],
}
const NOW_TEXT: Record<Status, (r: Req) => string> = {
  reported: () => 'Waiting for the Bhawan supervisor to check it', verified: r => `Finding a slot with ${techOf(r).name}`,
  scheduled: r => `${techOf(r).name} comes ${r.day.toLowerCase()} at ${r.time}`, on_way: r => `${techOf(r).name.split(' ')[0]} is on the way`,
  visiting: r => `${techOf(r).name.split(' ')[0]} is at your door`, waiting_part: r => `Waiting for ${r.part || 'a part'}`, missed: () => 'The visit was missed. Pick a new time.',
  disputed: () => 'You reopened it. The supervisor is reviewing.', closed: () => 'Fixed',
}

export function Track() {
  const { nav } = useApp()
  const r = useReq()
  const [help, setHelp] = useState(false)
  if (!r) return <NotFound />
  const t = techOf(r)
  const items: TimelineItem[] = [
    ...r.history.map(h => ({ title: h.text, sub: dayTime(h.at), state: 'done' as const })),
    ...(r.status !== 'closed' ? [{ title: NOW_TEXT[r.status](r), sub: 'Now', state: 'now' as const }] : []),
    ...FUTURE[r.status].slice(r.status === 'reported' || r.status === 'verified' ? 1 : 0).map(f => ({ title: f, state: 'todo' as const })),
  ]
  const action = {
    on_way: <Button onClick={() => nav.go('nearby', { p: { id: r.id } })}>See where {t.name.split(' ')[0]} is</Button>,
    visiting: <Button onClick={() => nav.go('code', { p: { id: r.id } })}>Show my closing code</Button>,
    missed: <Button onClick={() => nav.go('missed', { p: { id: r.id } })}>Pick a new time</Button>,
    waiting_part: <Button variant="secondary" onClick={() => nav.go('part', { p: { id: r.id } })}>About the part</Button>,
    closed: r.rating ? <Button variant="secondary" icon={<RotateCcw size={20} />} onClick={() => nav.go('reopen', { p: { id: r.id } })}>It broke again</Button> : <Button icon={<StarIcon size={20} />} onClick={() => nav.go('rate', { p: { id: r.id } })}>Rate the visit</Button>,
  }[r.status as string]
  return (
    <Screen top={<TopBar title={`${r.itemLabel} · ${r.issue.toLowerCase()}`} sub={`#${r.id} · ${r.spot}`} />} footer={action}>
      <Rise className="mt-2">
        <div className={cx('rounded-[20px] border-2 border-navy p-4', r.status === 'closed' ? 'bg-green2' : r.status === 'missed' || r.status === 'disputed' ? 'bg-ember2' : 'bg-sun2')}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] border-2 border-navy bg-paper">{TRADE_ICON[r.trade]}</span>
            <div className="min-w-0 flex-1"><div className="text-[13px] font-bold uppercase tracking-[0.08em] text-mid">{STATUS_LABEL[r.status]}</div><div className="font-head text-[19px] font-bold leading-tight">{NOW_TEXT[r.status](r)}</div></div>
          </div>
          {['scheduled', 'on_way', 'visiting', 'missed'].includes(r.status) && (
            <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-paper p-3">
              <Avatar name={t.name} size={40} tone="sky" />
              <div className="min-w-0 flex-1"><div className="font-semibold">{t.name}</div><div className="text-[13px] text-mid">{t.trade} · IWD · ★ {t.rating}</div></div>
              <Tag tone="neutral" icon={<Clock3 size={14} />}>{r.day} {r.time}</Tag>
            </div>
          )}
        </div>
      </Rise>
      <Timeline className="mt-6" items={items} />
      {r.joined > 0 && <p className="mt-5 text-[14px] text-mid">{r.joined} other students follow this report.</p>}
      <div className="mt-4 flex justify-center pb-2"><LinkButton onClick={() => setHelp(true)}>Need help sooner?</LinkButton></div>
      <Sheet open={help} onClose={() => setHelp(false)} title="Need help sooner?">
        <div className="flex flex-col gap-3">
          <Card variant="flat" className="flex items-start gap-3 p-4"><Phone size={22} className="mt-0.5" /><div><div className="font-semibold">Call the Bhawan office</div><div className="text-[14px] text-mid">The supervisor can move your visit up if it is urgent.</div></div></Card>
          <Card variant="flat" className="flex items-start gap-3 p-4"><LifeBuoy size={22} className="mt-0.5" /><div><div className="font-semibold">Water or sparks?</div><div className="text-[14px] text-mid">Switch off the MCB or main valve and tell the warden in person.</div></div></Card>
          <Button variant="secondary" size="md" onClick={() => setHelp(false)}>Got it</Button>
        </div>
      </Sheet>
    </Screen>
  )
}

export function Nearby() {
  const { nav, toast } = useApp()
  const r = useReq(); const eta = store.use(s => s.eta)
  if (!r) return <NotFound />
  const t = techOf(r)
  const p = Math.min(1, Math.max(0, 1 - eta / 10))
  return (
    <Screen bg="bg-sun" top={<TopBar />} footer={<div className="flex flex-col gap-1"><Button variant="secondary" icon={<Check size={20} />} onClick={() => { toast({ title: `${t.name.split(' ')[0]} knows you're in`, body: 'Keep your phone close for the code.', icon: <Check size={20} /> }); nav.back() }}>I'm in the room</Button><LinkButton tone="navy" onClick={() => nav.go('missed', { p: { id: r.id, early: true } })}>I can't make it</LinkButton></div>}>
      <div className="flex items-end gap-2">
        <span className="font-head text-[132px] font-extrabold leading-[0.8] tracking-[-0.03em]"><Roll value={eta} /></span>
        <span className="mb-3 font-head text-[28px] font-extrabold">min</span>
      </div>
      <Words text={`${t.name.split(' ')[0]} is close.`} className="mt-4 font-head text-h1 font-extrabold" />
      <p className="mt-1 font-mono text-[14px]">{r.itemLabel.toLowerCase()} · {roomCode(store.get())} · {r.time}</p>
      <div className="relative mt-6 h-[150px]">
        <Art n="ground" className="absolute bottom-0 left-0 w-full" />
        <motion.div className="absolute bottom-[14px]" animate={{ left: `${4 + p * 58}%` }} transition={{ type: 'spring', stiffness: 60, damping: 18 }}>
          <motion.div animate={{ y: [0, -4, 0], rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.6 }}><Beaver pose="walk" size={92} /></motion.div>
        </motion.div>
        <span className="absolute bottom-[96px] right-[8%] rounded-[6px] border-2 border-navy bg-paper px-1.5 font-mono text-[12px]">{roomCode(store.get())}</span>
      </div>
      <Card variant="outline" className="mt-5 flex items-center gap-3 p-4">
        <Avatar name={t.name} size={48} tone="sky" />
        <div className="min-w-0 flex-1"><div className="font-head text-[18px] font-bold">{t.name}</div><div className="text-[14px] text-mid">{t.trade} · ★ {t.rating} · {t.years} years at IITR</div></div>
      </Card>
      <p className="mt-4 pb-2 text-[15px]"><b>Will someone be there?</b> You chose "{r.access === 'warden' ? 'warden opens' : "I'll be in the room"}".</p>
    </Screen>
  )
}

export function Code() {
  const { nav } = useApp()
  const r = useReq()
  useEffect(() => { const ts = [0, 1, 2, 3].map(i => setTimeout(() => fx.key(i + 3), 450 + i * 90)); return () => ts.forEach(clearTimeout) }, [])
  if (!r) return <NotFound />
  const t = techOf(r)
  return (
    <Screen bg="bg-sun" top={<TopBar />} footer={<Button variant="secondary" onClick={() => nav.go('reopen', { p: { id: r.id } })}>It is not fixed yet</Button>}>
      <div className="flex flex-col items-center text-center">
        <Beaver pose="think" size={110} />
        <Words text={`Is the ${r.itemLabel.toLowerCase()} working?`} className="mt-2 font-head text-[28px] font-extrabold leading-tight" />
        <p className="mt-1 text-[15px]">{t.name.split(' ')[0]} says it is fixed. Check it first.</p>
      </div>
      <Drop delay={0.25} className="mt-6">
        <div className="relative rounded-[20px] border-2 border-navy bg-paper p-6 shadow-[0_4px_0_#00224E]">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-mid">Closing code · #{r.id}</div>
          <div className="mt-4 flex justify-between gap-2">
            {r.code.split('').map((c, i) => (
              <motion.span key={i}
                className="flex h-[78px] flex-1 items-center justify-center rounded-[14px] bg-navy font-mono text-[44px] font-medium text-cream">{c}</motion.span>
            ))}
          </div>
          <Divider dashed className="my-5" />
          <p className="text-[15px] leading-relaxed">Read these 4 digits to {t.name.split(' ')[0]} <b>only when you are happy</b>. The job closes with them.</p>
          <div className="mt-3 flex items-center gap-2 text-[14px] text-mid"><motion.span className="flex gap-1">{[0, 1, 2].map(i => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-mid" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />)}</motion.span>Waiting for {t.name.split(' ')[0]} to enter it</div>
        </div>
      </Drop>
    </Screen>
  )
}

export function Wrong() {
  const { nav } = useApp()
  const r = useReq(); const [k] = useState(1)
  if (!r) return <NotFound />
  return (
    <Screen bg="bg-sun" top={<TopBar />} footer={<Button variant="secondary" onClick={() => nav.replace('code', { tr: 'swap', p: { id: r.id } })}>Show my code again</Button>}>
      <Shake k={k} className="mt-10">
        <div className="rounded-[20px] border-2 border-navy bg-paper p-6 shadow-[0_4px_0_#00224E]">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-mid">{techOf(r).name.split(' ')[0]} typed</div>
          <div className="mt-3 flex justify-between gap-2">{(r.code.slice(0, 3) + '?').split('').map((c, i) => <span key={i} className={cx('flex h-[70px] flex-1 items-center justify-center rounded-[14px] font-mono text-[40px]', i === 3 ? 'bg-ember2 text-ember' : 'bg-sand')}>{i === 3 ? String((Number(r.code[3]) + 3) % 10) : c}</span>)}</div>
        </div>
      </Shake>
      <Words text="That code didn't match." className="mt-10 text-center font-head text-h1 font-extrabold" />
      <p className="mt-2 text-center text-[16px]">Two tries left. Read the 4 digits out again, slowly.</p>
    </Screen>
  )
}

export function Part() {
  const r = useReq()
  if (!r) return <NotFound />
  return (
    <Screen top={<TopBar title="Waiting for a part" sub={`#${r.id} · ${r.spot}`} />}>
      <ArtIn className="-mx-6 mt-2"><Art n="route" className="w-full" /></ArtIn>
      <Title sub="We will book your visit the moment it reaches the IWD store. You do not need to do anything.">The part is on its way</Title>
      <Card variant="outline" className="mt-5 flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-sun2"><PackageSearch size={22} /></span>
        <div><div className="font-head text-[18px] font-bold">{r.part || 'Replacement part'}</div><div className="text-[14px] text-mid">Usually 2 to 3 days · ordered by the supervisor</div></div>
      </Card>
      <Card variant="flat" className="mb-4 mt-4 flex items-start gap-3 p-4"><Truck size={20} className="mt-0.5" /><p className="text-[14px] text-mid">Special parts like capacitors, chokes and tap spindles come from the central store. Common ones are carried in the technician's bag.</p></Card>
    </Screen>
  )
}

export function Missed() {
  const { nav, toast } = useApp()
  const r = useReq()
  const days = nextDays(3)
  const opts = [[days[0].dow, '8:30 PM'], [days[1].dow, '6:00 PM'], [days[1].dow, '8:00 PM'], [days[2].dow, '7:00 PM']]
  const [pick, setPick] = useState(0); const [warden, setWarden] = useState(true)
  const early = !!nav.params.early
  if (!r) return <NotFound />
  const t = techOf(r)
  const book = () => {
    const [d, tm] = opts[pick]
    update(r.id, { status: 'scheduled', day: d, time: tm, access: warden ? 'warden' : 'in', missed: early ? r.missed : r.missed + 1 }, { s: 'scheduled', text: `New visit booked: ${d}, ${tm}` })
    toast({ title: 'New visit booked', body: `${t.name} comes ${d.toLowerCase()} at ${tm}.`, icon: <Check size={20} /> })
    nav.reset('track', { tr: 'push', p: { id: r.id } })
  }
  return (
    <Screen top={<TopBar title={early ? 'Move the visit' : 'Missed visit'} />} footer={<Button onClick={book}>Book this time</Button>}>
      {!early && (
        <div className="relative mt-2 flex h-[170px] items-start">
          <Art n="door" w={120} />
          <Drop delay={0.2} from={-6} className="absolute right-0 top-3 w-[200px]">
            <div className="relative rounded-[4px] border-2 border-navy bg-sun p-4 shadow-card"><span className="absolute -top-2.5 left-1/2 h-4 w-14 -translate-x-1/2 bg-paper/80" /><p className="text-[15px] font-semibold leading-snug">{t.name.split(' ')[0]} came at 8:40 PM. The door was locked.</p></div>
          </Drop>
          <div className="absolute bottom-1 right-2 flex items-center gap-2 text-[14px] font-semibold">
            {[0, 1].map(i => <span key={i} className={cx('h-4 w-4 rounded-full border-2 border-navy', i <= r.missed ? 'bg-ember' : 'bg-paper')} />)}{Math.min(2, r.missed + 1)} of 2 missed
          </div>
        </div>
      )}
      <Title className={early ? 'mt-2' : 'mt-4'} sub={early ? 'No problem. Pick a time that works.' : 'After two missed visits we fix a slot and the warden opens the room.'}>Pick a new time</Title>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {opts.map(([d, tm], i) => (
          <motion.button key={i} onClick={() => { fx.select(); setPick(i) }} whileTap={{ scale: 0.96 }} aria-pressed={pick === i}
            className={cx('flex h-[68px] flex-col items-start justify-center rounded-[16px] border-2 px-4', pick === i ? 'border-navy bg-sun2 shadow-btn' : 'border-line bg-paper')}>
            <span className="font-head text-[17px] font-bold">{d}</span><span className="font-mono text-[14px] text-mid">{tm.replace(' PM', '')}–{addMin(tm, 30)}</span>
          </motion.button>
        ))}
      </div>
      <Card variant="flat" className="mb-4 mt-5 p-4"><Toggle on={warden} onChange={setWarden} label="Let the warden open if I'm out" sub="Recommended after a missed visit" /></Card>
    </Screen>
  )
}

const TAGS = ['On time', 'Polite', 'Cleaned up', 'Explained the fix', 'Quick']
export function Rate() {
  const { nav } = useApp()
  const r = useReq()
  const [stars, setStars] = useState(0); const [tags, setTags] = useState<string[]>([]); const [note, setNote] = useState('')
  if (!r) return <NotFound />
  const t = techOf(r)
  const words = ['', 'Not good', 'Could be better', 'Okay', 'Good', 'Excellent']
  return (
    <Screen bg="bg-sun" top={<TopBar />} footer={<div className="flex flex-col gap-1"><Button variant="secondary" disabled={!stars} onClick={() => { update(r.id, { rating: stars, tags, review: note }); fx.success(); nav.replace('closed', { tr: 'swap', p: { id: r.id } }) }}>Submit</Button><LinkButton tone="navy" onClick={() => nav.replace('closed', { tr: 'swap', p: { id: r.id } })}>Skip for now</LinkButton></div>}>
      <div className="flex flex-col items-center text-center">
        <Beaver pose="thumbs" size={120} />
        <Words text="How did it go?" className="mt-2 font-head text-[34px] font-extrabold" />
        <p className="mt-1 text-[15px]">{t.name} · {r.itemLabel.toLowerCase()} · {roomCode(store.get())}</p>
        <div className="mt-5"><Stars value={stars} onChange={setStars} size={44} /></div>
        <div className="mt-2 h-6 font-head text-[18px] font-bold">{words[stars]}</div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">{TAGS.map(x => <Chip key={x} on={tags.includes(x)} onClick={() => setTags(tags.includes(x) ? tags.filter(y => y !== x) : [...tags, x])}>{x}</Chip>)}</div>
      <TextArea className="mb-4 mt-5" label="Say more (optional)" placeholder={`Anything ${t.name.split(' ')[0]} or the supervisor should know?`} value={note} onChange={e => setNote(e.target.value)} />
    </Screen>
  )
}

export function Closed() {
  const { nav } = useApp()
  const r = useReq()
  if (!r) return <NotFound />
  const t = techOf(r); const at = r.history[r.history.length - 1].at
  return (
    <Screen top={<TopBar title="Fixed" onBack={() => nav.reset('tabs', { tr: 'push' })} />} footer={<div className="flex flex-col gap-1">{!r.rating && <Button onClick={() => nav.go('rate', { p: { id: r.id } })} icon={<StarIcon size={20} />}>Rate {t.name.split(' ')[0]}</Button>}<Button variant={r.rating ? 'primary' : 'secondary'} onClick={() => nav.reset('tabs', { tr: 'up' })}>Done</Button><LinkButton onClick={() => nav.go('reopen', { p: { id: r.id } })}>It broke again · reopen</LinkButton></div>}>
      <Drop className="mt-3">
        <div className="relative overflow-hidden rounded-[20px] border-2 border-navy bg-paper p-6 shadow-[0_4px_0_#00224E]">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-mid">Receipt · #{r.id}</div>
          <div className="mt-2 pr-24 font-head text-[26px] font-extrabold leading-tight">{r.itemLabel}</div>
          <div className="text-[15px] text-mid">{r.spot} · {dayTime(at)}</div>
          <Divider dashed className="my-4" />
          <div className="flex items-center gap-3"><Avatar name={t.name} size={40} tone="sky" /><div><div className="font-semibold">Fixed by {t.name}</div><div className="text-[13px] text-mid">{t.trade} · IWD</div></div></div>
          <p className="mt-4 max-w-[220px] text-[15px] leading-relaxed">{r.fixNote || `Fixed the ${r.itemLabel.toLowerCase()} and tested it with you.`}</p>
          {r.rating ? <div className="mt-4"><Stars value={r.rating} size={26} /></div> : null}
          {r.review && <p className="mt-2 text-[14px] italic text-mid">"{r.review}"</p>}
          <Stamp delay={0.45} onLand={fx.stamp} className="absolute right-4 top-4">
            <div className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full border-[3px] border-green text-green" style={{ boxShadow: 'inset 0 0 0 3px #FFFFFF, inset 0 0 0 5px #1B7F52' }}>
              <Check size={30} strokeWidth={3.5} /><span className="font-head text-[15px] font-extrabold tracking-[0.12em]">FIXED</span>
            </div>
          </Stamp>
        </div>
      </Drop>
      <p className="mt-4 text-center text-[14px] text-mid">Closed with your code. The supervisor has it on record.</p>
    </Screen>
  )
}

export function Reopen() {
  const { nav, toast } = useApp()
  const r = useReq()
  const [sel, setSel] = useState<string>(''); const [note, setNote] = useState(''); const [photo, setPhoto] = useState(false)
  if (!r) return <NotFound />
  const opts = [['still', 'Still not working', <Wrench size={22} key="a" />], ['bad', 'Fixed badly', <MessageSquareWarning size={22} key="b" />], ['none', 'Nobody came', <UserX size={22} key="c" />]] as const
  const send = () => {
    update(r.id, { status: 'disputed' }, { s: 'disputed', text: `You reopened it: ${opts.find(o => o[0] === sel)?.[1].toLowerCase()}` })
    pushAlert({ title: 'Sent to the supervisor', body: 'They will look at it today and call you if needed.', kind: 'info', reqId: r.id })
    toast({ title: 'Sent to the supervisor', body: 'Not to the technician. You will hear back today.', icon: <ShieldCheck size={20} /> })
    nav.reset('track', { tr: 'push', p: { id: r.id } })
  }
  return (
    <Screen top={<TopBar title="What's wrong?" sub={`${r.itemLabel} · #${r.id}`} />} footer={<Button disabled={!sel} onClick={send}>Send to supervisor</Button>}>
      <div className="mt-2 flex flex-col gap-2.5">
        {opts.map(([k, l, i]) => <Choice key={k} layout="row" on={sel === k} title={l} icon={i} onClick={() => setSel(k)} />)}
      </div>
      <TextArea className="mt-5" label="Tell the supervisor what you saw" placeholder="For example: the fan stopped again after an hour" value={note} onChange={e => setNote(e.target.value)} />
      <div className="mt-4 flex items-center gap-3">
        {photo ? <Pop><div className="rounded-[6px] border-2 border-navy bg-paper p-1.5"><Art n="photo-fan" w={72} /></div></Pop>
          : <Button variant="secondary" size="md" full={false} icon={<Camera size={20} />} sound="shutter" onClick={() => setPhoto(true)}>Add a photo</Button>}
        <span className="text-[14px] text-mid">Goes to the supervisor, not the technician.</span>
      </div>
    </Screen>
  )
}

function NotFound() {
  const { nav } = useApp()
  return <Screen top={<TopBar />}><EmptyState className="mt-20" pose="think" title="We can't find that" body="That request may be closed or merged with another one."><Button size="md" full={false} onClick={() => nav.reset('tabs', { tr: 'push' })}>Back home</Button></EmptyState></Screen>
}

export function ErrorScreen({ kind }: { kind: 'offline' | 'server' | 'session' | 'notfound' }) {
  const { nav } = useApp()
  const E = {
    offline: { pose: 'sit' as const, t: 'No internet', b: 'Reports you make now are kept on this phone and sent the moment you are back online.', p: 'Try again', run: () => nav.back() },
    server: { pose: 'think' as const, t: 'That was on us', b: 'Something broke on our side. Nothing you reported is lost.', p: 'Try again', run: () => nav.back() },
    session: { pose: 'point' as const, t: 'Please sign in again', b: 'For your safety we sign you out after 30 days. Your reports are still here.', p: 'Sign in', run: () => nav.reset('signin', { tr: 'push' }) },
    notfound: { pose: 'think' as const, t: "We can't find that", b: 'That request may be closed, or merged with another one.', p: 'Back home', run: () => nav.reset('tabs', { tr: 'push' }) },
  }[kind]
  return (
    <Screen top={<TopBar />} footer={<div className="flex flex-col gap-1"><Button onClick={E.run}>{E.p}</Button>{kind === 'server' && <LinkButton onClick={() => nav.back()}>Contact the Bhawan office</LinkButton>}</div>}>
      <EmptyState className="mt-16" pose={E.pose} title={E.t} body={E.b} />
    </Screen>
  )
}
export { DoorOpen, ago, clock, SLOT_TIMES, AnimatePresence, spring }
