import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

// ─────────────────────────────────────────────────────────────
//  The film-strip dressing every reel in Frames shares: the dark
//  card with perforations, the title credits and the marker swipes.
// ─────────────────────────────────────────────────────────────

/* ── the reel itself ─────────────────────────────────────────── */

export function Reel({ label, number, children }: { label: string; number: string; children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border-2 border-ink"
      style={{ background: '#0c0e1d', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,.05), 5px 6px 0 rgba(16,18,35,.55)' }}
    >
      <Sprockets />
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 flex items-center justify-between font-pixel text-[7px] uppercase tracking-widest text-paper/40">
          <span>{label}</span>
          <span>{number}</span>
        </div>
        {children}
      </div>
      <Sprockets />
    </div>
  )
}

// film-strip perforations along the top and bottom of the reel
export function Sprockets() {
  return (
    <div className="flex h-6 items-center gap-2.5 overflow-hidden px-3" style={{ background: '#06070e' }} aria-hidden="true">
      {Array.from({ length: 48 }).map((_, i) => (
        <span key={i} className="h-2.5 w-4 shrink-0 rounded-[3px]" style={{ background: 'rgba(251,246,233,.13)' }} />
      ))}
    </div>
  )
}

/* ── opening credits ─────────────────────────────────────────── */

export function Credits({
  badge,
  title,
  year,
  director,
  hook,
  accent,
  glow,
}: {
  badge: string
  title: string
  year: number
  director: string
  hook: string
  accent: string
  /** rgb triplet for the title's halo, e.g. '255,169,77' */
  glow: string
}) {
  return (
    <>
      <div className="flex items-center gap-2 font-pixel text-[8px] uppercase tracking-widest" style={{ color: accent }}>
        <motion.span className="h-2 w-2 rounded-full bg-coral" animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
        {badge}
      </div>
      <h3
        className="crayon mt-3 font-marker text-6xl font-bold leading-[0.9] text-paper sm:text-7xl"
        style={{ textShadow: `0 2px 0 rgba(16,18,35,.25), 0 0 26px rgba(${glow},.28)` }}
      >
        {title}
      </h3>
      <div className="mt-2 font-pixel text-[8px] uppercase tracking-wider text-paper/45">
        {year} · dir. {director}
      </div>
      <p className="mt-1 font-hand text-lg" style={{ color: accent }}>
        — {hook}
      </p>
    </>
  )
}

/* ── marker highlights ───────────────────────────────────────── */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// splits `text` around any of `phrases` and hands each hit to `mark`
export function marked(text: string, phrases: readonly string[], mark: (hit: string, key: number) => ReactNode): ReactNode[] {
  const hits = phrases.filter((p) => text.includes(p))
  if (!hits.length) return [text]
  return text
    .split(new RegExp(`(${hits.map(escapeRe).join('|')})`))
    .map((part, i) => (i % 2 ? mark(part, i) : part))
}

// a highlighter swipe that draws itself in when scrolled into view
export function Swipe({ children, color, delay = 0 }: { children: ReactNode; color: string; delay?: number }) {
  return (
    <motion.mark
      className="bg-transparent text-paper"
      style={{
        backgroundImage: `linear-gradient(transparent 45%, ${color} 45%, ${color} 96%, transparent 96%)`,
        backgroundRepeat: 'no-repeat',
        WebkitBoxDecorationBreak: 'clone',
        boxDecorationBreak: 'clone',
      }}
      initial={{ backgroundSize: '0% 100%' }}
      whileInView={{ backgroundSize: '100% 100%' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
    >
      {children}
    </motion.mark>
  )
}

// the story paragraphs, with every highlight swiped in
export function Story({ paragraphs, highlights, swipe }: { paragraphs: string[]; highlights: readonly string[]; swipe: string }) {
  return (
    <div className="mt-5 space-y-4 font-sans text-[15px] leading-relaxed text-paper/75">
      {paragraphs.map((p, i) => (
        <p key={i}>
          {marked(p, highlights, (hit, k) => (
            <Swipe key={k} color={swipe} delay={0.2 + i * 0.12}>
              {hit}
            </Swipe>
          ))}
        </p>
      ))}
    </div>
  )
}
