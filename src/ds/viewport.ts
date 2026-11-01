/* What the person can really see right now: the window, rotated or resized, with the on-screen keyboard taken into account.
   `h` is the visible height (shorter while the keyboard is up), `top` is how far the visible part has been pushed down
   (iOS slides the page when the keyboard opens), `kb` says "a text field has the keyboard open". */
import { useEffect, useState } from 'react'

export type VP = { w: number; h: number; top: number; kb: boolean }
const textFocused = () => {
  const a = document.activeElement as HTMLInputElement | null
  if (!a) return false
  if (a.tagName === 'TEXTAREA' || a.isContentEditable) return true
  return a.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'range', 'file', 'color'].includes(a.type)
}

export function useViewport(): VP {
  const read = (base: number): VP => {
    const v = window.visualViewport
    const w = Math.round(v?.width ?? innerWidth), h = Math.round(v?.height ?? innerHeight)
    return { w, h, top: Math.round(v?.offsetTop ?? 0), kb: textFocused() && h < base - 90 }
  }
  const [vp, setVp] = useState<VP>(() => read(innerHeight))
  useEffect(() => {
    let base = innerHeight, lastW = innerWidth
    const update = () => {
      if (Math.abs(innerWidth - lastW) > 60) { base = 0; lastW = innerWidth } // rotated or resized: forget the old full height
      if (!textFocused()) base = Math.max(base, Math.round(window.visualViewport?.height ?? innerHeight), innerHeight)
      setVp(read(base))
    }
    const v = window.visualViewport
    addEventListener('resize', update); addEventListener('orientationchange', update)
    addEventListener('focusin', update); addEventListener('focusout', () => setTimeout(update, 120))
    v?.addEventListener('resize', update); v?.addEventListener('scroll', update)
    update()
    return () => {
      removeEventListener('resize', update); removeEventListener('orientationchange', update); removeEventListener('focusin', update)
      v?.removeEventListener('resize', update); v?.removeEventListener('scroll', update)
    }
  }, [])
  return vp
}

/** When a text field gets the keyboard, scroll it to the middle of what is still visible. */
export function useKeepFocusVisible() {
  useEffect(() => {
    const f = (e: FocusEvent) => { const el = e.target as HTMLElement | null; if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) setTimeout(() => el.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: 'smooth' }), 380) }
    addEventListener('focusin', f); return () => removeEventListener('focusin', f)
  }, [])
}
