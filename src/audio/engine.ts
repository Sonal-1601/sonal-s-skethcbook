// ─────────────────────────────────────────────────────────────
//  Tiny procedural game-audio engine (Web Audio API).
//  Everything is synthesized — no audio files, no licensing, ~0kb assets.
//  SFX: soft UI blips, a Minecraft-ish "wood click" for the inventory, pops.
//  Music: a gentle looping space-chiptune (Am–F–C–G) with a delay echo.
// ─────────────────────────────────────────────────────────────

type Ctor = typeof AudioContext

class AudioEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private sfxGain!: GainNode
  private musicGain!: GainNode
  private noiseBuffer!: AudioBuffer

  muted = true
  musicOn = false

  // music scheduler state
  private timer: number | null = null
  private nextNoteTime = 0
  private step = 0
  private musicNodes: AudioNode[] = []
  private delay?: DelayNode

  // lightsaber hum state (a live drone, kept alive while the arena is open)
  private humGain?: GainNode
  private humFilter?: BiquadFilterNode
  private humOsc: OscillatorNode[] = []
  private humOn = false

  /** Create the AudioContext (must be called from a user gesture). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const Ctx: Ctor | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext
    if (!Ctx) return
    this.ctx = new Ctx()

    this.master = this.ctx.createGain()
    this.master.gain.value = 1
    this.master.connect(this.ctx.destination)

    // SFX + music have independent gains so they can be toggled separately.
    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = this.muted ? 0 : 0.9
    this.sfxGain.connect(this.master)

    // Music runs through a subtle stereo-ish delay for a spacey tail.
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0
    this.delay = this.ctx.createDelay(0.5)
    this.delay.delayTime.value = 0.28
    const fb = this.ctx.createGain()
    fb.gain.value = 0.28
    const wet = this.ctx.createGain()
    wet.gain.value = 0.22
    this.musicGain.connect(this.master)
    this.musicGain.connect(this.delay)
    this.delay.connect(fb)
    fb.connect(this.delay)
    this.delay.connect(wet)
    wet.connect(this.master)

    // one shared noise buffer for percussive clicks
    const len = Math.floor(this.ctx.sampleRate * 0.4)
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = this.noiseBuffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  }

  private get t() {
    return this.ctx ? this.ctx.currentTime : 0
  }

  // ── SFX ──────────────────────────────────────────────────
  private blip(freq: number, dur: number, type: OscillatorType, peak: number, slideTo?: number) {
    if (!this.ctx) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, this.t)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, this.t + dur)
    g.gain.setValueAtTime(0.0001, this.t)
    g.gain.exponentialRampToValueAtTime(peak, this.t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + dur)
    o.connect(g)
    g.connect(this.sfxGain)
    o.start(this.t)
    o.stop(this.t + dur + 0.02)
  }

  private noiseClick(freq: number, dur: number, peak: number) {
    if (!this.ctx) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = freq
    bp.Q.value = 1.2
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(peak, this.t)
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + dur)
    src.connect(bp)
    bp.connect(g)
    g.connect(this.sfxGain)
    src.start(this.t)
    src.stop(this.t + dur + 0.02)
  }

  /** filtered noise whose band sweeps — the body of whooshes and sizzles */
  private noiseSweep(dur: number, from: number, to: number, peak: number) {
    if (!this.ctx) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true
    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 2.4
    bp.frequency.setValueAtTime(from, this.t)
    bp.frequency.exponentialRampToValueAtTime(Math.max(40, to), this.t + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, this.t)
    g.gain.exponentialRampToValueAtTime(peak, this.t + dur * 0.28)
    g.gain.exponentialRampToValueAtTime(0.0001, this.t + dur)
    src.connect(bp)
    bp.connect(g)
    g.connect(this.sfxGain)
    src.start(this.t)
    src.stop(this.t + dur + 0.02)
  }

  /** soft, slightly-random hover blip */
  hover() {
    if (!this.ctx || this.muted) return
    this.blip(620 + Math.random() * 180, 0.06, 'triangle', 0.05)
  }

  /** UI pop / press */
  click() {
    if (!this.ctx || this.muted) return
    this.blip(380, 0.12, 'sine', 0.09, 760)
  }

  /** Minecraft-ish "wood click" — noise thock + low tone */
  inventory() {
    if (!this.ctx || this.muted) return
    this.noiseClick(1050, 0.05, 0.14)
    this.blip(180, 0.09, 'sine', 0.12, 120)
  }

  /** whoosh-y quest select */
  quest() {
    if (!this.ctx || this.muted) return
    this.blip(300, 0.18, 'sawtooth', 0.05, 620)
    this.noiseClick(2200, 0.12, 0.03)
  }

  /** little two-note sparkle */
  chime() {
    if (!this.ctx || this.muted) return
    this.blip(880, 0.12, 'triangle', 0.06)
    window.setTimeout(() => this.blip(1174, 0.16, 'triangle', 0.05), 90)
  }

  /** "GAME START!" rising arcade jingle (plays through sfxGain once unmuted) */
  startJingle() {
    if (!this.ctx) return
    const notes = [523.25, 659.25, 783.99, 1046.5] // C E G C
    notes.forEach((f, i) => window.setTimeout(() => this.blip(f, 0.16, 'square', 0.09), i * 95))
    window.setTimeout(() => {
      this.blip(1318.51, 0.32, 'triangle', 0.08) // sparkle finish
      this.noiseClick(3200, 0.2, 0.02)
    }, 4 * 95)
  }

  /** lightsaber swish — a doppler-ish whoosh past the ear */
  saberSwing() {
    if (!this.ctx || this.muted) return
    const dir = Math.random() < 0.5 ? 1 : -1
    this.noiseSweep(0.22, 260, 1500 + Math.random() * 700, 0.05 * (1 + Math.random() * 0.4))
    this.blip(260 * (dir > 0 ? 1 : 1.25), 0.18, 'sawtooth', 0.022, 620)
  }

  /** snap-hiss: the blade igniting out of the emitter */
  saberIgnite() {
    if (!this.ctx || this.muted) return
    this.noiseClick(2600, 0.05, 0.09)            // the "snap"
    this.noiseSweep(0.45, 180, 900, 0.055)        // the "hiss" opening up
    this.blip(70, 0.5, 'sawtooth', 0.06, 190)     // the drone winding up
  }

  /** blade collapsing back into the hilt */
  saberRetract() {
    if (!this.ctx || this.muted) return
    this.noiseSweep(0.3, 1200, 160, 0.05)
    this.blip(220, 0.28, 'sawtooth', 0.04, 60)
  }

  /** plasma meeting carapace: a sizzling burn-through */
  saberHit() {
    if (!this.ctx || this.muted) return
    this.noiseClick(3000, 0.07, 0.1)
    this.noiseSweep(0.16, 1800, 400, 0.06)
    this.blip(150, 0.14, 'square', 0.06, 55)
  }

  /** bug squash splat */
  squash() {
    if (!this.ctx || this.muted) return
    this.noiseClick(520, 0.13, 0.13)
    this.blip(200, 0.12, 'square', 0.08, 70)
  }

  /** Start / stop the continuous blade drone. Safe to call repeatedly. */
  saberHum(on: boolean) {
    this.unlock()
    if (!this.ctx) return
    if (on) {
      if (this.humOn) return
      this.humOn = true
      const g = this.ctx.createGain()
      g.gain.value = 0.0001
      const lp = this.ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 420
      lp.Q.value = 4
      // Three slightly detuned saws beat against each other -> that restless
      // "alive plasma" wobble a single oscillator can never fake.
      for (const f of [58, 87.5, 117]) {
        const o = this.ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = f
        o.detune.value = (Math.random() - 0.5) * 22
        o.connect(lp)
        o.start()
        this.humOsc.push(o)
      }
      lp.connect(g)
      g.connect(this.sfxGain)
      this.humGain = g
      this.humFilter = lp
      g.gain.setTargetAtTime(this.muted ? 0 : 0.05, this.t, 0.25)
    } else {
      if (!this.humOn) return
      this.humOn = false
      const g = this.humGain
      const osc = this.humOsc
      this.humOsc = []
      this.humGain = undefined
      this.humFilter = undefined
      if (g) g.gain.setTargetAtTime(0.0001, this.t, 0.12)
      const stopAt = this.t + 0.6
      osc.forEach((o) => o.stop(stopAt))
    }
  }

  /** 0..1 — how hard the blade is being swung; opens the hum up. */
  setSaberIntensity(v: number) {
    if (!this.ctx || !this.humGain || !this.humFilter) return
    const k = Math.max(0, Math.min(1, v))
    this.humGain.gain.setTargetAtTime(this.muted ? 0 : 0.045 + k * 0.085, this.t, 0.08)
    this.humFilter.frequency.setTargetAtTime(380 + k * 1500, this.t, 0.08)
  }

  // ── Mute / volume ───────────────────────────────────────
  setMuted(m: boolean) {
    this.muted = m
    if (!this.ctx) return
    this.sfxGain.gain.cancelScheduledValues(this.t)
    this.sfxGain.gain.setTargetAtTime(m ? 0 : 0.9, this.t, 0.05)
    if (this.humGain) this.humGain.gain.setTargetAtTime(m ? 0 : 0.06, this.t, 0.05)
  }

  // ── Music ───────────────────────────────────────────────
  private scheduleStep(time: number) {
    if (!this.ctx) return
    // A minor pentatonic dream over Am–F–C–G (4 bars, 4 eighths each)
    const LEAD: (number | null)[] = [
      659.25, null, 523.25, null, // Am: E5 .. C5
      698.46, null, 440.0, null, // F : F5 .. A4
      659.25, null, 783.99, null, // C : E5 .. G5
      587.33, null, 493.88, null, // G : D5 .. B4
    ]
    const BASS: (number | null)[] = [
      110.0, null, null, null, // A2
      87.31, null, null, null, // F2
      130.81, null, null, null, // C3
      98.0, null, null, null, // G2
    ]
    // twinkle sparkles on the off-beats (very quiet, high)
    const SPARKLE = [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true]

    const lead = LEAD[this.step]
    if (lead) this.playMusicNote(lead, time, 0.42, 'triangle', 0.16, 2200)
    const bass = BASS[this.step]
    if (bass) this.playMusicNote(bass, time, 1.1, 'sine', 0.22, 500)
    if (SPARKLE[this.step] && Math.random() > 0.5)
      this.playMusicNote(1567.98 + Math.random() * 200, time, 0.2, 'triangle', 0.03, 4000)
  }

  private playMusicNote(freq: number, time: number, dur: number, type: OscillatorType, peak: number, cutoff: number) {
    if (!this.ctx) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = cutoff
    o.type = type
    o.frequency.value = freq
    o.detune.value = (Math.random() - 0.5) * 6
    g.gain.setValueAtTime(0.0001, time)
    g.gain.exponentialRampToValueAtTime(peak, time + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    o.connect(lp)
    lp.connect(g)
    g.connect(this.musicGain)
    o.start(time)
    o.stop(time + dur + 0.05)
    this.musicNodes.push(o)
    if (this.musicNodes.length > 64) this.musicNodes.splice(0, 32)
  }

  private tick = () => {
    if (!this.ctx) return
    const stepDur = 0.3 // eighth note ≈ 100bpm
    while (this.nextNoteTime < this.t + 0.12) {
      this.scheduleStep(this.nextNoteTime)
      this.nextNoteTime += stepDur
      this.step = (this.step + 1) % 16
    }
  }

  startMusic() {
    this.unlock()
    if (!this.ctx) return
    this.musicOn = true
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    this.musicGain.gain.cancelScheduledValues(this.t)
    this.musicGain.gain.setTargetAtTime(0.14, this.t, 0.6)
    this.step = 0
    this.nextNoteTime = this.t + 0.1
    if (this.timer == null) this.timer = window.setInterval(this.tick, 25)
  }

  stopMusic() {
    this.musicOn = false
    if (!this.ctx) return
    this.musicGain.gain.cancelScheduledValues(this.t)
    this.musicGain.gain.setTargetAtTime(0, this.t, 0.3)
    if (this.timer != null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
  }
}

export const sound = new AudioEngine()

// Handy console handle (e.g. `__sound.startMusic()`); also used for testing.
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__sound = sound
}

// ── Global bindings: unlock on first gesture + delegated hover/click SFX ──
let bound = false
let lastHover: Element | null = null

function playForElement(el: Element) {
  const kind = (el as HTMLElement).dataset?.sfx
  if (kind === 'inventory') sound.inventory()
  else if (kind === 'quest') sound.quest()
  else if (kind === 'note') sound.chime()
  else sound.hover()
}

export function attachSound() {
  if (bound || typeof document === 'undefined') return
  bound = true

  const unlock = () => sound.unlock()
  document.addEventListener('pointerdown', unlock, { once: true })
  document.addEventListener('keydown', unlock, { once: true })

  document.addEventListener(
    'pointerover',
    (e) => {
      const el = (e.target as Element)?.closest?.('a,button,[data-sfx]') ?? null
      if (el !== lastHover) {
        lastHover = el
        if (el) playForElement(el)
      }
    },
    { passive: true },
  )

  document.addEventListener(
    'pointerdown',
    (e) => {
      const el = (e.target as Element)?.closest?.('a,button,[data-sfx]')
      if (el) sound.click()
    },
    { passive: true },
  )
}
