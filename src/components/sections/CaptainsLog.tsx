import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SectionHeading, Reveal } from '../ui'
import { writing, hasWriting, type Post } from '../../data/writing'

// ─────────────────────────────────────────────────────────────
//  The Captain's Log — Medium posts as pages torn out of a
//  notebook. The data is a build-time snapshot of the RSS feed
//  (scripts/fetch-medium.mjs); nothing here talks to Medium.
// ─────────────────────────────────────────────────────────────

const ACCENT = '#74c0fc'
const PAPER = '#fbf6e9'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ── torn edges ──────────────────────────────────────────────── */
//  Seeded so every page tears differently but identically on each
//  render — no hydration wobble, no re-roll on re-render.

function lcg(seed: number) {
  let s = (seed * 2654435761 + 97) >>> 0
  return () => {
    s = (s * 1103515245 + 12345) >>> 0
    return s / 4294967296
  }
}

function tornPath(seed: number): string {
  const rnd = lcg(seed)
  const step = 50
  const ys: number[] = []
  for (let x = 0; x <= 1200; x += step) ys.push(3 + rnd() * 9)

  let d = `M0 20 L0 ${ys[0].toFixed(1)}`
  for (let i = 1; i < ys.length; i++) {
    const cx = i * step - step / 2
    const cy = Math.max(1, Math.min(14, ys[i - 1] + rnd() * 7 - 3.5))
    d += ` Q${cx} ${cy.toFixed(1)} ${i * step} ${ys[i].toFixed(1)}`
  }
  return `${d} L1200 20 Z`
}

function TornStrip({ seed, side }: { seed: number; side: 'top' | 'bottom' }) {
  const d = useMemo(() => tornPath(seed), [seed])
  return (
    <svg
      className={`pointer-events-none absolute inset-x-0 h-3 w-full ${
        side === 'top' ? 'bottom-full translate-y-[1px]' : 'top-full -translate-y-[1px] rotate-180'
      }`}
      viewBox="0 0 1200 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={d} fill={PAPER} />
    </svg>
  )
}

/* ── helpers ─────────────────────────────────────────────────── */

function fmtDate(iso: string | null): string {
  if (!iso) return 'UNDATED'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'UNDATED'
  return `${d.getDate()} ${MONTHS[d.getMonth()].toUpperCase()} ${d.getFullYear()}`
}

function fmtSnapshot(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/* ── section ─────────────────────────────────────────────────── */

export default function CaptainsLog() {
  // Nothing written yet (or the feed was unreachable on the last build)
  // → no empty section, no dead nav link.
  if (!hasWriting) return null

  const { posts, profile, generatedAt } = writing
  const snapshot = fmtSnapshot(generatedAt)

  return (
    <section id="writing" className="relative z-10 px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          kicker="2.8"
          kickerLabel="Open Captain's Log"
          title="Captain's Log"
          color={ACCENT}
          underlineWidth={260}
        />
        <p className="mb-12 max-w-xl font-hand text-xl text-paper/70">
          Pages torn out of the notebook — what I built, what broke, and what I figured out
          along the way. Every entry lives on Medium. ✦
        </p>

        <div className="space-y-14">
          {posts.map((p, i) => (
            <Reveal key={p.url} delay={i * 0.06}>
              <LogPage post={p} entry={posts.length - i} latest={i === 0} seed={i + 1} />
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
          <a
            href={profile}
            target="_blank"
            rel="noreferrer"
            data-cursor="pointer"
            data-sfx="click"
            className="doodle-card inline-flex items-center gap-2 bg-paper px-5 py-2.5 font-hand text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
          >
            ✍️ Read everything on Medium →
          </a>
          {snapshot && (
            <span className="font-hand text-sm text-paper/40">
              log synced {snapshot} · {posts.length} entr{posts.length === 1 ? 'y' : 'ies'} in the book
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

/* ── one page ────────────────────────────────────────────────── */

function LogPage({ post, entry, latest, seed }: { post: Post; entry: number; latest: boolean; seed: number }) {
  // Medium's CDN is not ours — if a cover 404s, drop it rather than
  // leaving a broken frame taped to the page.
  const [cover, setCover] = useState(post.cover)
  const tilt = seed % 2 === 0 ? 0.8 : -0.9

  return (
    <motion.a
      href={post.url}
      target="_blank"
      rel="noreferrer"
      data-cursor="pointer"
      data-sfx="note"
      initial={{ rotate: tilt }}
      whileHover={{ y: -6, rotate: tilt * 0.35 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="relative block py-6 pl-14 pr-6 text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky/60"
      style={{
        background: PAPER,
        // ruled paper + the red margin rule down the left
        backgroundImage:
          'repeating-linear-gradient(180deg, transparent 0 27px, rgba(16,18,35,.07) 27px 28px),' +
          'linear-gradient(90deg, transparent 0 44px, rgba(255,107,107,.35) 44px 46px, transparent 46px)',
        filter: 'drop-shadow(5px 7px 0 rgba(16,18,35,.55))',
      }}
    >
      <TornStrip seed={seed} side="top" />
      <TornStrip seed={seed + 91} side="bottom" />

      {/* the newest page still has the "latest" stamp on it */}
      {latest && (
        <span
          aria-hidden
          className="absolute -top-3 right-4 -rotate-6 px-2 py-1 font-pixel text-[7px] uppercase leading-none tracking-widest"
          style={{ color: ACCENT, border: `2px dashed ${ACCENT}`, borderRadius: 3, background: 'rgba(116,192,252,.10)' }}
        >
          Latest Entry
        </span>
      )}

      {/* stamped header line */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-pixel text-[8px] uppercase tracking-wider text-[#6b7089]">
        <span style={{ color: ACCENT }}>Log {String(entry).padStart(3, '0')}</span>
        <span aria-hidden>·</span>
        {post.iso ? <time dateTime={post.iso}>{fmtDate(post.iso)}</time> : <span>Undated</span>}
        {post.minutes > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>{post.minutes} min read</span>
          </>
        )}
      </div>

      <div className="mt-4 sm:flex sm:items-start sm:gap-6">
        <div className="min-w-0 flex-1">
          <h3 className="font-marker text-4xl font-bold leading-[0.95] text-ink sm:text-5xl">{post.title}</h3>

          {post.excerpt && (
            <p className="mt-3 font-hand text-lg leading-relaxed text-[#3a3d52]">{post.excerpt}</p>
          )}

          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="font-hand text-sm font-bold text-[#4a4d63]"
                  style={{ border: '2px solid rgba(16,18,35,.25)', borderRadius: '10px 6px 12px 6px', padding: '1px 9px' }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <span className="mt-5 inline-flex items-center gap-1.5 font-hand text-lg font-bold" style={{ color: '#1f5fa8' }}>
            read the entry <span aria-hidden>→</span>
          </span>
        </div>

        {/* the clipping taped to the page */}
        {cover && (
          <div className="relative mx-auto mt-6 w-40 shrink-0 sm:mx-0 sm:mt-1 sm:w-44">
            <div
              className="rotate-2 bg-white p-2"
              style={{ border: '2px solid #101223', boxShadow: '3px 4px 0 rgba(16,18,35,.22)' }}
            >
              <img
                src={cover}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setCover(null)}
                className="block h-32 w-full object-cover"
                draggable={false}
              />
            </div>
            {/* washi tape holding it down */}
            <span
              aria-hidden
              className="absolute -top-2 left-1/2 h-5 w-14 -translate-x-1/2 -rotate-3 bg-white/70"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,.12)' }}
            />
          </div>
        )}
      </div>
    </motion.a>
  )
}
