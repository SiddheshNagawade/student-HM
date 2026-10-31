import { ReactNode, useCallback, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/* One shared screen transition: slide forward/back on mobile, fade on desktop. Respects reduced motion. */
export function useStack<T extends string>(initial: T) {
  const [stack, setStack] = useState<T[]>([initial])
  const [dir, setDir] = useState(1)
  const go = useCallback((s: T) => { setDir(1); setStack(st => [...st, s]) }, [])
  const replace = useCallback((s: T) => { setDir(1); setStack(st => [...st.slice(0, -1), s]) }, [])
  const back = useCallback(() => { setDir(-1); setStack(st => (st.length > 1 ? st.slice(0, -1) : st)) }, [])
  const reset = useCallback((s: T) => { setDir(-1); setStack([s]) }, [])
  return { screen: stack[stack.length - 1], go, replace, back, reset, dir, depth: stack.length }
}

export function Transition({ id, dir, mode, children }: { id: string; dir: number; mode: 'slide' | 'fade'; children: ReactNode }) {
  const reduce = useReducedMotion()
  const slide = mode === 'slide' && !reduce
  return (
    <AnimatePresence mode="popLayout" custom={dir} initial={false}>
      <motion.div key={id} className="absolute inset-0" custom={dir}
        variants={{
          enter: (d: number) => (slide ? { x: `${d * 28}%`, opacity: 0 } : { opacity: 0 }),
          center: { x: 0, opacity: 1 },
          exit: (d: number) => (slide ? { x: `${d * -28}%`, opacity: 0 } : { opacity: 0 }),
        }}
        initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: 'easeOut' }}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/* Phone frame: full screen on a phone, 390x844 card on a larger screen */
export function Phone({ children, bg = '#FFF3CF' }: { children: ReactNode; bg?: string }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center sm:bg-sand sm:p-6">
      <div className="relative w-full sm:w-[390px] h-[100dvh] sm:h-[844px] sm:max-h-[calc(100vh-48px)] overflow-hidden sm:rounded-[36px] sm:border-[2.5px] sm:border-navy sm:shadow-[0_6px_0_#00224E]" style={{ background: bg }}>
        {children}
      </div>
    </div>
  )
}
