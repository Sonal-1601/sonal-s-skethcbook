import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { sound } from '../audio/engine'

// ── "DEBUG ARENA" — a lightsaber bug-slaying mini-game (devs vs bugs). ──

type Bug = { x: number; y: number; vx: number; vy: number; r: number; wob: number; gold: boolean; dead: boolean }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
type Floater = { x: number; y: number; life: number; text: string; color: string }
type Phase = 'intro' | 'playing' | 'over'

const ROUND = 30 // seconds
const SABER = '#63e6be'

type Game = {
  phase: Phase
  score: number
  time: number
  bugs: Bug[]
  parts: Particle[]
  floats: Floater[]
  mx: number
  my: number
  px: number
  py: number
  trail: { x: number; y: number }[]
  spawnAt: number
  lastSwing: number
}

function rankFor(score: number) {
  if (score >= 50) return 'BUG WHISPERER 🐛✨'
  if (score >= 34) return '10× DEV ⚡'
  if (score >= 20) return 'SENIOR DEV 🛠️'
  if (score >= 10) return 'JUNIOR DEV 🌱'
  return 'INTERN — keep debugging! ☕'
}

export default function BugArena({ open, onClose }: { open: boolean; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const g = useRef<Game>({
    phase: 'intro', score: 0, time: ROUND, bugs: [], parts: [], floats: [],
    mx: 0, my: 0, px: 0, py: 0, trail: [], spawnAt: 0, lastSwing: 0,
  })
  const [phase, setPhase] = useState<Phase>('intro')
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(ROUND)
  const [best, setBest] = useState(0)

  useEffect(() => {
    setBest(Number(localStorage.getItem('sonal.bughunt.best') || 0))
  }, [])

  // reset to intro each time it opens; lock body scroll + hide doodle cursor
  useEffect(() => {
    if (!open) return
    g.current.phase = 'intro'
    setPhase('intro')
    setScore(0)
    setTime(ROUND)
    document.body.classList.add('game-mode')
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sound.unlock()
    return () => {
      document.body.classList.remove('game-mode')
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // the canvas game loop, alive while open
  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const W = () => window.innerWidth
    const H = () => window.innerHeight
    g.current.mx = W() / 2
    g.current.my = H() / 2

    const spawnBug = () => {
      const s = g.current
      const edge = Math.floor(Math.random() * 4)
      const w = W(), h = H()
      let x = 0, y = 0
      if (edge === 0) { x = Math.random() * w; y = -30 }
      else if (edge === 1) { x = w + 30; y = Math.random() * h }
      else if (edge === 2) { x = Math.random() * w; y = h + 30 }
      else { x = -30; y = Math.random() * h }
      const tx = w * (0.3 + Math.random() * 0.4)
      const ty = h * (0.3 + Math.random() * 0.4)
      const ang = Math.atan2(ty - y, tx - x)
      const speed = 40 + Math.random() * 60 + (ROUND - s.time) * 2
      s.bugs.push({
        x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
        r: 16 + Math.random() * 8, wob: Math.random() * 6, gold: Math.random() < 0.12, dead: false,
      })
    }

    const kill = (b: Bug) => {
      b.dead = true
      const s = g.current
      const pts = b.gold ? 5 : 1
      s.score += pts
      setScore(s.score)
      sound.squash()
      const col = b.gold ? '#ffd43b' : '#5fbf5f'
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2
        const sp = 40 + Math.random() * 180
        s.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color: i % 3 === 0 ? '#eaffea' : col, size: 3 + Math.random() * 4 })
      }
      s.floats.push({ x: b.x, y: b.y, life: 1, text: '+' + pts, color: col })
    }

    const drawBug = (b: Bug, t: number) => {
      const wob = Math.sin(t * 6 + b.wob) * 0.25
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(wob)
      const body = b.gold ? '#ffd43b' : '#5fbf5f'
      const dark = b.gold ? '#b8860b' : '#2f7a2f'
      ctx.strokeStyle = dark
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      // legs
      for (const sgn of [-1, 1]) {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath()
          ctx.moveTo(sgn * b.r * 0.5, i * b.r * 0.4)
          ctx.lineTo(sgn * b.r * 1.3, i * b.r * 0.6 + Math.sin(t * 10 + i) * 3)
          ctx.stroke()
        }
      }
      // antennae
      ctx.beginPath(); ctx.moveTo(-4, -b.r * 0.7); ctx.lineTo(-9, -b.r * 1.3); ctx.moveTo(4, -b.r * 0.7); ctx.lineTo(9, -b.r * 1.3); ctx.stroke()
      // body
      ctx.fillStyle = body
      ctx.beginPath(); ctx.ellipse(0, 0, b.r, b.r * 1.15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      // eyes
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(-b.r * 0.35, -b.r * 0.25, b.r * 0.28, 0, Math.PI * 2); ctx.arc(b.r * 0.35, -b.r * 0.25, b.r * 0.28, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#101223'
      ctx.beginPath(); ctx.arc(-b.r * 0.3, -b.r * 0.22, b.r * 0.12, 0, Math.PI * 2); ctx.arc(b.r * 0.4, -b.r * 0.22, b.r * 0.12, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }

    const drawSaber = () => {
      const s = g.current
      // swoosh trail
      if (s.trail.length > 1) {
        for (let i = 1; i < s.trail.length; i++) {
          const a = i / s.trail.length
          ctx.strokeStyle = SABER
          ctx.globalAlpha = a * 0.5
          ctx.lineWidth = 10 * a
          ctx.lineCap = 'round'
          ctx.beginPath(); ctx.moveTo(s.trail[i - 1].x, s.trail[i - 1].y); ctx.lineTo(s.trail[i].x, s.trail[i].y); ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      // blade oriented along movement
      let dx = s.mx - s.px, dy = s.my - s.py
      const mag = Math.hypot(dx, dy) || 1
      if (mag < 2) { dx = 0.7; dy = -0.7 } else { dx /= mag; dy /= mag }
      const tipX = s.mx + dx * 78, tipY = s.my + dy * 78
      const hiltX = s.mx - dx * 18, hiltY = s.my - dy * 18
      ctx.lineCap = 'round'
      ctx.strokeStyle = SABER; ctx.globalAlpha = 0.35; ctx.lineWidth = 20
      ctx.beginPath(); ctx.moveTo(s.mx, s.my); ctx.lineTo(tipX, tipY); ctx.stroke()
      ctx.globalAlpha = 1; ctx.lineWidth = 9
      ctx.beginPath(); ctx.moveTo(s.mx, s.my); ctx.lineTo(tipX, tipY); ctx.stroke()
      ctx.strokeStyle = '#eafffb'; ctx.lineWidth = 3.5
      ctx.beginPath(); ctx.moveTo(s.mx, s.my); ctx.lineTo(tipX, tipY); ctx.stroke()
      // hilt
      ctx.strokeStyle = '#b8c0cc'; ctx.lineWidth = 8
      ctx.beginPath(); ctx.moveTo(hiltX, hiltY); ctx.lineTo(s.mx, s.my); ctx.stroke()
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const s = g.current
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = now / 1000
      const w = W(), h = H()

      // background
      const grad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, Math.max(w, h) * 0.7)
      grad.addColorStop(0, '#0e1230'); grad.addColorStop(1, '#05060f')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      // faint stars
      ctx.fillStyle = 'rgba(255,255,255,.5)'
      for (let i = 0; i < 40; i++) {
        const sx = (i * 197.13 % w), sy = ((i * 331.7 + t * 12) % h)
        ctx.globalAlpha = 0.2 + 0.2 * Math.sin(t + i)
        ctx.fillRect(sx, sy, 2, 2)
      }
      ctx.globalAlpha = 1

      if (s.phase === 'playing') {
        // timer
        s.time -= dt
        const ceil = Math.max(0, Math.ceil(s.time))
        setTime((prev) => (prev !== ceil ? ceil : prev))
        if (s.time <= 0) {
          s.phase = 'over'
          setPhase('over')
          const b = Math.max(best, s.score)
          setBest(b)
          localStorage.setItem('sonal.bughunt.best', String(b))
        }
        // spawn
        s.spawnAt -= dt
        const interval = Math.max(0.32, 0.95 - (ROUND - s.time) * 0.02)
        if (s.spawnAt <= 0 && s.bugs.length < 20) { spawnBug(); s.spawnAt = interval }

        // update bugs + collisions
        for (const b of s.bugs) {
          if (b.dead) continue
          b.x += b.vx * dt
          b.y += b.vy * dt
          // gentle steer toward center-ish so they linger
          if (b.x < -60 || b.x > w + 60) b.vx *= -1
          if (b.y < -60 || b.y > h + 60) b.vy *= -1
          if (Math.hypot(s.mx - b.x, s.my - b.y) < b.r + 30) kill(b)
        }
        s.bugs = s.bugs.filter((b) => !b.dead)
      }

      // draw bugs
      for (const b of s.bugs) drawBug(b, t)

      // particles
      for (const p of s.parts) {
        p.life -= dt * 1.4
        p.vy += 260 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }
      ctx.globalAlpha = 1
      s.parts = s.parts.filter((p) => p.life > 0)

      // floaters
      ctx.textAlign = 'center'
      ctx.font = "bold 22px 'Kalam', cursive"
      for (const f of s.floats) {
        f.life -= dt * 1.2
        f.y -= 40 * dt
        ctx.globalAlpha = Math.max(0, f.life)
        ctx.fillStyle = f.color
        ctx.fillText(f.text, f.x, f.y)
      }
      ctx.globalAlpha = 1
      s.floats = s.floats.filter((f) => f.life > 0)

      // saber (intro + playing)
      if (s.phase !== 'over') drawSaber()

      // decay trail
      s.px = s.mx; s.py = s.my
      if (s.trail.length > 12) s.trail.shift()
    }
    raf = requestAnimationFrame(loop)

    const onMove = (e: PointerEvent) => {
      const s = g.current
      s.mx = e.clientX; s.my = e.clientY
      s.trail.push({ x: e.clientX, y: e.clientY })
      if (s.trail.length > 12) s.trail.shift()
      const now = performance.now()
      if (now - s.lastSwing > 120 && Math.hypot(e.movementX, e.movementY) > 6) {
        s.lastSwing = now
        if (s.phase === 'playing') sound.saberSwing()
      }
    }
    const onDown = () => {
      if (g.current.phase === 'playing') sound.saberSwing()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const start = () => {
    const s = g.current
    s.phase = 'playing'; s.score = 0; s.time = ROUND; s.bugs = []; s.parts = []; s.floats = []; s.spawnAt = 0
    setScore(0); setTime(ROUND); setPhase('playing')
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200]"
          style={{ cursor: 'none' }}
        >
          <canvas ref={canvasRef} className="absolute inset-0" />

          {/* close */}
          <button
            onClick={onClose}
            style={{ cursor: 'none' }}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border-2 border-paper/50 font-pixel text-xs text-paper hover:border-coral hover:text-coral"
            aria-label="Close game"
          >
            ✕
          </button>

          {/* HUD while playing */}
          {phase === 'playing' && (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex items-start justify-center gap-6 px-6">
              <div className="font-pixel text-[11px] text-mint">🐛 SQUASHED: {score}</div>
              <div className="w-40">
                <div className="mb-1 text-center font-pixel text-[9px] text-paper/70">{time}s</div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-paper/15">
                  <div className="h-full rounded-full bg-gradient-to-r from-saber to-gold transition-[width] duration-300" style={{ width: `${(time / ROUND) * 100}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* intro */}
          {phase === 'intro' && (
            <div className="absolute inset-0 z-10 grid place-items-center px-6 text-center">
              <div>
                <div className="mb-3 font-hand text-lg text-saber">a long time ago, in a codebase far, far away…</div>
                <h2 className="crayon font-marker text-6xl font-bold leading-none text-paper marker-glow sm:text-7xl">Debug Arena</h2>
                <p className="mx-auto mt-4 max-w-md font-hand text-xl text-paper/80">
                  Bugs invaded the build. Grab your lightsaber, wave it around, and squash every last one.
                  Gold bugs = <span className="text-gold">+5</span>. You've got {ROUND} seconds. ⚔️🐛
                </p>
                <button
                  onClick={start}
                  style={{ cursor: 'none' }}
                  className="doodle-card mt-8 bg-gold px-8 py-3 font-hand text-2xl font-bold text-ink transition-transform hover:-translate-y-0.5"
                >
                  ▶ START HUNT
                </button>
                <div className="mt-4 font-pixel text-[9px] text-paper/50">move mouse to slash · esc to quit</div>
              </div>
            </div>
          )}

          {/* game over */}
          {phase === 'over' && (
            <div className="absolute inset-0 z-10 grid place-items-center px-6 text-center">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="font-pixel text-sm text-coral">TIME!</div>
                <h2 className="crayon font-marker text-6xl font-bold text-paper marker-glow">You squashed {score} 🐛</h2>
                <div className="mt-3 font-pixel text-[12px] text-gold">RANK: {rankFor(score)}</div>
                <div className="mt-1 font-hand text-lg text-paper/60">best: {Math.max(best, score)}</div>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button onClick={start} style={{ cursor: 'none' }} className="doodle-card bg-saber px-6 py-3 font-hand text-xl font-bold text-ink hover:-translate-y-0.5">
                    ↻ Play again
                  </button>
                  <button onClick={onClose} style={{ cursor: 'none' }} className="font-hand text-xl text-paper/80 underline-offset-4 hover:text-gold hover:underline">
                    back to portfolio →
                  </button>
                </div>
                <div className="mt-6 font-hand text-lg text-saber">may the code be with you ✦</div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
