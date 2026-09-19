import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const WORDS = ['Listen', 'Watch', 'Read']

export default function Loader({ onDone }: { onDone: () => void }) {
  const [word, setWord] = useState(0)
  const [count, setCount] = useState(0)
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduce) {
      onDone()
      return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 2700)
      setCount(Math.round(p * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setTimeout(onDone, 400)
    }
    raf = requestAnimationFrame(tick)
    const rot = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 900)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(rot)
    }
  }, [onDone, reduce])

  return (
    <motion.div className="loader" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      <motion.div
        className="loader-label"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        Field notes
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div
          key={WORDS[word]}
          className="loader-word"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {WORDS[word]}
        </motion.div>
      </AnimatePresence>
      <motion.div
        className="loader-count"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {String(count).padStart(3, '0')}
      </motion.div>
      <div className="loader-bar">
        <i style={{ transform: `scaleX(${count / 100})` }} />
      </div>
    </motion.div>
  )
}
