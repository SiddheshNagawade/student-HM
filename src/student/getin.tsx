import { useState, useRef } from 'react'
import { Art, ArtBox, Beaver, Button, Cell, Input } from '../components/ui'
import { Body, Foot, Head, LinkBtn, Page, Sheet } from './kit'
import type { Ctx } from './App'

const Wordmark = () => <div className="font-mark font-bold text-[24px] leading-none">Align</div>
const roomCode = (c: Ctx) => (c.loc.block + c.loc.floor + c.loc.room).toUpperCase()

export const Welcome = ({ c }: { c: Ctx }) => (
  <Page>
    <Art n="facade" className="w-full h-auto shrink-0" />
    <div className="px-6 pt-2">
      <Wordmark />
      <h1 className="font-head font-extrabold text-[31px] leading-tight mt-3">Report it once.</h1>
      <p className="text-[15px] text-mid mt-3 max-w-[300px]">Hostel maintenance, kept in line. Tell us what broke and we handle the rest.</p>
    </div>
    <Foot><Button onClick={() => c.go('signin')}>Get started</Button></Foot>
  </Page>
)

export const SignIn = ({ c, error }: { c: Ctx; error?: boolean }) => {
  const [email, setEmail] = useState(error ? 'you@gmail.com' : '')
  const submit = () => (/@iitx\.ac\.in$/i.test(email.trim()) ? (c.setEmail(email.trim()), c.go('verify')) : error ? undefined : c.go('signinErr'))
  return (
    <Page>
      <div className="relative shrink-0">
        <Art n="facade" className="w-full h-auto" />
        {!error && <span className="absolute right-[24px] top-[22px] text-[12px] text-mid">Your window</span>}
      </div>
      <Sheet className="px-6 pt-5">
        <Wordmark />
        <h1 className="font-head font-extrabold text-[19px] leading-snug mt-3 max-w-[320px]">{error ? "That one didn't work." : 'Sign in with your institute email.'}</h1>
        <div className={error ? 'mt-3' : 'mt-5'}>
          <Input type="email" error={error} placeholder="you@iitx.ac.in" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        {error && <p className="text-[12.5px] text-ember mt-2">needs to end in iitx.ac.in</p>}
        <Button className="mt-auto mb-7" onClick={submit}>Continue</Button>
      </Sheet>
    </Page>
  )
}

export const Verify = ({ c }: { c: Ctx }) => {
  const [code, setCode] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  return (
    <Page>
      <Head onBack={c.back} top="pt-[80px]" />
      <Body className="pt-2">
        <Art n="plane" />
        <h1 className="font-head font-extrabold text-[31px] leading-tight mt-5">Check your email</h1>
        <p className="text-[15px] text-mid mt-3">We sent a 6 digit code to {c.email || 'siddhi@iitx.ac.in'}. It works for 10 minutes.</p>
        <div className="mt-6 relative flex gap-[10px]" onClick={() => ref.current?.focus()}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`w-12 h-[60px] rounded-[12px] border-[2.5px] border-navy bg-cream flex items-center justify-center font-mono text-[24px] ${i === code.length ? 'shadow-[0_3px_0_#00224E]' : ''}`}>{code[i] || ''}</div>
          ))}
          <input ref={ref} autoFocus inputMode="numeric" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="absolute inset-0 opacity-0" aria-label="6 digit code" />
        </div>
      </Body>
      <Foot link={<span className="text-[13.5px] text-mid underline">Resend code in 0:30</span>}><Button disabled={code.length < 6} onClick={() => c.go('isyou')}>Verify</Button></Foot>
    </Page>
  )
}

export const IsYou = ({ c }: { c: Ctx }) => (
  <Page>
    <Head onBack={c.back} top="pt-[80px]" />
    <Body className="pt-2">
      <h1 className="font-head font-extrabold text-[31px] leading-tight">Is this you?</h1>
      <p className="text-[15px] text-mid mt-3">We found you in the institute directory.</p>
      <div className="relative mt-5 mx-auto" style={{ width: 340, height: 230 }}>
        <Art n="idcard" className="absolute left-[14px] top-[22px]" />
        <div className="absolute left-[66px] top-[74px] font-head font-extrabold text-[40px] leading-none">S</div>
        <div className="absolute left-[125px] top-[78px] font-head font-extrabold text-[22px] leading-tight">Siddhi Sharma</div>
        <div className="absolute left-[125px] top-[114px] text-[13.5px]">Himalya Bhawan</div>
        <div className="absolute left-[125px] top-[146px] font-mono text-[13px]">BG04</div>
      </div>
      <p className="text-[13.5px] text-mid mt-4">Your roll number stays hidden from technicians.</p>
    </Body>
    <Foot link={<LinkBtn onClick={c.back}>Not me</LinkBtn>}><Button onClick={() => c.go('where')}>Yes, that's me</Button></Foot>
  </Page>
)

export const Where = ({ c }: { c: Ctx }) => {
  const { block, floor, room } = c.loc
  const set = (k: 'block' | 'floor' | 'room', v: string) => c.setLoc({ ...c.loc, [k]: v })
  return (
    <Page>
      <Head onBack={c.back} title="Step 1 of 2" top="pt-[80px]" />
      <Body className="pt-1">
        <h1 className="font-head font-extrabold text-[31px] leading-tight">Where do you live?</h1>
        <p className="text-[15px] text-mid mt-3">Technicians use this to find your room.</p>
        <div className="mt-5"><Input label="Hostel" value="Himalya Bhawan" readOnly /></div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Input label="Block" value={block} maxLength={1} onChange={e => set('block', e.target.value)} />
          <Input label="Floor" value={floor} maxLength={1} onChange={e => set('floor', e.target.value)} />
          <Input label="Room" value={room} maxLength={3} onChange={e => set('room', e.target.value)} />
        </div>
        <div className="mt-4 h-[128px] rounded-[16px] bg-sand relative flex items-center justify-between px-[14px]">
          <span className="text-[15px]">Your room code</span>
          <Art n="patch" className="absolute left-[133px] top-[14px] opacity-0" />
          <span className="font-mono text-[24px] w-[48px] text-right">{roomCode(c)}</span>
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
    <Body className="pt-1">
      <p className="text-[13.5px] text-mid max-w-[334px]">We use this to suggest slots. Technicians never see it.</p>
      <div className="mt-3 grid grid-cols-[44px_repeat(4,1fr)] gap-x-[10px] gap-y-[10px] items-center">
        <span />{PARTS.map(p => <span key={p} className="text-[12px] text-mid text-center">{p}</span>)}
        {DAYS.map((d, r) => (
          <div key={d} className="contents">
            <span className="font-head font-extrabold text-[16px]">{d}</span>
            {PARTS.map((_, k) => <div key={k} className="flex justify-center"><Cell on={c.hours.has(r * 4 + k)} onClick={() => c.toggleHour(r * 4 + k)} /></div>)}
          </div>
        ))}
      </div>
      <p className="text-[13.5px] text-mid mt-5 max-w-[334px]">Exams or events? change this any time, your slots will adjust.</p>
    </Body>
    <Foot><Button onClick={() => c.go('alerts')}>Save</Button></Foot>
  </Page>
)

export const AllowAlerts = ({ c }: { c: Ctx }) => {
  const ask = async () => { try { await Notification.requestPermission() } catch { /* unsupported */ } c.reset('homeEmpty') }
  return (
    <Page>
      <Head onBack={c.back} top="pt-[80px]" />
      <Body className="pt-2">
        <Beaver pose="wave" size={150} />
        <h1 className="font-head font-extrabold text-[31px] leading-tight mt-4">Know when someone is on the way</h1>
        <p className="text-[15px] text-mid mt-4">Three kinds of alert, nothing else.</p>
        <div className="mt-4 space-y-[14px]">
          {['Your report was checked', 'A technician is 10 minutes away', 'The fix is done, please confirm'].map(t => (
            <div key={t} className="flex items-center gap-[12px] h-[50px] px-[14px] rounded-[14px] bg-cream"><span className="w-[22px] h-[22px] rounded-full bg-sun border-2 border-navy shrink-0" /><span className="text-[14px]">{t}</span></div>
          ))}
        </div>
      </Body>
      <Foot link={<LinkBtn onClick={() => c.reset('homeEmpty')}>Not now</LinkBtn>}><Button onClick={ask}>Allow alerts</Button></Foot>
    </Page>
  )
}

export const HomeEmpty = ({ c }: { c: Ctx }) => (
  <Page bg="bg-cream">
    <div className="relative shrink-0">
      <div className="absolute left-6 top-[44px] z-10"><div className="font-head font-extrabold text-[24px] leading-none">{roomCode(c)}</div><div className="text-[12.5px] text-mid mt-1">Himalya Bhawan</div></div>
      <Art n="room-empty" className="w-full h-auto" />
      <Beaver pose="wave" size={114} className="absolute left-[102px] top-[260px]" />
    </div>
    <Sheet bg="bg-sun2" className="px-6 pt-6">
      <h1 className="font-head font-extrabold text-[24px] leading-tight">All good in {roomCode(c)}.</h1>
      <p className="text-[15px] text-mid mt-4">Nothing is broken right now. If something is, tell us and we will sort it out.</p>
      <Button className="mt-auto mb-7" onClick={() => c.go('pick')}>Something broke?</Button>
    </Sheet>
  </Page>
)
export { ArtBox }
