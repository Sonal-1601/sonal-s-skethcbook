import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { sound, attachSound } from '../audio/engine'

const LS_SFX = 'sonal.sfx'
const LS_MUSIC = 'sonal.music'

// Equalizer bars that animate while music plays.
function EqIcon({ on }: { on: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      {[3, 8, 13].map((x, i) => (
        <motion.rect
          key={x}
          x={x}
          width="3"
          rx="1.2"
          fill="currentColor"
          animate={on ? { height: [5, 14, 7, 12, 5], y: [12, 3, 10, 5, 12] } : { height: 4, y: 8 }}
          transition={on ? { duration: 0.9 + i * 0.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        />
      ))}
    </svg>
  )
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
      {on ? (
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" />
      ) : (
        <path d="M17 9.5l4 5M21 9.5l-4 5" />
      )}
    </svg>
  )
}

export default function SoundControl() {
  const [sfxOn, setSfxOn] = useState(false)
  const [musicOn, setMusicOn] = useState(false)
  const [hint, setHint] = useState(false)

  // wire global hover/click SFX + audio unlock on first gesture
  useEffect(() => {
    attachSound()
    const savedSfx = localStorage.getItem(LS_SFX) === '1'
    const savedMusic = localStorage.getItem(LS_MUSIC) === '1'
    if (savedSfx) {
      sound.setMuted(false)
      setSfxOn(true)
    }
    // Music can't auto-start (browser autoplay policy); start on first gesture if previously on.
    if (savedMusic) {
      const resume = () => {
        sound.startMusic()
        setMusicOn(true)
        window.removeEventListener('pointerdown', resume)
      }
      window.addEventListener('pointerdown', resume, { once: true })
    }
    // Sync when another part of the app (e.g. the hero "Press Start") boots audio.
    const onChange = (e: Event) => {
      const d = (e as CustomEvent<{ sfx?: boolean; music?: boolean }>).detail
      if (d?.sfx !== undefined) {
        setSfxOn(d.sfx)
        localStorage.setItem(LS_SFX, d.sfx ? '1' : '0')
      }
      if (d?.music !== undefined) {
        setMusicOn(d.music)
        localStorage.setItem(LS_MUSIC, d.music ? '1' : '0')
      }
      setHint(false)
    }
    window.addEventListener('sonal:soundchange', onChange as EventListener)

    // show the "turn on sound" nudge briefly for first-timers
    let t1: number | undefined
    let t2: number | undefined
    if (!savedSfx && !savedMusic && !localStorage.getItem('sonal.sound.seen')) {
      t1 = window.setTimeout(() => setHint(true), 1600)
      t2 = window.setTimeout(() => setHint(false), 11000)
    }
    return () => {
      window.removeEventListener('sonal:soundchange', onChange as EventListener)
      if (t1) clearTimeout(t1)
      if (t2) clearTimeout(t2)
    }
  }, [])

  const dismissHint = () => {
    setHint(false)
    localStorage.setItem('sonal.sound.seen', '1')
  }

  const toggleSfx = () => {
    dismissHint()
    const next = !sfxOn
    setSfxOn(next)
    sound.unlock()
    sound.setMuted(!next)
    localStorage.setItem(LS_SFX, next ? '1' : '0')
    if (next) sound.chime()
  }

  const toggleMusic = () => {
    dismissHint()
    const next = !musicOn
    setMusicOn(next)
    if (next) sound.startMusic()
    else sound.stopMusic()
    localStorage.setItem(LS_MUSIC, next ? '1' : '0')
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {hint && (
          <motion.button
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={toggleMusic}
            className="doodle-card-light max-w-[190px] bg-gold px-3 py-2 text-left font-hand text-sm font-bold text-ink"
          >
            🔊 psst — turn on sound for the full game vibe!
            <span className="mt-0.5 block font-hand text-xs font-normal text-ink/70">tap here to start the music ♪</span>
          </motion.button>
        )}
      </AnimatePresence>

      <div
        className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-nebula/90 p-1.5 backdrop-blur-sm"
        style={{ boxShadow: '3px 4px 0 rgba(16,18,35,.7)' }}
      >
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={toggleSfx}
          aria-label={sfxOn ? 'Mute sound effects' : 'Enable sound effects'}
          title={sfxOn ? 'Sound effects: on' : 'Sound effects: off'}
          className="grid h-9 w-9 place-items-center rounded-full transition-colors"
          style={{ background: sfxOn ? '#5ce1e6' : 'transparent', color: sfxOn ? '#101223' : '#fbf6e9' }}
        >
          <SpeakerIcon on={sfxOn} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={toggleMusic}
          aria-label={musicOn ? 'Stop music' : 'Play music'}
          title={musicOn ? 'Music: on' : 'Music: off'}
          className="grid h-9 w-9 place-items-center rounded-full transition-colors"
          style={{ background: musicOn ? '#ffd43b' : 'transparent', color: musicOn ? '#101223' : '#fbf6e9' }}
        >
          <EqIcon on={musicOn} />
        </motion.button>
      </div>
    </div>
  )
}
