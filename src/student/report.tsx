import { useState } from 'react'
import { Beaver, Button, Chip, Paper } from '../components/ui'
import { Body, Demo, Fan, Foot, Head, LinkBtn, Page, Room } from './kit'
import { addRequest } from '../lib'
import type { Ctx } from './App'

const room = (c: Ctx) => (c.loc.block + c.loc.floor + c.loc.room).toUpperCase()

/* Home with an open request: 12 min tracker */
export const HomeActive = ({ c }: { c: Ctx }) => {
  const offline = !c.online
  return (
    <Page bg="bg-sun2">
      {offline && <div className="bg-sand2 border-b-2 border-navy text-center text-[12px] py-1.5 pt-[34px]">Offline - your reports send themselves</div>}
      <div className={`px-6 ${offline ? 'pt-3' : 'pt-[44px]'} flex items-start justify-between`}>
        <div><div className="font-head font-extrabold text-[19px]">{room(c)}</div><div className="text-[12px] text-mid">Himalya Bhawan</div></div>
        <div className="flex gap-2"><button aria-label="Alerts" onClick={() => c.go('alerts2')} className="w-9 h-9 rounded-full border-[2.5px] border-navy bg-cream">🔔︎</button>
          <button aria-label="You" onClick={() => c.go('profile')} className="w-9 h-9 rounded-full border-[2.5px] border-navy bg-sun font-head font-extrabold">S</button></div>
      </div>
      <div className="px-6 pt-2"><Room onFan={() => c.go('pick')} /><p className="text-center text-[12px] text-mid -mt-1">Tap what is broken</p></div>
      <div className="flex-1 mt-2 rounded-t-[28px] bg-cream border-t-[2.5px] border-navy px-6 pt-4 flex flex-col">
        <div className="flex items-end gap-1.5"><span className="font-head font-extrabold text-[56px] leading-none">12</span><span className="font-head font-bold text-[16px] mb-1">min</span></div>
        <button onClick={() => c.go('track')} className="text-left mt-1"><div className="font-head font-extrabold text-[17px]">Ravi is on his way</div><div className="text-[12px] text-mid">Ceiling fan - today 8:30 to 9:00 PM</div></button>
        <div className="flex items-center mt-3">{['Reported', 'Verified', 'Scheduled', 'Visiting', 'Closed'].map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center relative">
            <span className={`w-3 h-3 rounded-full border-2 border-navy z-10 ${i < 4 ? 'bg-sun' : 'bg-cream'}`} />
            {i > 0 && <span className="absolute top-[5px] right-1/2 w-full h-[2px] bg-navy" />}
            <span className="text-[9.5px] mt-1 text-mid">{s}</span></div>))}</div>
        <Button className="mt-auto mb-7" onClick={() => c.go('pick')}>Something else broke?</Button>
      </div>
    </Page>
  )
}

export const Pick = ({ c }: { c: Ctx }) => {
  const opts = [['Not spinning', 'Fan not spinning'], ['Noisy', 'Fan is noisy'], ['Slow', 'Fan runs slow']]
  const [sel, setSel] = useState(0)
  return (
    <Page>
      <Head onBack={c.back} right={<span className="text-[12px] text-mid">Ceiling fan - {room(c)}</span>} />
      <div className="flex justify-center -mt-3"><Fan size={170} /></div>
      <div className="flex-1 mt-3 rounded-t-[28px] bg-cream border-t-[2.5px] border-navy px-6 pt-5 flex flex-col">
        <h1 className="font-head font-extrabold text-[24px]">What is it doing?</h1>
        <div className="grid grid-cols-3 gap-3 mt-4">{opts.map(([l], i) => (
          <button key={l} onClick={() => setSel(i)} className={`h-[92px] rounded-[16px] border-[2.5px] border-navy font-head font-bold text-[12.5px] flex flex-col items-center justify-center gap-1 ${sel === i ? 'bg-sun shadow-[0_3px_0_#00224E]' : 'bg-cream'}`}><Fan size={40} />{l}</button>))}</div>
        <button className="mt-4 flex items-center gap-3 text-[13.5px] text-left"><span className="w-11 h-11 rounded-[12px] border-2 border-dashed border-navy flex items-center justify-center">📷︎</span>Add a photo, if you like <span className="text-mid text-[11px]">Optional</span></button>
        <div className="mt-3 rounded-[10px] bg-sun2 text-[12px] px-3 py-2">You are usually free 8:30 to 9:00 PM</div>
        <Button className="mt-auto mb-7" onClick={() => { c.setDraft({ fixture: opts[sel][1], category: 'Electrical' }); c.go('safety') }}>Report it</Button>
      </div>
    </Page>
  )
}

export const Safety = ({ c }: { c: Ctx }) => (
  <Page bg="bg-sand2">
    <Head onBack={c.back} title="Quick safety check" />
    <Body>
      <svg viewBox="0 0 280 150" className="w-full max-w-[300px]" fill="none" stroke="#00224E" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <rect x="30" y="20" width="200" height="120" rx="14" fill="#FFFBF3" /><circle cx="150" cy="80" r="38" fill="#BDDDFF" />
        <rect x="52" y="50" width="30" height="60" rx="6" fill="#FFF3CF" /><circle cx="138" cy="72" r="4" fill="#00224E" /><circle cx="162" cy="72" r="4" fill="#00224E" /><path d="M136 94c8 8 18 8 26 0" />
        <path d="M232 20l-14 26h16l-12 24" stroke="#B8530A" />
      </svg>
      <h1 className="font-head font-extrabold text-[19px] mt-4">Sparks, a burning smell or water near a socket?</h1>
      <p className="text-[12.5px] text-mid mt-2">Be honest. It only changes how fast we come.</p>
      <div className="mt-5 space-y-3"><Button variant="secondary" onClick={() => c.go('where2')}>No, it's safe</Button><Button variant="ember" onClick={() => { c.setDraft({ ...c.draft, urgent: true }); c.go('where2') }}>Yes, it's dangerous</Button></div>
      <p className="text-[12.5px] text-mid mt-5">If yes, step away. We call the warden right now.</p>
    </Body>
  </Page>
)

const PLACES = [['washroom', 'Washroom'], ['basin', 'Basin'], ['common', 'Common room'], ['stairs', 'Stairs']]
export const Where2 = ({ c }: { c: Ctx }) => {
  const [place, setPlace] = useState('washroom'); const [fl, setFl] = useState('G')
  return (
    <Page>
      <Head onBack={c.back} title={`${c.draft.fixture || 'Problem'}`} sub="Which place?" />
      <Body>
        <div className="grid grid-cols-2 gap-3">{PLACES.map(([k, l]) => (
          <button key={k} onClick={() => setPlace(k)} className={`h-[96px] rounded-[18px] border-[2.5px] border-navy font-head font-extrabold text-[14px] ${place === k ? 'bg-sun shadow-[0_3px_0_#00224E]' : 'bg-cream'}`}>{l}</button>))}</div>
        <div className="mt-6 text-[11px] font-mono text-mid">WHICH FLOOR?</div>
        <div className="flex items-end gap-2 mt-2">{['G', '1', '2', '3'].map((f, i) => (
          <button key={f} onClick={() => setFl(f)} style={{ height: 44 + i * 22 }} className={`flex-1 rounded-t-[10px] border-[2.5px] border-navy font-head font-extrabold text-[17px] ${fl === f ? 'bg-sun' : 'bg-cream'}`}>{f}</button>))}</div>
      </Body>
      <Foot><Button onClick={() => (place === 'basin' ? c.go('dupe') : c.go('slot'))}>Next</Button></Foot>
    </Page>
  )
}

export const Dupe = ({ c }: { c: Ctx }) => (
  <Page>
    <Head onBack={c.back} />
    <Body>
      <h1 className="font-head font-extrabold text-[24px]">Someone already told us.</h1>
      <Paper className="mt-5 p-5" tape tone="sun2">
        <div className="font-head font-extrabold text-[19px] mt-3">Tap leaking</div>
        <div className="text-[12px] text-mid">Washroom G-East</div>
        <span className="inline-block mt-2 px-3 h-6 rounded-full border-2 border-navy bg-cream text-[12px]">Queued</span>
        <div className="flex items-center gap-2 mt-4 text-[12px]">🙂︎🙂︎ 2 others already reported this</div>
      </Paper>
      <p className="text-[13.5px] text-mid mt-6">Join them. Your free hours help Ravi plan one visit for everyone.</p>
    </Body>
    <Foot link={<LinkBtn onClick={() => c.go('slot')}>This is a different problem</LinkBtn>}><Button onClick={() => c.reset('sent')}>Join this problem</Button></Foot>
  </Page>
)

const SLOTS = [['Today', '29', 1], ['Tomorrow', '30', 2], ['Thu', '1', 1], ['Fri', '2', 0]] as const
export const Slot = ({ c }: { c: Ctx }) => {
  const [d, setD] = useState(0); const [t, setT] = useState('8:30'); const [open, setOpen] = useState(true)
  const times = ['8:30', '9:00', '9:30', '10:00']
  return (
    <Page bg="bg-sun">
      <Head onBack={c.back} title="When can they come?" right={<span className="text-[26px]">🌙︎</span>} />
      <Body>
        <div className="relative h-[100px] mt-1">{times.map((x, i) => (
          <button key={x} onClick={() => setT(x)} className={`absolute w-[64px] h-[46px] rounded-[12px] border-[2.5px] border-navy font-mono text-[16px] ${t === x ? 'bg-sun2 shadow-[0_3px_0_#00224E]' : 'bg-cream'}`}
            style={{ left: `${[0, 28, 58, 76][i]}%`, top: [34, 0, 0, 36][i] }}>{x}</button>))}</div>
        <p className="text-[12px] text-center -mt-2">Evening - 30 min each</p>
        <div className="grid grid-cols-4 gap-2 mt-5">{SLOTS.map(([l, n, busy], i) => (
          <button key={l} onClick={() => setD(i)} className={`rounded-[14px] border-[2.5px] border-navy py-2 ${d === i ? 'bg-sun2 shadow-[0_3px_0_#00224E]' : 'bg-cream'}`}>
            <div className="text-[10px]">{l}</div><div className="font-head font-extrabold text-[22px]">{n}</div>
            <div className="mx-auto h-1 rounded bg-navy" style={{ width: 8 + busy * 10 }} /></button>))}</div>
        <p className="text-[11px] mt-1">Taller line = busier day</p>
        <button onClick={() => setOpen(!open)} className="mt-4 w-full rounded-[14px] border-[2.5px] border-navy bg-cream p-3 flex items-center justify-between text-left">
          <span><span className="block text-[13.5px]">Let them in if I'm out</span><span className="text-[11px] text-mid">The warden opens {room(c)}</span></span>
          <span className={`w-11 h-6 rounded-full border-2 border-navy flex items-center px-0.5 ${open ? 'bg-navy justify-end' : 'bg-cream justify-start'}`}><span className={`w-4 h-4 rounded-full ${open ? 'bg-cream' : 'bg-navy'}`} /></span></button>
        <div className="text-center mt-4"><LinkBtn onClick={() => { setD(0); setT('8:30') }}>Or use my usual free hours</LinkBtn></div>
      </Body>
      <Foot><Button onClick={() => { c.setDraft({ ...c.draft, slot: `${SLOTS[d][0] === 'Today' ? 'Today' : SLOTS[d][0]}, ${t} to ${t === '8:30' ? '9:00' : t === '9:00' ? '9:30' : t === '9:30' ? '10:00' : '10:30'} PM`, access: open ? "I'll be in the room" : 'Let them in' }); c.go('check') }}>Next</Button></Foot>
    </Page>
  )
}

export const Check = ({ c }: { c: Ctx }) => {
  const [busy, setBusy] = useState(false)
  const d = c.draft
  const rows: [string, string, string, string][] = [['Problem', d.fixture || 'Fan not spinning', '1 photo', '⚙︎'], ['Place', `Room ${room(c)}`, 'Himalya Bhawan', '⌂︎'], ['When', d.slot || 'Today, 8:30 to 9:00 PM', 'Evening visit', '◷︎'], ['Access', d.access || "I'll be in the room", 'Door open for Ravi', '▯︎']]
  const send = async () => {
    setBusy(true)
    const r = await addRequest({ room: room(c), fixture: d.fixture || 'Fan not spinning', category: d.category || 'Electrical', slot: d.slot || '', note: '', photo: true })
    c.setSent(r.id); c.reset('sent')
  }
  return (
    <Page>
      <Head onBack={c.back} title="Check it" right={!c.online && <span className="text-[11px] text-ember border border-ember rounded-full px-2 py-0.5">Offline - saved to this phone</span>} />
      <Body>
        <Paper className="p-5 pb-7" tone="cream">
          {rows.map(([k, v, s, i]) => (
            <div key={k} className="flex gap-3 py-3 border-b-2 border-dashed border-navy last:border-0">
              <span className="text-[22px] w-7">{i}</span>
              <div className="flex-1"><div className="font-mono text-[10px] text-mid uppercase">{k}</div><div className="font-head font-extrabold text-[15px]">{v}</div><div className="text-[11.5px] text-mid">{s}</div></div>
              {k === 'Problem' && <button onClick={() => c.go('pick')} className="text-[12px] underline self-start">Edit</button>}
            </div>))}
        </Paper>
        <p className="text-[12px] text-mid mt-4">Ravi Kumar, the electrician for your floor, gets this after a supervisor checks it.</p>
      </Body>
      <Foot><Button disabled={busy} onClick={send}>{c.online ? 'Send report' : 'Save report'}</Button></Foot>
    </Page>
  )
}

export const Sent = ({ c }: { c: Ctx }) => (
  <Page bg="bg-sun">
    <div className="flex-1 flex flex-col items-center pt-[90px] px-6">
      <Beaver pose="cele" size={130} />
      <h1 className="font-head font-extrabold text-[31px] mt-3">Report sent.</h1>
      <span className="mt-3 font-mono text-[14px] px-4 h-8 flex items-center rounded-full bg-cream border-2 border-navy">#{c.sent || '2418'}</span>
      <p className="text-center text-[13.5px] mt-5 max-w-[260px]">The supervisor is giving it a quick check. Ravi gets it next, usually within 30 minutes.</p>
    </div>
    <Foot link={<LinkBtn onClick={() => c.reset('homeActive')}>Back home</LinkBtn>}><Button variant="secondary" onClick={() => c.reset('track')}>Track it</Button></Foot>
  </Page>
)
export { Demo, Chip }
