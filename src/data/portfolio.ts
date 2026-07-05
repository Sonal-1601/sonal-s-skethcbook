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

// "Side quests" — the human stuff.
export const funFacts = [
  { icon: 'doodle', label: 'Doodling & scribbling', note: 'Notebooks, tablets, whiteboards — nothing is safe.' },
  { icon: 'boot', label: 'Hiking', note: 'Trails > treadmills. Best ideas happen uphill.' },
  { icon: 'globe', label: 'Travelling', note: 'Collecting places, food and tiny doodles from each.' },
  { icon: 'controller', label: 'Gaming', note: 'Minecraft builds, Hollow Knight runs, Star Wars everything.' },
  { icon: 'planet', label: 'Space', note: 'Endlessly nerdy about rockets, planets & the void.' },
  { icon: 'spark', label: 'Exploring tech', note: 'If it catches my interest, I am already tinkering with it.' },
]

export const socials = {
  github: 'https://github.com/Sonal-1601',
  linkedin: 'https://www.linkedin.com/in/pandeysonal/',
  medium: 'https://medium.com/@pandeysonal1601',
  // ✏️ Update this to Sonal's preferred contact email:
  email: 'pandeysonal1601@gmail.com',
}
