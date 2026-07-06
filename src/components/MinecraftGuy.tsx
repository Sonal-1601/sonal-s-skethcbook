import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { sound } from '../audio/engine'

export type Variant = 'sonal' | 'alex' | 'steve'

type Skin = {
  skin: string
  hair: string
  brow: string
  shirt: string
  pants: string
  shoe: string
  iris: string
  mouth: string
  armW: number
  glasses?: boolean
  longHair?: boolean
  holds?: 'laptop'
}

const SKINS: Record<Variant, Skin> = {
  // ✏️ "Sonal" — long black hair, lavender hoodie, fair skin, holds a laptop in one hand (other hand waves hi).
  sonal: { skin: '#e9ba91', hair: '#141319', brow: '#141319', shirt: '#c6b2e8', pants: '#7a5da8', shoe: '#20242e', iris: '#3a2620', mouth: '#9a5a46', armW: 4, longHair: false, holds: 'laptop' },
  alex: { skin: '#f2c9a0', hair: '#d9642a', brow: '#b04e1e', shirt: '#57a95a', pants: '#7a7a94', shoe: '#6a4b39', iris: '#3f8f3f', mouth: '#8a5a44', armW: 3 },
  steve: { skin: '#b58868', hair: '#4a3016', brow: '#3a2712', shirt: '#12b3b0', pants: '#3b40b0', shoe: '#5a4a3a', iris: '#7a5da8', mouth: '#6e4632', armW: 4 },
}

const P = 0.1 // world units per Minecraft pixel

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(x, y, w, h)
}
function pixTex(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  paint(ctx)
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestFilter
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function faceTex(s: Skin) {
  return pixTex(8, 8, (ctx) => {
    rect(ctx, 0, 0, 8, 8, s.skin)
    rect(ctx, 0, 0, 8, 2, s.hair) // fringe
    rect(ctx, 0, 0, 1, 6, s.hair) // sideburns / long hair frames the face
    rect(ctx, 7, 0, 1, 6, s.hair)
    if (s.glasses) {
      rect(ctx, 1, 3, 2, 2, '#141416') // lenses
      rect(ctx, 5, 3, 2, 2, '#141416')
      rect(ctx, 3, 3, 2, 1, '#141416') // bridge
      rect(ctx, 1, 3, 1, 1, '#43434c') // glints
      rect(ctx, 5, 3, 1, 1, '#43434c')
    } else {
      rect(ctx, 1, 2, 2, 1, s.brow)
      rect(ctx, 5, 2, 2, 1, s.brow)
      rect(ctx, 1, 3, 1, 2, '#ffffff')
      rect(ctx, 2, 3, 1, 2, s.iris)
      rect(ctx, 5, 3, 1, 2, s.iris)
      rect(ctx, 6, 3, 1, 2, '#ffffff')
    }
    rect(ctx, 3, 5, 2, 1, '#a3704c') // nose
    rect(ctx, 2, 6, 4, 1, s.mouth) // mouth
    rect(ctx, 2, 6, 1, 1, s.skin) // little smile lift at corners
    rect(ctx, 5, 6, 1, 1, s.skin)
  })
}
function sideTex(s: Skin) {
  return pixTex(8, 8, (ctx) => {
    rect(ctx, 0, 0, 8, 8, s.skin)
    rect(ctx, 0, 0, 8, 2, s.hair)
    rect(ctx, 0, 0, 2, 6, s.hair)
  })
}
function limbTex(top: string, bottom: string, splitRow: number) {
  return pixTex(4, 12, (ctx) => {
    rect(ctx, 0, 0, 4, 12, top)
    rect(ctx, 0, splitRow, 4, 12 - splitRow, bottom)
  })
}
function grassSideTex() {
  return pixTex(8, 8, (ctx) => {
    rect(ctx, 0, 0, 8, 8, '#8a6a43')
    rect(ctx, 0, 0, 8, 2, '#79bd57')
    rect(ctx, 1, 2, 1, 1, '#6aa94a')
    rect(ctx, 4, 2, 1, 1, '#6aa94a')
    rect(ctx, 2, 4, 1, 1, '#7a5c3a')
    rect(ctx, 5, 5, 1, 1, '#7a5c3a')
  })
}
function laptopScreenTex() {
  return pixTex(16, 12, (ctx) => {
    rect(ctx, 0, 0, 16, 12, '#0d1b2a')
    rect(ctx, 2, 2, 6, 1, '#5ce1e6')
    rect(ctx, 2, 4, 9, 1, '#ffd43b')
    rect(ctx, 4, 6, 6, 1, '#63e6be')
    rect(ctx, 2, 8, 4, 1, '#ff6b6b')
    // little heart
    rect(ctx, 11, 7, 1, 1, '#ff6b6b')
    rect(ctx, 13, 7, 1, 1, '#ff6b6b')
    rect(ctx, 10, 8, 5, 1, '#ff6b6b')
    rect(ctx, 11, 9, 3, 1, '#ff6b6b')
    rect(ctx, 12, 10, 1, 1, '#ff6b6b')
  })
}

function mat(opts: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, ...opts })
}

export default function MinecraftGuy({
  variant,
  className,
  onHoverChange,
}: {
  variant: Variant
  className?: string
  onHoverChange?: (hovering: boolean) => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const s = SKINS[variant]
    const holding = s.holds === 'laptop'
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    camera.position.set(1.6, 2.5, 6.7)
    camera.lookAt(0, 1.35, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(wrap.clientWidth, wrap.clientHeight)
    wrap.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    scene.add(new THREE.HemisphereLight(0xdfefff, 0x2a2a40, 0.5))
    const key = new THREE.DirectionalLight(0xffffff, 1.0)
    key.position.set(3, 6, 5)
    scene.add(key)

    const disposables: Array<{ dispose: () => void }> = []
    const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x)
    const extraMats: THREE.Material[] = []

    const player = new THREE.Group()
    const armW = s.armW * P

    const headMats = [
      mat({ map: track(sideTex(s)) }),
      mat({ map: track(sideTex(s)) }),
      mat({ color: s.hair }),
      mat({ color: s.skin }),
      mat({ map: track(faceTex(s)) }),
      mat({ color: s.hair }),
    ]
    const bodyMat = mat({ color: s.shirt })
    const armMat = mat({ map: track(limbTex(s.shirt, s.skin, 9)) })
    const legMat = mat({ map: track(limbTex(s.pants, s.shoe, 10)) })

    const box = (w: number, h: number, d: number) => track(new THREE.BoxGeometry(w, h, d))

    const headGroup = new THREE.Group()
    headGroup.position.set(0, 2.4, 0)
    const head = new THREE.Mesh(box(0.8, 0.8, 0.8), headMats)
    head.position.y = 0.4
    headGroup.add(head)

    const body = new THREE.Mesh(box(0.8, 1.2, 0.4), bodyMat)
    body.position.y = 1.8

    const limb = (geo: THREE.BoxGeometry, m: THREE.Material, px: number, py: number) => {
      const g = new THREE.Group()
      g.position.set(px, py, 0)
      const mesh = new THREE.Mesh(geo, m)
      mesh.position.y = -0.6
      g.add(mesh)
      return g
    }
    const shoulderX = 0.4 + armW / 2
    const armGeo = box(armW, 1.2, 0.4)
    const leftArm = limb(armGeo, armMat, -shoulderX, 2.4)
    const rightArm = limb(armGeo, armMat, shoulderX, 2.4)
    const legGeo = box(0.4, 1.2, 0.4)
    const leftLeg = limb(legGeo, legMat, -0.2, 1.2)
    const rightLeg = limb(legGeo, legMat, 0.2, 1.2)

    player.add(headGroup, body, leftArm, rightArm, leftLeg, rightLeg)

    // long hair (frames face + flows well down the back)
    if (s.longHair) {
      const hairMat = mat({ color: s.hair })
      extraMats.push(hairMat)
      const backHair = new THREE.Mesh(box(0.94, 2.5, 0.16), hairMat)
      backHair.position.set(0, 1.6, -0.3)
      const sideL = new THREE.Mesh(box(0.17, 1.9, 0.56), hairMat)
      sideL.position.set(-0.47, 1.7, 0.04)
      const sideR = new THREE.Mesh(box(0.17, 1.9, 0.56), hairMat)
      sideR.position.set(0.47, 1.7, 0.04)
      player.add(backHair, sideL, sideR)
    }

    // laptop held in the LEFT hand only — the right hand stays free to wave
    if (holding) {
      leftArm.rotation.x = -1.05
      leftArm.rotation.z = 0.16

      const grayMat = mat({ color: '#3a3f4a' })
      extraMats.push(grayMat)
      const laptop = new THREE.Group()
      laptop.position.set(-0.16, 1.74, 0.98)
      laptop.rotation.y = 0.28
      const base = new THREE.Mesh(box(0.58, 0.06, 0.4), grayMat)
      const lid = new THREE.Group()
      lid.position.set(0, 0, -0.17)
      lid.rotation.x = -0.2
      const lidBack = new THREE.Mesh(box(0.58, 0.4, 0.05), grayMat)
      lidBack.position.y = 0.2
      const scr = new THREE.MeshBasicMaterial({ map: track(laptopScreenTex()) })
      extraMats.push(scr)
      const screen = new THREE.Mesh(box(0.48, 0.3, 0.02), scr)
      screen.position.set(0, 0.2, 0.04)
      lid.add(lidBack, screen)
      laptop.add(base, lid)
      player.add(laptop)
    }

    scene.add(player)

    const grassMats = [
      mat({ map: track(grassSideTex()) }),
      mat({ map: track(grassSideTex()) }),
      mat({ color: '#79bd57' }),
      mat({ color: '#8a6a43' }),
      mat({ map: track(grassSideTex()) }),
      mat({ map: track(grassSideTex()) }),
    ]
    const block = new THREE.Mesh(box(1.9, 1.8, 1.9), grassMats)
    block.position.y = -0.9
    scene.add(block)

    // ── interaction ──
    const targetRot = { yaw: 0, pitch: 0 }
    const onMove = (e: PointerEvent) => {
      targetRot.yaw = (e.clientX / window.innerWidth - 0.5) * 1.2
      targetRot.pitch = (e.clientY / window.innerHeight - 0.5) * 0.7
    }
    window.addEventListener('pointermove', onMove)

    let jumpV = 0
    let jumping = false
    let greetT = 0
    let waveT = 0
    let nextWave = 4
    const hop = (strength: number) => {
      if (!jumping) {
        jumpV = strength
        jumping = true
      }
    }
    const onDown = () => {
      hop(0.16)
      sound.click()
    }
    const onEnter = () => {
      onHoverChange?.(true)
      greetT = 1.0
      waveT = 1.7 // wave hi with the free hand
      hop(0.11)
      sound.click()
    }
    const onLeave = () => onHoverChange?.(false)
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerenter', onEnter)
    renderer.domElement.addEventListener('pointerleave', onLeave)

    let visible = true
    const io = new IntersectionObserver((entries) => (visible = entries[0].isIntersecting), { threshold: 0.05 })
    io.observe(wrap)
    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      if (w && h) {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
    })
    ro.observe(wrap)

    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const t = clock.getElapsedTime()
      const dt = Math.min(clock.getDelta(), 0.05)

      headGroup.rotation.y += (targetRot.yaw - headGroup.rotation.y) * 0.12
      headGroup.rotation.x += (targetRot.pitch - headGroup.rotation.x) * 0.12
      player.rotation.y += (targetRot.yaw * 0.35 - player.rotation.y) * 0.06

      if (!reduce) {
        const sway = Math.sin(t * 1.6) * 0.1
        // left arm: holds the laptop when holding, else idle sway
        if (holding) {
          leftArm.rotation.x = -1.05 + sway * 0.1
          leftArm.rotation.z = 0.16
        } else {
          leftArm.rotation.x = sway
          leftArm.rotation.z = 0.06
        }
        // right arm: always free — idle sway + waves (periodically + on hover)
        rightArm.rotation.x = -sway
        rightArm.rotation.z = -0.06
        if (waveT <= 0 && t > nextWave) waveT = 1.7
        if (waveT > 0) {
          waveT -= dt
          rightArm.rotation.z = -2.35 + Math.sin(t * 16) * 0.4
          rightArm.rotation.x = 0
          if (waveT <= 0) nextWave = t + 6 + Math.random() * 4
        }
        leftLeg.rotation.x = -sway * 0.8
        rightLeg.rotation.x = sway * 0.8
        body.rotation.z = Math.sin(t * 1.6) * 0.012
      }

      // greeting head-nod
      if (greetT > 0) {
        greetT -= dt
        headGroup.rotation.x += Math.sin((1 - greetT) * 16) * 0.12
      }

      // jump / bob
      if (jumping) {
        player.position.y += jumpV
        jumpV -= 0.012
        if (player.position.y <= 0 && jumpV < 0) {
          player.position.y = 0
          jumping = false
          sound.inventory()
        }
      } else {
        player.position.y += (0 - player.position.y) * 0.2
        if (!reduce) player.position.y += Math.sin(t * 1.6) * 0.006
      }

      renderer.render(scene, camera)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerenter', onEnter)
      renderer.domElement.removeEventListener('pointerleave', onLeave)
      io.disconnect()
      ro.disconnect()
      disposables.forEach((d) => d.dispose())
        ;[...headMats, ...grassMats, ...extraMats, bodyMat, armMat, legMat].forEach((m) => m.dispose())
      renderer.dispose()
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement)
    }
  }, [variant, onHoverChange])

  return <div ref={wrapRef} className={className} aria-label="3D Minecraft character" role="img" />
}
