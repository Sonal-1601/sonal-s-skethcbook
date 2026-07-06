import { useEffect, useRef, useState } from 'react'
import { SectionHeading, Reveal } from '../ui'

const USER = 'Sonal-1601'
const PROFILE = 'https://github.com/Sonal-1601'

// Minecraft-ish "grass/emerald" ramp: empty block → lush
const LEVELS = ['#20233c', '#2f5d3a', '#3f9d4f', '#5bcf50', '#8bf06a']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type Day = { date: string; count: number; level: number }
type Stats = { total: number; longest: number; current: number; best: number }

// ── pixel sprite renderer ──
function Sprite({ rows, palette, className }: { rows: string[]; palette: Record<string, string>; className?: string }) {
  const w = rows[0].length
  const h = rows.length
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }} aria-hidden="true">
      {rows.map((r, y) => r.split('').map((ch, x) => (ch === '.' ? null : <rect key={`${x}_${y}`} x={x} y={y} width={1.04} height={1.04} fill={palette[ch]} />)))}
    </svg>
  )
}

const SONAL_ROWS = [
  '...KKKKKK...',
  '..KKKKKKKK..',
  '.KKKKKKKKKK.',
  '.KKSSSSSSKK.',
  '.KKSSSSSSKK.',
  '.KKSESSESKK.',
  '.KKSSSSSSKK.',
  '.KKSSEESSKK.',
  '.KHHHHHHHHK.',
  '.KHHHHHHHHK.',
  'KKHHHHHHHHKK',
  '.KHHHHHHHHK.',
  '.KHHHHHHHHK.',
  '..HHHHHHHH..',
  '..PPP..PPP..',
  '..PP....PP..',
]
const SONAL_PAL = { K: '#141319', S: '#e9ba91', H: '#c6b2e8', P: '#2b2f3a', E: '#2a1c14' }

// second walk frame — feet swing to the other side
const SONAL_WALK = [...SONAL_ROWS.slice(0, 14), '..PPP..PPP..', '..P......PPP']

// pixel Sonal strolling back & forth along the grass ledge
function WalkingSonal() {
  const ref = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return
    if (reduce) {
      el.style.transform = 'translate(16px,0)'
      return
    }
    const legTimer = window.setInterval(() => setFrame((f) => f ^ 1), 170)
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const range = Math.max(40, parent.clientWidth - el.offsetWidth - 24)
      const speed = 28 // px/s
      const period = range / speed
      const t = (now - start) / 1000
      const phase = (t % (period * 2)) / period // 0..2
      const goingRight = phase < 1
      const x = 12 + (goingRight ? phase : 2 - phase) * range
      const bob = Math.abs(Math.sin(t * 6)) * 2.5
      el.style.transform = `translate(${x}px, ${-bob}px) scaleX(${goingRight ? 1 : -1})`
    }
    raf = requestAnimationFrame(loop)
    return () => {
      clearInterval(legTimer)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className="absolute bottom-1 left-0 h-14 w-10" style={{ willChange: 'transform' }}>
      <Sprite rows={frame ? SONAL_WALK : SONAL_ROWS} palette={SONAL_PAL} className="h-full w-full" />
    </div>
  )
}

const POPPY = { rows: ['.R.R.', 'RRRRR', '.RYR.', '..G..', '.LG..', '..G..'], pal: { R: '#ff6b6b', Y: '#ffd43b', G: '#4caf50', L: '#3f8f3f' } }
const DANDE = { rows: ['.Y.Y.', 'YYYYY', '.YOY.', '..G..', '.LG..', '..G..'], pal: { Y: '#ffd43b', O: '#ffa41c', G: '#4caf50', L: '#3f8f3f' } }

function computeStats(days: Day[], totalYear: number): Stats {
  let longest = 0
  let run = 0
  let best = 0
  for (const d of days) {
    best = Math.max(best, d.count)
    if (d.count > 0) { run++; longest = Math.max(longest, run) } else run = 0
  }
  let current = 0
  for (let i = days.length - 1; i >= 0 && days[i].count > 0; i--) current++
  return { total: totalYear, longest, current, best }
}

// deterministic fallback so the wall never looks broken if the API hiccups
function fallbackDays(): { days: Day[]; total: number } {
  const days: Day[] = []
  let total = 0
  const end = new Date('2026-07-06T00:00:00')
  for (let i = 365; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const seed = (i * 2654435761) % 97
    const count = seed > 78 ? seed % 9 : seed > 62 ? seed % 3 : 0
    total += count
    const level = count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : count < 7 ? 3 : 4
    days.push({ date: d.toISOString().slice(0, 10), count, level })
  }
  return { days, total }
}

function toWeeks(days: Day[]): (Day | null)[][] {
  const pad = new Date(days[0].date + 'T00:00:00').getDay()
  const cells: (Day | null)[] = [...Array(pad).fill(null), ...days]
  const weeks: (Day | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

const CELL = 13
const GAP = 3
const STEP = CELL + GAP

export default function GitHubWall() {
  const [days, setDays] = useState<Day[] | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [live, setLive] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { total: Record<string, number>; contributions: Day[] }) => {
        const c = d.contributions
        if (!c?.length) throw new Error('empty')
        setDays(c)
        setStats(computeStats(c, d.total.lastYear ?? Object.values(d.total)[0] ?? 0))
        setLive(true)
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return // ignore StrictMode re-run abort
        const fb = fallbackDays()
        setDays(fb.days)
        setStats(computeStats(fb.days, fb.total))
        setLive(false)
      })
    return () => ctrl.abort()
  }, [])

  const weeks = days ? toWeeks(days) : []

  // month labels
  const monthMarks: { col: number; label: string }[] = []
  let prevMonth = -1
  weeks.forEach((wk, col) => {
    const firstReal = wk.find(Boolean) as Day | undefined
    if (!firstReal) return
    const m = new Date(firstReal.date + 'T00:00:00').getMonth()
    if (m !== prevMonth) { monthMarks.push({ col, label: MONTHS[m] }); prevMonth = m }
  })

  // pick the busiest days to sprout flowers on
  const flowerKeys = new Set<string>()
  if (days) {
    const sorted = [...days].filter((d) => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 6)
    sorted.forEach((d) => flowerKeys.add(d.date))
  }

  return (
    <section id="commits" className="relative z-10 px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading kicker="2.5" kickerLabel="Load Save File" title="My Commit Wall" color="#39d353" underlineWidth={260} />
        <p className="mb-8 max-w-xl font-hand text-xl text-paper/70">
          Every green block is a day I shipped something. Flowers bloom on my busiest days —
          and yes, that's me planting them. 🌱
        </p>

        <Reveal>
          <div
            className="rounded-2xl border-2 border-ink p-4 sm:p-6"
            style={{ background: 'linear-gradient(180deg,#161a33,#10132a)', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,.05), inset -3px -3px 0 rgba(0,0,0,.4), 5px 6px 0 rgba(16,18,35,.55)' }}
          >
            {/* the wall */}
            <div className="overflow-x-auto pb-2">
              <div className="mx-auto w-max">
                {/* month labels */}
                <div className="relative mb-1 ml-6 h-4" style={{ width: weeks.length * STEP }}>
                  {monthMarks.map((m) => (
                    <span key={`${m.col}-${m.label}`} className="absolute font-pixel text-[8px] text-paper/45" style={{ left: m.col * STEP }}>
                      {m.label}
                    </span>
                  ))}
                </div>

                <div className="flex gap-[6px]">
                  {/* weekday labels */}
                  <div className="flex flex-col justify-between py-[1px] font-pixel text-[7px] text-paper/40" style={{ height: 7 * STEP - GAP }}>
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>

                  {/* grid */}
                  <div className="flex" style={{ gap: GAP }}>
                    {weeks.map((wk, col) => (
                      <div key={col} className="flex flex-col" style={{ gap: GAP }}>
                        {Array.from({ length: 7 }).map((_, row) => {
                          const cell = wk[row]
                          const lvl = cell ? cell.level : -1
                          const hasFlower = cell ? flowerKeys.has(cell.date) : false
                          return (
                            <div key={row} className="relative" style={{ width: CELL, height: CELL }} title={cell ? `${cell.count} on ${cell.date}` : ''}>
                              {lvl >= 0 && (
                                <div
                                  className="h-full w-full rounded-[2px]"
                                  style={{ background: LEVELS[lvl], boxShadow: 'inset 1.5px 1.5px 0 rgba(255,255,255,.18), inset -1.5px -1.5px 0 rgba(0,0,0,.35)' }}
                                />
                              )}
                              {hasFlower && (
                                <Sprite
                                  rows={(col + row) % 2 ? POPPY.rows : DANDE.rows}
                                  palette={(col + row) % 2 ? POPPY.pal : DANDE.pal}
                                  className="pointer-events-none absolute -top-[13px] left-1/2 h-[15px] w-[12px] -translate-x-1/2"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* legend */}
            <div className="mt-3 flex items-center justify-end gap-1.5 font-pixel text-[8px] text-paper/45">
              <span>less</span>
              {LEVELS.map((c, i) => (
                <span key={i} className="h-3 w-3 rounded-[2px]" style={{ background: c, boxShadow: 'inset 1px 1px 0 rgba(255,255,255,.18), inset -1px -1px 0 rgba(0,0,0,.35)' }} />
              ))}
              <span>more</span>
            </div>

            {/* grass ledge with Sonal planting flowers */}
            <div className="relative mt-4 h-16 overflow-hidden rounded-lg" style={{ background: 'linear-gradient(180deg,#5aa845 0 10px,#7a5c3a 10px)' }}>
              <div className="absolute inset-x-0 top-0 h-[10px]" style={{ background: 'repeating-linear-gradient(90deg,#63b84c 0 6px,#57a844 6px 12px)' }} />
              <Sprite rows={POPPY.rows} palette={POPPY.pal} className="absolute bottom-1 left-4 h-8 w-6" />
              <Sprite rows={DANDE.rows} palette={DANDE.pal} className="absolute bottom-1 left-28 h-8 w-6" />
              <Sprite rows={POPPY.rows} palette={POPPY.pal} className="absolute bottom-1 right-8 h-8 w-6" />
              <Sprite rows={DANDE.rows} palette={DANDE.pal} className="absolute bottom-1 right-20 h-7 w-5" />
              {/* Sonal walks the ledge (rendered last so she strolls in front of the flowers) */}
              <WalkingSonal />
            </div>
          </div>
        </Reveal>

        {/* stat tiles */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Contributions" value={stats?.total} suffix=" / yr" color="#39d353" />
          <StatTile label="Longest Streak" value={stats?.longest} suffix=" days" color="#5ce1e6" />
          <StatTile label="Current Streak" value={stats?.current} suffix=" days" color="#ffd43b" />
          <StatTile label="Best Day" value={stats?.best} suffix=" commits" color="#ff6b6b" />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <a
            href={PROFILE}
            target="_blank"
            rel="noreferrer"
            data-cursor="pointer"
            data-sfx="click"
            className="doodle-card inline-flex items-center gap-2 bg-paper px-5 py-2.5 font-hand text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
          >
            ⛏ Explore my GitHub →
          </a>
          {!live && <span className="font-hand text-sm text-paper/40">showing a sample wall — live stats are napping 😴</span>}
        </div>
      </div>
    </section>
  )
}

function StatTile({ label, value, suffix, color }: { label: string; value?: number; suffix: string; color: string }) {
  return (
    <div
      className="rounded-xl border-2 border-ink p-3 text-center"
      style={{ background: '#181c34', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,.06), inset -2px -2px 0 rgba(0,0,0,.35)' }}
    >
      <div className="font-marker text-3xl font-bold leading-none" style={{ color }}>
        {value === undefined ? '—' : value}
        <span className="font-hand text-sm text-paper/50">{value === undefined ? '' : suffix}</span>
      </div>
      <div className="mt-1 font-pixel text-[7px] uppercase tracking-wide text-paper/50">{label}</div>
    </div>
  )
}
