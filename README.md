# ✏️ Sonal's Sketchbook Portfolio

A hand-drawn, game-inspired **space sketchbook** portfolio for Sonal Pandey —
software developer, doodler & space explorer. Crayon-textured lettering, a
twinkling starfield, a doodle cursor, and storytelling that plays out like a
game: _Press Start → Story → Inventory → Quests → Side Quests → Final Level._

Themes woven throughout: 🪐 space · ⛏️ Minecraft · ⚔️ Star Wars · 🐛 Hollow Knight.

## 🎮 The vibe

- **Crayon / marker lettering** via `Caveat` + `Kalam` fonts, roughened with an SVG
  turbulence-displacement filter so every heading has a waxy hand-drawn edge.
- **Animated scribbles** — headings underline themselves as you scroll, and the
  About story is annotated live with [rough-notation](https://roughnotation.com/)
  (underline, highlight, box, circle).
- **A doodle space scene** with a parallax astronaut, orbiting game doodles, a
  twinkling canvas starfield and the occasional shooting star.
- **A doodle cursor** (pencil + dashed ring) that pops a sparkle burst on click.
- **Game HUD storytelling** — a Minecraft-style inventory/hotbar for skills and
  themed "quest" cards for projects.
- Fully **responsive**, **keyboard/anchor navigable**, and respects
  `prefers-reduced-motion`.

## 🧰 Tech stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Motion | Framer Motion |
| Sketch FX | rough.js / react-rough-notation + custom SVG filters |

## 🚀 Getting started

```bash
npm install      # install deps
npm run dev      # start dev server → http://localhost:5173
npm run build    # typecheck + production build to /dist
npm run preview  # preview the production build
```

## ✍️ Editing content

**Everything lives in one file:** [`src/data/portfolio.ts`](src/data/portfolio.ts).
Update the profile, about story, projects, skills, fun facts and social links
there — no component changes needed.

> ⚠️ **Set your real contact email** in `socials.email` (currently a placeholder).

Want to tweak the look? The design tokens (colors, fonts, animations) are in
[`tailwind.config.js`](tailwind.config.js); the crayon SVG filters are in
[`src/components/SvgDefs.tsx`](src/components/SvgDefs.tsx).

## 🌲 The focus forest

The **My Focus Forest** section mirrors real focus data from the
[Forest](https://www.forestapp.cc/) app — hours focused, trees grown, streaks
and what the time went into.

Forest publishes **no public API and no data export**, and its internal API
sends **no CORS headers**, so the browser can't call it the way the commit wall
calls GitHub. On top of that, `remember_token` is a long-lived, *write-capable*
account credential — anything in a Vite bundle is public, so it can never ship
to the client.

So the data is snapshotted at **build time** instead. Put the token in
`.env.local` (gitignored, and it keeps the credential out of your shell
history):

```bash
echo 'FOREST_REMEMBER_TOKEN=xxx' >> .env.local
npm run fetch:forest
```

An explicit `FOREST_REMEMBER_TOKEN=xxx npm run fetch:forest` still works and
takes precedence — that's how CI passes the repository secret.

That writes [`src/data/forest.generated.ts`](src/data/forest.generated.ts),
which the site imports as plain static data. `npm run build` runs it
automatically via `prebuild`.

**Getting your token** — install the official
[Forest Chrome extension](https://chromewebstore.google.com/detail/kjacjjdnoddnpbbcjilcajfhhbdhkpgk),
sign in, open DevTools → Network, plant a tree, find the request to
`c88fef96.forestapp.cc/api/v1/plants` and copy the `remember_token` cookie.
Keep it out of git — it's an account credential.

**Keeping it fresh** — [`.github/workflows/refresh-forest.yml`](.github/workflows/refresh-forest.yml)
re-snapshots daily and commits the result. Add `FOREST_REMEMBER_TOKEN` as a
repository secret to switch it on.

> ⚠️ This is an **unofficial** API and can change without notice. Every failure
> path — no token, dead endpoint, changed response shape, expired session — is
> non-fatal: the fetch script logs and exits 0, and the section falls back to a
> deterministic sample forest so the page never breaks. If the shape ever
> drifts, `npm run fetch:forest -- --probe` dumps the raw responses to
> `scratch/forest-probe.json` without touching the generated file.

## 🪶 The captain's log

The **Captain's Log** section tears Sonal's [Medium](https://medium.com/@pandeysonal1601)
posts out as pages of a notebook — entry number, date, reading time, the cover
image taped on as a clipping.

Medium's RSS feed is public, but like Forest it sends **no CORS headers**, so the
browser can't read it from the page. Same answer: snapshot it at build time.
Unlike Forest there's no credential involved, so there's nothing to configure —
the script just runs:

```bash
npm run fetch:medium
npm run fetch:medium -- --probe   # dump the raw feed to scratch/medium-probe.json
```

That writes [`src/data/writing.generated.ts`](src/data/writing.generated.ts), which
the site imports as plain static data. `npm run build` runs it automatically via
`prebuild`. `MEDIUM_FEED_URL` overrides the feed if the handle ever changes.

**Keeping it fresh** — [`.github/workflows/refresh-writing.yml`](.github/workflows/refresh-writing.yml)
re-snapshots daily and commits only when something actually changed (the script
compares everything but its own timestamp, so a quiet day is a no-op rather than
a daily empty commit).

> There is deliberately **no sample fallback** here. A fake forest is harmless;
> fake blog posts with fake links are a lie. If the log is empty — nothing
> published yet, or the feed was unreachable on the last build — the section and
> its nav link simply don't render. A post with no prose (Medium lets you publish
> a picture-first entry) just shows without an excerpt or a reading time.

## 🔎 SEO, social cards & AEO

Everything is generated at build time from **one file**:
[`src/data/site.ts`](src/data/site.ts). Change `url` there and the canonical
tag, `og:url`, sitemap, robots and `llms.txt` all follow — they can't drift.

| Output | Where it comes from |
|---|---|
| `<head>` meta, Open Graph, Twitter card | `index.html` + `__SITE_*__` tokens |
| JSON-LD (`Person`, `WebSite`, `ProfilePage`, project + writing `ItemList`) | built from the real `projects` / `skills` / Medium data |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/site.webmanifest` | emitted into `dist/` by the `seo()` plugin |
| `/og.png`, `/apple-touch-icon.png` | `npm run make:og` (committed, not rebuilt each time) |

**The share card** — [`scripts/og-template.html`](scripts/og-template.html) is a
normal HTML page rendered to a 1200×630 PNG by headless Chrome. Edit it, run
`npm run make:og`, done. The URL printed on the card is hardcoded there, so
update it if the domain changes.

**AEO** — `/llms.txt` gives answer engines a clean, quotable markdown summary
instead of asking them to scrape a JavaScript app, and `robots.txt` explicitly
welcomes `GPTBot`, `ClaudeBot`, `PerplexityBot`, `OAI-SearchBot` and friends.
Flip those to `Disallow` if you'd rather not be quoted.

> ⚠️ This is a **client-rendered** app, so crawlers that don't execute
> JavaScript see an empty `<div id="root">`. Google renders JS; many AI
> crawlers don't. The `<noscript>` block in `index.html` and `/llms.txt` cover
> that gap. If you ever want it airtight, add a prerender step that bakes the
> rendered HTML into `dist/index.html` at build time.

## 🌍 Deploy

The build is a static site in `dist/` — drop it on any static host.

**Firebase Hosting** (you already use `*.web.app`):

```bash
npm run build
npx firebase-tools deploy   # after `firebase init hosting` → public dir: dist
```

Or Netlify / Vercel / GitHub Pages — build command `npm run build`, output `dist`.

---

_Designed, coded & doodled with too much coffee. May the code be with you._ ✦
