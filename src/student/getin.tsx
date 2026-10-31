import { useState, useRef } from 'react'
import { Beaver, Button, Cell, Input, Paper } from '../components/ui'
import { Body, Demo, Foot, Head, LinkBtn, Page, Room } from './kit'
import type { Ctx } from './App'

const Facade = ({ h = 480 }: { h?: number }) => <img src="/art/facade.svg" alt="" className="w-full block" style={{ height: h, objectFit: 'cover', objectPosition: 'top' }} />
const Wordmark = () => <div className="font-mark font-bold text-[24px]">Align</div>

export const Welcome = ({ c }: { c: Ctx }) => (
  <Page>
    <Facade />
    <div className="px-6 pt-2">
      <Wordmark />
      <h1 className="font-head font-extrabold text-[31px] leading-tight mt-2">Report it once.</h1>
      <p className="text-[15px] text-mid mt-3">Hostel maintenance, kept in line. Tell us what broke and we handle the rest.</p>
    </div>
    <Foot><Button onClick={() => c.go('signin')}>Get started</Button></Foot>
  </Page>
)

export const SignIn = ({ c, error }: { c: Ctx; error?: boolean }) => {
  const [email, setEmail] = useState(error ? 'you@gmail.com' : '')
  const submit = () => (/@iitx\.ac\.in$/i.test(email.trim()) ? (c.setEmail(email.trim()), c.go('verify')) : error ? undefined : c.go('signinErr'))
  return (
    <Page>
      <div className="relative"><Facade h={478} /><span className="absolute right-6 top-5 font-body text-[12px] text-mid">Your window</span></div>
      <div className="flex-1 -mt-3 rounded-t-[28px] bg-cream border-t-[2.5px] border-navy px-6 pt-5 flex flex-col">
        <Wordmark />
        <h1 className="font-head font-extrabold text-[19px] mt-2">{error ? "That one didn't work." : 'Sign in with your institute email.'}</h1>
        <div className="mt-5"><Input type="email" error={error} placeholder="you@iitx.ac.in" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></div>
        {error && <p className="text-[12.5px] text-ember mt-2">needs to end in iitx.ac.in</p>}
        <Button className="mt-auto mb-7" onClick={submit}>Continue</Button>
      </div>
    </Page>
  )
}

export const Verify = ({ c }: { c: Ctx }) => {
  const [code, setCode] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const ok = code.length === 6
  return (
    <Page>
      <Head onBack={c.back} />
      <Body>
        <svg viewBox="0 0 260 118" width="260" fill="none" stroke="#00224E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 100C60 110 90 60 150 70S200 30 240 28" strokeDasharray="3 6" /><path d="M222 12l34 8-30 14zM226 34l-3 14 9-9" fill="#FFFBF3" />
        </svg>
        <h1 className="font-head font-extrabold text-[31px] mt-5">Check your email</h1>
        <p className="text-[15px] text-mid mt-3">We sent a 6 digit code to {c.email || 'siddhi@iitx.ac.in'}. It works for 10 minutes.</p>
        <div className="mt-6 relative flex gap-2.5 justify-between" onClick={() => ref.current?.focus()}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`w-12 h-[60px] rounded-[12px] border-[2.5px] border-navy bg-cream flex items-center justify-center font-mono text-[24px] ${i === code.length ? 'shadow-[0_3px_0_#00224E]' : ''}`}>{code[i] || ''}</div>
          ))}
          <input ref={ref} autoFocus inputMode="numeric" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="absolute inset-0 opacity-0" aria-label="6 digit code" />
        </div>
      </Body>
      <Foot link={<span className="text-[12.5px] text-mid underline">Resend code in 0:30</span>}><Button disabled={!ok} onClick={() => c.go('isyou')}>Verify</Button></Foot>
    </Page>
  )
}

export const IsYou = ({ c }: { c: Ctx }) => (
  <Page>
    <Head onBack={c.back} />
    <Body>
      <h1 className="font-head font-extrabold text-[31px]">Is this you?</h1>
      <p className="text-[15px] text-mid mt-2">We found you in the institute directory.</p>
      <Paper className="mt-6 h-[210px] p-6" tone="cream" tape>
        <div className="flex items-center gap-4 mt-6">
          <div className="w-[60px] h-[60px] rounded-full bg-sun border-[2.5px] border-navy flex items-center justify-center font-head font-extrabold text-[30px]">S</div>
          <div><div className="font-head font-extrabold text-[22px]">Siddhi Sharma</div><div className="text-[13.5px]">Himalya Bhawan</div></div>
        </div>
        <div className="mt-4 ml-[76px] pt-3 border-t-2 border-dashed border-navy font-mono text-[13px]">BG04</div>
      </Paper>
      <p className="text-[12.5px] text-mid mt-5">Your roll number stays hidden from technicians.</p>
    </Body>
    <Foot link={<LinkBtn onClick={c.back}>Not me</LinkBtn>}><Button onClick={() => c.go('where')}>Yes, that's me</Button></Foot>
  </Page>
)

export const Where = ({ c }: { c: Ctx }) => {
  const { block, floor, room } = c.loc
  const set = (k: 'block' | 'floor' | 'room', v: string) => c.setLoc({ ...c.loc, [k]: v })
  const code = `${block}${floor}${room}`.toUpperCase()
  return (
    <Page>
      <Head onBack={c.back} title="Step 1 of 2" />
      <Body>
        <h1 className="font-head font-extrabold text-[31px]">Where do you live?</h1>
        <p className="text-[15px] text-mid mt-2">Technicians use this to find your room.</p>
        <div className="mt-6"><Input label="Hostel" value="Himalya Bhawan" readOnly /></div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Input label="Block" value={block} maxLength={1} onChange={e => set('block', e.target.value)} />
          <Input label="Floor" value={floor} maxLength={1} onChange={e => set('floor', e.target.value)} />
          <Input label="Room" value={room} maxLength={3} onChange={e => set('room', e.target.value)} />
        </div>
        <div className="mt-5 h-[110px] rounded-[16px] bg-sand border-[2.5px] border-navy flex items-center justify-between px-4">
          <span className="text-[15px]">Your room code</span><span className="font-mono text-[24px]">{code}</span>
        </div>
      </Body>
      <Foot><Button onClick={() => c.go('hours')}>Next</Button></Foot>
    </Page>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], PARTS = ['Morning', 'Afternoon', 'Evening', 'Night']
export const Hours = ({ c }: { c: Ctx }) => (
  <Page>
    <Head onBack={c.back} title="Usual free hours" />
    <Body>
      <p className="text-[13.5px] text-mid">We use this to suggest slots. Technicians never see it.</p>
      <div className="mt-4 grid grid-cols-[44px_repeat(4,1fr)] gap-x-3 gap-y-2.5 items-center">
        <span />{PARTS.map(p => <span key={p} className="text-[10.5px] text-mid text-center">{p}</span>)}
        {DAYS.map((d, r) => (
          <div key={d} className="contents">
            <span className="font-head font-bold text-[15px]">{d}</span>
            {PARTS.map((_, k) => <div key={k} className="flex justify-center"><Cell on={c.hours.has(r * 4 + k)} onClick={() => c.toggleHour(r * 4 + k)} /></div>)}
          </div>
        ))}
      </div>
      <p className="text-[12.5px] text-mid mt-5">Exams or events? change this any time, your slots will adjust.</p>
    </Body>
    <Foot><Button onClick={() => c.go('alerts')}>Save</Button></Foot>
  </Page>
)

export const AllowAlerts = ({ c }: { c: Ctx }) => {
  const ask = async () => { try { await Notification.requestPermission() } catch { /* unsupported */ } c.reset('homeEmpty') }
  return (
    <Page>
      <Head onBack={c.back} />
      <Body>
        <Beaver pose="wave" size={110} />
        <h1 className="font-head font-extrabold text-[31px] leading-tight mt-3">Know when someone is on the way</h1>
        <p className="text-[15px] text-mid mt-3">Three kinds of alert, nothing else.</p>
        <div className="mt-4 space-y-3">
          {['Your report was checked', 'A technician is 10 minutes away', 'The fix is done, please confirm'].map(t => (
            <div key={t} className="flex items-center gap-3 h-[50px] px-3.5 rounded-[14px] bg-cream"><span className="w-[22px] h-[22px] rounded-full bg-sun border-2 border-navy" /><span className="text-[14px]">{t}</span></div>
          ))}
        </div>
      </Body>
      <Foot link={<LinkBtn onClick={() => c.reset('homeEmpty')}>Not now</LinkBtn>}><Button onClick={ask}>Allow alerts</Button></Foot>
    </Page>
  )
}

export const HomeEmpty = ({ c }: { c: Ctx }) => (
  <Page bg="bg-cream">
    <div className="px-6 pt-[44px] flex items-start justify-between">
      <div><div className="font-head font-extrabold text-[24px]">{(c.loc.block + c.loc.floor + c.loc.room).toUpperCase()}</div><div className="text-[12.5px] text-mid">Himalya Bhawan</div></div>
      <div className="flex gap-2"><button aria-label="Alerts" onClick={() => c.go('alerts2')} className="w-9 h-9 rounded-full border-[2.5px] border-navy bg-cream">🔔︎</button>
        <button aria-label="You" onClick={() => c.go('profile')} className="w-9 h-9 rounded-full border-[2.5px] border-navy bg-sun font-head font-extrabold">S</button></div>
    </div>
    <div className="px-6 pt-4 relative"><Room /><Beaver pose="wave" size={90} className="absolute left-[84px] bottom-[-10px]" /></div>
    <div className="flex-1 mt-3 -mx-0 rounded-t-[28px] bg-sun2 border-t-[2.5px] border-navy px-6 pt-5 flex flex-col">
      <h1 className="font-head font-extrabold text-[24px]">All good in {(c.loc.block + c.loc.floor + c.loc.room).toUpperCase()}.</h1>
      <p className="text-[15px] text-mid mt-3">Nothing is broken right now. If something is, tell us and we will sort it out.</p>
      <Button className="mt-auto mb-7" onClick={() => c.go('pick')}>Something broke?</Button>
    </div>
  </Page>
)
export { Demo }
