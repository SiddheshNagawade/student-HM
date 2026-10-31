import { useEffect, useMemo, useRef, useState } from 'react'
import { Footprints, ShieldCheck, CalendarCheck2, PackageCheck, DoorClosed, KeyRound, Check } from 'lucide-react'
import { useNav, Stage } from '../ds/nav'
import { PhoneStage, ScreenGroup } from '../ds/stage'
import { ToastHost, ToastOutlet, useToast } from '../ds/ui'
import { fx } from '../ds/fx'
import { TECHS } from '../data/iitr'
import { Ctx, DemoAction, Screen, Tab } from './shell'
import * as O from './onboarding'
import * as R from './report'
import * as F from './follow'
import { Tabs } from './tabs'
import { store, update, pushAlert, isActive, techOf, Req } from './store'

const GROUPS: ScreenGroup[] = [
  { title: 'Getting in', items: [{ id: 'welcome', label: 'Welcome' }, { id: 'signin', label: 'Sign in' }, { id: 'verify', label: 'Email code' }, { id: 'isyou', label: 'Is this you?' }, { id: 'where', label: 'Where you live' }, { id: 'hours', label: 'Free hours' }, { id: 'permission', label: 'Allow alerts' }] },
  { title: 'Everyday', items: [{ id: 'tabs:home', label: 'Home' }, { id: 'tabs:requests', label: 'Requests' }, { id: 'tabs:inbox', label: 'Alerts' }, { id: 'tabs:me', label: 'Profile' }] },
  { title: 'Report a problem', items: [{ id: 'what', label: 'What broke?' }, { id: 'issue', label: 'What is it doing?' }, { id: 'safety', label: 'Safety check' }, { id: 'place', label: 'Where is it?' }, { id: 'dupe', label: 'Already reported' }, { id: 'slot', label: 'Pick a time' }, { id: 'review', label: 'Check and send' }, { id: 'sent', label: 'Sent' }] },
  { title: 'Until it is fixed', items: [{ id: 'track', label: 'Follow a request' }, { id: 'nearby', label: 'Technician nearby' }, { id: 'code', label: 'Closing code' }, { id: 'wrong', label: 'Wrong code' }, { id: 'part', label: 'Waiting on a part' }, { id: 'missed', label: 'Missed visit' }, { id: 'rate', label: 'Rate the visit' }, { id: 'closed', label: 'Fixed receipt' }, { id: 'reopen', label: 'Reopen' }] },
  { title: 'When things go wrong', items: [{ id: 'eOffline', label: 'No internet' }, { id: 'eServer', label: 'Server error' }, { id: 'eSession', label: 'Session expired' }, { id: 'eNotFound', label: 'Not found' }] },
]

function Inner() {
  const s0 = store.get()
  const nav = useNav<Screen>((new URLSearchParams(location.search).get('s') as Screen) || (s0.onboarded ? 'tabs' : 'welcome'))
  const toast = useToast()
  const [tab, setTab] = useState<Tab>((new URLSearchParams(location.search).get('t') as Tab) || 'home')
  const [online, setOnline] = useState(navigator.onLine)
  const [extraDemo, setDemo] = useState<DemoAction[]>([])
  const reqs = store.use(s => s.reqs)
  useEffect(() => { const u = () => setOnline(true), d = () => setOnline(false); addEventListener('online', u); addEventListener('offline', d); return () => { removeEventListener('online', u); removeEventListener('offline', d) } }, [])

  /* ---------- simulation: what the supervisor and technician would do ---------- */
  const open = (scr: Screen, id: string) => () => nav.go(scr, { p: { id } })
  const verify = (r: Req) => {
    update(r.id, { status: 'verified' }, { s: 'verified', text: 'Checked by the Bhawan supervisor' })
    pushAlert({ title: 'Your report was checked', body: `${r.itemLabel} goes to ${techOf(r).name} next.`, kind: 'check', reqId: r.id })
    toast({ kind: 'system', title: 'Report checked', body: `The supervisor approved #${r.id}. Booking ${techOf(r).name.split(' ')[0]} now.`, onTap: open('track', r.id) })
  }
  const schedule = (r: Req) => {
    update(r.id, { status: 'scheduled' }, { s: 'scheduled', text: `${techOf(r).name} booked for ${r.day}, ${r.time}` })
    pushAlert({ title: 'Visit booked', body: `${techOf(r).name} comes ${r.day.toLowerCase()} at ${r.time}.`, kind: 'check', reqId: r.id })
    toast({ kind: 'system', title: 'Visit booked', body: `${techOf(r).name} · ${r.day}, ${r.time}. We'll alert you 10 minutes before.`, onTap: open('track', r.id) })
  }
  const headOut = (r: Req) => {
    store.set({ eta: 10 })
    update(r.id, { status: 'on_way' }, { s: 'on_way', text: `${techOf(r).name} left the IWD workshop` })
    pushAlert({ title: `${techOf(r).name.split(' ')[0]} is 10 minutes away`, body: `${r.itemLabel} · be in your room or let the warden open it.`, kind: 'near', reqId: r.id })
    toast({ kind: 'system', title: `${techOf(r).name.split(' ')[0]} is 10 minutes away`, body: 'Tap to see where he is.', onTap: open('nearby', r.id) })
  }
  const arrive = (r: Req) => {
    store.set({ eta: 0 })
    update(r.id, { status: 'visiting' }, { s: 'visiting', text: `${techOf(r).name} reached your room` })
    toast({ kind: 'system', title: `${techOf(r).name.split(' ')[0]} is at your door`, body: 'When it works, show him your closing code.', onTap: open('code', r.id) })
    if (nav.screen === 'nearby') nav.replace('code', { tr: 'up', p: { id: r.id } })
  }
  const close = (r: Req) => {
    update(r.id, { status: 'closed', fixNote: r.trade === 'Electrical' ? 'Replaced the capacitor and tested all five speeds.' : r.trade === 'Plumbing' ? 'Changed the washer and spindle. No more drip.' : 'Tightened and re-fixed it. Checked twice.' }, { s: 'closed', text: 'Closed with your code' })
    pushAlert({ title: `${r.itemLabel} fixed`, body: `${techOf(r).name} closed the job with your code.`, kind: 'done', reqId: r.id })
    fx.success()
    nav.reset('closed', { tr: 'up', p: { id: r.id } })
  }
  const wrong = (r: Req) => { fx.error(); toast({ kind: 'system', title: 'Code did not match', body: `${techOf(r).name.split(' ')[0]} typed a wrong code. 2 tries left.`, onTap: open('wrong', r.id) }); nav.go('wrong', { tr: 'swap', p: { id: r.id } }) }
  const needPart = (r: Req) => {
    const part = r.trade === 'Electrical' ? 'Fan capacitor (2.5 µF)' : r.trade === 'Plumbing' ? 'Tap spindle (15 mm)' : 'Almirah hinge'
    update(r.id, { status: 'waiting_part', part }, { s: 'waiting_part', text: `${techOf(r).name} needs a ${part.toLowerCase()}` })
    pushAlert({ title: 'Waiting on a part', body: `${part} ordered from the IWD store.`, kind: 'part', reqId: r.id })
    toast({ kind: 'system', title: 'Waiting on a part', body: `${part}. We'll book you again when it arrives.`, onTap: open('part', r.id) })
  }
  const partArrives = (r: Req) => { update(r.id, { status: 'scheduled', day: 'Tomorrow', time: '6:30 PM' }, { s: 'scheduled', text: 'Part arrived. Visit booked for tomorrow, 6:30 PM' }); toast({ kind: 'system', title: 'Part arrived', body: 'Visit booked for tomorrow, 6:30 PM.', onTap: open('track', r.id) }) }
  const missVisit = (r: Req) => {
    update(r.id, { status: 'missed' }, { s: 'missed', text: `${techOf(r).name} came at 8:40 PM. The door was locked.` })
    pushAlert({ title: 'Missed visit', body: 'The door was locked. Pick a new time.', kind: 'missed', reqId: r.id })
    toast({ kind: 'system', title: 'We missed you', body: `${techOf(r).name.split(' ')[0]} found the door locked. Pick a new time.`, onTap: open('missed', r.id) })
  }

  // Auto-advance a new report: checked after a few seconds, booked a few seconds later.
  const timers = useRef(new Set<string>())
  useEffect(() => {
    reqs.forEach(r => {
      if (r.status === 'reported' && !timers.current.has(r.id)) { timers.current.add(r.id); setTimeout(() => { const x = store.get().reqs.find(q => q.id === r.id); if (x?.status === 'reported') verify(x) }, 4500) }
      if (r.status === 'verified' && !timers.current.has(r.id + 'v')) { timers.current.add(r.id + 'v'); setTimeout(() => { const x = store.get().reqs.find(q => q.id === r.id); if (x?.status === 'verified') schedule(x) }, 5000) }
    })
  }, [reqs])
  // Technician walking over: one minute every 2.5 s (sped up for the demo)
  const walking = reqs.find(r => r.status === 'on_way')
  useEffect(() => {
    if (!walking) return
    const t = setInterval(() => {
      const e = store.get().eta - 1
      if (e <= 0) { clearInterval(t); const x = store.get().reqs.find(q => q.id === walking.id); if (x) arrive(x) } else store.set({ eta: e })
    }, 2500)
    return () => clearInterval(t)
  }, [walking?.id])

  /* ---------- demo controls depend on where you are ---------- */
  const focus = reqs.find(r => r.id === nav.params.id) || reqs.find(r => isActive(r) && r.status !== 'waiting_part') || reqs.find(isActive)
  const demo = useMemo<DemoAction[]>(() => {
    const out: DemoAction[] = []
    if (nav.screen === 'tabs' && tab === 'me') {
      out.push({ label: 'Show: no internet', run: () => nav.go('eOffline') }, { label: 'Show: server error', run: () => nav.go('eServer') }, { label: 'Show: session expired', run: () => nav.go('eSession') }, { label: 'Show: request not found', run: () => nav.go('eNotFound') })
      return out
    }
    if (!focus || ['welcome', 'signin', 'verify', 'isyou', 'where', 'hours', 'permission', 'what', 'issue', 'safety', 'place', 'dupe', 'slot', 'review'].includes(nav.screen)) return out
    const r = focus, n = techOf(r).name.split(' ')[0]
    const add = (label: string, sub: string, run: () => void) => out.push({ label, sub, run })
    if (r.status === 'reported') add('Supervisor approves it', 'Normally within an hour', () => verify(r))
    if (r.status === 'verified') add('Book the visit', `${n} picks your slot`, () => schedule(r))
    if (r.status === 'scheduled') { add(`${n} heads out`, 'You get the 10 minute alert', () => headOut(r)); add(`${n} needs a part`, 'Visit paused until it arrives', () => needPart(r)); add('Door was locked', `${n} could not get in`, () => missVisit(r)) }
    if (r.status === 'on_way') add(`${n} arrives now`, 'Skip the walk', () => arrive(r))
    if (r.status === 'visiting') { add(`${n} types your code`, 'The right one: job closes', () => close(r)); add(`${n} types a wrong code`, 'See the mismatch screen', () => wrong(r)) }
    if (r.status === 'waiting_part') add('The part arrives', 'A new visit is booked', () => partArrives(r))
    return [...out, ...extraDemo]
  }, [nav.screen, tab, focus?.id, focus?.status, extraDemo])

  const jump = (id: string) => {
    const [scr, t] = id.split(':') as [Screen, Tab | undefined]
    if (t) setTab(t)
    const any = store.get().reqs
    const pick = (st: string[]) => (any.find(r => st.includes(r.status)) || any[0]).id
    const needs: Partial<Record<Screen, () => object>> = {
      dupe: () => ({ id: store.get().others[0]?.id || '2398' }), sent: () => ({ id: any[0].id }), track: () => ({ id: pick(['scheduled', 'verified', 'reported', 'waiting_part']) }),
      nearby: () => ({ id: pick(['on_way', 'scheduled']) }), code: () => ({ id: pick(['visiting', 'scheduled']) }), wrong: () => ({ id: pick(['visiting', 'scheduled']) }),
      part: () => ({ id: pick(['waiting_part']) }), missed: () => ({ id: pick(['missed', 'scheduled']) }), rate: () => ({ id: pick(['closed']) }), closed: () => ({ id: pick(['closed']) }), reopen: () => ({ id: pick(['closed']) }),
    }
    if (['what', 'issue', 'safety', 'place', 'slot', 'review'].includes(scr) && !store.get().draft.item) store.set({ draft: { trade: 'Electrical', item: 'fan', itemLabel: 'Ceiling fan', issue: 'Not spinning', place: 'room', spot: 'Room B-104', day: 'Today', time: '8:30 PM', access: 'in' } })
    if (scr === 'dupe' && !store.get().others.length) store.reset()
    nav.reset(scr, { tr: 'swap', p: needs[scr]?.() as Record<string, unknown> })
  }

  const s = nav.screen; const p = nav.params
  const view = {
    welcome: <O.Welcome />, signin: <O.SignIn />, verify: <O.Verify />, isyou: <O.IsYou />, where: <O.Where editing={store.get().onboarded} />, hours: <O.Hours editing={!!p.editing} />, permission: <O.Permission />,
    tabs: <Tabs />, what: <R.What />, issue: <R.Issue />, safety: <R.Safety />, place: <R.Place />, dupe: <R.Dupe />, slot: <R.Slot />, review: <R.Review />, sent: <R.Sent />,
    track: <F.Track />, nearby: <F.Nearby />, code: <F.Code />, wrong: <F.Wrong />, part: <F.Part />, missed: <F.Missed />, rate: <F.Rate />, closed: <F.Closed />, reopen: <F.Reopen />,
    eOffline: <F.ErrorScreen kind="offline" />, eServer: <F.ErrorScreen kind="server" />, eSession: <F.ErrorScreen kind="session" />, eNotFound: <F.ErrorScreen kind="notfound" />,
  }[s]
  const current = s === 'tabs' ? `tabs:${tab}` : s
  return (
    <Ctx.Provider value={{ nav, toast, tab, setTab, demo, setDemo, online }}>
      <PhoneStage app="Student app" accent="#FFD265" tagline="For students in IIT Roorkee Bhawans: report what broke, see when the technician is close, and close the job with your own code."
        groups={GROUPS} current={current} sim={demo} onJump={jump} onRestart={() => { store.reset(); setTab('home'); nav.reset('welcome', { tr: 'push' }) }}>
        <Stage nav={nav as never}>{view}</Stage>
        {demo.length > 0 && s !== 'tabs' && <DemoFab />}
        <ToastOutlet />
      </PhoneStage>
    </Ctx.Provider>
  )
}

import { DemoDock } from './shell'
function DemoFab() { return <DemoDock bottom={120} /> }

export default function App() {
  return <ToastHost><Inner /></ToastHost>
}
export { Footprints, ShieldCheck, CalendarCheck2, PackageCheck, DoorClosed, KeyRound, Check, TECHS }
