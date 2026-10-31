import { ReactNode } from 'react'
import { Back } from '../components/ui'

export const Page = ({ children, bg = 'bg-sun2', className = '' }: { children: ReactNode; bg?: string; className?: string }) =>
  <div className={`h-full flex flex-col overflow-hidden ${bg} ${className}`}>{children}</div>

/* Figma top bar: back button at 20, 80 (title row sits beside it) */
export const Head = ({ onBack, title, sub, right, top = 'pt-[52px]' }: { onBack?: () => void; title?: string; sub?: string; right?: ReactNode; top?: string }) => (
  <div className={`flex items-center gap-3 px-5 ${top} pb-3 shrink-0`}>
    {onBack && <Back onClick={onBack} />}
    <div className="flex-1 min-w-0">
      {title && <h1 className="font-head font-extrabold text-[19px] leading-tight">{title}</h1>}
      {sub && <p className="text-[12.5px] text-mid">{sub}</p>}
    </div>
    {right}
  </div>
)

export const Foot = ({ children, link }: { children: ReactNode; link?: ReactNode }) => (
  <div className="mt-auto px-6 pt-3 pb-7 shrink-0 flex flex-col items-center gap-3">{children}{link}</div>
)
export const LinkBtn = ({ onClick, children }: { onClick: () => void; children: ReactNode }) =>
  <button onClick={onClick} className="text-[13.5px] underline text-mid font-body">{children}</button>

export const Body = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <div className={`flex-1 min-h-0 overflow-y-auto px-6 ${className}`}>{children}</div>

/* Prototype helper: the real app moves on by itself (technician events); here you can trigger those events. */
export const Demo = ({ items }: { items: [string, () => void][] }) => (
  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-[11px] text-mid">
    <span>demo:</span>{items.map(([l, f]) => <button key={l} onClick={f} className="underline">{l}</button>)}
  </div>
)

/* rounded cream sheet that rises over the illustration */
export const Sheet = ({ children, bg = 'bg-cream', className = '' }: { children: ReactNode; bg?: string; className?: string }) => (
  <div className={`flex-1 min-h-0 -mt-3 rounded-t-[28px] border-t-[2.5px] border-navy flex flex-col ${bg} ${className}`}>{children}</div>
)
