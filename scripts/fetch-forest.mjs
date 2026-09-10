#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  Snapshot the Forest app's focus data into src/data/forest.generated.ts
//
//  Forest (forestapp.cc) publishes no public API and sends no CORS
//  headers, so the browser can't call it directly — and the
//  remember_token is a write-capable account credential that must
//  never ship in a bundle. So we fetch at BUILD time, on a machine
//  that holds the secret, and commit/deploy static numbers.
//
//  Usage — get a token once, then snapshot as often as you like:
//    npm run fetch:forest -- --login   # sign in, write .env.local
//    npm run fetch:forest
//    npm run fetch:forest -- --probe
//  An explicit FOREST_REMEMBER_TOKEN env var wins over the file,
//  which is how CI passes the repository secret.
//
//  --probe dumps the raw API responses to scratch/forest-probe.json
//  without touching the generated file. Use it if the shapes below
//  ever drift — this is an unofficial API and can change silently.
//
//  This script NEVER fails the build. No token, dead API, changed
//  shape → it logs, leaves the existing snapshot alone, exits 0.
// ─────────────────────────────────────────────────────────────

import { writeFile, mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const API = 'https://c88fef96.forestapp.cc/api/v1'
// the official Forest Chrome extension's origin — the API expects it
const EXT_ORIGIN = 'chrome-extension://kjacjjdnoddnpbbcjilcajfhhbdhkpgk'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src/data/forest.generated.ts')
const PROBE_OUT = resolve(ROOT, 'scratch/forest-probe.json')

const WINDOW_DAYS = 365 // how much of the wall we render
const PER_PAGE = 500
const MAX_PAGES = 40 // hard stop: 20k sessions is far past any real account
const MAX_SESSION_MINUTES = 24 * 60 // ignore anything absurd

const TOKEN = process.env.FOREST_REMEMBER_TOKEN ?? readEnvLocal().FOREST_REMEMBER_TOKEN
const PROBE = process.argv.includes('--probe')
const LOGIN = process.argv.includes('--login')

// A local `.env.local` (gitignored) keeps the token out of shell history.
// CI passes the real env var instead, so this is a no-op there.
function readEnvLocal() {
  try {
    const out = {}
    for (const line of readFileSync(resolve(ROOT, '.env.local'), 'utf8').split('\n')) {
      const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
      if (!m) continue // blank line, comment, or something we don't understand
      out[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2')
    }
    return out
  } catch {
    return {} // no file is the normal case
  }
}

main()

async function main() {
  if (LOGIN) return login()

  if (!TOKEN) {
    console.log(
      '· fetch:forest — no FOREST_REMEMBER_TOKEN set, keeping the existing snapshot.\n' +
        '  (that is fine: the site falls back to a sample forest)',
    )
    return
  }

  try {
    const plants = await fetchPlants()
    if (!plants.length) throw new Error('the API returned zero sessions — token expired?')

    const [user, tags] = await Promise.all([fetchUser(plants), fetchTags()])

    if (PROBE) {
      await mkdir(dirname(PROBE_OUT), { recursive: true })
      await writeFile(
        PROBE_OUT,
        JSON.stringify({ sampleOfPlants: plants.slice(0, 3), plantCount: plants.length, user, tags }, null, 2),
      )
      console.log(`· fetch:forest — probe written to ${PROBE_OUT} (generated file untouched)`)
      return
    }

    const snapshot = buildSnapshot(plants, user, tags)
    await writeFile(OUT, render(snapshot))

    const hrs = Math.round(snapshot.stats.totalMinutes / 60)
    console.log(
      `✓ fetch:forest — ${snapshot.stats.treesGrown} trees · ${hrs}h focused · ` +
        `${snapshot.days.filter((d) => d.sessions > 0).length} active days in the last ${WINDOW_DAYS}`,
    )
  } catch (err) {
    console.warn(`· fetch:forest — skipped: ${err.message}`)
    console.warn('  keeping the previous snapshot; run with --probe to inspect the raw API.')
  }
}

/* ── API ─────────────────────────────────────────────────────── */

async function get(path) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: EXT_ORIGIN,
      Cookie: `remember_token=${TOKEN}`,
    },
  })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${res.statusText}`)
  return res.json()
}

// The endpoint's pagination scheme isn't documented. Ask for pages and
// dedupe by id — if the server ignores ?page it hands back the same rows,
// the set stops growing and we stop asking.
async function fetchPlants() {
  const byId = new Map()
  for (let page = 1; page <= MAX_PAGES; page++) {
    const raw = await get(`/plants?page=${page}&per_page=${PER_PAGE}`)
    const batch = Array.isArray(raw) ? raw : Array.isArray(raw?.plants) ? raw.plants : []
    if (!batch.length) break

    const before = byId.size
    for (const p of batch) {
      const id = p?.id ?? `${p?.start_time}|${p?.end_time}`
      if (id != null) byId.set(id, p)
    }
    if (byId.size === before) break // server ignored the page param
  }
  return [...byId.values()]
}

async function fetchUser(plants) {
  const userId = plants.find((p) => p?.user_id != null)?.user_id
  if (userId == null) return null
  try {
    return await get(`/users/${userId}`)
  } catch {
    return null // totals are a bonus; we can derive them from sessions
  }
}

async function fetchTags() {
  try {
    const raw = await get('/tags')
    return Array.isArray(raw) ? raw : Array.isArray(raw?.tags) ? raw.tags : []
  } catch {
    return []
  }
}

/* ── shaping ─────────────────────────────────────────────────── */

function buildSnapshot(plants, user, tags) {
  const today = startOfDay(new Date())
  const windowStart = new Date(today)
  windowStart.setDate(windowStart.getDate() - (WINDOW_DAYS - 1))

  // seed every day in the window so the grid has no holes
  const byDate = new Map()
  for (let d = new Date(windowStart); d <= today; d.setDate(d.getDate() + 1)) {
    byDate.set(toISODate(d), { date: toISODate(d), minutes: 0, sessions: 0, dead: 0 })
  }

  const tagMinutes = new Map()

  for (const p of plants) {
    const start = new Date(p?.start_time)
    const end = new Date(p?.end_time)
    if (isNaN(start) || isNaN(end)) continue

    const minutes = Math.round((end - start) / 60000)
    if (minutes <= 0 || minutes > MAX_SESSION_MINUTES) continue

    // a session counts as grown unless Forest marked it failed, or the
    // tree itself came back dead
    const survived = p?.is_success !== false && !p?.trees?.some?.((t) => t?.is_dead)

    if (survived && p?.tag != null) {
      tagMinutes.set(p.tag, (tagMinutes.get(p.tag) ?? 0) + minutes)
    }

    const key = toISODate(start)
    const day = byDate.get(key)
    if (!day) continue // outside the rendered window — still counted in totals below

    if (survived) {
      day.minutes += minutes
      day.sessions += 1
    } else {
      day.dead += 1
    }
  }

  const days = [...byDate.values()]

  const firstSession = plants
    .map((p) => new Date(p?.start_time))
    .filter((d) => !isNaN(d))
    .sort((a, b) => a - b)[0]

  const totals = {
    totalMinutes: pickMinutes(user, plants),
    treesGrown: numberOr(user?.health_tree_count, plants.filter((p) => p?.is_success !== false).length),
    treesWithered: numberOr(user?.dead_tree_count, plants.filter((p) => p?.is_success === false).length),
    since: firstSession ? toISODate(firstSession) : null,
  }

  return {
    generatedAt: new Date().toISOString(),
    live: true,
    stats: computeStats(days, totals),
    days,
    topTags: topTags(tagMinutes, tags),
  }
}

// Forest exposes lifetime totals on the user record — prefer them, since
// they cover the whole history rather than our 1-year window.
function pickMinutes(user, plants) {
  if (Number.isFinite(user?.total_minutes) && user.total_minutes > 0) return Math.round(user.total_minutes)
  if (Number.isFinite(user?.total_ms) && user.total_ms > 0) return Math.round(user.total_ms / 60000)
  return plants.reduce((sum, p) => {
    if (p?.is_success === false) return sum
    const m = Math.round((new Date(p?.end_time) - new Date(p?.start_time)) / 60000)
    return m > 0 && m <= MAX_SESSION_MINUTES ? sum + m : sum
  }, 0)
}

function numberOr(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function topTags(tagMinutes, tags) {
  const titleFor = new Map()
  for (const t of tags) {
    if (t?.deleted) continue
    const id = t?.tag_id ?? t?.id
    if (id != null && t?.title) titleFor.set(id, t.title)
  }
  return [...tagMinutes.entries()]
    .filter(([id]) => titleFor.has(id))
    .map(([id, minutes]) => ({ title: titleFor.get(id), minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5)
}

// Mirrors computeStats() in src/data/forest.ts — kept in sync by hand
// because this script runs in plain Node, before any TS build step.
function computeStats(days, totals) {
  let longest = 0
  let run = 0
  let best = 0

  for (const d of days) {
    best = Math.max(best, d.minutes)
    if (d.sessions > 0) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 0
    }
  }

  let current = 0
  for (let i = days.length - 1; i >= 0 && days[i].sessions > 0; i--) current++

  return {
    totalMinutes: totals.totalMinutes,
    treesGrown: totals.treesGrown,
    treesWithered: totals.treesWithered,
    longestStreak: longest,
    currentStreak: current,
    bestDayMinutes: best,
    since: totals.since,
  }
}

/* ── emit ────────────────────────────────────────────────────── */

function render(snapshot) {
  const day = (d) => `  { date: '${d.date}', minutes: ${d.minutes}, sessions: ${d.sessions}, dead: ${d.dead} },`
  const tag = (t) => `  { title: ${JSON.stringify(t.title)}, minutes: ${t.minutes} },`

  return `// ─────────────────────────────────────────────────────────────
//  GENERATED FILE — do not edit by hand.
//  Written by \`npm run fetch:forest\` (scripts/fetch-forest.mjs)
//  from the Forest app account, at ${snapshot.generatedAt}.
// ─────────────────────────────────────────────────────────────

import type { ForestSnapshot } from './forest'

const days: ForestSnapshot['days'] = [
${snapshot.days.map(day).join('\n')}
]

const topTags: ForestSnapshot['topTags'] = [
${snapshot.topTags.map(tag).join('\n')}
]

export const generatedForest: ForestSnapshot = {
  generatedAt: '${snapshot.generatedAt}',
  live: true,
  stats: {
    totalMinutes: ${snapshot.stats.totalMinutes},
    treesGrown: ${snapshot.stats.treesGrown},
    treesWithered: ${snapshot.stats.treesWithered},
    longestStreak: ${snapshot.stats.longestStreak},
    currentStreak: ${snapshot.stats.currentStreak},
    bestDayMinutes: ${snapshot.stats.bestDayMinutes},
    since: ${snapshot.stats.since ? `'${snapshot.stats.since}'` : 'null'},
  },
  days,
  topTags,
}
`
}

/* ── login ───────────────────────────────────────────────────── */

// Forest's remember_token is what the Chrome extension keeps in a cookie.
// Rather than making you dig it out of DevTools, trade the account
// password for one here — the password is read straight into the request
// and never written anywhere, only the returned token is persisted.
async function login() {
  const email = process.env.FOREST_EMAIL ?? (await ask('Forest email: '))
  const password = process.env.FOREST_PASSWORD ?? (await ask('Forest password: ', { silent: true }))

  if (!email || !password) {
    console.error('· fetch:forest --login — need both an email and a password.')
    return
  }

  const res = await fetch(`${API}/sessions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: EXT_ORIGIN,
    },
    body: JSON.stringify({ session: { email, password } }),
  })

  const text = await res.text()
  const body = safeParse(text)

  if (!res.ok) {
    console.error(`· fetch:forest --login — POST /sessions → ${res.status} ${res.statusText}`)
    console.error(`  ${text.slice(0, 400)}`)
    return
  }

  // This is an unofficial API, so don't assume where the token sits.
  const token = body?.remember_token ?? body?.user?.remember_token ?? body?.session?.remember_token

  if (!token) {
    console.error('· fetch:forest --login — signed in, but no remember_token in the response.')
    console.error(`  top-level keys: ${Object.keys(body ?? {}).join(', ') || '(none)'}`)
    console.error('  the shape may have drifted — paste those keys and we can re-point this.')
    return
  }

  await saveToken(token)
}

function safeParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// Rewrite in place if the key is already there, otherwise append, so
// running --login twice doesn't leave two conflicting tokens behind.
async function saveToken(token) {
  const path = resolve(ROOT, '.env.local')
  const line = `FOREST_REMEMBER_TOKEN=${token}`

  let existing = ''
  try {
    existing = readFileSync(path, 'utf8')
  } catch {
    existing = '' // first run, no file yet
  }

  const next = /^FOREST_REMEMBER_TOKEN=.*$/m.test(existing)
    ? existing.replace(/^FOREST_REMEMBER_TOKEN=.*$/m, line)
    : `${existing.replace(/\s*$/, '')}\n${line}\n`.replace(/^\n/, '')

  await writeFile(path, next)
  console.log('✓ fetch:forest --login — token saved to .env.local (gitignored).')
  console.log('  next: npm run fetch:forest')
}

function ask(label, { silent = false } = {}) {
  return new Promise((res) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    // Suppress the echo so a password never lands in the terminal scrollback.
    if (silent) rl._writeToOutput = (s) => (s.includes(label) ? process.stdout.write(label) : undefined)
    rl.question(label, (answer) => {
      rl.close()
      if (silent) process.stdout.write('\n')
      res(answer.trim())
    })
  })
}

/* ── dates ───────────────────────────────────────────────────── */

function startOfDay(d) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function toISODate(d) {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
