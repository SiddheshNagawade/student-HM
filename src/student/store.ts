/* Student app state. Everything you type is kept on this phone (localStorage).
   The supervisor and technician are simulated: after you report, the request moves through the
   real stages on its own, and the Demo panel lets you jump to any moment. */
import { createStore, D, H, TECHS, Trade, code4 } from '../data/iitr'

export type Status = 'reported' | 'verified' | 'scheduled' | 'on_way' | 'visiting' | 'closed' | 'waiting_part' | 'missed' | 'disputed'
export type Ev = { s: Status | 'note'; at: number; text: string }
export type Req = {
  id: string; trade: Trade; item: string; itemLabel: string; issue: string; place: string; spot: string; note: string; photo: boolean; urgent: boolean
  day: string; time: string; access: 'in' | 'warden'; status: Status; createdAt: number; techId: string; code: string; history: Ev[]
  joined: number; missed: number; rating?: number; tags?: string[]; review?: string; part?: string; fixNote?: string
}
export type Alert = { id: string; at: number; title: string; body: string; kind: 'near' | 'done' | 'check' | 'part' | 'missed' | 'info'; reqId?: string; read: boolean }
export type Draft = Partial<Pick<Req, 'trade' | 'item' | 'itemLabel' | 'issue' | 'place' | 'spot' | 'note' | 'photo' | 'urgent' | 'day' | 'time' | 'access'>> & { joinId?: string }

export type State = {
  signedIn: boolean; onboarded: boolean; email: string; name: string; dept: string
  bhawan: string; block: string; floor: string; room: string; hours: number[]; alertsOn: boolean
  reqs: Req[]; alerts: Alert[]; draft: Draft; otp: string; eta: number
  others: Req[]
}

const now = Date.now()
const seed = (): State => ({
  signedIn: false, onboarded: false, email: '', name: 'Siddhi Sharma', dept: 'Architecture & Planning',
  bhawan: 'Himalaya Bhawan', block: 'B', floor: '1', room: '04', hours: [2, 3, 6, 7, 10, 11, 14, 15, 18, 19, 22, 23, 26, 27], alertsOn: true, otp: '', eta: 10,
  draft: {},
  reqs: [
    {
      id: '2391', trade: 'Electrical', item: 'light', itemLabel: 'Tube light', issue: 'Flickering', place: 'corridor', spot: 'Corridor, first floor', note: 'Near the water cooler', photo: false, urgent: false,
      day: 'Thu', time: '6:00 PM', access: 'in', status: 'waiting_part', createdAt: now - 4 * D, techId: 't2', code: code4(), joined: 3, missed: 0, part: 'Tube light choke (40 W)',
      history: [
        { s: 'reported', at: now - 4 * D, text: 'You reported it' }, { s: 'verified', at: now - 4 * D + 20 * 60e3, text: 'Checked by the Bhawan supervisor' },
        { s: 'scheduled', at: now - 3 * D, text: 'Suresh Pal checked the fitting' }, { s: 'waiting_part', at: now - 2 * D, text: 'Choke ordered from the IWD store' },
      ],
    },
    {
      id: '2344', trade: 'Carpentry', item: 'chair', itemLabel: 'Chair', issue: 'Leg loose', place: 'room', spot: 'My room', note: '', photo: true, urgent: false,
      day: 'Mon', time: '7:00 PM', access: 'in', status: 'closed', createdAt: now - 9 * D, techId: 't4', code: '5102', joined: 0, missed: 0, rating: 5, tags: ['On time', 'Explained the fix'],
      fixNote: 'Re-glued the joint and added two screws to the back leg.',
      history: [{ s: 'reported', at: now - 9 * D, text: 'You reported it' }, { s: 'verified', at: now - 9 * D + H, text: 'Checked by the Bhawan supervisor' }, { s: 'scheduled', at: now - 8 * D, text: 'Deepak Saini assigned' }, { s: 'closed', at: now - 7 * D, text: 'Closed with your code' }],
    },
  ],
  others: [
    {
      id: '2398', trade: 'Plumbing', item: 'tap', itemLabel: 'Tap', issue: 'Leaking', place: 'washroom', spot: 'Washroom, first floor (east)', note: 'Second tap from the door', photo: true, urgent: false,
      day: 'Today', time: '6:30 PM', access: 'in', status: 'scheduled', createdAt: now - 5 * H, techId: 't3', code: code4(), joined: 2, missed: 0,
      history: [{ s: 'reported', at: now - 5 * H, text: 'Reported by a student on your floor' }, { s: 'verified', at: now - 4 * H, text: 'Checked by the Bhawan supervisor' }, { s: 'scheduled', at: now - 3 * H, text: 'Imran Ali booked for 6:30 PM' }],
    },
    {
      id: '2399', trade: 'Electrical', item: 'light', itemLabel: 'Tube light', issue: 'Not turning on', place: 'corridor', spot: 'Corridor, first floor', note: '', photo: false, urgent: false,
      day: 'Today', time: '7:00 PM', access: 'in', status: 'verified', createdAt: now - 2 * H, techId: 't2', code: code4(), joined: 1, missed: 0,
      history: [{ s: 'reported', at: now - 2 * H, text: 'Reported by a student on your floor' }],
    },
  ],
  alerts: [
    { id: 'a1', at: now - 2 * D, title: 'Waiting on a part', body: 'Tube light choke ordered. We will book a visit when it arrives.', kind: 'part', reqId: '2391', read: true },
    { id: 'a2', at: now - 7 * D, title: 'Chair fixed', body: 'Deepak closed the job with your code. Thanks for rating.', kind: 'done', reqId: '2344', read: true },
  ],
})

export const store = createStore<State>('align.student.v2', seed)
export const S = store.get
export const roomCode = (s: Pick<State, 'block' | 'floor' | 'room'>) => `${s.block}-${s.floor === 'G' ? '0' : s.floor}${(s.room || '0').padStart(2, '0')}`.toUpperCase()
export const techOf = (r: Req) => TECHS.find(t => t.id === r.techId) || TECHS[0]
export const ACTIVE: Status[] = ['reported', 'verified', 'scheduled', 'on_way', 'visiting', 'waiting_part', 'missed', 'disputed']
export const isActive = (r: Req) => ACTIVE.includes(r.status)

export const STAGES = ['Reported', 'Verified', 'Scheduled', 'On the way', 'Fixed']
export const stageIndex = (s: Status) => ({ reported: 0, verified: 1, scheduled: 2, waiting_part: 2, missed: 2, disputed: 1, on_way: 3, visiting: 3, closed: 4 } as Record<Status, number>)[s]
export const STATUS_LABEL: Record<Status, string> = {
  reported: 'Being checked', verified: 'Finding a slot', scheduled: 'Visit booked', on_way: 'On the way', visiting: 'Technician here',
  closed: 'Fixed', waiting_part: 'Waiting on a part', missed: 'Visit missed', disputed: 'Reopened',
}

export function update(id: string, p: Partial<Req>, ev?: Omit<Ev, 'at'>) {
  store.set(s => ({ reqs: s.reqs.map(r => (r.id === id ? { ...r, ...p, history: ev ? [...r.history, { ...ev, at: Date.now() }] : r.history } : r)) }))
}
export function pushAlert(a: Omit<Alert, 'id' | 'at' | 'read'>) {
  store.set(s => ({ alerts: [{ ...a, id: 'a' + Date.now(), at: Date.now(), read: false }, ...s.alerts] }))
}

export function submitDraft(): Req {
  const s = S(); const d = s.draft
  const tech = TECHS.find(t => t.trade === d.trade) || TECHS[0]
  const id = String(2400 + s.reqs.length + Math.floor(Math.random() * 20))
  const r: Req = {
    id, trade: d.trade || 'Electrical', item: d.item || 'fan', itemLabel: d.itemLabel || 'Ceiling fan', issue: d.issue || 'Not spinning', place: d.place || 'room', spot: d.spot || 'My room',
    note: d.note || '', photo: !!d.photo, urgent: !!d.urgent, day: d.day || 'Today', time: d.time || '8:30 PM', access: d.access || 'in',
    status: 'reported', createdAt: Date.now(), techId: tech.id, code: code4(), joined: 0, missed: 0,
    history: [{ s: 'reported', at: Date.now(), text: d.urgent ? 'You reported it as dangerous. The warden was alerted.' : 'You reported it' }],
  }
  store.set(st => ({ reqs: [r, ...st.reqs], draft: {} }))
  return r
}
/** Join another student's report of the same shared problem: it becomes yours to follow too. */
export function joinRequest(id: string): Req | undefined {
  const o = S().others.find(r => r.id === id); if (!o) return
  const mine: Req = { ...o, joined: o.joined + 1, history: [...o.history, { s: 'note', at: Date.now(), text: 'You joined this report. Your free hours were added.' }] }
  store.set(s => ({ reqs: [mine, ...s.reqs.filter(r => r.id !== id)], others: s.others.filter(r => r.id !== id), draft: {} }))
  return mine
}
