import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { sound } from '../audio/engine'

// ── "DEBUG ARENA" ────────────────────────────────────────────────────────
//  A long time ago, in a codebase far, far away… a dev, a lightsaber, and a
//  swarm of bugs. Everything you see is drawn on one canvas: parallax stars,
//  a Death Star on the horizon, a plasma blade built from additive bloom
//  layers over a machined hilt, and a swept motion ribbon behind it.
// ─────────────────────────────────────────────────────────────────────────

type Bug = { x: number; y: number; vx: number; vy: number; r: number; wob: number; gold: boolean; dead: boolean }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; decay: number; grav: number; color: string; size: number; smoke: boolean }
type Slash = { x: number; y: number; ang: number; life: number; len: number; color: string }
type Ring = { x: number; y: number; life: number; max: number; color: string }
type Floater = { x: number; y: number; life: number; text: string; color: string }
type Star = { x: number; y: number; z: number; p: number }
type Sweep = { ax: number; ay: number; bx: number; by: number; t: number }
type Phase = 'intro' | 'playing' | 'over'

const ROUND = 30 // seconds

/** Kyber crystals on the shelf. `core` is the plasma, `glow` the bloom around it. */
const BLADES = [
  { id: 'jedi', name: 'JEDI', core: '#5ce1e6', glow: '#12a8ff' },
  { id: 'guardian', name: 'GUARDIAN', core: '#7cbcff', glow: '#1d5cff' },
  { id: 'sentinel', name: 'SENTINEL', core: '#84ffa2', glow: '#10d045' },
  { id: 'council', name: 'COUNCIL', core: '#cba6ff', glow: '#8a3dff' },
  { id: 'sith', name: 'SITH', core: '#ff8080', glow: '#ff1414' },
] as const
type Blade = (typeof BLADES)[number]

type Game = {
  phase: Phase
  score: number
  time: number
  bugs: Bug[]
  parts: Particle[]
  slashes: Slash[]
  rings: Ring[]
  floats: Floater[]
  stars: Star[]
  sweep: Sweep[]
  mx: number
  my: number
  px: number
  py: number
  ang: number
  swing: number
  ignite: number
  spawnAt: number
  lastSwing: number
  shake: number
  flash: number
  warp: number
  blade: Blade
}

function rankFor(score: number) {
  if (score >= 50) return 'GRAND MASTER OF THE ORDER ✦'
  if (score >= 34) return 'JEDI MASTER — 10× DEV ⚡'
  if (score >= 20) return 'JEDI KNIGHT — SENIOR DEV ⚔️'
  if (score >= 10) return 'PADAWAN — JUNIOR DEV 🌱'
  return 'YOUNGLING — keep training ☕'
}

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export default function BugArena({ open, onClose }: { open: boolean; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const g = useRef<Game>({
    phase: 'intro', score: 0, time: ROUND, bugs: [], parts: [], slashes: [], rings: [], floats: [],
    stars: [], sweep: [], mx: 0, my: 0, px: 0, py: 0, ang: -Math.PI / 2 - 0.35, swing: 0, ignite: 0,
    spawnAt: 0, lastSwing: 0, shake: 0, flash: 0, warp: 0, blade: BLADES[0],
  })
  const [phase, setPhase] = useState<Phase>('intro')
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(ROUND)
  const [best, setBest] = useState(0)
  const [blade, setBlade] = useState<Blade>(BLADES[0])

  useEffect(() => {
    setBest(Number(localStorage.getItem('sonal.bughunt.best') || 0))
    const saved = localStorage.getItem('sonal.bughunt.blade')
    const found = BLADES.find((b) => b.id === saved)
    if (found) { setBlade(found); g.current.blade = found }
  }, [])

  const pickBlade = (b: Blade) => {
    setBlade(b)
    g.current.blade = b
    localStorage.setItem('sonal.bughunt.blade', b.id)
    sound.saberIgnite()
  }

  // reset to intro each time it opens; lock body scroll + hide doodle cursor
  useEffect(() => {
    if (!open) return
    g.current.phase = 'intro'
    g.current.ignite = 0
    setPhase('intro')
    setScore(0)
    setTime(ROUND)
    document.body.classList.add('game-mode')
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sound.unlock()
    sound.saberIgnite()
    sound.saberHum(true)
    return () => {
      document.body.classList.remove('game-mode')
      document.body.style.overflow = prevOverflow
      sound.saberHum(false)
      sound.saberRetract()
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
    let w = window.innerWidth
    let h = window.innerHeight
    let sc = 1 // everything scales down a little on small screens
    let scan: CanvasPattern | null = null
    let moved = false

    // A 1×3 tile of CRT scanline, tiled over the whole frame once per draw.
    const buildScanlines = () => {
      const c = document.createElement('canvas')
      c.width = 1; c.height = 3
      const cx = c.getContext('2d')!
      cx.fillStyle = 'rgba(0,0,0,0.20)'
      cx.fillRect(0, 0, 1, 1)
      scan = ctx.createPattern(c, 'repeat')
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      sc = Math.max(0.62, Math.min(1, w / 1200))
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildScanlines()
      // until the player actually moves, the blade rests off to the side
      // instead of lying across the opening crawl
      if (!moved) { g.current.mx = w * 0.75; g.current.my = h * 0.64; g.current.px = g.current.mx; g.current.py = g.current.my }
      // three parallax depths of star
      g.current.stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        z: 0.25 + Math.random() * 0.75, p: Math.random() * Math.PI * 2,
      }))
    }
    resize()
    window.addEventListener('resize', resize)


    // ── geometry helpers ───────────────────────────────────────────────
    const rrect = (x: number, y: number, rw: number, rh: number, r: number) => {
      const rr = Math.min(r, rw / 2, rh / 2)
      ctx.beginPath()
      ctx.moveTo(x + rr, y)
      ctx.arcTo(x + rw, y, x + rw, y + rh, rr)
      ctx.arcTo(x + rw, y + rh, x, y + rh, rr)
      ctx.arcTo(x, y + rh, x, y, rr)
      ctx.arcTo(x, y, x + rw, y, rr)
      ctx.closePath()
    }

    /** distance from point to segment — the blade is a segment, not a dot. */
    const distToSeg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
      const dx = bx - ax, dy = by - ay
      const l2 = dx * dx + dy * dy || 1
      let t = ((px - ax) * dx + (py - ay) * dy) / l2
      t = Math.max(0, Math.min(1, t))
      return Math.hypot(px - (ax + dx * t), py - (ay + dy * t))
    }

    // current blade geometry in world space
    const hiltLen = () => 52 * sc
    const bladeLen = () => 178 * sc
    const easeIgnite = (k: number) => {
      const e = 1 - Math.pow(1 - k, 3)
      return k < 1 ? e * (1 + 0.07 * Math.sin(k * Math.PI)) : 1
    }
    const bladeSeg = () => {
      const s = g.current
      const cos = Math.cos(s.ang), sin = Math.sin(s.ang)
      const ex = hiltLen() * 0.32
      const len = bladeLen() * easeIgnite(s.ignite)
      return {
        ax: s.mx + cos * ex, ay: s.my + sin * ex,
        bx: s.mx + cos * (ex + len), by: s.my + sin * (ex + len),
      }
    }

    // ── spawning + killing ─────────────────────────────────────────────
    const spawnBug = () => {
      const s = g.current
      const edge = Math.floor(Math.random() * 4)
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
      sound.saberHit()
      sound.squash()

      const col = b.gold ? '#ffd43b' : '#5fbf5f'
      const hot = s.blade.core
      // the cut itself — a glowing kerf along the blade's angle
      s.slashes.push({ x: b.x, y: b.y, ang: s.ang, life: 1, len: b.r * 5.5, color: hot })
      s.rings.push({ x: b.x, y: b.y, life: 1, max: b.r * 4.5, color: b.gold ? '#ffd43b' : hot })
      // white-hot plasma sparks
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2
        const sp = 60 + Math.random() * 260
        s.parts.push({
          x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 1, decay: 1.3 + Math.random(), grav: 340,
          color: i % 4 === 0 ? '#ffffff' : i % 3 === 0 ? hot : col,
          size: 2 + Math.random() * 3.5, smoke: false,
        })
      }
      // scorch smoke drifting up off the kill
      for (let i = 0; i < 3; i++) {
        s.parts.push({
          x: b.x + (Math.random() - 0.5) * b.r, y: b.y, vx: (Math.random() - 0.5) * 26,
          vy: -18 - Math.random() * 30, life: 1, decay: 0.75, grav: -12,
          color: '#8d93a8', size: 4 + Math.random() * 5, smoke: true,
        })
      }
      s.floats.push({ x: b.x, y: b.y, life: 1, text: '+' + pts, color: col })
      s.shake = Math.min(14, s.shake + (b.gold ? 9 : 3.5))
      s.flash = Math.min(0.5, s.flash + (b.gold ? 0.22 : 0.08))
    }

    // ── background ─────────────────────────────────────────────────────
    const drawSpace = (t: number) => {
      const s = g.current
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.55, 30, w * 0.5, h * 0.5, Math.max(w, h) * 0.78)
      grad.addColorStop(0, '#111634')
      grad.addColorStop(0.55, '#080b1d')
      grad.addColorStop(1, '#03040b')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // two nebula washes so the void isn't flat
      ctx.globalCompositeOperation = 'lighter'
      const neb = (cx: number, cy: number, r: number, col: string, a: number) => {
        const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        ng.addColorStop(0, rgba(col, a))
        ng.addColorStop(1, rgba(col, 0))
        ctx.fillStyle = ng
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
      }
      neb(w * 0.18, h * 0.78, Math.max(w, h) * 0.42, '#5a2bd6', 0.1)
      neb(w * 0.86, h * 0.28, Math.max(w, h) * 0.36, '#0f6fb8', 0.09)
      ctx.globalCompositeOperation = 'source-over'

      // parallax starfield — layers drift against the pointer
      const ox = (s.mx - w / 2) * 0.014
      const oy = (s.my - h / 2) * 0.014
      for (const st of s.stars) {
        const x = st.x - ox * st.z
        const y = st.y - oy * st.z
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.6 + st.p))
        ctx.globalAlpha = tw * st.z
        ctx.fillStyle = st.z > 0.85 ? '#dff1ff' : '#ffffff'
        const size = st.z > 0.85 ? 2.2 : 1.4
        ctx.fillRect(x, y, size, size)
      }
      ctx.globalAlpha = 1
    }

    const drawDeathStar = (t: number) => {
      const R = Math.min(w, h) * 0.135
      const cx = w * 0.845, cy = h * 0.2
      const halo = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 2.2)
      halo.addColorStop(0, 'rgba(150,180,220,0.10)')
      halo.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = halo
      ctx.beginPath(); ctx.arc(cx, cy, R * 2.2, 0, Math.PI * 2); ctx.fill()

      const sphere = ctx.createRadialGradient(cx - R * 0.45, cy - R * 0.5, R * 0.08, cx, cy, R)
      sphere.addColorStop(0, '#333c50')
      sphere.addColorStop(0.55, '#1a2030')
      sphere.addColorStop(1, '#080b14')
      ctx.fillStyle = sphere
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()

      ctx.save()
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip()
      // panel seams
      ctx.strokeStyle = 'rgba(210,230,255,0.05)'
      ctx.lineWidth = 1
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(cx - R, cy + i * R * 0.28); ctx.lineTo(cx + R, cy + i * R * 0.28); ctx.stroke()
      }
      // equatorial trench
      ctx.strokeStyle = 'rgba(160,185,215,0.16)'
      ctx.lineWidth = Math.max(1.5, R * 0.055)
      ctx.beginPath(); ctx.moveTo(cx - R, cy + R * 0.2); ctx.lineTo(cx + R, cy + R * 0.2); ctx.stroke()
      // superlaser dish, charging
      const dx = cx - R * 0.3, dy = cy - R * 0.34
      ctx.fillStyle = 'rgba(8,11,20,0.92)'
      ctx.beginPath(); ctx.ellipse(dx, dy, R * 0.27, R * 0.25, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(160,190,225,0.22)'
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.ellipse(dx, dy, R * 0.27, R * 0.25, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = `rgba(120,255,150,${0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * 1.7))})`
      ctx.beginPath(); ctx.arc(dx, dy, R * 0.08, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      ctx.strokeStyle = 'rgba(150,200,255,0.14)'
      ctx.lineWidth = 1.4
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()
    }

    // ── bugs ───────────────────────────────────────────────────────────
    const drawBug = (b: Bug, t: number) => {
      const s = g.current
      const wob = Math.sin(t * 6 + b.wob) * 0.25
      const body = b.gold ? '#ffd43b' : '#57b357'
      const dark = b.gold ? '#8a5f08' : '#20551f'

      // the blade actually lights the scene: bugs near it catch a rim
      const seg = bladeSeg()
      const d = distToSeg(b.x, b.y, seg.ax, seg.ay, seg.bx, seg.by)
      const litness = Math.max(0, 1 - d / 260) * s.ignite

      ctx.save()
      ctx.translate(b.x, b.y)

      // ground-glow so gold bugs read as "valuable" from across the arena
      if (b.gold) {
        ctx.globalCompositeOperation = 'lighter'
        const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, b.r * 3.4)
        gg.addColorStop(0, `rgba(255,212,59,${0.22 + 0.1 * Math.sin(t * 5 + b.wob)})`)
        gg.addColorStop(1, 'rgba(255,212,59,0)')
        ctx.fillStyle = gg
        ctx.fillRect(-b.r * 3.4, -b.r * 3.4, b.r * 6.8, b.r * 6.8)
        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.rotate(wob)
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
      ctx.beginPath()
      ctx.moveTo(-4, -b.r * 0.7); ctx.lineTo(-9, -b.r * 1.3)
      ctx.moveTo(4, -b.r * 0.7); ctx.lineTo(9, -b.r * 1.3)
      ctx.stroke()

      // carapace with a top-light so it reads round, not flat
      const shell = ctx.createLinearGradient(0, -b.r * 1.15, 0, b.r * 1.15)
      shell.addColorStop(0, b.gold ? '#fff0a8' : '#8fe08f')
      shell.addColorStop(0.45, body)
      shell.addColorStop(1, dark)
      ctx.fillStyle = shell
      ctx.beginPath(); ctx.ellipse(0, 0, b.r, b.r * 1.15, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = dark
      ctx.stroke()
      // specular
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.beginPath(); ctx.ellipse(-b.r * 0.3, -b.r * 0.55, b.r * 0.24, b.r * 0.13, -0.5, 0, Math.PI * 2); ctx.fill()

      // rim light thrown by the blade
      if (litness > 0.02) {
        const toBlade = Math.atan2(seg.by - b.y, seg.bx - b.x) - wob
        ctx.globalCompositeOperation = 'lighter'
        ctx.strokeStyle = rgba(s.blade.core, Math.min(0.85, litness * 0.9))
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.ellipse(0, 0, b.r, b.r * 1.15, 0, toBlade - 0.85, toBlade + 0.85)
        ctx.stroke()
        ctx.globalCompositeOperation = 'source-over'
      }

      // eyes
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(-b.r * 0.35, -b.r * 0.25, b.r * 0.28, 0, Math.PI * 2)
      ctx.arc(b.r * 0.35, -b.r * 0.25, b.r * 0.28, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#101223'
      ctx.beginPath()
      ctx.arc(-b.r * 0.3, -b.r * 0.22, b.r * 0.12, 0, Math.PI * 2)
      ctx.arc(b.r * 0.4, -b.r * 0.22, b.r * 0.12, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    /** X-wing style target box on whatever the blade is closest to. */
    const drawReticle = (t: number) => {
      const s = g.current
      const seg = bladeSeg()
      let target: Bug | null = null
      let bestD = 260
      for (const b of s.bugs) {
        const d = distToSeg(b.x, b.y, seg.ax, seg.ay, seg.bx, seg.by)
        if (d < bestD) { bestD = d; target = b }
      }
      if (!target) return
      const lock = 1 - bestD / 260
      const r = target.r * 2.1 + 6
      ctx.save()
      ctx.translate(target.x, target.y)
      ctx.rotate(Math.sin(t * 0.9) * 0.06)
      ctx.strokeStyle = rgba(bestD < 60 ? '#ff5c5c' : '#ffd43b', 0.25 + lock * 0.6)
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      const arm = r * 0.42
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
        ctx.beginPath()
        ctx.moveTo(sx * r, sy * r - sy * arm)
        ctx.lineTo(sx * r, sy * r)
        ctx.lineTo(sx * r - sx * arm, sy * r)
        ctx.stroke()
      }
      ctx.restore()
    }

    // ── the blade ──────────────────────────────────────────────────────
    /** Swept motion ribbon: every frame's blade quad, stacked and fading. */
    const drawSweep = (now: number) => {
      const s = g.current
      const LIFE = 115
      const pts = s.sweep.filter((p) => now - p.t < LIFE)
      if (pts.length < 2) return
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const pass = (col: string, alpha: number, shrink: number, blur: number) => {
        ctx.shadowColor = col
        ctx.shadowBlur = blur
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i]
          const age = (now - b.t) / LIFE
          const f = Math.pow(1 - age, 1.6)
          if (f <= 0.01) continue
          const lerp = (p: Sweep) => ({
            ax: p.ax + (p.bx - p.ax) * shrink, ay: p.ay + (p.by - p.ay) * shrink,
            bx: p.bx + (p.ax - p.bx) * (shrink * 0.15), by: p.by + (p.ay - p.by) * (shrink * 0.15),
          })
          const A = lerp(a), B = lerp(b)
          ctx.beginPath()
          ctx.moveTo(A.ax, A.ay)
          ctx.lineTo(A.bx, A.by)
          ctx.lineTo(B.bx, B.by)
          ctx.lineTo(B.ax, B.ay)
          ctx.closePath()
          ctx.fillStyle = rgba(col, alpha * f)
          ctx.fill()
        }
      }
      pass(s.blade.glow, 0.035, 0, 22 * sc)
      pass(s.blade.core, 0.05, 0.2, 9 * sc)
      ctx.shadowBlur = 0
      pass('#ffffff', 0.035, 0.46, 0)
      ctx.restore()
    }

    const drawHilt = (blade: Blade) => {
      const H = hiltLen()
      const bw = 13 * sc // barrel thickness
      const x0 = -H * 0.68, x1 = H * 0.32
      ctx.lineCap = 'butt'

      // cast shadow so it sits *in* the scene
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      rrect(x0 + 1.5 * sc, -bw / 2 + 3 * sc, x1 - x0, bw, 3 * sc)
      ctx.fill()

      // machined barrel: dark → chrome hotspot → dark, across the tube
      const metal = ctx.createLinearGradient(0, -bw / 2, 0, bw / 2)
      metal.addColorStop(0, '#0d1017')
      metal.addColorStop(0.16, '#79879b')
      metal.addColorStop(0.33, '#eef3fa')
      metal.addColorStop(0.5, '#a9b4c4')
      metal.addColorStop(0.74, '#454e5f')
      metal.addColorStop(1, '#080a10')
      ctx.fillStyle = metal
      rrect(x0, -bw / 2, x1 - x0, bw, 3 * sc)
      ctx.fill()

      // ribbed black grip
      const gx0 = x0 + H * 0.2, gx1 = x0 + H * 0.66
      const grip = ctx.createLinearGradient(0, -bw / 2, 0, bw / 2)
      grip.addColorStop(0, '#04060a')
      grip.addColorStop(0.35, '#333b4b')
      grip.addColorStop(0.55, '#1b2029')
      grip.addColorStop(1, '#03050a')
      ctx.fillStyle = grip
      ctx.fillRect(gx0, -bw / 2, gx1 - gx0, bw)
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'
      ctx.lineWidth = 1
      for (let x = gx0 + 2.4 * sc; x < gx1; x += 3.4 * sc) {
        ctx.beginPath(); ctx.moveTo(x, -bw / 2 + 1); ctx.lineTo(x, bw / 2 - 1); ctx.stroke()
      }

      // chrome control bands
      const band = (x: number, wd: number) => {
        const bg = ctx.createLinearGradient(0, -bw / 2, 0, bw / 2)
        bg.addColorStop(0, '#1a1f2a')
        bg.addColorStop(0.3, '#ffffff')
        bg.addColorStop(0.55, '#9aa5b6')
        bg.addColorStop(1, '#12161f')
        ctx.fillStyle = bg
        ctx.fillRect(x, -bw / 2 - 1 * sc, wd, bw + 2 * sc)
      }
      band(gx1 + 1.5 * sc, 3.5 * sc)
      band(gx0 - 4.5 * sc, 3 * sc)

      // activation stud + status LED
      ctx.fillStyle = '#c92a2a'
      rrect(gx1 + 6 * sc, -bw * 0.22, 5 * sc, bw * 0.44, 1.2 * sc)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,140,140,0.9)'
      ctx.fillRect(gx1 + 6.6 * sc, -bw * 0.14, 3.6 * sc, 1.4 * sc)
      ctx.fillStyle = rgba(blade.core, 0.95)
      ctx.beginPath(); ctx.arc(gx1 + 14 * sc, bw * 0.06, 1.5 * sc, 0, Math.PI * 2); ctx.fill()

      // pommel cap
      ctx.fillStyle = '#161b25'
      rrect(x0 - 3 * sc, -bw * 0.42, 4 * sc, bw * 0.84, 1.5 * sc)
      ctx.fill()

      // emitter shroud — flared, with three prongs
      const ew = bw * 1.42
      const eg = ctx.createLinearGradient(0, -ew / 2, 0, ew / 2)
      eg.addColorStop(0, '#0b0e14')
      eg.addColorStop(0.3, '#c8d2e0')
      eg.addColorStop(0.55, '#7c8798')
      eg.addColorStop(1, '#070a10')
      ctx.fillStyle = eg
      ctx.beginPath()
      ctx.moveTo(x1 - H * 0.16, -bw / 2)
      ctx.lineTo(x1, -ew / 2)
      ctx.lineTo(x1, ew / 2)
      ctx.lineTo(x1 - H * 0.16, bw / 2)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.65)'
      ctx.lineWidth = 1
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath()
        ctx.moveTo(x1 - H * 0.13, i * ew * 0.26)
        ctx.lineTo(x1, i * ew * 0.3)
        ctx.stroke()
      }
    }

    const drawSaber = (t: number) => {
      const s = g.current
      if (s.ignite < 0.01 && s.phase === 'over') return
      const H = hiltLen()
      const ex = H * 0.32
      // plasma is never perfectly steady
      const flicker = 1 + Math.sin(t * 47) * 0.014 + Math.sin(t * 13.3) * 0.02
      const len = bladeLen() * easeIgnite(s.ignite) * flicker
      const tip = ex + len

      ctx.save()
      ctx.translate(s.mx, s.my)
      ctx.rotate(s.ang)

      if (len > 2) {
        ctx.globalCompositeOperation = 'lighter'
        // light pool the blade throws onto the arena
        const mid = (ex + tip) / 2
        const pool = ctx.createRadialGradient(mid, 0, 0, mid, 0, len * 0.95)
        pool.addColorStop(0, rgba(s.blade.glow, 0.16))
        pool.addColorStop(1, rgba(s.blade.glow, 0))
        ctx.fillStyle = pool
        ctx.fillRect(mid - len, -len, len * 2, len * 2)

        // four stacked bloom layers make the plasma read as *emitting*
        const layers: [number, number, string, number][] = [
          [34 * sc, 0.16, s.blade.glow, 48 * sc],
          [20 * sc, 0.3, s.blade.glow, 26 * sc],
          [11.5 * sc, 0.8, s.blade.core, 14 * sc],
          [5 * sc, 1, '#ffffff', 9 * sc],
        ]
        ctx.lineCap = 'round'
        for (const [lw, a, col, blur] of layers) {
          ctx.shadowColor = col
          ctx.shadowBlur = blur
          ctx.strokeStyle = col === '#ffffff' ? `rgba(255,255,255,${a})` : rgba(col, a)
          ctx.lineWidth = lw
          ctx.beginPath(); ctx.moveTo(ex, 0); ctx.lineTo(tip, 0); ctx.stroke()
        }
        // kyber bleed right at the emitter
        ctx.shadowBlur = 0
        const bleed = ctx.createRadialGradient(ex, 0, 0, ex, 0, 26 * sc)
        bleed.addColorStop(0, rgba(s.blade.core, 0.55))
        bleed.addColorStop(1, rgba(s.blade.core, 0))
        ctx.fillStyle = bleed
        ctx.fillRect(ex - 26 * sc, -26 * sc, 52 * sc, 52 * sc)
        ctx.globalCompositeOperation = 'source-over'
      }

      drawHilt(s.blade)
      ctx.restore()
    }

    // ── main loop ──────────────────────────────────────────────────────
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const s = g.current
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = now / 1000

      // blade aim: lags behind the hand, settles to a guard pose when still
      const vx = (s.mx - s.px) / Math.max(dt, 0.001)
      const vy = (s.my - s.py) / Math.max(dt, 0.001)
      const speed = Math.hypot(vx, vy)
      const target = speed > 110 ? Math.atan2(vy, vx) : -Math.PI / 2 - 0.35
      let d = target - s.ang
      while (d > Math.PI) d -= Math.PI * 2
      while (d < -Math.PI) d += Math.PI * 2
      s.ang += d * (1 - Math.exp(-(speed > 110 ? 13 : 2.4) * dt))
      s.swing += ((speed > 110 ? Math.min(1, speed / 2200) : 0) - s.swing) * Math.min(1, dt * 8)
      s.ignite = Math.min(1, s.ignite + dt * 3.2)
      s.px = s.mx; s.py = s.my

      // record this frame's blade quad for the motion ribbon
      const seg = bladeSeg()
      s.sweep.push({ ax: seg.ax, ay: seg.ay, bx: seg.bx, by: seg.by, t: now })
      if (s.sweep.length > 18) s.sweep.shift()

      if (now - s.lastSwing > 90) {
        s.lastSwing = now
        sound.setSaberIntensity(s.swing)
      }

      // camera shake
      s.shake = Math.max(0, s.shake - dt * 34)
      ctx.save()
      if (s.shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake)
      }

      drawSpace(t)
      drawDeathStar(t)

      if (s.phase === 'playing') {
        s.time -= dt
        const ceil = Math.max(0, Math.ceil(s.time))
        setTime((prev) => (prev !== ceil ? ceil : prev))
        if (s.time <= 0) {
          s.phase = 'over'
          setPhase('over')
          sound.saberRetract()
          const b = Math.max(best, s.score)
          setBest(b)
          localStorage.setItem('sonal.bughunt.best', String(b))
        }
        s.spawnAt -= dt
        const interval = Math.max(0.32, 0.95 - (ROUND - s.time) * 0.02)
        if (s.spawnAt <= 0 && s.bugs.length < 20) { spawnBug(); s.spawnAt = interval }

        for (const b of s.bugs) {
          if (b.dead) continue
          b.x += b.vx * dt
          b.y += b.vy * dt
          if (b.x < -60 || b.x > w + 60) b.vx *= -1
          if (b.y < -60 || b.y > h + 60) b.vy *= -1
          // the whole blade cuts, not just the hand
          if (distToSeg(b.x, b.y, seg.ax, seg.ay, seg.bx, seg.by) < b.r + 7) kill(b)
        }
        s.bugs = s.bugs.filter((b) => !b.dead)
      }

      for (const b of s.bugs) drawBug(b, t)
      if (s.phase === 'playing') drawReticle(t)

      // cut kerfs
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const sl of s.slashes) {
        sl.life -= dt * 2.6
        if (sl.life <= 0) continue
        const grow = 1 + (1 - sl.life) * 0.9
        ctx.save()
        ctx.translate(sl.x, sl.y)
        ctx.rotate(sl.ang)
        ctx.lineCap = 'round'
        ctx.shadowColor = sl.color
        ctx.shadowBlur = 22
        ctx.strokeStyle = rgba(sl.color, sl.life * 0.75)
        ctx.lineWidth = 7 * sl.life * sc
        ctx.beginPath(); ctx.moveTo(-sl.len * grow, 0); ctx.lineTo(sl.len * grow, 0); ctx.stroke()
        ctx.shadowBlur = 0
        ctx.strokeStyle = `rgba(255,255,255,${sl.life * 0.85})`
        ctx.lineWidth = 2.4 * sl.life * sc
        ctx.beginPath(); ctx.moveTo(-sl.len * grow, 0); ctx.lineTo(sl.len * grow, 0); ctx.stroke()
        ctx.restore()
      }
      s.slashes = s.slashes.filter((x) => x.life > 0)

      // shockwave rings
      for (const r of s.rings) {
        r.life -= dt * 2.2
        if (r.life <= 0) continue
        ctx.strokeStyle = rgba(r.color, r.life * 0.5)
        ctx.lineWidth = 3 * r.life
        ctx.beginPath(); ctx.arc(r.x, r.y, r.max * (1 - r.life) + 6, 0, Math.PI * 2); ctx.stroke()
      }
      s.rings = s.rings.filter((x) => x.life > 0)
      ctx.restore()

      // sparks + smoke
      for (const p of s.parts) {
        p.life -= dt * p.decay
        p.vy += p.grav * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.life <= 0) continue
        if (p.smoke) {
          ctx.globalAlpha = Math.max(0, p.life) * 0.11
          ctx.fillStyle = p.color
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - p.life), 0, Math.PI * 2); ctx.fill()
        } else {
          ctx.globalCompositeOperation = 'lighter'
          ctx.globalAlpha = Math.max(0, p.life)
          ctx.fillStyle = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur = 8
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.85)
          ctx.shadowBlur = 0
          ctx.globalCompositeOperation = 'source-over'
        }
      }
      ctx.globalAlpha = 1
      s.parts = s.parts.filter((p) => p.life > 0)

      // score floaters
      ctx.textAlign = 'center'
      ctx.font = `bold ${22 * sc}px 'Kalam', cursive`
      for (const f of s.floats) {
        f.life -= dt * 1.2
        f.y -= 46 * dt
        ctx.globalAlpha = Math.max(0, f.life)
        ctx.shadowColor = f.color
        ctx.shadowBlur = 12
        ctx.fillStyle = f.color
        ctx.fillText(f.text, f.x, f.y)
        ctx.shadowBlur = 0
      }
      ctx.globalAlpha = 1
      s.floats = s.floats.filter((f) => f.life > 0)

      if (s.phase !== 'over') {
        drawSweep(now)
        drawSaber(t)
      } else {
        s.ignite = Math.max(0, s.ignite - dt * 4)
        s.sweep.length = 0
        drawSaber(t)
      }

      ctx.restore() // end shake

      // hyperspace jump on round start
      if (s.warp > 0) {
        s.warp = Math.max(0, s.warp - dt * 1.5)
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        ctx.strokeStyle = `rgba(200,235,255,${s.warp * 0.5})`
        ctx.lineWidth = 1.6
        const cx = w / 2, cy = h / 2
        for (let i = 0; i < 70; i++) {
          const a = (i / 70) * Math.PI * 2 + i * 0.7
          const r0 = (1 - s.warp) * Math.max(w, h) * 0.55 + 40
          const l = 60 + s.warp * 340
          ctx.beginPath()
          ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
          ctx.lineTo(cx + Math.cos(a) * (r0 + l), cy + Math.sin(a) * (r0 + l))
          ctx.stroke()
        }
        ctx.restore()
      }

      // hit flash
      if (s.flash > 0.002) {
        s.flash = Math.max(0, s.flash - dt * 2.2)
        ctx.fillStyle = rgba(s.blade.core, s.flash * 0.35)
        ctx.fillRect(0, 0, w, h)
      }

      // vignette + CRT lines, so the whole thing feels like a cockpit screen
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.34, w / 2, h / 2, Math.max(w, h) * 0.78)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,0.72)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)
      if (scan) {
        ctx.globalAlpha = 0.35
        ctx.fillStyle = scan
        ctx.fillRect(0, 0, w, h)
        ctx.globalAlpha = 1
      }
    }
    raf = requestAnimationFrame(loop)

    const onMove = (e: PointerEvent) => {
      const s = g.current
      moved = true
      s.mx = e.clientX
      s.my = e.clientY
      if (s.phase === 'playing' && Math.hypot(e.movementX, e.movementY) > 14 && Math.random() < 0.09) {
        sound.saberSwing()
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
    s.phase = 'playing'; s.score = 0; s.time = ROUND
    s.bugs = []; s.parts = []; s.slashes = []; s.rings = []; s.floats = []; s.sweep = []
    s.spawnAt = 0; s.ignite = 0; s.warp = 1; s.shake = 6
    setScore(0); setTime(ROUND); setPhase('playing')
    sound.saberIgnite()
    sound.saberHum(true)
  }

  const low = time <= 10
  const glow = blade.core

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] select-none"
          style={{ cursor: 'none' }}
        >
          <canvas ref={canvasRef} className="absolute inset-0" />

          {/* targeting-computer frame */}
          <div className="pointer-events-none absolute inset-3 z-[5]">
            {[
              'left-0 top-0 border-l-2 border-t-2 rounded-tl-md',
              'right-0 top-0 border-r-2 border-t-2 rounded-tr-md',
              'left-0 bottom-0 border-l-2 border-b-2 rounded-bl-md',
              'right-0 bottom-0 border-r-2 border-b-2 rounded-br-md',
            ].map((c) => (
              <span key={c} className={`absolute h-10 w-10 ${c}`} style={{ borderColor: rgba(glow, 0.4) }} />
            ))}
          </div>

          {/* disengage */}
          <button
            onClick={onClose}
            style={{ cursor: 'none', borderColor: rgba(glow, 0.5), color: glow, boxShadow: `0 0 18px ${rgba(glow, 0.18)}` }}
            className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-md border-2 bg-black/50 font-pixel text-[10px] backdrop-blur transition hover:bg-black/80"
            aria-label="Close game"
          >
            ✕
          </button>

          {/* HUD while playing */}
          {phase === 'playing' && (
            <div className="pointer-events-none absolute inset-x-0 top-5 z-10 flex items-center justify-center gap-4 px-6 sm:gap-10">
              <div className="hidden min-w-[9rem] sm:block">
                <div className="font-pixel text-[8px] tracking-widest text-paper/40">BUGS TERMINATED</div>
                <div className="font-pixel text-[20px] leading-tight" style={{ color: glow, textShadow: `0 0 16px ${rgba(glow, 0.7)}` }}>
                  {String(score).padStart(3, '0')}
                </div>
              </div>

              <div className="w-48 sm:w-64">
                <div className="mb-1 flex items-baseline justify-between font-pixel text-[8px] tracking-widest text-paper/45">
                  <span>SPRINT ENDS IN</span>
                  <span className={low ? 'text-coral' : 'text-paper/70'}>{time}s</span>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-sm border border-paper/15 bg-black/60">
                  <motion.div
                    className="h-full"
                    animate={low ? { opacity: [1, 0.45, 1] } : { opacity: 1 }}
                    transition={low ? { duration: 0.7, repeat: Infinity } : { duration: 0.2 }}
                    style={{
                      width: `${(time / ROUND) * 100}%`,
                      background: low
                        ? 'linear-gradient(90deg,#ff6b6b,#ffa94d)'
                        : `linear-gradient(90deg,${blade.glow},${blade.core},#ffd43b)`,
                      boxShadow: `0 0 14px ${rgba(low ? '#ff6b6b' : blade.core, 0.8)}`,
                      transition: 'width .3s linear',
                    }}
                  />
                </div>
                <div className="mt-1 text-center font-pixel text-[8px] tracking-widest text-paper/25 sm:hidden">
                  {String(score).padStart(3, '0')} DOWN
                </div>
              </div>

              <div className="hidden min-w-[9rem] text-right sm:block">
                <div className="font-pixel text-[8px] tracking-widest text-paper/40">RECORD</div>
                <div className="font-pixel text-[20px] leading-tight text-gold" style={{ textShadow: '0 0 16px rgba(255,212,59,.6)' }}>
                  {String(Math.max(best, score)).padStart(3, '0')}
                </div>
              </div>
            </div>
          )}

          {/* intro — opening crawl */}
          {phase === 'intro' && (
            <div className="absolute inset-0 z-10 grid place-items-center overflow-hidden px-6 text-center">
              <div className="w-full max-w-2xl">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.1 }}
                  className="font-hand text-base tracking-wide text-[#4bd5ee] sm:text-lg"
                  style={{ textShadow: '0 0 18px rgba(75,213,238,.45)' }}
                >
                  A long time ago, in a codebase far, far away….
                </motion.p>

                <motion.h2
                  initial={{ scale: 2.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                  className="relative mt-3 select-none"
                >
                  <span className="sw-title-outline" aria-hidden>DEBUG ARENA</span>
                  <span className="sw-title">DEBUG ARENA</span>
                </motion.h2>

                <div className="sw-crawl mt-5">
                  <motion.div
                    className="sw-crawl-inner"
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 2.2, ease: 'easeOut', delay: 0.5 }}
                  >
                    <p className="mb-2 font-pixel text-[10px] tracking-[0.3em]">EPISODE IV — A NEW BUILD</p>
                    <p>
                      Bugs have overrun the repository. Only one dev still carries a blade.
                      Sweep it through the swarm and cut every last one down. GOLD bugs are
                      elite — worth <span className="text-[#fff3b0]">+5</span>. The sprint ends
                      in {ROUND} seconds.
                    </p>
                  </motion.div>
                </div>

                {/* kyber crystal shelf */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                  className="mt-7"
                >
                  <div className="mb-2 font-pixel text-[8px] tracking-[0.3em] text-paper/35">CHOOSE YOUR KYBER</div>
                  <div className="flex items-center justify-center gap-2.5">
                    {BLADES.map((b) => {
                      const on = b.id === blade.id
                      return (
                        <button
                          key={b.id}
                          onClick={() => pickBlade(b)}
                          title={b.name}
                          aria-label={`${b.name} blade`}
                          style={{
                            cursor: 'none',
                            background: `linear-gradient(180deg,#fff,${b.core} 45%,${b.glow})`,
                            boxShadow: on
                              ? `0 0 0 2px rgba(251,246,233,.85), 0 0 22px ${rgba(b.core, 0.95)}`
                              : `0 0 12px ${rgba(b.core, 0.45)}`,
                          }}
                          className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${on ? 'scale-110' : 'opacity-70'}`}
                        />
                      )
                    })}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.75, duration: 0.6 }}
                >
                  <button
                    onClick={start}
                    style={{
                      cursor: 'none',
                      borderColor: rgba(glow, 0.75),
                      color: '#eafcff',
                      boxShadow: `0 0 28px ${rgba(glow, 0.35)}, inset 0 0 22px ${rgba(glow, 0.15)}`,
                    }}
                    className="group mt-7 inline-flex items-center gap-3 rounded-md border-2 bg-black/55 px-9 py-3.5 font-pixel text-[12px] tracking-[0.22em] backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-black/75"
                  >
                    <span
                      className="inline-block h-[3px] w-6 rounded-full transition-all group-hover:w-9"
                      style={{ background: blade.core, boxShadow: `0 0 12px ${blade.core}` }}
                    />
                    IGNITE
                  </button>
                  <div className="mt-4 font-pixel text-[8px] tracking-[0.25em] text-paper/35">
                    MOVE MOUSE TO SLASH · ESC TO DISENGAGE
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* game over — holo debrief */}
          {phase === 'over' && (
            <div className="absolute inset-0 z-10 grid place-items-center px-6 text-center">
              <motion.div
                initial={{ scale: 0.86, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className="holo relative w-full max-w-lg rounded-lg border px-8 py-9"
                style={{ borderColor: rgba(glow, 0.45), boxShadow: `0 0 60px ${rgba(glow, 0.22)}` }}
              >
                <div className="font-pixel text-[10px] tracking-[0.35em] text-coral">SPRINT OVER</div>
                <h2 className="mt-4 font-marker text-6xl font-bold leading-none text-paper" style={{ textShadow: `0 0 30px ${rgba(glow, 0.6)}` }}>
                  {score} bugs down
                </h2>
                <div className="mt-5 font-pixel text-[10px] leading-relaxed tracking-[0.18em] text-gold">
                  RANK: {rankFor(score)}
                </div>
                <div className="mt-2 font-pixel text-[9px] tracking-[0.2em] text-paper/40">
                  RECORD {Math.max(best, score)}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={start}
                    style={{
                      cursor: 'none',
                      borderColor: rgba(glow, 0.8),
                      boxShadow: `0 0 26px ${rgba(glow, 0.35)}`,
                      color: '#eafcff',
                    }}
                    className="rounded-md border-2 bg-black/50 px-7 py-3 font-pixel text-[11px] tracking-[0.2em] transition hover:-translate-y-0.5 hover:bg-black/75"
                  >
                    ↻ AGAIN
                  </button>
                  <button
                    onClick={onClose}
                    style={{ cursor: 'none' }}
                    className="font-hand text-xl text-paper/70 underline-offset-4 transition hover:text-gold hover:underline"
                  >
                    back to portfolio →
                  </button>
                </div>

                <div className="mt-7 font-hand text-lg" style={{ color: glow }}>
                  may the code be with you ✦
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
