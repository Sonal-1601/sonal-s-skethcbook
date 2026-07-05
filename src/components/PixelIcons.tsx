// ─────────────────────────────────────────────────────────────
//  Pixel-art tool icons, Minecraft-item style. Each icon is a small
//  grid of colored blocks (or a pixel-font letter mark for JS/TS),
//  rendered as crisp SVG rects. Keyed by the exact skill name.
// ─────────────────────────────────────────────────────────────

type GridDef = { type: 'grid'; palette: Record<string, string>; rows: string[] }
type TextDef = { type: 'text'; bg: string; fg: string; label: string }
type Def = GridDef | TextDef

const FLUTTER: GridDef = {
  type: 'grid',
  palette: { L: '#54c5f8', D: '#1a6fc4' },
  rows: [
    '............',
    '.........LL.',
    '........LLL.',
    '.......LLL..',
    '......LLL...',
    '.....LLL....',
    '....LLL.....',
    '...LLL...DD.',
    '....LLL.DDD.',
    '.....LLLDD..',
    '......LDD...',
    '.......D....',
  ],
}

const DART: GridDef = {
  type: 'grid',
  palette: { T: '#27c7bd', D: '#0b7d76' },
  rows: [
    '......T.....',
    '.....TTT....',
    '....TTTTT...',
    '...TT.T.TT..',
    '..T...T...T.',
    '......T.....',
    '......T.....',
    '.....DTD....',
    '....D.T.D...',
    '...D..T..D..',
    '......T.....',
    '............',
  ],
}

const NODE: GridDef = {
  type: 'grid',
  palette: { g: '#68a05b' },
  rows: [
    '............',
    '.....gg.....',
    '....gggg....',
    '...gggggg...',
    '..gggggggg..',
    '.gggggggggg.',
    '.gggggggggg.',
    '..gggggggg..',
    '...gggggg...',
    '....gggg....',
    '.....gg.....',
    '............',
  ],
}

const REACT: GridDef = {
  type: 'grid',
  palette: { c: '#61dafb' },
  rows: [
    '............',
    '............',
    '...cccccc...',
    '..c......c..',
    '.c........c.',
    '.c...cc...c.',
    '.c...cc...c.',
    '.c........c.',
    '..c......c..',
    '...cccccc...',
    '............',
    '............',
  ],
}

const FIREBASE: GridDef = {
  type: 'grid',
  palette: { y: '#ffd54a', o: '#ffa41c', r: '#f5820a' },
  rows: [
    '......o.....',
    '.....oo.....',
    '....orro....',
    '....orro....',
    '...orrrro...',
    '..orryyrro..',
    '..oryyyyro..',
    '..oryyyyro..',
    '..orryyrro..',
    '...oorroo...',
    '....oooo....',
    '............',
  ],
}

const GIT: GridDef = {
  type: 'grid',
  palette: { R: '#f14e32' },
  rows: [
    '............',
    '...RR....RR.',
    '...RR....RR.',
    '...RR....RR.',
    '....RR..RR..',
    '.....RRRR...',
    '......RR....',
    '......RR....',
    '......RR....',
    '.....RRRR...',
    '....RR..RR..',
    '............',
  ],
}

const FIGMA: GridDef = {
  type: 'grid',
  palette: { R: '#f24e1e', O: '#ff7262', P: '#a259ff', B: '#1abcfe', G: '#0acf83' },
  rows: [
    '..RRRR.OOOO.',
    '..RRRR.OOOO.',
    '..RRRR.OOOO.',
    '..RRRR.OOOO.',
    '..PPPP.BBBB.',
    '..PPPP.BBBB.',
    '..PPPP.BBBB.',
    '..PPPP.BBBB.',
    '..GGGG......',
    '..GGGG......',
    '..GGGG......',
    '..GGGG......',
  ],
}

export const PIXEL: Record<string, Def> = {
  Flutter: FLUTTER,
  Dart: DART,
  JavaScript: { type: 'text', bg: '#f7df1e', fg: '#101223', label: 'JS' },
  'Node.js': NODE,
  React: REACT,
  TypeScript: { type: 'text', bg: '#3178c6', fg: '#ffffff', label: 'TS' },
  Firebase: FIREBASE,
  Git: GIT,
  Figma: FIGMA,
}

export function PixelIcon({ name, className }: { name: string; className?: string }) {
  const def = PIXEL[name]
  if (!def) return null

  if (def.type === 'text') {
    return (
      <svg className={className} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
        <rect width="16" height="16" fill={def.bg} />
        <text
          x="8"
          y="11.2"
          textAnchor="middle"
          fontFamily="'Press Start 2P', monospace"
          fontSize="6.4"
          fill={def.fg}
        >
          {def.label}
        </text>
      </svg>
    )
  }

  const w = def.rows[0].length
  const h = def.rows.length
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden="true"
    >
      {def.rows.map((row, y) =>
        row.split('').map((ch, x) =>
          ch === '.' ? null : (
            <rect key={`${x}_${y}`} x={x} y={y} width={1.03} height={1.03} fill={def.palette[ch]} />
          ),
        ),
      )}
    </svg>
  )
}
