import { useState } from 'react'
import { Art, ArtBox, Beaver, Button } from '../components/ui'
import { Body, Foot, Head, LinkBtn, Page, Sheet } from './kit'
import { addRequest } from '../lib'
import type { Ctx } from './App'

const room = (c: Ctx) => (c.loc.block + c.loc.floor + c.loc.room).toUpperCase()
const IconBtn = ({ children, onClick, dot, label }: { children: React.ReactNode; onClick: () => void; dot?: boolean; label: string }) => (
  <button aria-label={label} onClick={onClick} className="relative w-[42px] h-[42px] rounded-full bg-cream border-[2.5px] border-navy flex items-center justify-center">{children}{dot && <span className="absolute top-0 right-0 w-[10px] h-[10px] rounded-full bg-ember border-2 border-cream" />}</button>
)

/* Home with an open request: 12 min tracker */
export const HomeActive = ({ c }: { c: Ctx }) => (
  <Page>
    {!c.online && <div className="shrink-0 mt-10 mx-auto px-3 h-6 rounded-full bg-sand2 border-[1.5px] border-navy text-[11.5px] flex items-center">Offline - your reports send themselves</div>}
    <div className={`px-6 ${c.online ? 'pt-[50px]' : 'pt-2'} flex items-start justify-between shrink-0 relative z-10`}>
      <div><div className="font-head font-extrabold text-[19px] leading-none">{room(c)}</div><div className="text-[12.5px] text-mid mt-1">Himalya Bhawan</div></div>
      <div className="flex gap-4"><IconBtn label="Alerts" dot onClick={() => c.go('alerts2')}><Art n="bell" /></IconBtn>
        <IconBtn label="You" onClick={() => c.go('profile')}><span className="font-head font-extrabold text-[17px] bg-sun w-full h-full rounded-full flex items-center justify-center">S</span></IconBtn></div>
    </div>
    <div className="relative shrink-0 -mt-1">
      <Art n="room" className="w-full h-auto" />
      <button aria-label="Fan" onClick={() => c.go('pick')} className="absolute left-[44%] top-[2%] w-[24%] h-[28%]" />
      <button aria-label="Something broke" onClick={() => c.go('pick')} className="absolute left-[60%] top-[12%] w-[34%] h-[8%]" />
      <p className="absolute left-0 right-0 bottom-[3%] text-center text-[13.5px] text-mid">Tap what is broken</p>
    </div>
    <div className="flex-1 min-h-0 rounded-t-[28px] bg-cream border-t-[2.5px] border-navy px-6 pt-3 flex flex-col">
      <div className="flex items-end gap-2 leading-none"><span className="font-head font-extrabold text-[72px] leading-[.9]">12</span><span className="font-head font-extrabold text-[19px] mb-1">min</span></div>
      <button onClick={() => c.go('track')} className="text-left mt-2"><div className="font-head font-extrabold text-[19px]">Ravi is on his way</div><div className="text-[13.5px] text-mid">Ceiling fan · today 8:30 to 9:00 PM</div></button>
      <div className="relative mt-2 -mx-1" style={{ height: 48 }}>
        <Art n="journey" className="absolute left-[-4px] top-0 w-[calc(100%+8px)] h-auto" />
        <div className="absolute left-0 right-0 bottom-[-2px] flex justify-between text-[11px] text-mid">{['Reported', 'Verified', 'Scheduled', 'Visiting', 'Closed'].map(s => <span key={s}>{s}</span>)}</div>
      </div>
      <Button className="mt-auto mb-7 !h-[48px]" onClick={() => c.go('pick')}>Something else broke?</Button>
    </div>
  </Page>
)

export const Pick = ({ c }: { c: Ctx }) => {
  const opts = [['Not spinning', 'Fan not spinning'], ['Noisy', 'Fan is noisy'], ['Slow', 'Fan runs slow']]
  const [sel, setSel] = useState(0)
  return (
    <Page>
      <div className="relative shrink-0 overflow-hidden" style={{ height: 300 }}>
        <Art n="fan" className="w-full h-auto absolute top-[-20px] left-0" />
        <div className="absolute left-5 top-[52px]"><button aria-label="Back" onClick={c.back} className="w-11 h-11 rounded-full bg-cream border-[2.5px] border-navy flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00224E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg></button></div>
        <div className="absolute left-0 right-0 top-[56px] text-center text-[12px] text-mid">Ceiling fan · {room(c)}</div>
        <div className="absolute left-0 right-0 bottom-[28px] text-center text-[12px] text-mid">Yes, the fan, now, what is it doing?</div>
      </div>
      <Sheet className="px-6 pt-4 -mt-5">
        <h1 className="font-head font-extrabold text-[24px] leading-tight">What is it doing?</h1>
        <div className="grid grid-cols-3 gap-3 mt-3">{opts.map(([l], i) => (
          <button key={l} onClick={() => setSel(i)} className={`h-[102px] rounded-[16px] border-[2.5px] border-navy font-head font-bold text-[12.5px] flex flex-col items-center justify-center gap-1 ${sel === i ? 'bg-sun shadow-[0_3px_0_#00224E]' : 'bg-cream'}`}><Art n="drawing" w={52} />{l}</button>))}</div>
        <button className="mt-4 flex items-center gap-3 text-[13.5px] text-left"><Art n="photo" w={44} />Add a photo, if you like <span className="text-mid text-[11px]">Optional</span></button>
        <div className="mt-3 rounded-[10px] bg-sun2 text-[12.5px] px-3 py-2">You are usually free 8:30 to 9:00 PM</div>
        <Button className="mt-auto mb-7" onClick={() => { c.setDraft({ fixture: opts[sel][1], category: 'Electrical' }); c.go('safety') }}>Report it</Button>
      </Sheet>
    </Page>
  )
}

export const Safety = ({ c }: { c: Ctx }) => (
  <Page bg="bg-sand2">
    <Head onBack={c.back} title="Quick safety check" />
    <Body className="pt-3">
      <Art n="socket" />
      <h1 className="font-head font-extrabold text-[19px] leading-snug mt-5 max-w-[320px]">Sparks, a burning smell or water near a socket?</h1>
      <p className="text-[13.5px] text-mid mt-2">Be honest. It only changes how fast we come.</p>
      <div className="mt-5 space-y-3"><Button variant="secondary" onClick={() => c.go('where2')}>No, it's safe</Button><Button variant="ember" onClick={() => { c.setDraft({ ...c.draft, urgent: true }); c.go('where2') }}>Yes, it's dangerous</Button></div>
      <p className="text-[12.5px] text-mid mt-4">If yes, step away. We call the warden right now.</p>
    </Body>
  </Page>
)

const TILE = (k: string, on: boolean) => {
  const icon = on ? 'opacity-100' : 'opacity-100'
  if (k === 'common') return <Art n="vignette" className="w-full h-auto" />
  if (k === 'stairs') return <Art n="vignette-stairs" className="w-full h-auto" />
  return <div className="relative"><Art n={`vignette-${k}-tile`} className="w-full h-auto" /><Art n={`vignette-${k}-icon`} className={`absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[62%] h-auto ${icon}`} /></div>
}
const PLACES: [string, string][] = [['corridor', 'Corridor'], ['washroom', 'Washroom'], ['common', 'Common room'], ['stairs', 'Stairs']]
export const Where2 = ({ c }: { c: Ctx }) => {
  const [place, setPlace] = useState('washroom'); const [fl, setFl] = useState('G')
  return (
    <Page>
      <Head onBack={c.back} title="Tap · Plumbing" />
      <Body className="pt-1">
        <div className="grid grid-cols-2 gap-x-2 gap-y-3 items-end">{PLACES.map(([k, l]) => (
          <button key={k} onClick={() => setPlace(k)} className="relative flex flex-col items-center">
            <div className="w-[88%]">{TILE(k, place === k)}</div>
            <span className="absolute bottom-[14%] font-head font-extrabold text-[15px]">{l}</span>
            {place === k && <Art n="tick" w={30} className="absolute top-1 right-3" />}
          </button>))}</div>
        <div className="mt-3 font-head font-extrabold text-[16px]">Which floor?</div>
        <div className="relative mt-2 mx-auto" style={{ width: 323, height: 158 }}>
          <Art n="steps" />
          {['G', '1', '2', '3'].map((f, i) => <button key={f} onClick={() => setFl(f)} className={`absolute font-head font-extrabold text-[17px] ${fl === f ? 'text-ember' : ''}`} style={{ left: 8 + i * 80, width: 76, bottom: 4, height: 40 + i * 38 }}>{f}</button>)}
        </div>
      </Body>
      <Foot><Button onClick={() => (place === 'washroom' ? c.go('dupe') : c.go('slot'))}>Next</Button></Foot>
    </Page>
  )
}

export const Dupe = ({ c }: { c: Ctx }) => (
  <Page>
    <Head onBack={c.back} title="Someone already told us." />
    <Body className="pt-3">
      <ArtBox n="slip" className="mx-auto" style={{ width: 341, height: 314 }}>
        <div className="px-[34px] pt-[78px]">
          <div className="font-head font-extrabold text-[19px] ml-[56px]">Tap leaking</div>
          <div className="text-[12.5px] text-mid ml-[56px]">Washroom G-East</div>
          <span className="inline-block ml-[56px] mt-2 px-3 h-6 rounded-full border-2 border-navy bg-cream text-[12px] leading-[20px]">Queued</span>
          <div className="flex items-center gap-3 mt-6"><Art n="faces" /><span className="text-[12.5px]">2 others already reported this</span></div>
        </div>
      </ArtBox>
      <p className="text-[13.5px] text-mid mt-5">Join them. Your free hours help Ravi plan one visit for everyone.</p>
    </Body>
    <Foot link={<LinkBtn onClick={() => c.go('slot')}>This is a different problem</LinkBtn>}><Button onClick={() => c.reset('sent')}>Join this problem</Button></Foot>
  </Page>
)

const SLOTS = [['Today', '29', 1], ['Tomorrow', '30', 2], ['Thu', '1', 1], ['Fri', '2', 0]] as const
export const Slot = ({ c }: { c: Ctx }) => {
  const [d, setD] = useState(0); const [t, setT] = useState('8:30'); const [open, setOpen] = useState(true)
  const times = ['8:30', '9:00', '9:30', '10:00']
  const pos = [[2, 118], [26, 70], [52, 70], [74, 118]]
  return (
    <Page bg="bg-sun">
      <Head onBack={c.back} title="When can they come?" right={<Art n="moon" w={44} />} />
      <Body className="pt-0">
        <div className="relative mx-[-24px]" style={{ height: 230 }}>
          <Art n="arc" className="absolute left-0 top-[-120px] w-full h-auto" />
          {times.map((x, i) => (
            <button key={x} onClick={() => setT(x)} className={`absolute w-[64px] h-[48px] rounded-[12px] border-[2.5px] border-navy font-mono text-[17px] ${t === x ? 'bg-sun2 shadow-[0_3px_0_#00224E]' : 'bg-cream'}`} style={{ left: `${pos[i][0]}%`, top: pos[i][1] - 70 }}>{x}</button>))}
          <p className="absolute left-0 right-0 top-[150px] text-center text-[12px]">Evening · 30 min each</p>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-1">{SLOTS.map(([l, n, busy], i) => (
          <button key={l} onClick={() => setD(i)} className={`rounded-[14px] border-[2.5px] border-navy py-2 ${d === i ? 'bg-sun2 shadow-[0_3px_0_#00224E]' : 'bg-cream'}`}>
            <div className="text-[10.5px]">{l}</div><div className="font-head font-extrabold text-[22px] leading-tight">{n}</div>
            <div className="mx-auto h-[3px] rounded bg-navy mt-1" style={{ width: 10 + busy * 10 }} /></button>))}</div>
        <p className="text-[11px] mt-1">Taller line = busier day</p>
        <button onClick={() => setOpen(!open)} className="mt-3 w-full rounded-[14px] border-[2.5px] border-navy bg-cream px-3 py-2.5 flex items-center justify-between text-left">
          <span><span className="block text-[13.5px]">Let them in if I'm out</span><span className="text-[11px] text-mid">The warden opens {room(c)}</span></span>
          <span className={`w-11 h-6 rounded-full border-2 border-navy flex items-center px-0.5 ${open ? 'bg-navy justify-end' : 'bg-cream justify-start'}`}><span className={`w-4 h-4 rounded-full ${open ? 'bg-cream' : 'bg-navy'}`} /></span></button>
        <div className="text-center mt-3"><LinkBtn onClick={() => { setD(0); setT('8:30') }}>Or use my usual free hours</LinkBtn></div>
      </Body>
      <Foot><Button onClick={() => { const end = { '8:30': '9:00', '9:00': '9:30', '9:30': '10:00', '10:00': '10:30' }[t]; c.setDraft({ ...c.draft, slot: `${SLOTS[d][0]}, ${t} to ${end} PM`, access: open ? "I'll be in the room" : 'Let them in' }); c.go('check') }}>Next</Button></Foot>
    </Page>
  )
}

export const Check = ({ c }: { c: Ctx }) => {
  const [busy, setBusy] = useState(false)
  const d = c.draft
  const rows: [string, string, string][] = [['PROBLEM', d.fixture || 'Fan not spinning', '1 photo'], ['PLACE', `Room ${room(c)}`, 'Himalya Bhawan'], ['WHEN', d.slot || 'Today, 8:30 to 9:00 PM', 'Evening visit'], ['ACCESS', d.access || "I'll be in the room", 'Door open for Ravi']]
  const send = async () => {
    setBusy(true)
    const r = await addRequest({ room: room(c), fixture: d.fixture || 'Fan not spinning', category: d.category || 'Electrical', slot: d.slot || '', note: '', photo: true })
    c.setSent(r.id); c.reset('sent')
  }
  return (
    <Page>
      <Head onBack={c.back} title="Check it" right={!c.online && <span className="text-[11px] text-ember border border-ember rounded-full px-2 py-0.5">Offline · sends itself</span>} />
      <Body className="pt-1 flex flex-col items-center">
        <ArtBox n="ticket" style={{ width: 354, height: 480 }}>
          <div className="px-[26px] pt-[26px]">
            {rows.map(([k, v, s]) => (
              <div key={k} className="py-[14px] border-b-2 border-dashed border-navy last:border-0 relative">
                <div className="font-mono text-[10px] text-mid">{k}</div><div className="font-head font-extrabold text-[16px] leading-tight">{v}</div><div className="text-[12px] text-mid">{s}</div>
                {k === 'PROBLEM' && <button onClick={() => c.go('pick')} className="absolute right-0 top-3 text-[12px] underline">Edit</button>}
              </div>))}
          </div>
        </ArtBox>
        <p className="text-[12.5px] text-mid mt-3 self-start">Ravi Kumar, the electrician for your floor, gets this after a supervisor checks it.</p>
      </Body>
      <Foot><Button disabled={busy} onClick={send}>{c.online ? 'Send report' : 'Save report'}</Button></Foot>
    </Page>
  )
}

export const Sent = ({ c }: { c: Ctx }) => (
  <Page bg="bg-sun">
    <div className="flex-1 flex flex-col items-center pt-[70px] px-6">
      <Beaver pose="cele" />
      <h1 className="font-head font-extrabold text-[31px] mt-3">Report sent.</h1>
      <span className="mt-3 font-mono text-[14px] px-4 h-8 flex items-center rounded-full bg-cream border-2 border-navy">#{c.sent || '2418'}</span>
      <p className="text-center text-[13.5px] mt-5 max-w-[260px]">The supervisor is giving it a quick check. Ravi gets it next, usually within 30 minutes.</p>
      <Art n="plane" className="mt-8 self-end" />
    </div>
    <Foot link={<LinkBtn onClick={() => c.reset('homeActive')}>Back home</LinkBtn>}><Button variant="secondary" onClick={() => c.reset('track')}>Track it</Button></Foot>
  </Page>
)
