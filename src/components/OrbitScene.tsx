import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Planet, Pencil, Sparkle, Creeper, Vessel, Lightsaber, Comet, Star5 } from './Doodles'
import Astronaut from './Astronaut'
import { sound } from '../audio/engine'

// ─────────────────────────────────────────────────────────────
//  The hero's pocket solar system. Six doodles ride three tilted,
//  hand-drawn orbits, ducking behind the planet and swinging back
//  out in front. The whole system leans toward the cursor, nearby
//  satellites drift toward it like it has gravity, hovering one
//  brakes everything and says what it stands for, and the orbits
//  can be grabbed and flung like a prize wheel.
//  Every frame is written straight to the DOM from one rAF loop,
//  so none of the motion re-renders React.
// ─────────────────────────────────────────────────────────────

type V3 = [number, number, number]
type Lean = { tip: number; turn: number; bank: number }
type Pt = { x: number; y: number; z: number; k: number }

/** r is a fraction of the scene's width; tilt + roll in radians; speed in rad/s (inner runs faster, Kepler-ish) */
type Orbit = { r: number; tilt: number; roll: number; speed: number; color: string }

const TAU = Math.PI * 2

const ORBITS: Orbit[] = [
  { r: 0.3, tilt: 0.55, roll: -0.35, speed: 0.62, color: '#5ce1e6' },
  { r: 0.4, tilt: 0.42, roll: 0.4, speed: 0.44, color: '#b197fc' },
  { r: 0.49, tilt: 0.62, roll: -0.12, speed: 0.31, color: '#fbf6e9' },
]

// `at` is where each one sits on its orbit, as an angle
const SATS = [
  { orbit: 0, at: 0.3, Icon: Pencil, size: 'h-10 w-10', color: '#ffd43b', label: 'doodling since forever' },
  { orbit: 0, at: 0.3 + Math.PI, Icon: Sparkle, size: 'h-9 w-9', color: '#63e6be', label: 'Flutter, my weapon of choice' },
  { orbit: 1, at: 2.1, Icon: Creeper, size: 'h-11 w-11', color: '#5fbf5f', label: 'Minecraft builds' },
  { orbit: 1, at: 2.1 + Math.PI, Icon: Vessel, size: 'h-11 w-11', color: '#fbf6e9', label: 'Hollow Knight' },
  { orbit: 2, at: -1.2, Icon: Lightsaber, size: 'h-12 w-12', color: '#5ce1e6', label: 'Star Wars everything' },
  { orbit: 2, at: -1.2 + Math.PI, Icon: Comet, size: 'h-10 w-10', color: '#ff6b6b', label: 'rockets & the void' },
]

const MAX_SPIN = 18

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

const rotX = ([x, y, z]: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a)
  return [x, y * c - z * s, y * s + z * c]
}
const rotY = ([x, y, z]: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a)
  return [x * c + z * s, y, -x * s + z * c]
}
const rotZ = ([x, y, z]: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a)
  return [x * c - y * s, x * s + y * c, z]
}

// The orbit's two in-plane axes after tipping it toward the viewer, rolling it,
// then leaning the whole system toward the cursor. +z points away from the viewer.
function axes(o: Orbit, lean: Lean): [V3, V3] {
  const orient = (v: V3) => rotZ(rotY(rotX(rotZ(rotX(v, o.tilt), o.roll), lean.tip), lean.turn), lean.bank)
  return [orient([1, 0, 0]), orient([0, 0, 1])]
}

// a hand-drawn ring is never quite round
const wobble = (th: number, k: number) => 1 + 0.012 * Math.sin(3 * th + k * 1.7) + 0.007 * Math.sin(8 * th + k)

const f1 = (n: number) => n.toFixed(1)

export default function OrbitScene({ kick = 0 }: { kick?: number }) {
  const root = useRef<HTMLDivElement>(null)
  const size = useRef(0)
  const satEls = useRef<(HTMLDivElement | null)[]>([])
  const satBodies = useRef<(HTMLDivElement | null)[]>([])
  const ringsBack = useRef<(SVGPathElement | null)[]>([])
  const ringsFront = useRef<(SVGPathElement | null)[]>([])
  const trailsBack = useRef<(SVGPathElement | null)[]>([])
  const trailsFront = useRef<(SVGPathElement | null)[]>([])

  const [hovered, setHovered] = useState<number | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  const [boops, setBoops] = useState(() => SATS.map(() => 0))
  const [flips, setFlips] = useState(0)
  const [planetHot, setPlanetHot] = useState(false)
  const [spun, setSpun] = useState(false)
  const [coarse, setCoarse] = useState(false)
  const active = hovered ?? pinned
  const activeRef = useRef<number | null>(null)
  activeRef.current = active

  const sim = useRef({
    phase: ORBITS.map(() => 0),
    omega: ORBITS.map(() => 0), // measured angular velocity — drives trails + wheel ticks
    spin: 0, // fling momentum in rad/s, shared by every orbit
    brake: 1,
    nudge: 0, // drag rotation waiting to be applied on the next frame
    lean: { tip: 0, turn: 0, bank: 0 } as Lean,
    leanTo: { tip: 0, turn: 0, bank: 0 } as Lean,
    cursor: null as null | { x: number; y: number },
    pull: SATS.map(() => ({ x: 0, y: 0 })),
    pop: SATS.map(() => 0),
    tumble: SATS.map(() => 0),
    laps: SATS.map(() => 0),
    pos: SATS.map(() => ({ x: 0, y: 0 })),
    lastTick: 0,
  })

  const drag = useRef<null | { id: number; x0: number; y0: number; live: boolean; ang: number; t: number; vel: number }>(null)

  // ── the frame loop ──────────────────────────────────────────
  useEffect(() => {
    const el = root.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setCoarse(window.matchMedia('(pointer: coarse)').matches)
    const s = sim.current
    if (!reduced) s.spin = 7 // whirl in on arrival, then settle to cruising speed

    const ro = new ResizeObserver(([en]) => (size.current = en.contentRect.width))
    ro.observe(el)

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || reduced) return
      const r = el.getBoundingClientRect()
      s.cursor = { x: e.clientX - r.left, y: e.clientY - r.top }
      const nx = clamp((e.clientX - (r.left + r.width / 2)) / window.innerWidth, -0.5, 0.5)
      const ny = clamp((e.clientY - (r.top + r.height / 2)) / window.innerHeight, -0.5, 0.5)
      s.leanTo = { tip: -ny * 0.35, turn: nx * 0.6, bank: nx * 0.3 }
    }
    const onLeave = () => {
      s.cursor = null
      s.leanTo = { tip: 0, turn: 0, bank: 0 }
    }
    window.addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)

    let raf = 0
    let last = 0
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const S = size.current
      if (!S || !dt) return
      const ease = (rate: number) => 1 - Math.exp(-dt * rate)
      const cx = S / 2
      const cy = S / 2
      const F = S * 2.4
      const dragging = !!drag.current?.live
      const focus = activeRef.current

      for (const key of ['tip', 'turn', 'bank'] as const) s.lean[key] += (s.leanTo[key] - s.lean[key]) * ease(4)
      s.brake += ((focus !== null || dragging ? 0 : 1) - s.brake) * ease(9)
      s.spin *= Math.exp(-dt * 1.1)

      const nudge = s.nudge
      s.nudge = 0
      for (let k = 0; k < ORBITS.length; k++) {
        const d = (ORBITS[k].speed * (reduced ? 0 : 1) + s.spin) * s.brake * dt + nudge
        s.phase[k] += d
        s.omega[k] += (d / dt - s.omega[k]) * ease(10)
      }

      const ax = ORBITS.map((o) => axes(o, s.lean))
      const proj = (k: number, th: number): Pt => {
        const [u, v] = ax[k]
        const r = ORBITS[k].r * S * wobble(th, k)
        const c = Math.cos(th) * r
        const sn = Math.sin(th) * r
        const z = u[2] * c + v[2] * sn
        const kk = F / (F + z)
        return { x: cx + (u[0] * c + v[0] * sn) * kk, y: cy + (u[1] * c + v[1] * sn) * kk, z, k: kk }
      }

      // rings — drawn dash by dash so the dashes ride along with the orbit,
      // and each dash lands in front of or behind the planet by its own depth
      for (let k = 0; k < ORBITS.length; k++) {
        const n = Math.max(24, Math.round((TAU * ORBITS[k].r * S) / 13))
        const step = TAU / n
        let front = ''
        let back = ''
        for (let j = 0; j < n; j++) {
          const t0 = j * step + s.phase[k]
          const a = proj(k, t0)
          const m = proj(k, t0 + step * 0.25)
          const b = proj(k, t0 + step * 0.5)
          const seg = `M${f1(a.x)} ${f1(a.y)}L${f1(m.x)} ${f1(m.y)}L${f1(b.x)} ${f1(b.y)}`
          if (m.z < 0) front += seg
          else back += seg
        }
        ringsFront.current[k]?.setAttribute('d', front)
        ringsBack.current[k]?.setAttribute('d', back)
      }

      for (let i = 0; i < SATS.length; i++) {
        const sat = SATS[i]
        const k = sat.orbit
        const th = s.phase[k] + sat.at
        const p = proj(k, th)
        const r = ORBITS[k].r * S
        const depth = clamp(-p.z / r, -1, 1) // +1 nearest the viewer, -1 farthest
        const w = s.omega[k]

        // a little gravity toward the cursor — only on the hovered one once
        // something's hovered, or the others pile on top of it
        let gx = 0
        let gy = 0
        const isFocus = focus === i
        if (s.cursor && !dragging && (focus === null || isFocus)) {
          const dx = s.cursor.x - p.x
          const dy = s.cursor.y - p.y
          const d = Math.hypot(dx, dy)
          const R = S * 0.24
          if (d < R && d > 1) {
            const g = (1 - d / R) ** 2 * S * 0.07
            gx = (dx / d) * g
            gy = (dy / d) * g
          }
        }
        const pull = s.pull[i]
        pull.x += (gx - pull.x) * ease(8)
        pull.y += (gy - pull.y) * ease(8)
        const x = p.x + pull.x
        const y = p.y + pull.y
        s.pos[i] = { x, y }

        s.pop[i] += ((isFocus ? 1 : 0) - s.pop[i]) * ease(12)

        // flung satellites tumble, then right themselves once things calm down
        s.tumble[i] += s.spin * dt * 1.3
        if (Math.abs(s.spin) < 0.6) {
          s.tumble[i] += (Math.round(s.tumble[i] / TAU) * TAU - s.tumble[i]) * ease(3)
        }

        const scale = p.k * (0.86 + 0.14 * depth) * (1 + 0.38 * s.pop[i])
        const opacity = Math.min(1, 0.62 + 0.19 * (depth + 1) + s.pop[i])
        const outer = satEls.current[i]
        const body = satBodies.current[i]
        if (outer) {
          outer.style.transform = `translate3d(${f1(x)}px, ${f1(y)}px, 0)`
          outer.style.opacity = opacity.toFixed(3)
          outer.style.zIndex = isFocus ? '30' : p.z < 0 ? `${12 + Math.round(depth * 5)}` : `${2 + Math.round((depth + 1) * 2)}`
        }
        if (body) body.style.transform = `rotate(${s.tumble[i].toFixed(3)}rad) scale(${scale.toFixed(3)})`

        // comet trail, only once it's moving faster than cruising
        const len = clamp((Math.abs(w) - 1.1) * 0.1, 0, 1.3)
        let trail = ''
        if (len > 0.02) {
          const N = 10
          const dir = Math.sign(w)
          const pts: Pt[] = []
          for (let q = 0; q <= N; q++) pts.push(proj(k, th - dir * len * (q / N)))
          const W = S * 0.024
          const left: string[] = []
          const right: string[] = []
          for (let q = 0; q <= N; q++) {
            const a = pts[Math.max(0, q - 1)]
            const b = pts[Math.min(N, q + 1)]
            const tl = Math.hypot(b.x - a.x, b.y - a.y) || 1
            const nx = -(b.y - a.y) / tl
            const ny = (b.x - a.x) / tl
            const hw = (W * (1 - q / N) * pts[q].k) / 2
            left.push(`${f1(pts[q].x + nx * hw)} ${f1(pts[q].y + ny * hw)}`)
            right.unshift(`${f1(pts[q].x - nx * hw)} ${f1(pts[q].y - ny * hw)}`)
          }
          trail = `M${left.join('L')}L${right.join('L')}Z`
        }
        trailsFront.current[i]?.setAttribute('d', p.z < 0 ? trail : '')
        trailsBack.current[i]?.setAttribute('d', p.z < 0 ? '' : trail)

        // prize-wheel ticks as each satellite sweeps past the front
        const lap = Math.floor((th + Math.PI / 2) / TAU)
        if (lap !== s.laps[i]) {
          s.laps[i] = lap
          if (Math.abs(w) > 2.2 && now - s.lastTick > 45) {
            s.lastTick = now
            sound.hover()
          }
        }
      }
    }

    const start = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    // no point animating a solar system nobody can see
    const io = new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()))
    io.observe(el)

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // ── grab + fling ────────────────────────────────────────────
  // The pointer's angle around the hub turns the orbits. The rings are wide and
  // flat, so stretch the vertical first or a sideways drag barely registers.
  const angleAt = (clientX: number, clientY: number) => {
    const r = root.current!.getBoundingClientRect()
    const dx = clientX - (r.left + r.width / 2)
    const dy = clientY - (r.top + r.height / 2)
    return { a: Math.atan2(dy * 2, dx), dist: Math.hypot(dx, dy) }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, live: false, ang: angleAt(e.clientX, e.clientY).a, t: e.timeStamp, vel: 0 }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.live) {
      // a few pixels of slack so a click on a satellite stays a click
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return
      d.live = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setHovered(null)
      setPinned(null)
    }
    const { a, dist } = angleAt(e.clientX, e.clientY)
    const da = ((a - d.ang + 3 * Math.PI) % TAU) - Math.PI
    d.ang = a
    const dt = Math.max(8, e.timeStamp - d.t) / 1000
    d.t = e.timeStamp
    // right at the hub the angle swings wildly, so ignore it there
    const step = dist < size.current * 0.08 ? 0 : -da
    sim.current.nudge += step
    d.vel = d.vel * 0.5 + (step / dt) * 0.5
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>, fling: boolean) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.live) return
    // held still before letting go = no throw
    const v = fling && e.timeStamp - d.t < 90 ? clamp(d.vel, -MAX_SPIN, MAX_SPIN) : 0
    sim.current.spin = v
    sim.current.brake = 1
    if (Math.abs(v) > 4) sound.quest()
    setSpun(true)
  }

  // ── slingshot: the planet (or PRESS START) whips everything around ──
  const slingshot = () => {
    const s = sim.current
    s.spin = clamp(s.spin + (Math.sign(s.spin) || 1) * 9, -MAX_SPIN, MAX_SPIN)
    s.brake = 1
    setFlips((f) => f + 1)
  }

  useEffect(() => {
    if (kick) slingshot()
  }, [kick])

  // clicked labels stay up a moment, so taps on touch screens can read them
  useEffect(() => {
    if (pinned === null) return
    const t = window.setTimeout(() => setPinned(null), 2200)
    return () => window.clearTimeout(t)
  }, [pinned])

  const tapSat = (i: number) => {
    sound.chime()
    setBoops((b) => b.map((n, j) => (j === i ? n + 1 : n)))
    setPinned(i)
  }

  const activeOrbit = active === null ? null : SATS[active].orbit
  const S = size.current || 420
  const labelPos = active === null ? null : sim.current.pos[active]

  return (
    <motion.div
      ref={root}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, true)}
      onPointerCancel={(e) => endDrag(e, false)}
      className="relative isolate mx-auto aspect-square w-full max-w-[420px] select-none"
      style={{ touchAction: 'pan-y' }}
    >
      {/* background twinkles */}
      <Star5 className="absolute right-3 top-4 h-5 w-5 animate-twinkle text-gold/80" />
      <Sparkle className="absolute bottom-8 left-6 h-4 w-4 animate-twinkle text-saber/70" style={{ animationDelay: '1.1s' }} />
      <Sparkle className="absolute bottom-2 right-16 h-3 w-3 animate-twinkle text-grape/70" style={{ animationDelay: '2s' }} />

      {/* far halves of the rings, behind the planet */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={{ zIndex: 1 }} aria-hidden="true">
        {ORBITS.map((o, k) => (
          <path
            key={k}
            ref={(n) => (ringsBack.current[k] = n)}
            fill="none"
            stroke={activeOrbit === k ? SATS[active!].color : o.color}
            strokeOpacity={activeOrbit === k ? 0.45 : 0.24}
            strokeWidth={1.6}
            strokeLinecap="round"
            style={{ transition: 'stroke .25s, stroke-opacity .25s' }}
          />
        ))}
        {SATS.map((s, i) => (
          <path key={i} ref={(n) => (trailsBack.current[i] = n)} fill={s.color} fillOpacity={0.3} />
        ))}
      </svg>

      {/* the planet — click it for a gravity slingshot */}
      <div className="absolute left-1/2 top-1/2" style={{ zIndex: 6, transform: 'translate(-45.8%, -45.8%)' }}>
        <motion.div
          animate={planetHot ? { rotate: -8, scale: 1.05 } : { rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
          className="pointer-events-none"
        >
          <Planet className="h-40 w-40 text-grape sm:h-48 sm:w-48" style={{ filter: 'drop-shadow(4px 6px 0 rgba(16,18,35,.5))' }} />
        </motion.div>
        <button
          type="button"
          aria-label="Slingshot the orbits"
          data-cursor="grab"
          onClick={() => {
            sound.quest()
            slingshot()
          }}
          onPointerEnter={() => setPlanetHot(true)}
          onPointerLeave={() => setPlanetHot(false)}
          onFocus={() => setPlanetHot(true)}
          onBlur={() => setPlanetHot(false)}
          className="absolute left-[20.8%] top-[20.8%] h-1/2 w-1/2 rounded-full outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -right-6 -top-14"
        >
          <motion.div
            key={flips}
            initial={flips ? { rotate: -360, scale: 1.15 } : false}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.3, 1] }}
          >
            <Astronaut className="h-32 w-32" />
          </motion.div>
        </motion.div>
      </div>

      {/* near halves of the rings, in front of the planet */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={{ zIndex: 10 }} aria-hidden="true">
        {ORBITS.map((o, k) => (
          <path
            key={k}
            ref={(n) => (ringsFront.current[k] = n)}
            fill="none"
            stroke={activeOrbit === k ? SATS[active!].color : o.color}
            strokeOpacity={activeOrbit === k ? 0.95 : 0.5}
            strokeWidth={activeOrbit === k ? 2.6 : 2.2}
            strokeLinecap="round"
            style={{ transition: 'stroke .25s, stroke-opacity .25s' }}
          />
        ))}
        {SATS.map((s, i) => (
          <path key={i} ref={(n) => (trailsFront.current[i] = n)} fill={s.color} fillOpacity={0.55} />
        ))}
      </svg>

      {/* satellites */}
      {SATS.map((s, i) => {
        const on = active === i
        const below = on && labelPos !== null && labelPos.y < S * 0.22
        // keep labels on-screen near the scene's edges
        const shift = !on || labelPos === null ? -50 : labelPos.x < S * 0.25 ? -18 : labelPos.x > S * 0.75 ? -82 : -50
        return (
          <div key={i} ref={(n) => (satEls.current[i] = n)} className="absolute left-0 top-0" style={{ willChange: 'transform' }}>
            <button
              type="button"
              aria-label={s.label}
              data-cursor="grab"
              onPointerEnter={() => {
                if (drag.current?.live) return
                setHovered(i)
                sound.hover()
              }}
              onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered((h) => (h === i ? null : h))}
              onClick={() => tapSat(i)}
              className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full p-2 outline-none focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-gold"
              style={{ color: s.color }}
            >
              <div ref={(n) => (satBodies.current[i] = n)}>
                <motion.div
                  key={boops[i]}
                  initial={boops[i] ? { rotate: -360, scale: 1.5 } : false}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.2, 0.8, 0.3, 1] }}
                  style={{
                    filter: on ? `drop-shadow(0 0 10px ${s.color})` : 'drop-shadow(3px 3px 0 rgba(16,18,35,.5))',
                    transition: 'filter .25s',
                  }}
                >
                  <s.Icon className={s.size} />
                </motion.div>
              </div>
            </button>
            <div
              className="pointer-events-none absolute left-0"
              style={below ? { top: 34, transform: `translateX(${shift}%)` } : { bottom: 34, transform: `translateX(${shift}%)` }}
            >
              <AnimatePresence>
                {on && (
                  <motion.div
                    initial={{ opacity: 0, y: below ? -6 : 6, scale: 0.8, rotate: -7 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: -3 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
                    transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                    className="whitespace-nowrap rounded-md bg-paper px-2.5 py-1 font-hand text-base font-bold leading-tight text-ink"
                    style={{ border: '2px solid #101223', boxShadow: `3px 3px 0 ${s.color}` }}
                  >
                    {s.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )
      })}

      {/* nudge, until they've had a go */}
      <AnimatePresence>
        {!spun && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 2.2, duration: 0.5 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="pointer-events-none absolute -top-2 left-0 flex items-start gap-1 font-hand text-base leading-tight text-paper/60"
            style={{ zIndex: 40, rotate: -6 }}
          >
            <span>
              {coarse ? 'swipe to spin' : 'grab the orbits'}
              <br />
              {coarse ? 'the orbits' : "& fling 'em"}
            </span>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-3">
              <path d="M3 6c12-2 22 5 25 18" />
              <path d="M22 21l6 4 3-7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
