import { motion } from 'framer-motion'
import type { ComponentType, ReactNode } from 'react'
import type { CSSProperties } from 'react'

/* ── Animated hand-drawn underline ──────────────────── */
// Draws itself in when scrolled into view, like a marker stroke.
export function ScribbleUnderline({
  color = '#ffd43b',
  className = '',
  width = 240,
  delay = 0.15,
}: {
  color?: string
  className?: string
  width?: number
  delay?: number
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 300 24"
      width={width}
      height={width * 0.08}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <motion.path
        d="M4 15c40-9 90-9 140-6s110 2 152-6"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        style={{ filter: 'url(#crayon-soft)' }}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: 'easeInOut', delay }}
      />
    </svg>
  )
}

/* ── Pixel "LEVEL" kicker chip (game HUD feel) ──────── */
export function LevelChip({ n, label, color = '#5ce1e6' }: { n: string; label: string; color?: string }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2">
      <span
        className="font-pixel text-[9px] leading-none text-ink"
        style={{ background: color, padding: '6px 8px', borderRadius: 4, boxShadow: '2px 2px 0 #101223' }}
      >
        {n}
      </span>
      <span className="font-pixel text-[9px] uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
    </div>
  )
}

/* ── Big marker section heading + scribble ──────────── */
export function SectionHeading({
  kicker,
  kickerLabel,
  title,
  color = '#ffd43b',
  dark = false,
  underlineWidth = 260,
}: {
  kicker: string
  kickerLabel: string
  title: ReactNode
  color?: string
  dark?: boolean
  underlineWidth?: number
}) {
  return (
    <div className="mb-8">
      <LevelChip n={kicker} label={kickerLabel} color={color} />
      <motion.h2
        initial={{ opacity: 0, y: 18, rotate: -1.5 }}
        whileInView={{ opacity: 1, y: 0, rotate: -1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`crayon font-marker text-5xl font-bold leading-[0.95] sm:text-6xl md:text-7xl ${
          dark ? 'text-ink' : 'text-paper marker-glow'
        }`}
      >
        {title}
      </motion.h2>
      <ScribbleUnderline color={color} width={underlineWidth} />
    </div>
  )
}

/* ── Reveal-on-scroll wrapper ───────────────────────── */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = '',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

/* ── A floating, gently-bobbing decorative doodle ───── */
export function Floaty({
  Icon,
  className = '',
  rotate = 0,
  duration = 6,
  color,
  size = 40,
  style,
}: {
  Icon: ComponentType<{ className?: string; style?: CSSProperties }>
  className?: string
  rotate?: number
  duration?: number
  color?: string
  size?: number
  style?: CSSProperties
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      style={{ color, ...style }}
      animate={{ y: [0, -14, 0], rotate: [rotate - 4, rotate + 4, rotate - 4] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Icon style={{ width: size, height: size }} />
    </motion.div>
  )
}
