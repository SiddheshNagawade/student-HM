import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(' ')

/* Pressed state: shadow collapses, button moves down by the shadow offset */
const press = 'border-[2.5px] border-navy transition-[transform,box-shadow] duration-100 active:translate-y-[3px] active:shadow-[0_0_0_#00224E] shadow-[0_3px_0_#00224E] disabled:opacity-50 disabled:pointer-events-none'

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ember' | 'royal' }
export function Button({ variant = 'primary', className, ...p }: BtnProps) {
  const v = {
    primary: 'bg-sun text-navy', secondary: 'bg-cream text-navy', ember: 'bg-ember text-cream', royal: 'bg-royal text-cream',
  }[variant]
  return <button {...p} className={cx('w-full h-[54px] rounded-full font-head font-extrabold text-[16px] text-center flex items-center justify-center', press, v, className)} />
}

/* Supervisor pills (desktop, smaller) */
export function Pill({ variant = 'primary', className, ...p }: BtnProps) {
  const v = variant === 'primary' || variant === 'royal' ? 'bg-royal text-cream' : variant === 'ember' ? 'bg-ember text-cream' : 'bg-cream text-navy'
  return <button {...p} className={cx('h-9 px-5 rounded-full font-head font-bold text-[14px] flex items-center justify-center whitespace-nowrap', press, v, className)} />
}

/* Technician: Hindi label over English sub label */
export function BigButton({ hi, en, onClick, icon = '→', className, disabled }: { hi: string; en: string; onClick?: () => void; icon?: ReactNode; className?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cx('w-full min-h-[84px] rounded-[20px] bg-signal text-navy px-5 flex items-center justify-between text-left', press, className)}>
      <span className="flex flex-col leading-tight">
        <span className="font-hi font-extrabold text-[36px] leading-[1.05]">{hi}</span>
        <span className="font-body text-[12.5px] opacity-80">{en}</span>
      </span>
      <span className="text-[28px] font-head font-extrabold">{icon}</span>
    </button>
  )
}

export function Input({ label, error, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: boolean }) {
  return (
    <label className="block w-full">
      {label && <span className="block font-mono text-[12.5px] tracking-wider text-mid mb-1.5 uppercase">{label}</span>}
      <input {...p} className={cx('w-full h-[56px] rounded-[14px] bg-cream px-4 text-[15px] outline-none border-[2.5px]', error ? 'border-ember' : 'border-navy', 'focus:shadow-[0_3px_0_#00224E]', className)} />
    </label>
  )
}

export function Chip({ on, children, onClick, className }: { on?: boolean; children: ReactNode; onClick?: () => void; className?: string }) {
  return <button onClick={onClick} className={cx('px-3.5 h-9 rounded-full border-[2.5px] border-navy font-head font-bold text-[13.5px]', on ? 'bg-navy text-cream' : 'bg-cream text-navy', className)}>{children}</button>
}

/* Keypad key (technician PIN / closing code) */
export function Key({ children, onClick, wide }: { children: ReactNode; onClick?: () => void; wide?: boolean }) {
  return <button onClick={onClick} className={cx('h-[56px] rounded-[14px] bg-sky text-navy font-mono text-[28px]', press, wide && 'col-span-1')}>{children}</button>
}

/* Free-hours grid cell */
export function Cell({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button aria-pressed={on} onClick={onClick} className={cx('w-16 h-12 rounded-[12px] border-[2.5px] border-navy', on ? 'bg-sun' : 'bg-cream')} />
}

export function Tag({ children, tone = 'sand' }: { children: ReactNode; tone?: 'sand' | 'ember' | 'green' | 'royal' | 'sun' }) {
  const t = { sand: 'bg-sand2 text-navy', ember: 'bg-cream text-ember border-ember', green: 'bg-cream text-green border-green', royal: 'bg-royal text-cream', sun: 'bg-sun text-navy' }[tone]
  return <span className={cx('inline-flex items-center px-2.5 h-6 rounded-full border-[1.5px] border-navy font-mono text-[12px]', t)}>{children}</span>
}

export function Back({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button aria-label="Back" onClick={onClick} className={cx('w-11 h-11 rounded-full bg-cream border-[2.5px] border-navy flex items-center justify-center shrink-0', className)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00224E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
    </button>
  )
}

/* Technician: HI·EN toggle + speaker (reads the screen aloud) */
export function LangPill({ lang, onToggle }: { lang: 'hi' | 'en'; onToggle: () => void }) {
  return <button onClick={onToggle} className="h-9 px-3 rounded-full bg-cream border-[2.5px] border-navy font-hi font-extrabold text-[15px]">{lang === 'hi' ? 'हिं · EN' : 'EN · हिं'}</button>
}
export function Speaker({ text, lang = 'hi-IN', className }: { text: string; lang?: string; className?: string }) {
  const [on, setOn] = useState(false)
  const say = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang
    u.onend = () => setOn(false); setOn(true); window.speechSynthesis.speak(u)
  }
  return (
    <button aria-label="Read aloud" onClick={say} className={cx('w-9 h-9 rounded-full bg-cream border-[2.5px] border-navy flex items-center justify-center', on && 'bg-sun', className)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00224E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" /></svg>
    </button>
  )
}

/* Hand-drawn art exported from Figma into /public/art. Never redrawn in code. */
export const Art = ({ n, className, style, w }: { n: string; className?: string; style?: React.CSSProperties; w?: number | string }) =>
  <img src={`/art/${n}.svg`} alt="" draggable={false} className={cx('block select-none', className)} style={{ ...(w ? { width: w, height: 'auto' } : {}), ...style }} />

/* A Figma paper object (ticket, slip, sticky, bubble, tag...) stretched behind live content */
export function ArtBox({ n, children, className, style }: { n: string; children?: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cx('relative', className)} style={style}>
      <img src={`/art/${n}.svg`} alt="" draggable={false} className="absolute inset-0 w-full h-full select-none pointer-events-none" />
      <div className="relative h-full">{children}</div>
    </div>
  )
}

export type Pose = 'wave' | 'walk' | 'thumbs' | 'point' | 'jump' | 'sit' | 'think' | 'cele' | 'stand'
export function Beaver({ pose = 'wave', size, className }: { pose?: Pose; size?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.img src={`/art/beaver-${pose}.svg`} alt="" draggable={false} className={cx('block select-none', className)} style={size ? { width: size, height: 'auto' } : undefined}
      animate={reduce || pose !== 'cele' ? undefined : { y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} />
  )
}

export function OfflineBanner({ children }: { children: ReactNode }) {
  return <div role="status" className="w-full bg-sand2 border-b-2 border-navy text-center text-[12.5px] py-1.5 px-3 font-body">{children}</div>
}

/* Full-page blocking error */
export function ErrorPage({ pose = 'think', title, body, primary, secondary, tone = 'student', hindi }: {
  pose?: Pose; title: string; body: string; primary: [string, () => void]; secondary?: [string, () => void]; tone?: 'student' | 'tech' | 'sup'; hindi?: boolean
}) {
  const sup = tone === 'sup'
  return (
    <div className={cx('h-full flex flex-col items-center', sup ? 'justify-center' : 'pt-[120px] px-6', hindi && 'font-hi')}>
      <Beaver pose={pose === 'sit' ? 'sit' : pose} />
      <h1 className={cx('font-head font-extrabold text-center mt-4', sup ? 'text-[24px]' : 'text-[24px]', hindi && '!font-hi text-[26px]')}>{title}</h1>
      <p className="text-center text-[13.5px] text-mid mt-3 max-w-[300px]">{body}</p>
      <div className={cx(sup ? 'flex gap-3 mt-6' : 'mt-auto mb-8 w-full flex flex-col items-center gap-3')}>
        {sup ? <><Pill onClick={primary[1]}>{primary[0]}</Pill>{secondary && <Pill variant="secondary" onClick={secondary[1]}>{secondary[0]}</Pill>}</>
          : <><Button onClick={primary[1]}>{primary[0]}</Button>{secondary && <button onClick={secondary[1]} className="text-[12.5px] underline text-mid">{secondary[0]}</button>}</>}
      </div>
    </div>
  )
}
