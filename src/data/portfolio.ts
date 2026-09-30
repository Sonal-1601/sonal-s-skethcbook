// ─────────────────────────────────────────────────────────────
//  All of Sonal's content lives here — edit this one file to
//  update the site. Pulled & expanded from sonal-pandey.web.app.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Sonal Pandey',
  handle: 'Sonal-1601',
  // Rotating roles for the typewriter in the hero
  roles: ['Software Developer', 'Flutter Developer', 'Open Source Contributor', 'Doodler', 'Space Nerd'],
  location: 'India',
  currentRole: 'Software Developer',
  currentCompany: 'Enpointe Io',
  tagline: 'I build things for screens, doodle on everything else, and get gloriously lost in space + games.',
}

// Her intro, broken into fragments so we can scribble-highlight keywords.
export const about = {
  greeting: "Hey, I'm Sonal 👋",
  paragraphs: [
    "I'm a software developer who wandered into the captivating realm of programming while chasing new challenges — and never left.",
    "My expertise lives in Flutter & Dart, building mobile experiences that actually feel good to use. When I'm not doing that, I ship products with Node.js and modern JavaScript frameworks.",
    "I'm equally fascinated by the boundless possibilities of space technology and the creative magic of animation. Basically: if it's tech and it catches my attention, I'm already exploring it.",
  ],
  // Keywords we underline / circle / highlight with rough-notation
  highlights: {
    programming: 'programming',
    flutter: 'Flutter & Dart',
    node: 'Node.js',
    space: 'space technology',
    animation: 'animation',
  },
}

// ── The polaroid stack in the About section ──────────────────
//  Each entry is one photo in the frame. Everything works with zero
//  images: without `img` we draw a doodle scene from `lines` + `doodles`.
//  ✏️ To use a real photo, drop it in `public/photos/` and set
//     img: '/photos/whatever.jpg' — the doodle scene steps aside.
export type AboutDoodle =
  | 'planet' | 'star' | 'pencil' | 'rocket' | 'moon' | 'comet'
  | 'controller' | 'creeper' | 'lightsaber' | 'boot' | 'cloud'
  | 'spark' | 'sparkle' | 'heart' | 'ufo' | 'vessel' | 'globe'

export type AboutSlide = {
  id: string
  /** optional real photo — e.g. '/photos/me.jpg' */
  img?: string
  /** alt text, required whenever `img` is set */
  alt?: string
  /** CSS object-position for the photo crop, e.g. 'center 30%'. Tall phone
   *  shots get cropped top+bottom by the 4:5 frame — nudge this to keep the
   *  face in view. Ignored when there's no `img`. */
  focus?: string
  /** three stacked lines of hand-lettering (ignored when `img` is set) */
  lines?: [string, string, string]
  /** handwritten caption under the frame */
  caption: string
  /** colour of the middle, emphasised line (also tints the active dot) */
  accent: string
  /** doodles scattered into the four corner slots (ignored when `img` is set) */
  doodles: AboutDoodle[]
}

export const aboutSlides: AboutSlide[] = [
  {
    id: 'me',
    img: '/photos/sonal.jpg',
    alt: 'Sonal in sunglasses and a lilac sweatshirt, sitting outdoors throwing shakas',
    focus: 'center 22%',
    caption: "— that's me, Sonal —",
    accent: '#ffd43b',
    doodles: [],
  },
  {
    id: 'doodling',
    lines: ['creating &', 'doodling', 'since forever ✏️'],
    caption: '— my default state —',
    accent: '#ffd43b',
    doodles: ['planet', 'star', 'pencil'],
  },
  {
    id: 'flutter',
    lines: ['building apps', 'in Flutter', 'that feel good 📱'],
    caption: '— my weapon of choice —',
    accent: '#5ce1e6',
    doodles: ['vessel', 'sparkle', 'spark'],
  },
  {
    id: 'blue-zombie',
    lines: ['made a game', 'Blue Zombie', 'just for the love of it'],
    caption: '— boss fight cleared —',
    accent: '#63e6be',
    doodles: ['controller', 'creeper', 'heart'],
  },
  {
    id: 'space',
    lines: ['endlessly nerdy', 'about space', 'rockets & the void 🚀'],
    caption: '— side quest: orbit —',
    accent: '#b197fc',
    doodles: ['moon', 'rocket', 'comet', 'ufo'],
  },
  {
    id: 'outdoors',
    lines: ['best ideas', 'happen uphill', 'trails > treadmills 🥾'],
    caption: '— touching grass, occasionally —',
    accent: '#ffa94d',
    doodles: ['cloud', 'globe', 'boot'],
  },
  {
    id: 'gaming',
    lines: ['Minecraft builds,', 'Hollow Knight', 'Star Wars everything ⚔️'],
    caption: '— respawning since forever —',
    accent: '#ff6b6b',
    doodles: ['creeper', 'star', 'lightsaber'],
  },
]

export type Project = {
  title: string
  blurb: string
  tags: string[]
  theme: 'hollow' | 'space' | 'craft' | 'saber'
  ghLink?: string
  demoLink?: string
  quest: string // playful "quest" label
}

export const projects: Project[] = [
  {
    title: 'Blue Zombie',
    blurb:
      'A game inspired by Hollow Knight — built purely for the love of it. Dive into infected marine depths and see what the ocean became.',
    tags: ['Game Dev', 'Hollow Knight vibes', 'For fun'],
    theme: 'hollow',
    ghLink: 'https://github.com/Sonal-1601/blue_zombie',
    quest: 'Boss Fight',
  },
  {
    title: 'Silver By Sakshi',
    blurb: 'A polished storefront for a jewelry brand — clean, elegant, and built to make silver shine online.',
    tags: ['Web', 'E-commerce', 'Firebase'],
    theme: 'space',
    demoLink: 'https://silver-by-sakshi.web.app/',
    quest: 'Side Quest',
  },
  {
    title: 'Artist On Click',
    blurb: 'A platform for artists to showcase their work and connect with each other — a home base for creators.',
    tags: ['Product', 'Community', 'Design'],
    theme: 'craft',
    demoLink: 'https://medium.com/@pandeysonal1601/artist-on-click-1718603b7420',
    quest: 'Main Quest',
  },
  {
    title: 'Tvaraa Studio',
    blurb: 'A creative agency site that helps brands tell their story to the world — motion, polish and personality.',
    tags: ['Web', 'Agency', 'Branding'],
    theme: 'saber',
    demoLink: 'https://tvaraa-studio.web.app/',
    quest: 'Main Quest',
  },
]

// Skills laid out like a Minecraft hotbar / inventory.
export type Skill = { name: string; level: number; kind: 'lang' | 'framework' | 'tool' }
export const skills: Skill[] = [
  { name: 'Flutter', level: 5, kind: 'framework' },
  { name: 'Dart', level: 5, kind: 'lang' },
  { name: 'JavaScript', level: 4, kind: 'lang' },
  { name: 'Node.js', level: 4, kind: 'framework' },
  { name: 'React', level: 4, kind: 'framework' },
  { name: 'TypeScript', level: 3, kind: 'lang' },
  { name: 'Firebase', level: 4, kind: 'tool' },
  { name: 'Git', level: 4, kind: 'tool' },
  { name: 'Figma', level: 3, kind: 'tool' },
]

// A photo pinned to a side quest. Give a fact one of these and its sticky
// note becomes clickable — the picture opens as a polaroid.
export type FunFactPhoto = {
  src: string
  alt: string
  caption: string
  /** CSS object-position, for steering the crop away from the centre. */
  focus?: string
  /** Shape of the polaroid's frame as a CSS aspect-ratio, e.g. '3 / 4' for a
   *  portrait phone shot. Match it to the photo and nothing gets cropped.
   *  Defaults to '3 / 2'. */
  aspect?: string
}

export type FunFact = {
  icon: string
  label: string
  note: string
  /** The first one is the photo pinned to the note; the rest sit behind it
   *  in the pile and come forward as you tap through. */
  photos?: FunFactPhoto[]
}

// "Side quests" — the human stuff.
export const funFacts: FunFact[] = [
  { icon: 'doodle', label: 'Doodling & scribbling', note: 'Notebooks, tablets, whiteboards — nothing is safe.' },
  {
    icon: 'boot',
    label: 'Hiking',
    note: 'Trails > treadmills. Best ideas happen uphill.',
    photos: [
      {
        src: '/photos/hiking.jpg',
        alt: 'Sonal on a green hillside in a rain jacket, monsoon clouds and waterfalls on the ridge behind',
        caption: 'somewhere in the maharashtra, mid-monsoon',
        focus: '40% center',
      },
    ],
  },
  {
    icon: 'globe',
    label: 'Travelling',
    note: 'Collecting places, food and tiny doodles from each.',
    photos: [
      {
        src: '/photos/thailand.jpg',
        alt: 'Sonal standing before Wat Phra Kaew at the Grand Palace in Bangkok, flanked by two golden guardian statues',
        caption: 'the grand palace, bangkok',
        // shot on a phone at 3:4 — matching the frame means nothing gets cropped
        aspect: '3 / 4',
      },
      {
        src: '/photos/expressway.jpg',
        alt: 'A rain-soaked expressway curving into a tunnel beneath a green monsoon hillside',
        caption: 'somewhere on the expressway, mid-rain',
        aspect: '3 / 4',
      },
    ],
  },
  {
    icon: 'controller',
    label: 'Gaming',
    note: 'Minecraft builds, Hollow Knight runs, Star Wars everything.',
    photos: [
      {
        src: '/photos/gaming.jpg',
        alt: 'A backlit controller held in front of a laptop running Hollow Knight, lit blue by the screen',
        caption: 'hollow knight, well past midnight',
        aspect: '9 / 16',
      },
    ],
  },
  { icon: 'planet', label: 'Space', note: 'Endlessly nerdy about rockets, planets & the void.' },
  { icon: 'spark', label: 'Exploring tech', note: 'If it catches my interest, I am already tinkering with it.' },
]

// ── Frames That Rewired Me ───────────────────────────────────
//  Cinema + art that shape how I think. `nowShowing` is whatever's on
//  the projector right now. Every phrase in `highlights` gets a marker
//  swipe wherever it turns up in the story, the plot hole or the
//  takeaway, so keep them word-for-word.
export const nowShowing = {
  title: 'Limitless',
  year: 2011,
  director: 'Neil Burger',
  hook: 'the one living rent-free in my head',
  story: [
    "Eddie Morra is stuck — broke, blocked, going nowhere. Then he takes one clear little pill, NZT-48, and his whole brain comes online: everything he's ever read, heard or seen, suddenly organised and within reach.",
    "I didn't walk out wanting the pill. I walked out obsessed with the question underneath it — how far my brain could actually go if I trained it on purpose.",
    "So that's become a big part of my journey lately: treating my brain like a project. Set the goal, show up, measure it, iterate. Focus is a muscle, learning is a loop, and there's no final release — only the next build.",
    'And on the days things slip, this is the reminder that pulls me back. A bad day is a failed build, not a broken codebase — read the logs, fix what broke, push again.',
  ],
  // the film's premise, fact-checked
  plotHole:
    "The film's big line — that we can only access 20% of our brains — is a myth. We already use all of it. The real upgrade is neuroplasticity: the brain physically rewires itself around whatever you repeat.",
  plotTwist: 'Slower than a pill. But it never wears off.',
  takeaway:
    "The version of me I'm chasing isn't at the bottom of a pill bottle — it's built one focused session at a time.",
  highlights: [
    'NZT-48',
    'how far my brain could actually go',
    'treating my brain like a project',
    'a failed build, not a broken codebase',
    'neuroplasticity',
    'one focused session at a time',
  ],
}

export const socials = {
  github: 'https://github.com/Sonal-1601',
  linkedin: 'https://www.linkedin.com/in/pandeysonal/',
  medium: 'https://medium.com/@pandeysonal1601',
  // ✏️ Update this to Sonal's preferred contact email:
  email: 'pandeysonal1601@gmail.com',
}
