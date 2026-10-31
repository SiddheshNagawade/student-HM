import { Art, ArtBox, Back, Beaver, Button } from '../components/ui'
import { Body, Demo, Foot, Head, Page } from './kit'
import type { Ctx, Screen } from './App'

export const Alerts = ({ c, empty }: { c: Ctx; empty?: boolean }) => (
  <Page>
    <Head onBack={c.back} title="Alerts" />
    {empty ? (
      <div className="flex-1 flex flex-col items-center pt-[70px] px-6 text-center"><Beaver pose="sit" />
        <h1 className="font-head font-extrabold text-[24px] mt-6">Nothing new.</h1><p className="text-[13px] text-mid mt-3 max-w-[300px]">We'll tell you here when a technician is on the way or a part arrives.</p></div>
    ) : (
      <Body className="pt-0">
        {([['TODAY', [['Ravi is 10 minutes away', 'Fan replacement · just now', 'sticky', 'pin'], ['Photo received', 'Fan · 2 hours ago', 'note', 'photo']]], ['YESTERDAY', [['Waiting on a part', 'Tube light · yesterday', 'note', 'part'], ['Report submitted', 'Fan · yesterday', 'note', 'tick']]]] as [string, string[][]][]).map(([h, items]) => (
          <div key={h} className="mb-2"><div className="font-mono text-[10.5px] text-mid mb-3">{h}</div>
            {items.map(([t, s, bg, ic]) => (
              <ArtBox key={t} n={bg} className="mb-4" style={{ height: bg === 'sticky' ? 96 : 78, width: '100%' }}>
                <div className="flex items-center justify-between px-5 pt-[22px]"><div><div className="font-head font-extrabold text-[14.5px]">{t}</div><div className="text-[11px] text-mid">{s}</div></div><Art n={ic} w={ic === 'pin' ? 26 : 30} /></div>
              </ArtBox>))}</div>))}
        <p className="text-center text-[12px] text-mid underline mt-8">You're all caught up</p>
      </Body>)}
  </Page>
)

export const Profile = ({ c }: { c: Ctx }) => {
  const rows = [['ACCOUNT', ['Notification preferences', 'Privacy and data', 'Linked room details', 'Usual free hours']], ['SUPPORT', ['Report a privacy concern', 'Contact the hostel office']]] as const
  return (
    <Page>
      <Head onBack={c.back} title="you" />
      <Body className="pt-0">
        <div className="relative mx-auto" style={{ width: 342, height: 175 }}>
          <Art n="badge" className="absolute inset-0 w-full h-full" />
          <div className="absolute left-[34px] top-[58px] w-[56px] h-[56px] rounded-full bg-sun border-[2.5px] border-navy flex items-center justify-center font-head font-extrabold text-[28px]">S</div>
          <div className="absolute left-[104px] top-[62px]"><div className="font-head font-extrabold text-[19px]">Siddhi Sharma</div><div className="text-[12px]">Himalya Bhawan</div><div className="font-mono text-[11px] mt-1">{(c.loc.block + c.loc.floor + c.loc.room).toUpperCase()}</div></div>
        </div>
        <p className="text-[10.5px] text-mid">Roll number stays hidden from technicians</p>
        {rows.map(([h, items]) => <div key={h} className="mt-4"><div className="font-mono text-[10px] text-mid mb-1">{h}</div>
          {items.map(i => <button key={i} onClick={i === 'Usual free hours' ? () => c.go('hours') : undefined} className="w-full flex justify-between items-center h-11 border-b border-navy/25 font-head font-extrabold text-[13.5px]">{i}<Art n="arrow" w={20} /></button>)}</div>)}
        <div className="mt-6 pb-6"><Demo items={[['no connection', () => c.go('eOffline')], ['server error', () => c.go('eServer')], ['session expired', () => c.go('eSession')], ['not found', () => c.go('eNotFound')]]} /></div>
      </Body>
    </Page>
  )
}

const E: Record<string, { pose: 'wave' | 'think' | 'point'; title: string; body: string; p: string; s?: string }> = {
  offline: { pose: 'wave', title: 'No connection', body: 'Your reports are safe on this phone. We send them as soon as you are back online.', p: 'Try again', s: 'See saved reports' },
  server: { pose: 'think', title: 'That was on us.', body: 'Something broke on our side. Nothing you reported is lost.', p: 'Try again', s: 'Contact the hostel office' },
  session: { pose: 'point', title: 'Please sign in again.', body: 'For your safety we sign you out after a while. Your reports are still here.', p: 'Sign in' },
  notfound: { pose: 'think', title: 'We cannot find that.', body: 'That request may be closed, or merged with another one.', p: 'Back to home' },
}
export const Errors = ({ c, kind }: { c: Ctx; kind: 'offline' | 'server' | 'session' | 'notfound' }) => {
  const e = E[kind]; const act = kind === 'session' ? () => c.reset('signin' as Screen) : kind === 'notfound' ? () => c.reset('homeEmpty') : c.back
  return (
    <Page>
      <div className="absolute left-5 top-[52px]"><Back onClick={c.back} /></div>
      <div className="flex-1 flex flex-col items-center pt-[150px] px-6"><Beaver pose={e.pose} />
        <h1 className="font-head font-extrabold text-[24px] mt-5 text-center">{e.title}</h1><p className="text-center text-[13px] text-mid mt-3 max-w-[300px]">{e.body}</p></div>
      <Foot link={e.s ? <button onClick={c.back} className="text-[12.5px] underline text-mid">{e.s}</button> : undefined}><Button onClick={act}>{e.p}</Button></Foot>
    </Page>
  )
}
