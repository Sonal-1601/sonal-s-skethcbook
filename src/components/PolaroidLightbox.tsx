// ─────────────────────────────────────────────────────────────
//  A single polaroid, pulled off the wall and held up close.
//
//  Opened from a sticky note in the "Side quests" section. The photo
//  develops the way a real polaroid does — it arrives washed out and
//  pale, then the picture settles in — so the wait for a large image
//  reads as part of the bit rather than as a blank frame.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunFactPhoto } from '../data/portfolio'

/** Where the polaroid flies from, so it grows out of the note you clicked. */
export type Origin = { x: number; y: number } | null

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
  photo,
  origin,
  onClose,
}: {
  photo: FunFactPhoto | null
  origin: Origin
  onClose: () => void
}) {
  const reduce = usePrefersReducedMotion()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [developed, setDeveloped] = useState(false)

  const open = Boolean(photo)

  // Esc to close, and don't let the page scroll behind the overlay.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // move focus into the dialog so Esc and Tab land somewhere sensible
    const t = window.setTimeout(() => closeRef.current?.focus(), 60)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      clearTimeout(t)
    }
  }, [open, onClose])

  // Re-arm the develop animation for each photo.
  useEffect(() => {
    if (!open) return
    setDeveloped(false)
  }, [open, photo?.src])

  // Translate the click point into the offset the card should fly in from.
  const from = origin
    ? { x: origin.x - window.innerWidth / 2, y: origin.y - window.innerHeight / 2 }
    : { x: 0, y: 0 }

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.22 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={photo.caption}
        >
          {/* ink wash over the page */}
          <div className="absolute inset-0 bg-space/80 backdrop-blur-[3px]" />

          <motion.figure
            className="relative m-0 w-full max-w-lg bg-white p-4 pb-5"
            style={{
              border: '2.5px solid #101223',
              borderRadius: '10px 14px 10px 16px',
              boxShadow: '10px 14px 0 rgba(10,11,26,.55)',
            }}
            initial={
              reduce
                ? { opacity: 0, scale: 1, x: 0, y: 0, rotate: -2 }
                : { opacity: 0, scale: 0.35, x: from.x, y: from.y, rotate: -14 }
            }
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: -2 }}
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.4, x: from.x, y: from.y, rotate: -12 }
            }
            transition={
              reduce
                ? { duration: 0 }
                : { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }
            }
            // clicks inside the frame must not fall through to the backdrop
            onClick={(e) => e.stopPropagation()}
          >
            {/* washi tape, same trick as the notes on the wall */}
            <span
              aria-hidden
              className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 bg-gold/70"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,.14)' }}
            />

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              data-cursor="pointer"
              data-sfx="click"
              aria-label="Close photo"
              className="absolute -right-3 -top-3 z-10 grid h-9 w-9 place-items-center rounded-full border-[2.5px] border-ink bg-parch font-pixel text-[10px] text-ink transition-transform hover:-translate-y-0.5 hover:rotate-6"
              style={{ boxShadow: '2px 3px 0 rgba(16,18,35,.5)' }}
            >
              ✕
            </button>

            <div className="relative aspect-[3/2] overflow-hidden rounded-[4px] bg-nebula">
              <img
                src={photo.src}
                alt={photo.alt}
                className="h-full w-full object-cover"
                style={{
                  objectPosition: photo.focus ?? 'center',
                  // the "developing" pass — pale and flat, then true colour
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}
