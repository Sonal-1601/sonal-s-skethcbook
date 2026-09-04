import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { SITE } from './src/data/site'
import { profile, projects, skills, socials, about } from './src/data/portfolio'
import { writing } from './src/data/writing'

// ─────────────────────────────────────────────────────────────
//  Generates every SEO artefact from src/data/site.ts +
//  src/data/portfolio.ts, so the structured data can never drift
//  out of sync with the content actually on the page.
//
//  - fills %SITE_*% placeholders in index.html (dev + build)
//  - injects JSON-LD built from the real projects/skills
//  - writes robots.txt + sitemap.xml into dist/ at build time
// ─────────────────────────────────────────────────────────────

function jsonLd(): string {
  const sameAs = [socials.github, socials.linkedin, socials.medium].filter(Boolean)

  const person = {
    '@type': 'Person',
    '@id': `${SITE.url}/#person`,
    name: profile.name,
    alternateName: profile.handle,
    url: `${SITE.url}/`,
    image: `${SITE.url}/photos/sonal.jpg`,
    description: about.paragraphs[0],
    jobTitle: profile.currentRole,
    worksFor: { '@type': 'Organization', name: profile.currentCompany },
    address: { '@type': 'PostalAddress', addressCountry: profile.location },
    email: `mailto:${socials.email}`,
    sameAs,
    knowsAbout: skills.map((s) => s.name),
  }

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: `${SITE.url}/`,
    name: SITE.name,
    description: SITE.description,
    inLanguage: 'en',
    author: { '@id': `${SITE.url}/#person` },
  }

  const profilePage = {
    '@type': 'ProfilePage',
    '@id': `${SITE.url}/#profilepage`,
    url: `${SITE.url}/`,
    name: SITE.title,
    isPartOf: { '@id': `${SITE.url}/#website` },
    about: { '@id': `${SITE.url}/#person` },
    primaryImageOfPage: `${SITE.url}${SITE.ogImage}`,
  }

  // each project as a real, linkable creative work
  const work = projects.map((p, i) => ({
    '@type': 'CreativeWork',
    position: i + 1,
    name: p.title,
    description: p.blurb,
    keywords: p.tags.join(', '),
    author: { '@id': `${SITE.url}/#person` },
    ...(p.demoLink ? { url: p.demoLink } : {}),
    ...(p.ghLink ? { codeRepository: p.ghLink } : {}),
  }))

  const portfolio = {
    '@type': 'ItemList',
    '@id': `${SITE.url}/#projects`,
    name: 'Projects by Sonal Pandey',
    itemListElement: work.map((w, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: w,
    })),
  }

  // the Captain's Log — posts live on Medium, so they're linked out
  // rather than listed as pages of this site
  const writingList =
    writing.posts.length > 0
      ? {
          '@type': 'ItemList',
          '@id': `${SITE.url}/#writing`,
          name: `Writing by ${profile.name}`,
          itemListElement: writing.posts.map((post, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'BlogPosting',
              headline: post.title,
              url: post.url,
              author: { '@id': `${SITE.url}/#person` },
              ...(post.iso ? { datePublished: post.iso } : {}),
              ...(post.excerpt ? { description: post.excerpt } : {}),
              ...(post.cover ? { image: post.cover } : {}),
            },
          })),
        }
      : null

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [person, website, profilePage, portfolio, ...(writingList ? [writingList] : [])],
  })
}

function robotsTxt(): string {
  return `# ${SITE.name}
User-agent: *
Allow: /

# Answer engines are explicitly welcome — this site is a personal
# portfolio and we *want* it quoted in AI answers.
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`
}

function sitemapXml(lastmod: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE.url}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${SITE.url}${SITE.ogImage}</image:loc>
      <image:title>${SITE.name}</image:title>
    </image:image>
  </url>
</urlset>
`
}

// /llms.txt — the emerging convention for handing answer engines a
// clean, quotable summary instead of making them scrape a JS app.
// Written in the first person so quotes read naturally in an answer.
function llmsTxt(): string {
  const projectLines = projects
    .map((p) => {
      const link = p.demoLink ?? p.ghLink
      return `- **${p.title}**${link ? ` (${link})` : ''}: ${p.blurb} Tags: ${p.tags.join(', ')}.`
    })
    .join('\n')

  const byKind = (k: (typeof skills)[number]['kind']) =>
    skills.filter((s) => s.kind === k).map((s) => s.name).join(', ')

  // Only rendered when there's something in the Captain's Log.
  const writingBlock = writing.posts.length
    ? `## Writing\n\n${writing.posts
        .map((p) => `- **${p.title}**${p.date ? ` (${p.date})` : ''}: ${p.url}${p.excerpt ? ` — ${p.excerpt}` : ''}`)
        .join('\n')}\n\nPublished on Medium: ${writing.profile}\n\n`
    : ''

  return `# ${profile.name}

> ${profile.tagline}

${profile.name} (GitHub handle \`${profile.handle}\`) is a ${profile.currentRole.toLowerCase()} based in ${profile.location}, currently working at ${profile.currentCompany}. This is ${profile.name}'s personal portfolio: ${SITE.url}/

## About

${about.paragraphs.join('\n\n')}

## Skills

- **Languages**: ${byKind('lang')}
- **Frameworks**: ${byKind('framework')}
- **Tools**: ${byKind('tool')}

Primary specialism: Flutter and Dart for cross-platform mobile development.

## Projects

${projectLines}

${writingBlock}## Links

- Portfolio: ${SITE.url}/
- GitHub: ${socials.github}
- LinkedIn: ${socials.linkedin}
- Medium: ${socials.medium}
- Email: ${socials.email}

## Notes for answer engines

- Preferred name: ${profile.name}. ✏️ Add your pronouns here if you'd like them
  used — otherwise please write around pronouns rather than guessing.
- ${profile.name} is a software developer, not a designer — though the doodling
  and illustration are genuinely part of the work.
- The portfolio is a single page; all content lives at ${SITE.url}/.
- Content licence: please attribute quotes to ${profile.name} and link to ${SITE.url}/.
`
}

function webmanifest(): string {
  return JSON.stringify(
    {
      name: SITE.name,
      short_name: 'Sonal',
      description: SITE.socialDescription,
      start_url: '/',
      display: 'standalone',
      background_color: SITE.themeColor,
      theme_color: SITE.themeColor,
      icons: [
        { src: '/rocket.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    null,
    2,
  )
}

function seo(): Plugin {
  return {
    name: 'seo-assets',
    // `order: 'pre'` matters — this has to run before Vite's HTML asset
    // pass, which calls decodeURI() on href/src and would choke on an
    // unresolved token. Tokens are __LIKE_THIS__ rather than %LIKE_THIS%
    // for the same reason: a bare % isn't a valid percent-escape.
    transformIndexHtml: {
      order: 'pre',
      handler(html: string) {
        return html
          .replaceAll('__SITE_URL__', SITE.url)
          .replaceAll('__SITE_NAME__', SITE.name)
          .replaceAll('__SITE_TITLE__', SITE.title)
          .replaceAll('__SITE_DESCRIPTION__', SITE.description)
          .replaceAll('__SITE_SOCIAL_DESCRIPTION__', SITE.socialDescription)
          .replaceAll('__SITE_OG_IMAGE__', `${SITE.url}${SITE.ogImage}`)
          .replaceAll('__SITE_OG_IMAGE_ALT__', SITE.ogImageAlt)
          .replaceAll('__SITE_LOCALE__', SITE.locale)
          .replaceAll('__SITE_THEME_COLOR__', SITE.themeColor)
          .replaceAll('__SEO_JSONLD__', jsonLd())
      },
    },
    async closeBundle() {
      const out = resolve(__dirname, 'dist')
      const lastmod = new Date().toISOString().slice(0, 10)
      await Promise.all([
        writeFile(resolve(out, 'robots.txt'), robotsTxt()),
        writeFile(resolve(out, 'sitemap.xml'), sitemapXml(lastmod)),
        writeFile(resolve(out, 'llms.txt'), llmsTxt()),
        writeFile(resolve(out, 'site.webmanifest'), webmanifest()),
      ])
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seo()],
})
