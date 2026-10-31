import { useState } from 'react'
import { Beaver, Button, Chip, Paper } from '../components/ui'
import { Body, Demo, Foot, Head, LinkBtn, Page } from './kit'
import { CLOSING_CODE } from '../lib'
import type { Ctx } from './App'

const STEPS: [string, string, 'done' | 'now' | 'todo'][] = [
  ['Reported', 'Sat 26 Sep - 5:40 PM', 'done'], ['Verified', 'Sat 26 Sep - 6:00 PM', 'done'], ['Scheduled', 'Ravi - today 8:30 to 9:00 PM', 'now'],
  ['On the way', 'Ravi leaves at 8:20 PM', 'todo'], ['Visited', '', 'todo'], ['Closed', 'with your code', 'todo'],
]
export const Track = ({ c }: { c: Ctx }) => (
  <Page bg="bg-cream">
    <Head onBack={c.back} title="Fan replacement" sub="BG04 - reported 2 days ago" />
    <Body>
      <div className="relative mt-3 ml-1">
        <span className="absolute left-[15px] top-4 bottom-4 border-l-2 border-dashed border-navy" />
        {STEPS.map(([t, s, st]) => (
          <div key={t} className={`relative flex gap-4 mb-6 ${st === 'todo' ? 'opacity-55' : ''}`}>
            <span className={`z-10 w-8 h-8 rounded-full border-[2.5px] border-navy flex items-center justify-center text-cream text-[15px] ${st === 'done' ? 'bg-green' : st === 'now' ? 'bg-sun' : 'bg-cream border-dashed'}`}>{st === 'done' ? '✓' : st === 'now' ? <span className="w-2.5 h-2.5 rounded-full bg-navy" /> : ''}</span>
            <div><div className={`font-head font-extrabold ${st === 'now' ? 'text-[19px]' : 'text-[15px]'}`}>{t}</div><div className={`text-[11.5px] text-mid ${t === 'Closed' ? 'font-mono' : ''}`}>{s}</div></div>
          </div>))}
      </div>
      <LinkBtn onClick={() => c.go('nearby')}>Need help sooner?</LinkBtn>
      <div className="mt-6"><Demo items={[['on the way', () => c.go('nearby')], ['part needed', () => c.go('part')]]} /></div>
    </Body>
    <Foot link={<span className="text-[11px] text-mid">Opens after the visit</span>}><Button variant="secondary" onClick={() => c.go('rate')}>Confirm the fix</Button></Foot>
  </Page>
)

export const Nearby = ({ c }: { c: Ctx }) => (
  <Page bg="bg-sun">
    <div className="px-6 pt-[54px] flex items-end gap-2"><span className="font-head font-extrabold text-[130px] leading-[.9]">10</span><span className="font-head font-extrabold text-[24px] mb-3">min</span></div>
    <div className="px-6 mt-3"><h1 className="font-head font-extrabold text-[24px]">Ravi is nearby.</h1><p className="font-mono text-[12px] mt-1">fan - BG04 - 8:30 to 9:00 PM</p></div>
    <div className="relative h-[150px] border-b-[2.5px] border-navy mx-0"><Beaver pose="walk" size={110} className="absolute left-[60px] bottom-0" />
      <div className="absolute right-[40px] bottom-0 w-[60px] h-[100px] border-[2.5px] border-navy bg-cream rounded-t-[6px] flex items-start justify-center pt-1 font-mono text-[9px]">BG04</div></div>
    <div className="bg-sun flex-1 px-6 pt-5 flex flex-col">
      <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-sky border-[2.5px] border-navy flex items-center justify-center font-head font-extrabold">R</span><div><div className="font-head font-extrabold">Ravi Kumar</div><div className="text-[11.5px]">Electrician - 4.8 average</div></div></div>
      <div className="mt-4 text-[12.5px] font-head font-bold">Will someone be there?</div><div className="text-[12px]">You chose "I'll be in the room".</div>
      <div className="mt-auto pb-7 flex flex-col items-center gap-3"><Button variant="secondary" onClick={() => c.go('ticket')}>I'm in the room</Button><LinkBtn onClick={() => c.go('missed')}>I can't make it</LinkBtn></div>
    </div>
  </Page>
)

const Digits = ({ v, ember }: { v: string; ember?: boolean }) => (
  <div className="flex justify-around font-mono text-[44px] py-3">{v.split('').map((d, i) => <span key={i} className={d === '?' ? 'text-ember' : ''}>{d}</span>)}</div>
)
export const Ticket = ({ c }: { c: Ctx }) => (
  <Page bg="bg-sun">
    <div className="flex-1 px-6 pt-[70px] flex flex-col items-center">
      <Beaver pose="think" size={100} />
      <h1 className="font-head font-extrabold text-[24px] mt-3 text-center">Is the fan spinning?</h1>
      <p className="text-[12.5px] mt-2">Ravi says it is fixed. Check it first.</p>
      <Paper className="mt-5 w-full p-5 rotate-[-1deg]" tone="cream">
        <div className="font-mono text-[10px] text-mid">CLOSING CODE</div><div className="text-[12px]">BG04 - ceiling fan</div>
        <Digits v={CLOSING_CODE.split('').join(' ').replace(/ /g, '')} />
        <div className="border-t-2 border-dashed border-navy pt-3 text-[12.5px]">Give Ravi this code only when you are happy.<div className="text-[11px] text-mid mt-1">That is what closes the job.</div></div>
      </Paper>
      <div className="mt-4"><Demo items={[['right code', () => c.go('rate')], ['wrong code', () => c.go('wrong')]]} /></div>
    </div>
    <Foot><Button variant="secondary" onClick={() => c.go('whats')}>Not fixed yet</Button></Foot>
  </Page>
)

export const Wrong = ({ c }: { c: Ctx }) => (
  <Page bg="bg-sun">
    <div className="flex-1 px-6 pt-[120px]">
      <Paper className="p-5 rotate-[-1deg]" tone="cream"><div className="font-mono text-[10px] text-mid">closing code</div><Digits v="246?" /></Paper>
      <h1 className="font-head font-extrabold text-[24px] text-center mt-10">That code didn't match.</h1>
      <p className="text-[12.5px] text-center mt-3">Two tries left. Ask for the 4 digits again.</p>
    </div>
    <Foot link={<LinkBtn onClick={c.back}>Cancel</LinkBtn>}><Button variant="secondary" onClick={c.back}>Try again</Button></Foot>
  </Page>
)

export const Part = ({ c }: { c: Ctx }) => (
  <Page bg="bg-cream">
    <Head onBack={c.back} title="Tube light" sub="Corridor F2 - 3 students - 4 days ago" />
    <Body>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[44px]">🚚︎</span><span className="text-mid">- - - -</span>
        <div className="w-[60px] border-[2.5px] border-navy rounded-[8px] bg-cream text-center"><div className="bg-sun text-[9px] font-mono">THU</div><div className="font-head font-extrabold text-[28px]">1</div></div>
      </div>
      <h1 className="font-head font-extrabold text-[24px] mt-8">Waiting for a part.</h1>
      <p className="text-[13.5px] text-mid mt-3">A tube light choke is on its way. We will book your slot the moment it arrives. You do not need to do anything.</p>
      <div className="mt-6 font-head font-bold text-[13px]">What happened</div>
      {[['Supervisor ordered a part', 'Tue 29 Sep, 4:40 PM'], ['Ravi checked the fitting', 'Tue 29 Sep, 4:10 PM'], ['Verified, sent to Ravi', 'Sat 26 Sep, 6:00 PM']].map(([a, b]) => (
        <div key={a} className="flex gap-3 mt-3"><span className="w-3 h-3 mt-1 rounded-full border-2 border-navy bg-sun" /><div><div className="font-head font-extrabold text-[12.5px]">{a}</div><div className="text-[11px] text-mid">{b}</div></div></div>))}
    </Body>
  </Page>
)

export const Missed = ({ c }: { c: Ctx }) => {
  const slots = [['Wed 30', '8:30 PM'], ['Wed 30', '9:00 PM'], ['Thu 1', '8:30 PM']]; const [s, setS] = useState(0); const [open, setOpen] = useState(false)
  return (
    <Page>
      <Head onBack={c.back} title="Missed visit" />
      <Body>
        <div className="flex gap-3 mt-1">
          <div className="w-[110px] h-[150px] border-[2.5px] border-navy bg-sand2 rounded-[4px]" />
          <Paper tone="sun" tape className="flex-1 p-3 text-[12px] rotate-[2deg]"><div className="mt-2">Ravi came at 8:40. The door was locked.</div></Paper>
        </div>
        <div className="font-head font-bold text-[12.5px] mt-5">Pick a new slot</div>
        <div className="grid grid-cols-3 gap-2 mt-2">{slots.map(([d, t], i) => (
          <button key={d + t} onClick={() => setS(i)} className={`rounded-[12px] border-[2.5px] border-navy py-2 ${s === i ? 'bg-sun shadow-[0_3px_0_#00224E]' : 'bg-cream'}`}><div className="font-head font-extrabold text-[14px]">{d}</div><div className="font-mono text-[11px]">{t}</div></button>))}</div>
        <button onClick={() => setOpen(!open)} className="mt-4 w-full rounded-[12px] border-[2.5px] border-navy bg-sand2 p-3 flex justify-between text-left"><span><span className="block text-[13px]">Let them in if I'm out</span><span className="text-[11px] text-mid">The warden opens BG04</span></span><span>{open ? '●' : '○'}</span></button>
        <p className="text-[11.5px] text-mid mt-4">After two missed visits we fix a slot for you and the warden opens the room.</p>
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
      <div className="flex-1 px-6 pt-[70px] flex flex-col items-center">
        <Beaver pose="thumbs" size={95} />
        <h1 className="font-head font-extrabold text-[31px] mt-2">How did it go?</h1>
        <p className="font-mono text-[11px]">Ravi Kumar - fan - BG04</p>
        <div className="flex gap-2 mt-3">{[1, 2, 3, 4, 5].map(n => <button key={n} aria-label={`${n} stars`} onClick={() => setStars(n)} className="text-[40px] leading-none" style={{ color: n <= stars ? '#00224E' : 'transparent', WebkitTextStroke: '2.5px #00224E' }}>★</button>)}</div>
        <div className="flex flex-wrap justify-center gap-2 mt-4">{all.map(t => <Chip key={t} on={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter(x => x !== t) : [...tags, t])}>{t}</Chip>)}</div>
        <label className="w-full mt-4 font-mono text-[10px]">SAY MORE...<textarea value={note} onChange={e => setNote(e.target.value)} className="w-full h-[70px] mt-1 rounded-[12px] border-[2.5px] border-navy bg-cream p-2 text-[13px]" /></label>
      </div>
      <Foot link={<LinkBtn onClick={() => c.reset('homeEmpty')}>Skip for now</LinkBtn>}><Button variant="secondary" onClick={() => { c.setRating({ stars, note }); c.reset('closed') }}>Submit</Button></Foot>
    </Page>
  )
}

export const Closed = ({ c }: { c: Ctx }) => (
  <Page>
    <Head onBack={() => c.reset('homeEmpty')} title="Closed" />
    <Body>
      <Paper className="p-5 mt-2 rotate-[1deg]" tone="cream">
        <div className="font-head font-extrabold text-[19px]">Fan replacement</div><div className="font-mono text-[10.5px] text-mid">BG04 - Mon 28 Sep, 8:50 PM</div><div className="text-[12px] text-mid">Fixed by Ravi</div>
        <div className="flex justify-between mt-2"><p className="text-[12.5px] max-w-[160px]">Replaced the fan capacitor and tested all speed settings.</p><span className="w-14 h-14 rounded-full border-[3px] border-green text-green text-[34px] flex items-center justify-center">✓</span></div>
        <div className="border-t-2 border-dashed border-navy mt-4 pt-3"><div className="text-[22px] tracking-wide">{'★'.repeat(c.rating.stars)}{'☆'.repeat(5 - c.rating.stars)}</div><p className="text-[11.5px] text-mid mt-1">{c.rating.note ? `"${c.rating.note}"` : '"Ravi was on time and explained the fix."'}</p></div>
      </Paper>
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
      <Body>
        <div className="grid grid-cols-2 gap-2">{o.map(([l], i) => (
          <button key={l} onClick={() => setSel(i)} className={`rounded-[14px] border-[2.5px] border-navy font-head font-extrabold text-[13px] p-3 min-h-[80px] ${i === 0 ? 'row-span-2' : ''} ${sel === i ? 'bg-sun shadow-[0_3px_0_#00224E]' : 'bg-cream'}`}>{l}</button>))}</div>
        <p className="text-[11.5px] text-mid mt-2">{o[sel][1] || 'Tell the supervisor what happened.'}</p>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Tell the supervisor what you saw..." className="w-full h-[110px] mt-3 rounded-[12px] border-[2.5px] border-navy bg-cream p-3 text-[13px]" />
        <button className="mt-3 flex items-center gap-3 text-[12px]"><span className="w-12 h-12 rounded-[12px] border-2 border-dashed border-navy flex items-center justify-center">📷︎</span>Add a photo</button>
        <p className="text-[11.5px] text-mid mt-4">This goes to the supervisor, not the technician.</p>
      </Body>
      <Foot><Button onClick={() => c.reset('homeActive')}>Send to supervisor</Button></Foot>
    </Page>
  )
}
