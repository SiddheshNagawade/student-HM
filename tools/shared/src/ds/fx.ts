/* ALIGN feedback kit: every sound is synthesised live with Web Audio (nothing downloaded),
   paired with a matching vibration on phones. One call = sound + haptic.
   fx.tap()  fx.select()  fx.key(i)  fx.swoosh()  fx.paper()  fx.stamp()  fx.success() ... */
import { useSyncExternalStore } from 'react'

type W = Window & { webkitAudioContext?: typeof AudioContext }
let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null

const MUTE_KEY = 'align.muted'
let muted = (() => { try { return localStorage.getItem(MUTE_KEY) === '1' } catch { return false } })()
const subs = new Set<() => void>()

function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as W).webkitAudioContext
    if (!C) return null
    ctx = new C()
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18; comp.ratio.value = 4
    master = ctx.createGain(); master.gain.value = 0.9
    master.connect(comp).connect(ctx.destination)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

type ToneOpts = { f: number; f2?: number; type?: OscillatorType; dur?: number; vol?: number; attack?: number; delay?: number }
function tone({ f, f2, type = 'sine', dur = 0.08, vol = 0.12, attack = 0.004, delay = 0 }: ToneOpts) {
  const c = ac(); if (!c || !master) return
  const t = c.currentTime + delay
  const o = c.createOscillator(), g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t); o.stop(t + dur + 0.03)
}

type NoiseOpts = { dur?: number; vol?: number; filter?: BiquadFilterType; f?: number; f2?: number; q?: number; attack?: number; delay?: number }
function noise({ dur = 0.05, vol = 0.1, filter = 'bandpass', f = 2000, f2, q = 1, attack = 0.003, delay = 0 }: NoiseOpts) {
  const c = ac(); if (!c || !master || !noiseBuf) return
  const t = c.currentTime + delay
  const s = c.createBufferSource(); s.buffer = noiseBuf
  const bq = c.createBiquadFilter(); bq.type = filter; bq.Q.value = q
  bq.frequency.setValueAtTime(f, t)
  if (f2) bq.frequency.exponentialRampToValueAtTime(f2, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(bq).connect(g).connect(master)
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03)
}

const canVibrate = () => typeof navigator !== 'undefined' && 'vibrate' in navigator && matchMedia('(pointer: coarse)').matches
const buzz = (p: number | number[]) => { if (!muted && canVibrate()) try { navigator.vibrate(p) } catch { /* ignore */ } }
const play = (f: () => void) => { if (!muted) try { f() } catch { /* audio blocked */ } }

export const fx = {
  /** generic button press: a soft click */
  tap: () => { play(() => { noise({ dur: 0.018, vol: 0.09, f: 3200, q: 0.8 }); tone({ f: 1350, dur: 0.03, vol: 0.035 }) }); buzz(8) },
  /** option chosen: rising two-note blip */
  select: () => { play(() => { tone({ f: 740, type: 'triangle', dur: 0.05, vol: 0.08 }); tone({ f: 1109, type: 'triangle', dur: 0.07, vol: 0.08, delay: 0.045 }) }); buzz(12) },
  /** option cleared: falling blip */
  deselect: () => { play(() => { tone({ f: 1109, type: 'triangle', dur: 0.045, vol: 0.06 }); tone({ f: 740, type: 'triangle', dur: 0.06, vol: 0.06, delay: 0.04 }) }); buzz(6) },
  /** keypad digit: wooden tick, pitch follows the key so typing has a melody */
  key: (i = 5) => { play(() => { tone({ f: 420 + i * 22, type: 'triangle', dur: 0.06, vol: 0.11 }); noise({ dur: 0.01, vol: 0.04, filter: 'highpass', f: 4000 }) }); buzz(6) },
  /** delete key */
  erase: () => { play(() => tone({ f: 380, f2: 240, type: 'triangle', dur: 0.07, vol: 0.08 })); buzz(6) },
  toggleOn: () => { play(() => { tone({ f: 600, f2: 980, dur: 0.07, vol: 0.08 }); noise({ dur: 0.015, vol: 0.05, f: 2600 }) }); buzz(10) },
  toggleOff: () => { play(() => { tone({ f: 980, f2: 560, dur: 0.07, vol: 0.07 }); noise({ dur: 0.015, vol: 0.05, f: 2000 }) }); buzz(8) },
  /** small page turn for forward navigation */
  page: () => play(() => noise({ dur: 0.13, vol: 0.05, f: 900, f2: 2200, q: 0.7, attack: 0.03 })),
  /** paper plane flying past */
  swoosh: () => { play(() => { noise({ dur: 0.42, vol: 0.2, f: 320, f2: 2800, q: 0.9, attack: 0.14 }); tone({ f: 300, f2: 620, dur: 0.35, vol: 0.025, attack: 0.1 }) }); buzz([6, 30, 10]) },
  /** sticky note slapped on: crinkle + thump */
  paper: () => { play(() => { noise({ dur: 0.08, vol: 0.16, f: 1900, q: 0.6 }); noise({ dur: 0.05, vol: 0.09, f: 3200, q: 0.9, delay: 0.06 }); tone({ f: 180, f2: 110, dur: 0.07, vol: 0.09, delay: 0.02 }) }); buzz(14) },
  /** rubber stamp slam */
  stamp: () => { play(() => { tone({ f: 150, f2: 50, dur: 0.22, vol: 0.32 }); noise({ dur: 0.05, vol: 0.22, filter: 'lowpass', f: 900 }) }); buzz([30, 20, 12]) },
  /** wave rising (technician transitions) */
  wave: () => play(() => noise({ dur: 0.36, vol: 0.09, filter: 'lowpass', f: 500, f2: 1600, q: 0.5, attack: 0.12 })),
  /** job finished: marimba arpeggio */
  success: () => { play(() => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.16, vol: 0.09, delay: i * 0.07 }))); buzz([12, 40, 20]) },
  /** gentle "no" */
  error: () => { play(() => { tone({ f: 233, type: 'square', dur: 0.09, vol: 0.035 }); tone({ f: 174, type: 'square', dur: 0.15, vol: 0.035, delay: 0.1 }) }); buzz([30, 40, 30]) },
  /** incoming alert: two-tone bell */
  notify: () => { play(() => { tone({ f: 1318.5, dur: 0.45, vol: 0.07 }); tone({ f: 1975.5, dur: 0.3, vol: 0.025 }); tone({ f: 1568, dur: 0.5, vol: 0.06, delay: 0.13 }) }); buzz([10, 60, 10]) },
  /** bubble pop for chips, badges, small reveals */
  pop: () => { play(() => tone({ f: 420, f2: 980, dur: 0.06, vol: 0.08 })); buzz(6) },
  /** each step on a timeline lighting up */
  tick: (i = 0) => play(() => tone({ f: 980 + i * 90, type: 'sine', dur: 0.05, vol: 0.05 })),
  /** checklist item ticked */
  check: () => { play(() => { tone({ f: 880, type: 'triangle', dur: 0.05, vol: 0.07 }); tone({ f: 1320, type: 'triangle', dur: 0.09, vol: 0.07, delay: 0.05 }) }); buzz(10) },
  /** camera shutter */
  shutter: () => { play(() => { noise({ dur: 0.03, vol: 0.2, filter: 'highpass', f: 2500 }); noise({ dur: 0.05, vol: 0.14, filter: 'bandpass', f: 1200, delay: 0.06 }) }); buzz(20) },
  /** star in a rating */
  star: (i = 0) => { play(() => tone({ f: 660 * Math.pow(1.12246, i * 2), type: 'triangle', dur: 0.1, vol: 0.07 })); buzz(8) },
}
export type FxName = keyof typeof fx

export function setMuted(m: boolean) {
  muted = m
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0') } catch { /* private mode */ }
  subs.forEach(s => s())
  if (!m) fx.pop()
}
export const isMuted = () => muted
export function useMuted() {
  return useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb) }, () => muted)
}
/** Browsers only allow audio after a user gesture: warm the context on first touch. */
if (typeof window !== 'undefined') {
  const warm = () => { ac(); removeEventListener('pointerdown', warm) }
  addEventListener('pointerdown', warm)
}
