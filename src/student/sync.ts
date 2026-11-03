/* Student side of the live link: my requests go up, the technician's and supervisor's moves come back. */
import { store, fixReq } from './store'
import { pushReq, watchReqs } from '../data/sync'
const seen = new Map<string, string>(store.get().reqs.map(r => [r.id, JSON.stringify(r)]))
store.subscribe(() => {
  const s = store.get(); if (!s.email) return
  s.reqs.forEach(r => { const j = JSON.stringify(r); if (seen.get(r.id) !== j) { seen.set(r.id, j); pushReq({ id: r.id, email: s.email, data: r }) } })
})
watchReqs(row => {
  if (row.email !== store.get().email) return
  const data = fixReq(row.data); if (!data) return
  row = { ...row, data }
  const j = JSON.stringify(row.data); if (seen.get(row.id) === j) return
  seen.set(row.id, j)
  store.set(s => ({ reqs: s.reqs.some(r => r.id === row.id) ? s.reqs.map(r => (r.id === row.id ? row.data : r)) : [row.data, ...s.reqs] }))
})
