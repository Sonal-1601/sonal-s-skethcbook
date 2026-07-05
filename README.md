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
