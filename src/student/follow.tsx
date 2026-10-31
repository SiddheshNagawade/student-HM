import { useState } from 'react'
import { Art, ArtBox, Beaver, Button, Chip } from '../components/ui'
import { Body, Demo, Foot, Head, LinkBtn, Page } from './kit'
import { CLOSING_CODE } from '../lib'
import type { Ctx } from './App'

const STEPS: [string, string, 'done' | 'now' | 'todo'][] = [
  ['Reported', 'Sat 26 Sep · 5:40 PM', 'done'], ['Verified', 'Sat 26 Sep · 6:00 PM', 'done'], ['Scheduled', 'Ravi · today 8:30 to 9:00 PM', 'now'],
  ['On the way', 'Ravi leaves at 8:20 PM', 'todo'], ['Visited', '', 'todo'], ['Closed', 'with your code', 'todo'],
]
export const Track = ({ c }: { c: Ctx }) => (
  <Page bg="bg-cream">
    <Head onBack={c.back} title="Fan replacement" sub="BG04 · reported 2 days ago" />
    <Body className="pt-3">
      <div className="relative ml-[6px]">
        <span className="absolute left-[17px] top-5 bottom-8 border-l-2 border-dashed border-navy" />
        {STEPS.map(([t, s, st]) => (
          <div key={t} className={`relative flex gap-4 items-center mb-[22px] ${st === 'todo' ? 'opacity-60' : ''}`}>
            <span className="z-10 w-[36px] h-[36px] shrink-0 flex items-center justify-center">
              {st === 'done' ? <Art n="tick" w={34} /> : st === 'now' ? <span className="relative w-[36px] h-[36px] flex items-center justify-center"><Art n="start" w={36} className="absolute inset-0" /><span className="relative w-[10px] h-[10px] rounded-full bg-navy" /></span> : <span className="w-[30px] h-[30px] rounded-full border-2 border-dashed border-navy bg-cream" />}
            </span>
            <div><div className={`font-head font-extrabold leading-tight ${st === 'now' ? 'text-[19px]' : 'text-[16px]'}`}>{t}</div><div className={`text-[12px] text-mid ${t === 'Closed' ? 'font-mono' : ''}`}>{s}</div></div>
          </div>))}
      </div>
      <LinkBtn onClick={() => c.go('nearby')}>Need help sooner?</LinkBtn>
      <div className="mt-4"><Demo items={[['on the way', () => c.go('nearby')], ['part needed', () => c.go('part')]]} /></div>
    </Body>
    <Foot link={<span className="text-[11px] text-mid">Opens after the visit</span>}><Button variant="secondary" onClick={() => c.go('rate')}>Confirm the fix</Button></Foot>
  </Page>
)

export const Nearby = ({ c }: { c: Ctx }) => (
  <Page bg="bg-sun">
    <div className="px-6 pt-[40px] flex items-end gap-2 shrink-0"><span className="font-head font-extrabold text-[150px] leading-[.85]">10</span><span className="font-head font-extrabold text-[24px] mb-4">min</span></div>
    <div className="px-6 mt-4 shrink-0"><h1 className="font-head font-extrabold text-[24px]">Ravi is nearby.</h1><p className="font-mono text-[12px] mt-1">fan · BG04 · 8:30 to 9:00 PM</p></div>
    <div className="relative shrink-0 mt-2" style={{ height: 170 }}>
      <Art n="ground" className="absolute bottom-0 left-0 w-full h-auto" />
      <Beaver pose="walk" className="absolute left-[56px] bottom-[16px]" />
      <span className="absolute right-[48px] bottom-[112px] font-mono text-[10px]">BG04</span>
    </div>
    <div className="bg-sun flex-1 px-6 pt-4 flex flex-col">
      <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-sky border-[2.5px] border-navy flex items-center justify-center font-head font-extrabold">R</span><div><div className="font-head font-extrabold text-[15px]">Ravi Kumar</div><div className="text-[12px]">Electrician · 4.8 average</div></div></div>
      <div className="mt-4 text-[13px] font-head font-extrabold">Will someone be there?</div><div className="text-[12.5px]">You chose "I'll be in the room".</div>
      <div className="mt-auto pb-7 flex flex-col items-center gap-3"><Button variant="secondary" onClick={() => c.go('ticket')}>I'm in the room</Button><LinkBtn onClick={() => c.go('missed')}>I can't make it</LinkBtn></div>
    </div>
  </Page>
)

const Digits = ({ v }: { v: string }) => (
  <div className="flex justify-around font-mono text-[44px] leading-none">{v.split('').map((d, i) => <span key={i} className={d === '?' ? 'text-ember' : ''}>{d}</span>)}</div>
)
export const Ticket = ({ c }: { c: Ctx }) => (
  <Page bg="bg-sun">
    <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-[52px] flex flex-col items-center">
      <Beaver pose="think" />
      <h1 className="font-head font-extrabold text-[24px] mt-3 text-center">Is the fan spinning?</h1>
      <p className="text-[13px] mt-2">Ravi says it is fixed. Check it first.</p>
      <ArtBox n="shape" className="mt-5 shrink-0" style={{ width: 340, height: 300 }}>
        <div className="px-8 pt-8"><div className="font-mono text-[10px] text-mid">CLOSING CODE</div><div className="text-[12.5px]">BG04 · ceiling fan</div>
          <div className="mt-4"><Digits v={CLOSING_CODE} /></div></div>
        <div className="absolute left-8 right-8 top-[222px] text-[12.5px]">Give Ravi this code only when you are happy.<div className="text-[11px] text-mid mt-1">That is what closes the job.</div></div>
      </ArtBox>
      <div className="mt-4"><Demo items={[['right code', () => c.go('rate')], ['wrong code', () => c.go('wrong')]]} /></div>
    </div>
    <Foot><Button variant="secondary" onClick={() => c.go('whats')}>Not fixed yet</Button></Foot>
  </Page>
)

export const Wrong = ({ c }: { c: Ctx }) => (
  <Page bg="bg-sun">
    <div className="flex-1 px-6 pt-[110px] flex flex-col items-center">
      <ArtBox n="shape" style={{ width: 340, height: 170 }}>
        <div className="px-8 pt-5"><div className="font-mono text-[10px] text-mid">closing code</div><div className="mt-3"><Digits v="246?" /></div></div>
      </ArtBox>
      <h1 className="font-head font-extrabold text-[24px] text-center mt-14">That code didn't match.</h1>
      <p className="text-[13px] text-center mt-3">Two tries left. Ask for the 4 digits again.</p>
    </div>
    <Foot link={<LinkBtn onClick={c.back}>Cancel</LinkBtn>}><Button variant="secondary" onClick={c.back}>Try again</Button></Foot>
  </Page>
)

export const Part = ({ c }: { c: Ctx }) => (
  <Page bg="bg-cream">
    <Head onBack={c.back} title="Tube light" sub="Corridor F2 · 3 students · 4 days ago" />
    <Body className="pt-3">
      <Art n="route" className="w-full h-auto -mx-6" style={{ width: 'calc(100% + 48px)' }} />
      <h1 className="font-head font-extrabold text-[24px] mt-6">Waiting for a part.</h1>
      <p className="text-[13.5px] text-mid mt-3">A tube light choke is on its way. We will book your slot the moment it arrives. You do not need to do anything.</p>
      <div className="mt-6 font-head font-extrabold text-[13px]">What happened</div>
      {[['Supervisor ordered a part', 'Tue 29 Sep, 4:40 PM'], ['Ravi checked the fitting', 'Tue 29 Sep, 4:10 PM'], ['Verified, sent to Ravi', 'Sat 26 Sep, 6:00 PM']].map(([a, b], i) => (
        <div key={a} className="flex gap-3 mt-3 items-start"><Art n="tally" w={14} className={i === 0 ? '' : 'opacity-0'} />{i > 0 && <span className="-ml-[26px] w-3.5 h-3.5 rounded-full border-2 border-navy bg-cream" />}<div className="-mt-1"><div className="font-head font-extrabold text-[13px]">{a}</div><div className="text-[11px] text-mid">{b}</div></div></div>))}
    </Body>
  </Page>
)

export const Missed = ({ c }: { c: Ctx }) => {
  const slots = [['Wed 30', '8:30 PM'], ['Wed 30', '9:00 PM'], ['Thu 1', '8:30 PM']]; const [s, setS] = useState(0); const [open, setOpen] = useState(false)
  return (
    <Page>
      <Head onBack={c.back} title="Missed visit" />
      <Body className="pt-1">
        <div className="relative" style={{ height: 190 }}>
          <Art n="door" w={130} className="absolute left-0 top-0" />
          <ArtBox n="sticky" className="absolute right-0 top-[6px]" style={{ width: 188, height: 130, transform: 'rotate(1deg)' }}><div className="px-4 pt-6 text-[12px]">Ravi came at 8:40. The door was locked.</div></ArtBox>
          <div className="absolute right-[56px] bottom-[2px] flex items-center gap-2 text-[12px] font-head font-extrabold"><Art n="tally" w={22} /><span className="w-[20px] h-[20px] rounded-full border-2 border-navy bg-cream" />1 of 2</div>
        </div>
        <div className="font-head font-extrabold text-[12.5px] mt-3">Pick a new slot</div>
        <div className="grid grid-cols-3 gap-2 mt-2">{slots.map(([d, t], i) => (
          <button key={d + t} onClick={() => setS(i)} className={`rounded-[12px] border-[2.5px] border-navy py-2 ${s === i ? 'bg-sun shadow-[0_3px_0_#00224E]' : 'bg-cream'}`}><div className="font-head font-extrabold text-[15px]">{d}</div><div className="font-mono text-[11px]">{t}</div></button>))}</div>
        <button onClick={() => setOpen(!open)} className="mt-3 w-full rounded-[12px] border-[2.5px] border-navy bg-sand2 px-3 py-2.5 flex justify-between items-center text-left"><span><span className="block text-[13px]">Let them in if I'm out</span><span className="text-[11px] text-mid">The warden opens BG04</span></span>
          <span className={`w-11 h-6 rounded-full border-2 border-navy flex items-center px-0.5 ${open ? 'bg-navy justify-end' : 'bg-cream justify-start'}`}><span className={`w-4 h-4 rounded-full ${open ? 'bg-cream' : 'bg-navy'}`} /></span></button>
        <p className="text-[11.5px] text-mid mt-3">After two missed visits we fix a slot for you and the warden opens the room.</p>
      </Body>
      <Foot><Button onClick={() => c.reset('homeActive')}>Book this slot</Button></Foot>
    </Page>
  )
}

export const Rate = ({ c }: { c: Ctx }) => {
  const [stars, setStars] = useState(4); const [tags, setTags] = useState(['On time', 'Explained the fix']); const [note, setNote] = useState('')
  const all = ['On time', 'Polite', 'Cleaned up', 'Explained the fix', 'Quick']
  return (
    <Page bg="bg-sun">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-[56px] flex flex-col items-center">
        <Beaver pose="thumbs" />
        <h1 className="font-head font-extrabold text-[31px] mt-2">How did it go?</h1>
        <p className="font-mono text-[11px]">Ravi Kumar · fan · BG04</p>
        <div className="flex gap-2 mt-3">{[1, 2, 3, 4, 5].map(n => <button key={n} aria-label={`${n} stars`} onClick={() => setStars(n)} className="text-[42px] leading-none" style={{ color: n <= stars ? '#00224E' : 'transparent', WebkitTextStroke: '2.5px #00224E' }}>★</button>)}</div>
        <div className="flex flex-wrap justify-center gap-2 mt-4">{all.map(t => <Chip key={t} on={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t])}>{t}</Chip>)}</div>
        <label className="w-full mt-4 font-mono text-[10.5px]">SAY MORE...<textarea value={note} onChange={e => setNote(e.target.value)} className="w-full h-[72px] mt-1 rounded-[12px] border-[2.5px] border-navy bg-cream p-2 text-[13px]" /></label>
      </div>
      <Foot link={<LinkBtn onClick={() => c.reset('homeEmpty')}>Skip for now</LinkBtn>}><Button variant="secondary" onClick={() => { c.setRating({ stars, note }); c.reset('closed') }}>Submit</Button></Foot>
    </Page>
  )
}

export const Closed = ({ c }: { c: Ctx }) => (
  <Page>
    <Head onBack={() => c.reset('homeEmpty')} title="Closed" />
    <Body className="pt-1 flex flex-col items-center">
      <ArtBox n="shape" style={{ width: 340, height: 400, transform: 'rotate(-1deg)' }}>
        <div className="px-7 pt-7">
          <div className="font-head font-extrabold text-[19px]">Fan replacement</div><div className="font-mono text-[10.5px] text-mid">BG04 · Mon 28 Sep, 8:50 PM</div><div className="text-[11.5px] text-mid">Fixed by Ravi</div>
          <div className="relative"><p className="text-[12.5px] mt-3 max-w-[170px]">Replaced the fan capacitor and tested all speed settings.</p><Art n="stamp" w={76} className="absolute right-0 top-0" /></div>
        </div>
        <div className="absolute left-7 right-7 top-[262px]"><div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <Art key={n} n="star" w={28} className={n <= c.rating.stars ? '' : 'opacity-25'} />)}</div><p className="text-[11.5px] text-mid mt-1">{c.rating.note ? `"${c.rating.note}"` : '"Ravi was on time and explained the fix."'}</p></div>
      </ArtBox>
    </Body>
    <Foot link={<LinkBtn onClick={() => c.go('whats')}>It's broken again · reopen</LinkBtn>}><Button onClick={() => c.reset('pick')}>Report something else</Button></Foot>
  </Page>
)

export const Whats = ({ c }: { c: Ctx }) => {
  const [sel, setSel] = useState(0); const [note, setNote] = useState('')
  const o = [['Still not working', 'The fan does not turn on or still makes noise.'], ['Fixed badly', ''], ['Nobody came', '']]
  return (
    <Page>
      <Head onBack={c.back} title="What's wrong?" />
      <Body className="pt-1">
        <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[190px]">{o.map(([l], i) => (
          <button key={l} onClick={() => setSel(i)} className={`rounded-[14px] border-[2.5px] border-navy font-head font-extrabold text-[13px] p-3 flex flex-col items-center justify-end gap-1 ${i === 0 ? 'row-span-2' : ''} ${sel === i ? 'bg-sun shadow-[0_3px_0_#00224E]' : 'bg-cream'}`}>{i === 0 && <Art n="main" w={88} />}{l}</button>))}</div>
        <p className="text-[12px] text-mid mt-2">{o[sel][1] || 'Tell the supervisor what happened.'}</p>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Tell the supervisor what you saw..." className="w-full h-[110px] mt-3 rounded-[12px] border-[2.5px] border-navy bg-cream p-3 text-[13px]" />
        <button className="mt-3 flex items-center gap-3 text-[12.5px]"><Art n="photo" w={56} />Add a photo</button>
        <p className="text-[12px] text-mid mt-4">This goes to the supervisor, not the technician.</p>
      </Body>
      <Foot><Button onClick={() => c.reset('homeActive')}>Send to supervisor</Button></Foot>
    </Page>
  )
}
