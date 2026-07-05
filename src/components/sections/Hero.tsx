import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { profile } from '../../data/portfolio'
import { Planet, Star5, Sparkle, Creeper, Lightsaber, Vessel, Comet, Rocket } from '../Doodles'
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

// A doodle astronaut (our hero!) waving from a little planet.
function Astronaut({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={className} fill="none" aria-hidden="true">
      <g stroke="#101223" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {/* backpack + body */}
        <path d="M74 150c-4-16-3-34 6-46 5-7 14-11 20-11s15 4 20 11c9 12 10 30 6 46" fill="#fbf6e9" />
        {/* helmet */}
        <circle cx="100" cy="78" r="34" fill="#fbf6e9" />
        <path d="M78 74c2-13 12-21 22-21" stroke="#5ce1e6" strokeWidth="4" />
        {/* visor */}
        <ellipse cx="100" cy="80" rx="22" ry="20" fill="#101223" />
        <circle cx="92" cy="74" r="4" fill="#5ce1e6" stroke="none" />
        <circle cx="108" cy="84" r="2.5" fill="#ffd43b" stroke="none" />
        {/* waving arm */}
        <path d="M124 120c10-4 18-14 20-26" fill="#fbf6e9" />
        <circle cx="146" cy="90" r="6" fill="#ff6b6b" />
        {/* other arm */}
        <path d="M76 120c-8-2-14-8-16-16" fill="#fbf6e9" />
        <circle cx="58" cy="102" r="6" fill="#ff6b6b" />
        {/* legs */}
        <path d="M88 150l-4 26M112 150l4 26" />
        <circle cx="83" cy="180" r="6" fill="#b197fc" />
        <circle cx="117" cy="180" r="6" fill="#b197fc" />
        {/* chest badge */}
        <circle cx="100" cy="128" r="6" fill="#ffd43b" />
      </g>
    </svg>
  )
}

export default function Hero() {
  const roleText = useTypewriter(profile.roles)
  const sceneRef = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

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
    window.setTimeout(() => setStarted(false), 1300)
    window.setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 720)
  }

  // Mouse parallax for the floating scene
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20 })
  const sy = useSpring(my, { stiffness: 60, damping: 20 })
  const t1x = useTransform(sx, (v) => v * 26)
  const t1y = useTransform(sy, (v) => v * 26)
  const t2x = useTransform(sx, (v) => v * -18)
  const t2y = useTransform(sy, (v) => v * -18)
  const t3x = useTransform(sx, (v) => v * 40)
  const t3y = useTransform(sy, (v) => v * 40)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [mx, my])

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

        {/* ── Right: floating doodle scene ── */}
        <div ref={sceneRef} className="relative mx-auto aspect-square w-full max-w-[420px]">
          {/* dashed orbit ring */}
          <div className="absolute inset-6 rounded-full border-2 border-dashed border-paper/20" />
          <div className="absolute inset-16 rounded-full border-2 border-dashed border-saber/25" />

          {/* central planet + astronaut */}
          <motion.div
            style={{ x: t2x, y: t2y }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative">
              <Planet className="h-40 w-40 text-grape sm:h-48 sm:w-48" style={{ filter: 'drop-shadow(4px 6px 0 rgba(16,18,35,.5))' }} />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-6 -top-14"
              >
                <Astronaut className="h-32 w-32" />
              </motion.div>
            </div>
          </motion.div>

          {/* orbiting doodles with parallax layers */}
          <motion.div style={{ x: t1x, y: t1y }} className="absolute right-2 top-2 text-gold animate-floaty">
            <Star5 className="h-10 w-10" />
          </motion.div>
          <motion.div style={{ x: t3x, y: t3y }} className="absolute left-0 top-10 text-saber">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}>
              <Sparkle className="h-8 w-8" />
            </motion.div>
          </motion.div>
          <motion.div style={{ x: t1x, y: t1y }} className="absolute -left-2 bottom-10 text-creeper">
            <Creeper className="h-11 w-11" style={{ filter: 'drop-shadow(3px 3px 0 rgba(16,18,35,.5))' }} />
          </motion.div>
          <motion.div style={{ x: t3x, y: t3y }} className="absolute bottom-4 right-6 text-saber">
            <Lightsaber className="h-12 w-12" />
          </motion.div>
          <motion.div style={{ x: t2x, y: t2y }} className="absolute -right-3 top-1/2 text-paper">
            <Vessel className="h-10 w-10" />
          </motion.div>
          <motion.div style={{ x: t1x, y: t1y }} className="absolute left-8 top-0 text-coral">
            <Comet className="h-9 w-9" />
          </motion.div>
        </div>
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
