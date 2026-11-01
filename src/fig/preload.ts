/* Loading, so a screen is never shown half drawn.
   Every Figma drawing is a small SVG file. A screen waits (behind a quiet loading state) until the fonts and
   all of its drawings have arrived, and only then mounts, so its one-time animations start on a complete screen.
   After the first screen is up, the rest of the app's drawings are fetched quietly in the background. */
import { useEffect, useState } from 'react'

const BASE = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL
export const artUrl = (id: string) => `${BASE}fig/${id.replace(':', '-')}.svg`
export const fileUrl = (name: string) => `${BASE}fig/${name}.svg`

/** The text of every SVG that has been fetched (SvgMod reads from here at once, with no blank frame). */
export const svgText = new Map<string, string>()
const inflight = new Map<string, Promise<void>>()
const decoded = new Set<string>()

/** Fetch one drawing (and, if asked, let the browser decode it too). Never rejects: a missing file must not hold a screen back. */
export function warm(url: string, decode = false): Promise<void> {
  let p = inflight.get(url)
  if (!p) {
    p = fetch(url).then(r => (r.ok ? r.text() : '')).then(t => { if (t) svgText.set(url, t) }).catch(() => undefined)
    inflight.set(url, p)
  }
  if (!decode || decoded.has(url)) return p
  return p.then(() => { decoded.add(url); const im = new Image(); im.src = url; return im.decode().catch(() => undefined) })
}

// only the faces the first screens really use (asking for more would download fonts nobody needs); the technician app also needs the Hindi faces
const FONT_PROBES = ['800 24px "League Spartan"', '500 16px "M PLUS Rounded 1c"', '500 16px "DM Mono"',
  ...(typeof document !== 'undefined' && /technician/i.test(document.title) ? ['800 36px "Baloo 2"', '500 16px "Noto Sans Devanagari"'] : [])]
let fontsDone = false
/** Resolves when the app's fonts are in (or after 3.5 s, so a slow font host can never hold the app hostage). */
export const fontsReady: Promise<void> = (() => {
  if (typeof document === 'undefined' || !document.fonts) { fontsDone = true; return Promise.resolve() }
  const all = Promise.all(FONT_PROBES.map(f => document.fonts.load(f, 'Aa आ').catch(() => undefined))).then(() => document.fonts.ready).then(() => undefined)
  return Promise.race([all, new Promise<void>(r => setTimeout(r, 3500))]).then(() => { fontsDone = true })
})()

/** Everything in `urls` is already here (so nothing needs to wait). */
export const allWarm = (urls: string[]) => fontsDone && urls.every(u => svgText.has(u))

/** An image address for a drawing: from memory (a blob made from the text already fetched) when we have it, so no second request is made. */
const blobUrls = new Map<string, string>()
export const srcFor = (url: string) => {
  const hit = blobUrls.get(url); if (hit) return hit
  const t = svgText.get(url); if (!t) return url
  const u = URL.createObjectURL(new Blob([t], { type: 'image/svg+xml' })); blobUrls.set(url, u); return u
}

/** One request per screen: the build step packs all of a screen's drawings into public/fig/_b/<frame>.json.
    If that file is not there (the dev server before a build) every drawing is simply fetched on its own. */
const bundles = new Map<string, Promise<void>>()
export function loadBundle(frameId: string): Promise<void> {
  let p = bundles.get(frameId)
  if (!p) {
    p = fetch(`${BASE}fig/_b/${frameId.replace(':', '-')}.json`).then(r => (r.ok ? r.json() : null)).then((o: Record<string, string> | null) => {
      if (o) for (const [name, text] of Object.entries(o)) if (text) svgText.set(`${BASE}fig/${name}.svg`, text)
    }).catch(() => undefined)
    bundles.set(frameId, p)
  }
  return p
}

/** Wait for fonts and the given drawings. `onProgress` gets 0..1. Gives up after `cap` ms. */
export function preloadAll(urls: string[], onProgress?: (v: number) => void, cap = 8000, bundleId?: string): Promise<void> {
  const list = [...new Set(urls)]
  let n = 0; const total = list.length + 2
  const bump = () => { n++; onProgress?.(Math.min(1, n / total)) }
  const work = Promise.all([
    fontsReady.then(bump),
    (bundleId ? loadBundle(bundleId) : Promise.resolve()).then(() => { bump(); return Promise.all(list.map(u => warm(u).then(bump))) }),
  ]).then(() => undefined)
  return Promise.race([work, new Promise<void>(r => setTimeout(r, cap))])
}

/** Is this set of drawings ready? (Starts loading them if not.) Use it where a piece of art appears on demand. */
export function useAssets(urls: string[]): boolean {
  const key = urls.join('|')
  const [ready, setReady] = useState(() => allWarm(urls))
  useEffect(() => {
    if (allWarm(urls)) { setReady(true); return }
    let live = true; setReady(false)
    preloadAll(urls).then(() => live && setReady(true))
    return () => { live = false }
  }, [key])
  return ready
}

/** Quietly fetch the packed drawings of these frames in the background, two at a time. */
export function prefetchBundles(frameIds: string[], extraFiles: string[] = []) {
  const nav = navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }
  if (nav.connection?.saveData || /2g/.test(nav.connection?.effectiveType || '')) return
  let i = 0
  const next = () => { if (i >= frameIds.length) { prefetch(extraFiles); return } const batch = frameIds.slice(i, i + 2); i += 2; Promise.all(batch.map(loadBundle)).then(() => idle(next)) }
  setTimeout(() => idle(next), 900)
}

const idle = (cb: () => void) => ('requestIdleCallback' in window ? (window as unknown as { requestIdleCallback: (f: () => void, o: { timeout: number }) => void }).requestIdleCallback(cb, { timeout: 1500 }) : void setTimeout(cb, 150))
/** Quietly fetch drawings in the background, a few at a time, when the browser is idle. Skipped on "data saver". */
export function prefetch(urls: string[]) {
  const nav = navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }
  if (nav.connection?.saveData || /2g/.test(nav.connection?.effectiveType || '')) return
  const list = [...new Set(urls)].filter(u => !svgText.has(u)); let i = 0
  const next = () => { if (i >= list.length) return; const batch = list.slice(i, i + 6); i += 6; Promise.all(batch.map(u => warm(u))).then(() => idle(next)) }
  setTimeout(() => idle(next), 1200)
}
