import type { CSSProperties, ReactNode } from 'react'

type Props = { className?: string; style?: CSSProperties }

// A shared <svg> shell so every doodle inherits color (currentColor) & size (w-/h- classes).
function D({ className, style, children, viewBox = '0 0 24 24' }: Props & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/* ── Space ─────────────────────────────────────────── */

export const Sparkle = (p: Props) => (
  <D {...p}>
    <path d="M12 2c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10Z" fill="currentColor" stroke="none" />
  </D>
)

export const Star5 = (p: Props) => (
  <D {...p}>
    <path
      d="M12 2.5l2.7 5.9 6.4.7-4.8 4.3 1.3 6.3L12 16.9 6.4 19.7l1.3-6.3L2.9 9.1l6.4-.7L12 2.5Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.4}
    />
  </D>
)

export const Planet = (p: Props) => (
  <D {...p}>
    <circle cx="11" cy="11" r="6" />
    <ellipse cx="11" cy="12" rx="11" ry="3.6" transform="rotate(-24 11 12)" />
    <path d="M8 9.5c1-.6 2.5-.6 3.5 0" />
  </D>
)

export const Rocket = (p: Props) => (
  <D {...p}>
    <path d="M12 3c3 2 4.5 5.5 4.5 9L12 17l-4.5-5C7.5 8.5 9 5 12 3Z" />
    <circle cx="12" cy="9.5" r="1.8" />
    <path d="M7.5 12L5 14l1.5 1M16.5 12L19 14l-1.5 1" />
    <path d="M10 17l2 4 2-4" />
  </D>
)

export const Comet = (p: Props) => (
  <D {...p}>
    <circle cx="16" cy="8" r="4" />
    <path d="M12 12L4 20M13.5 14l-4 4M14.5 11l-6 6" />
  </D>
)

export const Moon = (p: Props) => (
  <D {...p}>
    <path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z" />
    <circle cx="9" cy="9" r="0.6" fill="currentColor" />
    <circle cx="8" cy="14" r="0.6" fill="currentColor" />
  </D>
)

export const Ufo = (p: Props) => (
  <D {...p}>
    <path d="M8 8.5c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" />
    <ellipse cx="12" cy="10.5" rx="8" ry="3.2" />
    <path d="M7 13l-1.5 4M12 13.7v4M17 13l1.5 4" />
  </D>
)

/* ── Games ─────────────────────────────────────────── */

// Minecraft creeper face — blocky.
export const Creeper = (p: Props) => (
  <D {...p} viewBox="0 0 24 24">
    <rect x="4" y="4" width="16" height="16" rx="1.2" />
    <rect x="7.5" y="8" width="3" height="3" fill="currentColor" />
    <rect x="13.5" y="8" width="3" height="3" fill="currentColor" />
    <path d="M10.5 12h3v2.5h-3zM9 14.5h1.5V17H9zM13.5 14.5H15V17h-1.5z" fill="currentColor" stroke="none" />
  </D>
)

// Star Wars lightsaber — long glowing blade + a clearly cylindrical hilt.
export const Lightsaber = (p: Props) => (
  <D {...p}>
    {/* blade */}
    <path d="M18.5 4.5L9.5 13.5" strokeWidth={3.4} />
    {/* emitter guard */}
    <path d="M8.2 12.2l2.6 2.6" strokeWidth={3} />
    {/* hilt */}
    <path d="M8.2 14.6l-3.6 3.6 1.6 1.6 3.6-3.6z" />
    {/* pommel + grip lines */}
    <path d="M4.6 18.2l-1.4 1.4M6 16.4l.9.9M4.6 17.8l.9.9" strokeWidth={1.4} />
  </D>
)

// Hollow Knight vessel mask (nods to "Blue Zombie").
export const Vessel = (p: Props) => (
  <D {...p}>
    <path d="M6 4l2.2 4M18 4l-2.2 4" />
    <path d="M6.5 9c0-2.5 2.4-4 5.5-4s5.5 1.5 5.5 4c0 4-2.5 7.5-5.5 10C9 16.5 6.5 13 6.5 9Z" />
    <path d="M9.4 9.2c.5-.9 1.4-1.2 2.6.1M14.6 9.2c-.5-.9-1.4-1.2-2.6.1" />
  </D>
)

export const Controller = (p: Props) => (
  <D {...p}>
    <path d="M8 8.5h8c2.5 0 4 2 4.4 4.3l.5 3c.3 1.8-1.4 3-2.8 1.8L16 15.5H8l-2.1 2.1C4.5 18.8 2.8 17.6 3.1 15.8l.5-3C4 10.5 5.5 8.5 8 8.5Z" />
    <path d="M6.5 12v2.5M5.3 13.2h2.4" />
    <circle cx="15.5" cy="12" r="0.8" fill="currentColor" />
    <circle cx="17.5" cy="14" r="0.8" fill="currentColor" />
  </D>
)

/* ── Doodle / human ─────────────────────────────────── */

export const Pencil = (p: Props) => (
  <D {...p}>
    <path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z" />
    <path d="M14 7l3 3M4 20l4-1" />
  </D>
)

export const Boot = (p: Props) => (
  <D {...p}>
    <path d="M8 4v7l-1.5 1C5 13 4 14.5 4 16.5V18h16v-2c0-2-1.5-3-3.5-3.2-2-.2-3-.8-3.5-2V4Z" />
    <path d="M5 15h9M8 8h4" />
  </D>
)

export const Globe = (p: Props) => (
  <D {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16M12 4c2.5 2.4 2.5 13.6 0 16M12 4c-2.5 2.4-2.5 13.6 0 16" />
  </D>
)

export const Spark = (p: Props) => (
  <D {...p}>
    <path d="M9 17c-1.5-1-2.5-2.8-2.5-5A5.5 5.5 0 0 1 12 6.5 5.5 5.5 0 0 1 17.5 12c0 2.2-1 4-2.5 5" />
    <path d="M9.5 17h5M10 19.5h4" />
  </D>
)

export const Heart = (p: Props) => (
  <D {...p}>
    <path d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11Z" />
  </D>
)

export const Cloud = (p: Props) => (
  <D {...p}>
    <path d="M7 17h9a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7 11a3 3 0 0 0 0 6Z" />
  </D>
)

/* ── Marks & connectors ─────────────────────────────── */

export const Squiggle = (p: Props) => (
  <D {...p} viewBox="0 0 120 24">
    <path d="M2 14c8-12 16 10 24 0s16-12 24 0 16 10 24 0 16-12 24 0" />
  </D>
)

export const ArrowDoodle = (p: Props) => (
  <D {...p} viewBox="0 0 60 40">
    <path d="M4 8c14 0 30 6 44 22" />
    <path d="M40 30l8 0M48 22l0 8" />
  </D>
)

// Lookup used by the "fun facts" data (icon: string).
export const iconMap = {
  doodle: Pencil,
  boot: Boot,
  globe: Globe,
  controller: Controller,
  planet: Planet,
  spark: Spark,
} as const

export type IconName = keyof typeof iconMap
