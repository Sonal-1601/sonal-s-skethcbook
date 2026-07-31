// ─────────────────────────────────────────────────────────────
//  A stack of polaroids you can flip through. The white frame stays
//  put — like a real photo frame — and only the picture inside it
//  swaps, so nothing in the layout jumps around.
//
//  Slides come from `aboutSlides` in src/data/portfolio.ts. A slide
//  with `img` shows that photo; without one we draw a doodle scene.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AboutDoodle, AboutSlide } from '../data/portfolio'
import {
  Planet, Star5, Pencil, Rocket, Moon, Comet, Controller, Creeper,
  Lightsaber, Boot, Cloud, Spark, Sparkle, Heart, Ufo, Vessel, Globe,
} from './Doodles'

const AUTOPLAY_MS = 4200

const DOODLES: Record<AboutDoodle, (p: { className?: string; style?: CSSProperties }) => JSX.Element> = {
  planet: Planet, star: Star5, pencil: Pencil, rocket: Rocket, moon: Moon,
  comet: Comet, controller: Controller, creeper: Creeper, lightsaber: Lightsaber,
  boot: Boot, cloud: Cloud, spark: Spark, sparkle: Sparkle, heart: Heart,
  ufo: Ufo, vessel: Vessel, globe: Globe,
}

// four corner slots, mirroring the original static polaroid's composition
const SLOTS = [
  { cls: 'absolute -right-6 -top-4 h-24 w-24', color: '#b197fc' },
  { cls: 'absolute left-4 top-6 h-6 w-6', color: '#ffd43b' },
  { cls: 'absolute bottom-4 right-6 h-9 w-9', color: '#ffa94d' },
  { cls: 'absolute bottom-6 left-5 h-7 w-7', color: '#5ce1e6' },
]

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const onChange = () => setReduce(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduce
}

const sceneVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 46, rotate: d * 5, scale: 0.94 }),
  center: { opacity: 1, x: 0, rotate: 0, scale: 1 },
  exit: (d: number) => ({ opacity: 0, x: d * -46, rotate: d * -5, scale: 0.94 }),
}

export default function PolaroidStack({ slides }: { slides: AboutSlide[] }) {
  const [[index, dir], setState] = useState<[number, number]>([0, 1])
  const [paused, setPaused] = useState(false)
  const draggedRef = useRef(false)
  const reduce = usePrefersReducedMotion()
  const count = slides.length

  const go = useCallback((delta: number) => {
    setState(([i]) => [(i + delta + count) % count, delta >= 0 ? 1 : -1])
  }, [count])

  const jump = useCallback((target: number) => {
    setState(([i]) => [target, target >= i ? 1 : -1])
  }, [])

  // auto-advance; the timeout is keyed on `index` so it restarts cleanly
  useEffect(() => {
    if (paused || reduce || count < 2) return
    const t = window.setTimeout(() => go(1), AUTOPLAY_MS)
    return () => clearTimeout(t)
  }, [index, paused, reduce, count, go])

  const slide = slides[index]

  return (
    <div
      className="relative mx-auto w-full max-w-xs"
      role="group"
      aria-roledescription="carousel"
      aria-label="Photos and doodles about Sonal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
      }}
    >
      {/* the rest of the pile, peeking out behind */}
      <div aria-hidden className="doodle-card-light absolute inset-0 -rotate-6 bg-white/60" />
      <div aria-hidden className="doodle-card-light absolute inset-0 rotate-3 bg-white/80" />

      {/* the live polaroid — this frame never moves */}
      <div className="doodle-card-light relative bg-white p-4">
        {/* washi tape */}
        <span
          aria-hidden
          className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 bg-gold/60"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,.12)' }}
        />

        {/* the picture */}
        <motion.div
          className="relative aspect-[4/5] cursor-pointer overflow-hidden rounded-lg bg-gradient-to-b from-nebula to-space"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.14}
          onDragStart={() => { draggedRef.current = true }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 60) go(info.offset.x < 0 ? 1 : -1)
            // let the click that follows the drag fall through harmlessly
            window.setTimeout(() => { draggedRef.current = false }, 0)
          }}
          onClick={() => { if (!draggedRef.current) go(1) }}
          data-cursor="pointer"
          data-sfx="click"
        >
          {/* default mode: both frames stay mounted and overlap, which is the
              crossfade we want — the children are already absolutely placed */}
          <AnimatePresence custom={dir} initial={false}>
            <motion.div
              key={slide.id}
              custom={dir}
              variants={sceneVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduce ? 0 : 0.42, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              {slide.img ? (
                <img
                  src={slide.img}
                  alt={slide.alt ?? ''}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: slide.focus ?? 'center' }}
                  draggable={false}
                />
              ) : (
                <Scene slide={slide} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* caption — fixed height so swapping text never nudges the layout */}
        <div className="relative mt-3 h-8">
          <AnimatePresence initial={false}>
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: reduce ? 0 : 0.3 }}
              className="absolute inset-0 grid place-items-center px-1 text-center font-marker text-2xl leading-tight text-ink"
            >
              {slide.caption}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* prev · dots · next */}
        <div className="mt-1 flex items-center justify-center gap-3">
          <ArrowButton dir="prev" onClick={() => go(-1)} />
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => jump(i)}
                data-cursor="pointer"
                aria-label={`Show ${s.caption.replace(/—/g, '').trim()}`}
                aria-current={i === index}
                className="h-2.5 w-2.5 rounded-[2px] border border-ink/50 transition-transform hover:scale-125"
                style={{ background: i === index ? slide.accent : 'transparent' }}
              />
            ))}
          </div>
          <ArrowButton dir="next" onClick={() => go(1)} />
        </div>
      </div>
    </div>
  )
}

/* ── the drawn scene shown when a slide has no photo ─────────── */

function Scene({ slide }: { slide: AboutSlide }) {
  return (
    <div className="relative h-full w-full">
      {slide.doodles.slice(0, SLOTS.length).map((name, i) => {
        const Doodle = DOODLES[name]
        const slot = SLOTS[i]
        return <Doodle key={name + i} className={`${slot.cls} pointer-events-none`} style={{ color: slot.color }} />
      })}
      {slide.lines && (
        <div className="grid h-full w-full place-items-center px-4">
          <div className="text-center">
            <div className="font-marker text-3xl text-paper">{slide.lines[0]}</div>
            <div className="font-marker text-4xl font-bold" style={{ color: slide.accent }}>{slide.lines[1]}</div>
            <div className="mt-1 font-hand text-lg text-saber">{slide.lines[2]}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function ArrowButton({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor="pointer"
      data-sfx="click"
      aria-label={dir === 'prev' ? 'Previous photo' : 'Next photo'}
      className="grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-parch font-pixel text-[8px] text-ink transition-transform hover:-translate-y-0.5"
    >
      {dir === 'prev' ? '‹' : '›'}
    </button>
  )
}
