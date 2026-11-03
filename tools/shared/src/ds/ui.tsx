/* ALIGN component kit. Structured first (clear rounded boxes, a firm 2px navy edge, a pressable
   3px shadow), playful second (illustrations, springy motion, sounds). Shared by all three apps. */
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, createContext, useCallback, useContext, useEffect, useId, useRef, useState, forwardRef, CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion, PanInfo } from 'framer-motion'
import { Check, ChevronRight, Delete, Loader2, Star, X, AlertCircle } from './icons'
import { fx, FxName } from './fx'
import { spring, springPop, Shake } from './motion'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

/* Look: 'app' is the phone style (firm 2px edge, pressable shadow). 'desk' is the supervisor's
   desktop style: hairline borders, smaller radii, flat surfaces, semibold body type. */
export type Look = 'app' | 'desk'
const LookCtx = createContext<Look>('app')
export const LookProvider = ({ look, children }: { look: Look; children: ReactNode }) => <LookCtx.Provider value={look}>{children}</LookCtx.Provider>
export const useLook = () => useContext(LookCtx)

/* ---------------- Tooltip (hover name on desktop, long-press free) ---------------- */
export function Tooltip({ label, children, side = 'top', className = '', disabled }: { label: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'right' | 'left'; className?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const t = useRef<number | undefined>(undefined)
  const show = (e: React.PointerEvent) => { if (e.pointerType !== 'mouse' || disabled) return; clearTimeout(t.current); t.current = window.setTimeout(() => setOpen(true), 280) }
  const hide = () => { clearTimeout(t.current); setOpen(false) }
  const pos = { top: 'bottom-full left-1/2 -translate-x-1/2 mb-2', bottom: 'top-full left-1/2 -translate-x-1/2 mt-2', right: 'left-full top-1/2 -translate-y-1/2 ml-3', left: 'right-full top-1/2 -translate-y-1/2 mr-3' }[side]
  const o = { top: { y: 4 }, bottom: { y: -4 }, right: { x: -4 }, left: { x: 4 } }[side]
  return (
    <span className={cx('relative inline-flex', className)} onPointerEnter={show} onPointerLeave={hide} onPointerDown={hide} onFocus={() => !disabled && setOpen(true)} onBlur={hide}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.span role="tooltip" initial={{ opacity: 0, scale: 0.9, ...o }} animate={{ opacity: 1, scale: 1, x: 0, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.08 } }} transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className={cx('pointer-events-none absolute z-50 whitespace-nowrap rounded-[8px] bg-navy px-2.5 py-1.5 font-body text-[13px] font-medium leading-tight text-cream shadow-pop', pos)}>
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/* ---------------- Buttons ---------------- */
export type BtnVariant = 'primary' | 'secondary' | 'dark' | 'blue' | 'canal' | 'danger' | 'ghost' | 'quiet'
type BtnProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> & {
  variant?: BtnVariant; size?: 'lg' | 'md' | 'sm' | 'xs'; icon?: ReactNode; iconRight?: ReactNode; loading?: boolean; full?: boolean; sound?: FxName | false; tip?: string
}
const VARIANT: Record<BtnVariant, string> = {
  primary: 'bg-sun text-navy border-navy shadow-btn',
  secondary: 'bg-paper text-navy border-navy shadow-btn',
  dark: 'bg-navy text-cream border-navy shadow-[0_3px_0_#000F24]',
  blue: 'bg-signal2 text-white border-navy shadow-btn',
  canal: 'bg-canal text-white border-navy shadow-btn',
  danger: 'bg-brick text-white border-navy shadow-btn',
  ghost: 'bg-transparent text-navy border-transparent shadow-none hover:bg-navy/5',
  quiet: 'bg-sand text-navy border-transparent shadow-none hover:bg-sand2',
}
const VARIANT_DESK: Record<BtnVariant, string> = {
  primary: 'bg-navy text-cream border-navy hover:bg-ink',
  secondary: 'bg-paper text-navy border-line hover:border-navy/35 hover:bg-cream',
  dark: 'bg-navy text-cream border-navy hover:bg-ink',
  blue: 'bg-signal2 text-white border-signal2',
  canal: 'bg-canal text-white border-canal hover:bg-[#124F59]',
  danger: 'bg-brick text-white border-brick hover:bg-[#8E3522]',
  ghost: 'bg-transparent text-navy border-transparent hover:bg-navy/[0.05]',
  quiet: 'bg-sand text-navy border-transparent hover:bg-sand2',
}
const SIZE_DESK = { lg: 'h-11 px-5 text-[15px] rounded-[10px] gap-2', md: 'h-10 px-4 text-[14px] rounded-[9px] gap-2', sm: 'h-9 px-3.5 text-[14px] rounded-[8px] gap-1.5', xs: 'h-7 px-2.5 text-[13px] rounded-[7px] gap-1.5' }
const SIZE = { lg: 'h-14 px-6 text-[17px] rounded-[16px] gap-2.5', md: 'h-12 px-5 text-[16px] rounded-[14px] gap-2', sm: 'h-10 px-4 text-[15px] rounded-[12px] gap-2', xs: 'h-8 px-3 text-[13px] rounded-[10px] gap-1.5' }
export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button({ variant = 'primary', size = 'lg', icon, iconRight, loading, full = true, sound = 'tap', className, children, onClick, disabled, tip, ...p }, ref) {
  const reduce = useReducedMotion()
  const desk = useLook() === 'desk'
  const flat = desk || variant === 'ghost' || variant === 'quiet'
  if (desk) {
    const d = (
      <button ref={ref} {...(p as object)} disabled={disabled || loading} onClick={e => { if (sound) fx[sound](); onClick?.(e) }}
        className={cx('relative inline-flex select-none items-center justify-center border font-body font-semibold leading-none transition-colors active:translate-y-px',
          SIZE_DESK[size], VARIANT_DESK[variant], full && 'w-full', (disabled || loading) && 'opacity-50', className)}>
        {loading ? <Loader2 className="animate-spin" size={18} /> : icon}
        {children && <span className="truncate">{children}</span>}
        {!loading && iconRight}
      </button>
    )
    return tip ? <Tooltip label={tip}>{d}</Tooltip> : d
  }
  const b = (
    <motion.button ref={ref} {...(p as object)} disabled={disabled || loading}
      onClick={e => { if (sound) fx[sound](); onClick?.(e) }}
      whileTap={reduce || disabled ? undefined : flat ? { scale: 0.97 } : { y: 3, boxShadow: '0 0px 0 #00224E' }}
      whileHover={reduce || disabled || flat ? undefined : { y: -1 }}
      transition={{ type: 'spring', stiffness: 900, damping: 30 }}
      className={cx('relative inline-flex select-none items-center justify-center border-2 font-head font-bold leading-none tracking-[0.005em] transition-colors',
        SIZE[size], VARIANT[variant], full && 'w-full', (disabled || loading) && '!shadow-none opacity-55', className)}>
      {loading ? <Loader2 className="animate-spin" size={20} /> : icon}
      {children && <span className="truncate pt-[2px]">{children}</span>}
      {!loading && iconRight}
    </motion.button>
  )
  return tip ? <Tooltip label={tip}>{b}</Tooltip> : b
})

/** Round icon-only button. Always has a name: shown on hover and read by screen readers. */
export function IconButton({ label, children, onClick, variant = 'secondary', size = 44, className, badge, side = 'bottom', active, sound = 'tap', disabled }: {
  label: string; children: ReactNode; onClick?: () => void; variant?: 'secondary' | 'dark' | 'ghost' | 'sun' | 'blue'; size?: number; className?: string; badge?: boolean | number; side?: 'top' | 'bottom' | 'left' | 'right'; active?: boolean; sound?: FxName | false; disabled?: boolean
}) {
  const desk = useLook() === 'desk'
  const v = { secondary: 'bg-paper border-navy text-navy', dark: 'bg-navy border-navy text-cream', ghost: 'bg-transparent border-transparent text-navy hover:bg-navy/5', sun: 'bg-sun border-navy text-navy', blue: 'bg-signal2 border-navy text-white' }[variant]
  return (
    <Tooltip label={label} side={side}>
      <motion.button aria-label={label} disabled={disabled} onClick={() => { if (sound) fx[sound](); onClick?.() }} whileTap={{ scale: 0.9 }} transition={springPop}
        className={cx('relative inline-flex shrink-0 items-center justify-center', desk ? 'rounded-[8px] border border-transparent' : 'rounded-full border-2', v, desk && variant === 'secondary' && '!border-line', active && 'ring-4 ring-sun/70', disabled && 'opacity-50', className)} style={{ width: size, height: size }}>
        {children}
        {!!badge && <span className={cx('absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full border-2 border-paper bg-brick px-1 text-[11px] font-bold leading-[14px] text-white', badge === true && 'h-[14px] min-w-[14px] px-0')}>{badge === true ? '' : badge}</span>}
      </motion.button>
    </Tooltip>
  )
}

export const LinkButton = ({ children, onClick, className, tone = 'mid' }: { children: ReactNode; onClick?: () => void; className?: string; tone?: 'mid' | 'navy' | 'brick' | 'white' }) => (
  <button onClick={() => { fx.tap(); onClick?.() }} className={cx('inline-flex min-h-[44px] items-center justify-center px-2 font-body text-[15px] font-semibold underline decoration-2 underline-offset-4',
    { mid: 'text-mid decoration-mid/30 hover:text-navy', navy: 'text-navy decoration-navy/30', brick: 'text-brick decoration-brick/40', white: 'text-white decoration-white/40' }[tone], className)}>{children}</button>
)

/* ---------------- Selection ---------------- */
type Tone = 'sun' | 'sky' | 'canal'
const ON_BG: Record<Tone, string> = { sun: 'bg-sun2', sky: 'bg-sky2', canal: 'bg-canal2' }
const CheckBadge = ({ tone = 'sun' }: { tone?: Tone }) => (
  <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={springPop}
    className={cx('flex h-6 w-6 items-center justify-center rounded-full border-2 border-navy', tone === 'canal' ? 'bg-canal text-white' : 'bg-navy text-cream')}>
    <Check size={14} strokeWidth={3.5} />
  </motion.span>
)

/** Big selectable tile (problem types, places, parts). Selected = filled + navy edge + corner check. */
export function Choice({ on, onClick, title, sub, art, icon, tone = 'sun', className, layout = 'tile', disabled, badge }: {
  on: boolean; onClick: () => void; title: ReactNode; sub?: ReactNode; art?: ReactNode; icon?: ReactNode; tone?: Tone; className?: string; layout?: 'tile' | 'row'; disabled?: boolean; badge?: ReactNode
}) {
  const row = layout === 'row'
  if (useLook() === 'desk') return (
    <button type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => { on ? fx.tap() : fx.select(); onClick() }}
      className={cx('relative flex w-full items-center gap-3 rounded-[10px] border px-3.5 py-3 text-left transition-colors',
        on ? 'border-navy bg-cream ring-1 ring-navy' : 'border-line bg-paper hover:border-navy/35', disabled && 'opacity-50', className)}>
      <Radio on={on} tone={tone} />
      {(art || icon) && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-sand">{art || icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col"><span className="text-[15px] font-semibold leading-tight">{title}</span>{sub && <span className="mt-0.5 text-[13px] leading-snug text-mid">{sub}</span>}</span>
      {badge}
    </button>
  )
  return (
    <motion.button type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => { on ? fx.tap() : fx.select(); onClick() }}
      whileTap={{ scale: 0.97 }} transition={springPop}
      className={cx('relative w-full border-2 text-left transition-[background-color,border-color,box-shadow] duration-150',
        row ? 'flex min-h-[64px] items-center gap-3 rounded-[16px] px-4 py-3' : 'flex flex-col items-center justify-center gap-2 rounded-[20px] px-3 pb-4 pt-5 text-center',
        on ? cx('border-navy shadow-btn', ON_BG[tone]) : 'border-line bg-paper hover:border-navy/50', disabled && 'opacity-50', className)}>
      {row && <Radio on={on} tone={tone} />}
      {(art || icon) && <span className={cx('flex shrink-0 items-center justify-center', row ? 'h-10 w-10 rounded-[12px] bg-sand' : 'h-[64px]')}>{art || icon}</span>}
      <span className={cx('flex min-w-0 flex-col', row ? 'flex-1' : 'items-center')}>
        <span className={cx('font-head font-bold leading-tight', row ? 'text-[17px]' : 'text-[16px]')}>{title}</span>
        {sub && <span className="mt-1 font-body text-[13px] leading-snug text-mid">{sub}</span>}
      </span>
      {badge}
      {!row && <span className="absolute right-2.5 top-2.5"><AnimatePresence>{on && <CheckBadge tone={tone} />}</AnimatePresence></span>}
    </motion.button>
  )
}

export function Radio({ on, tone = 'sun' }: { on: boolean; tone?: Tone }) {
  return (
    <span className={cx('flex shrink-0 items-center justify-center rounded-full bg-paper', useLook() === 'desk' ? 'h-[18px] w-[18px] border-[1.5px] border-navy' : 'h-6 w-6 border-2 border-navy')}>
      <motion.span className={cx(useLook() === 'desk' ? 'h-2 w-2' : 'h-3 w-3', 'rounded-full', tone === 'canal' ? 'bg-canal' : 'bg-navy')} initial={false} animate={{ scale: on ? 1 : 0 }} transition={springPop} />
    </span>
  )
}

export function Checkbox({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: ReactNode; sub?: ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={() => { on ? fx.deselect() : fx.check(); onChange(!on) }} className="flex w-full items-center gap-3 py-2 text-left">
      <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] border-2 border-navy transition-colors', on ? 'bg-navy text-cream' : 'bg-paper')}>
        <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={springPop}><Check size={15} strokeWidth={3.5} /></motion.span>}</AnimatePresence>
      </span>
      <span className="flex flex-col"><span className="text-[16px] font-medium">{label}</span>{sub && <span className="text-[13px] text-mid">{sub}</span>}</span>
    </button>
  )
}

/** Toggle chip (tags, quick feedback). Selected = navy fill with a check that slides in. */
export function Chip({ on, onClick, children, size = 'md', tone = 'navy' }: { on: boolean; onClick: () => void; children: ReactNode; size?: 'md' | 'sm'; tone?: 'navy' | 'canal' }) {
  if (useLook() === 'desk') return (
    <button type="button" aria-pressed={on} onClick={() => { on ? fx.deselect() : fx.select(); onClick() }}
      className={cx('inline-flex h-9 items-center gap-1.5 rounded-[8px] border px-3 text-[14px] font-medium transition-colors', on ? 'border-navy bg-navy text-cream' : 'border-line bg-paper text-navy hover:border-navy/35')}>
      {on && <Check size={15} strokeWidth={2.6} />}{children}
    </button>
  )
  return (
    <motion.button type="button" aria-pressed={on} onClick={() => { on ? fx.deselect() : fx.select(); onClick() }} whileTap={{ scale: 0.94 }} transition={springPop} layout
      className={cx('inline-flex items-center gap-1.5 rounded-full border-2 font-body font-semibold transition-colors',
        size === 'md' ? 'h-10 px-4 text-[15px]' : 'h-8 px-3 text-[13px]',
        on ? (tone === 'canal' ? 'border-canal bg-canal text-white' : 'border-navy bg-navy text-cream') : 'border-line bg-paper text-navy hover:border-navy/50')}>
      <AnimatePresence initial={false}>{on && <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 16, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex overflow-hidden"><Check size={16} strokeWidth={3} /></motion.span>}</AnimatePresence>
      {children}
    </motion.button>
  )
}

/** Segmented control (tabs inside a page). The pill slides between options. */
export function Segmented<T extends string>({ value, onChange, options, className, tone = 'navy' }: { value: T; onChange: (v: T) => void; options: { v: T; label: ReactNode; count?: number }[]; className?: string; tone?: 'navy' | 'canal' }) {
  const id = useId()
  if (useLook() === 'desk') return (
    <div role="tablist" className={cx('inline-flex rounded-[10px] bg-sand p-[3px]', className)}>
      {options.map(o => {
        const on = o.v === value
        return (
          <button key={o.v} role="tab" aria-selected={on} onClick={() => { if (!on) { fx.select(); onChange(o.v) } }}
            className={cx('relative flex h-8 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[8px] px-3.5 text-[14px] font-semibold transition-colors', on ? 'text-navy' : 'text-mid hover:text-navy')}>
            {on && <motion.span layoutId={id} className="absolute inset-0 rounded-[8px] bg-paper shadow-[0_1px_2px_rgba(0,34,78,.14),0_0_0_1px_rgba(0,34,78,.06)]" transition={{ type: 'spring', stiffness: 600, damping: 45 }} />}
            <span className="relative">{o.label}</span>
            {o.count !== undefined && <span className={cx('relative min-w-[20px] rounded-[5px] px-1.5 text-[12px] leading-[18px] tabular', on ? 'bg-navy text-cream' : 'bg-sand2 text-mid')}>{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
  return (
    <div role="tablist" className={cx('inline-flex rounded-[14px] border-2 border-navy bg-paper p-1', className)}>
      {options.map(o => {
        const on = o.v === value
        return (
          <button key={o.v} role="tab" aria-selected={on} onClick={() => { if (!on) { fx.select(); onChange(o.v) } }}
            className={cx('relative flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-4 font-head text-[15px] font-bold transition-colors', on ? 'text-white' : 'text-navy hover:bg-navy/5')}>
            {on && <motion.span layoutId={id} className={cx('absolute inset-0 rounded-[10px]', tone === 'canal' ? 'bg-canal' : 'bg-navy')} transition={spring} />}
            <span className="relative pt-[2px]">{o.label}</span>
            {o.count !== undefined && <span className={cx('relative min-w-[22px] rounded-full px-1.5 text-[12px] leading-[20px]', on ? 'bg-white/20' : 'bg-sand2')}>{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ on, onChange, label, sub, className, tone = 'navy' }: { on: boolean; onChange: (v: boolean) => void; label?: ReactNode; sub?: ReactNode; className?: string; tone?: 'navy' | 'blue' | 'canal' }) {
  const bg = { navy: 'bg-navy', blue: 'bg-signal2', canal: 'bg-canal' }[tone]
  if (useLook() === 'desk') return (
    <button type="button" role="switch" aria-checked={on} onClick={() => { on ? fx.toggleOff() : fx.toggleOn(); onChange(!on) }} className={cx('flex w-full items-center justify-between gap-4 text-left', className)}>
      {(label || sub) && <span className="flex min-w-0 flex-col"><span className="text-[15px] font-semibold leading-snug">{label}</span>{sub && <span className="mt-0.5 text-[13px] text-mid">{sub}</span>}</span>}
      <span className={cx('relative flex h-6 w-[42px] shrink-0 items-center rounded-full px-[3px] transition-colors', on ? bg : 'bg-line')}>
        <motion.span className="h-[18px] w-[18px] rounded-full bg-paper shadow-[0_1px_2px_rgba(0,0,0,.25)]" animate={{ x: on ? 18 : 0 }} transition={{ type: 'spring', stiffness: 700, damping: 40 }} />
      </span>
    </button>
  )
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => { on ? fx.toggleOff() : fx.toggleOn(); onChange(!on) }}
      className={cx('flex w-full items-center justify-between gap-4 text-left', className)}>
      {(label || sub) && <span className="flex min-w-0 flex-col"><span className="text-[16px] font-semibold leading-snug">{label}</span>{sub && <span className="mt-0.5 text-[13px] text-mid">{sub}</span>}</span>}
      <span className={cx('relative flex h-8 w-[52px] shrink-0 items-center rounded-full border-2 border-navy px-[3px] transition-colors', on ? bg : 'bg-sand2')}>
        <motion.span className="h-[22px] w-[22px] rounded-full border-2 border-navy bg-paper" animate={{ x: on ? 20 : 0 }} transition={springPop} />
      </span>
    </button>
  )
}

/* ---------------- Inputs ---------------- */
type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & { label?: string; hint?: ReactNode; error?: ReactNode; prefix?: ReactNode; suffix?: ReactNode; shakeKey?: number }
export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField({ label, hint, error, prefix, suffix, className, shakeKey = 0, id, ...p }, ref) {
  const auto = useId(); const fid = id || auto
  const desk = useLook() === 'desk'
  return (
    <div className={cx('w-full', className)}>
      {label && <label htmlFor={fid} className={cx('block font-semibold text-navy', desk ? 'mb-1 text-[13px]' : 'mb-1.5 text-[14px]')}>{label}</label>}
      <Shake k={shakeKey}>
        <div className={cx('flex items-center gap-2 bg-paper transition-[border-color,box-shadow]', desk ? 'h-11 rounded-[9px] border px-3' : 'h-14 rounded-[14px] border-2 px-4', desk && !error && '!border-line focus-within:!border-canal focus-within:!shadow-[0_0_0_3px_rgba(23,96,107,.15)]',
          error ? 'border-brick shadow-[0_0_0_4px_rgba(166,64,42,.12)]' : 'border-line focus-within:border-navy focus-within:shadow-[0_0_0_4px_rgba(0,34,78,.10)]')}>
          {prefix && <span className="shrink-0 text-mid">{prefix}</span>}
          <input ref={ref} id={fid} aria-invalid={!!error} {...p} className={cx('h-full min-w-0 flex-1 bg-transparent outline-none', desk ? 'text-[15px]' : 'text-[16px]')} />
          {suffix && <span className="shrink-0 text-mid">{suffix}</span>}
        </div>
      </Shake>
      <AnimatePresence initial={false} mode="wait">
        {error ? <motion.p key="e" initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-brick"><AlertCircle size={15} />{error}</motion.p>
          : hint ? <motion.p key="h" initial={false} className="mt-1.5 text-[13px] text-mid">{hint}</motion.p> : null}
      </AnimatePresence>
    </div>
  )
})

export function TextArea({ label, hint, className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: ReactNode }) {
  const id = useId()
  const desk = useLook() === 'desk'
  return (
    <div className={cx('w-full', className)}>
      {label && <label htmlFor={id} className={cx('block font-semibold', desk ? 'mb-1 text-[13px]' : 'mb-1.5 text-[14px]')}>{label}</label>}
      <textarea id={id} {...p} className={cx('block min-h-[104px] w-full resize-none bg-paper leading-snug outline-none transition-[border-color,box-shadow]', desk ? 'rounded-[9px] border border-line px-3 py-2.5 text-[15px] focus:border-canal focus:shadow-[0_0_0_3px_rgba(23,96,107,.15)]' : 'rounded-[14px] border-2 border-line px-4 py-3 text-[16px] focus:border-navy focus:shadow-[0_0_0_4px_rgba(0,34,78,.10)]')} />
      {hint && <p className="mt-1.5 text-[13px] text-mid">{hint}</p>}
    </div>
  )
}

/** One-time code boxes. Type, paste or use the keypad; the active box lifts. */
export function OtpInput({ value, onChange, length = 6, error, shakeKey = 0, autoFocus = true, onComplete, size = 'md', readOnlyKeyboard }: {
  value: string; onChange: (v: string) => void; length?: number; error?: boolean; shakeKey?: number; autoFocus?: boolean; onComplete?: (v: string) => void; size?: 'md' | 'lg'; readOnlyKeyboard?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [focus, setFocus] = useState(false)
  useEffect(() => { if (value.length === length) onComplete?.(value) }, [value])
  const w = size === 'lg' ? 'h-[72px] w-[60px] text-[34px]' : 'h-[62px] w-[48px] text-[28px]'
  return (
    <Shake k={shakeKey}>
      <div className="relative flex justify-center gap-2.5" onClick={() => !readOnlyKeyboard && ref.current?.focus()}>
        {Array.from({ length }, (_, i) => {
          const ch = value[i]; const active = (focus || readOnlyKeyboard) && i === Math.min(value.length, length - 1) && value.length < length
          return (
            <motion.div key={i} animate={{ y: active ? -3 : 0, scale: ch ? [1.12, 1] : 1 }} transition={springPop}
              className={cx('relative flex items-center justify-center rounded-[14px] border-2 bg-paper font-mono font-medium', w,
                error ? 'border-brick bg-brick2 text-brick' : ch ? 'border-navy' : active ? 'border-navy shadow-btn' : 'border-line')}>
              {ch}
              {active && !ch && <motion.span className="absolute h-7 w-[2px] rounded bg-navy" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
            </motion.div>
          )
        })}
        {!readOnlyKeyboard && <input ref={ref} autoFocus={autoFocus} inputMode="numeric" autoComplete="one-time-code" aria-label={`${length} digit code`} value={value}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, length); if (v.length > value.length) fx.key(v.length); else if (v.length < value.length) fx.erase(); onChange(v) }}
          className="absolute inset-0 cursor-text opacity-0" />}
      </div>
    </Shake>
  )
}

/** Numeric keypad for the technician (big targets, works with gloves). */
export function Keypad({ onKey, onDelete, tone = 'paper', extra }: { onKey: (d: string) => void; onDelete: () => void; tone?: 'paper' | 'sky'; extra?: ReactNode }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  const k = cx('flex h-[60px] items-center justify-center rounded-[16px] border-2 border-navy font-mono text-[28px] font-medium shadow-btn active:translate-y-[3px] active:shadow-none transition-transform duration-75', tone === 'sky' ? 'bg-sky2' : 'bg-paper')
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {keys.map((d, i) => <button key={d} className={k} onClick={() => { fx.key(i); onKey(d) }}>{d}</button>)}
      <div className="flex items-center justify-center">{extra}</div>
      <button className={k} onClick={() => { fx.key(10); onKey('0') }}>0</button>
      <Tooltip label="Delete" className="w-full"><button aria-label="Delete" className={cx(k, 'w-full bg-sand')} onClick={() => { fx.erase(); onDelete() }}><Delete size={26} /></button></Tooltip>
    </div>
  )
}

/* ---------------- Surfaces ---------------- */
export function Card({ children, className, variant = 'outline', onClick, style }: { children: ReactNode; className?: string; variant?: 'outline' | 'raised' | 'flat' | 'soft'; onClick?: () => void; style?: CSSProperties }) {
  if (useLook() === 'desk') {
    const d = { outline: 'border border-line bg-paper', raised: 'border border-line bg-paper shadow-desk', flat: 'bg-sand', soft: 'border border-line bg-paper shadow-desk' }[variant]
    if (onClick) return <button style={style} onClick={() => { fx.tap(); onClick() }} className={cx('block w-full rounded-[12px] text-left transition-colors hover:border-navy/30 hover:bg-cream', d, className)}>{children}</button>
    return <div style={style} className={cx('rounded-[12px]', d, className)}>{children}</div>
  }
  const v = { outline: 'border-2 border-navy bg-paper', raised: 'border-2 border-navy bg-paper shadow-btn', flat: 'bg-sand', soft: 'border border-line bg-paper shadow-card' }[variant]
  if (onClick) return <motion.button style={style} onClick={() => { fx.tap(); onClick() }} whileTap={{ scale: 0.985 }} whileHover={{ y: -2 }} transition={springPop} className={cx('block w-full rounded-[20px] text-left', v, className)}>{children}</motion.button>
  return <div style={style} className={cx('rounded-[20px]', v, className)}>{children}</div>
}

export function ListRow({ icon, title, sub, right, onClick, chevron = true, className, danger }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; chevron?: boolean; className?: string; danger?: boolean }) {
  const body = (
    <>
      {icon && <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]', danger ? 'bg-brick2 text-brick' : 'bg-sand text-navy')}>{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cx('truncate text-[16px] font-semibold leading-snug', danger && 'text-brick')}>{title}</span>
        {sub && <span className="truncate text-[13px] text-mid">{sub}</span>}
      </span>
      {right}
      {onClick && chevron && <ChevronRight size={20} className="shrink-0 text-faint" />}
    </>
  )
  const cls = cx('flex w-full items-center gap-3 px-1 py-3 text-left', className)
  return onClick ? <button onClick={() => { fx.tap(); onClick() }} className={cx(cls, 'rounded-[14px] transition-colors hover:bg-navy/[0.04] active:bg-navy/[0.07]')}>{body}</button> : <div className={cls}>{body}</div>
}

export const SectionLabel = ({ children, className, right }: { children: ReactNode; className?: string; right?: ReactNode }) => (
  <div className={cx('flex items-center justify-between', className)}><h3 className="font-body text-[13px] font-bold uppercase tracking-[0.08em] text-mid">{children}</h3>{right}</div>
)

export type TagTone = 'neutral' | 'info' | 'success' | 'warn' | 'danger' | 'dark' | 'sun'
export function Tag({ children, tone = 'neutral', icon, className }: { children: ReactNode; tone?: TagTone; icon?: ReactNode; className?: string }) {
  const t = { neutral: 'bg-sand2 text-navy', info: 'bg-canal2 text-canal', success: 'bg-green2 text-green', warn: 'bg-sun2 text-brick', danger: 'bg-brick2 text-brick', dark: 'bg-navy text-cream', sun: 'bg-sun text-navy' }[tone]
  const desk = useLook() === 'desk'
  return <span className={cx('inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-semibold', desk ? 'h-6 rounded-[6px] px-2 text-[12px]' : 'h-7 rounded-full px-2.5 text-[13px]', t, className)}>{icon}{children}</span>
}

export function Avatar({ name, size = 44, tone = 'sun', className }: { name: string; size?: number; tone?: 'sun' | 'sky' | 'green' | 'sand' | 'canal'; className?: string }) {
  const bg = { sun: 'bg-sun', sky: 'bg-sky', green: 'bg-green2', sand: 'bg-sand2', canal: 'bg-canal2' }[tone]
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  if (useLook() === 'desk') return <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-body font-semibold text-navy', bg, className)} style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials}</span>
  return <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full border-2 border-navy font-head font-extrabold', bg, className)} style={{ width: size, height: size, fontSize: size * 0.38 }}><span className="pt-[2px]">{initials}</span></span>
}

export const Divider = ({ className, dashed }: { className?: string; dashed?: boolean }) => <hr className={cx('border-0 border-t-2', dashed ? 'border-dashed border-navy/25' : 'border-line', className)} />

export const Spinner = ({ size = 20, className }: { size?: number; className?: string }) => <Loader2 size={size} className={cx('animate-spin', className)} />

/** Steps across the top (reported → closed). Current step pulses. */
export function Steps({ steps, current, className, tone = 'sun', compact }: { steps: string[]; current: number; className?: string; tone?: 'sun' | 'blue'; compact?: boolean }) {
  return (
    <div className={cx('w-full', className)}>
      <div className="relative flex items-center justify-between px-[9px]">
        <div className="absolute left-[18px] right-[18px] top-1/2 h-[3px] -translate-y-1/2 rounded bg-sand2" />
        <motion.div className={cx('absolute left-[18px] top-1/2 h-[3px] -translate-y-1/2 rounded', tone === 'blue' ? 'bg-signal2' : 'bg-navy')}
          initial={{ width: 0 }} animate={{ width: `calc((100% - 36px) * ${current / (steps.length - 1)})` }} transition={{ ...spring, delay: 0.15 }} />
        {steps.map((s, i) => (
          <motion.span key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...springPop, delay: 0.1 + i * 0.05 }}
            className={cx('relative flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-navy',
              i < current ? (tone === 'blue' ? 'bg-signal2' : 'bg-navy') : i === current ? (tone === 'blue' ? 'bg-sky' : 'bg-sun') : 'bg-paper')}>
            {i < current && <Check size={11} strokeWidth={4} className="text-white" />}
            {i === current && <motion.span className="absolute inset-[-6px] rounded-full border-2 border-navy/40" animate={{ scale: [1, 1.35], opacity: [0.8, 0] }} transition={{ duration: 1.3, repeat: Infinity }} />}
          </motion.span>
        ))}
      </div>
      {!compact && <div className="mt-2 flex justify-between">
        {steps.map((s, i) => <span key={s} className={cx('w-0 flex-1 text-center text-[12px] leading-tight first:text-left last:text-right', i === current ? 'font-bold text-navy' : 'text-mid')}>{s}</span>)}
      </div>}
    </div>
  )
}

/** Vertical journey with an inked line that draws itself. */
export type TimelineItem = { title: ReactNode; sub?: ReactNode; state: 'done' | 'now' | 'todo'; extra?: ReactNode }
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  useEffect(() => { items.forEach((it, i) => { if (it.state !== 'todo') setTimeout(() => fx.tick(i), 160 + i * 90) }) }, [])
  return (
    <ol className={cx('relative', className)}>
      {items.map((it, i) => (
        <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
          {i < items.length - 1 && (
            <span className="absolute left-[15px] top-8 bottom-0 w-[2px] overflow-hidden">
              <span className={cx('absolute inset-0', it.state === 'done' ? 'bg-navy' : 'bg-[repeating-linear-gradient(to_bottom,#00224E66_0_5px,transparent_5px_10px)]')} />
              {it.state === 'done' && <motion.span className="absolute inset-0 origin-top bg-navy" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3, delay: 0.15 + i * 0.09 }} />}
            </span>
          )}
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...springPop, delay: 0.1 + i * 0.09 }}
            className={cx('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
              it.state === 'done' ? 'border-navy bg-navy text-cream' : it.state === 'now' ? 'border-navy bg-sun' : 'border-dashed border-navy/40 bg-paper')}>
            {it.state === 'done' && <Check size={16} strokeWidth={3.5} />}
            {it.state === 'now' && <><span className="h-2.5 w-2.5 rounded-full bg-navy" /><motion.span className="absolute inset-[-5px] rounded-full border-2 border-sun" animate={{ scale: [1, 1.3], opacity: [1, 0] }} transition={{ duration: 1.4, repeat: Infinity }} /></>}
          </motion.span>
          <div className={cx('min-w-0 flex-1 pt-1', it.state === 'todo' && 'opacity-55')}>
            <div className={cx('font-head font-bold leading-tight', it.state === 'now' ? 'text-[19px]' : 'text-[17px]')}>{it.title}</div>
            {it.sub && <div className="mt-0.5 text-[14px] text-mid">{it.sub}</div>}
            {it.extra}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Stars({ value, onChange, size = 40 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(n => (
        <motion.button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? 's' : ''}`} disabled={!onChange}
          onClick={() => { fx.star(n - 1); onChange?.(n) }} whileTap={{ scale: 0.8 }} animate={{ scale: n <= value ? [1.25, 1] : 1, rotate: n <= value ? [0, -12, 0] : 0 }} transition={{ duration: 0.3, delay: onChange ? 0 : n * 0.05 }}>
          <Star size={size} strokeWidth={2.2} className="text-navy" fill={n <= value ? '#FFD265' : '#FFFFFF'} />
        </motion.button>
      ))}
    </div>
  )
}

/* ---------------- Art ---------------- */
export const Art = ({ n, className, style, w, alt = '' }: { n: string; className?: string; style?: CSSProperties; w?: number | string; alt?: string }) =>
  <img src={`${import.meta.env.BASE_URL}art/${n}.svg`} alt={alt} draggable={false} className={cx('block select-none', className)} style={{ ...(w ? { width: w, height: 'auto' } : {}), ...style }} />

export type Pose = 'wave' | 'walk' | 'thumbs' | 'point' | 'jump' | 'sit' | 'think' | 'cele' | 'stand'
export function Beaver({ pose = 'wave', size = 140, className, bob }: { pose?: Pose; size?: number; className?: string; bob?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.img src={`${import.meta.env.BASE_URL}art/beaver-${pose}.svg`} alt="" draggable={false} className={cx('block select-none', className)} style={{ width: size, height: 'auto' }}
      initial={reduce ? false : { y: 16, scale: 0.9, rotate: -4 }} animate={reduce ? undefined : bob ? { y: [0, -6, 0], scale: 1, rotate: 0 } : { y: 0, scale: 1, rotate: 0 }}
      transition={bob ? { y: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }, default: springPop } : springPop} />
  )
}

/* ---------------- Overlays ---------------- */
export function Sheet({ open, onClose, children, title, className }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode; className?: string }) {
  useEffect(() => { if (open) fx.page() }, [open])
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <motion.button aria-label="Close" className="absolute inset-0 cursor-default bg-navy/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div role="dialog" aria-modal className={cx('relative max-h-[88%] overflow-y-auto rounded-t-[28px] border-t-2 border-navy bg-cream px-6 pb-8 pt-3 no-scrollbar', className)}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={(_: unknown, i: PanInfo) => { if (i.offset.y > 90 || i.velocity.y > 600) onClose() }}>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-navy/20" />
            {title && <h2 className="mb-4 font-head text-h2 font-extrabold">{title}</h2>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Dialog({ open, onClose, children, title, width = 480, footer }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode; width?: number; footer?: ReactNode }) {
  const desk = useLook() === 'desk'
  useEffect(() => {
    if (!open) return
    fx.pop()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [open])
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div className={cx('absolute inset-0', desk ? 'bg-navy/35' : 'bg-navy/55')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div role="dialog" aria-modal className={cx('relative max-h-full overflow-y-auto', desk ? 'rounded-[16px] border border-line bg-paper p-6 shadow-pop' : 'rounded-[24px] border-2 border-navy bg-cream p-7 shadow-[0_6px_0_#00224E]')} style={{ width }}
            initial={{ y: 10, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 6, opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <div className="mb-3 flex items-start justify-between gap-4">
              {title && <h2 className={cx('font-head leading-tight', desk ? 'text-[22px] font-bold' : 'text-h2 font-extrabold')}>{title}</h2>}
              <IconButton label="Close" variant="ghost" size={36} onClick={onClose}><X size={20} /></IconButton>
            </div>
            {children}
            {footer && <div className={cx('mt-6 flex items-center gap-3', desk && '-mx-6 -mb-6 justify-end border-t border-rule bg-cream px-6 py-4 [&>*:first-child]:order-last')}>{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ---------------- Toasts: sticky notes, phone notifications, desktop snackbars ---------------- */
export type ToastOpts = {
  kind?: 'sticky' | 'system' | 'bar'; title: ReactNode; body?: ReactNode; app?: string; icon?: ReactNode; tone?: 'sun' | 'sky' | 'green' | 'brick'
  action?: { label: string; run: () => void }; onTap?: () => void; ms?: number
}
type ToastItem = ToastOpts & { id: number }
const ToastCtx = createContext<{ show: (t: ToastOpts) => void; items: ToastItem[]; remove: (id: number) => void }>({ show: () => {}, items: [], remove: () => {} })
export const useToast = () => useContext(ToastCtx).show

/** Provides toasts. Put <ToastOutlet/> where they should appear (inside the phone). */
export function ToastHost({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const remove = useCallback((id: number) => setItems(s => s.filter(i => i.id !== id)), [])
  const show = useCallback((t: ToastOpts) => {
    const id = Date.now() + Math.random()
    const kind = t.kind || 'sticky'
    kind === 'system' ? fx.notify() : kind === 'sticky' ? fx.paper() : fx.pop()
    setItems(s => [...s.slice(-2), { ...t, kind, id }])
    setTimeout(() => remove(id), t.ms ?? (kind === 'system' ? 6500 : 3400))
  }, [remove])
  return <ToastCtx.Provider value={{ show, items, remove }}>{children}</ToastCtx.Provider>
}
export function ToastOutlet({ placement = 'top' }: { placement?: 'top' | 'bottom' }) {
  const { items, remove } = useContext(ToastCtx)
  return (
    <div className={cx('pointer-events-none absolute inset-x-0 z-[60] flex flex-col items-center gap-2 px-3', placement === 'top' ? 'top-3' : 'bottom-6')}>
      <AnimatePresence>
        {items.map(t => <ToastView key={t.id} t={t} close={() => remove(t.id)} />)}
      </AnimatePresence>
    </div>
  )
}

function ToastView({ t, close }: { t: ToastItem; close: () => void }) {
  const tone = { sun: 'bg-sun2', sky: 'bg-sky2', green: 'bg-green2', brick: 'bg-brick2' }[t.tone || 'sun']
  const tap = () => { if (t.onTap) { fx.tap(); t.onTap(); close() } }
  if (t.kind === 'system') return (
    <motion.div layout drag="y" dragConstraints={{ top: 0, bottom: 0 }} onDragEnd={(_: unknown, i: PanInfo) => i.offset.y < -30 && close()}
      initial={{ y: -120, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: -120, opacity: 0 }} transition={spring}
      onClick={tap} className="pointer-events-auto w-full max-w-[380px] cursor-pointer rounded-[22px] border border-navy/10 bg-white/95 p-3.5 shadow-lift backdrop-blur">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-mid">
        {t.icon ? <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-navy text-[11px] text-cream">{t.icon}</span> : <img src={`${(import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL}logo.svg`} alt="" width={20} height={20} />}<span style={{ fontFamily: 'Kodchasan, sans-serif', fontWeight: 700 }}>{t.app || 'Align'}</span><span className="ml-auto font-normal">now</span>
      </div>
      <div className="mt-1.5 text-[15px] font-bold leading-snug">{t.title}</div>
      {t.body && <div className="text-[14px] leading-snug text-ink">{t.body}</div>}
      {t.action && <button onClick={e => { e.stopPropagation(); fx.tap(); t.action!.run(); close() }} className="mt-2 h-9 rounded-[10px] bg-navy px-3 text-[14px] font-bold text-cream">{t.action.label}</button>}
    </motion.div>
  )
  if (t.kind === 'bar') return (
    <motion.div layout initial={{ y: 60, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, opacity: 0 }} transition={springPop}
      className="pointer-events-auto flex min-h-[48px] items-center gap-3 rounded-[12px] bg-navy px-4 py-2 text-cream shadow-pop">
      {t.icon}<span className="text-[15px] font-semibold">{t.title}</span>{t.body && <span className="text-[14px] opacity-80">{t.body}</span>}
      {t.action && <button onClick={() => { fx.tap(); t.action!.run(); close() }} className="ml-2 rounded-[8px] px-2.5 py-1.5 text-[14px] font-semibold text-sun hover:bg-white/10">{t.action.label}</button>}
    </motion.div>
  )
  return (
    <motion.div layout initial={{ y: -90, rotate: -7, scale: 1.05 }} animate={{ y: 0, rotate: 0, scale: 1 }} exit={{ y: -60, rotate: 4, opacity: 0 }} transition={springPop}
      onClick={tap} className={cx('pointer-events-auto relative w-full max-w-[360px] rounded-[6px] border-2 border-navy px-4 pb-3 pt-4 shadow-lift', tone, t.onTap && 'cursor-pointer')}>
      <span className="absolute -top-2.5 left-1/2 h-4 w-16 -translate-x-1/2 rounded-[2px] border border-navy/20 bg-sun/80" />
      <div className="flex items-start gap-3">
        {t.icon && <span className="mt-0.5 shrink-0">{t.icon}</span>}
        <div className="min-w-0"><div className="font-head text-[17px] font-bold leading-tight">{t.title}</div>{t.body && <div className="mt-0.5 text-[14px] leading-snug text-mid">{t.body}</div>}</div>
      </div>
    </motion.div>
  )
}

/* ---------------- Blank states ---------------- */
export function EmptyState({ pose = 'sit', title, body, children, className }: { pose?: Pose; title: string; body?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-col items-center text-center', className)}>
      <Beaver pose={pose} size={150} />
      <h2 className="mt-4 font-head text-h2 font-extrabold">{title}</h2>
      {body && <p className="mt-2 max-w-[300px] text-[15px] leading-relaxed text-mid">{body}</p>}
      {children && <div className="mt-6 flex w-full flex-col items-center gap-2">{children}</div>}
    </div>
  )
}
