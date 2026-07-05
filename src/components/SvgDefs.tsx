// Global SVG filter defs. Mounted once; referenced via CSS `filter: url(#id)`.
// These give text + strokes a rough, waxy "crayon on paper" edge.
export default function SvgDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        <filter id="crayon-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="crayon-soft">
          <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Subtle paper grain used behind sketch pages */}
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0" />
        </filter>
      </defs>
    </svg>
  )
}
