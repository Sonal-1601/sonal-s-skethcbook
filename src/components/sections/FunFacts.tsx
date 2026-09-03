import { useState } from 'react'
import { motion } from 'framer-motion'
import { funFacts, type FunFactPhoto } from '../../data/portfolio'
import { iconMap, type IconName } from '../Doodles'
import { LevelChip, ScribbleUnderline } from '../ui'
import PolaroidLightbox, { type Origin } from '../PolaroidLightbox'

const NOTE_COLORS = ['#ffe8a3', '#c3f0e0', '#cfe4ff', '#ffd6d6', '#e6dcff', '#ffe3c2']
const TILT = [-3, 2, -1.5, 3, -2.5, 1.5]

export default function FunFacts() {
  const [photos, setPhotos] = useState<FunFactPhoto[] | null>(null)
  const [origin, setOrigin] = useState<Origin>(null)

  // Remember where the note was so the polaroid can grow out of it.
  const openPhotos = (p: FunFactPhoto[], el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    setPhotos(p)
  }

  return (
    <section id="fun" className="sketch-page relative z-10 px-5 py-24">
      {/* torn edges */}
      <TornEdge position="top" />
      <TornEdge position="bottom" />

      <div className="mx-auto max-w-5xl">
        <LevelChip n="04" label="Side Quests" color="#e8590c" />
        <h2 className="crayon font-marker text-5xl font-bold leading-none text-ink sm:text-6xl md:text-7xl">
          Stuff I love off the clock
        </h2>
        <ScribbleUnderline color="#e8590c" width={320} />
        <p className="mb-12 mt-4 max-w-xl font-hand text-xl text-[#4a4d63]">
          Life's XP doesn't only come from code. Here's what refills my energy bar.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {funFacts.map((f, i) => {
            const Icon = iconMap[f.icon as IconName]
            const tilt = TILT[i % TILT.length]
            const hasPhoto = Boolean(f.photos?.length)
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 24, rotate: 0 }}
                whileInView={{ opacity: 1, y: 0, rotate: tilt }}
                // keep the slant on hover — lean into it a touch and lift the
                // note off the page, rather than straightening it out
                whileHover={{ rotate: tilt * 1.4, y: -8, scale: 1.03 }}
                whileTap={hasPhoto ? { scale: 0.98, rotate: tilt } : undefined}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
                data-sfx="note"
                data-cursor={hasPhoto ? 'pointer' : undefined}
                role={hasPhoto ? 'button' : undefined}
                tabIndex={hasPhoto ? 0 : undefined}
                aria-label={hasPhoto ? `${f.label} — open photo${f.photos!.length > 1 ? 's' : ''}` : undefined}
                onClick={hasPhoto ? (e) => openPhotos(f.photos!, e.currentTarget) : undefined}
                onKeyDown={
                  hasPhoto
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openPhotos(f.photos!, e.currentTarget)
                        }
                      }
                    : undefined
                }
                className={`group relative p-5 pt-7 ${hasPhoto ? 'cursor-pointer' : ''}`}
                style={{
                  background: NOTE_COLORS[i % NOTE_COLORS.length],
                  boxShadow: '4px 6px 0 rgba(16,18,35,.18)',
                  borderRadius: '4px 14px 6px 12px',
                }}
              >
                {/* washi tape */}
                <span className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-2 bg-white/50" style={{ boxShadow: '0 1px 2px rgba(0,0,0,.1)' }} />

                {/* a photo tucked under the note, hinting there's one to see */}
                {hasPhoto && <PhotoCorner src={f.photos![0].src} stacked={f.photos!.length > 1} />}

                <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-ink text-paper" style={{ boxShadow: '2px 2px 0 rgba(16,18,35,.35)' }}>
                  <Icon className="h-7 w-7" />
                </div>
                <div className="font-marker text-3xl font-bold leading-none text-ink">{f.label}</div>
                <div className="mt-2 font-hand text-lg text-[#3a3d52]">{f.note}</div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <PolaroidLightbox photos={photos} origin={origin} onClose={() => setPhotos(null)} />
    </section>
  )
}

/* ── the corner of a photo peeking out from under a sticky note ── */
//  `stacked` slips a blank card behind it, so a note holding several
//  pictures looks like a little pile rather than a single print.
function PhotoCorner({ src, stacked }: { src: string; stacked: boolean }) {
  return (
    <span aria-hidden className="pointer-events-none absolute -bottom-3 -right-3 h-16 w-16">
      {stacked && (
        <span
          className="absolute inset-0 -rotate-6 bg-white transition-transform duration-300 group-hover:-rotate-12"
          style={{
            border: '2px solid #101223',
            borderRadius: '3px 5px 3px 6px',
            boxShadow: '2px 3px 0 rgba(16,18,35,.25)',
          }}
        />
      )}
      <span
        className="absolute inset-0 rotate-6 overflow-hidden bg-white p-1 transition-transform duration-300 group-hover:rotate-12"
        style={{
          border: '2px solid #101223',
          borderRadius: '3px 5px 3px 6px',
          boxShadow: '2px 3px 0 rgba(16,18,35,.3)',
        }}
      >
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />
      </span>
    </span>
  )
}

function TornEdge({ position }: { position: 'top' | 'bottom' }) {
  const isTop = position === 'top'
  return (
    <svg
      className={`absolute inset-x-0 ${isTop ? 'top-0 -translate-y-[1px]' : 'bottom-0 translate-y-[1px] rotate-180'} h-4 w-full`}
      viewBox="0 0 1200 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 20 L0 8 Q 30 2 60 8 T 120 8 T 180 6 T 240 9 T 300 6 T 360 9 T 420 6 T 480 9 T 540 6 T 600 9 T 660 6 T 720 9 T 780 6 T 840 9 T 900 6 T 960 9 T 1020 6 T 1080 9 T 1140 6 T 1200 8 L1200 20 Z"
        fill="#fbf6e9"
      />
    </svg>
  )
}
