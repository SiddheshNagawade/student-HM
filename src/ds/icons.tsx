/* ALIGN icon set.
   Every icon here follows the Figma "ALIGN v3 · Formal" drawings: navy line, ~2.6 stroke on a 28 grid,
   round caps and joins. Icons marked [figma] use the exact path from the Figma file; the rest are drawn
   on the same grid with the same pen so the set reads as one family. Colour comes from currentColor. */
import { CSSProperties, ReactNode } from 'react'

export type IconProps = { size?: number | string; strokeWidth?: number; className?: string; style?: CSSProperties; fill?: string }
export type Icon = ((p: IconProps) => React.ReactElement) & { displayName?: string }

function mk(name: string, body: ReactNode | ((fill?: string) => ReactNode), vb = 28): Icon {
  const C = ({ size = 24, strokeWidth, className, style, fill }: IconProps) => {
    const sw = strokeWidth ? (Math.min(Math.max(strokeWidth, 1.8), 3) / 24) * vb : (2.6 / 28) * vb
    return (
      <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true" focusable="false">
        {typeof body === 'function' ? body(fill) : body}
      </svg>
    )
  }
  C.displayName = name
  return C
}
const dot = (cx: number, cy: number, r = 1.4) => <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />

/* ---------- navigation ---------- */
export const Home = mk('Home', <path d="M4.6 13.8 13.8 4.6 23 13.8V23H4.6z" transform="translate(.2 .4)" />) // [figma] rail home
export const Inbox = mk('Inbox', <path d="M3.45 16.1H9.2l2.3 3.45h4.6l2.3-3.45h5.75M5.75 16.1 8.05 5.75h11.5l2.3 10.35V23H5.75z" transform="translate(.2 .4)" />) // [figma]
export const TrendingUp = mk('TrendingUp', <path d="M5.75 23v-8.05M13.8 23V5.75M21.85 23V11.5" transform="translate(.2 .4)" />) // [figma] load forecast bars
export const BarChart = TrendingUp
export const OctagonAlert = mk('OctagonAlert', <><circle cx="14" cy="14" r="9.4" /><path d="m7.4 7.4 13.2 13.2" /></>) // [figma] blocked
export const Flag = mk('Flag', <path d="M5.75 3.45v20.7M5.75 4.6h13.8l-3.45 4.6 3.45 4.6H5.75" transform="translate(1 0)" />) // [figma]
export const Pencil = mk('Pencil', <path d="M16.1 5.75c3.45-2.3 6.9 1.15 4.6 4.6L10.35 20.7 5.75 23l1.15-4.6L17.25 8.05" transform="translate(.6 .3)" />) // [figma] fixtures
export const Users = mk('Users', <path d="M10.4 12.65a3.45 3.45 0 1 0 .06 0M3.45 23c0-5.75 13.8-5.75 13.8 0M19.6 10.35a2.98 2.98 0 1 0 .06 0M19.55 16.1c4.6 0 5.75 4.6 5.75 6.9" transform="translate(-.2 .4)" />) // [figma] team
export const SlidersHorizontal = mk('SlidersHorizontal', <><path d="M4 8h9M19 8h5M4 20h4M14 20h10" /><circle cx="16" cy="8" r="2.8" /><circle cx="11" cy="20" r="2.8" /></>)
export const Search = mk('Search', <><circle cx="12.5" cy="12.5" r="7.5" /><path d="m18 18 5.5 5.5" /></>)
export const LogOut = mk('LogOut', <path d="M11 4.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2H11M17 9l5 5-5 5M22 14H10.5" />)
export const Keyboard = mk('Keyboard', <><rect x="3" y="7" width="22" height="14" rx="3" /><path d="M7.5 11.5h.01M11.5 11.5h.01M15.5 11.5h.01M19.5 11.5h.01M9 16.5h10" /></>)

/* ---------- arrows ---------- */
export const ArrowLeft = mk('ArrowLeft', <path d="M19 11H3m7 7-7-7 7-7" />, 22) // [figma] back
export const ArrowRight = mk('ArrowRight', <path d="M4 14h20m-8 8 8-8-8-8" />) // [figma] big button arrow
export const ArrowDown = mk('ArrowDown', <path d="M14 4v20m-8-8 8 8 8-8" />) // [figma] slot moved
export const ChevronRight = mk('ChevronRight', <path d="m10 6 8 8-8 8" />) // [figma] row "go"
export const ChevronDown = mk('ChevronDown', <path d="m6 10 8 8 8-8" />)
export const Delete = mk('Delete', <path d="M14 4h20v20H14L4 14zM20 10l8 8M28 10l-8 8" />, 38) // [figma] keypad delete
export const RotateCcw =mk('RotateCcw', <path d="M4.5 13.5a9.5 9.5 0 1 0 2.8-6.7L4.5 9.5M4.5 4.5v5h5" />)
export const Undo2 = mk('Undo2', <path d="M9 5 4 10l5 5M4 10h12a6.5 6.5 0 0 1 0 13h-4" />)
export const Merge = mk('Merge', <path d="M7 4v5a5 5 0 0 0 5 5h4a5 5 0 0 1 5 5v5M21 4v5a5 5 0 0 1-5 5M17.5 20.5 21 24l3.5-3.5" />)
export const History = mk('History', <><path d="M4.5 14a9.5 9.5 0 1 0 2.8-6.7L4.5 10M4.5 5v5h5" /><path d="M14 9v5.5l3.5 2" /></>)

/* ---------- status ---------- */
export const Check = mk('Check', <path d="m6 14.5 5.5 5.5L22 8" />) // [figma] tick inside badges
export const CheckCheck = mk('CheckCheck', <path d="m3 15 5 5 9-11M14 19l1 1 9-11" />)
export const CircleCheck = mk('CircleCheck', <><circle cx="14" cy="14" r="10" /><path d="m9 14.5 3.5 3.5L19.5 10" /></>)
export const BadgeCheck = mk('BadgeCheck', <><path d="M14 3.5 17 5.6l3.6-.2 1.1 3.5 3 2.1-1.2 3.4 1.2 3.4-3 2.1-1.1 3.5-3.6-.2L14 24.5l-3-2.1-3.6.2-1.1-3.5-3-2.1 1.2-3.4-1.2-3.4 3-2.1 1.1-3.5 3.6.2z" /><path d="m10 14.5 3 3 5.5-6.5" /></>)
export const X = mk('X', <path d="m5 5 18 18M23 5 5 23" />) // [figma] sign in error cross
export const AlertCircle = mk('AlertCircle', <><circle cx="14" cy="14" r="10" /><path d="M14 9v6" />{dot(14, 19.2, 1.5)}</>)
export const AlertTriangle = mk('AlertTriangle', <><path d="M12.3 4.9a2 2 0 0 1 3.4 0l9 15.6a2 2 0 0 1-1.7 3H5a2 2 0 0 1-1.7-3z" /><path d="M14 11v5" />{dot(14, 19.6, 1.4)}</>)
export const Info = mk('Info', <><circle cx="14" cy="14" r="10" /><path d="M14 13v6" />{dot(14, 9, 1.5)}</>)
export const ShieldAlert = mk('ShieldAlert', <><path d="M14 3.5 5 7v6.5c0 5.5 3.8 9.2 9 11 5.2-1.8 9-5.5 9-11V7z" /><path d="M14 9.5v5" />{dot(14, 18.4, 1.4)}</>)
export const ShieldCheck = mk('ShieldCheck', <><path d="M14 3.5 5 7v6.5c0 5.5 3.8 9.2 9 11 5.2-1.8 9-5.5 9-11V7z" /><path d="m10 14 3 3 5.5-6" /></>)
export const Loader2 = mk('Loader2', <path d="M14 3.5A10.5 10.5 0 1 1 3.5 14" />)
export const Sparkles = mk('Sparkles', <path d="M12 4v6M12 18v6M4 14h6M14 14h6M21 3.5v4M19 5.5h4" />) // [figma] "job closed" spark, plus a small one
export const Plus = mk('Plus', <path d="M14 5v18M5 14h18" />)
export const Square = mk('Square', <rect x="5" y="5" width="18" height="18" rx="4" />)
export const Eye = mk('Eye', <><path d="M2.5 14S6.5 6.5 14 6.5 25.5 14 25.5 14 21.5 21.5 14 21.5 2.5 14 2.5 14Z" /><circle cx="14" cy="14" r="3.5" /></>)
export const EyeOff = mk('EyeOff', <><path d="M11 6.9A11 11 0 0 1 14 6.5c7.5 0 11.5 7.5 11.5 7.5a19 19 0 0 1-3 3.9M7.3 8.3C4.1 10.4 2.5 14 2.5 14S6.5 21.5 14 21.5a11 11 0 0 0 5.6-1.5" /><path d="M11.5 11.6a3.5 3.5 0 0 0 4.9 4.9M4 4l20 20" /></>)

/* ---------- people & contact ---------- */
export const UserRound = mk('UserRound', <><circle cx="14" cy="10" r="5" /><path d="M5 24c0-5 4-8 9-8s9 3 9 8" /></>)
export const UserX = mk('UserX', <><circle cx="11.5" cy="10" r="5" /><path d="M3 24c0-5 3.8-8 8.5-8 2.3 0 4.3.7 5.8 1.9M19 13l6 6M25 13l-6 6" /></>)
export const Mail = mk('Mail', <><rect x="3.5" y="6" width="21" height="16" rx="3" /><path d="m4.5 8 9.5 7 9.5-7" /></>)
export const AtSign = mk('AtSign', <><circle cx="14" cy="14" r="4.5" /><path d="M18.5 9.5V15a3 3 0 0 0 6 0v-1A10.5 10.5 0 1 0 20 22.6" /></>)
export const Phone = mk('Phone', <path d="M6.5 4h4l2 5.5-2.8 1.8a13 13 0 0 0 7 7l1.8-2.8L24 17.5v4a2.5 2.5 0 0 1-2.7 2.5C12 23.2 4.8 16 4 6.7A2.5 2.5 0 0 1 6.5 4Z" />)
export const PhoneCall = mk('PhoneCall', <><path d="M6.5 4h4l2 5.5-2.8 1.8a13 13 0 0 0 7 7l1.8-2.8L24 17.5v4a2.5 2.5 0 0 1-2.7 2.5C12 23.2 4.8 16 4 6.7A2.5 2.5 0 0 1 6.5 4Z" /><path d="M17 4a7.5 7.5 0 0 1 7 7M17 8.5a3 3 0 0 1 2.5 2.5" /></>)
export const Send = mk('Send', <path d="M24.5 3.5 12.5 15.5M24.5 3.5 17 24.5l-4.5-9-9-4.5z" />)
export const MessageSquareWarning = mk('MessageSquareWarning', <><path d="M24 17.5a2.5 2.5 0 0 1-2.5 2.5H9l-5 4.5V6.5A2.5 2.5 0 0 1 6.5 4h15A2.5 2.5 0 0 1 24 6.5z" /><path d="M14 8.5v4.5" />{dot(14, 16.3, 1.4)}</>)
export const Languages = mk('Languages', <><path d="M4 6.5h11M9.5 4v2.5M13 6.5c-1 4.5-4.5 8-8.5 9.5M7 10.5c1.4 2.4 3.5 4.3 6 5.3" /><path d="m14 24 4.5-10.5L23 24M15.5 20.5h6" /></>)

/* ---------- sound ---------- */
export const Volume2 = mk('Volume2', <path d="M4 10h4l6-5v16l-6-5H4zM18 9c2 2.5 2 5.5 0 8m3-11c4 4.5 4 9.5 0 14" />, 26) // [figma] speaker
export const VolumeX = mk('VolumeX', <path d="M4 10h4l6-5v16l-6-5H4zM18 10l6 6M24 10l-6 6" />, 26)
export const Bell = mk('Bell', <path d="M5 16c1.5-1.5 1-4 1.2-6.5.3-3.5 2.3-5.3 4.8-5.3s4.5 1.8 4.8 5.3C16 12 15.5 14.5 17 16zM9 18.5c.8 1.3 3.2 1.3 4 0" />, 22) // [figma]
export const BellRing = mk('BellRing', <path d="M5 16c1.5-1.5 1-4 1.2-6.5.3-3.5 2.3-5.3 4.8-5.3s4.5 1.8 4.8 5.3C16 12 15.5 14.5 17 16zM9 18.5c.8 1.3 3.2 1.3 4 0M2.5 8.5A8 8 0 0 1 4.5 4M19.5 8.5a8 8 0 0 0-2-4.5" />, 22)
export const BellOff = mk('BellOff', <path d="M5 16c1.5-1.5 1-4 1.2-6.5.3-3.5 2.3-5.3 4.8-5.3s4.5 1.8 4.8 5.3C16 12 15.5 14.5 17 16zM9 18.5c.8 1.3 3.2 1.3 4 0M3 3l16 16" />, 22)

/* ---------- time ---------- */
export const Clock3 = mk('Clock3', <><circle cx="14" cy="14" r="10" /><path d="M14 8v6.3l4.5 2.2" /></>) // [figma] review "when"
export const Timer = mk('Timer', <><circle cx="14" cy="15.5" r="9" /><path d="M11 3.5h6M14 10.5v5l3 2M21.5 7.5l1.5-1.5" /></>)
const cal = <><rect x="4" y="6" width="20" height="18" rx="3" /><path d="M4 11.5h20M9.5 3.5v5M18.5 3.5v5" /></>
export const CalendarDays = mk('CalendarDays', <>{cal}{dot(9.5, 16)}{dot(14, 16)}{dot(18.5, 16)}{dot(9.5, 20)}{dot(14, 20)}</>)
export const CalendarCheck2 = mk('CalendarCheck2', <>{cal}<path d="m10 17.5 3 3 5.5-5.5" /></>)
export const CalendarClock = mk('CalendarClock', <><path d="M24 12V9a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h5M4 11.5h20M9.5 3.5v5M18.5 3.5v5" /><circle cx="20" cy="20" r="5" /><path d="M20 18v2.3l1.5 1" /></>)
export const CalendarX2 = mk('CalendarX2', <>{cal}<path d="m11 15.5 6 6M17 15.5l-6 6" /></>)
export const Moon = mk('Moon', <path d="M38 6C18 8 8 28 16 44c8 14 30 16 42 4C36 50 24 30 38 6Z" />, 64) // [figma] evening slot

/* ---------- places ---------- */
export const MapPin = mk('MapPin', (fill) => <><path d="M14 25C7.5 17.5 5.5 14 5.5 10.8 5.5 5.8 9.6 3 14 3s8.5 2.8 8.5 7.8C22.5 14 20.5 17.5 14 25Z" fill={fill} /><circle cx="14" cy="10.8" r="3" fill="currentColor" stroke="none" /></>) // [figma] pin
export const DoorClosed = mk('DoorClosed', <><path d="M6 3h14v23H6z" transform="translate(1 0)" /><path d="M24 9c2 2 2 6 0 8" />{dot(17.5, 15, 1.5)}</>, 30) // [figma] door
export const DoorOpen = mk('DoorOpen', <><path d="M5 25h20M8 25V4h12v21" /><path d="M8 4l7 2.5V25" />{dot(12.5, 15, 1.3)}</>)
export const Building2 = mk('Building2', <><path d="M6 24V5.5A1.5 1.5 0 0 1 7.5 4h9A1.5 1.5 0 0 1 18 5.5V24M18 12h3.5a1.5 1.5 0 0 1 1.5 1.5V24M3.5 24h21" /><path d="M10 9h4M10 13.5h4M10 18h4" /></>)
export const Warehouse = mk('Warehouse', <><path d="M3.5 24V10L14 4l10.5 6v14" /><path d="M8 24v-9h12v9M8 19h12" /></>)
export const BrickWall = mk('BrickWall', <><rect x="3.5" y="5" width="21" height="18" rx="2" /><path d="M3.5 11h21M3.5 17h21M10 5v6M18 5v6M14 11v6M7 17v6M21 17v6" /></>)
export const Truck = mk('Truck', <><path d="M3 7h13v12H3zM16 11h5l4 4v4h-9" /><circle cx="8" cy="21" r="2.3" /><circle cx="20" cy="21" r="2.3" /></>)
export const Footprints = mk('Footprints', <><circle cx="15" cy="6" r="2.6" /><path d="M14.5 10v8m0 0-5 7m5-7 5 7M8.5 15.5l6-4 6 3" /></>) // [figma] "on the way" walker

/* ---------- objects ---------- */
export const Camera = mk('Camera', <><rect x="3" y="8" width="20" height="14" rx="3" /><path d="m9 8 2-4h4l2 4" /><circle cx="13" cy="15" r="3.5" /></>, 26) // [figma] cam
export const Lock = mk('Lock', <><rect x="5" y="12.5" width="18" height="12" rx="3" /><path d="M8.5 12.5V9a5.5 5.5 0 0 1 11 0v3.5" />{dot(14, 18.5, 1.8)}</>) // [figma] PIN lock, as line
export const KeyRound = mk('KeyRound', <><circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="19" cy="12" r="2.2" /><circle cx="26" cy="12" r="2.2" /><path d="M3 21h25" /></>, 31) // [figma] closing code ••••
export const ClipboardList = mk('ClipboardList', <><rect x="5" y="5" width="18" height="20" rx="3" /><path d="M10.5 3.5h7v3.5h-7zM10 13h8M10 18h5" /></>)
export const StickyNote = mk('StickyNote', <path d="M5 5h18v12l-6 6H5zM23 17h-6v6" />)
export const PackageSearch = mk('PackageSearch', <><path d="M3 9l6-5h10l6 5H3zM3 9v14h10M25 9v4" /><circle cx="20" cy="20" r="3.5" /><path d="m22.6 22.6 2.4 2.4" /></>) // bag + look
export const PackageCheck = mk('PackageCheck', <><path d="M3 9l6-5h10l6 5H3zM3 9v14h10M25 9v5" /><path d="m16 20.5 3 3 6-6.5" /></>)
export const PackageX = mk('PackageX', <><path d="M3 9l6-5h10l6 5H3zM3 9v14h10M25 9v5" /><path d="m17 17 6 6M23 17l-6 6" /></>)
export const Bag = mk('Bag', <path d="M5 12h18l2 13H3zM10 12c0-7 8-7 8 0" />, 28) // [figma] icon bag
export const Hammer = mk('Hammer', <path d="M12 4l10 4-2 5-10-4zM16 11 7 25" />, 30) // [figma] icon fix
export const Wrench = mk('Wrench', <path d="M17.5 4.5a6 6 0 0 0-5.7 7.8L4.5 19.6a2.3 2.3 0 0 0 3.3 3.3l7.3-7.3a6 6 0 0 0 7.8-5.7l-3.4 3.4-3.6-1-1-3.6z" />)
export const Zap = mk('Zap', <path d="M16 3 5.5 16H14l-2 9L22.5 12H14z" />)
export const Droplets = mk('Droplets', <path d="M14 3.5S7 11.5 7 16.5a7 7 0 0 0 14 0c0-5-7-13-7-13Z" />)
export const FlaskConical = mk('FlaskConical', <path d="M11 3.5h6M12 3.5v7L5 22.5A1.8 1.8 0 0 0 6.6 25h14.8a1.8 1.8 0 0 0 1.6-2.5L16 10.5v-7M8.5 17h11" />)
export const LifeBuoy = mk('LifeBuoy', <><circle cx="14" cy="14" r="10" /><circle cx="14" cy="14" r="4" /><path d="m7 7 4.2 4.2M16.8 16.8 21 21M21 7l-4.2 4.2M11.2 16.8 7 21" /></>)
export const Wifi = mk('Wifi', <><path d="M3.5 11a15 15 0 0 1 21 0M7.5 15a9.5 9.5 0 0 1 13 0M11 19a4.5 4.5 0 0 1 6 0" />{dot(14, 22.5, 1.6)}</>)
export const WifiOff = mk('WifiOff', <><path d="M11 19a4.5 4.5 0 0 1 6 0M3.5 11A15 15 0 0 1 9 7.6M14.5 6a15 15 0 0 1 10 5M7.5 15a9.5 9.5 0 0 1 4-2.3M4 4l20 20" />{dot(14, 22.5, 1.6)}</>)
export const CloudOff = mk('CloudOff', <path d="M9 9.5A6 6 0 0 0 7.5 21H19M13 6.3A7 7 0 0 1 21.6 12 4.5 4.5 0 0 1 24 20M4 4l20 20" />)

/* Star keeps the Figma wobble-free five point shape; pass fill for rated stars. [figma] */
export const Star = mk('Star', (fill) => <path d="M24 7l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1z" fill={fill} transform="translate(0 -.5)" />, 48)

/* ---------- filled glyphs straight from Figma ---------- */
/** Green wobbly tick badge (bag check, steps done, closures). */
export function TickBadge({ size = 34, tone = 'green', className }: { size?: number; tone?: 'green' | 'sun' | 'empty'; className?: string }) {
  const fill = tone === 'green' ? '#1B7F52' : tone === 'sun' ? '#FFD265' : 'none'
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" className={className} aria-hidden="true">
      {tone !== 'empty' && <path d="M31.1 19c0 3.1-.2 7.2-2.2 9.3-2 2.2-6.7 3.6-9.9 3.6s-7.2-1.7-9.3-3.8C7.6 25.9 6.6 22 6.5 19c0-3 .8-6.9 2.8-9.2C11.4 7.6 15.7 5.5 19 5.4c3.3-.1 7.9 1.8 9.9 4.1 2 2.2 2.2 6.4 2.2 9.5Z" fill={fill} />}
      <path d="M29.1 17c0 3.1-.2 7.2-2.2 9.3-2 2.2-6.7 3.6-9.9 3.6s-7.2-1.7-9.3-3.8C5.6 23.9 4.6 20 4.5 17c0-3 .8-6.9 2.8-9.2C9.4 5.6 13.7 3.5 17 3.4c3.3-.1 7.9 1.8 9.9 4.1 2 2.2 2.2 6.4 2.2 9.5Z" stroke="#00224E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={tone === 'empty' ? '4 5' : undefined} />
      {tone === 'green' && <path d="m9 17 6 6 10-13" stroke="#FFFBF3" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

/** Hand-drawn dot used in the supervisor charts. kind: open request, past promise (ring), blocked, selected. */
export function WobbleDot({ size = 22, kind = 'navy' }: { size?: number; kind?: 'navy' | 'ring' | 'ember' | 'selected' | 'blue' | 'sun' | 'faint' }) {
  const p = 'M18.6 11c0 1.5-.9 3.7-2.2 4.7-1.2 1.1-3.6 1.5-5.4 1.6-1.8.1-4.3.1-5.4-1-1.1-1-1.5-3.7-1.4-5.3 0-1.6.6-3.2 1.8-4.4C7.1 5.4 9.3 3.9 11 3.9s3.7 1.4 4.9 2.6c1.3 1.1 2.6 3 2.7 4.5Z'
  const fill = { navy: '#00224E', ember: '#B8530A', selected: '#B8530A', blue: '#0E2DD2', sun: '#FFD265', ring: 'none', faint: 'rgba(0,34,78,.15)' }[kind]
  const stroke = kind === 'ring' ? '#B8530A' : kind === 'faint' ? 'none' : '#00224E'
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      {kind === 'selected' && <circle cx="11" cy="10.6" r="10" stroke="#0E2DD2" strokeWidth="2" />}
      <path d={p} fill={fill} stroke={stroke} strokeWidth={kind === 'ring' ? 2.6 : 2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
