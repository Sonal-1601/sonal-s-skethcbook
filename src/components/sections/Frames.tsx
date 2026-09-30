import { SectionHeading, Reveal } from '../ui'
import LimitlessReel from '../frames/Limitless'
import FightClubReel from '../frames/FightClub'

// ─────────────────────────────────────────────────────────────
//  Frames That Rewired Me — cinema + art that shape how I think,
//  screened as a double feature. Each film is its own reel in
//  src/components/frames/, with a prop built for that film; the
//  words live in src/data/portfolio.ts.
// ─────────────────────────────────────────────────────────────

const ACCENT = '#ffa94d'

export default function Frames() {
  return (
    <section id="frames" className="relative z-10 px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading kicker="2.7" kickerLabel="Dim The Lights" title="Frames That Rewired Me" color={ACCENT} underlineWidth={320} />
        <p className="mb-10 max-w-xl font-hand text-xl text-paper/70">
          Cinema and art are a big part of what makes me, me. Some frames sneak into my head and quietly
          rewire how I think — the good ones never leave. Tonight's a double feature. 🎬
        </p>

        <LimitlessReel />
        <Changeover />
        <FightClubReel />

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <a
              href="#forest"
              data-cursor="pointer"
              data-sfx="click"
              className="doodle-card inline-flex items-center gap-2 bg-paper px-5 py-2.5 font-hand text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
            >
              🌲 See the training log ↑
            </a>
            <a
              href="#commits"
              data-cursor="pointer"
              data-sfx="click"
              className="doodle-card inline-flex items-center gap-2 bg-paper px-5 py-2.5 font-hand text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
            >
              🥊 See the fight record ↑
            </a>
          </div>
          <span className="font-hand text-sm text-paper/40">no pills were taken and nobody got punched in the making of this section 💊🥊</span>
        </div>
      </div>
    </section>
  )
}

// the reel change. Projectionists watch for these dots in the corner of
// the frame — Tyler, a projectionist himself, calls them cigarette burns
function Changeover() {
  return (
    <Reveal className="my-20 sm:my-24">
      <div className="flex items-center gap-3 sm:gap-5" aria-hidden="true">
        <span className="flex-1 border-t-2 border-dashed border-paper/15" />
        <span className="cue-mark cue-blink shrink-0" />
        <span className="shrink-0 font-pixel text-[7px] uppercase tracking-[0.3em] text-paper/45">changeover · reel 02</span>
        <span className="cue-mark cue-blink shrink-0" />
        <span className="flex-1 border-t-2 border-dashed border-paper/15" />
      </div>
      <p className="mx-auto mt-4 max-w-md text-center font-hand text-base leading-snug text-paper/50">
        see those dots? projectionists call them cigarette burns — the cue to swap reels. the guy who taught me
        that has a habit of splicing single frames into films, so keep your eyes on the screen. 👀
      </p>
    </Reveal>
  )
}
