// ─────────────────────────────────────────────────────────────
//  Shared pixel-sprite renderer. Feed it a grid of characters and
//  a palette and it paints crisp SVG blocks — '.' means empty.
//  Used by the commit wall (flowers, walking Sonal) and the
//  focus forest (trees, campfire).
// ─────────────────────────────────────────────────────────────

export type SpriteDef = { rows: string[]; pal: Record<string, string> }

export function Sprite({
  rows,
  palette,
  className,
}: {
  rows: string[]
  palette: Record<string, string>
  className?: string
}) {
  const w = rows[0].length
  const h = rows.length
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }} aria-hidden="true">
      {rows.map((r, y) => r.split('').map((ch, x) => (ch === '.' ? null : <rect key={`${x}_${y}`} x={x} y={y} width={1.04} height={1.04} fill={palette[ch]} />)))}
    </svg>
  )
}
