#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  Snapshot the Medium feed into src/data/writing.generated.ts
//
//  Medium's RSS feed is public, but it sends no CORS headers, so
//  the browser can't read it any more than it can read Forest —
//  a fetch() from the page is blocked before it starts. So we
//  read it at BUILD time and ship static data. (Unlike Forest
//  there's no credential involved: this is a public feed, so the
//  script needs no token and always runs.)
//
//  Usage:
//    npm run fetch:medium
//    npm run fetch:medium -- --probe
//  MEDIUM_FEED_URL overrides the feed if the handle ever changes.
//
//  --probe dumps the raw XML and the parsed posts to
//  scratch/medium-probe.json without touching the generated file.
//  Use it if Medium's markup drifts — this is a generated feed and
//  the HTML inside <content:encoded> is not a contract.
//
//  This script NEVER fails the build. Feed down, handle typo'd,
//  markup changed → it logs, leaves the existing snapshot alone,
//  exits 0. An empty log simply doesn't render (see writing.ts).
// ─────────────────────────────────────────────────────────────

import { writeFile, readFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HANDLE = '@pandeysonal1601'
const FEED = process.env.MEDIUM_FEED_URL ?? `https://medium.com/feed/${HANDLE}`
const PROFILE = `https://medium.com/${HANDLE}`

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src/data/writing.generated.ts')
const PROBE_OUT = resolve(ROOT, 'scratch/medium-probe.json')

const MAX_POSTS = 6 // how many pages we tear out of the notebook
const EXCERPT_CHARS = 190
const WORDS_PER_MINUTE = 265 // Medium's own reading-speed constant
const TIMEOUT_MS = 20_000

const PROBE = process.argv.includes('--probe')

main()

async function main() {
  try {
    const xml = await fetchFeed()
    const posts = parseItems(xml)

    if (PROBE) {
      await mkdir(dirname(PROBE_OUT), { recursive: true })
      await writeFile(PROBE_OUT, JSON.stringify({ feed: FEED, bytes: xml.length, posts, xml }, null, 2))
      console.log(`· fetch:medium — probe written to ${PROBE_OUT} (generated file untouched)`)
      return
    }

    if (!posts.length) throw new Error('the feed had no readable <item> entries — wrong handle, or Medium changed the shape?')

    const snapshot = {
      generatedAt: new Date().toISOString(),
      live: true,
      profile: PROFILE,
      posts: posts.slice(0, MAX_POSTS),
    }
    const next = render(snapshot)

    // Only the timestamp moves on a quiet day. Rewriting the file anyway
    // would hand the daily refresh workflow a diff to commit every single
    // morning, so compare everything *except* the timestamps and skip.
    const prev = await readFile(OUT, 'utf8').catch(() => '')
    if (prev && undated(prev) === undated(next)) {
      console.log(`· fetch:medium — nothing new in the log (${snapshot.posts.length} entries), snapshot untouched`)
      return
    }

    await writeFile(OUT, next)

    console.log(
      `✓ fetch:medium — ${snapshot.posts.length} post${snapshot.posts.length === 1 ? '' : 's'} · ` +
        `latest: "${snapshot.posts[0].title}" (${snapshot.posts[0].date ?? 'undated'})`,
    )
  } catch (err) {
    console.warn(`· fetch:medium — skipped: ${err.message}`)
    console.warn('  keeping the previous snapshot; run with --probe to inspect the raw feed.')
  }
}

/* ── fetch ───────────────────────────────────────────────────── */

async function fetchFeed() {
  const res = await fetch(FEED, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`GET ${FEED} → ${res.status} ${res.statusText}`)
  return res.text()
}

/* ── parsing ─────────────────────────────────────────────────── */
//  A hand-rolled reader rather than an XML dependency: the feed is
//  one machine-generated shape, and every field below is optional
//  as far as this script is concerned — a post missing its cover or
//  its prose still renders.

function parseItems(xml) {
  const items = []
  const re = /<item>([\s\S]*?)<\/item>/g
  let m

  while ((m = re.exec(xml))) {
    const block = m[1]

    const title = clean(tag(block, 'title'))
    const url = tidyUrl(clean(tag(block, 'link')))
    if (!title || !url) continue // nothing to link to, nothing to show

    const published = new Date(clean(tag(block, 'pubDate')))
    const dated = !Number.isNaN(published.getTime())

    const html = tag(block, 'content:encoded')
    // figures first: a caption is not an excerpt
    const prose = clean(stripTags(html.replace(/<figure[\s\S]*?<\/figure>/gi, ' ')))
    const words = prose ? prose.split(/\s+/).length : 0

    items.push({
      title,
      url,
      iso: dated ? published.toISOString() : null,
      date: dated ? toISODate(published) : null,
      excerpt: excerpt(prose),
      cover: firstImage(html),
      tags: categories(block),
      // Medium's own estimate. A picture-first post gets 0 and the
      // card just doesn't claim a reading time.
      minutes: words ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0,
    })
  }

  // newest first — the feed already is, but don't rely on it
  return items.sort((a, b) => (b.iso ?? '').localeCompare(a.iso ?? ''))
}

/** First `<name>…</name>` in a block, CDATA unwrapped. '' when absent. */
function tag(block, name) {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i').exec(block)
  if (!m) return ''
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1')
}

function categories(block) {
  const out = []
  const re = /<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi
  let m
  while ((m = re.exec(block))) {
    const t = clean(m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1'))
    if (t) out.push(t)
  }
  return out.slice(0, 4)
}

/** The post's cover: the first real image, skipping Medium's 1×1 view-counter pixel. */
function firstImage(html) {
  const re = /<img\b[^>]*>/gi
  let m
  while ((m = re.exec(html))) {
    const el = m[0]
    if (/\/_\/stat\b/.test(el) || /\bwidth=["']?1["']?/.test(el)) continue
    const src = /\bsrc=["']([^"']+)["']/i.exec(el)?.[1]
    if (src) return decodeEntities(src)
  }
  return null
}

function stripTags(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|br|blockquote)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
}

function clean(s) {
  return decodeEntities(s).replace(/\s+/g, ' ').trim()
}

function excerpt(prose) {
  if (prose.length <= EXCERPT_CHARS) return prose
  const cut = prose.slice(0, EXCERPT_CHARS)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}…`
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&') // last, so &amp;lt; survives as &lt;
}

/** Drop Medium's `?source=rss-…` referral noise from the permalink. */
function tidyUrl(raw) {
  try {
    const u = new URL(raw)
    u.search = ''
    u.hash = ''
    return u.toString()
  } catch {
    return raw
  }
}

function toISODate(d) {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** The same file with both timestamps blanked, for change detection. */
function undated(src) {
  return src.replace(/^\/\/  from .*$/m, '').replace(/generatedAt: '[^']*'/, '')
}

/* ── emit ────────────────────────────────────────────────────── */

function render(snapshot) {
  const post = (p) => `  {
    title: ${JSON.stringify(p.title)},
    url: ${JSON.stringify(p.url)},
    date: ${p.date ? JSON.stringify(p.date) : 'null'},
    iso: ${p.iso ? JSON.stringify(p.iso) : 'null'},
    excerpt: ${JSON.stringify(p.excerpt)},
    cover: ${p.cover ? JSON.stringify(p.cover) : 'null'},
    tags: ${JSON.stringify(p.tags)},
    minutes: ${p.minutes},
  },`

  return `// ─────────────────────────────────────────────────────────────
//  GENERATED FILE — do not edit by hand.
//  Written by \`npm run fetch:medium\` (scripts/fetch-medium.mjs)
//  from ${FEED}, at ${snapshot.generatedAt}.
// ─────────────────────────────────────────────────────────────

import type { WritingSnapshot } from './writing'

const posts: WritingSnapshot['posts'] = [
${snapshot.posts.map(post).join('\n')}
]

export const generatedWriting: WritingSnapshot = {
  generatedAt: '${snapshot.generatedAt}',
  live: true,
  profile: '${snapshot.profile}',
  posts,
}
`
}
