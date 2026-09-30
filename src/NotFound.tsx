import { useState } from 'react'
import { MotionConfig, motion } from 'framer-motion'
import SvgDefs from './components/SvgDefs'
import Starfield from './components/Starfield'
import Cursor from './components/Cursor'
import Astronaut from './components/Astronaut'
import { NAV_LINKS } from './components/Nav'
import { Floaty, LevelChip, ScribbleUnderline } from './components/ui'
import { Comet, Creeper, Planet, Rocket, Sparkle, Star5, Ufo } from './components/Doodles'
import { confettiBurst } from './lib/confetti'

// The path the visitor asked for, decoded so `/my%20page` reads as `/my page`.
function requestedPath() {
  const { pathname } = window.location
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

// A big crayon digit for the "4 🪐 4".
function Digit({ children, className, rotate }: { children: string; className: string; rotate: number }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ opacity: 0, y: 24, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`crayon font-marker text-[7.5rem] font-bold leading-none sm:text-[11rem] ${className}`}
      style={{ textShadow: '4px 6px 0 rgba(16,18,35,.55), 0 0 30px rgba(255,212,59,.18)' }}
    >
      {children}
    </motion.span>
  )
}

// Served by Vercel for any URL with no matching file (dist/404.html).
// Same sky, same crayons — the astronaut has just drifted off the page.
export default function NotFound() {
  const path = requestedPath()
  // a fresh tab opened straight onto a dead link has nowhere to go back to
  const canGoBack = window.history.length > 1
  const [rescued, setRescued] = useState(false)

  const rescue = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    confettiBurst(r.left + r.width / 2, r.top + r.height / 2, 32)
    setRescued(true)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="starnote-bg relative flex min-h-[100svh] flex-col overflow-hidden">
        <SvgDefs />
        <Starfield />
        <Cursor />

        {/* drifting background doodles — the ones nearest the text sit out on phones */}
        <Floaty Icon={Star5} className="left-[7%] top-[20%]" color="#ffd43b" size={30} />
        <Floaty Icon={Ufo} className="right-[8%] top-[16%] hidden sm:block" color="#5ce1e6" size={46} rotate={-10} duration={7} />
        <Floaty Icon={Comet} className="bottom-[14%] left-[9%] hidden sm:block" color="#ff6b6b" size={38} duration={8} />
        <Floaty Icon={Creeper} className="bottom-[20%] right-[10%] hidden sm:block" color="#5fbf5f" size={42} rotate={8} />
        <Floaty Icon={Sparkle} className="left-[22%] top-[8%] hidden md:block" color="#b197fc" size={22} duration={5} />

        <header className="relative z-10 mx-auto w-full max-w-6xl px-5 py-3.5">
          <a href="/" className="inline-flex items-center gap-2" aria-label="Home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-ink" style={{ boxShadow: '2px 2px 0 #101223' }}>
              <Rocket className="h-5 w-5" style={{ color: '#101223' }} />
            </span>
            <span className="font-marker text-2xl font-bold leading-none text-paper">Sonal</span>
          </a>
        </header>

        <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 pb-16 text-center">
          <LevelChip n="404" label="Lost in space" color="#ff6b6b" />

          {/* 4 🪐 4 — the planet is the zero, and its astronaut has come loose.
              The margins even out the gaps: Caveat's 4 and the planet doodle
              both sit off-centre in their boxes. */}
          <div className="mt-10 flex items-center justify-center gap-1 sm:mt-12 sm:gap-3">
            <Digit className="text-gold" rotate={-6}>
              4
            </Digit>
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="relative ml-6 sm:ml-7"
            >
              <Planet
                className="h-28 w-28 text-grape sm:h-44 sm:w-44"
                style={{ filter: 'drop-shadow(4px 6px 0 rgba(16,18,35,.5))' }}
              />
              <motion.button
                type="button"
                onClick={rescue}
                aria-label={rescued ? 'Astronaut rescued' : 'Rescue the lost astronaut'}
                animate={{ x: [0, 8, 0], y: [0, -12, 0], rotate: [-16, 12, -16] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                whileTap={{ scale: 0.9 }}
                className="absolute -right-7 -top-12 sm:-right-10 sm:-top-14"
              >
                <Astronaut className="h-16 w-16 sm:h-24 sm:w-24" />
                <span
                  className={`absolute -left-7 top-[30%] font-pixel text-[8px] ${rescued ? 'text-mint' : 'text-coral'}`}
                  style={{ textShadow: '2px 2px 0 #101223' }}
                >
                  {rescued ? 'THX!' : 'SOS!'}
                </span>
              </motion.button>
            </motion.div>
            <Digit className="-ml-5 text-coral sm:-ml-8" rotate={5}>
              4
            </Digit>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 18, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            className="crayon marker-glow mt-4 font-marker text-5xl font-bold leading-[0.95] text-paper sm:text-6xl"
          >
            This page drifted <span className="text-gold">off the map</span>
            <span className="text-coral">.</span>
          </motion.h1>
          <ScribbleUnderline color="#ff6b6b" width={260} delay={0.5} />

          <p className="mt-5 max-w-lg font-hand text-xl leading-relaxed text-paper/75">
            Nothing's drawn at{' '}
            <span
              className="inline-block max-w-full break-all rounded bg-nebula px-2 py-1 align-middle font-pixel text-[10px] leading-relaxed text-gold"
              style={{ boxShadow: '2px 2px 0 #101223' }}
            >
              {path}
            </span>{' '}
            — maybe it got erased, maybe a comet knocked it out of the sketchbook, or maybe the link has a typo.
          </p>

          {rescued && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 font-hand text-lg text-mint"
            >
              Astronaut rescued! Now let's get you home too. ✨
            </motion.p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/"
              className="doodle-card group inline-flex items-center gap-2 bg-gold px-6 py-3 font-hand text-xl font-bold text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
            >
              <Rocket className="h-6 w-6 transition-transform group-hover:rotate-12" />
              Fly me home
            </a>
            {canGoBack && (
              <button
                type="button"
                onClick={() => window.history.back()}
                className="sketch-link font-hand text-xl text-paper/85 hover:text-gold"
              >
                ← or go back
              </button>
            )}
          </div>

          <nav aria-label="Sections of the site" className="mt-10">
            <p className="font-pixel text-[9px] uppercase tracking-wider text-saber">or warp straight to</p>
            <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={`/${l.href}`} className="sketch-link font-hand text-lg text-paper/80 hover:text-gold">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-12 flex items-center justify-center gap-2 font-pixel text-[10px] text-saber">
            <Star5 className="h-4 w-4" />
            MAY THE CODE BE WITH YOU
            <Star5 className="h-4 w-4" />
          </div>
        </main>
      </div>
    </MotionConfig>
  )
}
