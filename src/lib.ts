import { createClient } from '@supabase/supabase-js'

/* Optional Supabase. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to share data between the three apps.
   Without them each app keeps its own demo data in this browser (localStorage). */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const supabase = url && key ? createClient(url, key) : null

export type Status = 'reported' | 'verified' | 'scheduled' | 'visiting' | 'closed' | 'waiting_part' | 'missed' | 'reopened' | 'disputed' | 'merged'
export type Req = { id: string; room: string; fixture: string; category: string; status: Status; slot: string; note: string; block: string; age: string; photo: boolean; closed?: boolean }

const seed: Req[] = [
  { id: '2417', room: 'BG04', fixture: 'Fan not working', category: 'Electrical', status: 'reported', slot: 'Today 8:30 to 9:00 PM', note: 'Fan stops after a few minutes. Free after 6 PM.', block: 'Block C', age: '2h ago', photo: true },
  { id: '2416', room: 'F2', fixture: 'Router light is red', category: 'Network', status: 'reported', slot: '', note: '', block: 'Block A', age: '5h ago', photo: false },
  { id: '2415', room: '118', fixture: 'Tap leaking under the sink', category: 'Plumbing', status: 'reported', slot: '', note: '', block: 'Block D', age: '1d ago', photo: true },
  { id: '2414', room: 'B305', fixture: 'Chair broken, leg loose', category: 'Furniture', status: 'reported', slot: '', note: '', block: 'Block B', age: '4d ago', photo: true },
  { id: '2413', room: 'C209', fixture: 'Window will not latch', category: 'Carpentry', status: 'reported', slot: '', note: '', block: 'Block C', age: '4d ago', photo: false },
  { id: '2412', room: '340', fixture: 'Motor unit noisy', category: 'Plumbing', status: 'reported', slot: '', note: '', block: 'Block A', age: '6d ago', photo: true },
]

const K = 'align.requests'
const load = (): Req[] => { try { return JSON.parse(localStorage.getItem(K) || '') } catch { return seed } }
const save = (r: Req[]) => { try { localStorage.setItem(K, JSON.stringify(r)) } catch { /* private mode */ } }

export async function listRequests(): Promise<Req[]> {
  if (supabase) { const { data } = await supabase.from('requests').select('*').order('id', { ascending: false }); if (data) return data as Req[] }
  return load()
}
export async function addRequest(r: Omit<Req, 'id' | 'age' | 'status' | 'block' | 'photo'> & { photo?: boolean }): Promise<Req> {
  const full: Req = { id: String(2418 + load().length - seed.length), status: 'reported', block: 'Block C', age: 'just now', photo: !!r.photo, ...r }
  if (supabase) await supabase.from('requests').insert(full); else save([full, ...load()])
  return full
}
export async function setStatus(id: string, status: Status) {
  if (supabase) await supabase.from('requests').update({ status }).eq('id', id)
  else save(load().map(r => (r.id === id ? { ...r, status } : r)))
}

export const CLOSING_CODE = '4729'
export const useOnline = () => navigator.onLine
