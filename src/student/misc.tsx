import { Back, ErrorPage, Paper } from '../components/ui'
import { Body, Demo, Head, Page } from './kit'
import type { Ctx } from './App'

export const Alerts = ({ c, empty }: { c: Ctx; empty?: boolean }) => (
  <Page bg="bg-sun2">
    <Head onBack={c.back} title="Alerts" />
    {empty ? (
      <div className="flex-1 flex flex-col items-center pt-24 px-6 text-center"><img src="/art/beaver-wave.svg" alt="" width={120} />
        <h1 className="font-head font-extrabold text-[24px] mt-6">Nothing new.</h1><p className="text-[12.5px] text-mid mt-3">We'll tell you here when a technician is on the way or a part arrives.</p></div>
    ) : (
      <Body className="pt-2">
        {[['TODAY', [['Ravi is 10 minutes away', 'Fan replacement - just now', 'sun', '📍︎'], ['Photo received', 'Fan - 2 hours ago', 'cream', '📷︎']]], ['YESTERDAY', [['Waiting on a part', 'Tube light - yesterday', 'cream', '🚚︎'], ['Report submitted', 'Fan - yesterday', 'cream', '✓']]]].map(([h, items]) => (
          <div key={h as string} className="mb-3"><div className="font-mono text-[10px] text-mid mb-2">{h as string}</div>
            {(items as string[][]).map(([t, s, tone, i]) => <Paper key={t} tape tone={tone as 'sun' | 'cream'} className="p-4 pt-5 mb-4"><div className="flex justify-between items-center"><div><div className="font-head font-extrabold text-[14px]">{t}</div><div className="text-[11px] text-mid">{s}</div></div><span className="text-[20px]">{i}</span></div></Paper>)}</div>))}
        <p className="text-center text-[12px] text-mid underline mt-6">You're all caught up</p>
      </Body>)}
  </Page>
)

export const Profile = ({ c }: { c: Ctx }) => {
  const rows = [['ACCOUNT', ['Notification preferences', 'Privacy and data', 'Linked room details', 'Usual free hours']], ['SUPPORT', ['Report a privacy concern', 'Contact the hostel office']]] as const
  return (
    <Page bg="bg-sun2">
      <Head onBack={c.back} title="you" />
      <Body>
        <Paper tape className="p-4 pt-6 mt-2"><div className="flex items-center gap-3"><span className="w-14 h-14 rounded-full bg-sun border-[2.5px] border-navy flex items-center justify-center font-head font-extrabold text-[28px]">S</span><div><div className="font-head font-extrabold text-[19px]">Siddhi Sharma</div><div className="text-[12px]">Himalya Bhawan</div><div className="font-mono text-[11px]">{(c.loc.block + c.loc.floor + c.loc.room).toUpperCase()}</div></div></div></Paper>
        <p className="text-[10.5px] text-mid mt-2">Roll number stays hidden from technicians</p>
        {rows.map(([h, items]) => <div key={h} className="mt-4"><div className="font-mono text-[10px] text-mid mb-1">{h}</div>
          {items.map(i => <button key={i} onClick={i === 'Usual free hours' ? () => c.go('hours') : undefined} className="w-full flex justify-between items-center h-11 border-b border-navy/30 font-head font-extrabold text-[13.5px]">{i}<span>→</span></button>)}</div>)}
        <div className="mt-6"><Demo items={[['no connection', () => c.go('eOffline')], ['server error', () => c.go('eServer')], ['session expired', () => c.go('eSession')], ['not found', () => c.go('eNotFound')]]} /></div>
      </Body>
    </Page>
  )
}

export const Errors = ({ c, kind }: { c: Ctx; kind: 'offline' | 'server' | 'session' | 'notfound' }) => {
  const m = {
    offline: { title: 'No connection', body: 'Your reports are safe on this phone. We send them as soon as you are back online.', p: ['Try again', c.back], s: ['See saved reports', c.back], pose: 'wave' },
    server: { title: 'That was on us.', body: 'Something broke on our side. Nothing you reported is lost.', p: ['Try again', c.back], s: ['Contact the hostel office', c.back], pose: 'think' },
    session: { title: 'Please sign in again.', body: 'For your safety we sign you out after a while. Your reports are still here.', p: ['Sign in', () => c.reset('signin')], s: undefined, pose: 'wave' },
    notfound: { title: 'We cannot find that.', body: 'That request may be closed, or merged with another one.', p: ['Back to home', () => c.reset('homeEmpty')], s: undefined, pose: 'think' },
  }[kind] as { title: string; body: string; p: [string, () => void]; s?: [string, () => void]; pose: 'wave' | 'think' }
  return <Page><div className="absolute top-14 left-5"><Back onClick={c.back} /></div><ErrorPage pose={m.pose} title={m.title} body={m.body} primary={m.p} secondary={m.s} /></Page>
}
