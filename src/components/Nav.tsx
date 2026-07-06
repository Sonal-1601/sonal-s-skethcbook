import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import { Rocket } from './Doodles'

const LINKS = [
  { href: '#about', label: 'Story' },
  { href: '#skills', label: 'Inventory' },
  { href: '#commits', label: 'Commits' },
  { href: '#projects', label: 'Quests' },
  { href: '#fun', label: 'Side Quests' },
  { href: '#contact', label: 'Say Hi' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-space/80 backdrop-blur-md shadow-[0_2px_0_rgba(177,151,252,0.25)]' : ''
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <a href="#hero" className="group flex items-center gap-2" aria-label="Home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-ink" style={{ boxShadow: '2px 2px 0 #101223' }}>
              <Rocket className="h-5 w-5" style={{ color: '#101223' }} />
            </span>
            <span className="font-marker text-2xl font-bold leading-none text-paper">Sonal</span>
          </a>

          <div className="hidden items-center gap-6 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="sketch-link font-hand text-lg text-paper/85 transition-colors hover:text-gold"
              >
                {l.label}
              </a>
            ))}
          </div>

          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-lg border-2 border-paper/70 text-paper md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-5 bg-current transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-5 bg-current transition-opacity ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 bg-current transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
            </div>
          </button>
        </nav>

        {/* scroll progress "ink" bar */}
        <motion.div className="h-1 origin-left bg-gradient-to-r from-grape via-saber to-gold" style={{ scaleX: progress }} />

        {/* mobile menu */}
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-paper/10 bg-space/95 px-5 py-4 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col gap-3">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-hand text-2xl text-paper/90 hover:text-gold"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </header>
    </>
  )
}
