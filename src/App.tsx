import SvgDefs from './components/SvgDefs'
import Starfield from './components/Starfield'
import Cursor from './components/Cursor'
import SoundControl from './components/SoundControl'
import Nav from './components/Nav'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Skills from './components/sections/Skills'
import GitHubWall from './components/sections/GitHubWall'
import Projects from './components/sections/Projects'
import FunFacts from './components/sections/FunFacts'
import Contact from './components/sections/Contact'

export default function App() {
  return (
    <div className="starnote-bg relative min-h-screen">
      <SvgDefs />
      <Starfield />
      <Cursor />
      <SoundControl />
      <Nav />

      <main className="relative">
        <Hero />
        <About />
        <Skills />
        <GitHubWall />
        <Projects />
        <FunFacts />
        <Contact />
      </main>
    </div>
  )
}
