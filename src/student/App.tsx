import React, { useEffect, useMemo, useState } from 'react'
import { useNav, Stage } from '../ds/nav'
import { PhoneStage, ScreenGroup, SimAction } from '../ds/stage'
import { AppCtx, ALL, Screen } from './screens'
import { store, active, setReq, pushAlert, code4 } from './store'

const GROUPS: ScreenGroup[] = [
  { title: 'Getting in', items: [{ id: 'welcome', label: 'Welcome' }, { id: 'signin', label: 'Sign in' }, { id: 'verify', label: 'Check your email' }, { id: 'isyou', label: 'Is this you' }, { id: 'where', label: 'Where do you live' }, { id: 'hours', label: 'Usual free hours' }, { id: 'allow', label: 'Allow alerts' }, { id: 'homeEmpty', label: 'Home, nothing broken' }] },
  { title: 'Report a problem', items: [{ id: 'home', label: 'Home' }, { id: 'doing', label: 'What is it doing' }, { id: 'safety', label: 'Safety check' }, { id: 'place', label: 'Where is it' }, { id: 'slot', label: 'When can they come' }, { id: 'review', label: 'Check it' }, { id: 'dupe', label: 'Already reported' }, { id: 'sent', label: 'Report sent' }] },
  { title: 'Follow it until it is resolved', items: [{ id: 'detail', label: 'Request detail' }, { id: 'near', label: 'Technician near' }, { id: 'code', label: 'Closing code' }, { id: 'wrong', label: 'Wrong code' }, { id: 'rate', label: 'Rate the visit' }, { id: 'closed', label: 'Closed' }, { id: 'part', label: 'Waiting on a part' }, { id: 'missed', label: 'Missed visit' }, { id: 'whatswrong', label: "What's wrong" }] },
  { title: 'Alerts, profile and errors', items: [{ id: 'alerts', label: 'Alerts' }, { id: 'profile', label: 'Profile' }, { id: 'offline', label: 'No connection' }, { id: 'e500', label: 'Something went wrong' }, { id: 'expired', label: 'Session expired' }, { id: 'e404', label: 'Not found' }] },
]

/* What a reviewer needs so any screen opens with sensible data. */
function ensure(scr: Screen) {
  const s = store.get()
  const patch: Partial<typeof s> = {}
  if (!['welcome', 'signin', 'verify'].includes(scr) && !s.email) Object.assign(patch, { email: 'siddhi_s@design.iitr.ac.in', name: 'Siddhi S.' })
  if (!['welcome', 'signin', 'verify', 'isyou', 'where', 'hours', 'allow'].includes(scr)) patch.signedIn = true
  if (['doing', 'safety', 'slot', 'review', 'dupe'].includes(scr) && !s.draft.item) patch.draft = { ...s.draft, item: 'fan', trade: 'Electrical', issue: 'Not spinning' }
  if (scr === 'place') patch.draft = { ...s.draft, place: s.draft.place || 'Washroom', floor: s.draft.floor || 'G' }
  store.set(patch)
  const needReq = ['home', 'sent', 'detail', 'near', 'code', 'wrong', 'rate', 'closed', 'missed', 'whatswrong'].includes(scr)
  if (needReq && !active(store.get())) {
    const id = '2418'
    store.set(x => ({ current: id, reqs: [{ id, item: 'Ceiling fan', issue: 'Not spinning', trade: 'Electrical', where: 'BG04', at: Date.now() - 2 * 86400000, stage: 2, tech: 'Ravi Kumar', techTrade: 'Electrician', slot: '8:30 to 9:00 PM', day: 'Today', code: code4(), letIn: false, tries: 0, missed: 1 }, ...x.reqs] }))
  }
  const r = active(store.get())
  if (r) {
    if (scr === 'home' && r.stage < 3) setReq(r.id, { stage: 3 })
    if (scr === 'code' || scr === 'wrong') setReq(r.id, { stage: 4, tries: Math.max(1, r.tries) })
    if (scr === 'closed' || scr === 'rate') setReq(r.id, { stage: 5, closedAt: Date.now(), fix: 'Replaced the fan capacitor and tested all speed settings.', stars: scr === 'closed' ? 5 : r.stars })
  }
  if (scr === 'part') { const p = store.get().reqs.find(x => x.part); if (p) store.set({ current: p.id }) }
  if (scr === 'alerts' && !store.get().alerts.length) {
    pushAlert({ title: 'Report submitted', sub: 'Fan · yesterday', kind: 'sent', reqId: r?.id }); pushAlert({ title: 'Waiting on a part', sub: 'Tube light · yesterday', kind: 'part', reqId: '2391' })
    pushAlert({ title: 'Photo received', sub: 'Fan · 2 hours ago', kind: 'photo', reqId: r?.id }); pushAlert({ title: 'Ravi is 10 minutes away', sub: 'Fan replacement · just now', kind: 'near', reqId: r?.id })
  }
}

function Inner() {
  const s0 = store.get()
  const start = (new URLSearchParams(location.search).get('s') as Screen) || (s0.signedIn ? 'home' : 'welcome')
  useMemo(() => ensure(start), [])
  const nav = useNav<Screen>(start === 'home' && !active(s0) ? 'homeEmpty' : start, 'push')
  const s = store.use(x => x)
  const [, force] = useState(0)
  useEffect(() => { const u = () => store.set({ online: true }), d = () => store.set({ online: false }); addEventListener('online', u); addEventListener('offline', d); return () => { removeEventListener('online', u); removeEventListener('offline', d) } }, [])

  const r = active(s)
  const sim: SimAction[] = []
  if (r && r.stage < 5) {
    const tf = r.tech.split(' ')[0]
    if (r.stage === 0) sim.push({ label: 'Supervisor checks the report', sub: 'Verified, sent to ' + tf, run: () => { setReq(r.id, { stage: 2 }); pushAlert({ title: 'Your report was checked', sub: `${r.item} · scheduled ${r.day.toLowerCase()}`, reqId: r.id, kind: 'checked' }) } })
    if (r.stage <= 2) sim.push({ label: `${tf} is 10 minutes away`, sub: 'Technician near', run: () => { setReq(r.id, { stage: 3 }); pushAlert({ title: `${tf} is 10 minutes away`, sub: `${r.item} · just now`, reqId: r.id, kind: 'near' }); nav.go('near', { tr: 'wave', p: { id: r.id } }) } })
    if (r.stage <= 3) sim.push({ label: `${tf} says it is fixed`, sub: 'Closing code', run: () => { setReq(r.id, { stage: 4 }); nav.go('code', { tr: 'wave', p: { id: r.id } }) } })
    if (r.stage === 4) {
      sim.push({ label: `${tf} enters the right code`, sub: 'The job closes', run: () => { setReq(r.id, { stage: 5, closedAt: Date.now(), fix: 'Fixed and tested before closing.' }); pushAlert({ title: 'Closed with your code', sub: `${r.item} · just now`, reqId: r.id, kind: 'closed' }); nav.replace('rate', { tr: 'wave', p: { id: r.id } }) } })
      sim.push({ label: `${tf} enters a wrong code`, sub: 'Wrong code', run: () => { const t = r.code.slice(0, 3) + ((+r.code[3] + 3) % 10); setReq(r.id, { tries: r.tries + 1 }); nav.go('wrong', { tr: 'wave', p: { id: r.id, tried: t } }) } })
    }
    if (r.stage <= 3) sim.push({ label: `${tf} finds the door locked`, sub: 'Missed visit', run: () => { setReq(r.id, { missed: r.missed + 1 }); nav.go('missed', { tr: 'wave', p: { id: r.id } }) } })
  }
  const part = s.reqs.find(x => x.part && x.stage < 3)
  if (part) sim.push({ label: 'The part reaches the IWD store', sub: `${part.item} gets a visit`, run: () => { setReq(part.id, { part: undefined, stage: 2, day: 'Tomorrow' }); pushAlert({ title: 'Part arrived, visit booked', sub: `${part.item} · just now`, reqId: part.id, kind: 'part' }) } })
  sim.push({ label: s.online ? 'Internet drops' : 'Internet is back', sub: s.online ? 'Offline banner, reports wait' : 'Back online', run: () => store.set({ online: !s.online }) })

  const jump = (id: string) => { ensure(id as Screen); force(x => x + 1); nav.reset(id as Screen, { tr: 'swap' }) }
  const El = ALL[nav.screen]
  return (
    <AppCtx.Provider value={{ nav }}>
      <PhoneStage app="Student app" accent="#FFD265" bg="#FFF1C7" sim={sim} groups={GROUPS} current={nav.screen} onJump={jump}
        tagline="For students in IIT Roorkee Bhawans: report what broke, see when the technician is close, and close the job with your own code."
        onRestart={() => { store.reset(); nav.reset('welcome', { tr: 'swap' }) }}>
        <Stage nav={nav as never} waveColor="#FFD265"><El /></Stage>
      </PhoneStage>
    </AppCtx.Provider>
  )
}
export default function App() { return <Inner /> }
export { React }
