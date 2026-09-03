// ─────────────────────────────────────────────────────────────
//  A stack of polaroids, pulled off the wall and held up close.
//
//  Opened from a sticky note in the "Side quests" section. The first
//  photo is the one on top; tapping it flicks that card to the back
//  of the pile and brings the next one forward, so a note can hold
//  several pictures without needing arrows or a filmstrip.
//
//  Each photo develops the way a real polaroid does — it arrives
//  washed out and pale, then the picture settles in — so the wait for
//  a large image reads as part of the bit rather than as a blank frame.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunFactPhoto } from '../data/portfolio'

/** Where the stack flies from, so it grows out of the note you clicked. */
export type Origin = { x: number; y: number } | null

const DEFAULT_ASPECT = '3 / 2'
/** How long the outgoing card stays above the pile while it arcs away. */
const FLICK_MS = 480

/** '3 / 4' -> 0.75. Falls back to landscape if the value is unparseable. */
function ratioOf(aspect: string): number {
  const [w, h] = aspect.split('/').map((n) => Number(n.trim()))
  return w > 0 && h > 0 ? w / h : 1.5
}

/**
 * Width of one polaroid, chosen so its photo never runs past the viewport.
 *
 * The frame's border and padding add 37px around the picture, so capping the
 * card at `58vh * ratio + 37px` caps the picture itself at 58vh — which keeps
 * even a 9:16 phone shot fully on screen without squashing it.
 */
function cardWidth(aspect: string): string {
  const r = ratioOf(aspect)
  const maxPx = r < 1 ? 320 : 512
  return `min(${maxPx}px, calc(58vh * ${r} + 37px), calc(100vw - 48px))`
}

/** Resting position of a card by its depth in the pile. */
function slotPose(slot: number) {
  if (slot === 0) return { x: 0, y: 0, rotate: -2, scale: 1 }
  if (slot === 1) return { x: 12, y: 14, rotate: 5, scale: 0.95 }
  return { x: -10, y: 26, rotate: -7, scale: 0.9 }
}

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

export default function PolaroidLightbox({
  photos,
  origin,
  onClose,
}: {
  photos: FunFactPhoto[] | null
  origin: Origin
  onClose: () => void
}) {
  const reduce = usePrefersReducedMotion()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [top, setTop] = useState(0)
  const [leaving, setLeaving] = useState<number | null>(null)

  const open = Boolean(photos && photos.length > 0)
  const count = photos?.length ?? 0

  const advance = useCallback(() => {
    if (count < 2) return
    setLeaving(top)
    setTop((t) => (t + 1) % count)
  }, [count, top])

  // The flicked card rides above the pile until it has landed at the back.
  useEffect(() => {
    if (leaving === null) return
    const t = window.setTimeout(() => setLeaving(null), reduce ? 0 : FLICK_MS)
    return () => clearTimeout(t)
  }, [leaving, reduce])

  // Esc to close, arrows to flip, and don't let the page scroll behind.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => closeRef.current?.focus(), 60)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      clearTimeout(t)
    }
  }, [open, onClose, advance])

  // Every fresh open starts from the tagged photo.
  useEffect(() => {
    if (!open) return
    setTop(0)
    setLeaving(null)
  }, [open, photos])

  const from = origin
    ? { x: origin.x - window.innerWidth / 2, y: origin.y - window.innerHeight / 2 }
    : { x: 0, y: 0 }

  return (
    <AnimatePresence>
      {open && photos && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.22 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={photos[top]?.caption ?? 'Photo'}
        >
          {/* ink wash over the page */}
          <div className="absolute inset-0 bg-space/80 backdrop-blur-[3px]" />

          <motion.div
            className="relative"
            initial={
              reduce
                ? { opacity: 0, scale: 1, x: 0, y: 0 }
                : { opacity: 0, scale: 0.35, x: from.x, y: from.y }
            }
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, x: from.x, y: from.y }}
            transition={
              reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              data-cursor="pointer"
              data-sfx="click"
              aria-label="Close photo"
              className="absolute -right-3 -top-3 z-[100] grid h-9 w-9 place-items-center rounded-full border-[2.5px] border-ink bg-parch font-pixel text-[10px] text-ink transition-transform hover:-translate-y-0.5 hover:rotate-6"
              style={{ boxShadow: '2px 3px 0 rgba(16,18,35,.5)' }}
            >
              ✕
            </button>

            {/* Overlapping grid: every card sits in the same cell, so the pile
                sizes itself to the largest card with no manual measuring. */}
            <div className="grid">
              {photos.map((photo, i) => {
                const slot = (i - top + count) % count
                const isLeaving = leaving === i
                const pose = slotPose(slot)
                return (
                  <PolaroidCard
                    key={photo.src}
                    photo={photo}
                    slot={slot}
                    pose={pose}
                    isLeaving={isLeaving}
                    zIndex={isLeaving ? 50 : 40 - slot}
                    reduce={reduce}
                    clickable={slot === 0 && count > 1}
                    onAdvance={advance}
                  />
                )
              })}
            </div>
          </motion.div>

          {/* only worth saying when there is more than one to flip through */}
          {count > 1 && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-8 flex items-center justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="font-hand text-lg text-paper/70">tap the photo for the next one</span>
              <span className="flex items-center gap-1.5">
                {photos.map((p, i) => (
                  <span
                    key={p.src}
                    className="h-2 w-2 rounded-[2px] border border-paper/60"
                    style={{ background: i === top ? '#ffd43b' : 'transparent' }}
                  />
                ))}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── one polaroid in the pile ────────────────────────────────── */

function PolaroidCard({
  photo,
  slot,
  pose,
  isLeaving,
  zIndex,
  reduce,
  clickable,
  onAdvance,
}: {
  photo: FunFactPhoto
  slot: number
  pose: { x: number; y: number; rotate: number; scale: number }
  isLeaving: boolean
  zIndex: number
  reduce: boolean
  clickable: boolean
  onAdvance: () => void
}) {
  const [developed, setDeveloped] = useState(false)
  const aspect = photo.aspect ?? DEFAULT_ASPECT

  // Flicking to the back arcs out to the right before tucking under the pile,
  // so it reads as a card being moved rather than one shrinking in place.
  const animate =
    isLeaving && !reduce
      ? {
          x: [0, 110, pose.x],
          y: [0, -16, pose.y],
          rotate: [-2, 12, pose.rotate],
          scale: [1, 1.03, pose.scale],
          opacity: 1,
        }
      : { ...pose, opacity: slot < 3 ? 1 : 0 }

  return (
    <motion.figure
      className="relative m-0 self-center justify-self-center bg-white p-4 pb-5 [grid-area:1/1]"
      style={{
        width: cardWidth(aspect),
        zIndex,
        border: '2.5px solid #101223',
        borderRadius: '10px 14px 10px 16px',
        boxShadow: '10px 14px 0 rgba(10,11,26,.55)',
        cursor: clickable ? 'pointer' : 'default',
        pointerEvents: slot === 0 ? 'auto' : 'none',
      }}
      animate={animate}
      transition={reduce ? { duration: 0 } : { duration: FLICK_MS / 1000, ease: 'easeInOut' }}
      onClick={clickable ? onAdvance : undefined}
      data-cursor={clickable ? 'pointer' : undefined}
      data-sfx={clickable ? 'click' : undefined}
    >
      {/* washi tape, same trick as the notes on the wall */}
      <span
        aria-hidden
        className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 bg-gold/70"
        style={{ boxShadow: '0 1px 2px rgba(0,0,0,.14)' }}
      />

      <div className="relative overflow-hidden rounded-[4px] bg-nebula" style={{ aspectRatio: aspect }}>
        <img
          src={photo.src}
          alt={photo.alt}
          className="h-full w-full object-cover"
          style={{
            objectPosition: photo.focus ?? 'center',
            filter: developed
              ? 'saturate(1) contrast(1) brightness(1)'
              : 'saturate(0.15) contrast(0.8) brightness(1.25)',
            transition: reduce ? 'none' : 'filter 900ms ease-out',
          }}
          onLoad={() => setDeveloped(true)}
          draggable={false}
        />
      </div>

      <figcaption className="mt-3 text-center font-marker text-2xl leading-tight text-ink">
        {photo.caption}
      </figcaption>
    </motion.figure>
  )
}
