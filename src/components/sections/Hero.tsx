import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { profile } from '../../data/portfolio'
import { Rocket } from '../Doodles'
import OrbitScene from '../OrbitScene'
import { sound } from '../../audio/engine'
import { confettiBurst } from '../../lib/confetti'

/* Tiny typewriter for the rotating roles */
function useTypewriter(words: string[], speed = 90, pause = 1400) {
  const [text, setText] = useState('')
  const [i, setI] = useState(0)
  const [del, setDel] = useState(false)

  useEffect(() => {
    const word = words[i % words.length]
    let timeout: ReturnType<typeof setTimeout>
    if (!del && text === word) {
      timeout = setTimeout(() => setDel(true), pause)
    } else if (del && text === '') {
      setDel(false)
      setI((v) => v + 1)
    } else {
      timeout = setTimeout(
        () => setText(word.slice(0, del ? text.length - 1 : text.length + 1)),
        del ? speed / 2 : speed,
      )
    }
    return () => clearTimeout(timeout)
  }, [text, del, i, words, speed, pause])

  return text
}

export default function Hero() {
  const roleText = useTypewriter(profile.roles)
  const [started, setStarted] = useState(false)
  const [kicks, setKicks] = useState(0)

  // "Press Start" = boot the whole experience: turn on sound + music, play the
  // arcade jingle, confetti, flash GAME START, then dive into the story.
  const startGame = (e: React.MouseEvent<HTMLButtonElement>) => {
    sound.unlock()
    sound.setMuted(false)
    sound.startMusic()
    sound.startJingle()
    window.dispatchEvent(new CustomEvent('sonal:soundchange', { detail: { sfx: true, music: true } }))
    const r = e.currentTarget.getBoundingClientRect()
    confettiBurst(r.left + r.width / 2, r.top + r.height / 2, 42)
    setStarted(true)
    setKicks((k) => k + 1)
    window.setTimeout(() => setStarted(false), 1300)
    window.setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 720)
  }

  return (
    <section id="hero" className="relative flex min-h-[100svh] items-center overflow-hidden px-5 pt-24 pb-16">
      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
        {/* ── Left: intro ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-3"
          >
            <motion.button
              onClick={startGame}
              whileTap={{ scale: 0.92 }}
              animate={started ? { scale: 1 } : { scale: [1, 1.06, 1] }}
              transition={started ? { duration: 0.2 } : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              aria-label="Press start to begin the experience with sound and music"
              className="font-pixel text-[10px] text-ink"
              style={{ background: '#63e6be', padding: '9px 12px', borderRadius: 5, boxShadow: '2px 2px 0 #101223' }}
            >
              ▶ PRESS START
            </motion.button>
            <span className="font-hand text-lg text-mint">{started ? 'game on! ♪' : '◄ turns on sound + story'}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -1.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="crayon marker-glow font-marker text-6xl font-bold leading-[0.9] text-paper sm:text-7xl lg:text-8xl"
          >
            Hi, I'm{' '}
            <span className="text-gold">Sonal</span>
            <span className="text-coral">.</span>
          </motion.h1>

          <div className="mt-4 flex items-center gap-2 font-hand text-2xl text-saber sm:text-3xl">
            <span>a</span>
            <span className="font-bold text-paper">
              {roleText}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-0.5 inline-block w-[3px] translate-y-1 bg-gold"
                style={{ height: '1.1em' }}
              />
            </span>
          </div>

          <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-paper/75 sm:text-lg">
            {profile.tagline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#projects"
              className="doodle-card group inline-flex items-center gap-2 bg-gold px-6 py-3 font-hand text-xl font-bold text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <Rocket className="h-6 w-6 transition-transform group-hover:rotate-12" />
              See my quests
            </a>
            <a
              href="#about"
              className="sketch-link font-hand text-xl text-paper/85 hover:text-gold"
            >
              or read my story →
            </a>
          </div>
        </div>

        {/* ── Right: the orbit you can grab ── */}
        <OrbitScene kick={kicks} />
      </div>

      {/* GAME START flash */}
      <AnimatePresence>
        {started && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[90] grid place-items-center"
          >
            <motion.div
              initial={{ scale: 0.4, rotate: -8, y: 12 }}
              animate={{ scale: [0.4, 1.12, 1], rotate: [-8, 3, -2] }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="crayon font-pixel text-2xl text-gold sm:text-4xl"
              style={{ textShadow: '3px 3px 0 #101223, 0 0 26px rgba(255,212,59,.55)' }}
            >
              GAME&nbsp;START!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* scroll hint */}
      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center"
      >
        <span className="font-hand text-sm text-paper/60">scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mt-1 text-gold"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v14M6 13l6 6 6-6" />
          </svg>
        </motion.div>
      </motion.a>
    </section>
  )
}
