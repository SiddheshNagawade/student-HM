/* Mock world for the ALIGN demo, modelled on IIT Roorkee.
   Hostels are "Bhawans". Boys': Azad, Cautley, Ganga, Govind, Jawahar, Radhakrishnan, Rajendra, Rajiv,
   Ravindra, Malviya. Girls': Sarojini, Kasturba, Himalaya, Indira. Co-ed: Vigyan Kunj.
   Repairs are done by the Institute Works Department (IWD, under Estate & Works): Electrical and Civil
   sections (civil covers plumbing, carpentry and masonry). Each Bhawan has a supervisor who checks
   complaints before they reach IWD. Institute email: name@<dept>.iitr.ac.in */
import { useSyncExternalStore } from 'react'

export const BHAWANS = [
  { name: 'Himalaya Bhawan', kind: 'Girls', blocks: ['A', 'B', 'C'] },
  { name: 'Sarojini Bhawan', kind: 'Girls', blocks: ['A', 'B', 'C', 'D'] },
  { name: 'Kasturba Bhawan', kind: 'Girls', blocks: ['A', 'B'] },
  { name: 'Indira Bhawan', kind: 'Girls', blocks: ['A', 'B'] },
  { name: 'Rajendra Bhawan', kind: 'Boys', blocks: ['A', 'B', 'C', 'D'] },
  { name: 'Govind Bhawan', kind: 'Boys', blocks: ['A', 'B', 'C'] },
  { name: 'Ganga Bhawan', kind: 'Boys', blocks: ['A', 'B', 'C', 'D', 'E'] },
  { name: 'Cautley Bhawan', kind: 'Boys', blocks: ['A', 'B', 'C'] },
  { name: 'Azad Bhawan', kind: 'Boys', blocks: ['A', 'B', 'C'] },
  { name: 'Jawahar Bhawan', kind: 'Boys', blocks: ['A', 'B', 'C'] },
  { name: 'Radhakrishnan Bhawan', kind: 'Boys', blocks: ['A', 'B', 'C'] },
  { name: 'Rajiv Bhawan', kind: 'Boys', blocks: ['A', 'B', 'C', 'D'] },
  { name: 'Ravindra Bhawan', kind: 'Boys', blocks: ['A', 'B', 'C'] },
  { name: 'Malviya Bhawan', kind: 'Boys', blocks: ['A', 'B'] },
  { name: 'Vigyan Kunj', kind: 'Co-ed', blocks: ['A', 'B', 'C', 'D'] },
] as const
export type BhawanName = typeof BHAWANS[number]['name']

export const DEPTS: Record<string, string> = {
  ar: 'Architecture & Planning', ce: 'Civil Engineering', cs: 'Computer Science', ee: 'Electrical Engineering', me: 'Mechanical & Industrial',
  ch: 'Chemical Engineering', ec: 'Electronics & Communication', bt: 'Biosciences & Bioengineering', es: 'Earth Sciences', hs: 'Humanities & Social Sciences',
  ma: 'Mathematics', ph: 'Physics', mt: 'Metallurgical & Materials', pp: 'Paper Technology', ed: 'Design',
}
export const IITR_EMAIL = /^[a-z0-9._-]+@([a-z]{2,4}\.)?iitr\.ac\.in$/i
export const deptOf = (email: string) => { const m = email.toLowerCase().match(/@([a-z]{2,4})\.iitr\.ac\.in$/); return m ? DEPTS[m[1]] : undefined }
export const nameFromEmail = (email: string) => {
  const u = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim()
  return u ? u.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : 'Student'
}

export type Trade = 'Electrical' | 'Plumbing' | 'Carpentry' | 'Civil'
export const TRADE_INFO: Record<Trade, { hi: string; section: string; icon: string }> = {
  Electrical: { hi: 'बिजली', section: 'IWD Electrical', icon: 'zap' },
  Plumbing: { hi: 'नल / पानी', section: 'IWD Civil · Plumbing', icon: 'droplet' },
  Carpentry: { hi: 'बढ़ईगीरी', section: 'IWD Civil · Carpentry', icon: 'hammer' },
  Civil: { hi: 'मरम्मत', section: 'IWD Civil · Masonry', icon: 'brick' },
}

export type Tech = { id: string; name: string; hi: string; trade: Trade; phone: string; rating: number; years: number; staffNo: string }
export const TECHS: Tech[] = [
  { id: 't1', name: 'Ravi Kumar', hi: 'रवि कुमार', trade: 'Electrical', phone: '98•••••214', rating: 4.8, years: 11, staffNo: '4721' },
  { id: 't2', name: 'Suresh Pal', hi: 'सुरेश पाल', trade: 'Electrical', phone: '97•••••530', rating: 4.6, years: 6, staffNo: '4733' },
  { id: 't3', name: 'Imran Ali', hi: 'इमरान अली', trade: 'Plumbing', phone: '99•••••871', rating: 4.7, years: 9, staffNo: '5108' },
  { id: 't4', name: 'Deepak Saini', hi: 'दीपक सैनी', trade: 'Carpentry', phone: '94•••••062', rating: 4.9, years: 14, staffNo: '5214' },
  { id: 't5', name: 'Mahesh Chauhan', hi: 'महेश चौहान', trade: 'Civil', phone: '93•••••447', rating: 4.5, years: 7, staffNo: '5302' },
]
export const techById = (id?: string) => TECHS.find(t => t.id === id)

/** What can break, by trade. Fixed taps instead of free text (lost details was a top finding). */
export const ITEMS: Record<Trade, { id: string; label: string; hi: string; art?: string; issues: string[] }[]> = {
  Electrical: [
    { id: 'fan', label: 'Ceiling fan', hi: 'पंखा', art: 'fan', issues: ['Not spinning', 'Noisy', 'Runs slow', 'Regulator broken'] },
    { id: 'light', label: 'Tube light', hi: 'ट्यूबलाइट', art: 'part-bulb', issues: ['Not turning on', 'Flickering', 'Choke humming'] },
    { id: 'socket', label: 'Socket / switch', hi: 'सॉकेट / स्विच', art: 'socket', issues: ['No power', 'Loose socket', 'Sparks or burning smell'] },
    { id: 'geyser', label: 'Geyser', hi: 'गीज़र', issues: ['No hot water', 'Leaking', 'Tripping the switch'] },
  ],
  Plumbing: [
    { id: 'tap', label: 'Tap', hi: 'नल', art: 'part-washer', issues: ['Leaking', 'No water', 'Spindle broken'] },
    { id: 'drain', label: 'Drain', hi: 'नाली', issues: ['Blocked', 'Overflowing', 'Bad smell'] },
    { id: 'flush', label: 'Flush', hi: 'फ्लश', issues: ['Not working', 'Runs all the time'] },
  ],
  Carpentry: [
    { id: 'door', label: 'Door / lock', hi: 'दरवाज़ा / ताला', art: 'door', issues: ['Lock stuck', 'Door does not close', 'Hinge broken'] },
    { id: 'almirah', label: 'Almirah', hi: 'अलमारी', issues: ['Hinge broken', 'Lock broken', 'Shelf broken'] },
    { id: 'chair', label: 'Chair / table', hi: 'कुर्सी / मेज़', issues: ['Leg loose', 'Broken', 'Wobbly'] },
    { id: 'window', label: 'Window', hi: 'खिड़की', issues: ['Will not latch', 'Glass cracked', 'Mesh torn'] },
  ],
  Civil: [
    { id: 'tile', label: 'Floor tiles', hi: 'टाइल', issues: ['Cracked', 'Loose'] },
    { id: 'wall', label: 'Wall / ceiling', hi: 'दीवार / छत', issues: ['Seepage', 'Plaster falling', 'Damp patch'] },
  ],
}

export const PLACES = [
  { id: 'room', label: 'My room', sub: 'Only you are affected' },
  { id: 'washroom', label: 'Washroom', sub: 'Shared on your floor' },
  { id: 'corridor', label: 'Corridor', sub: 'Lights, sockets, water cooler' },
  { id: 'common', label: 'Common room', sub: 'TV room, reading room' },
  { id: 'stairs', label: 'Stairs', sub: 'Railings, lights, steps' },
] as const

/** Visit windows. Most hostel visits happen in the evening, after classes and labs. */
export const SLOT_TIMES = ['5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM']
export function nextDays(n = 5) {
  const out: { key: string; dow: string; date: number; label: string; load: number }[] = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i)
    out.push({ key: x.toISOString().slice(0, 10), dow: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : x.toLocaleDateString('en-IN', { weekday: 'short' }), date: x.getDate(), label: x.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }), load: [2, 3, 1, 1, 2][i % 5] })
  }
  return out
}
export const addMin = (t: string, m: number) => {
  const [hm, ap] = t.split(' '); let [h, mm] = hm.split(':').map(Number); if (ap === 'PM' && h !== 12) h += 12
  const tot = h * 60 + mm + m; const H = Math.floor(tot / 60) % 24, M = tot % 60
  return `${((H + 11) % 12) + 1}:${String(M).padStart(2, '0')} ${H >= 12 ? 'PM' : 'AM'}`
}
export const ago = (ms: number) => {
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000))
  if (s < 60) return 'just now'; const m = Math.round(s / 60); if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; const d = Math.round(h / 24); return `${d} day${d > 1 ? 's' : ''} ago`
}
export const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
export const dayTime = (ms: number) => new Date(ms).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
export const H = 3600_000, D = 24 * H
export const code4 = () => String(1000 + Math.floor(Math.random() * 9000))
export const code6 = () => String(100000 + Math.floor(Math.random() * 900000))

/* ---------- tiny persistent store (one per app) ---------- */
export function createStore<T>(key: string, init: () => T) {
  let state: T = (() => { try { const v = localStorage.getItem(key); return v ? { ...init(), ...JSON.parse(v) } : init() } catch { return init() } })()
  const subs = new Set<() => void>()
  const save = () => { try { localStorage.setItem(key, JSON.stringify(state)) } catch { /* private mode */ } }
  return {
    get: () => state,
    subscribe: (f: () => void) => { subs.add(f); return () => { subs.delete(f) } },
    set: (p: Partial<T> | ((s: T) => Partial<T>)) => { state = { ...state, ...(typeof p === 'function' ? p(state) : p) }; save(); subs.forEach(f => f()) },
    reset: () => { state = init(); save(); subs.forEach(f => f()) },
    use: <R,>(sel: (s: T) => R): R => useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb) }, () => sel(state)),
  }
}
