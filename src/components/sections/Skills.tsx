import { lazy, Suspense, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { skills, type Skill } from '../../data/portfolio'
import { SectionHeading, Reveal } from '../ui'
import { PixelIcon } from '../PixelIcons'
import type { Variant } from '../MinecraftGuy'

// Three.js is heavy — load it only when this section scrolls near the viewport.
const MinecraftGuy = lazy(() => import('../MinecraftGuy'))

const KIND_COLOR: Record<Skill['kind'], string> = {
  lang: '#ffd43b',
  framework: '#5ce1e6',
  tool: '#b197fc',
}
const KIND_LABEL: Record<Skill['kind'], string> = {
  lang: 'LANGUAGE',
  framework: 'FRAMEWORK',
  tool: 'TOOL',
}

export default function Skills() {
  return (
    <section id="skills" className="relative z-10 px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 grid items-center gap-8 lg:grid-cols-[1fr_330px]">
          <div>
            <SectionHeading kicker="02" kickerLabel="Open Inventory" title="My Inventory" color="#5fbf5f" underlineWidth={240} />
            <p className="max-w-xl font-hand text-xl text-paper/70">
              The tools I've collected on the journey so far — crafted, mined and battle-tested.
              Hover a block to check its level, and say hi to my buddy — drag your mouse, they'll follow. Click to make them jump!
            </p>
          </div>
          <CharacterCard />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {skills.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.05}>
              <InventorySlot skill={s} />
            </Reveal>
          ))}
        </div>

        {/* Minecraft hotbar — scrolls internally on tiny screens, centered on wide ones */}
        <Reveal delay={0.1} className="mt-12">
          <div className="mx-auto max-w-full overflow-x-auto pb-2">
            <div className="mx-auto w-max">
              <div className="mb-2 text-center font-pixel text-[9px] text-creeper">EQUIPPED · HOTBAR</div>
              <div
                className="flex gap-1 rounded-md p-1 sm:gap-1.5 sm:p-1.5"
                style={{ background: '#c6c6c6', boxShadow: 'inset 2px 2px 0 #fff, inset -2px -2px 0 #555, 4px 5px 0 rgba(16,18,35,.6)' }}
              >
                {skills.slice(0, 9).map((s, i) => (
                  <div
                    key={s.name}
                    data-sfx="inventory"
                    className="grid h-9 w-9 place-items-center p-1 sm:h-12 sm:w-12 sm:p-1.5"
                    style={{
                      background: '#8b8b8b',
                      boxShadow: `inset 2px 2px 0 #373737, inset -2px -2px 0 #ffffff55${i === 0 ? ', 0 0 0 2px #fff' : ''}`,
                    }}
                    title={s.name}
                  >
                    <PixelIcon name={s.name} className="h-full w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const GREETING: Record<Variant, string> = {
  sonal: "Hi! I'm Sonal 👋",
  alex: 'Hey there! 👋',
  steve: 'Howdy, dev! 👋',
}

const AVATARS: { id: Variant; name: string; color: string }[] = [
  { id: 'sonal', name: 'Sonal', color: '#c6b2e8' },
  { id: 'alex', name: 'Alex', color: '#57a95a' },
  { id: 'steve', name: 'Steve', color: '#12b3b0' },
]

function CharacterCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '200px' })
  const [variant, setVariant] = useState<Variant>('sonal')
  const [hi, setHi] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="doodle-card relative mx-auto w-full max-w-[330px] overflow-hidden bg-gradient-to-b from-nebula to-space p-3"
    >
      {/* label */}
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="font-pixel text-[9px] text-creeper">◆ SPAWN POINT</span>
        <span className="font-hand text-sm text-paper/50">hover to say hi!</span>
      </div>

      {/* 3D viewport */}
      <div
        data-cursor="grab"
        className="relative h-[300px] w-full overflow-hidden rounded-xl"
        style={{ background: 'radial-gradient(circle at 50% 35%, rgba(99,230,190,.10), transparent 60%)' }}
      >
        {/* speech bubble */}
        <AnimatePresence>
          {hi && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2"
            >
              <div className="relative whitespace-nowrap rounded-2xl bg-paper px-4 py-2 font-hand text-lg font-bold text-ink" style={{ boxShadow: '3px 4px 0 rgba(16,18,35,.55)' }}>
                {GREETING[variant]}
                <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-paper" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {inView ? (
          <Suspense fallback={<Loading />}>
            <MinecraftGuy variant={variant} onHoverChange={setHi} className="h-full w-full" />
          </Suspense>
        ) : (
          <Loading />
        )}
      </div>

      {/* character select */}
      <div className="mt-3 mb-1.5 text-center font-pixel text-[9px] text-gold">◄ CHOOSE YOUR PLAYER ►</div>
      <div className="flex gap-2">
        {AVATARS.map((a) => {
          const active = variant === a.id
          return (
            <button
              key={a.id}
              onClick={() => setVariant(a.id)}
              className="relative flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-ink py-2 font-hand text-base font-bold transition-transform active:translate-y-0.5"
              style={active ? { background: '#63e6be', color: '#101223', boxShadow: '2px 2px 0 #101223' } : { background: 'transparent', color: '#fbf6e9' }}
            >
              <span className="h-3 w-3 rounded-full border border-ink" style={{ background: a.color }} />
              {a.name}
              {active && <span className="absolute -top-2 -right-1.5 rounded bg-gold px-1 font-pixel text-[7px] text-ink">P1</span>}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

function Loading() {
  return (
    <div className="grid h-full w-full place-items-center">
      <span className="animate-pulse font-pixel text-[9px] text-creeper">LOADING…</span>
    </div>
  )
}

function InventorySlot({ skill }: { skill: Skill }) {
  const color = KIND_COLOR[skill.kind]
  return (
    <motion.div
      whileHover={{ y: -5, rotate: -1 }}
      data-cursor="grab"
      data-sfx="inventory"
      className="group relative select-none rounded-lg p-3"
      style={{
        background: '#2c3150',
        boxShadow: 'inset 2px 2px 0 rgba(255,255,255,.09), inset -3px -3px 0 rgba(0,0,0,.4), 4px 5px 0 rgba(16,18,35,.55)',
        border: '2px solid #101223',
      }}
    >
      <div className="mb-2 flex items-start justify-between">
        <div
          className="grid h-11 w-11 place-items-center overflow-hidden rounded-md p-1.5"
          style={{
            background: '#12152b',
            boxShadow: `inset 2px 2px 0 rgba(0,0,0,.45), inset -2px -2px 0 rgba(255,255,255,.06), 0 0 0 1.5px ${color}55`,
          }}
        >
          <PixelIcon name={skill.name} className="h-full w-full" />
        </div>
        <span className="font-pixel text-[7px] text-paper/40">{KIND_LABEL[skill.kind]}</span>
      </div>
      <div className="font-hand text-xl font-bold text-paper">{skill.name}</div>
      {/* level pips */}
      <div className="mt-1.5 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="h-2 w-full rounded-[2px]"
            style={{ background: i < skill.level ? color : 'rgba(255,255,255,.12)' }}
          />
        ))}
      </div>
      <span className="pointer-events-none absolute -top-3 right-2 rounded font-pixel text-[8px] text-ink opacity-0 transition-opacity group-hover:opacity-100" style={{ background: color, padding: '3px 5px' }}>
        LVL {skill.level}
      </span>
    </motion.div>
  )
}
