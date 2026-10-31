import { useEffect, useState } from 'react'
import { Phone, Transition, useStack } from '../components/nav'
import * as G from './getin'
import * as R from './report'
import * as F from './follow'
import * as M from './misc'

export type Screen = 'welcome' | 'signin' | 'signinErr' | 'verify' | 'isyou' | 'where' | 'hours' | 'alerts' | 'homeEmpty' | 'homeActive' | 'pick' | 'safety' | 'where2' | 'dupe' | 'slot' | 'check' | 'sent'
  | 'track' | 'nearby' | 'ticket' | 'wrong' | 'part' | 'missed' | 'rate' | 'closed' | 'whats' | 'alerts1' | 'alerts2' | 'profile' | 'eOffline' | 'eServer' | 'eSession' | 'eNotFound'

export type Ctx = {
  go: (s: Screen) => void; back: () => void; reset: (s: Screen) => void; online: boolean
  email: string; setEmail: (e: string) => void
  loc: { block: string; floor: string; room: string }; setLoc: (l: { block: string; floor: string; room: string }) => void
  hours: Set<number>; toggleHour: (i: number) => void
  draft: Record<string, any>; setDraft: (d: Record<string, any>) => void
  sent: string; setSent: (s: string) => void
  rating: { stars: number; note: string }; setRating: (r: { stars: number; note: string }) => void
}

export default function App() {
  const nav = useStack<Screen>((new URLSearchParams(location.search).get('s') as Screen) || 'welcome')
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => { const u = () => setOnline(true), d = () => setOnline(false); addEventListener('online', u); addEventListener('offline', d); return () => { removeEventListener('online', u); removeEventListener('offline', d) } }, [])
  const [email, setEmail] = useState('')
  const [loc, setLoc] = useState({ block: 'B', floor: 'G', room: '04' })
  const [hours, setHours] = useState(new Set([2, 6, 7, 9, 10, 14, 17, 18, 19, 21, 22, 25, 26]))
  const [draft, setDraft] = useState<Record<string, any>>({})
  const [sent, setSent] = useState('')
  const [rating, setRating] = useState({ stars: 4, note: '' })
  const c: Ctx = {
    go: nav.go, back: nav.back, reset: nav.reset, online, email, setEmail, loc, setLoc, hours,
    toggleHour: i => setHours(h => { const n = new Set(h); n.has(i) ? n.delete(i) : n.add(i); return n }),
    draft, setDraft, sent, setSent, rating, setRating,
  }
  const s = nav.screen
  const view = {
    welcome: <G.Welcome c={c} />, signin: <G.SignIn c={c} />, signinErr: <G.SignIn c={c} error />, verify: <G.Verify c={c} />, isyou: <G.IsYou c={c} />,
    where: <G.Where c={c} />, hours: <G.Hours c={c} />, alerts: <G.AllowAlerts c={c} />, homeEmpty: <G.HomeEmpty c={c} />, homeActive: <R.HomeActive c={c} />,
    pick: <R.Pick c={c} />, safety: <R.Safety c={c} />, where2: <R.Where2 c={c} />, dupe: <R.Dupe c={c} />, slot: <R.Slot c={c} />, check: <R.Check c={c} />, sent: <R.Sent c={c} />,
    track: <F.Track c={c} />, nearby: <F.Nearby c={c} />, ticket: <F.Ticket c={c} />, wrong: <F.Wrong c={c} />, part: <F.Part c={c} />, missed: <F.Missed c={c} />,
    rate: <F.Rate c={c} />, closed: <F.Closed c={c} />, whats: <F.Whats c={c} />,
    alerts1: <M.Alerts c={c} />, alerts2: <M.Alerts c={c} />, profile: <M.Profile c={c} />,
    eOffline: <M.Errors c={c} kind="offline" />, eServer: <M.Errors c={c} kind="server" />, eSession: <M.Errors c={c} kind="session" />, eNotFound: <M.Errors c={c} kind="notfound" />,
  }[s]
  return <Phone><Transition id={s} dir={nav.dir} mode="slide">{view}</Transition></Phone>
}
