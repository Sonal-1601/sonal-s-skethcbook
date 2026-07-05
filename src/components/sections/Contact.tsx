import { motion } from 'framer-motion'
import { socials, profile } from '../../data/portfolio'
import { ScribbleUnderline, LevelChip } from '../ui'
import { Rocket, Heart, Star5 } from '../Doodles'
import type { ComponentType } from 'react'

/* Brand glyphs (kept simple + sketch-friendly) */
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
  </svg>
)
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0z" />
  </svg>
)
const MediumIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
    <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.86 0-3.38-2.88-3.38-6.42s1.52-6.42 3.38-6.42S20.96 8.46 20.96 12zM24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
)
const MailIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

type Social = { href: string; label: string; sub: string; Icon: ComponentType; color: string }
const LINKS: Social[] = [
  { href: socials.github, label: 'GitHub', sub: '@Sonal-1601', Icon: GitHubIcon, color: '#b197fc' },
  { href: socials.linkedin, label: 'LinkedIn', sub: 'pandeysonal', Icon: LinkedInIcon, color: '#74c0fc' },
  { href: socials.medium, label: 'Medium', sub: 'I write sometimes', Icon: MediumIcon, color: '#63e6be' },
  { href: `mailto:${socials.email}`, label: 'Email', sub: 'say hello!', Icon: MailIcon, color: '#ffd43b' },
]

export default function Contact() {
  return (
    <section id="contact" className="relative z-10 overflow-hidden px-5 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <div className="flex justify-center">
          <LevelChip n="05" label="Final Level" color="#ffd43b" />
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: -1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="crayon marker-glow font-marker text-5xl font-bold leading-[0.95] text-paper sm:text-6xl md:text-7xl"
        >
          Let's build something
          <br />
          <span className="text-gold">fun</span> together
          <span className="text-coral">!</span>
        </motion.h2>
        <div className="flex justify-center">
          <ScribbleUnderline color="#ffd43b" width={280} />
        </div>

        <p className="mx-auto mt-5 max-w-lg font-hand text-xl text-paper/75">
          Got a cool idea, a game, a wild side project, or just want to talk space and doodles?
          My inbox is always open. ✨
        </p>

        {/* social buttons */}
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
          {LINKS.map((l, i) => (
            <motion.a
              key={l.label}
              href={l.href}
              target={l.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, rotate: i % 2 ? 2 : -2 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="doodle-card flex flex-col items-center gap-2 bg-nebula px-4 py-5"
              style={{ color: l.color }}
            >
              <l.Icon />
              <span className="font-hand text-xl font-bold text-paper">{l.label}</span>
              <span className="font-hand text-sm text-paper/55">{l.sub}</span>
            </motion.a>
          ))}
        </div>

        {/* star wars sign-off */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 flex items-center justify-center gap-2 font-pixel text-[10px] text-saber"
        >
          <Star5 className="h-4 w-4" />
          MAY THE CODE BE WITH YOU
          <Star5 className="h-4 w-4" />
        </motion.div>
      </div>

      {/* launching rocket */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="pointer-events-none mx-auto mt-6 w-fit"
      >
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-gold">
          <Rocket className="h-14 w-14" />
        </motion.div>
      </motion.div>

      {/* footer */}
      <footer className="mx-auto mt-12 flex max-w-4xl flex-col items-center gap-2 border-t border-paper/10 pt-8 text-center">
        <div className="flex items-center gap-2 font-hand text-lg text-paper/70">
          Designed, coded &amp; doodled by
          <span className="font-bold text-gold">{profile.name}</span>
          <Heart className="h-4 w-4 text-coral" />
        </div>
        <div className="font-hand text-sm text-paper/45">© 2026 · made with React, crayons &amp; a lot of stardust</div>
      </footer>
    </section>
  )
}
