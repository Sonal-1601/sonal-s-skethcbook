// A doodle astronaut (our hero!) mid-wave. Floats above the planet in the
// Hero, and drifts off untethered on the 404 page.
export default function Astronaut({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={className} fill="none" aria-hidden="true">
      <g stroke="#101223" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {/* backpack + body */}
        <path d="M74 150c-4-16-3-34 6-46 5-7 14-11 20-11s15 4 20 11c9 12 10 30 6 46" fill="#fbf6e9" />
        {/* helmet */}
        <circle cx="100" cy="78" r="34" fill="#fbf6e9" />
        <path d="M78 74c2-13 12-21 22-21" stroke="#5ce1e6" strokeWidth="4" />
        {/* visor */}
        <ellipse cx="100" cy="80" rx="22" ry="20" fill="#101223" />
        <circle cx="92" cy="74" r="4" fill="#5ce1e6" stroke="none" />
        <circle cx="108" cy="84" r="2.5" fill="#ffd43b" stroke="none" />
        {/* waving arm */}
        <path d="M124 120c10-4 18-14 20-26" fill="#fbf6e9" />
        <circle cx="146" cy="90" r="6" fill="#ff6b6b" />
        {/* other arm */}
        <path d="M76 120c-8-2-14-8-16-16" fill="#fbf6e9" />
        <circle cx="58" cy="102" r="6" fill="#ff6b6b" />
        {/* legs */}
        <path d="M88 150l-4 26M112 150l4 26" />
        <circle cx="83" cy="180" r="6" fill="#b197fc" />
        <circle cx="117" cy="180" r="6" fill="#b197fc" />
        {/* chest badge */}
        <circle cx="100" cy="128" r="6" fill="#ffd43b" />
      </g>
    </svg>
  )
}
