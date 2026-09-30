import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Reveal, ScribbleUnderline } from '../ui'
import { limitless } from '../../data/portfolio'
import { forest } from '../../data/forest'
import { writing, hasWriting } from '../../data/writing'
import { sound } from '../../audio/engine'
import { Reel, Credits, Story, marked } from './Reel'

// ─────────────────────────────────────────────────────────────
//  Reel 01 · Limitless. The words live in `limitless`
//  (src/data/portfolio.ts).
//
//  The projector borrows Limitless's own visual trick: off NZT the
//  film is graded cold and desaturated, on it everything turns warm
//  amber. Take the pill and the brain wires itself up… for a while.
//  (It's NZT-specific — a different film wants a different prop.)
// ─────────────────────────────────────────────────────────────

const ACCENT = '#ffa94d'
const BUFF_MS = 8000

type Phase = 'baseline' | 'buffed' | 'crashed'

// the two colour grades
const COLD = {
  bg: 'radial-gradient(circle at 50% 44%, #22304a, #0f131d 72%)',
  fill: 'rgba(111,125,160,.07)',
  outline: '#6f7da0',
  gyri: 'rgba(111,125,160,.45)',
  edge: '#4a5675',
  node: '#56637f',
}
const WARM = {
  bg: 'radial-gradient(circle at 50% 44%, #6e4413, #1c1209 72%)',
  fill: 'rgba(255,169,77,.10)',
  outline: '#ffd8a8',
  gyri: 'rgba(255,192,120,.6)',
  edge: ACCENT,
  node: '#ffd43b',
  signal: '#fff3bf',
  glow: 'rgba(255,212,59,.4)',
}

const CAPTION: Record<Phase, string> = {
  baseline: 'baseline: foggy, scattered, running on “20%”',
  buffed: 'on NZT: crystal clear — everything connects ✦',
  crashed: '…and it wore off. pills always do. the real one’s below ↓',
}

/* ── the brain ───────────────────────────────────────────────── */
//  Side view, facing left. Hand-placed so every neuron sits inside
//  the outline.

const CEREBRUM =
  'M58 138C36 136 22 118 26 98C14 84 20 58 40 52C42 34 62 22 82 28C92 14 118 10 132 22C146 12 172 14 182 30C202 30 220 46 216 66C230 78 228 102 212 112C212 128 198 138 182 136C172 148 150 150 138 140C124 150 98 150 88 140C78 146 64 146 58 138Z'
const CEREBELLUM = 'M168 136C164 154 182 166 200 160C216 154 220 136 208 126'
const CEREBELLUM_FOLDS = ['M176 146C186 150 198 148 206 140', 'M180 155C190 158 200 155 207 149']
const STEM = 'M146 146C150 160 150 172 144 186M162 146C164 160 164 172 160 186'
const GYRI = [
  'M128 28C120 50 136 64 126 88C120 102 130 114 124 132',
  'M56 112C78 100 102 106 120 96C136 88 152 96 168 88',
  'M48 72C58 62 72 74 84 64',
  'M150 36C160 50 176 42 188 56',
  'M184 80C194 92 204 82 210 94',
  'M70 126C84 116 98 130 112 122',
]

type Pt = readonly [number, number]
const NODES: Pt[] = [
  [50, 92], [70, 58], [98, 42], [104, 80], [142, 46], [176, 44],
  [152, 82], [198, 70], [82, 116], [124, 118], [180, 112], [206, 96],
]
// a few lonely connections — the foggy, scattered baseline
const BASE_EDGES: [number, number][] = [[0, 1], [1, 2], [3, 8], [4, 5], [6, 9], [7, 11]]
// everything that wires up once the pill kicks in
const NZT_EDGES: [number, number][] = [
  [0, 3], [1, 3], [2, 3], [2, 4], [3, 6], [4, 6], [5, 6], [5, 7],
  [6, 7], [0, 8], [8, 9], [3, 9], [6, 10], [9, 10], [10, 11],
]

// a gently bowed line between two neurons, alternating sides
function arc(a: Pt, b: Pt, i: number): string {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
  const len = Math.hypot(dx, dy) || 1
  const bend = (i % 2 ? 1 : -1) * len * 0.14
  const cx = (a[0] + b[0]) / 2 - (dy / len) * bend
  const cy = (a[1] + b[1]) / 2 + (dx / len) * bend
  return `M${a[0]} ${a[1]}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b[0]} ${b[1]}`
}

function Brain({ on, dose, reduce }: { on: boolean; dose: number; reduce: boolean }) {
  const c = on ? WARM : COLD
  const fade = (s: number) => ({ transition: reduce ? 'none' : `stroke ${s}s ease, fill ${s}s ease` })

  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g style={{ filter: 'url(#crayon-soft)' }}>
        <path d={STEM} stroke={c.outline} strokeWidth={3} style={fade(0.9)} />
        <path d={CEREBELLUM} fill={c.fill} stroke={c.outline} strokeWidth={3} style={fade(0.9)} />
        {CEREBELLUM_FOLDS.map((d) => (
          <path key={d} d={d} stroke={c.gyri} strokeWidth={2} style={fade(0.9)} />
        ))}
        <path d={CEREBRUM} fill={c.fill} stroke={c.outline} strokeWidth={3.2} style={fade(0.9)} />
        {GYRI.map((d) => (
          <path key={d} d={d} stroke={c.gyri} strokeWidth={2} style={fade(0.9)} />
        ))}
      </g>

      {BASE_EDGES.map(([a, b], i) => (
        <path key={`b${i}`} d={arc(NODES[a], NODES[b], i)} stroke={c.edge} strokeWidth={1.6} style={fade(0.8)} />
      ))}

      {/* NZT wiring — draws itself in on every dose, fades as it wears off */}
      <AnimatePresence>
        {on &&
          NZT_EDGES.map(([a, b], i) => {
            const d = arc(NODES[a], NODES[b], i + 1)
            const delay = reduce ? 0 : 0.15 + i * 0.06
            return (
              // SVG opacity isn't readable from the DOM, so seed it or the exit has nothing to fade from
              <motion.g key={`${dose}-${i}`} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.9 }}>
                <motion.path
                  d={d}
                  stroke={WARM.edge}
                  strokeWidth={1.8}
                  initial={{ pathLength: reduce ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduce ? 0 : 0.5, delay }}
                />
                {/* signals firing along the fresh pathway */}
                <motion.path
                  d={d}
                  className="synapse-flow"
                  stroke={WARM.signal}
                  strokeWidth={2}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: reduce ? 0 : delay + 0.5 }}
                />
              </motion.g>
            )
          })}
      </AnimatePresence>

      {NODES.map(([x, y], i) => (
        <g key={`n${i}`}>
          <AnimatePresence>
            {on && (
              <motion.circle
                cx={x}
                cy={y}
                r={8}
                fill={WARM.glow}
                initial={{ opacity: 0 }}
                animate={reduce ? { opacity: 0.5 } : { opacity: [0.15, 0.7, 0.15] }}
                // its own transition — otherwise the infinite pulse repeats the exit forever
                exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.6 } }}
                transition={reduce ? { duration: 0 } : { duration: 1.6, repeat: Infinity, delay: i * 0.13 }}
              />
            )}
          </AnimatePresence>
          <circle cx={x} cy={y} r={3.4} fill={c.node} stroke="#101223" strokeWidth={1.2} style={fade(0.6)} />
        </g>
      ))}
    </svg>
  )
}

/* ── the pill: small, round and clear, like in the film ──────── */

function Pill({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 28" className={className} fill="none" aria-hidden="true">
      <path d="M4 12v4a16 8 0 0 0 32 0v-4" fill="rgba(200,220,245,.6)" stroke="#101223" strokeWidth={2} strokeLinejoin="round" />
      <ellipse cx="20" cy="12" rx="16" ry="8" fill="rgba(244,250,255,.92)" stroke="#101223" strokeWidth={2} />
      <path d="M11 8.6c3-1.9 8-2.5 12-1.9" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

/* ── the projector: brain + pill + a game-style buff timer ───── */

function BuffHud({ phase, dose }: { phase: Phase; dose: number }) {
  if (phase === 'buffed') {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-gold">▲ buff · nzt-48</span>
        <div className="h-1.5 w-24 overflow-hidden rounded-[2px] bg-black/40">
          <motion.div
            key={dose}
            className="h-full"
            style={{ background: ACCENT }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: BUFF_MS / 1000, ease: 'linear' }}
          />
        </div>
      </div>
    )
  }
  if (phase === 'crashed') return <span className="text-coral">▼ buff expired</span>
  return <span className="text-paper/45">● status · baseline</span>
}

function Projector() {
  const reduce = useReducedMotion() ?? false
  const [phase, setPhase] = useState<Phase>('baseline')
  const [dose, setDose] = useState(0)
  const on = phase === 'buffed'

  // like the real thing, it wears off
  useEffect(() => {
    if (phase !== 'buffed') return
    const t = window.setTimeout(() => {
      setPhase('crashed')
      sound.comedown()
    }, BUFF_MS)
    return () => clearTimeout(t)
  }, [phase, dose])

  const takePill = () => {
    sound.nzt()
    setDose((d) => d + 1)
    setPhase('buffed')
  }

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-ink sm:aspect-[4/3]">
        {/* cold grade underneath, warm grade fading over it */}
        <div className="absolute inset-0" style={{ background: COLD.bg }} />
        <motion.div
          className="absolute inset-0"
          style={{ background: WARM.bg }}
          initial={false}
          animate={{ opacity: on ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.9 }}
        />

        {/* kept clear of the HUD above and the subtitles below */}
        <div className="absolute inset-x-4 bottom-14 top-9">
          <Brain on={on} dose={dose} reduce={reduce} />
        </div>

        {/* vignette + projector scanlines */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,.55) 100%),' +
              'repeating-linear-gradient(0deg, rgba(255,255,255,.028) 0 1px, transparent 1px 3px)',
          }}
        />

        {/* HUD */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between font-pixel text-[7px] uppercase tracking-wider">
          <BuffHud phase={phase} dose={dose} />
          <span className={on ? 'text-gold' : 'text-paper/45'}>brain access · {on ? '100' : '20'}%</span>
        </div>

        <p aria-live="polite" className={`absolute inset-x-3 bottom-2.5 text-center font-hand text-sm leading-snug sm:text-base ${on ? 'text-[#ffe8cc]' : 'text-paper/60'}`}>
          {CAPTION[phase]}
        </p>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={takePill}
          disabled={on}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-hand text-lg font-bold text-ink transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background: ACCENT, boxShadow: '3px 4px 0 #101223' }}
        >
          <Pill className="h-6 w-8" />
          {phase === 'baseline' ? 'take the pill' : on ? 'kicking in…' : 'try it again'}
        </button>
      </div>
    </div>
  )
}

/* ── the real formula ────────────────────────────────────────── */
//  Only real numbers make it onto the label: the forest stats show up
//  once the snapshot is live, the log count once there's writing.

type Ingredient = { name: string; note: string; dose: string }

function ingredients(): Ingredient[] {
  const { live, stats } = forest
  const n = writing.posts.length
  return [
    {
      name: 'Deep focus',
      note: live ? 'logged in the forest ↑' : 'grown in the forest ↑',
      dose: live ? `${Math.round(stats.totalMinutes / 60).toLocaleString()} hrs` : 'on repeat',
    },
    ...(live ? [{ name: 'Trees grown', note: "each one a phone I didn't pick up", dose: stats.treesGrown.toLocaleString() }] : []),
    { name: 'Curiosity', note: "if it catches my eye, I'm already tinkering", dose: '∞' },
    ...(hasWriting ? [{ name: 'Writing it down', note: 'so the lessons actually stick', dose: `${n} ${n === 1 ? 'entry' : 'entries'}` }] : []),
    { name: 'Bad days', note: 'debugged, not deleted', dose: 'allowed' },
    { name: 'Shortcuts', note: 'no pill required', dose: '0 mg' },
  ]
}

function Formula() {
  return (
    <div
      className="relative rotate-[1.5deg] p-5 text-ink"
      style={{ background: '#fffdf7', border: '2.5px solid #101223', borderRadius: '6px 10px 5px 9px', boxShadow: '5px 7px 0 rgba(16,18,35,.55)' }}
    >
      <div className="font-marker text-5xl font-bold leading-none">NZT-48</div>
      <div className="font-hand text-lg text-[#4a4d63]">the real formula</div>

      <div className="mt-3 h-2 bg-ink" />
      <div className="py-1.5 font-sans text-sm font-semibold">Serving size: one day at a time</div>
      <div className="h-1 bg-ink" />
      <div className="flex justify-between py-1 font-pixel text-[7px] uppercase tracking-wider text-[#6b7089]">
        <span>Ingredient</span>
        <span>Dose</span>
      </div>

      <ul>
        {ingredients().map((g) => (
          <li key={g.name} className="flex items-baseline justify-between gap-3 border-t border-dashed border-ink/25 py-1.5">
            <span className="min-w-0">
              <span className="font-hand text-lg font-bold">{g.name}</span>
              <span className="ml-2 font-hand text-sm text-[#6b7089]">{g.note}</span>
            </span>
            <span className="shrink-0 font-sans text-sm font-bold tabular-nums">{g.dose}</span>
          </li>
        ))}
      </ul>

      <div className="h-2 bg-ink" />
      <p className="mt-2 font-hand text-sm leading-snug text-[#6b7089]">
        * Not evaluated by any lab. Side effects may include a growing forest, a greener commit wall and the
        occasional 2 a.m. epiphany.
      </p>
    </div>
  )
}

/* ── the reel ────────────────────────────────────────────────── */

const SWIPE = 'rgba(255,169,77,.34)'

export default function LimitlessReel() {
  const { title, year, director, hook, story, plotHole, plotTwist, takeaway, highlights } = limitless

  return (
    <>
      <Reveal>
        <Reel label="Feature presentation" number="Reel 01">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.05fr] md:items-center">
            <Projector />

            <div>
              <Credits badge="Now showing" title={title} year={year} director={director} hook={hook} accent={ACCENT} glow="255,169,77" />
              <Story paragraphs={story} highlights={highlights} swipe={SWIPE} />
            </div>
          </div>
        </Reel>
      </Reveal>

      {/* the fact-check + the formula that actually works */}
      <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start md:gap-8">
        <Reveal delay={0.05}>
          <div
            className="relative -rotate-2 p-6 pt-8"
            style={{ background: '#ffe8a3', boxShadow: '5px 7px 0 rgba(16,18,35,.55)', borderRadius: '4px 14px 6px 12px' }}
          >
            <span className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-2 bg-white/50" style={{ boxShadow: '0 1px 2px rgba(0,0,0,.1)' }} />
            <div className="font-pixel text-[8px] uppercase tracking-widest text-[#c2410c]">Plot hole</div>
            <p className="mt-3 font-hand text-xl leading-snug text-ink">
              {marked(plotHole, highlights, (hit, k) => (
                <strong key={k} className="font-bold" style={{ boxShadow: 'inset 0 -0.45em 0 rgba(255,169,77,.55)' }}>
                  {hit}
                </strong>
              ))}
            </p>
            <p className="mt-4 font-marker text-3xl font-bold leading-none text-ink">{plotTwist}</p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <Formula />
        </Reveal>
      </div>

      {/* the takeaway */}
      <Reveal delay={0.1} className="mx-auto mt-16 max-w-3xl text-center">
        <p className="crayon marker-glow font-marker text-4xl font-bold leading-tight text-paper sm:text-5xl">
          {marked(takeaway, highlights, (hit, k) => (
            <span key={k} style={{ color: ACCENT }}>
              {hit}
            </span>
          ))}
        </p>
        <div className="flex justify-center">
          <ScribbleUnderline color={ACCENT} width={300} delay={0.5} />
        </div>
      </Reveal>
    </>
  )
}
