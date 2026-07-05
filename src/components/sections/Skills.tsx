import { motion } from 'framer-motion'
import { skills, type Skill } from '../../data/portfolio'
import { SectionHeading, Reveal } from '../ui'
import { Creeper } from '../Doodles'
import { PixelIcon } from '../PixelIcons'

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
        <SectionHeading kicker="02" kickerLabel="Open Inventory" title="My Inventory" color="#5fbf5f" underlineWidth={240} />
        <p className="mb-10 max-w-xl font-hand text-xl text-paper/70">
          The tools I've collected on the journey so far — crafted, mined and battle-tested.
          Hover a block to check its level.
        </p>

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

      {/* peeking creeper */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="pointer-events-none mx-auto mt-10 w-fit text-creeper"
      >
        <Creeper className="h-12 w-12 animate-wobble" />
      </motion.div>
    </section>
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
