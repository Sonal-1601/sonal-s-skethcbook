import { useEffect, useRef, useState } from 'react'

// A doodle cursor: a pencil tip that trails fading ink dots, and pops a
// little sparkle burst on click. Only active on fine pointers (desktop).
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!fine) return
    setEnabled(true)
    document.body.classList.add('doodle-cursor')

    let rx = window.innerWidth / 2
    let ry = window.innerHeight / 2
    let mx = rx
    let my = ry
    let raf = 0

    const move = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (dot.current) dot.current.style.transform = `translate(${mx}px, ${my}px)`
      const el = e.target as HTMLElement
      setHover(!!el.closest('a, button, [data-cursor="grab"]'))
    }
    const loop = () => {
      rx += (mx - rx) * 0.18
      ry += (my - ry) * 0.18
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`
      raf = requestAnimationFrame(loop)
    }
    const burst = (e: MouseEvent) => spawnBurst(e.clientX, e.clientY)

    window.addEventListener('mousemove', move)
    window.addEventListener('mousedown', burst)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mousedown', burst)
      document.body.classList.remove('doodle-cursor')
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      {/* Following ring (crayon circle) */}
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[100] -ml-4 -mt-4"
        style={{ willChange: 'transform' }}
      >
        <div
          className="rounded-full border-2 transition-all duration-200"
          style={{
            width: hover ? 44 : 30,
            height: hover ? 44 : 30,
            borderColor: hover ? '#ffd43b' : '#5ce1e6',
            borderStyle: 'dashed',
            opacity: hover ? 0.95 : 0.7,
          }}
        />
      </div>
      {/* Pencil tip */}
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[101]"
        style={{ willChange: 'transform' }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" className="-ml-1 -mt-1 rotate-[8deg]" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.4))' }}>
          <path d="M4 20l1-3.6L15 6l3 3L8 19l-4 1Z" fill="#ffd43b" stroke="#101223" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M14 7l3 3" stroke="#101223" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M4 20l3-1" stroke="#101223" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    </>
  )
}

// Fire a short-lived sparkle burst at (x, y) using plain DOM so it never re-renders React.
function spawnBurst(x: number, y: number) {
  const colors = ['#ffd43b', '#5ce1e6', '#ff6b6b', '#b197fc', '#63e6be']
  const n = 7
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span')
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5
    const dist = 18 + Math.random() * 22
    s.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:7px;height:7px;border-radius:2px;
      background:${colors[i % colors.length]};pointer-events:none;z-index:99;transform:translate(-50%,-50%) rotate(${Math.random() * 90}deg);
      transition:transform .55s cubic-bezier(.2,.8,.3,1), opacity .55s ease;`
    document.body.appendChild(s)
    requestAnimationFrame(() => {
      s.style.transform = `translate(${Math.cos(angle) * dist - 4}px, ${Math.sin(angle) * dist - 4}px) scale(0) rotate(180deg)`
      s.style.opacity = '0'
    })
    setTimeout(() => s.remove(), 600)
  }
}
