import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { RoughNotation, RoughNotationGroup } from 'react-rough-notation'
import { about } from '../../data/portfolio'
import { LevelChip, ScribbleUnderline } from '../ui'
import { Pencil, Heart, Planet, Star5 } from '../Doodles'

export default function About() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-120px' })

  return (
    <section id="about" className="sketch-page relative z-10 px-5 py-24">
      {/* torn top + bottom edges */}
      <TornEdge position="top" />
      <TornEdge position="bottom" />

      <div ref={ref} className="mx-auto max-w-5xl">
        <LevelChip n="01" label="The Origin Story" color="#7048e8" />
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          {/* Left: doodle "about me" polaroid */}
          <motion.div
            initial={{ opacity: 0, x: -20, rotate: -4 }}
            whileInView={{ opacity: 1, x: 0, rotate: -3 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mx-auto w-full max-w-xs"
          >
            <div className="doodle-card-light bg-white p-4">
              <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-lg bg-gradient-to-b from-nebula to-space">
                {/* mini scene */}
                <Planet className="absolute -right-6 -top-4 h-24 w-24 text-grape" />
                <Star5 className="absolute left-4 top-6 h-6 w-6 text-gold" />
                <div className="text-center">
                  <div className="font-marker text-3xl text-paper">creating &amp;</div>
                  <div className="font-marker text-4xl font-bold text-gold">doodling</div>
                  <div className="mt-1 font-hand text-lg text-saber">since forever ✏️</div>
                </div>
                <Pencil className="absolute bottom-4 right-6 h-9 w-9 text-tangerine" />
              </div>
              <div className="mt-3 text-center font-marker text-2xl text-ink">— that's me, Sonal —</div>
            </div>
          </motion.div>

          {/* Right: the story with marker highlights */}
          <div>
            <h2 className="crayon font-marker text-5xl font-bold leading-none text-ink sm:text-6xl">
              {about.greeting}
            </h2>
            <ScribbleUnderline color="#7048e8" width={220} />

            <RoughNotationGroup show={inView}>
              <div className="mt-6 space-y-5 font-sans text-lg leading-relaxed text-[#2b2e44]">
                <p>
                  I'm a software developer who wandered into the{' '}
                  <RoughNotation type="underline" color="#ff6b6b" animationDuration={900} strokeWidth={2.5} multiline order={1}>
                    captivating realm of programming
                  </RoughNotation>{' '}
                  while chasing new challenges — and never left.
                </p>
                <p>
                  My expertise lives in{' '}
                  <RoughNotation type="highlight" color="#ffe066" animationDuration={800} multiline order={2}>
                    Flutter &amp; Dart
                  </RoughNotation>
                  , building mobile experiences that actually feel good to use. When I'm not doing that, I ship products with{' '}
                  <RoughNotation type="box" color="#5ce1e6" animationDuration={900} strokeWidth={2} padding={4} order={3}>
                    Node.js
                  </RoughNotation>{' '}
                  and modern JavaScript frameworks.
                </p>
                <p>
                  I'm equally fascinated by{' '}
                  <RoughNotation type="circle" color="#7048e8" animationDuration={1100} strokeWidth={2.5} padding={6} order={4}>
                    space technology
                  </RoughNotation>{' '}
                  and the creative magic of{' '}
                  <RoughNotation type="underline" color="#63e6be" animationDuration={900} strokeWidth={3} order={5}>
                    animation
                  </RoughNotation>
                  . Basically: if it's tech and it catches my attention, I'm already exploring it.
                </p>
              </div>
            </RoughNotationGroup>

            {/* quick facts strip */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Fact label="based in" value="India 🇮🇳" />
              <Fact label="currently" value="Dev @ Enpointe Io" />
              <Fact label="mode" value="always exploring" />
            </div>

            <div className="mt-6 flex items-center gap-2 font-hand text-lg text-coral">
              <Heart className="h-5 w-5" />
              <span>built with too much coffee &amp; a lot of doodles</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="doodle-card-light bg-parch px-4 py-2">
      <div className="font-pixel text-[8px] uppercase tracking-wide text-[#7048e8]">{label}</div>
      <div className="font-hand text-lg font-bold text-ink">{value}</div>
    </div>
  )
}

// Decorative torn-paper edge (dark space showing through the tear).
function TornEdge({ position }: { position: 'top' | 'bottom' }) {
  const isTop = position === 'top'
  return (
    <svg
      className={`absolute inset-x-0 ${isTop ? 'top-0 -translate-y-[1px]' : 'bottom-0 translate-y-[1px] rotate-180'} h-4 w-full`}
      viewBox="0 0 1200 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 20 L0 8 Q 30 2 60 8 T 120 8 T 180 6 T 240 9 T 300 6 T 360 9 T 420 6 T 480 9 T 540 6 T 600 9 T 660 6 T 720 9 T 780 6 T 840 9 T 900 6 T 960 9 T 1020 6 T 1080 9 T 1140 6 T 1200 8 L1200 20 Z"
        fill="#fbf6e9"
      />
    </svg>
  )
}
