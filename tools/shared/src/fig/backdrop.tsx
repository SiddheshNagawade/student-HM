/* Full-bleed background for the phone screens.
   A phone screen is drawn at 390 x 844. On a tablet (or any window with a different shape) the frame is scaled to fit and
   the leftover room used to show as plain bars. Here the screen's own bands (the coloured top field with its wave, the white
   sheet below, ...) are carried sideways to the window edges, so the background simply continues and nothing looks like a
   bezel; the wave line and the hanging string carry on to the edge too. The drawings on top stay as drawn, just bigger. */
import { CSSProperties, ReactNode, useEffect, useState, useSyncExternalStore } from 'react'
import type { FNode } from './Fig'
import { artUrl, srcFor } from './preload'

const color = (c?: string) => {
  if (!c || !c.startsWith('#')) return undefined
  const [h, a] = c.split('@')
  if (!a) return h
  const n = parseInt(h.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export const colorOf = color

let current: FNode | null = null
const subs = new Set<() => void>()
/** A screen that is on show tells the stage what its background looks like. */
export const setBackdrop = (s: FNode | null) => { if (current !== s) { current = s; subs.forEach(f => f()) } }
export const clearBackdrop = (s: FNode) => { if (current === s) setBackdrop(null) }
export const useBackdrop = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f) } }, () => current)

/** The full-width layers of a screen: the ones that touch both side edges (bands, fields, sheets). */
const bandsOf = (s: FNode) => (s.k || []).filter(n => n.x <= 2 && n.w >= 380 && n.t !== 'TEX' && n.t !== 'INS')

/** The colours down one edge of a drawing (fills and outlines), as a hard-stop gradient that is then carried out sideways. */
type Edge = { css: string; first: string; last: string }
const NONE: Edge = { css: '', first: 'transparent', last: 'transparent' }
const gradients = new Map<string, Promise<Edge>>()
function edgeGradient(id: string, side: 'l' | 'r', w: number, h: number): Promise<Edge> {
  const key = `${id}|${side}`
  let p = gradients.get(key)
  if (p) return p
  p = new Promise<Edge>(resolve => {
    const im = new Image()
    im.onload = () => {
      try {
        const W = Math.max(8, Math.round(w)), H = Math.max(2, Math.round(h))
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H
        const cx = cv.getContext('2d', { willReadFrequently: true })!
        cx.drawImage(im, 0, 0, W, H)
        const px = cx.getImageData(side === 'l' ? 2 : W - 3, 0, 1, H).data
        const runs: { c: string; from: number }[] = []
        let last = ''
        for (let y = 0; y < H; y++) {
          const r = px[y * 4], g = px[y * 4 + 1], b = px[y * 4 + 2], a = px[y * 4 + 3]
          // outlines are kept (the wave line and the string carry on to the window edge, as the picture has them)
          const c = a < 24 ? 'transparent' : `rgb(${r},${g},${b})`
          if (c !== last) { runs.push({ c, from: y }); last = c }
        }
        if (!runs.length) return resolve(NONE)
        const stops = runs.map((r, i) => { const a = (r.from / H) * 100, b = ((runs[i + 1]?.from ?? H) / H) * 100; return `${r.c} ${a.toFixed(2)}% ${b.toFixed(2)}%` })
        resolve({ css: `linear-gradient(to bottom, ${stops.join(', ')})`, first: runs[0].c, last: runs[runs.length - 1].c })
      } catch { resolve(NONE) }
    }
    im.onerror = () => resolve(NONE)
    im.src = srcFor(artUrl(id))
  })
  gradients.set(key, p)
  return p
}

function ArtGutter({ n, side, box, up, down }: { n: FNode; side: 'l' | 'r'; box: CSSProperties; up: number; down: number }) {
  const [e, setE] = useState<Edge>(NONE)
  useEffect(() => { let live = true; edgeGradient(n.i, side, n.w, n.h).then(v => live && setE(v)); return () => { live = false } }, [n.i, side])
  const top = box.top as number, h = box.height as number
  return (
    <>
      <div style={{ ...box, backgroundImage: e.css || undefined, backgroundSize: '100% 100%' }} />
      {/* a band that starts at the very top / ends at the very bottom carries its first / last colour on to the window edge */}
      {up > 0.5 && <div style={{ ...box, top: top - up, height: up + 1, background: e.first }} />}
      {down > 0.5 && <div style={{ ...box, top: top + h - 1, height: down + 1, background: e.last }} />}
    </>
  )
}

/** `k`: the scale of the frame; `left`, `top`: where the frame sits; `vw`, `vh`: the visible window. */
export function Backdrop({ s, k, left, top, vw, vh, solid = false }: { s: FNode; k: number; left: number; top: number; vw: number; vh: number; solid?: boolean }) {
  const base = color(s.f) || '#FFFBF3'
  const fw = 390 * k, gl = Math.max(0, left), gr = Math.max(0, vw - left - fw)
  const out: ReactNode[] = []
  if (!solid && (gl > 0.5 || gr > 0.5)) {
    bandsOf(s).forEach((n, i) => {
      const y = top + n.y * k, h = n.h * k
      const fill = n.art ? undefined : color(n.f)
      const up = n.y <= 2 ? y : 0, down = n.y + n.h >= s.h - 2 ? Math.max(0, vh - (y + h)) : 0
      const gutter = (side: 'l' | 'r', room: number) => {
        if (room <= 0.5) return
        const w = room + 3 // tuck 3 px under the frame, so no hairline shows where the two meet
        const box: CSSProperties = { position: 'absolute', top: y, height: h, width: w, left: side === 'l' ? 0 : left + fw - 3, background: fill }
        out.push(n.art
          ? <ArtGutter key={i + side} n={n} side={side} box={box} up={up} down={down} />
          : <div key={i + side} style={{ ...box, top: y - up, height: h + up + down }} />)
      }
      gutter('l', gl); gutter('r', gr)
    })
  }
  return <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: base, pointerEvents: 'none', overflow: 'hidden' }}>{out}</div>
}
