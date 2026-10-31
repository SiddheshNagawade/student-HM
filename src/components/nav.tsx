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

/* Full screen. The phone apps fill the whole screen; on a wide screen the content column stays 480 wide but the background still fills everything. */
export function Phone({ children, bg = '#FFF3CF' }: { children: ReactNode; bg?: string }) {
  return (
    <div className="fixed inset-0 flex justify-center" style={{ background: bg }}>
      <div className="relative w-full max-w-[480px] h-full overflow-hidden" style={{ background: bg }}>{children}</div>
    </div>
  )
}
