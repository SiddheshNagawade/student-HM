/* Student app: every screen is the Figma frame itself (see ../fig/Fig.tsx). This file only attaches
   behaviour and live data to the Figma layers, by their node ids. */
import React, { ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Fig, FNode, Binds, SvgMod, setFill, figArt } from '../fig/Fig'
import { SpinDown, PlaneFlight, PLANE_VERIFY, PLANE_SENT, Settle, Hop, WalkIn, Reveal, Slap, StampDown, PopIn, RiseIn, PlaceDown, Flicker, RingsIn } from '../fig/anim'
import { NavApi } from '../ds/nav'
import { fx } from '../ds/fx'
import { takePhoto, Shot } from '../ds/camera'
import { BHAWANS } from '../ds/bhawans'
import DATA from './fig.json'
import { Hanging, peek } from '../fig/mascot'
import { ScoreDial, StepHop, BuildOverlay, ToolOverlay } from '../fig/extras'
import { fileUrl } from '../fig/preload'
import { TimeWheel, Sun, SLOT_START, slotShort, slotRange, goneToday } from './wheel'
import { store, State, roomCode, nameFrom, IITR, initial, firstName, emptyDraft, code4, active, pushAlert, setReq, ago, stamp, Req } from './store'

export type Screen = 'welcome' | 'signin' | 'verify' | 'isyou' | 'where' | 'hours' | 'allow' | 'homeEmpty' | 'home' | 'doing' | 'safety' | 'place' | 'slot' | 'review' | 'sent' | 'dupe'
  | 'detail' | 'near' | 'code' | 'wrong' | 'rate' | 'closed' | 'part' | 'missed' | 'whatswrong' | 'alerts' | 'profile' | 'offline' | 'e500' | 'expired' | 'e404'
type Ctx = { nav: NavApi<Screen> }
export const AppCtx = createContext<Ctx>(null!)
const useNav = () => useContext(AppCtx).nav
const D = DATA as unknown as Record<string, FNode>
const F = ({ id, binds, extra, bg, need }: { id: string; binds?: Binds; extra?: ReactNode; bg?: string; need?: string[] }) => <Fig s={D[id]} binds={binds} extra={extra} bg={bg} need={need} />
/** Every drawing in the app, for the quiet background loading that starts once the first screen is up. */
export const allFrames = () => Object.values(D)
const useS = () => store.use(s => s)
const back = (nav: NavApi<Screen>) => ({ onClick: () => nav.back(), label: 'Back' })
/** Swing a group of loose layers as one notice board hung on a pin at (px, py). */
const swingAll = (ids: string[], scr: FNode, px: number, py: number): Binds => Object.fromEntries(ids.map(i => { const n = scr.k!.find(k => k.i === i)!; return [i, { style: { animation: 'figswing 1.9s cubic-bezier(.3,.6,.4,1) .15s both', transformOrigin: `${px - n.x}px ${py - n.y}px` } }] }))
const HANG = { cx: 195, top: 30, scale: 1.06 }
const hide2 = (...ids: string[]): Binds => Object.fromEntries(ids.map(i => [i, { hide: true }]))
const abs = (x: number, y: number, w: number, h: number): React.CSSProperties => ({ position: 'absolute', left: x, top: y, width: w, height: h })

/* ---------- things that can break, and what they do ---------- */
export type Thing = { item: string; trade: 'Electrical' | 'Plumbing' | 'Carpentry' | 'Civil'; issues: [string, string, string]; verb: string; tech: [string, string] }
const RAVI: [string, string] = ['Ravi Kumar', 'Electrician'], IMRAN: [string, string] = ['Imran Ali', 'Plumber'], DEEPAK: [string, string] = ['Deepak Saini', 'Carpenter'], MAHESH: [string, string] = ['Mahesh Chauhan', 'Mason']
export const THINGS: Record<string, Thing> = {
  fan: { item: 'Ceiling fan', trade: 'Electrical', issues: ['Not spinning', 'Noisy', 'Slow'], verb: 'spinning', tech: RAVI },
  light: { item: 'Tube light', trade: 'Electrical', issues: ['Not turning on', 'Flickering', 'Buzzing'], verb: 'working', tech: RAVI },
  switch: { item: 'Switch board', trade: 'Electrical', issues: ['Not working', 'Sparks', 'Loose'], verb: 'working', tech: RAVI },
  window: { item: 'Window', trade: 'Carpentry', issues: ['Will not close', 'Glass cracked', 'Latch broken'], verb: 'closing', tech: DEEPAK },
  door: { item: 'Door', trade: 'Carpentry', issues: ['Will not lock', 'Hinge loose', 'Jammed'], verb: 'locking', tech: DEEPAK },
  bed: { item: 'Bed', trade: 'Carpentry', issues: ['Slat broken', 'Wobbly', 'Leg loose'], verb: 'fixed', tech: DEEPAK },
  table: { item: 'Study table', trade: 'Carpentry', issues: ['Wobbly', 'Drawer stuck', 'Top broken'], verb: 'fixed', tech: DEEPAK },
  lamp: { item: 'Table lamp socket', trade: 'Electrical', issues: ['Not working', 'Sparks', 'Loose'], verb: 'working', tech: RAVI },
  Washroom: { item: 'Washroom', trade: 'Plumbing', issues: ['Tap leaking', 'No water', 'Flush broken'], verb: 'fixed', tech: IMRAN },
  Corridor: { item: 'Corridor', trade: 'Electrical', issues: ['Light not working', 'Fan not working', 'Switch broken'], verb: 'fixed', tech: RAVI },
  Stairs: { item: 'Stairs', trade: 'Civil', issues: ['Railing loose', 'Light not working', 'Step broken'], verb: 'fixed', tech: MAHESH },
  'Common room': { item: 'Common room', trade: 'Electrical', issues: ['Fan not working', 'Light not working', 'Socket broken'], verb: 'fixed', tech: RAVI },
}
const thing = (s: State) => THINGS[s.draft.item] || THINGS.fan
/* Who comes depends on WHAT is wrong, not on where it is: a dead light on the stairs is an electrician's job, a loose railing is the mason's.
   Each problem (a tile the student tapped, or words they typed) is matched to a trade; the first one decides who is sent. */
type Trade = Thing['trade']
const TRADE_WORDS: [RegExp, Trade][] = [
  [/tap|leak|water|flush|drain|pipe|geyser|toilet|smell|overflow/i, 'Plumbing'],
  [/light|fan|switch|socket|power|spark|wire|bulb|tube|buzz|flicker|regulator|choke|plug|shock/i, 'Electrical'],
  [/door|window|lock|bed|table|chair|hinge|latch|drawer|slat|wobbl|leg|glass|jam|almirah|shelf|mesh/i, 'Carpentry'],
  [/railing|step|stair|wall|ceiling|floor|tile|crack|seepage|plaster|damp|paint|roof/i, 'Civil'],
]
const TRADE_TECH: Record<Trade, [string, string]> = { Electrical: RAVI, Plumbing: IMRAN, Carpentry: DEEPAK, Civil: MAHESH }
const tradeOfIssue = (issue: string, fallback: Trade): Trade => TRADE_WORDS.find(([re]) => re.test(issue))?.[1] || fallback
const allIssues = (d: { issue: string; issues?: string[]; others?: string[] }) => { const a = [...(d.issues || []), ...(d.others || [])]; return a.length ? a : d.issue ? [d.issue] : [] }
const whoComes = (d: { issue: string; issues?: string[]; others?: string[] }, base: Trade) => { const trade = tradeOfIssue(allIssues(d)[0] || '', base); return { trade, tech: TRADE_TECH[trade] } }

/* ---------- time helpers ---------- */
const DAYS = (() => { const out: { label: string; num: string; long: string }[] = []; for (let i = 0; i < 4; i++) { const d = new Date(Date.now() + i * 86400000); out.push({ label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }), num: String(d.getDate()), long: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) }) } return out })()
const SLOTS = SLOT_START.map((_, i) => [slotShort(i), slotRange(i)])
/** One chosen time as short words: "Tomorrow · 11:00 AM". */
const timeWords = (t: { d: number; s: number }) => `${DAYS[t.d].label} · ${slotShort(t.s)} ${SLOT_START[t.s] < 720 ? 'AM' : 'PM'}`
const earliest = (ts: { d: number; s: number }[]) => [...ts].sort((a, b) => a.d - b.d || a.s - b.s)[0]
const field16: React.CSSProperties = { font: '500 16px/20px "M PLUS Rounded 1c", sans-serif' }
const pill: React.CSSProperties = { height: 30, boxSizing: 'border-box', borderRadius: 12, border: '2px solid #00224E', background: '#FFFFFF', padding: '0 10px', font: '500 13px/16px "M PLUS Rounded 1c", sans-serif', color: '#00224E', outline: 'none' }
/* The free-hours grid keeps its four Figma columns; they are the four blocks of the technicians' day (10 AM to 6 PM). */
const PERIOD = ['10–12', '12–2', '2–4', '4–6']
const PERIOD_LONG = ['10 to 12 in the morning', '12 to 2 in the afternoon', '2 to 4 in the afternoon', '4 to 6 in the evening']
const PERIOD_SLOT = [2, 6, 9, 12] // the slot ALIGN suggests for each block: 11:00, 1:00, 2:30, 4:00
function usualFree(s: State) {
  const dow = (new Date().getDay() + 6) % 7
  const p = s.hours[dow].findIndex(Boolean)
  return p < 0 ? slotRange(9) : slotRange(PERIOD_SLOT[p])
}

/* ================= Getting in ================= */
export function Welcome() {
  const nav = useNav()
  return <F id="227:132" binds={{ '227:200': { onClick: () => nav.go('signin') }, '227:133': { wrap: el => <RiseIn y={40} dur={0.9}>{el}</RiseIn> } }} />
}

export function SignIn() {
  const nav = useNav(); const s = useS()
  const [email, setEmail] = useState(s.email); const [bad, setBad] = useState(false)
  const go = () => {
    const e = email.trim().toLowerCase()
    if (!IITR.test(e)) { fx.error(); setBad(true); return }
    fx.success(); store.set({ email: e, name: nameFrom(e) }); nav.go('verify')
  }
  if (bad) return (
    <F id="228:531" binds={{
      '228:608': { input: { value: email, onChange: v => { setEmail(v); if (IITR.test(v.trim())) setBad(false) }, error: true, type: 'email', inputMode: 'email', autoFocus: true, onEnter: go, placeholder: 'name@design.iitr.ac.in' } },
      '228:596': { hide: true }, '228:599': { onClick: () => { setEmail(''); setBad(false) }, label: 'Clear' },
      '228:601': { text: 'needs to end in iitr.ac.in, like name@design.iitr.ac.in' }, '228:606': { onClick: go },
    }} />
  )
  return (
    <F id="228:449" binds={{
      '228:528': { input: { value: email, onChange: setEmail, type: 'email', inputMode: 'email', autoFocus: true, onEnter: go, placeholder: 'name@design.iitr.ac.in' } },
      '228:517': { hide: true }, '228:526': { onClick: go },
    }} />
  )
}

export function Verify() {
  const nav = useNav(); const s = useS()
  const [code, setCode] = useState(''); const [left, setLeft] = useState(30); const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { const t = setInterval(() => setLeft(x => Math.max(0, x - 1)), 1000); return () => clearInterval(t) }, [])
  const ok = code.length === 6
  const [checking, setChecking] = useState(false)
  const verify = () => { if (!ok || checking) return; setChecking(true) } // the bulb lights up once the code is checked
  const boxes = (
    <div style={{ position: 'relative', display: 'flex', gap: 10, paddingLeft: 2 }} onClick={() => ref.current?.focus()}>
      {Array.from({ length: 6 }, (_, i) => {
        const cur = i === Math.min(code.length, 5) && code.length < 6
        return <div key={i} style={{ width: 48, height: 60, borderRadius: 14, background: '#FFFFFF', border: `${cur ? 3 : 2.5}px solid #00224E`, boxShadow: cur ? '0 4px 0 #00224E' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Mono", monospace', fontWeight: 500, fontSize: 20, color: '#00224E', transition: 'box-shadow 80ms' }}>{code[i] || ''}</div>
      })}
      <input ref={ref} autoFocus inputMode="numeric" autoComplete="one-time-code" aria-label="6 digit code" value={code}
        onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); if (v.length > code.length) fx.key(v.length); else fx.erase(); setCode(v) }}
        onKeyDown={e => e.key === 'Enter' && verify()} style={{ position: 'absolute', inset: 0, opacity: 0 }} />
    </div>
  )
  return (
    <F id="227:202" binds={{
      '227:203': back(nav), '227:216': { render: () => <PlaneFlight {...PLANE_VERIFY} /> },
      '227:218': { text: <>Code sent to <b style={{ fontWeight: 500, color: '#00224E', wordBreak: 'break-all' }}>{s.email || 'your institute email'}</b>. It works for 10 minutes.</>, style: { whiteSpace: 'normal' } },
      '227:219': { render: () => boxes },
      '227:229': { onClick: verify, disabled: !ok },
      '227:231': left > 0 ? { text: `Resend code in 0:${String(left).padStart(2, '0')}` } : { text: 'Send a new code', onClick: () => { setLeft(30); setCode('') } },
    }} extra={checking ? <ToolOverlay kind="bulb" bg="#FFF1C7" label="Checking your code" onDone={() => { fx.success(); nav.go('isyou') }} /> : undefined} />
  )
}

export function IsYou() {
  const nav = useNav(); const s = useS()
  return (
    <F id="227:232" binds={{
      '227:233': back(nav), '227:253': { style: { animation: 'figswing 1.9s cubic-bezier(.3,.6,.4,1) .15s both', transformOrigin: '170px -8px' } },
      '228:651': { text: initial(s.name) }, '228:652': { text: s.name || 'Student' }, '228:653': { text: s.hostel }, '228:654': { text: roomCode(s) },
      '227:260': { onClick: () => nav.go('where') }, '227:262': { onClick: () => { store.set({ email: '', name: '' }); nav.reset('signin') } },
    }} />
  )
}

export function Where() {
  const nav = useNav(); const s = useS(); const editing = !!nav.params.edit
  const bhawan = (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <select value={BHAWANS.includes(s.hostel) ? s.hostel : ''} onChange={e => { fx.select(); store.set({ hostel: e.target.value }) }} aria-label="Bhawan"
        style={{ width: '100%', height: '100%', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none', borderRadius: 16, border: '2.5px solid #00224E', background: '#FFFFFF', padding: '0 48px 0 18px', font: '500 16px/24px "M PLUS Rounded 1c", sans-serif', color: '#00224E', cursor: 'pointer' }}>
        {!BHAWANS.includes(s.hostel) && <option value="" disabled>Choose your Bhawan</option>}
        {BHAWANS.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true" style={{ position: 'absolute', right: 16, top: 18, pointerEvents: 'none' }}><path d="M4 8l7 7 7-7" stroke="#00224E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  )
  const up = (k: 'block' | 'floor' | 'room', max: number) => ({ value: s[k], onChange: (v: string) => store.set({ [k]: v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, max) } as Partial<State>), maxLength: max })
  return (
    <F id="227:263" binds={{
      '227:268': back(nav), '227:272': { text: editing ? 'Your room' : 'Step 1 of 2' },
      '227:276': { text: 'BHAWAN' }, '227:277': { render: () => bhawan },
      '227:282': { input: up('block', 1) }, '227:286': { input: up('floor', 1) }, '227:290': { input: { ...up('room', 3), inputMode: 'numeric' } },
      '227:295': { text: roomCode(s) },
      '227:296': { text: editing ? 'Save' : 'Next', onClick: () => editing ? nav.back() : nav.go('hours') },
    }} />
  )
}

export function Hours() {
  const nav = useNav(); const s = useS(); const editing = !!nav.params.edit
  const binds: Binds = { '226:1449': back(nav), '226:1452': { onClick: () => editing ? nav.back() : nav.go('allow') } }
  for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) {
    const id = `226:${1421 + r * 4 + c}`
    binds[id] = { on: s.hours[r][c], label: `${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][r]}, ${PERIOD_LONG[c]}`, onClick: () => store.set(x => ({ hours: x.hours.map((row, i) => i !== r ? row : row.map((v, j) => (j === c ? !v : v))) })) }
  }
  PERIOD.forEach((t, c) => { binds[`226:${1370 + c}`] = { text: t } })
  return <F id="226:1364" binds={binds} />
}

export function Allow() {
  const nav = useNav()
  const done = (on: boolean) => { store.set({ alertsOn: on, signedIn: true }); nav.reset('homeEmpty'); setTimeout(() => peek({ mood: 'wave', say: `Hi ${firstName(store.get().name) || 'there'}!`, sub: on ? 'I will ping you when someone is coming.' : undefined, ms: 3200 }), 500) }
  return (
    <F id="227:298" binds={{
      '227:299': back(nav), '227:313': { wrap: el => <Settle>{el}</Settle> },
      '227:325': { onClick: async () => { try { if ('Notification' in window) await Notification.requestPermission() } catch { /* fine */ } done(true) } },
      '227:327': { onClick: () => done(false) },
    }} />
  )
}

/* ================= Home ================= */
export function HomeEmpty() {
  const nav = useNav(); const s = useS(); const code = roomCode(s)
  useEffect(() => { if (active(s)) nav.replace('home') }, [])
  return (
    <F id="228:611" binds={{
      '228:612': { text: code }, '228:613': { text: s.hostel }, '228:642': { text: `All good in ${code}.` },
      '228:632': { wrap: el => <Settle delay={0.2}>{el}</Settle> },
      '228:648': { onClick: () => nav.go('home', { p: { pick: true } }) },
    }} />
  )
}

/* Tap targets on the room drawing (screen coordinates, from the Figma frame). */
const SPOTS: [string, number, number, number, number][] = [
  ['fan', 147, 112, 96, 96], ['light', 228, 146, 134, 40], ['switch', 247, 278, 48, 48], ['window', 48, 120, 100, 126],
  ['door', 288, 224, 74, 200], ['bed', 26, 330, 186, 92], ['table', 214, 372, 74, 50], ['lamp', 262, 330, 30, 40],
]
export function Home() {
  const nav = useNav(); const s = useS(); const code = roomCode(s)
  const r = active(s); const pick = !!nav.params.pick || !r
  const unread = s.alerts.length > 0
  const start = (k: string) => { fx.select(); store.set({ draft: { ...emptyDraft(), item: k, trade: THINGS[k].trade } }); nav.go('doing') }
  const stageWord = ['Reported', 'Verified', 'Scheduled', 'Visiting', 'Visiting', 'Closed']
  const big = r ? (r.stage === 3 ? '12' : r.slot.split(' ')[0]) : ''
  const unit = r ? (r.stage === 3 ? 'min' : (r.slot.match(/(AM|PM)/) || ['PM'])[0]) : ''
  const line = r ? (r.stage === 3 ? `${firstName(r.tech)} is on his way` : r.stage === 4 ? `${firstName(r.tech)} is fixing it` : r.stage >= 2 ? `${firstName(r.tech)} comes ${r.day.toLowerCase()}` : r.stage === 1 ? `Checked, sent to ${firstName(r.tech)}` : 'Waiting for a quick check') : ''
  const labelIds = ['226:205', '226:206', '226:207', '226:208', '226:209']
  const cur = r ? Math.min(4, r.stage >= 3 ? 3 : r.stage) : -1
  const binds: Binds = {
    '226:139': { text: code }, '226:140': { text: s.hostel },
    '226:141': { onClick: () => nav.go('alerts'), label: 'Alerts' }, '226:142': { onClick: () => nav.go('alerts'), label: 'Alerts' }, '226:145': { hide: !unread },
    '226:146': { onClick: () => nav.go('profile'), label: 'Profile' }, '226:147': { text: initial(s.name), onClick: () => nav.go('profile') },
    '226:212': { wrap: el => <RingsIn>{el}</RingsIn> },
    '226:210': { onClick: () => { store.set({ draft: emptyDraft() }); nav.go('place') } },
  }
  if (pick) for (const id of ['226:193', '226:194', '226:195', '226:196', '226:197', '226:198', ...labelIds]) binds[id] = { hide: true }
  else {
    Object.assign(binds, {
      '226:194': { text: <>{big}<span style={{ fontSize: 24, lineHeight: '28px', marginLeft: 8 }}>{unit}</span></>, style: { width: 340 } }, '226:195': { hide: true }, '226:196': { text: line, onClick: () => nav.go('detail', { p: { id: r!.id } }) },
      '226:197': { text: `${r!.item} · ${r!.day.toLowerCase()} ${r!.slot}` }, '226:198': { wrap: (el: React.ReactNode) => <Reveal>{el}</Reveal>, onClick: () => nav.go('detail', { p: { id: r!.id } }), label: 'Open the request' },
    })
    labelIds.forEach((id, i) => { binds[id] = { text: i === 3 ? 'Visiting' : undefined, style: { color: i === cur ? '#00224E' : '#3E4F72', fontWeight: i === cur ? 700 : 400 } } })
    void stageWord
  }
  // the first time the room is shown, each tappable thing glows once in turn
  const [hint] = useState(() => { const seen = sessionStorage.getItem('align.hint.room'); sessionStorage.setItem('align.hint.room', '1'); return !seen })
  const [hit, setHit] = useState('')
  useEffect(() => { if (!hint) return; const t = setTimeout(() => peek({ mood: 'point', side: 'right', say: 'Tap whatever broke.', ms: 3200 }), 2700); return () => clearTimeout(t) }, [])
  const tap = (k: string) => { setHit(k); setTimeout(() => start(k), 170) }
  const extra = <>{SPOTS.map(([k, x, y, w, h], i) => <button key={k} aria-label={`Report the ${THINGS[k].item.toLowerCase()}`} title={THINGS[k].item} onClick={() => tap(k)}
    className={'fig-spot' + (hint ? ' fig-hint' : '')} style={{ ...abs(x, y, w, h), animationDelay: hint ? `${0.6 + i * 0.22}s` : undefined, ...(hit === k ? { background: 'radial-gradient(closest-side, rgba(255,210,101,.85), rgba(255,210,101,0))', transform: 'scale(1.06)' } : {}) }} />)}</>
  return <F id={s.online ? '226:137' : '228:158'} binds={s.online ? binds : remapHome(binds)} extra={extra} />
}
/* The offline home frame is the same layout with its own node ids (228:159.. instead of 226:138..). */
function remapHome(b: Binds) {
  const map: Record<string, string> = { '226:139': '228:160', '226:140': '228:161', '226:141': '228:162', '226:142': '228:163', '226:145': '228:166', '226:146': '228:167', '226:147': '228:168', '226:193': '228:214', '226:194': '228:215', '226:195': '228:216', '226:196': '228:217', '226:197': '228:218', '226:198': '228:219', '226:205': '228:226', '226:206': '228:227', '226:207': '228:228', '226:208': '228:229', '226:209': '228:230', '226:210': '228:231', '226:212': '228:233' }
  const o: Binds = {}; for (const [k, v] of Object.entries(b)) o[map[k] || k] = v; return o
}

/* ================= Report a problem ================= */
/* Hand-drawn pictures for every thing that can break (public/fig/fix-*.svg): a big one on top, a small one per problem.
   'fan' means the Figma fan drawing that was already there. */
const FIX: Record<string, { hero: string; tiles: string[] }> = {
  light: { hero: 'light', tiles: ['light-1', 'light-2', 'light-3'] }, switch: { hero: 'switch', tiles: ['switch-1', 'switch-2', 'switch-3'] },
  window: { hero: 'window', tiles: ['window-1', 'window-2', 'window-3'] }, door: { hero: 'door', tiles: ['door-1', 'door-2', 'door-3'] },
  bed: { hero: 'bed', tiles: ['bed-1', 'bed-2', 'bed-3'] }, table: { hero: 'table', tiles: ['table-1', 'table-2', 'table-3'] },
  lamp: { hero: 'lamp', tiles: ['lamp-1', 'lamp-2', 'lamp-3'] }, Washroom: { hero: 'washroom', tiles: ['washroom-1', 'washroom-2', 'washroom-3'] },
  Corridor: { hero: 'light', tiles: ['light-1', 'fan', 'switch-1'] }, Stairs: { hero: 'stairs', tiles: ['stairs-1', 'light-1', 'stairs-2'] },
  'Common room': { hero: 'lamp', tiles: ['fan', 'light-1', 'switch-1'] },
}
/** The picture files of one item (so its screen waits for them), and of all items (for the background loading). */
export const fixFiles = (key: string) => { const f = FIX[key]; return f ? [`fix-${f.hero}-hero`, ...f.tiles.filter(t => t !== 'fan').map(t => `fix-${t}`)] : [] }
export const allFixFiles = () => [...new Set(Object.keys(FIX).flatMap(fixFiles))]
const fitSvg = (svg: string) => svg.replace(/^(<svg [^>]*?) width="\d+" height="\d+"/, '$1 width="100%" height="100%"')
export function Doing() {
  const nav = useNav(); const s = useS(); const t = thing(s); const d = s.draft; const code = roomCode(s)
  const picked = d.issues || [], others = d.others || []
  const [more, setMore] = useState('')
  // everything the student says is wrong: the tiles they tapped and the problems they typed in themselves (the first one is also kept as `issue`)
  const setIssues = (issues: string[], oth: string[]) => store.set(x => ({ draft: { ...x.draft, issues, others: oth, issue: issues[0] || oth[0] || '' } }))
  const addOther = () => { const v = more.trim(); if (!v) return; if (others.length >= 3) { fx.error(); return } fx.select(); setIssues(picked, [...others, v.slice(0, 40)]); setMore('') }
  const any = picked.length + others.length > 0
  const where = d.place ? `${d.place} · ${d.floor === 'G' ? 'Ground' : 'Floor ' + d.floor}` : code
  const tiles: [string, string, string, number][] = [['226:238', '226:253', '226:239', 0], ['226:254', '226:270', '226:255', 1], ['226:271', '226:287', '226:272', 2]]
  const isFan = d.item === 'fan'
  const fix = isFan ? undefined : FIX[d.item]
  const binds: Binds = {
    '226:299': back(nav), '226:222': { text: d.place ? where : `${t.item} · ${where}` },
    '226:236': { text: d.place ? `${d.place}. Now, what is wrong?` : `Yes, the ${t.item.toLowerCase()}. Now, what is it doing?` },
    '226:237': { text: d.place ? 'What is wrong?' : 'What is it doing?' },
    // the tile opens the camera (a phone) or the file chooser (a laptop); the picture then sits in the tile, and a tap on it takes it away again
    '226:288': { onClick: () => { if (d.photo) { fx.deselect(); store.set(x => ({ draft: { ...x.draft, photo: false } })); return } takePhoto().then(p => { if (p) { fx.shutter(); store.set(x => ({ draft: { ...x.draft, photo: p } })) } }) }, label: d.photo ? 'Remove the photo' : 'Add a photo' },
    '226:289': d.photo ? { render: () => <Shot src={d.photo as string} w={52} h={52} r={14} style={{ marginLeft: -13, marginTop: -13, boxShadow: 'none' }} />, style: { pointerEvents: 'none', overflow: 'visible' } } : { style: { pointerEvents: 'none' } },
    '226:293': { hide: true }, '226:294': { hide: true },
    '226:296': { text: `You are usually free ${usualFree(s)}` },
    '226:223': isFan ? { wrap: el => <SpinDown cx={195} cy={214}>{el}</SpinDown> } : fix ? {
      render: () => (
        <div style={{ position: 'relative', width: 390, height: 420 }}>
          <svg width={390} height={420} style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden="true"><circle cx={195} cy={212} r={116} fill="none" stroke="#00224E" strokeWidth={2.6} strokeLinecap="round" strokeDasharray="3 10" /></svg>
          <div style={{ position: 'absolute', left: 97, top: 129, width: 196, height: 166 }}>
            {['light', 'switch', 'lamp'].includes(fix.hero) ? <Flicker delay={0.5}><PopIn delay={0.1}><SvgMod id={`fix:${fix.hero}-hero`} mod={fitSvg} style={{ width: 196, height: 166 }} /></PopIn></Flicker>
              : <Settle delay={0.1}><SvgMod id={`fix:${fix.hero}-hero`} mod={fitSvg} style={{ width: 196, height: 166 }} /></Settle>}
          </div>
        </div>
      ),
    } : { hide: true },
    '226:297': { onClick: () => { if (!any) { fx.error(); return } allIssues(d).some(i => tradeOfIssue(i, t.trade) === 'Electrical') ? nav.go('safety') : nav.go('slot') }, style: { opacity: any ? 1 : 0.55 } },
  }
  for (const [frame, label, art, i] of tiles) {
    const on = picked.includes(t.issues[i]) // more than one can be tapped
    binds[frame] = { onClick: () => { on ? fx.deselect() : fx.select(); setIssues(on ? picked.filter(p => p !== t.issues[i]) : [...picked, t.issues[i]], others) }, style: { background: on ? '#FFD265' : '#FFFBF3', boxShadow: on ? '3px 4px 0 #00224E' : 'none' }, label: t.issues[i] }
    // two-line labels sit centred inside the tile, never over its edge
    binds[label] = { text: t.issues[i], style: { left: 0, top: 92, width: 106, height: 36, padding: '0 7px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'normal', fontSize: 13, lineHeight: '15px', overflow: 'hidden' } }
    const pic = fix?.tiles[i]
    binds[art] = isFan ? { render: () => <SvgMod id={art} mod={svg => on ? svg.replace(/#FFD265/g, '#FFFBF3') : svg.replace(/fill="#FFFBF3"/g, 'fill="#FFD265"')} />, style: { pointerEvents: 'none' } }
      : pic ? { render: () => <SvgMod id={pic === 'fan' ? '226:239' : `fix:${pic}`} mod={svg => fitSvg(on ? svg.replace(/#FFD265/g, '#FFFBF3') : svg)} style={{ width: 106, height: 84, padding: '8px 12px 2px', boxSizing: 'border-box' }} />, wrap: (el: ReactNode) => <PopIn delay={0.25 + i * 0.1}>{el}</PopIn>, style: { pointerEvents: 'none' } }
      : { hide: true }
  }
  const extra = (
    <>
      <input value={d.note || ''} maxLength={140} onChange={e => store.set(x => ({ draft: { ...x.draft, note: e.target.value } }))} placeholder="Describe it for the technician" aria-label="Describe the problem" style={{ ...pill, ...field16, height: 34, position: 'absolute', left: 92, top: 660, width: 274 }} />
      <input value={more} maxLength={40} onChange={e => setMore(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOther()} placeholder="Another problem?" aria-label="Add another problem" style={{ ...pill, ...field16, height: 34, position: 'absolute', left: 92, top: 698, width: 220 }} />
      <button type="button" onClick={addOther} aria-label="Add this problem" className="fig-press" style={{ ...pill, height: 34, position: 'absolute', left: 318, top: 698, width: 48, padding: 0, background: more.trim() ? '#FFD265' : '#FFFBF3', fontWeight: 700, cursor: 'pointer' }}>Add</button>
      {others.length > 0 && <div style={{ position: 'absolute', left: 24, top: 740, width: 342, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {others.map((o, i) => <button key={o + i} type="button" onClick={() => { fx.deselect(); setIssues(picked, others.filter((_, k) => k !== i)) }} aria-label={`Remove ${o}`} className="fig-press" style={{ ...pill, height: 28, background: '#FFD265', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', maxWidth: 160, overflow: 'hidden', whiteSpace: 'nowrap' }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{o}</span><span aria-hidden="true">×</span></button>)}
      </div>}
    </>
  )
  return <F id="226:215" binds={binds} extra={extra} need={fixFiles(d.item).map(fileUrl)} />
}

export function Safety() {
  const nav = useNav()
  const next = (danger: boolean) => { store.set(x => ({ draft: { ...x.draft, danger } })); if (danger) fx.error(); nav.go('slot') }
  return <F id="226:302" binds={{ '226:333': back(nav), '226:318': { wrap: el => <Flicker>{el}</Flicker> }, '226:336': { onClick: () => next(false) }, '226:338': { onClick: () => next(true) } }} />
}

const PLACES: [string, string, string][] = [['Corridor', '226:399', '226:345'], ['Washroom', '226:388', '226:346'], ['Common room', '226:347', '226:360'], ['Stairs', '226:361', '226:368']]
export function Place() {
  const nav = useNav(); const s = useS(); const d = s.draft
  const place = d.place || 'Washroom'; const floor = d.floor || 'G'
  useEffect(() => { if (!d.place) store.set(x => ({ draft: { ...x.draft, place: 'Washroom', floor: 'G' } })) }, [])
  const binds: Binds = { '226:414': back(nav), '226:344': { text: `Common areas · Block ${s.block || 'B'}` }, '226:417': { onClick: () => { store.set(x => ({ draft: { ...x.draft, item: x.draft.place, trade: THINGS[x.draft.place].trade } })); nav.go('doing') } } }
  for (const [name, art, label] of PLACES) {
    const on = place === name
    const pick = () => { fx.select(); store.set(x => ({ draft: { ...x.draft, place: name } })) }
    binds[art] = { onClick: pick, label: name, render: () => <SvgMod id={art} mod={svg => name === 'Washroom' ? (on ? svg : setFill(svg, 1, '#FFFBF3')) : (on ? setFill(svg, 0, '#FFD265') : svg)} /> }
    binds[label] = { onClick: pick }
  }
  const floors = ['G', '1', '2', '3']
  binds['226:370'] = { render: () => <SvgMod id="226:370" mod={svg => { let i = -1; return svg.replace(/fill="#(FFD265|FFFBF3)"/g, () => { i++; return `fill="${floors[i] === floor ? '#FFD265' : '#FFFBF3'}"` }) }} /> }
  const steps: [string, number, number, number, number][] = [['G', 34, 384, 78, 52], ['1', 114, 350, 80, 86], ['2', 194, 316, 80, 120], ['3', 274, 282, 80, 154]]
  const extra = <>{steps.map(([f, x, y, w, h]) => <button key={f} aria-label={f === 'G' ? 'Ground floor' : `Floor ${f}`} title={f === 'G' ? 'Ground floor' : `Floor ${f}`} onClick={() => { fx.tick(+f || 0); store.set(x => ({ draft: { ...x.draft, floor: f } })) }} className="fig-spot" style={abs(x, y + 200, w, h)} />)}</>
  return <F id="226:340" binds={binds} extra={extra} />
}

export function Slot() {
  const nav = useNav(); const s = useS(); const d = s.draft; const code = roomCode(s)
  const dayArts = ['226:449', '226:457', '226:465', '226:473'], dayTexts: [string, string][] = [['226:455', '226:456'], ['226:463', '226:464'], ['226:471', '226:472'], ['226:479', '226:480']]
  const off = (i: number) => d.dayIx === 0 && goneToday(i)
  const todayFull = SLOT_START.every((_, i) => goneToday(i))
  const firstOk = (from: number) => { for (let k = 0; k < SLOT_START.length; k++) { const i = (from + k) % SLOT_START.length; if (!off(i)) return i } return from }
  // today may be over (or nearly): start on tomorrow, and never sit on a slot that has gone
  useEffect(() => { if (d.dayIx === 0 && todayFull) store.set(x => ({ draft: { ...x.draft, dayIx: 1 } })); else if (off(d.slotIx)) store.set(x => ({ draft: { ...x.draft, slotIx: firstOk(x.draft.slotIx) } })) }, [d.dayIx])
  const usual = () => {
    const dow = (new Date().getDay() + 6) % 7
    for (let k = 0; k < 4; k++) { const day = (dow + k) % 7; const p = s.hours[day].findIndex(Boolean); if (p >= 0 && !(k === 0 && goneToday(PERIOD_SLOT[p]))) { fx.select(); store.set(x => ({ draft: { ...x.draft, dayIx: k, slotIx: PERIOD_SLOT[p], times: addTime(x.draft.times || [], k, PERIOD_SLOT[p]) } })); return } }
    fx.error()
  }
  // the student can give several times (several on one day, and on several days) so the technician can pick what suits his round
  const times = d.times || []
  const has = times.some(t => t.d === d.dayIx && t.s === d.slotIx)
  const toggleTime = () => {
    if (off(d.slotIx)) { fx.error(); return }
    if (has) { fx.deselect(); store.set(x => ({ draft: { ...x.draft, times: times.filter(t => !(t.d === d.dayIx && t.s === d.slotIx)) } })) }
    else if (times.length >= 8) fx.error()
    else { fx.select(); store.set(x => ({ draft: { ...x.draft, times: addTime(times, d.dayIx, d.slotIx) } })) }
  }
  const next = () => { const ts = times.length ? times : [{ d: d.dayIx, s: d.slotIx }]; const e = earliest(ts); store.set(x => ({ draft: { ...x.draft, times: ts, dayIx: e.d, slotIx: e.s } })); nav.go(d.place === 'Washroom' && /leak/i.test(d.issue) ? 'dupe' : 'review') }
  const binds: Binds = {
    '226:497': back(nav),
    '226:446': { render: () => <RiseIn y={30} dur={0.9}><Sun at={SLOT_START[d.slotIx]} /></RiseIn> },
    '226:427': { hide: true },
    ...Object.fromEntries(['226:429', '226:433', '226:437', '226:441', '226:432', '226:436', '226:440', '226:444'].map(i => [i, { hide: true }])),
    '226:445': { hide: true },
    '226:482': { hide: true }, '226:488': { hide: true }, '226:489': { hide: true },
    '226:490': { onClick: usual },
    '226:500': { onClick: next },
  }
  dayArts.forEach((id, i) => {
    const on = d.dayIx === i
    const dead = i === 0 && todayFull
    binds[id] = { onClick: () => { if (dead) { fx.error(); return } fx.tick(i); store.set(x => ({ draft: { ...x.draft, dayIx: i } })) }, label: DAYS[i].long + (dead ? ', no slots left' : ''), style: { opacity: dead ? 0.45 : 1 }, render: () => <SvgMod id={id} mod={svg => setFill(svg, 0, on ? '#FFD265' : '#FFFBF3')} /> }
    binds[dayTexts[i][0]] = { text: DAYS[i].label, style: { pointerEvents: 'none', opacity: dead ? 0.45 : 1 } }
    binds[dayTexts[i][1]] = { text: DAYS[i].num, style: { pointerEvents: 'none', opacity: dead ? 0.45 : 1 } }
  })
  const wheel = <TimeWheel key={d.dayIx} value={d.slotIx} disabled={off} onChange={i => store.set(x => ({ draft: { ...x.draft, slotIx: i } }))} />
  const panel = (
    <div style={{ position: 'absolute', left: 24, top: 494, width: 342, height: 108, boxSizing: 'border-box', borderRadius: 18, border: '2.5px solid #00224E', background: '#FFFBF3', padding: '10px 12px', zIndex: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ font: '700 14px/18px "M PLUS Rounded 1c", sans-serif', color: '#00224E' }}>{times.length ? `${times.length} time${times.length > 1 ? 's' : ''} suit you` : 'Times that suit you'}</div>
        <button type="button" onClick={toggleTime} className="fig-press" style={{ ...pill, height: 30, background: has ? '#FFFBF3' : '#FFD265', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{has ? 'Remove this time' : '+ Add this time'}</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, maxHeight: 54, overflow: 'hidden' }}>
        {times.length === 0 && <span style={{ font: '500 12.5px/16px "M PLUS Rounded 1c", sans-serif', color: '#3E4F72' }}>The technician picks the best one for his round. The more you give, the sooner he can come.</span>}
        {times.map(t => <button key={t.d + '-' + t.s} type="button" onClick={() => { fx.tick(t.s % 6); store.set(x => ({ draft: { ...x.draft, dayIx: t.d, slotIx: t.s } })) }} aria-label={`Show ${timeWords(t)} on the clock`} className="fig-press" style={{ ...pill, height: 24, padding: '0 8px', fontSize: 12, background: t.d === d.dayIx && t.s === d.slotIx ? '#FFD265' : '#FFFFFF', cursor: 'pointer' }}>{timeWords(t)}</button>)}
      </div>
    </div>
  )
  return <F id="226:419" binds={binds} extra={<>{wheel}{panel}</>} />
}
const addTime = (ts: { d: number; s: number }[], d: number, s: number) => (ts.some(t => t.d === d && t.s === s) ? ts : [...ts, { d, s }])
const toggleSvg = (svg: string, on: boolean, dot: string) => !on ? svg : setFill(svg, 1, '#FFD265').replace(new RegExp(`<path d="${dot}[^>]*/>`), m => `<g transform="translate(26 0)">${m}</g>`)
const cap = (x: string) => x[0].toUpperCase() + x.slice(1)
const swapTo = (svg: string, from: string, to: string) => { let done = false; return svg.replace(new RegExp(`fill="${from}"`, 'g'), m => { if (done) return m; done = true; return `fill="${to}"` }) }

export function Review() {
  const nav = useNav(); const s = useS(); const d = s.draft; const t = thing(s); const code = roomCode(s)
  const off = !s.online
  const [building, setBuilding] = useState(false)
  const who = whoComes(d, t.trade)
  const submit = () => { if (building) return; fx.tap(); setBuilding(true) } // the beaver builds for a moment, then the report is sent
  const doSubmit = () => {
    const id = String(2400 + Math.floor(Math.random() * 99))
    const all = allIssues(d), issueText = all.join(', ') || d.issue
    const tms = (d.times && d.times.length ? d.times : [{ d: d.dayIx, s: d.slotIx }]), e0 = earliest(tms)
    const r: Req = { id, item: d.place ? `${d.place}: ${issueText}` : t.item, issue: issueText, issues: all, times: tms.map(timeWords), note: d.note || undefined, trade: who.trade, where: d.place ? `${d.place} ${d.floor === 'G' ? 'G' : 'F' + d.floor}` : code, at: Date.now(), stage: 0, tech: who.tech[0], techTrade: who.tech[1], slot: SLOTS[e0.s][1], day: DAYS[e0.d].long, code: code4(), letIn: false, tries: 0, missed: 0 }
    store.set(x => ({ reqs: [r, ...x.reqs], current: id, draft: emptyDraft() }))
    pushAlert({ title: 'Report submitted', sub: `${r.item} · just now`, reqId: id, kind: 'sent' })
    fx.paper(); nav.go('sent', { tr: 'plane', p: { id } })
  }
  const [P, ids] = off
    ? ['226:762', { back: '226:819', ticket: '226:767', what: '226:778', photo: '226:779', edit: '226:780', place: '226:790', hostel: '226:791', when: '226:799', access: '226:808', door: '226:809', note: '226:810', btn: '226:822' }]
    : ['226:511', { back: '226:564', ticket: '226:516', what: '226:527', photo: '226:528', edit: '226:529', place: '226:539', hostel: '226:540', when: '226:548', access: '226:557', door: '226:558', note: '226:559', btn: '226:567' }]
  return (
    <F id={P} binds={{
      [ids.back]: back(nav), [ids.ticket]: { wrap: el => <Reveal dir="y" dur={0.7}>{el}</Reveal> },
      [ids.what]: { text: (() => { const all = [...(d.issues || []), ...(d.others || [])]; const first = all[0] || d.issue; const more = all.length > 1 ? ` +${all.length - 1}` : ''; return d.place ? first + more : cap(`${t.item.replace('Ceiling ', '')} ${first.toLowerCase()}`) + more })(), style: { width: 170, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
      [ids.photo]: { text: d.photo ? '1 photo' : 'No photo' }, [ids.edit]: { onClick: () => nav.go('doing') },
      [ids.place]: { text: d.place ? `${d.place}, ${d.floor === 'G' ? 'ground floor' : 'floor ' + d.floor}` : `Room ${code}` }, [ids.hostel]: { text: s.hostel },
      [ids.when]: { text: (d.times || []).length > 1 ? `${d.times.length} times to choose from` : `${DAYS[d.dayIx].long}, ${SLOTS[d.slotIx][1]}`, style: { width: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
      [ids.access]: { text: "I'll be in the room" }, [ids.door]: { text: `Door open for ${firstName(who.tech[0])}` },
      [ids.note]: { text: `${who.tech[0]}, the ${who.tech[1].toLowerCase()} for your floor, gets this after a supervisor checks it.${d.danger ? ' Marked dangerous: the warden is told now.' : ''}` },
      [ids.btn]: { onClick: submit },
    }} extra={<>{d.photo && <div style={{ position: 'absolute', left: 322, top: off ? 198 : 154, zIndex: 2 }}><Shot src={d.photo} w={38} h={38} r={9} rot={4} style={{ boxShadow: '2px 3px 0 #00224E' }} /></div>}{building && <BuildOverlay bg="#FFF1C7" ms={3200} scale={0.88} label="Sending your report" onDone={doSubmit} />}</>} />
  )
}

export function Sent() {
  const nav = useNav(); const s = useS(); const r = s.reqs.find(x => x.id === nav.params.id) || s.reqs[0]
  return (
    <F id="226:569" binds={{
      '226:570': { wrap: el => <Hop delay={0.5}>{el}</Hop> }, '226:576': { wrap: el => <PopIn delay={0.3}>{el}</PopIn> }, '226:580': { text: `#${r.id}` },
      '226:575': { text: nav.params.joined ? 'You joined it.' : 'Report sent.' },
      '226:581': { text: `The supervisor is giving it a quick check. ${firstName(r.tech)} gets it next, usually within 30 minutes.` },
      '226:582': { render: () => <PlaneFlight {...PLANE_SENT} delay={0.15} dur={1.7} /> },
      '226:592': { onClick: () => nav.go('detail', { p: { id: r.id } }) }, '226:591': { onClick: () => nav.reset('home') },
    }} />
  )
}

export function Dupe() {
  const nav = useNav(); const [busy, setBusy] = useState(false)
  const join = () => { if (!busy) setBusy(true) } // the spanner tightens, then you are added to the report
  const doJoin = () => {
    const id = '2398'
    store.set(x => ({ reqs: [{ id, item: 'Tap leaking', issue: 'Leaking', trade: 'Plumbing', where: 'Washroom G-East', at: Date.now() - 3 * 3600000, stage: 1, tech: 'Imran Ali', techTrade: 'Plumber', slot: slotRange(9), day: 'Today', code: code4(), letIn: false, tries: 0, missed: 0 }, ...x.reqs.filter(r => r.id !== id)], current: id, draft: emptyDraft() }))
    pushAlert({ title: 'You joined a report', sub: 'Tap leaking · just now', reqId: id, kind: 'sent' })
    nav.go('sent', { tr: 'plane', p: { id, joined: true } })
  }
  return <F id="226:715" binds={{ '226:756': back(nav), '226:720': { wrap: el => <PlaceDown>{el}</PlaceDown> }, '226:736': { wrap: el => <PopIn delay={0.4}>{el}</PopIn> }, '226:759': { onClick: join }, '226:753': { onClick: () => nav.go('review') } }} extra={busy ? <ToolOverlay kind="wrench" bg="#FFF1C7" label="Joining the report" onDone={doJoin} /> : undefined} />
}

/* ================= Follow it ================= */
const useReq = () => { const nav = useNav(); const s = useS(); return s.reqs.find(r => r.id === nav.params.id) || active(s) || s.reqs[0] }
export function Detail() {
  const nav = useNav(); const r = useReq(); const tf = firstName(r.tech)
  // when the job moves to its next step while this screen is open, a small token hops from the old marker to the new one
  // (also when the student comes back to this screen after the job has moved on since they last looked)
  const seenKey = 'align.seen.' + r.id
  const seen = (() => { try { const v = sessionStorage.getItem(seenKey); return v === null ? -1 : Number(v) } catch { return -1 } })()
  const prevStage = useRef(seen >= 0 ? seen : r.stage); const [hop, setHop] = useState<{ from: number; to: number } | null>(null)
  useEffect(() => {
    if (r.stage > prevStage.current) setHop({ from: prevStage.current, to: r.stage })
    prevStage.current = r.stage
    try { sessionStorage.setItem(seenKey, String(r.stage)) } catch { /* private window: no memory of the last look */ }
  }, [r.stage])
  if (r.part && r.stage < 3) return <Part />
  const centre = (i: number) => ({ x: 56, y: [152, 236, 320, 404, 488, 572][i] })
  const rows: [string, string, string | null, string | null][] = [
    ['226:833', '226:837', '226:838', 'Reported'], ['226:839', '226:843', '226:844', 'Verified'], ['226:845', '226:849', '226:850', 'Scheduled'],
    ['226:851', '226:853', '226:854', 'On the way'], ['226:855', '226:857', null, 'Visited'], ['226:858', '226:860', '226:861', 'Closed'],
  ]
  const subs = [stamp(r.at), stamp(r.at + 20 * 60000), `${tf} · ${r.day.toLowerCase()} ${r.slot}`, `${tf} leaves 10 minutes before`, '', 'with your code']
  const binds: Binds = {
    '226:869': back(nav), '226:829': { text: r.item, style: { width: 206, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, '226:830': { text: `${r.where} · reported ${ago(r.at)}`, style: { width: 206, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, '226:831': { wrap: el => <Reveal dir="y" dur={1}>{el}</Reveal> },
    '226:862': { onClick: () => nav.go('whatswrong', { p: { id: r.id } }) },
    '226:872': { disabled: r.stage < 4, onClick: () => nav.go('code', { p: { id: r.id } }), text: r.stage >= 5 ? 'See the receipt' : 'Confirm the fix' },
    '226:868': { text: r.stage >= 4 ? `${tf} is done. Check it, then give the code.` : 'Opens after the visit' },
  }
  if (r.stage >= 5) binds['226:872'] = { onClick: () => nav.go('closed', { p: { id: r.id } }), text: 'See the receipt' }
  const big = (id: string, i: number) => {
    const st = i < r.stage || r.stage === 5 ? 'done' : i === r.stage ? 'now' : 'todo'
    const file = st === 'done' ? '226:833' : st === 'now' ? '226:845' : '226:851'
    const size = st === 'now' ? 64 : 44; const own = i === 2 ? 64 : 44; const off = (own - size) / 2
    return { render: () => <PopIn key={st} delay={hop ? 1.15 : 0.1 + i * 0.08}><img src={figArt(file)} width={size} height={size} alt="" style={{ marginLeft: off, marginTop: off, display: 'block' }} /></PopIn>, style: { width: own, height: own } } as const
  }
  rows.forEach(([node, title, sub], i) => {
    binds[node] = big(node, i)
    const st = i < r.stage || r.stage === 5 ? 'done' : i === r.stage ? 'now' : 'todo'
    binds[title] = { style: { fontSize: st === 'now' ? 24 : 19, lineHeight: st === 'now' ? '28px' : '24px', opacity: st === 'todo' ? 0.5 : 1 } }
    if (sub) binds[sub] = { text: subs[i], style: { opacity: st === 'todo' ? 0.6 : 1 } }
  })
  const extra = <>
    <div style={{ position: 'absolute', left: 284, top: 4 }}><ScoreDial value={(r.stage + 1) / 6} cap={null} w={98} dots={6} dotR={4.8} delay={0.5} sound /></div>
    {hop && <StepHop key={hop.to} from={centre(hop.from)} to={centre(hop.to)} size={44} delay={0.5} onLand={() => { fx.success(); setHop(null) }}><img src={figArt('226:845')} width={44} height={44} alt="" style={{ display: 'block' }} /></StepHop>}
  </>
  return <F id="226:825" binds={binds} extra={extra} />
}

export function Near() {
  const nav = useNav(); const r = useReq(); const s = useS(); const tf = firstName(r.tech)
  const [min, setMin] = useState(10)
  useEffect(() => { const t = setInterval(() => setMin(m => Math.max(1, m - 1)), 6000); return () => clearInterval(t) }, [])
  return (
    <F id="226:874" binds={{
      '226:875': { text: String(min), style: { textAlign: 'right', width: 178 } }, '226:877': { text: `${tf} is nearby.` }, '226:878': { text: `${r.item.toLowerCase()} · ${roomCode(s)} · ${r.slot}` },
      '226:885': { text: roomCode(s) }, '226:886': { wrap: el => <WalkIn>{el}</WalkIn> }, '226:895': { text: r.tech[0] },
      '226:896': { text: r.tech }, '226:897': { text: `${r.techTrade} · 4.8 average` },
      '226:899': { text: 'You said you will be in the room.' },
      '226:907': { onClick: () => { fx.success(); nav.back() } }, '226:904': { onClick: () => { setReq(r.id, { missed: r.missed + 1 }); nav.go('missed', { p: { id: r.id } }) } },
    }} />
  )
}

export function Code() {
  const nav = useNav(); const r = useReq(); const s = useS(); const tf = firstName(r.tech); const t = Object.values(THINGS).find(x => x.item === r.item)
  return (
    <F id="226:909" binds={{
      '226:910': { wrap: el => <Settle>{el}</Settle> },
      '226:915': { text: `Is the ${r.item.toLowerCase().replace('ceiling ', '')} ${t?.verb || 'fixed'}?` },
      '226:916': { text: `${tf} says it is fixed. Check it first.` }, '226:918': { wrap: el => <PlaceDown>{el}</PlaceDown> },
      '226:923': { text: `${roomCode(s)} · ${r.item.toLowerCase()}` }, '226:924': { text: r.code.split('').join(' ') },
      '226:925': { text: `Give ${tf} this code only when you are happy.` },
      '226:927': { onClick: () => nav.go('whatswrong', { p: { id: r.id } }) },
    }} />
  )
}

export function Wrong() {
  const nav = useNav(); const r = useReq()
  const tried = (nav.params.tried as string) || '246?'
  return (
    <F id="226:1164" binds={{
      '226:1165': { wrap: el => <Flicker delay={0.15}>{el}</Flicker> },
      '226:1171': { text: tried[0] }, '226:1172': { text: tried[1] }, '226:1173': { text: tried[2] }, '226:1174': { text: tried[3] === r.code[3] ? '?' : tried[3] || '?' },
      '226:1179': { text: `${['Two', 'One', 'No'][Math.min(2, r.tries - 1)] || 'Two'} ${r.tries >= 2 ? 'try' : 'tries'} left. Ask for the 4 digits again.` },
      '226:1187': { onClick: () => nav.replace('code', { p: { id: r.id } }) }, '226:1184': { onClick: () => nav.back() },
    }} />
  )
}

const TAGS: [string, string, string][] = [['229:106', '229:110', 'On time'], ['229:111', '229:115', 'Polite'], ['229:116', '229:120', 'Cleaned up'], ['229:121', '229:125', 'Explained the fix'], ['229:126', '229:130', 'Quick']]
export function Rate() {
  const nav = useNav(); const r = useReq(); const s = useS()
  const [stars, setStars] = useState(r.stars || 0); const [tags, setTags] = useState<string[]>(r.tags || []); const [note, setNote] = useState('')
  const done = (save: boolean) => { if (save) setReq(r.id, { stars, tags, note }); fx.success(); if (save) peek({ mood: 'thumbs', say: 'Thank you!', sub: `${firstName(r.tech)} will see your stars.` }); nav.replace('closed', { p: { id: r.id } }) }
  const binds: Binds = {
    '229:79': { wrap: el => <Settle>{el}</Settle> }, '229:85': { text: `${r.tech} · ${r.item.toLowerCase()} · ${roomCode(s)}` },
    '229:143': { render: () => <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Anything we should know?" aria-label="Say more" style={{ width: '100%', height: '100%', border: '2px solid #00224E', borderRadius: 16, background: '#FFFFFF', padding: '12px 16px', fontFamily: '"M PLUS Rounded 1c", sans-serif', fontSize: 15, lineHeight: '22px', color: '#00224E', resize: 'none', outline: 'none' }} /> },
    '229:141': { onClick: () => done(true), disabled: !stars }, '229:138': { onClick: () => done(false) },
  }
  ;['229:86', '229:90', '229:94', '229:98', '229:102'].forEach((id, i) => {
    binds[id] = { onClick: () => { fx.star(i); setStars(i + 1) }, label: `${i + 1} star${i ? 's' : ''}`, render: () => <PopIn delay={0}><img key={String(i < stars)} src={figArt(i < stars ? '229:86' : '229:102')} width={64} height={64} alt="" /></PopIn> }
  })
  for (const [chip, label, t] of TAGS) {
    const on = tags.includes(t)
    binds[chip] = { onClick: () => { on ? fx.deselect() : fx.select(); setTags(x => on ? x.filter(y => y !== t) : [...x, t]) }, label: t, render: (n) => <div style={{ width: n.w, height: 50, borderRadius: 25, border: '2.5px solid #00224E', background: on ? '#00224E' : '#FFFBF3', boxShadow: '0 3px 0 #00224E', transition: 'background 90ms' }} /> }
    binds[label] = { style: { color: on ? '#FFFBF3' : '#00224E', pointerEvents: 'none' } }
  }
  return <F id="229:78" binds={binds} />
}

export function Closed() {
  const nav = useNav(); const r = useReq(); const tf = firstName(r.tech)
  const stars = r.stars || 0
  const binds: Binds = {
    '226:978': back(nav), '226:934': { wrap: el => <PlaceDown>{el}</PlaceDown> },
    '226:941': { text: r.item }, '226:942': { text: `${r.where} · ${stamp(r.closedAt || Date.now())}` }, '226:943': { text: `Fixed by ${tf}` },
    '226:944': { text: r.fix || 'Fixed and tested before closing.' }, '226:945': { wrap: el => <StampDown>{el}</StampDown> },
    '226:970': { text: r.note ? `"${r.note}"` : r.tags?.length ? r.tags.join(' · ') : stars ? '' : 'Not rated yet. Tap a star.' },
    '226:981': { onClick: () => { store.set({ draft: emptyDraft(), current: undefined }); nav.reset('home', { p: { pick: true } }) } },
    '226:975': { onClick: () => nav.go('whatswrong', { p: { id: r.id } }) },
  }
  ;['226:950', '226:954', '226:958', '226:962', '226:966'].forEach((id, i) => {
    binds[id] = { render: () => <PopIn delay={0.8 + i * 0.08}><img src={figArt(i < stars ? '226:950' : '226:966')} width={52} height={52} alt="" /></PopIn>, onClick: () => nav.go('rate', { p: { id: r.id } }), label: 'Rate the visit' }
  })
  return <F id="226:929" binds={binds} />
}

export function Part() {
  const nav = useNav(); const r = useReq()
  const eta = new Date(Date.now() + 2 * 86400000)
  return (
    <F id="226:1054" binds={{
      '226:1095': back(nav), '226:1058': { text: r.item }, '226:1059': { text: `${r.where} · 3 students · ${ago(r.at)}` },
      '226:1060': { wrap: el => <Reveal dur={1.4} delay={0.2}>{el}</Reveal> },
      '226:1075': { text: eta.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase() }, '226:1076': { text: String(eta.getDate()) }, '226:1077': { text: eta.toLocaleDateString('en-IN', { month: 'short' }) },
      '226:1079': { text: `A ${r.part || 'part'} is on its way. We will book your slot the moment it arrives.` },
      '226:1081': { wrap: el => <Reveal dir="y" dur={0.8} delay={0.4}>{el}</Reveal> },
      '226:1091': { text: `${firstName(r.tech)} checked the fitting` }, '226:1093': { text: `Verified, sent to ${firstName(r.tech)}` },
    }} />
  )
}

export function Missed() {
  const nav = useNav(); const r = useReq(); const s = useS(); const tf = firstName(r.tech)
  const [pick, setPick] = useState(0); const [busy, setBusy] = useState(false)
  const slotA = ['226:1124', '226:1130', '226:1136']
  const book = () => { setReq(r.id, { day: opts[pick][0], slot: slotRange(optSlot[pick]), letIn: false, stage: 2 }); fx.success(); peek({ mood: 'point', say: 'Booked!', sub: `${opts[pick][0]}, ${opts[pick][1]}` }); nav.replace('detail', { p: { id: r.id } }) }
  const optSlot = [2, 9, 2] // 11:00 AM tomorrow, 2:30 PM tomorrow, 11:00 AM the day after
  const opts: [string, string][] = [[`${DAYS[1].long.split(',')[0]} ${DAYS[1].num}`, `${slotShort(2)} AM`], [`${DAYS[1].long.split(',')[0]} ${DAYS[1].num}`, `${slotShort(9)} PM`], [`${DAYS[2].label} ${DAYS[2].num}`, `${slotShort(2)} AM`]]
  const texts: [string, string][] = [['226:1128', '226:1129'], ['226:1134', '226:1135'], ['226:1140', '226:1141']]
  const binds: Binds = {
    '226:1155': back(nav), '226:1110': { wrap: el => <Slap delay={0.4}>{el}</Slap> },
    '226:1115': { text: `${tf} came at 2:40.\nThe door was locked.`, style: { pointerEvents: 'none' } },
    '226:1116': { wrap: el => <PopIn delay={0.9}>{el}</PopIn> }, '226:1119': r.missed >= 2 ? { art: '226:1116', wrap: el => <PopIn delay={1}>{el}</PopIn> } : { wrap: el => <PopIn delay={1}>{el}</PopIn> },
    '226:1122': { text: `${Math.max(1, r.missed)} of 2` },
    '226:1142': { hide: true }, '226:1148': { hide: true }, '226:1149': { hide: true },
    '226:1158': { onClick: () => { if (!busy) setBusy(true) } },
  }
  slotA.forEach((id, i) => {
    binds[id] = { onClick: () => { fx.tick(i); setPick(i) }, label: `${opts[i][0]} ${opts[i][1]}`, render: () => <img src={figArt(i === pick ? '226:1124' : '226:1130')} width={112} height={95} alt="" /> }
    binds[texts[i][0]] = { text: opts[i][0], style: { pointerEvents: 'none' } }; binds[texts[i][1]] = { text: opts[i][1], style: { pointerEvents: 'none' } }
  })
  return <F id="226:1098" binds={binds} extra={busy ? <ToolOverlay kind="wrench" bg="#FFF1C7" label="Booking your slot" onDone={book} /> : undefined} />
}

export function WhatsWrong() {
  const nav = useNav(); const r = useReq()
  const [pick, setPick] = useState(0); const [text, setText] = useState(''); const [photo, setPhoto] = useState<string | false>(false)
  const opts: [string, string, string][] = [['226:1194', '226:1204', 'Still not working'], ['226:1229', '226:1205', 'Fixed badly'], ['226:1206', '226:1212', 'Nobody came']]
  const [busy, setBusy] = useState(false)
  const send = () => { if (!busy) setBusy(true) } // the spanner tightens, then the report goes to the supervisor
  const doSend = () => {
    setReq(r.id, { stage: 1, reopened: true, closedAt: undefined })
    pushAlert({ title: 'Sent to the supervisor', sub: `${r.item} · ${opts[pick][2].toLowerCase()}`, reqId: r.id, kind: 'checked' })
    fx.success(); peek({ mood: 'think', say: 'The supervisor has it.', sub: 'You will hear back today.' }); nav.reset('home')
  }
  const binds: Binds = {
    '226:1238': back(nav), '226:1213': { hide: true },
    '226:1243': { render: () => <textarea value={text} onChange={e => setText(e.target.value)} aria-label="Tell the supervisor what you saw" style={{ width: '100%', height: '100%', border: '2px solid #00224E', borderRadius: 16, background: '#FFFFFF', padding: '14px 16px', fontFamily: '"M PLUS Rounded 1c", sans-serif', fontSize: 16, lineHeight: '22px', color: '#00224E', resize: 'none', outline: 'none' }} /> },
    '226:1218': { hide: !!text, style: { pointerEvents: 'none' } },
    '226:1219': { onClick: () => { takePhoto().then(p => { if (p) { fx.shutter(); setPhoto(p) } }) }, label: photo ? 'Take it again' : 'Add a photo', render: photo ? () => <Shot src={photo} w={90} h={90} r={14} rot={-3} /> : undefined, wrap: photo ? undefined : (el => <div style={{ opacity: 0.85 }}>{el}</div>) },
    '226:1223': { text: photo ? 'Photo added · tap to take it again' : 'Add a photo' },
    '226:1241': { onClick: send },
  }
  opts.forEach(([art, label, t], i) => {
    binds[art] = { onClick: () => { fx.select(); setPick(i) }, label: t, render: () => <SvgMod id={art} mod={svg => setFill(svg, 0, i === pick ? '#FFD265' : '#FFFBF3')} /> }
    binds[label] = { style: { pointerEvents: 'none' } }
  })
  return <F id="226:1189" binds={binds} extra={busy ? <ToolOverlay kind="wrench" bg="#FFF1C7" label="Sending to the supervisor" onDone={doSend} /> : undefined} />
}

/* ================= Alerts, profile, errors ================= */
const SLIP: [string, string, string][] = [['226:1253', '226:1261', '226:1262'], ['226:1263', '226:1271', '226:1272'], ['226:1274', '226:1282', '226:1283'], ['226:1284', '226:1291', '226:1292']]
export function Alerts() {
  const nav = useNav(); const s = useS()
  if (!s.alerts.length) return <F id="226:1454" binds={{ '226:1467': back(nav), '226:1459': { wrap: el => <Settle>{el}</Settle> } }} />
  const list = s.alerts.slice(0, 4)
  const binds: Binds = { '226:1300': back(nav), '226:1252': { text: 'Latest' }, '226:1273': { hide: list.length < 3, text: 'Earlier' }, '226:1293': { text: "You're all caught up" } }
  SLIP.forEach(([art, t, sub], i) => {
    const a = list[i]
    if (!a) { binds[art] = binds[t] = binds[sub] = { hide: true }; if (i === 0) { binds['226:1294'] = binds['226:1296'] = { hide: true } } return }
    const open = () => a.reqId && nav.go(a.kind === 'near' ? 'near' : 'detail', { p: { id: a.reqId } })
    binds[art] = { onClick: open, label: a.title, wrap: el => <PlaceDown delay={0.08 * i}>{el}</PlaceDown> }
    binds[t] = { text: a.title, style: { pointerEvents: 'none' } }; binds[sub] = { text: `${a.sub.split(' · ')[0]} · ${ago(a.at)}`, style: { pointerEvents: 'none' } }
  })
  binds['226:1296'] = { wrap: el => <PopIn delay={0.4}>{el}</PopIn> }
  return <F id="226:1247" binds={binds} />
}

export function Profile() {
  const nav = useNav(); const s = useS()
  const row = (t: string, a: string, go: () => void): Binds => ({ [t]: { onClick: go }, [a]: { onClick: go, label: 'Open' } })
  return (
    <F id="226:1303" binds={{
      '226:1355': back(nav), ...swingAll(['226:1308', '226:1318', '226:1319', '226:1320', '226:1321'], D['226:1303'], 195, 60),
      '226:1318': { text: initial(s.name) }, '226:1319': { text: s.name || 'Student' }, '226:1320': { text: s.hostel }, '226:1321': { text: roomCode(s) },
      ...row('226:1324', '226:1325', () => nav.go('allow')),
      ...row('226:1329', '226:1330', () => window.open('https://www.iitr.ac.in', '_blank')),
      ...row('226:1334', '226:1335', () => nav.go('where', { p: { edit: true } })),
      ...row('226:1339', '226:1340', () => nav.go('hours', { p: { edit: true } })),
      ...row('226:1345', '226:1346', () => { location.href = 'mailto:hostel.office@iitr.ac.in?subject=Privacy%20concern' }),
      ...row('226:1350', '226:1351', () => { location.href = 'tel:+911332285311' }),
    }} />
  )
}

export function ErrorScreen({ kind }: { kind: 'offline' | 'e500' | 'expired' | 'e404' }) {
  const nav = useNav()
  if (kind === 'offline') return <F id="227:328" binds={{ ...hide2('227:338', '227:339'), '227:341': { onClick: () => { store.set({ online: true }); nav.back() } }, '227:343': { onClick: () => nav.reset('home') } }} extra={<Hanging {...HANG} title="No connection" sub="Reconnect to get the latest updates." />} />
  if (kind === 'e500') return <F id="227:344" binds={{ ...hide2('227:353', '227:354'), '227:356': { onClick: () => nav.back() }, '227:358': { onClick: () => { location.href = 'tel:+911332285311' } } }} extra={<Hanging {...HANG} title="That was on us." sub="Nothing you reported is lost." />} />
  if (kind === 'expired') return <F id="227:359" binds={{ ...hide2('227:368', '227:369'), '227:371': { onClick: () => { store.set({ signedIn: false }); nav.reset('signin') } } }} extra={<Hanging {...HANG} title="Please sign in again." />} />
  return <F id="227:373" binds={{ ...hide2('227:382', '227:383'), '227:385': { onClick: () => nav.reset('home') } }} extra={<Hanging {...HANG} title="We cannot find that." />} />
}

export const ALL: Record<Screen, () => React.ReactElement> = {
  welcome: Welcome, signin: SignIn, verify: Verify, isyou: IsYou, where: Where, hours: Hours, allow: Allow, homeEmpty: HomeEmpty, home: Home,
  doing: Doing, safety: Safety, place: Place, slot: Slot, review: Review, sent: Sent, dupe: Dupe, detail: Detail, near: Near, code: Code, wrong: Wrong,
  rate: Rate, closed: Closed, part: Part, missed: Missed, whatswrong: WhatsWrong, alerts: Alerts, profile: Profile,
  offline: () => <ErrorScreen kind="offline" />, e500: () => <ErrorScreen kind="e500" />, expired: () => <ErrorScreen kind="expired" />, e404: () => <ErrorScreen kind="e404" />,
}
export { useMemo }
