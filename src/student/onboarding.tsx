import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AtSign, BellRing, ChevronDown, Footprints, KeyRound, Mail, MapPin, Search, ShieldCheck, Sparkles, Wrench, Check } from 'lucide-react'
import { Art, Beaver, Button, Card, Chip, LinkButton, Sheet, TextField, OtpInput, cx, Tag } from '../ds/ui'
import { Drop, Rise, Words, Roll, spring, springPop } from '../ds/motion'
import { fx } from '../ds/fx'
import { BHAWANS, IITR_EMAIL, deptOf, nameFromEmail, code6 } from '../data/iitr'
import { Screen, TopBar, Title, useApp } from './shell'
import { store, roomCode } from './store'

export function Welcome() {
  const { nav } = useApp()
  const points = [
    { i: <Sparkles size={20} />, t: 'Tap what broke. No long forms.' },
    { i: <Footprints size={20} />, t: 'See when the technician is close.' },
    { i: <KeyRound size={20} />, t: 'The job closes only with your code.' },
  ]
  return (
    <Screen bg="bg-sun2" pad={false} footer={<Rise delay={0.35}><Button onClick={() => nav.go('signin')} iconRight={<AtSign size={20} />}>Sign in with institute email</Button></Rise>}>
      <div className="relative h-[300px] overflow-hidden">
        <motion.div initial={{ y: -60 }} animate={{ y: -10 }} transition={spring}><Art n="facade" className="mx-auto w-[86%]" alt="Your Bhawan" /></motion.div>
        <Drop delay={0.45} className="absolute right-[6%] top-[150px]"><span className="flex items-center gap-1.5 rounded-[10px] border-2 border-navy bg-paper px-3 py-1.5 text-[14px] font-bold shadow-btn"><span className="h-2.5 w-2.5 rounded-full bg-sun ring-2 ring-navy" />Your room</span></Drop>
      </div>
      <div className="px-6 pt-4">
        <Rise><div className="flex items-center gap-2 font-head text-[22px] font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-[9px] border-2 border-navy bg-sun pt-0.5 text-[18px]">A</span>Align</div></Rise>
        <Words text="Report it once. We handle the rest." className="mt-3 font-head text-[34px] font-extrabold leading-[1.05] tracking-[-0.01em]" delay={0.05} />
        <div className="mt-5 flex flex-col gap-3">
          {points.map((p, i) => (
            <Rise key={p.t} delay={0.2 + i * 0.06} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border-2 border-navy bg-paper">{p.i}</span>
              <span className="text-[16px] font-medium">{p.t}</span>
            </Rise>
          ))}
        </div>
        <Rise delay={0.4}><p className="mt-5 text-[13px] text-mid">For residents of IIT Roorkee Bhawans. Repairs are done by IWD Electrical and Civil.</p></Rise>
      </div>
    </Screen>
  )
}

export function SignIn() {
  const { nav } = useApp()
  const [email, setEmail] = useState(store.get().email)
  const [err, setErr] = useState(''); const [shake, setShake] = useState(0); const [busy, setBusy] = useState(false)
  const submit = () => {
    const e = email.trim().toLowerCase()
    if (!IITR_EMAIL.test(e)) { fx.error(); setShake(s => s + 1); setErr(e.includes('@') ? 'Use your IIT Roorkee email (it ends in iitr.ac.in)' : 'Type your full email, like siddhi_s@ar.iitr.ac.in'); return }
    setBusy(true)
    setTimeout(() => {
      store.set({ email: e, name: nameFromEmail(e), dept: deptOf(e) || 'IIT Roorkee', otp: code6() })
      setBusy(false); nav.go('verify')
    }, 650)
  }
  return (
    <Screen top={<TopBar step={[1, 4]} />} footer={<Button loading={busy} onClick={submit}>Send me a code</Button>}>
      <Title sub="Only residents can report. Your email tells us who you are, so you never fill in your name again.">Sign in with your institute email</Title>
      <Rise delay={0.1}>
        <TextField className="mt-7" label="Institute email" type="email" inputMode="email" autoComplete="email" autoFocus placeholder="name@ar.iitr.ac.in"
          value={email} onChange={e => { setEmail(e.target.value); setErr('') }} onKeyDown={e => e.key === 'Enter' && submit()}
          prefix={<Mail size={20} />} error={err} shakeKey={shake} hint="Any name@xx.iitr.ac.in works in this demo." />
      </Rise>
      <Rise delay={0.18}>
        <Card variant="flat" className="mt-6 flex items-start gap-3 p-4">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-green" />
          <p className="text-[14px] leading-relaxed text-mid">Technicians never see your email or enrolment number. They see your first name and room only.</p>
        </Card>
      </Rise>
    </Screen>
  )
}

export function Verify() {
  const { nav, toast } = useApp()
  const { email } = store.use(s => s)
  const otp = useMemo(() => { const c = store.get().otp || code6(); store.set({ otp: c }); return c }, [])
  const [code, setCode] = useState(''); const [err, setErr] = useState(false); const [shake, setShake] = useState(0); const [tries, setTries] = useState(3)
  const [wait, setWait] = useState(30)
  const deliver = (c = otp) => toast({ kind: 'system', app: 'Mail', icon: '✉', title: 'ALIGN · IIT Roorkee', body: `Your sign-in code is ${c.slice(0, 3)} ${c.slice(3)}. It works for 10 minutes.`, action: { label: 'Fill in the code', run: () => setCode(c) } })
  useEffect(() => { const t = setTimeout(deliver, 900); return () => clearTimeout(t) }, [])
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(w => w - 1), 1000); return () => clearTimeout(t) }, [wait])
  const check = (v: string) => {
    if (v === store.get().otp) { fx.success(); setTimeout(() => nav.go('isyou'), 350) }
    else { fx.error(); setErr(true); setShake(s => s + 1); setTries(t => t - 1); setTimeout(() => { setCode(''); setErr(false) }, 700) }
  }
  return (
    <Screen top={<TopBar step={[2, 4]} />} footer={<Button disabled={code.length < 6} onClick={() => check(code)}>Verify</Button>}>
      <Rise><span className="flex h-14 w-14 items-center justify-center rounded-[16px] border-2 border-navy bg-sky"><Mail size={28} /></span></Rise>
      <Title className="mt-5" sub={<>We sent a 6-digit code to <b className="text-navy">{email}</b>. Open the email, or tap the notification at the top.</>}>Check your email</Title>
      <Rise delay={0.12} className="mt-8"><OtpInput value={code} onChange={v => { setCode(v); setErr(false) }} error={err} shakeKey={shake} onComplete={check} /></Rise>
      <div className="mt-4 h-6 text-center text-[14px]">{err ? <span className="font-semibold text-ember">That code does not match. {tries} tries left.</span> : null}</div>
      <div className="mt-2 flex justify-center">
        {wait > 0 ? <span className="text-[15px] text-mid">Resend code in 0:{String(wait).padStart(2, '0')}</span>
          : <LinkButton onClick={() => { const c = code6(); store.set({ otp: c }); setWait(30); deliver(c) }}>Send a new code</LinkButton>}
      </div>
      <div className="mt-1 flex justify-center"><LinkButton onClick={() => nav.back()}>Wrong email? Change it</LinkButton></div>
    </Screen>
  )
}

export function IsYou() {
  const { nav } = useApp()
  const s = store.use(x => x)
  return (
    <Screen top={<TopBar step={[3, 4]} />} footer={<div className="flex flex-col gap-1"><Button onClick={() => nav.go('where')}>Yes, that's me</Button><LinkButton onClick={() => nav.reset('signin', { tr: 'push' })}>This is not me</LinkButton></div>}>
      <Title sub="We found you in the institute directory.">Is this you?</Title>
      <Drop delay={0.15} from={-4} className="mt-7">
        <div className="overflow-hidden rounded-[20px] border-2 border-navy bg-paper shadow-[0_4px_0_#00224E]">
          <div className="flex items-center justify-between bg-navy px-5 py-2.5 text-cream">
            <span className="text-[13px] font-bold uppercase tracking-[0.1em]">IIT Roorkee · Resident</span><Sparkles size={16} className="text-sun" />
          </div>
          <div className="flex items-center gap-4 p-5">
            <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[18px] border-2 border-navy bg-sun font-head text-[32px] font-extrabold"><span className="pt-1">{s.name[0]}</span></span>
            <div className="min-w-0">
              <div className="truncate font-head text-[24px] font-extrabold leading-tight">{s.name}</div>
              <div className="mt-0.5 truncate text-[14px] text-mid">{s.dept}</div>
              <div className="mt-2 truncate font-mono text-[14px]">{s.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t-2 border-dashed border-navy/20 px-5 py-3 text-[14px] text-mid"><ShieldCheck size={18} className="text-green" />Enrolment number hidden from technicians</div>
        </div>
      </Drop>
    </Screen>
  )
}

export function Where({ editing }: { editing?: boolean }) {
  const { nav, toast } = useApp()
  const s = store.use(x => x)
  const [pick, setPick] = useState(false); const [q, setQ] = useState(''); const [err, setErr] = useState(''); const [shake, setShake] = useState(0)
  const b = BHAWANS.find(x => x.name === s.bhawan) || BHAWANS[0]
  const list = useMemo(() => BHAWANS.filter(x => x.name.toLowerCase().includes(q.toLowerCase())), [q])
  const next = () => {
    if (!/^\d{1,2}$/.test(s.room)) { fx.error(); setShake(k => k + 1); setErr('Room number is 1 or 2 digits, like 04'); return }
    if (editing) { toast({ title: 'Room updated', body: `New visits go to ${roomCode(store.get())}.`, icon: <Check size={20} /> }); nav.back() } else nav.go('hours')
  }
  return (
    <Screen top={<TopBar step={editing ? undefined : [4, 4]} title={editing ? 'Room and Bhawan' : undefined} />} footer={<Button onClick={next}>{editing ? 'Save' : 'Next'}</Button>}>
      {!editing && <Title sub="Technicians use this to find your door.">Where do you live?</Title>}
      <Rise delay={0.08} className="mt-6">
        <span className="mb-1.5 block text-[14px] font-semibold">Bhawan</span>
        <button onClick={() => { fx.tap(); setPick(true) }} className="flex h-14 w-full items-center gap-3 rounded-[14px] border-2 border-line bg-paper px-4 text-left hover:border-navy/50">
          <MapPin size={20} className="text-mid" /><span className="flex-1 text-[16px] font-semibold">{s.bhawan}</span><Tag>{b.kind}</Tag><ChevronDown size={20} />
        </button>
      </Rise>
      <Rise delay={0.12} className="mt-5">
        <span className="mb-2 block text-[14px] font-semibold">Block</span>
        <div className="flex flex-wrap gap-2">{b.blocks.map(x => <Chip key={x} on={s.block === x} onClick={() => store.set({ block: x })}>Block {x}</Chip>)}</div>
      </Rise>
      <Rise delay={0.16} className="mt-5">
        <span className="mb-2 block text-[14px] font-semibold">Floor</span>
        <div className="flex flex-wrap gap-2">{['G', '1', '2', '3'].map(x => <Chip key={x} on={s.floor === x} onClick={() => store.set({ floor: x })}>{x === 'G' ? 'Ground' : `Floor ${x}`}</Chip>)}</div>
      </Rise>
      <Rise delay={0.2} className="mt-5 flex items-end gap-4">
        <TextField label="Room number" inputMode="numeric" maxLength={2} value={s.room} error={err} shakeKey={shake} className="flex-1"
          onChange={e => { setErr(''); store.set({ room: e.target.value.replace(/\D/g, '').slice(0, 2) }) }} />
        <div className="mb-[2px] flex h-14 min-w-[124px] flex-col items-center justify-center rounded-[14px] border-2 border-navy bg-sun2 px-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-mid">Room code</span>
          <span className="font-mono text-[20px] font-medium leading-tight">{s.block}-<Roll value={`${s.floor === 'G' ? '0' : s.floor}${s.room.padStart(2, '0')}`} /></span>
        </div>
      </Rise>
      <Sheet open={pick} onClose={() => setPick(false)} title="Choose your Bhawan">
        <TextField placeholder="Search Bhawans" prefix={<Search size={18} />} value={q} onChange={e => setQ(e.target.value)} />
        {(['Girls', 'Boys', 'Co-ed'] as const).map(kind => {
          const items = list.filter(x => x.kind === kind)
          if (!items.length) return null
          return (
            <div key={kind} className="mt-4">
              <div className="mb-1 text-[13px] font-bold uppercase tracking-[0.08em] text-mid">{kind}</div>
              {items.map(x => (
                <button key={x.name} onClick={() => { fx.select(); store.set({ bhawan: x.name, block: x.blocks[0] }); setPick(false) }}
                  className={cx('flex h-12 w-full items-center justify-between rounded-[12px] px-3 text-left text-[16px]', s.bhawan === x.name ? 'bg-sun2 font-bold' : 'hover:bg-navy/5')}>
                  {x.name}{s.bhawan === x.name && <Check size={20} />}
                </button>
              ))}
            </div>
          )
        })}
      </Sheet>
    </Screen>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const PARTS = [['Morning', '8–12'], ['Afternoon', '12–5'], ['Evening', '5–9'], ['Night', '9–11']]
export function Hours({ editing }: { editing?: boolean }) {
  const { nav, toast } = useApp()
  const hours = store.use(s => s.hours)
  const set = (h: number[]) => store.set({ hours: h })
  const toggle = (i: number) => { const on = hours.includes(i); on ? fx.deselect() : fx.select(); set(on ? hours.filter(x => x !== i) : [...hours, i]) }
  const presets: [string, number[]][] = [['Evenings', DAYS.map((_, d) => d * 4 + 2)], ['Weekends', [20, 21, 22, 23, 24, 25, 26, 27]], ['Clear', []]]
  return (
    <Screen top={<TopBar title={editing ? 'Usual free hours' : undefined} />} footer={<Button onClick={() => { if (editing) { toast({ title: 'Free hours saved', body: 'New visits will be planned around them.', icon: <Check size={20} /> }); nav.back() } else nav.go('permission') }}>{editing ? 'Save' : 'Save and continue'}</Button>}>
      {!editing && <Title sub="When are you usually in your room? We plan visits around this. Technicians never see it.">Your usual free hours</Title>}
      {editing && <p className="mt-1 text-[15px] text-mid">Exams or a trip coming up? Change this any time and booked visits adjust.</p>}
      <div className="mt-5 flex flex-wrap gap-2">{presets.map(([l, h]) => <Chip key={l} size="sm" on={false} onClick={() => set(h)}>{l}</Chip>)}</div>
      <div className="mt-5 grid grid-cols-[48px_repeat(4,1fr)] items-center gap-2">
        <span />
        {PARTS.map(([p, t]) => <span key={p} className="text-center leading-tight"><span className="block text-[13px] font-semibold">{p}</span><span className="text-[12px] text-mid">{t}</span></span>)}
        {DAYS.map((d, r) => (
          <div key={d} className="contents">
            <span className="font-head text-[16px] font-bold">{d}</span>
            {PARTS.map((_, k) => {
              const i = r * 4 + k, on = hours.includes(i)
              return (
                <motion.button key={k} aria-pressed={on} aria-label={`${d} ${PARTS[k][0]}`} onClick={() => toggle(i)} whileTap={{ scale: 0.9 }} transition={springPop}
                  className={cx('flex h-11 items-center justify-center rounded-[12px] border-2 transition-colors', on ? 'border-navy bg-sun' : 'border-line bg-paper hover:border-navy/40')}>
                  {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springPop}><Check size={18} strokeWidth={3} /></motion.span>}
                </motion.button>
              )
            })}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[14px] text-mid">{hours.length} slots a week selected.</p>
    </Screen>
  )
}

export function Permission() {
  const { nav } = useApp()
  const finish = (on: boolean) => {
    store.set({ alertsOn: on, signedIn: true, onboarded: true })
    if (on) { try { Notification.requestPermission?.() } catch { /* unsupported */ } }
    fx.success(); nav.reset('tabs', { tr: 'up' })
  }
  const items = [
    { i: <ShieldCheck size={20} />, t: 'Your report was checked', s: 'Within a few hours' },
    { i: <Footprints size={20} />, t: 'The technician is 10 minutes away', s: 'So you can be in the room' },
    { i: <Wrench size={20} />, t: 'The fix is done, please confirm', s: 'With your closing code' },
  ]
  return (
    <Screen footer={<div className="flex flex-col gap-1"><Button icon={<BellRing size={20} />} onClick={() => finish(true)}>Allow alerts</Button><LinkButton onClick={() => finish(false)}>Not now</LinkButton></div>} top={<div className="h-[60px]" />}>
      <div className="flex justify-center"><Beaver pose="wave" size={150} bob /></div>
      <Words text="Know when someone is on the way" className="mt-4 text-center font-head text-h1 font-extrabold" />
      <Rise delay={0.15}><p className="mt-2 text-center text-[16px] text-mid">Three kinds of alert. Nothing else, ever.</p></Rise>
      <div className="mt-6 flex flex-col gap-2.5">
        {items.map((x, i) => (
          <Drop key={x.t} delay={0.25 + i * 0.1} from={i % 2 ? 3 : -3}>
            <div className="flex items-center gap-3 rounded-[16px] border-2 border-navy bg-paper p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-sun2">{x.i}</span>
              <div><div className="text-[16px] font-semibold leading-snug">{x.t}</div><div className="text-[13px] text-mid">{x.s}</div></div>
            </div>
          </Drop>
        ))}
      </div>
    </Screen>
  )
}
