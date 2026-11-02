/* Figma screen renderer.
   Screens are read from the ALIGN v3 Figma file as data (position, size, fill, stroke, radius, shadow,
   text and font of every layer). This component draws them exactly, at 1:1, and lets the app attach
   behaviour to any layer by its Figma node id: replace its text, hide it, make it clickable, turn an
   Input into a real text field, swap a drawing, or animate it. Nothing is restyled here. */
import React, { CSSProperties, ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fx } from '../ds/fx'
import { artUrl, svgText, preloadAll, allWarm, srcFor } from './preload'
import { setBackdrop, clearBackdrop } from './backdrop'

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

/** The language the app is showing. Only the technician app changes it: in English the big and the small line of every Hindi / English pair swap places. */
export const LangCtx = createContext<'hi' | 'en'>('hi')
const DEVA = /[ऀ-ॿ]/
/** Hindi / English pairs on one screen: a Devanagari text and the English text right under it (same parent, same side). id -> its partner. */
function pairsOf(s: FNode): Map<string, FNode> {
  const out = new Map<string, FNode>()
  if (/language/i.test(s.n)) return out // the language chooser names each language in its own words, never swapped
  const walk = (parent: FNode) => {
    const texts = (parent.k || []).filter(n => n.t === 'TEX' && n.c && !n.seg)
    for (const h of texts) {
      if (!DEVA.test(h.c!) || out.has(h.i)) continue
      let best: FNode | undefined, bd = 1e9
      for (const e of texts) {
        if (e === h || out.has(e.i) || DEVA.test(e.c!) || !/[A-Za-z]/.test(e.c!)) continue
        const below = e.y - (h.y + h.h), dx = Math.abs(e.x + e.w / 2 - (h.x + h.w / 2)), dl = Math.abs(e.x - h.x)
        if (below < -26 || below > 34 || (dx > 60 && dl > 14)) continue
        const d = Math.abs(below) + Math.min(dx, dl) * 0.3
        if (d < bd) { bd = d; best = e }
      }
      if (best) { out.set(h.i, best); out.set(best.i, h) }
    }
    ;(parent.k || []).forEach(walk)
  }
  walk(s)
  return out
}
let measureCtx: CanvasRenderingContext2D | null = null
/** A font size at which `text` fits the width of the box it is shown in (swapped lines can be longer than the words they replace). */
function fitSize(text: string, n: FNode): number | undefined {
  if (!n.fs || !n.w) return undefined
  measureCtx ??= document.createElement('canvas').getContext('2d')
  if (!measureCtx) return undefined
  const f = fontOf(n.fn)
  measureCtx.font = `${f.fontWeight || 400} ${n.fs}px ${f.fontFamily || 'sans-serif'}`
  const w = measureCtx.measureText(text).width
  return w > n.w ? Math.max(9, Math.floor((n.fs * n.w) / w)) : undefined
}

/** A Hindi line with no English line beside it can still be shown in English: the app gives a translator (an exact phrase list, plus times). */
let toEnglish: ((hi: string) => string | undefined) | undefined
export const setToEnglish = (f: (hi: string) => string | undefined) => { toEnglish = f }

/** Height kept free at the bottom of every screen (a bar the app draws there). Layers that would reach into it are moved up just enough. */
export const BottomPadCtx = createContext(0)

type Ctx = { binds: Binds; pairs: Map<string, FNode>; swap: boolean; lift: number; cut: number }
const C = createContext<Ctx>({ binds: {}, pairs: new Map(), swap: false, lift: 0, cut: 0 })
/** How far, and from where, the bottom group of a screen must move up to clear the app's bottom bar. The group is everything below the last empty gap, so
    a note and its text, or a button and its caption, always move together. The lift never exceeds the gap above the group (plus a little), so nothing is run over. */
function bottomLift(s: FNode, pad: number, hidden: (id: string) => boolean): { lift: number; cut: number } {
  const limit = 844 - pad - 4
  const box = (s.k || []).filter(k => !hidden(k.i) && !(k.h >= 300 && k.y <= 1)).map(k => [k.y, k.y + k.h] as [number, number]).sort((a, b) => a[0] - b[0])
  const groups: [number, number][] = []
  for (const b of box) { const g = groups[groups.length - 1]; if (g && b[0] <= g[1] + 16) g[1] = Math.max(g[1], b[1]); else groups.push([b[0], b[1]]) }
  const last = groups[groups.length - 1]
  if (!last || last[1] <= limit) return { lift: 0, cut: 0 }
  const prev = groups[groups.length - 2]
  const need = Math.min(56, last[1] - limit)
  const room = prev ? last[0] - prev[1] - 4 : need
  return { lift: Math.max(0, Math.min(need, room)), cut: last[0] }
}

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
  const [hi0, en0] = Array.isArray(b?.text) ? (b!.text as unknown as [ReactNode, ReactNode]) : [n.txt?.[0], n.txt?.[1]]
  const lang = useContext(LangCtx)
  const swap = lang === 'en' && typeof hi0 === 'string' && typeof en0 === 'string'
  const [hi, en] = swap ? [en0, hi0] : [hi0, en0]
  const bigFit = swap && typeof hi === 'string' && hi.length > 11 ? Math.max(24, Math.floor(36 * 11 / hi.length) + 4) : 36 // a longer English line gets a smaller size, so it still fits the button
  return (
    <button type="button" disabled={b?.disabled} aria-label={typeof en === 'string' ? en : undefined}
      onPointerDown={() => setDown(true)} onPointerUp={() => setDown(false)} onPointerLeave={() => setDown(false)}
      onClick={() => { fx.tap(); b?.onClick?.() }}
      style={{ ...box(n, p), border: '2.5px solid #00224E', borderRadius: 28, background: down ? '#0680DC' : '#0794FF', boxShadow: `0 ${down ? 1 : 6}px 0 #00224E`, transform: `translateY(${down ? 5 : 0}px)`,
        transition: 'transform 60ms, box-shadow 60ms', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 24px', textAlign: 'left', cursor: 'pointer', opacity: b?.disabled ? 0.5 : 1, ...b?.style }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: '"Baloo 2", "Noto Sans Devanagari", sans-serif', fontWeight: 800, fontSize: bigFit, lineHeight: '40px', color: '#00224E', whiteSpace: 'nowrap', animation: swap || lang === 'hi' ? 'figfade .35s ease both' : undefined }} key={lang}>{hi}</span>
        <span style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif', fontSize: 14.5, lineHeight: '20px', color: '#00224E' }}>{en}</span>
      </span>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M4 14H24M16 22L24 14L16 6" stroke="#00224E" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  )
}
function KitInput({ n, p, b }: { n: FNode; p: { x: number; y: number }; b?: Bind }) {
  const [focus, setFocus] = useState(false)
  if (b?.render) return <div style={{ ...box(n, p), ...b.style }}>{b.render(n)}</div> // the app draws its own field (a list to choose from)
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
      {b?.render ? b.render(n) : <img src={srcFor(figArt(file))} alt="" width={n.w} height={n.h} draggable={false} />}
    </button>
  )
}

/* ---------------- tree ---------------- */
function Layer({ n, p }: { n: FNode; p: { x: number; y: number } }) {
  const { binds, pairs, swap, lift: screenLift, cut } = useContext(C)
  const lang = useContext(LangCtx)
  const pad = useContext(BottomPadCtx)
  const b = binds[n.i]
  if (b?.hide) return null
  // a screen-level layer that would sit under the app's bottom bar is lifted clear of it (largest lift 56 px, so nothing flies far)
  const lift = pad && screenLift && !b?.dy && p.x === 0 && p.y === 0 && n.y >= cut - 0.5 ? screenLift : 0 // the bottom group moves together, so lines that belong together stay together
  const q = b?.dy ? { ...p, y: p.y - b.dy } : lift ? { ...p, y: p.y + lift } : p
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
    const img = <img src={srcFor(figArt(b?.art || n.i))} alt="" draggable={false} style={{ display: 'block', maxWidth: 'none', pointerEvents: 'none' }} />
    const inner = b?.wrap ? b.wrap(img, n) : img
    el = b?.onClick
      ? <button type="button" aria-label={b.label || n.n} title={b.label} onClick={() => { fx.tap(); b.onClick!() }} style={{ ...box(n, q, { width: undefined, height: undefined }), padding: 0, border: 0, background: 'none', cursor: 'pointer' }} className="fig-press">{inner}</button>
      : <div data-beaver={/beaver/i.test(n.n) ? '' : undefined} style={{ ...box(n, q, { width: undefined, height: undefined }), ...b?.style }}>{inner}</div>
  } else if (n.t === 'TEX') {
    let content = b?.text !== undefined ? b.text : n.seg ? segs(n) : n.c
    const partner = lang === 'en' ? pairs.get(n.i) : undefined
    let fit: number | undefined
    if (partner) { // English mode: this line shows its partner's words, in this line's own style (big stays big)
      const pb = binds[partner.i]; const pc = pb?.text !== undefined ? pb.text : partner.c
      if (typeof pc === 'string') { content = pc; fit = fitSize(pc, n) }
    } else if (lang === 'en' && swap && typeof content === 'string' && DEVA.test(content)) {
      const e = toEnglish?.(content)
      if (e) { content = e; fit = fitSize(e, n) }
    }
    const changed = !!partner || (lang === 'en' && content !== (b?.text !== undefined ? b.text : n.c))
    const st: CSSProperties = { ...box(n, q, { height: undefined, minHeight: n.h }), ...textStyle(n), ...(changed ? { ...(fit ? { fontSize: fit } : null), animation: 'figfade .35s ease both', ...(typeof content === 'string' && DEVA.test(content) && !/Baloo|Devanagari/.test(String(fontOf(n.fn).fontFamily)) ? { fontFamily: '"Baloo 2", "Noto Sans Devanagari", sans-serif' } : null) } : null), ...b?.style }
    el = b?.onClick
      ? <button key={changed ? 'en' : 'hi'} type="button" onClick={() => { fx.tap(); b.onClick!() }} style={{ ...st, padding: 0, border: 0, background: 'none', cursor: 'pointer' }} className="fig-link">{content}</button>
      : <div key={changed ? 'en' : 'hi'} style={st}>{content}</div>
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

/** Every drawing file a screen needs (so the screen can wait for them and then appear complete). */
export const urlsOf = (s: FNode, binds: Binds, need: string[]) => {
  const out: string[] = [...need]
  const walk = (n: FNode) => {
    if (n.art) { out.push(artUrl(binds[n.i]?.art || n.i)); if (binds[n.i]?.art) out.push(artUrl(n.i)) }
    if (n.t === 'INS') { const mc = n.mc || ''; if (mc === 'Back') out.push(artUrl('kit-217:72')); else if (mc === 'Speaker') out.push(artUrl('kit-217:76')); else if (mc === 'LangPill') out.push(artUrl('kit-217:81')) }
    n.k?.forEach(walk)
  }
  s.k?.forEach(walk)
  return out
}
const doneFrames = new Set<string>()
/** Ready when the fonts and all the screen's drawings have arrived. Already-loaded screens are ready on the very first render. */
function useScreenReady(id: string, urls: string[], frameId: string): [boolean, number] {
  const [ready, setReady] = useState(() => doneFrames.has(id) || allWarm(urls))
  const [p, setP] = useState(0)
  useEffect(() => {
    if (ready) { doneFrames.add(id); return }
    let live = true
    preloadAll(urls, v => live && setP(v), 8000, frameId).then(() => { doneFrames.add(id); live && setReady(true) })
    return () => { live = false }
  }, [id])
  return [ready, p]
}
/** The quiet loading state: a row of dots that fill in as things arrive. It only shows if loading takes more than a moment. */
function LoadDots({ p, w, h }: { p: number; w: number; h: number }) {
  // the same beaver as the full loader, hammering in place (the pictures are small and are the first thing fetched)
  const [f, setF] = useState(0)
  useEffect(() => { const t = setInterval(() => setF(x => (x + 1) % 4), 230); return () => clearInterval(t) }, [])
  const base = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL
  const frame = [1, 1, 2, 2][f]
  return (
    <div role="status" aria-label="Loading" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'figfade .25s ease .3s both', pointerEvents: 'none' }}>
      <div style={{ position: 'relative', width: 112, height: 118 }}>
        {[1, 2].map(n => <img key={n} src={`${base}fig/build-${n}.svg`} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: n === frame ? 1 : 0 }} />)}
      </div>
    </div>
  )
}
function LoadDotsOld({ p, w, h }: { p: number; w: number; h: number }) {
  const n = 7
  return (
    <div role="status" aria-label="Loading" style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, animation: 'figfade .25s ease .3s both', pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, i) => { const on = p > (i + 0.5) / n; return <span key={i} style={{ width: 14, height: 14, borderRadius: '50%', border: '2.4px solid #00224E', background: on ? '#00224E' : 'transparent', transform: on ? 'scale(1.12)' : 'scale(.86)', transition: 'background .12s, transform .2s cubic-bezier(.3,1.6,.5,1)' }} /> })}
    </div>
  )
}

/** Draw one Figma screen. `extra` is placed on top (same 390 x 844 coordinate space).
    The screen appears only once its drawings and the fonts are all here, so it never shows half drawn and its animations start on a complete screen.
    `need`: extra drawing URLs (for art that is drawn later by a bind) to wait for too. */
export function Fig({ s, binds = {}, extra, bg, need = [] }: { s: FNode; binds?: Binds; extra?: ReactNode; bg?: string; need?: string[] }) {
  const pad = useContext(BottomPadCtx)
  const urls = useMemo(() => urlsOf(s, binds, need), [s.i, need.join('|')])
  const pairs = useMemo(() => pairsOf(s), [s.i])
  const [ready, p] = useScreenReady(s.i + '|' + need.join('|'), urls, s.i)
  // tell the stage what this screen's background looks like, so the window around the phone frame can carry it on
  useEffect(() => { if (!ready || bg) return; setBackdrop(s); return () => clearBackdrop(s) }, [ready, s])
  if (!ready) return <div className="fig-root" style={{ position: 'relative', isolation: 'isolate', width: s.w, height: s.h, background: bg || color(s.f), overflow: 'hidden' }}><LoadDots p={p} w={s.w} h={s.h} /></div>
  return (
    <C.Provider value={{ binds, pairs, swap: !/language/i.test(s.n), ...(pad ? bottomLift(s, pad, id => !!binds[id]?.hide) : { lift: 0, cut: 0 }) }}>
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
const loadSvg = (id: string) => { const u = figArt(id); if (!svgCache.has(u)) svgCache.set(u, svgText.has(u) ? Promise.resolve(svgText.get(u)!) : fetch(u).then(r => r.text()).then(x => { svgText.set(u, x); return x })); return svgCache.get(u)! }
export function SvgMod({ id, mod, style }: { id: string; mod?: (svg: string) => string; style?: CSSProperties }) {
  const [svg, setSvg] = useState(() => svgText.get(figArt(id)) || '') // straight from the cache when the drawing is already loaded
  React.useEffect(() => { let live = true; loadSvg(id).then(t => live && setSvg(t)); return () => { live = false } }, [id])
  const uid = React.useId().replace(/:/g, '')
  const out = svg ? (mod ? mod(svg) : svg).replace(/(id="|url\(#)([^")]+)/g, `$1${uid}$2`) : ''
  return <span style={{ display: 'block', lineHeight: 0, ...style }} dangerouslySetInnerHTML={{ __html: out }} />
}
/** Replace the n-th `fill="#..."` (0-based) in an SVG string. */
export const setFill = (svg: string, nth: number, color: string) => { let i = -1; return svg.replace(/fill="#[0-9A-Fa-f]{6}"/g, m => (++i === nth ? `fill="${color}"` : m)) }
/** Replace every fill of one colour with another. */
export const swapFill = (svg: string, from: string, to: string) => svg.split(`fill="${from}"`).join(`fill="${to}"`)
