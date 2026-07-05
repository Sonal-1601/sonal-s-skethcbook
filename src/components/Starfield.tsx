import { useEffect, useRef } from 'react'

type Star = { x: number; y: number; r: number; tw: number; hue: string }
type Shooter = { x: number; y: number; vx: number; vy: number; life: number }

const HUES = ['#ffffff', '#ffd43b', '#74c0fc', '#b197fc', '#5ce1e6']

// A fixed, full-viewport twinkling starfield with the occasional shooting star.
// Deep-space backdrop that dark sections sit on and cream sections cover.
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let stars: Star[] = []
    let shooters: Shooter[] = []
    let raf = 0
    let t = 0
    // Deterministic-ish pseudo random (Date.* is fine in the browser)
    const rnd = () => Math.random()

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(160, Math.floor((window.innerWidth * window.innerHeight) / 9000))
      stars = Array.from({ length: count }, () => ({
        x: rnd() * window.innerWidth,
        y: rnd() * window.innerHeight,
        r: rnd() * 1.6 + 0.4,
        tw: rnd() * Math.PI * 2,
        hue: HUES[Math.floor(rnd() * HUES.length)],
      }))
    }

    const draw = () => {
      t += 0.016
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (const s of stars) {
        const a = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.6 + s.tw))
        ctx.globalAlpha = a
        ctx.fillStyle = s.hue
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Spawn a shooting star occasionally
      if (!reduce && rnd() < 0.006 && shooters.length < 2) {
        const startX = rnd() * window.innerWidth
        shooters.push({ x: startX, y: -20, vx: -3 - rnd() * 2, vy: 4 + rnd() * 2, life: 1 })
      }
      shooters = shooters.filter((sh) => sh.life > 0)
      for (const sh of shooters) {
        sh.x += sh.vx
        sh.y += sh.vy
        sh.life -= 0.012
        const len = 60
        const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * len * 0.25, sh.y - sh.vy * len * 0.25)
        grad.addColorStop(0, `rgba(255,255,255,${sh.life})`)
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.strokeStyle = grad
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(sh.x, sh.y)
        ctx.lineTo(sh.x - sh.vx * 6, sh.y - sh.vy * 6)
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }

    build()
    if (reduce) {
      // Static frame only
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (const s of stars) {
        ctx.globalAlpha = 0.7
        ctx.fillStyle = s.hue
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      raf = requestAnimationFrame(draw)
    }

    const onResize = () => build()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
}
