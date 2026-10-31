import { ReactNode } from 'react'
import { Back } from '../components/ui'

export const Page = ({ children, bg = 'bg-sun2', className = '' }: { children: ReactNode; bg?: string; className?: string }) =>
  <div className={`h-full flex flex-col ${bg} ${className}`}>{children}</div>

export const Head = ({ onBack, title, sub, right }: { onBack?: () => void; title?: string; sub?: string; right?: ReactNode }) => (
  <div className="flex items-center gap-3 px-5 pt-[60px] pb-3 shrink-0">
    {onBack && <Back onClick={onBack} />}
    <div className="flex-1 min-w-0">
      {title && <h1 className="font-head font-extrabold text-[19px] leading-tight truncate">{title}</h1>}
      {sub && <p className="text-[12px] text-mid truncate">{sub}</p>}
    </div>
    {right}
  </div>
)

export const Foot = ({ children, link }: { children: ReactNode; link?: ReactNode }) => (
  <div className="mt-auto px-6 pt-3 pb-7 shrink-0 flex flex-col items-center gap-3">{children}{link}</div>
)
export const LinkBtn = ({ onClick, children }: { onClick: () => void; children: ReactNode }) =>
  <button onClick={onClick} className="text-[12.5px] underline text-mid font-body">{children}</button>

export const Body = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <div className={`flex-1 min-h-0 overflow-y-auto px-6 ${className}`}>{children}</div>

/* Prototype helper: the real app moves on by itself (technician events); here you can trigger those events. */
export const Demo = ({ items }: { items: [string, () => void][] }) => (
  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-mid">
    <span>demo:</span>{items.map(([l, f]) => <button key={l} onClick={f} className="underline">{l}</button>)}
  </div>
)

export const Fan = ({ size = 120 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" stroke="#00224E" strokeWidth="3" strokeLinejoin="round">
    {[0, 120, 240].map(r => <path key={r} transform={`rotate(${r} 60 60)`} d="M60 60 C42 40 46 12 62 10 C78 12 76 40 60 60Z" fill="#FFD265" />)}
    <circle cx="60" cy="60" r="8" fill="#00224E" />
  </svg>
)

export const Room = ({ onFan, onElse }: { onFan?: () => void; onElse?: () => void }) => (
  <svg viewBox="0 0 346 300" className="w-full" fill="none" stroke="#00224E" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    <path d="M14 14H334V260H14Z" fill="#FFFBF3" />
    <rect x="28" y="40" width="104" height="92" fill="#BDDDFF" /><path d="M80 40V132M28 86H132" />
    <path d="M14 260H334" />
    <rect x="36" y="212" width="150" height="40" fill="#FFD265" /><rect x="36" y="196" width="34" height="22" fill="#FFFBF3" />
    <rect x="250" y="178" width="84" height="46" fill="#FFFBF3" /><path d="M262 224V260M322 224V260" />
    <rect x="262" y="150" width="40" height="28" fill="#FFF3CF" />
    <rect x="270" y="20" width="56" height="130" rx="2" fill="#EDE4CF" /><circle cx="316" cy="90" r="3" fill="#00224E" />
    <g onClick={onFan} style={{ cursor: onFan ? 'pointer' : 'default' }}>
      <circle cx="170" cy="44" r="30" strokeDasharray="5 5" /><g transform="translate(150 24) scale(.33)"><Fan size={120} /></g>
    </g>
    <g onClick={onElse} style={{ cursor: onElse ? 'pointer' : 'default' }}><rect x="150" y="100" width="22" height="28" rx="4" strokeDasharray="4 4" /></g>
  </svg>
)
