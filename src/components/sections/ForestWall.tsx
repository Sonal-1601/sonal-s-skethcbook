import { useEffect, useState } from 'react'
import { SectionHeading, Reveal } from '../ui'
import { Sprite } from '../PixelSprite'
import { forest, type ForestDay } from '../../data/forest'

const FOREST_PROFILE = 'https://www.forestapp.cc/'

// canopy ramp: bare soil → deep focus. Cooler than the commit wall's
// grass green so the two walls read as different biomes.
const LEVELS = ['#1b1f38', '#1f5148', '#2f8f6b', '#49c78d', '#7ef0b4']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CELL = 13
const GAP = 3
const STEP = CELL + GAP

/* ── sprites ─────────────────────────────────────────────────── */

const PINE = {
  rows: ['...G...', '..GGD..', '..GGD..', '.GGGDD.', '.GGGDD.', 'GGGGDDD', '...T...', '...T...', '..TTT..'],
  pal: { G: '#5bcf50', D: '#2f7d3f', T: '#7a5c3a' },
}

const SAPLING = {
  rows: ['..G..', '.GGD.', 'GGGDD', '.GGD.', '..T..', '..T..'],
  pal: { G: '#7ef0b4', D: '#2f8f6b', T: '#7a5c3a' },
}

const WITHERED = {
  rows: ['.W...W.', '..W.W..', '..WWW..', '.W.W.W.', 'W..W..W', '...W...', '...W...', '...W...', '..DDD..'],
  pal: { W: '#8a7a5f', D: '#5c4f3a' },
}

const FIRE_A = {
  rows: ['...Y...', '..YOY..', '.YOROY.', '.YOROY.', '..YOY..', '.LRRRL.', 'LLLLLLL'],
  pal: { Y: '#ffd43b', O: '#ff8c1a', R: '#ff5b3b', L: '#7a5c3a' },
}
const FIRE_B = {
  rows: ['..Y....', '..YOY..', '.YORO..', '.YOROY.', '..YOY..', '.LRRRL.', 'LLLLLLL'],
  pal: FIRE_A.pal,
}

/* ── helpers ─────────────────────────────────────────────────── */

function levelFor(minutes: number): number {
  if (minutes <= 0) return 0
  if (minutes < 30) return 1
  if (minutes < 60) return 2
  if (minutes < 120) return 3
  return 4
}

function fmtDuration(min: number): string {
  if (min <= 0) return '0m'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function fmtSince(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function toWeeks(days: ForestDay[]): (ForestDay | null)[][] {
  const pad = new Date(days[0].date + 'T00:00:00').getDay()
  const cells: (ForestDay | null)[] = [...Array(pad).fill(null), ...days]
  const weeks: (ForestDay | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/* ── a campfire that flickers on the forest floor ────────────── */

function Campfire({ className }: { className?: string }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setInterval(() => setFrame((f) => f ^ 1), 220)
    return () => clearInterval(t)
  }, [])

  const fire = frame ? FIRE_B : FIRE_A
  return <Sprite rows={fire.rows} palette={fire.pal} className={className} />
}

/* ── section ─────────────────────────────────────────────────── */

export default function ForestWall() {
  const { days, stats, topTags, live } = forest
  const weeks = toWeeks(days)

  // month labels along the top
  const monthMarks: { col: number; label: string }[] = []
  let prevMonth = -1
  weeks.forEach((wk, col) => {
    const first = wk.find(Boolean) as ForestDay | undefined
    if (!first) return
    const m = new Date(first.date + 'T00:00:00').getMonth()
    if (m !== prevMonth) {
      monthMarks.push({ col, label: MONTHS[m] })
      prevMonth = m
    }
  })

  // deepest days grow a full pine; the runners-up get a sapling
  const ranked = [...days].filter((d) => d.minutes > 0).sort((a, b) => b.minutes - a.minutes)
  const pineDays = new Set(ranked.slice(0, 5).map((d) => d.date))
  const saplingDays = new Set(ranked.slice(5, 11).map((d) => d.date))
  // a few honest withered stumps — days where every tree died
  const witheredDays = new Set(
    days
      .filter((d) => d.dead > 0 && d.sessions === 0)
      .sort((a, b) => b.dead - a.dead)
      .slice(0, 3)
      .map((d) => d.date),
  )

  const activeDays = days.filter((d) => d.sessions > 0).length
  const maxTagMinutes = topTags.length ? topTags[0].minutes : 0

  return (
    <section id="forest" className="relative z-10 px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading kicker="2.6" kickerLabel="Enter Focus Mode" title="My Focus Forest" color="#49c78d" underlineWidth={280} />
        <p className="mb-8 max-w-xl font-hand text-xl text-paper/70">
          Every tree here is a phone I didn't pick up. Plant one, stay off your phone until the
          timer ends, and it grows — leave early and it withers.{' '}
          {stats.since
            ? `This is what staying focused since ${fmtSince(stats.since)} looks like. 🌲`
            : 'This is what staying focused looks like. 🌲'}
        </p>

        <Reveal>
          <div
            className="rounded-2xl border-2 border-ink p-4 sm:p-6"
            style={{
              background: 'linear-gradient(180deg,#132a2a,#0e1a26)',
              boxShadow: 'inset 2px 2px 0 rgba(255,255,255,.05), inset -3px -3px 0 rgba(0,0,0,.4), 5px 6px 0 rgba(16,18,35,.55)',
            }}
          >
            {/* the wall */}
            <div className="overflow-x-auto pb-2">
              <div className="mx-auto w-max pt-3">
                {/* month labels — mb leaves headroom for trees sprouting off the top row */}
                <div className="relative mb-6 ml-6 h-4" style={{ width: weeks.length * STEP }}>
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
                          const lvl = cell ? levelFor(cell.minutes) : -1
                          const pine = cell ? pineDays.has(cell.date) : false
                          const sapling = cell ? saplingDays.has(cell.date) : false
                          const dead = cell ? witheredDays.has(cell.date) : false
                          return (
                            <div
                              key={row}
                              className="relative"
                              style={{ width: CELL, height: CELL }}
                              title={cell ? `${fmtDuration(cell.minutes)} focused on ${cell.date}${cell.dead ? ` · ${cell.dead} withered` : ''}` : ''}
                            >
                              {lvl >= 0 && (
                                <div
                                  className="h-full w-full rounded-[2px]"
                                  style={{ background: LEVELS[lvl], boxShadow: 'inset 1.5px 1.5px 0 rgba(255,255,255,.18), inset -1.5px -1.5px 0 rgba(0,0,0,.35)' }}
                                />
                              )}
                              {pine && <Sprite rows={PINE.rows} palette={PINE.pal} className="pointer-events-none absolute -top-[17px] left-1/2 h-[19px] w-[15px] -translate-x-1/2" />}
                              {sapling && !pine && <Sprite rows={SAPLING.rows} palette={SAPLING.pal} className="pointer-events-none absolute -top-[13px] left-1/2 h-[14px] w-[12px] -translate-x-1/2" />}
                              {dead && <Sprite rows={WITHERED.rows} palette={WITHERED.pal} className="pointer-events-none absolute -top-[17px] left-1/2 h-[19px] w-[15px] -translate-x-1/2" />}
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
              <span>idle</span>
              {LEVELS.map((c, i) => (
                <span key={i} className="h-3 w-3 rounded-[2px]" style={{ background: c, boxShadow: 'inset 1px 1px 0 rgba(255,255,255,.18), inset -1px -1px 0 rgba(0,0,0,.35)' }} />
              ))}
              <span>deep work</span>
            </div>

            {/* forest floor: a little ridge of trees around a campfire */}
            <div className="relative mt-4 h-20 overflow-hidden rounded-lg" style={{ background: 'linear-gradient(180deg,#2f6b4f 0 12px,#4a3a2a 12px,#3d3024 100%)' }}>
              <div className="absolute inset-x-0 top-0 h-[12px]" style={{ background: 'repeating-linear-gradient(90deg,#337457 0 7px,#2d6a4f 7px 14px)' }} />
              <Sprite rows={PINE.rows} palette={PINE.pal} className="absolute bottom-1 left-3 h-14 w-11" />
              <Sprite rows={PINE.rows} palette={PINE.pal} className="absolute bottom-1 left-20 h-10 w-8" />
              <Sprite rows={SAPLING.rows} palette={SAPLING.pal} className="absolute bottom-1 left-32 h-7 w-6" />
              <Campfire className="absolute bottom-2 left-1/2 h-9 w-9 -translate-x-1/2" />
              <Sprite rows={SAPLING.rows} palette={SAPLING.pal} className="absolute bottom-1 right-36 h-6 w-5" />
              <Sprite rows={PINE.rows} palette={PINE.pal} className="absolute bottom-1 right-24 h-11 w-9" />
              <Sprite rows={WITHERED.rows} palette={WITHERED.pal} className="absolute bottom-1 right-14 h-9 w-7" />
              <Sprite rows={PINE.rows} palette={PINE.pal} className="absolute bottom-1 right-3 h-14 w-11" />
            </div>
          </div>
        </Reveal>

        {/* stat tiles */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Time Focused" value={`${Math.round(stats.totalMinutes / 60).toLocaleString()}`} suffix=" hrs" color="#49c78d" />
          <StatTile label="Trees Grown" value={stats.treesGrown.toLocaleString()} suffix=" trees" color="#7ef0b4" />
          <StatTile label="Longest Streak" value={`${stats.longestStreak}`} suffix=" days" color="#ffd43b" />
          <StatTile label="Deepest Day" value={fmtDuration(stats.bestDayMinutes)} suffix="" color="#5ce1e6" />
        </div>

        {/* what the focus went into */}
        {topTags.length > 0 && (
          <Reveal delay={0.1}>
            <div className="mt-6 rounded-xl border-2 border-ink p-4" style={{ background: '#131a2e', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,.06), inset -2px -2px 0 rgba(0,0,0,.35)' }}>
              <div className="mb-3 font-pixel text-[8px] uppercase tracking-wide text-paper/50">What I was focusing on</div>
              <div className="flex flex-col gap-2">
                {topTags.map((t) => (
                  <div key={t.title} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate font-hand text-lg text-paper/80">{t.title}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-[2px]" style={{ background: '#1b1f38' }}>
                      <div
                        className="h-full rounded-[2px]"
                        style={{
                          width: `${maxTagMinutes ? Math.max(4, (t.minutes / maxTagMinutes) * 100) : 0}%`,
                          background: '#2f8f6b',
                          boxShadow: 'inset 1px 1px 0 rgba(255,255,255,.2), inset -1px -1px 0 rgba(0,0,0,.3)',
                        }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right font-pixel text-[8px] text-paper/50">{fmtDuration(t.minutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <a
            href={FOREST_PROFILE}
            target="_blank"
            rel="noreferrer"
            data-cursor="pointer"
            data-sfx="click"
            className="doodle-card inline-flex items-center gap-2 bg-paper px-5 py-2.5 font-hand text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
          >
            🌲 Grow your own forest →
          </a>
          <span className="font-hand text-sm text-paper/40">
            {live
              ? `${activeDays} focused days this year · ${stats.treesWithered.toLocaleString()} trees I let wither 🥲`
              : 'showing a sample forest — live stats are still sprouting 🌱'}
          </span>
        </div>
      </div>
    </section>
  )
}

function StatTile({ label, value, suffix, color }: { label: string; value: string; suffix: string; color: string }) {
  return (
    <div
      className="rounded-xl border-2 border-ink p-3 text-center"
      style={{ background: '#131a2e', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,.06), inset -2px -2px 0 rgba(0,0,0,.35)' }}
    >
      <div className="font-marker text-3xl font-bold leading-none" style={{ color }}>
        {value}
        <span className="font-hand text-sm text-paper/50">{suffix}</span>
      </div>
      <div className="mt-1 font-pixel text-[7px] uppercase tracking-wide text-paper/50">{label}</div>
    </div>
  )
}
