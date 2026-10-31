/* Figma screen renderer.
   Screens are read from the ALIGN v3 Figma file as data (position, size, fill, stroke, radius, shadow,
   text and font of every layer). This component draws them exactly, at 1:1, and lets the app attach
   behaviour to any layer by its Figma node id: replace its text, hide it, make it clickable, turn an
   Input into a real text field, swap a drawing, or animate it. Nothing is restyled here. */
import React, { CSSProperties, ReactNode, createContext, useContext, useState } from 'react'
import { fx } from '../ds/fx'

export type FNode = {
  i: string; t: string; n: string; x: number; y: number; w: number; h: number
  f?: string; s?: string; r?: number; e?: string; o?: number; rot?: number
  c?: string; fn?: string; fs?: number; lh?: number | string; al?: string; ls?: string; tc?: string; td?: string; seg?: [number, number, string, string, number][]
  mc?: string; txt?: string[]; art?: number; k?: FNode[]
}
export type Bind = {
  text?: ReactNode            // replace a text layer (or a Button / Input label)
  hide?: boolean
  onClick?: () => void
  render?: (n: FNode) => ReactNode   // draw something else in this layer's box
  wrap?: (el: ReactNode, n: FNode) => ReactNode  // e.g. animate a drawing
  art?: string                // use another drawing (Figma node id) in this place
  style?: CSSProperties
  on?: boolean                // Cell / Chip state
  input?: { value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; maxLength?: number; autoFocus?: boolean; onEnter?: () => void; multiline?: boolean }
  disabled?: boolean
  label?: string              // accessible name / hover name for icon-only layers
  dy?: number                 // nudge (for lists that grow)
}
export type Binds = Record<string, Bind>

const BASE = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL
export const figArt = (id: string) => `${BASE}fig/${id.replace(':', '-')}.svg`

const color = (c?: string) => {
  if (!c || !c.startsWith('#')) return undefined
  const [h, a] = c.split('@')
  if (!a) return h
  const n = parseInt(h.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
const stroke = (s?: string): CSSProperties => {
  if (!s) return {}
  const [c, w, d] = s.split('/')
  return { border: `${+(+w).toFixed(1)}px ${d ? 'dashed' : 'solid'} ${color(c)}` }
}
const shadow = (e?: string) => { if (!e) return undefined; const [x, y, b, c] = e.split(','); return `${x}px ${y}px ${b}px ${c}` }

const FONT: Record<string, [string, number]> = {
  'League Spartan': ['"League Spartan", sans-serif', 0], 'Rounded Mplus 1c': ['"M PLUS Rounded 1c", sans-serif', 0],
  Kodchasan: ['Kodchasan, sans-serif', 0], 'DM Mono': ['"DM Mono", monospace', 0], 'Baloo 2': ['"Baloo 2", "Noto Sans Devanagari", sans-serif', 0],
  'DM Sans': ['"DM Sans", sans-serif', 0], 'Noto Sans Devanagari': ['"Noto Sans Devanagari", sans-serif', 0], Inter: ['Inter, sans-serif', 0],
}
const WEIGHT: Record<string, number> = { Thin: 100, Light: 300, Regular: 400, Medium: 500, SemiBold: 600, 'Semi Bold': 600, Bold: 700, ExtraBold: 800, 'Extra Bold': 800, Black: 900 }
export function fontOf(fn?: string): CSSProperties {
  if (!fn) return {}
  const fam = Object.keys(FONT).find(f => fn.startsWith(f)) || 'Rounded Mplus 1c'
  const style = fn.slice(fam.length).trim()
  return { fontFamily: FONT[fam][0], fontWeight: WEIGHT[style] || 400 }
}
export function textStyle(n: FNode): CSSProperties {
  const lh = typeof n.lh === 'number' ? `${n.lh}px` : typeof n.lh === 'string' ? `${parseFloat(n.lh) / 100}` : undefined
  const single = !(n.c || '').includes('\n') && (n.lh ? n.h <= (typeof n.lh === 'number' ? n.lh : (n.fs || 16) * 1.3) * 1.5 : n.h <= (n.fs || 16) * 1.6)
  return {
    ...fontOf(n.fn), fontSize: n.fs, lineHeight: lh || (single ? `${n.h}px` : 1.25), color: color(n.f),
    textAlign: n.al === 'C' ? 'center' : n.al === 'R' ? 'right' : n.al === 'J' ? 'justify' : 'left',
    letterSpacing: n.ls ? (n.ls.endsWith('%') ? `${parseFloat(n.ls) / 100}em` : `${n.ls}px`) : undefined,
    textTransform: n.tc === 'UPPER' ? 'uppercase' : n.tc === 'LOWER' ? 'lowercase' : undefined,
    textDecoration: n.td === 'UNDERLINE' ? 'underline' : n.td === 'STRIKETHROUGH' ? 'line-through' : undefined,
    textUnderlineOffset: n.td === 'UNDERLINE' ? 3 : undefined,
    whiteSpace: single ? 'nowrap' : 'pre-wrap', opacity: n.o,
  }
}

type Ctx = { binds: Binds }
const C = createContext<Ctx>({ binds: {} })

const box = (n: FNode, p: { x: number; y: number }, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute', left: n.x - p.x, top: n.y - p.y, width: n.w, height: n.h, ...extra,
})

/* ---------------- kit components, exactly as the Figma kit ---------------- */
const PRESSED: Record<string, string> = { '#FFD265': '#F2BD3D', '#0794FF': '#0680DC', '#FFFBF3': '#F7F0E1', '#B8530A': '#9E4708', '#00224E': '#00224E' }
function KitButton({ n, p, b }: { n: FNode; p: { x: number; y: number }; b?: Bind }) {
  const [down, setDown] = useState(false)
  const bg = color(n.f) || '#FFD265'
  const light = /dark|danger/.test(n.mc || '')
  const y = n.e ? +n.e.split(',')[1] : 5
  return (
    <button type="button" disabled={b?.disabled} aria-label={typeof b?.text === 'string' ? b.text : n.txt?.[0]}
      onPointerDown={() => setDown(true)} onPointerUp={() => setDown(false)} onPointerLeave={() => setDown(false)}
      onClick={() => { fx.tap(); b?.onClick?.() }}
      style={{ ...box(n, p), ...stroke(n.s), borderRadius: n.r, background: down ? PRESSED[bg] || bg : bg, boxShadow: `0 ${down ? 1 : y}px 0 #00224E`,
        transform: `translateY(${down ? y - 1 : 0}px)`, transition: 'transform 60ms, box-shadow 60ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '0 24px',
        fontFamily: '"League Spartan", sans-serif', fontWeight: 800, fontSize: 18, lineHeight: '22px', color: light ? '#FFFBF3' : '#00224E', opacity: b?.disabled ? 0.5 : 1, cursor: b?.disabled ? 'default' : 'pointer', ...b?.style }}>
      <span style={{ paddingTop: 2 }}>{b?.text ?? n.txt?.[0]}</span>
    </button>
  )
}
function KitBigButton({ n, p, b }: { n: FNode; p: { x: number; y: number }; b?: Bind }) {
  const [down, setDown] = useState(false)
  const [hi, en] = Array.isArray(b?.text) ? (b!.text as unknown as [ReactNode, ReactNode]) : [n.txt?.[0], n.txt?.[1]]
  return (
    <button type="button" disabled={b?.disabled} aria-label={typeof en === 'string' ? en : undefined}
      onPointerDown={() => setDown(true)} onPointerUp={() => setDown(false)} onPointerLeave={() => setDown(false)}
      onClick={() => { fx.tap(); b?.onClick?.() }}
      style={{ ...box(n, p), border: '2.5px solid #00224E', borderRadius: 28, background: down ? '#0680DC' : '#0794FF', boxShadow: `0 ${down ? 1 : 6}px 0 #00224E`, transform: `translateY(${down ? 5 : 0}px)`,
        transition: 'transform 60ms, box-shadow 60ms', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 24px', textAlign: 'left', cursor: 'pointer', opacity: b?.disabled ? 0.5 : 1, ...b?.style }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: '"Baloo 2", "Noto Sans Devanagari", sans-serif', fontWeight: 800, fontSize: 36, lineHeight: '40px', color: '#00224E', whiteSpace: 'nowrap' }}>{hi}</span>
        <span style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif', fontSize: 14.5, lineHeight: '20px', color: '#00224E' }}>{en}</span>
      </span>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M4 14H24M16 22L24 14L16 6" stroke="#00224E" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  )
}
function KitInput({ n, p, b }: { n: FNode; p: { x: number; y: number }; b?: Bind }) {
  const [focus, setFocus] = useState(false)
  const inp = b?.input
  const val = inp?.value ?? ''
  const err = inp?.error ?? /error/.test(n.mc || '')
  const st: CSSProperties = err ? { border: '2.5px solid #B8530A', background: '#FFFFFF' }
    : focus ? { border: '2.5px solid #00224E', background: '#FFFBF3', boxShadow: '0 4px 0 #00224E' }
    : val ? { border: '2.5px solid #00224E', background: '#FFFFFF' } : { border: '1.5px solid #00224E', background: '#FFFFFF' }
  const common = {
    value: val, placeholder: inp?.placeholder ?? (/empty/.test(n.mc || '') ? n.txt?.[0] : ''), autoFocus: inp?.autoFocus,
    onFocus: () => setFocus(true), onBlur: () => setFocus(false),
    style: { width: '100%', height: '100%', background: 'transparent', outline: 'none', border: 0, fontFamily: '"M PLUS Rounded 1c", sans-serif', fontSize: 16, lineHeight: '24px', color: '#00224E', padding: inp?.multiline ? '12px 0' : 0, resize: 'none' as const },
  }
  return (
    <label style={{ ...box(n, p), ...st, borderRadius: n.r ?? 16, display: 'flex', alignItems: inp?.multiline ? 'flex-start' : 'center', padding: '0 18px', transition: 'box-shadow 80ms, background 80ms', ...b?.style }}>
      {inp?.multiline
        ? <textarea {...common} onChange={e => inp.onChange(e.target.value)} />
        : <input {...common} type={inp?.type || 'text'} inputMode={inp?.inputMode} maxLength={inp?.maxLength} aria-invalid={err}
            onChange={e => { const v = e.target.value; if (v.length > val.length) fx.key(v.length); else fx.erase(); inp?.onChange(v) }}
            onKeyDown={e => { if (e.key === 'Enter') inp?.onEnter?.() }} />}
    </label>
  )
}
function KitCell({ n, p, b }: { n: FNode; p: { x: number; y: number }; b?: Bind }) {
  const on = b?.on ?? /on\]/.test(n.mc || '')
  return (
    <button type="button" aria-pressed={on} aria-label={b?.label} onClick={() => { on ? fx.deselect() : fx.select(); b?.onClick?.() }}
      style={{ ...box(n, p), borderRadius: 14, border: '2.5px solid #00224E', background: on ? '#FFD265' : '#FFFBF3', boxShadow: on ? '0 3px 0 #00224E' : 'none', transition: 'background 90ms, box-shadow 90ms', cursor: 'pointer' }} />
  )
}
function KitIcon({ n, p, b, file, label }: { n: FNode; p: { x: number; y: number }; b?: Bind; file: string; label: string }) {
  return (
    <button type="button" aria-label={b?.label || label} title={b?.label || label} onClick={() => { fx.tap(); b?.onClick?.() }}
      style={{ ...box(n, p), padding: 0, border: 0, background: 'none', cursor: 'pointer', borderRadius: '50%', ...b?.style }} className="fig-press">
      {b?.render ? b.render(n) : <img src={figArt(file)} alt="" width={n.w} height={n.h} draggable={false} />}
    </button>
  )
}

/* ---------------- tree ---------------- */
function Layer({ n, p }: { n: FNode; p: { x: number; y: number } }) {
  const { binds } = useContext(C)
  const b = binds[n.i]
  if (b?.hide) return null
  const q = b?.dy ? { ...p, y: p.y - b.dy } : p
  if (b?.render && n.t !== 'INS') {
    const inner = b.wrap ? b.wrap(b.render(n), n) : b.render(n)
    return b.onClick
      ? <button type="button" aria-label={b.label || n.n} title={b.label} disabled={b.disabled} onClick={() => { b.onClick!() }} className="fig-press" style={{ ...box(n, q), padding: 0, border: 0, background: 'none', cursor: 'pointer', textAlign: 'left', ...b.style }}>{inner}</button>
      : <div style={{ ...box(n, q), ...b.style }}>{inner}</div>
  }

  let el: ReactNode
  if (n.t === 'INS') {
    const mc = n.mc || ''
    if (mc.startsWith('BigButton')) el = <KitBigButton n={n} p={q} b={b} />
    else if (mc.startsWith('Button')) el = <KitButton n={n} p={q} b={b} />
    else if (mc.startsWith('Input')) el = <KitInput n={n} p={q} b={b} />
    else if (mc.startsWith('Cell')) el = <KitCell n={n} p={q} b={b} />
    else if (mc === 'Back') el = <KitIcon n={n} p={q} b={b} file="kit-217:72" label="Back" />
    else if (mc === 'Speaker') el = <KitIcon n={n} p={q} b={b} file="kit-217:76" label="Listen" />
    else if (mc === 'LangPill') el = <KitIcon n={n} p={q} b={b} file="kit-217:81" label="Change language" />
    else el = b?.render ? <div style={box(n, q)}>{b.render(n)}</div> : <div style={{ ...box(n, q), background: color(n.f), ...stroke(n.s), borderRadius: n.r, boxShadow: shadow(n.e) }} />
  } else if (n.art) {
    const img = <img src={figArt(b?.art || n.i)} alt="" draggable={false} style={{ display: 'block', maxWidth: 'none', pointerEvents: 'none' }} />
    const inner = b?.wrap ? b.wrap(img, n) : img
    el = b?.onClick
      ? <button type="button" aria-label={b.label || n.n} title={b.label} onClick={() => { fx.tap(); b.onClick!() }} style={{ ...box(n, q, { width: undefined, height: undefined }), padding: 0, border: 0, background: 'none', cursor: 'pointer' }} className="fig-press">{inner}</button>
      : <div style={{ ...box(n, q, { width: undefined, height: undefined }), ...b?.style }}>{inner}</div>
  } else if (n.t === 'TEX') {
    const content = b?.text !== undefined ? b.text : n.seg ? segs(n) : n.c
    const st: CSSProperties = { ...box(n, q, { height: undefined, minHeight: n.h }), ...textStyle(n), ...b?.style }
    el = b?.onClick
      ? <button type="button" onClick={() => { fx.tap(); b.onClick!() }} style={{ ...st, padding: 0, border: 0, background: 'none', cursor: 'pointer' }} className="fig-link">{content}</button>
      : <div style={st}>{content}</div>
  } else {
    const st: CSSProperties = { ...box(n, q), background: color(n.f), ...stroke(n.s), borderRadius: n.t === 'ELL' ? '50%' : n.r, boxShadow: shadow(n.e), opacity: n.o, ...b?.style }
    const kids = n.k?.map(k => <Layer key={k.i} n={k} p={{ x: n.x, y: n.y - (b?.dy || 0) + (b?.dy || 0) }} />)
    el = b?.onClick
      ? <button type="button" aria-label={b.label} onClick={() => { fx.tap(); b.onClick!() }} style={{ ...st, padding: 0, textAlign: 'left', cursor: b.disabled ? 'default' : 'pointer', font: 'inherit', color: 'inherit' }} className="fig-press">{kids}</button>
      : <div style={st}>{kids}</div>
  }
  return <>{el}</>
}
function segs(n: FNode) {
  const s = n.c || ''
  return n.seg!.map(([a, b, style, f, fs], i) => <span key={i} style={{ ...fontOf(n.fn!.split(' ').slice(0, -1).join(' ') + ' ' + style), color: color(f), fontSize: fs }}>{s.slice(a, b)}</span>)
}

/** Draw one Figma screen. `extra` is placed on top (same 390 x 844 coordinate space). */
export function Fig({ s, binds = {}, extra, bg }: { s: FNode; binds?: Binds; extra?: ReactNode; bg?: string }) {
  return (
    <C.Provider value={{ binds }}>
      <div className="fig-root" style={{ position: 'relative', isolation: 'isolate', width: s.w, height: s.h, background: bg || color(s.f), overflow: 'hidden' }}>
        {s.k?.map(k => <Layer key={k.i} n={k} p={{ x: 0, y: 0 }} />)}
        {extra}
      </div>
    </C.Provider>
  )
}

/** Find a layer anywhere in a screen (for reading its position when placing extra elements). */
export function findNode(s: FNode, id: string): FNode | undefined {
  if (s.i === id) return s
  for (const k of s.k || []) { const r = findNode(k, id); if (r) return r }
}

/* ---------- Drawings that change with state (selected tile, toggle, slot) ----------
   The Figma drawing is loaded as text and adjusted (a fill colour swapped, a knob moved),
   so the selected look is the same drawing, never a new one. */
const svgCache = new Map<string, Promise<string>>()
const loadSvg = (id: string) => { const u = figArt(id); if (!svgCache.has(u)) svgCache.set(u, fetch(u).then(r => r.text())); return svgCache.get(u)! }
export function SvgMod({ id, mod, style }: { id: string; mod?: (svg: string) => string; style?: CSSProperties }) {
  const [svg, setSvg] = useState('')
  React.useEffect(() => { let live = true; loadSvg(id).then(t => live && setSvg(t)); return () => { live = false } }, [id])
  const uid = React.useId().replace(/:/g, '')
  const out = svg ? (mod ? mod(svg) : svg).replace(/(id="|url\(#)([^")]+)/g, `$1${uid}$2`) : ''
  return <span style={{ display: 'block', lineHeight: 0, ...style }} dangerouslySetInnerHTML={{ __html: out }} />
}
/** Replace the n-th `fill="#..."` (0-based) in an SVG string. */
export const setFill = (svg: string, nth: number, color: string) => { let i = -1; return svg.replace(/fill="#[0-9A-Fa-f]{6}"/g, m => (++i === nth ? `fill="${color}"` : m)) }
/** Replace every fill of one colour with another. */
export const swapFill = (svg: string, from: string, to: string) => svg.split(`fill="${from}"`).join(`fill="${to}"`)
