/* Student app state. Everything is mock and local: type any institute email, any code, any room. */
import { createStore, H, D } from '../data/iitr'

export type Stage = 0 | 1 | 2 | 3 | 4 | 5 // reported, verified, scheduled, on the way, visited, closed
export type Req = {
  id: string; item: string; issue: string; trade: string; where: string; at: number; stage: Stage
  tech: string; techTrade: string; slot: string; day: string; code: string; part?: string; letIn: boolean
  stars?: number; tags?: string[]; note?: string; photo?: string; issues?: string[]; times?: string[]; fix?: string; closedAt?: number; tries: number; missed: number; reopened?: boolean
}
export type Alert = { id: string; title: string; sub: string; at: number; reqId?: string; kind: 'near' | 'photo' | 'part' | 'sent' | 'closed' | 'checked' }
export type Draft = { item: string; trade: string; issue: string; issues: string[]; photo: string | false; place: string; floor: string; dayIx: number; slotIx: number; letIn: boolean; danger: boolean; dupe?: string
  others: string[]; note: string; times: { d: number; s: number }[] }

export type State = {
  signedIn: boolean; email: string; name: string; hostel: string; block: string; floor: string; room: string
  hours: boolean[][]; alertsOn: boolean; online: boolean
  reqs: Req[]; alerts: Alert[]; draft: Draft; current?: string
}

const n = Date.now()
/* Default usual free hours, exactly as drawn in the Figma (Mon..Sun x Morning, Afternoon, Evening, Night). */
const HOURS = [[0, 0, 1, 0], [0, 0, 1, 1], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 1, 1], [1, 1, 1, 0], [0, 1, 1, 0]].map(r => r.map(Boolean))
export const emptyDraft = (): Draft => ({ item: '', trade: '', issue: '', issues: [], photo: false, place: '', floor: '', dayIx: 0, slotIx: 0, letIn: false, danger: false, others: [], note: '', times: [] })

const seed = (): State => ({
  signedIn: false, email: '', name: '', hostel: 'Himalaya Bhawan', block: 'B', floor: 'G', room: '04',
  hours: HOURS, alertsOn: false, online: true, draft: emptyDraft(),
  reqs: [
    { id: '2391', item: 'Tube light', issue: 'Flickering', trade: 'Electrical', where: 'Corridor F2', at: n - 4 * D, stage: 2, tech: 'Ravi Kumar', techTrade: 'Electrician', slot: '11:00 to 11:30 AM', day: 'Thu 1 Oct', code: '5182', part: 'tube light choke', letIn: true, tries: 0, missed: 0 },
  ],
  alerts: [],
})
export const store = createStore<State>('align.student.fig.v3', seed)

export const roomCode = (s: Pick<State, 'block' | 'floor' | 'room'>) => `${(s.block || 'B').toUpperCase()}${(s.floor || 'G').toUpperCase()}${(s.room || '04').padStart(2, '0')}`
export const firstName = (name: string) => (name || 'Siddhi').split(' ')[0]
export const initial = (name: string) => (name || 'S').trim()[0]?.toUpperCase() || 'S'

/** "siddhi_s@design.iitr.ac.in" or "siddhi.sharma@..." -> "Siddhi Sharma" (falls back to the first part). */
export function nameFrom(email: string) {
  const local = email.split('@')[0] || ''
  const parts = local.split(/[._-]+/).filter(Boolean).filter(p => !/^\d+$/.test(p))
  if (!parts.length) return 'Student'
  const cap = (p: string) => p[0].toUpperCase() + p.slice(1).toLowerCase()
  if (parts.length === 1) return cap(parts[0])
  const last = parts[parts.length - 1]
  return `${cap(parts[0])} ${last.length === 1 ? last.toUpperCase() + '.' : cap(last)}`
}
/** Institute email: name@department.iitr.ac.in (department optional). */
export const IITR = /^[a-z0-9][a-z0-9._-]*@([a-z0-9-]+\.)?iitr\.ac\.in$/i
export const deptOf = (email: string) => { const m = email.match(/@([a-z0-9-]+)\.iitr\.ac\.in$/i); return m ? m[1] : '' }

export const code4 = () => String(1000 + Math.floor(Math.random() * 9000))
export const active = (s: State) => s.reqs.find(r => r.id === s.current) || s.reqs.find(r => r.stage < 5 && !r.part) || undefined
export const pushAlert = (a: Omit<Alert, 'id' | 'at'>) => store.set(s => ({ alerts: [{ ...a, id: String(Math.random()), at: Date.now() }, ...s.alerts] }))
export const setReq = (id: string, p: Partial<Req>) => store.set(s => ({ reqs: s.reqs.map(r => (r.id === id ? { ...r, ...p } : r)) }))
export const ago = (t: number) => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`; const d = Math.round(h / 24); return d === 1 ? 'yesterday' : `${d} days ago` }
export const stamp = (t: number) => new Date(t).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).replace(',', ' ·').replace(' am', ' AM').replace(' pm', ' PM')
export { H, D }
/** Technicians work 10 AM to 6 PM. A visit time outside that is moved to the end of the last working day. */
export const workTime = (t = Date.now()) => { const d = new Date(t); const h = d.getHours() + d.getMinutes() / 60; if (h >= 10 && h < 18) return t; if (h < 10) d.setDate(d.getDate() - 1); d.setHours(17, 48, 0, 0); return d.getTime() }
