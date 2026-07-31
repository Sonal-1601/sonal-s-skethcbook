// ─────────────────────────────────────────────────────────────
//  Focus-forest data, pulled from the Forest app at build time.
//
//  `forest.generated.ts` is written by `npm run fetch:forest`
//  (see scripts/fetch-forest.mjs). Forest has no public API and
//  no CORS headers, so the token never touches the browser — we
//  snapshot the numbers during the build and ship static data.
//
//  If the snapshot is missing or stale-empty we fall back to a
//  deterministic sample forest, so the section always renders.
// ─────────────────────────────────────────────────────────────

import { generatedForest } from './forest.generated'

export type ForestDay = {
  date: string // YYYY-MM-DD (local)
  minutes: number // focused minutes that survived
  sessions: number // trees that made it
  dead: number // trees that withered
}

export type ForestTag = { title: string; minutes: number }

export type ForestStats = {
  totalMinutes: number
  treesGrown: number
  treesWithered: number
  longestStreak: number
  currentStreak: number
  bestDayMinutes: number
  since: string | null // YYYY-MM-DD of the very first session
}

export type ForestSnapshot = {
  generatedAt: string
  /** true when the numbers came from the real account, false for the sample forest */
  live: boolean
  stats: ForestStats
  days: ForestDay[]
  topTags: ForestTag[]
}

/* ── stats derivation (shared by the fetch script's shape) ──── */

export function computeStats(days: ForestDay[], totals?: Partial<ForestStats>): ForestStats {
  let longest = 0
  let run = 0
  let best = 0
  let summedMinutes = 0
  let grown = 0
  let withered = 0

  for (const d of days) {
    best = Math.max(best, d.minutes)
    summedMinutes += d.minutes
    grown += d.sessions
    withered += d.dead
    if (d.sessions > 0) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 0
    }
  }

  let current = 0
  for (let i = days.length - 1; i >= 0 && days[i].sessions > 0; i--) current++

  const firstActive = days.find((d) => d.sessions > 0 || d.dead > 0)

  return {
    // the account totals are authoritative when we have them — they cover
    // the full history, not just the ~1 year window we render
    totalMinutes: totals?.totalMinutes ?? summedMinutes,
    treesGrown: totals?.treesGrown ?? grown,
    treesWithered: totals?.treesWithered ?? withered,
    longestStreak: longest,
    currentStreak: current,
    bestDayMinutes: best,
    since: totals?.since ?? firstActive?.date ?? null,
  }
}

/* ── deterministic sample so the wall never looks broken ────── */

function sampleForest(): ForestSnapshot {
  const days: ForestDay[] = []
  const end = new Date()
  end.setHours(0, 0, 0, 0)

  for (let i = 364; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const seed = (i * 2654435761) % 101
    const weekday = d.getDay()
    // quieter weekends, the odd deep-work day midweek
    const bias = weekday === 0 || weekday === 6 ? 82 : 58
    const minutes = seed > bias ? 25 * (1 + (seed % 5)) : 0
    const sessions = minutes ? Math.max(1, Math.round(minutes / 25)) : 0
    const dead = seed % 23 === 0 ? 1 : 0
    days.push({ date: toISODate(d), minutes, sessions, dead })
  }

  return {
    generatedAt: new Date(0).toISOString(),
    live: false,
    stats: computeStats(days),
    days,
    topTags: [
      { title: 'Coding', minutes: 4200 },
      { title: 'Reading', minutes: 1500 },
      { title: 'Doodling', minutes: 900 },
      { title: 'Learning', minutes: 720 },
    ],
  }
}

function toISODate(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** The snapshot the site renders — real data when we have it, sample otherwise. */
export const forest: ForestSnapshot =
  generatedForest.live && generatedForest.days.length > 0 ? generatedForest : sampleForest()
