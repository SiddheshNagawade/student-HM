/* Shared live link between the three apps (Supabase table align_requests, realtime). Demo-open on purpose. */
import { createClient } from '@supabase/supabase-js'
const sb = createClient('https://imphjzoaazvwackfaeye.supabase.co', 'sb_publishable_OS6_IUyB1dz-J6obM1ESag_U-pG0R1_')
export type Remote = { id: string; email: string; data: any }
export const pushReq = (r: Remote) => { sb.from('align_requests').upsert({ id: r.id, email: r.email, data: r.data, updated_at: new Date().toISOString() }).then(() => {}, () => {}) }
export function watchReqs(cb: (r: Remote) => void) {
  sb.from('align_requests').select('*').then(({ data }) => data?.forEach(cb as never), () => {})
  sb.channel('align-reqs-' + Math.random().toString(36).slice(2)).on('postgres_changes', { event: '*', schema: 'public', table: 'align_requests' }, (p: any) => p.new && p.new.id && cb(p.new)).subscribe()
}
