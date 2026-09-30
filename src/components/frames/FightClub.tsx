import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { Reveal, ScribbleUnderline } from '../ui'
import { fightClub } from '../../data/portfolio'
import { sound } from '../../audio/engine'
import { Reel, Credits, Story, marked } from './Reel'

// ─────────────────────────────────────────────────────────────
//  Reel 02 · Fight Club — my journey, told in rounds. The words live
//  in `fightClub` (src/data/portfolio.ts).
//
//  The projector is the basement: one bare bulb, graded the sickly
//  sodium-green Fincher shot it in. Each bell is a round. Until the
//  last one, a pink figure flickers onto the screen for a frame or
//  two, the way Tyler does before the film admits he exists. Round 5
//  floods the grade pink and puts that figure in the mirror.
// ─────────────────────────────────────────────────────────────

const ACCENT = '#f783ac' // the soap-bar pink off the poster
const DEEP = '#c2255c' // the same pink, dark enough to read on paper
const SWIPE = 'rgba(247,131,172,.34)'

const { rounds } = fightClub
const PRE = -1 // the title card, before the first bell
const TWIST = rounds.length - 1

const GRADE = {
  basement: 'radial-gradient(circle at 50% 18%, #3d4a26, #161b10 56%, #0a0c07 90%)',
  twist: 'radial-gradient(circle at 64% 46%, #5c2442, #1e0b17 62%, #0c050a 92%)',
}
const INK = '#e6ead0' // chalky figures under the bulb
const BULB = '#f3efb0'
const FLOOR = 170
const SPLICE_MS = 90 // about two frames of film

const SUBTITLES = ['an empty basement, one bare bulb. somebody has to go first.', ...rounds.map((r) => r.onScreen)]
const CARDS = [
  {
    label: 'fight card',
    text: 'Five rounds under one bare bulb. The subtitles are the film — this card is my side of the fight. (Heads-up: round 5 spoils a 27-year-old movie.)',
  },
  ...rounds.map((r, i) => ({ label: `round ${i + 1} · ${r.title}`, text: r.mine })),
]

/* ── stick figures ───────────────────────────────────────────── */
//  Drawn standing on the origin, about 46 units tall, then moved
//  into place. Paths go fist → elbow → shoulder → elbow → fist.

type Pose = 'stand' | 'guard' | 'hold' | 'cheer'
type Pt = readonly [number, number]

const ARMS: Record<Pose, string> = {
  stand: 'M-9 -17L0 -30L9 -17',
  guard: 'M-3 -34L-8 -25L0 -30L9 -25L8 -36',
  hold: 'M12 -26L6 -23L0 -30L6 -21L12 -21',
  cheer: 'M-11 -50L-8 -40L0 -30L8 -40L11 -50',
}
const LEGS: Record<Pose, string> = {
  stand: 'M-7 0L0 -16L7 0',
  guard: 'M-10 0L-1 -16L9 -1',
  hold: 'M-7 0L0 -16L7 0',
  cheer: 'M-8 0L0 -16L8 0',
}
const FISTS: Partial<Record<Pose, Pt[]>> = { guard: [[-3, -34], [8, -36]] }

function Figure({
  x,
  y = FLOOR,
  pose,
  color = INK,
  scale = 1,
  flip = false,
  delay = 0,
  reduce,
  children,
}: {
  x: number
  y?: number
  pose: Pose
  color?: string
  scale?: number
  flip?: boolean
  delay?: number
  reduce: boolean
  children?: ReactNode
}) {
  const draw = (after: number) => ({
    initial: { pathLength: reduce ? 1 : 0 },
    animate: { pathLength: 1 },
    transition: { duration: reduce ? 0 : 0.4, delay: reduce ? 0 : delay + after },
  })
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} stroke={color} strokeWidth={2.6}>
      <motion.circle cx={0} cy={-40} r={6} {...draw(0)} />
      <motion.path d="M0 -34L0 -16" {...draw(0.15)} />
      <motion.path d={ARMS[pose]} {...draw(0.3)} />
      <motion.path d={LEGS[pose]} {...draw(0.3)} />
      {FISTS[pose]?.map(([fx, fy]) => (
        <motion.circle
          key={`${fx}${fy}`}
          cx={fx}
          cy={fy}
          r={2.4}
          fill={color}
          initial={{ opacity: reduce ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : delay + 0.6 }}
        />
      ))}
      {children}
    </g>
  )
}

// an n-point comic "pow" burst
function burst(cx: number, cy: number, r: number, n = 8): string {
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2
    const rr = i % 2 ? r * 0.48 : r
    return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`
  })
  return `M${pts.join('L')}Z`
}

// a four-point twinkle
const twinkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`

/* ── one scene per round ─────────────────────────────────────── */

const HITS = [
  { x: 160, y: 104, t: 'ERR' },
  { x: 66, y: 112, t: 'NULL' },
  { x: 174, y: 146, t: '404' },
]

const PEERS: { x: number; y: number; s: number; pose: Pose }[] = [
  // back row first, so the front row overlaps it
  { x: 94, y: FLOOR - 14, s: 0.52, pose: 'cheer' },
  { x: 148, y: FLOOR - 14, s: 0.52, pose: 'cheer' },
  { x: 72, y: FLOOR - 6, s: 0.64, pose: 'stand' },
  { x: 170, y: FLOOR - 6, s: 0.64, pose: 'stand' },
  { x: 48, y: FLOOR, s: 0.74, pose: 'cheer' },
  { x: 194, y: FLOOR, s: 0.74, pose: 'cheer' },
]

// far-off bulbs: other basements, other cities
const DISTANT: Pt[] = [
  [36, 30],
  [206, 40],
]

function Scene({ round, reduce, mirrorClip }: { round: number; reduce: boolean; mirrorClip: string }) {
  const loop = (duration: number, delay = 0) => (reduce ? { duration: 0 } : { duration, repeat: Infinity, delay, ease: 'easeInOut' as const })

  switch (round) {
    // first night: step out of the dark, into the light
    case 0:
      return (
        <>
          {[24, 42, 198, 216].map((x) => (
            <Figure key={x} x={x} pose="stand" scale={0.62} color="rgba(230,234,208,.26)" reduce={reduce} />
          ))}
          <motion.g initial={{ x: reduce ? 0 : -44 }} animate={{ x: 0 }} transition={{ duration: reduce ? 0 : 1.6, ease: 'easeOut', delay: 0.2 }}>
            <Figure x={100} pose="stand" reduce={reduce} />
          </motion.g>
        </>
      )

    // take the hit: rock on your heels, stay standing
    case 1:
      return (
        <>
          <motion.g style={{ originX: '50%', originY: '100%' }} animate={reduce ? {} : { rotate: [-5, 4, -5] }} transition={loop(2.4)}>
            <Figure x={114} pose="guard" reduce={reduce}>
              {/* a plaster for the last one */}
              <rect x={-6} y={-46.5} width={9} height={3.4} rx={1.2} fill="#ffd8a8" stroke="none" transform="rotate(-28 -1.5 -44.8)" />
            </Figure>
          </motion.g>
          {HITS.map((h, i) => (
            <motion.g
              key={h.t}
              initial={{ opacity: reduce ? 1 : 0, scale: reduce ? 1 : 0.4 }}
              animate={reduce ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 1, 0], scale: [0.4, 1.15, 1, 1] }}
              transition={reduce ? { duration: 0 } : { duration: 2.4, times: [0, 0.12, 0.7, 1], repeat: Infinity, delay: 0.5 + i * 0.8 }}
            >
              <path d={burst(h.x, h.y, 14)} fill="rgba(255,107,107,.16)" stroke="#ff6b6b" strokeWidth={1.6} />
              <text x={h.x} y={h.y + 2.4} textAnchor="middle" fontFamily='"Press Start 2P", monospace' fontSize={5.4} fill="#ffc9c9" stroke="none">
                {h.t}
              </text>
            </motion.g>
          ))}
        </>
      )

    // homework: a checklist that ticks itself off
    case 2:
      return (
        <>
          <Figure x={96} pose="hold" reduce={reduce} />
          <motion.g initial={{ opacity: reduce ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: reduce ? 0 : 0.45 }}>
            <g transform="rotate(5 121 139)">
              <rect x={107} y={121} width={28} height={35} rx={1.5} fill="#fbf6e9" stroke="#101223" strokeWidth={1.2} />
              {[0, 1, 2].map((i) => {
                const y = 130 + i * 9
                return (
                  <g key={i}>
                    <rect x={110.5} y={y - 3} width={4.2} height={4.2} fill="none" stroke="#101223" strokeWidth={0.9} />
                    <path d={`M118 ${y - 0.8}H131`} stroke="#8a8ea6" strokeWidth={1.3} />
                    <motion.path
                      d={`M110.6 ${y - 1.6}l1.8 2l3.8 -4.8`}
                      stroke={DEEP}
                      strokeWidth={1.7}
                      initial={{ pathLength: reduce ? 1 : 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.9 + i * 0.45 }}
                    />
                  </g>
                )
              })}
            </g>
          </motion.g>
        </>
      )

    // the club grows: a crowd, and more bulbs in the distance
    case 3:
      return (
        <>
          {DISTANT.map(([x, y], i) => (
            <motion.g key={x} initial={{ opacity: reduce ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: reduce ? 0 : 0.9 + i * 0.3 }}>
              <path d={`M${x} 0V${y - 4}`} stroke="rgba(230,234,208,.35)" strokeWidth={1.2} />
              <circle cx={x} cy={y} r={9} fill={BULB} opacity={0.14} stroke="none" />
              <circle cx={x} cy={y} r={2.8} fill={BULB} stroke="none" />
            </motion.g>
          ))}
          {PEERS.map((p, i) => (
            <motion.g key={i} animate={reduce || p.pose !== 'cheer' ? {} : { y: [0, -3, 0] }} transition={loop(0.9, i * 0.17)}>
              <Figure x={p.x} y={p.y} pose={p.pose} scale={p.s} color="rgba(230,234,208,.72)" delay={0.1 + i * 0.12} reduce={reduce} />
            </motion.g>
          ))}
          <Figure x={121} pose="guard" reduce={reduce} />
        </>
      )

    // plot twist: the one in the mirror was you the whole time
    case TWIST:
      return (
        <>
          <Figure x={80} pose="stand" reduce={reduce} />
          <motion.rect
            x={134}
            y={80}
            width={66}
            height={86}
            rx={5}
            stroke="#d8d2b4"
            strokeWidth={3}
            fill="rgba(247,131,172,.07)"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduce ? 0 : 0.7 }}
          />
          <path d="M144 166L140 172M190 166L194 172" stroke="#d8d2b4" strokeWidth={3} />
          <g clipPath={`url(#${mirrorClip})`}>
            <motion.circle
              cx={167}
              cy={138}
              r={28}
              fill={ACCENT}
              stroke="none"
              initial={{ opacity: 0 }}
              animate={reduce ? { opacity: 0.2 } : { opacity: [0.1, 0.3, 0.1] }}
              transition={reduce ? { duration: 0 } : { duration: 2.2, repeat: Infinity, delay: 0.8 }}
            />
            <Figure x={167} y={162} pose="guard" flip color={ACCENT} delay={0.6} reduce={reduce} />
            <path d="M184 88L194 98M178 88L194 104" stroke="rgba(255,255,255,.35)" strokeWidth={1.4} />
          </g>
          {[
            [208, 84, 4.5],
            [126, 96, 3.2],
            [204, 130, 2.6],
          ].map(([x, y, r], i) => (
            <motion.path
              key={i}
              d={twinkle(x, y, r)}
              fill={ACCENT}
              stroke="none"
              initial={{ opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 0] }}
              transition={reduce ? { duration: 0 } : { duration: 1.8, repeat: Infinity, delay: 1.2 + i * 0.5 }}
            />
          ))}
        </>
      )

    // pre-fight: nobody's stepped in yet
    default:
      return null
  }
}

/* ── the basement: bulb, cone of light, and whatever round it is ── */

function Basement({ round, twist, lit, reduce }: { round: number; twist: boolean; lit: boolean; reduce: boolean }) {
  const uid = useId().replace(/:/g, '')
  const light = twist ? '#ffc2d6' : BULB

  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-cone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} stopOpacity={0.34} />
          <stop offset="1" stopColor={light} stopOpacity={0.03} />
        </linearGradient>
        <clipPath id={`${uid}-mirror`}>
          <rect x={136} y={82} width={62} height={82} rx={4} />
        </clipPath>
      </defs>

      {/* the set never changes: wire, bulb, light, floor */}
      <path d="M113 54L127 54L208 170L32 170Z" fill={`url(#${uid}-cone)`} style={{ transition: reduce ? 'none' : 'fill .9s' }} />
      <ellipse cx={120} cy={171} rx={90} ry={10} fill={light} opacity={0.14} />
      <path d="M6 171H234" stroke="rgba(255,255,255,.07)" strokeWidth={1.5} />
      <path d="M120 0V32" stroke="rgba(230,234,208,.45)" strokeWidth={1.4} />
      <rect x={115} y={31} width={10} height={7} rx={1.5} fill="#5c5f4a" stroke="#101223" strokeWidth={1} />
      <motion.circle
        cx={120}
        cy={45}
        r={17}
        fill={light}
        initial={{ opacity: 0.35 }}
        animate={lit && !reduce ? { opacity: [0.35, 0.5, 0.2, 0.48, 0.3, 0.45] } : { opacity: 0.4 }}
        transition={lit && !reduce ? { duration: 3.4, repeat: Infinity, times: [0, 0.3, 0.34, 0.4, 0.7, 1] } : { duration: 0 }}
      />
      <path d="M114 38C109 44 111 52 116 55H124C129 52 131 44 126 38Z" fill={light} stroke="#101223" strokeWidth={1.2} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.g
          key={round}
          style={{ filter: 'url(#crayon-soft)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.22 } }}
          transition={{ duration: reduce ? 0 : 0.3 }}
        >
          <Scene round={round} reduce={reduce} mirrorClip={`${uid}-mirror`} />
        </motion.g>
      </AnimatePresence>
    </svg>
  )
}

// the frame Tyler splices in: on screen for a blink, then gone
function Splice() {
  return (
    <svg viewBox="0 0 240 200" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width={240} height={200} fill="rgba(247,131,172,.12)" />
      <g opacity={0.8}>
        <Figure x={124} y={186} pose="guard" scale={2.7} color={ACCENT} reduce />
      </g>
    </svg>
  )
}

function Bell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#101223" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 17a8 8 0 0 1 16 0Z" fill="#fff3bf" />
      <path d="M3 17h18M12 9V6.5" />
      <circle cx={12} cy={5} r={1.5} fill="#101223" />
      <path d="M1.5 9.5l2 1M22.5 9.5l-2 1" />
    </svg>
  )
}

/* ── the projector ───────────────────────────────────────────── */

function Projector() {
  const reduce = useReducedMotion() ?? false
  const [round, setRound] = useState(PRE)
  const [cue, setCue] = useState(false)
  const [splice, setSplice] = useState(false)
  const [flashes, setFlashes] = useState(0)
  const timers = useRef<number[]>([])
  const screen = useRef<HTMLDivElement>(null)
  const inView = useInView(screen, { amount: 0.5 })
  const twist = round === TWIST

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const flash = useCallback(() => {
    setSplice(true)
    timers.current.push(window.setTimeout(() => setSplice(false), SPLICE_MS))
    setFlashes((n) => n + 1)
  }, [])

  // Tyler slips in now and then while you're watching — never once you know
  useEffect(() => {
    if (reduce || !inView || round === TWIST) return
    const t = window.setTimeout(flash, 7000 + Math.random() * 6000)
    return () => clearTimeout(t)
  }, [reduce, inView, round, flashes, flash])

  const goTo = (target: number) => {
    sound.bell()
    timers.current.forEach(clearTimeout)
    timers.current = []
    setSplice(false)
    if (reduce) return setRound(target)
    // cue mark in the corner, then the changeover — with a stowaway frame
    setCue(true)
    later(() => {
      if (target !== TWIST) flash()
      setRound(target)
    }, 380)
    later(() => setCue(false), 760)
  }

  return (
    <div>
      <div ref={screen} className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-ink sm:aspect-[4/3]">
        <div className="absolute inset-0" style={{ background: GRADE.basement }} />
        <motion.div
          className="absolute inset-0"
          style={{ background: GRADE.twist }}
          initial={false}
          animate={{ opacity: twist ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 1.1 }}
        />

        <div className="absolute inset-x-4 bottom-14 top-9">
          <Basement round={round} twist={twist} lit={inView} reduce={reduce} />
        </div>

        {/* the title card, before the first bell */}
        <AnimatePresence>
          {round === PRE && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-16 flex flex-col items-center text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.25 } }}
            >
              <span className="font-pixel text-[7px] uppercase tracking-[0.3em] text-paper/50">tonight's card</span>
              <span className="crayon mt-1 font-marker text-5xl font-bold leading-none text-paper sm:text-6xl" style={{ textShadow: '0 0 24px rgba(247,131,172,.4)' }}>
                my journey
              </span>
              <span className="mt-1.5 font-pixel text-[8px] uppercase tracking-widest" style={{ color: ACCENT }}>
                in five rounds
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {splice && <Splice />}

        {/* grain, a stray scratch, vignette */}
        <div className="film-grain pointer-events-none absolute inset-0" />
        <div className="film-scratch pointer-events-none" />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.6) 100%)' }} />

        {/* HUD */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between font-pixel text-[7px] uppercase tracking-wider">
          <span style={{ color: round === PRE ? 'rgba(251,246,233,.45)' : ACCENT }}>
            {round === PRE ? '○ pre-fight' : `● round ${round + 1} / ${rounds.length}`}
          </span>
          <span className="flex items-center gap-1.5 text-paper/45">
            grit
            <span className="flex gap-0.5">
              {rounds.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-2.5 rounded-[1px] transition-colors duration-500"
                  style={{ background: i <= round ? ACCENT : 'rgba(255,255,255,.14)' }}
                />
              ))}
            </span>
          </span>
        </div>
        <span className={`cue-mark absolute right-4 top-9 transition-opacity duration-75 ${cue ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />

        <p
          aria-live="polite"
          className="absolute inset-x-3 bottom-2.5 text-center font-hand text-sm leading-snug transition-colors duration-700 sm:text-base"
          style={{ color: twist ? '#ffdeeb' : 'rgba(238,242,205,.72)' }}
        >
          {SUBTITLES[round + 1]}
        </p>
      </div>

      {/* my side of each round. Every card is stacked in the sizer, so it never jumps */}
      <div className="relative mt-4 rounded-xl border-2 border-ink px-4 py-3" style={{ background: 'rgba(251,246,233,.04)' }}>
        <div aria-hidden="true" className="invisible grid">
          {CARDS.map((c) => (
            <div key={c.label} className="col-start-1 row-start-1">
              <CardBody {...c} />
            </div>
          ))}
        </div>
        <div aria-live="polite" className="absolute inset-x-4 top-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={round}
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -6 }}
              transition={{ duration: reduce ? 0 : 0.22 }}
            >
              <CardBody {...CARDS[round + 1]} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5" role="group" aria-label="Jump to a round">
          {rounds.map((r, i) => (
            <button
              key={r.title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Round ${i + 1}: ${r.title}`}
              aria-current={i === round ? 'step' : undefined}
              className="grid h-8 w-8 place-items-center rounded-md border-2 border-ink font-pixel text-[8px] transition-transform hover:-translate-y-0.5"
              style={{
                background: i === round ? ACCENT : i < round ? 'rgba(247,131,172,.26)' : 'rgba(251,246,233,.08)',
                color: i === round ? '#101223' : '#fbf6e9',
                boxShadow: '2px 2px 0 #101223',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(round === TWIST ? 0 : round + 1)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 font-hand text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
          style={{ background: ACCENT, boxShadow: '3px 4px 0 #101223' }}
        >
          <Bell className="h-5 w-5" />
          {round === PRE ? 'ring the bell' : round === TWIST ? 'run it back' : 'next round'}
        </button>
      </div>
    </div>
  )
}

function CardBody({ label, text }: { label: string; text: string }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 font-pixel text-[7px] uppercase tracking-widest">
        <span style={{ color: ACCENT }}>{label}</span>
        <span className="shrink-0 text-paper/35">my side ✏️</span>
      </div>
      <p className="mt-2 font-hand text-[17px] leading-snug text-paper/85">{text}</p>
    </>
  )
}

/* ── house rules, taped to the basement wall ─────────────────── */

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

// a hand-torn top edge
const TORN =
  'polygon(0 7px, 5% 2px, 11% 6px, 17% 1px, 24% 5px, 31% 0, 38% 6px, 45% 2px, 52% 7px, 59% 1px, 66% 5px, 73% 0, 80% 6px, 87% 2px, 94% 6px, 100% 1px, 100% 100%, 0 100%)'

function HouseRules() {
  return (
    <div className="relative -rotate-[1.5deg]" style={{ filter: 'drop-shadow(5px 7px 0 rgba(16,18,35,.55))' }}>
      <div className="relative px-6 pb-6 pt-9 text-ink" style={{ background: '#f4f1e6', clipPath: TORN }}>
        <div className="font-pixel text-[8px] uppercase tracking-widest" style={{ color: DEEP }}>
          House rules
        </div>
        <div className="mt-2 font-marker text-5xl font-bold leading-[0.9]">Rules of Build Club</div>
        <div className="font-hand text-lg text-[#4a4d63]">taped to the basement wall</div>

        <div className="mt-3 h-1 bg-ink" />
        <ol className="mt-3 space-y-2">
          {fightClub.rules.map((rule, i) => (
            <li key={rule} className="flex gap-3 font-mono text-[13px] leading-snug">
              <span className="w-8 shrink-0 font-bold" style={{ color: DEEP }}>
                {ordinal(i + 1)}
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 h-1 bg-ink" />

        <p className="mt-2 pr-20 font-hand text-sm leading-snug text-[#6b7089]">
          * No one was punched in the making of this career. Egos, on the other hand — bruised weekly.
        </p>
        <span
          className="absolute bottom-5 right-4 -rotate-12 rounded-md border-2 px-1.5 py-1 font-pixel text-[6px] uppercase leading-tight tracking-wider opacity-80"
          style={{ borderColor: DEEP, color: DEEP }}
        >
          members
          <br />
          since day 1
        </span>
      </div>
      <span className="absolute -top-2 left-8 h-5 w-14 -rotate-6 bg-white/55" style={{ boxShadow: '0 1px 2px rgba(0,0,0,.12)' }} />
      <span className="absolute -top-2 right-8 h-5 w-14 rotate-6 bg-white/55" style={{ boxShadow: '0 1px 2px rgba(0,0,0,.12)' }} />
    </div>
  )
}

/* ── the reel ────────────────────────────────────────────────── */

export default function FightClubReel() {
  const { title, year, director, hook, story, misread, misreadPunchline, takeaway, highlights } = fightClub

  return (
    <>
      <Reveal>
        <Reel label="Midnight screening" number="Reel 02">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.05fr] md:items-center">
            <div>
              <Credits badge="Double feature" title={title} year={year} director={director} hook={hook} accent={ACCENT} glow="247,131,172" />
              <Story paragraphs={story} highlights={highlights} swipe={SWIPE} />
            </div>

            <Projector />
          </div>
        </Reel>
      </Reveal>

      {/* the house rules + what people get wrong about the film */}
      <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start md:gap-8">
        <Reveal delay={0.05}>
          <HouseRules />
        </Reveal>

        <Reveal delay={0.12}>
          <div
            className="relative rotate-2 p-6 pt-8"
            style={{ background: '#ffd6e5', boxShadow: '5px 7px 0 rgba(16,18,35,.55)', borderRadius: '12px 5px 14px 4px' }}
          >
            <span className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-2 bg-white/50" style={{ boxShadow: '0 1px 2px rgba(0,0,0,.1)' }} />
            <div className="font-pixel text-[8px] uppercase tracking-widest" style={{ color: DEEP }}>
              Common misread
            </div>
            <p className="mt-3 font-hand text-xl leading-snug text-ink">
              {marked(misread, highlights, (hit, k) => (
                <strong key={k} className="font-bold" style={{ boxShadow: 'inset 0 -0.45em 0 rgba(247,131,172,.55)' }}>
                  {hit}
                </strong>
              ))}
            </p>
            <p className="mt-4 font-marker text-3xl font-bold leading-none text-ink">{misreadPunchline}</p>
          </div>
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
