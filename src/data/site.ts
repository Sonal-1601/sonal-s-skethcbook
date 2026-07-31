// ─────────────────────────────────────────────────────────────
//  Single source of truth for everything SEO / social / AEO.
//
//  ⚠️ `url` is the ONE value to change if the site lives somewhere
//  else. It feeds the canonical tag, og:url, the OG image URL,
//  sitemap.xml, robots.txt, llms.txt and the JSON-LD — all generated
//  from here by the `seo()` plugin in vite.config.ts, so they can't
//  drift apart. No trailing slash.
//
//  The one thing it does NOT reach is the URL *printed inside* the
//  share card, which is baked into scripts/og-template.html. If you
//  change the domain, edit that line too and run `npm run make:og`.
// ─────────────────────────────────────────────────────────────

export const SITE = {
  url: 'https://sonal-s-skethcbook.vercel.app',
  name: "Sonal's Sketchbook",
  title: 'Sonal Pandey — Flutter & Software Developer · Doodler · Space Nerd',
  // ~155 chars: what search engines and answer engines quote
  description:
    'Sonal Pandey is a software developer in India specialising in Flutter & Dart mobile apps, plus Node.js and React. A hand-drawn, game-inspired portfolio.',
  // shorter, punchier — used for link previews in chat apps
  socialDescription:
    'Flutter & Dart developer who builds mobile apps that feel good to use — wrapped in a hand-drawn, game-inspired space sketchbook.',
  ogImage: '/og.png',
  ogImageAlt:
    "Sonal's Sketchbook — Sonal Pandey, software developer, doodler and space explorer",
  locale: 'en_US',
  themeColor: '#0a0b1a',
} as const
