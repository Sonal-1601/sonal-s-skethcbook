// A quick doodle-confetti burst (colored pixel blocks + themed emoji) that
// arcs outward under gravity and fades. Pure DOM so it never re-renders React.

const COLORS = ['#ffd43b', '#5ce1e6', '#ff6b6b', '#b197fc', '#63e6be', '#ffa94d']
const EMOJI = ['🚀', '⭐', '🎮', '⚔️', '🪐', '✏️', '👾']

type Part = { el: HTMLElement; x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number }

export function confettiBurst(x: number, y: number, count = 36) {
  if (typeof document === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) count = Math.min(count, 10)

  const parts: Part[] = []
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    const isEmoji = Math.random() < 0.28
    if (isEmoji) {
      el.textContent = EMOJI[Math.floor(Math.random() * EMOJI.length)]
      el.style.fontSize = `${16 + Math.random() * 12}px`
    } else {
      const s = 7 + Math.random() * 7
      el.style.width = `${s}px`
      el.style.height = `${s}px`
      el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)]
      el.style.borderRadius = '2px'
    }
    el.style.cssText += `position:fixed;left:0;top:0;pointer-events:none;z-index:120;will-change:transform,opacity;`
    document.body.appendChild(el)

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1 // mostly upward
    const speed = 6 + Math.random() * 9
    parts.push({
      el,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 26,
      life: 1,
    })
  }

  let raf = 0
  const gravity = 0.42
  const step = () => {
    let alive = false
    for (const p of parts) {
      if (p.life <= 0) continue
      alive = true
      p.vy += gravity
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.life -= 0.014
      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`
      p.el.style.opacity = `${Math.max(0, p.life)}`
      if (p.life <= 0) p.el.remove()
    }
    if (alive) raf = requestAnimationFrame(step)
    else cancelAnimationFrame(raf)
  }
  raf = requestAnimationFrame(step)
}
