import { motion } from 'framer-motion'
import { projects, type Project } from '../../data/portfolio'
import { SectionHeading, Reveal } from '../ui'
import { Vessel, Planet, Creeper, Lightsaber, ArrowDoodle } from '../Doodles'
import type { ComponentType, CSSProperties } from 'react'

type ThemeCfg = { color: string; Icon: ComponentType<{ className?: string; style?: CSSProperties }>; vibe: string }

const THEME: Record<Project['theme'], ThemeCfg> = {
  hollow: { color: '#5ce1e6', Icon: Vessel, vibe: 'Hollow Knight energy' },
  space: { color: '#b197fc', Icon: Planet, vibe: 'launched to orbit' },
  craft: { color: '#5fbf5f', Icon: Creeper, vibe: 'crafted block by block' },
  saber: { color: '#ffd43b', Icon: Lightsaber, vibe: 'the force is strong' },
}

export default function Projects() {
  return (
    <section id="projects" className="relative z-10 px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading kicker="03" kickerLabel="Quest Log" title="Quests I've cleared" color="#ff6b6b" underlineWidth={300} />
        <p className="mb-10 max-w-xl font-hand text-xl text-paper/70">
          A few adventures I've shipped — from a Hollow-Knight-inspired game to real products in the wild.
          Grab the loot: peek the code or play the live build.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <QuestCard project={p} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function QuestCard({ project, index }: { project: Project; index: number }) {
  const cfg = THEME[project.theme]
  const tilt = index % 2 === 0 ? -1.2 : 1.2

  return (
    <motion.article
      whileHover={{ y: -6, rotate: 0 }}
      data-sfx="quest"
      style={{ rotate: tilt, borderColor: '#101223' }}
      className="doodle-card group relative flex h-full flex-col overflow-hidden bg-nebula p-6"
    >
      {/* faint themed glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: cfg.color }}
      />

      <div className="relative mb-4 flex items-center justify-between">
        <span
          className="font-pixel text-[9px] text-ink"
          style={{ background: cfg.color, padding: '6px 8px', borderRadius: 4, boxShadow: '2px 2px 0 #101223' }}
        >
          {project.quest.toUpperCase()}
        </span>
        <motion.div
          animate={{ rotate: [tilt - 6, tilt + 6, tilt - 6], y: [0, -4, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: cfg.color }}
        >
          <cfg.Icon className="h-11 w-11" />
        </motion.div>
      </div>

      <h3 className="crayon font-marker text-4xl font-bold leading-none text-paper">{project.title}</h3>
      <div className="mt-1 font-hand text-sm italic" style={{ color: cfg.color }}>
        ✦ {cfg.vibe}
      </div>

      <p className="mt-3 flex-1 font-sans text-[15px] leading-relaxed text-paper/75">{project.blurb}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((t) => (
          <span key={t} className="rounded-full border border-paper/20 px-3 py-1 font-hand text-sm text-paper/70">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4">
        {project.demoLink && (
          <a
            href={project.demoLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-hand text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
            style={{ background: cfg.color, boxShadow: '3px 4px 0 #101223' }}
          >
            Play it
            <ArrowDoodle className="h-5 w-7" />
          </a>
        )}
        {project.ghLink && (
          <a
            href={project.ghLink}
            target="_blank"
            rel="noreferrer"
            className="sketch-link font-hand text-lg text-paper/85 hover:text-gold"
            style={{ color: project.demoLink ? undefined : cfg.color }}
          >
            View code →
          </a>
        )}
      </div>
    </motion.article>
  )
}
