// ─────────────────────────────────────────────────────────────
//  The Captain's Log — posts pulled from Medium at build time.
//
//  `writing.generated.ts` is written by `npm run fetch:medium`
//  (see scripts/fetch-medium.mjs). Medium's RSS feed is public but
//  sends no CORS headers, so the browser can't read it — we
//  snapshot it during the build and ship static data, same as the
//  focus forest.
//
//  Unlike the forest there is deliberately NO sample fallback:
//  inventing blog posts with fake links would be a lie. An empty
//  log just doesn't render — see CaptainsLog.tsx.
// ─────────────────────────────────────────────────────────────

import { generatedWriting } from './writing.generated'

export type Post = {
  title: string
  /** canonical Medium permalink, with the ?source=rss noise stripped */
  url: string
  /** YYYY-MM-DD, or null if Medium gave us no usable pubDate */
  date: string | null
  /** full ISO timestamp for <time datetime>, or null */
  iso: string | null
  /** first ~190 characters of prose; '' for a picture-first post */
  excerpt: string
  /** cover image URL on Medium's CDN, or null */
  cover: string | null
  tags: string[]
  /** reading time in minutes; 0 when the post has no prose to read */
  minutes: number
}

export type WritingSnapshot = {
  generatedAt: string
  /** true once a real fetch has run — false in the committed placeholder */
  live: boolean
  /** the Medium profile the posts came from */
  profile: string
  posts: Post[]
}

/** The snapshot the site renders. */
export const writing: WritingSnapshot = generatedWriting

/** Nothing to show → the section and its nav link stay out of the page. */
export const hasWriting: boolean = writing.posts.length > 0
