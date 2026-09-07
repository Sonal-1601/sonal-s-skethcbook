#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
//  Renders scripts/og-template.html to public/og.png (1200×630),
//  the social-share card. Also renders public/apple-touch-icon.png.
//
//    npm run make:og
//
//  Uses headless Chrome over CDP with REAL wall-clock waits so web
//  fonts finish loading — Chrome's --virtual-time-budget does not
//  reliably wait for them, and half-rendered fonts look broken.
//
//  Only needs re-running when the template or the photo changes;
//  the PNGs are committed, so normal builds don't touch Chrome.
// ─────────────────────────────────────────────────────────────

import { spawn } from 'node:child_process'
import { writeFile, mkdtemp, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    try { await access(c); return c } catch {}
  }
  throw new Error(`no Chrome found. Tried:\n  ${CHROME_CANDIDATES.join('\n  ')}`)
}

const TARGETS = [
  {
    url: `file://${join(ROOT, 'scripts/og-template.html')}`,
    out: join(ROOT, 'public/og.jpg'),
    width: 1200,
    height: 630,
    scale: 1,
    // JPEG, not PNG: the same card is ~460 kB as a PNG and ~175 kB here, and
    // WhatsApp quietly drops link-preview images that run much past ~300 kB.
    // At q90 the lettering stays crisp — check it if you re-tune the template.
    format: 'jpeg',
    quality: 90,
  },
  {
    // the rocket favicon on the site's dark background, for iOS home screens
    url:
      'data:text/html,' +
      encodeURIComponent(
        `<body style="margin:0;width:180px;height:180px;background:#0a0b1a;display:grid;place-items:center">
           <img src="file://${join(ROOT, 'public/rocket.svg')}" style="width:118px;height:118px">
         </body>`,
      ),
    out: join(ROOT, 'public/apple-touch-icon.png'),
    width: 180,
    height: 180,
    scale: 1,
  },
]

const chromePath = await findChrome()
const profile = await mkdtemp(join(tmpdir(), 'og-'))
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--allow-file-access-from-files',
  '--remote-debugging-port=9335', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: 'ignore' })

let targets
for (let i = 0; i < 80; i++) {
  try {
    targets = await (await fetch('http://localhost:9335/json/list')).json()
    if (targets.some((t) => t.type === 'page')) break
  } catch {}
  await sleep(250)
}
const page = targets?.find((t) => t.type === 'page')
if (!page) { chrome.kill(); throw new Error('could not reach headless Chrome') }

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
}
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })

await send('Page.enable')
await send('Runtime.enable')

for (const t of TARGETS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: t.width, height: t.height, deviceScaleFactor: t.scale, mobile: false,
  })
  await send('Page.navigate', { url: t.url })
  await sleep(1200)

  // block until webfonts are actually ready, then one more beat to paint
  await send('Runtime.evaluate', {
    expression: 'document.fonts ? document.fonts.ready.then(() => true) : true',
    awaitPromise: true,
  })
  await sleep(600)

  const { data } = await send('Page.captureScreenshot', {
    format: t.format ?? 'png',
    ...(t.quality ? { quality: t.quality } : {}),
    captureBeyondViewport: false,
  })
  const bytes = Buffer.from(data, 'base64')
  await writeFile(t.out, bytes)
  console.log(`✓ ${t.out.replace(ROOT + '/', '')}  ${t.width}×${t.height}  ${(bytes.length / 1024).toFixed(0)} kB`)
}

ws.close()
chrome.kill()
