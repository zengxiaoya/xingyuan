import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore.js'
import { AVATAR_LIST, AvatarDisplay } from '../components/Avatars.jsx'

/* ─────────────────────────────────────────────
   数据
───────────────────────────────────────────── */
const POEM_LINES = ['光从深渊来', '知识像星光', '穿越亿万年的黑暗', '照亮此刻的你']
const CREDITS = [
  { text: '一款为好奇心而生的',     highlights: [] },
  { text: '宇宙探索学习游戏',       highlights: ['宇宙探索学习游戏'] },
  { text: '通过「闯关 + AI 对话」', highlights: ['闯关', 'AI 对话'] },
  { text: '探索浩瀚星空的知识',     highlights: ['浩瀚星空'] },
]

/* ─────────────────────────────────────────────
   PlanetLogo SVG
───────────────────────────────────────────── */
function PlanetLogo({ size = 72, uid = 'a' }) {
  const g  = `pg_${uid}`
  const fc = `pfc_${uid}`
  const bc = `pbc_${uid}`
  const cx = 40, cy = 44
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ overflow:'visible' }}>
      <defs>
        <radialGradient id={g} cx="32%" cy="28%" r="70%">
          <stop offset="0%"   stopColor="#6B5FD0" />
          <stop offset="48%"  stopColor="#26215C" />
          <stop offset="100%" stopColor="#070512" />
        </radialGradient>
        <clipPath id={fc}><rect x="0" y={cy} width="80" height="80"/></clipPath>
        <clipPath id={bc}><rect x="0" y="0"  width="80" height={cy}/></clipPath>
      </defs>
      <ellipse cx={cx} cy={cy} rx="36" ry="11"
        stroke="#7F77DD" strokeWidth="2.2" fill="none" strokeOpacity="0.3"
        clipPath={`url(#${bc})`} />
      <circle cx={cx} cy={cy} r="17.5" fill={`url(#${g})`} />
      <ellipse cx={cx} cy={cy} rx="36" ry="11"
        stroke="#7F77DD" strokeWidth="2.2" fill="none"
        clipPath={`url(#${fc})`} />
      <circle cx="61" cy="17" r="5"   fill="#EF9F27" />
      <circle cx="4"  cy="44" r="2.8" fill="white" fillOpacity="0.75" />
      <circle cx="14" cy="60" r="1.6" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

function LogoBanner({ iconSize = 72, titleSize = 56, gap = 20 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap }}>
      <PlanetLogo size={iconSize} uid="banner" />
      <div>
        <div style={{
          fontFamily:"'PingFang SC','Microsoft YaHei',system-ui,sans-serif",
          fontSize: titleSize, fontWeight:700, color:'#EEEDFE',
          letterSpacing:'0.2em', lineHeight:1.1,
        }}>星&nbsp;渊</div>
        <div style={{
          fontFamily:'var(--font-english)',
          fontSize: Math.round(titleSize*0.22),
          letterSpacing:'0.35em', color:'#AFA9EC', marginTop:'0.15em',
        }}>XING&nbsp;&nbsp;YUAN</div>
        <div style={{
          fontSize: Math.round(titleSize*0.18),
          color:'#6b66b0', letterSpacing:'0.18em', marginTop:'0.3em',
        }}>探索宇宙的奥秘</div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   逐字揭示
───────────────────────────────────────────── */
function CharReveal({ text, startDelay = 0, charDelay = 80 }) {
  const [count, setCount] = useState(0)
  const [flash, setFlash] = useState(-1)
  useEffect(() => {
    const t = setTimeout(() => {
      for (let i = 0; i < text.length; i++) {
        setTimeout(() => {
          setCount(c => c + 1)
          setFlash(i)
          setTimeout(() => setFlash(f => f === i ? -1 : f), 200)
        }, i * charDelay)
      }
    }, startDelay)
    return () => clearTimeout(t)
  }, [])
  return (
    <span>
      {text.split('').map((ch, i) => (
        <span key={i} style={{
          display:'inline-block',
          opacity: i < count ? 1 : 0,
          transform: flash===i ? 'scale(1.25)' : i<count ? 'scale(1)' : 'scale(0.5)',
          color: flash===i ? '#fff' : '#EEEDFE',
          textShadow: flash===i
            ? '0 0 20px #fff,0 0 50px rgba(127,119,221,1)'
            : '0 0 8px rgba(127,119,221,0.3)',
          transition:'opacity .1s,transform .15s,color .15s,text-shadow .2s',
        }}>
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  )
}

function Highlighted({ text, highlights }) {
  if (!highlights?.length) return <>{text}</>
  let parts = [text]
  highlights.forEach(kw => {
    parts = parts.flatMap(p =>
      typeof p !== 'string' ? [p]
      : p.split(kw).flatMap((seg,i,arr) =>
          i < arr.length-1
            ? [seg, <span key={`${kw}${i}`} style={{color:'#AFA9EC',fontWeight:700}}>{kw}</span>]
            : [seg]
        )
    )
  })
  return <>{parts}</>
}

/* ═══════════════════════════════════════════════════════
   SpaceCanvas — 沉浸式宇宙交互画布
   · 星空 (3层深度)
   · 星云光晕
   · 土星 + 轨道环 + 卫星
   · 小行星
   · 宇宙飞船（推进火焰动画）
   · 太阳能卫星
   · 鼠标悬停：物体轻微漂移 / 星星增亮
   · 点击：随机惊喜特效（彗星/粒子爆炸/飞船跃迁/光波）
═══════════════════════════════════════════════════════ */
function SpaceCanvas({ warpMode = false, onWarpDone }) {
  const canvasRef = useRef()
  const mouseRef  = useRef({ x: -9999, y: -9999 })
  const stateRef  = useRef({})

  useEffect(() => {
    const canvas = canvasRef.current
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')

    /* ─── Stars ─── */
    const mkStars = (n, szMin, szMax, opMin, opMax) =>
      Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        sz: szMin + Math.random() * (szMax - szMin),
        baseOp: opMin + Math.random() * (opMax - opMin),
        tw: Math.random() * Math.PI * 2,
        twSpd: 0.008 + Math.random() * 0.018,
        ox: 0, oy: 0,   // offset from mouse push
      }))
    const farStars  = mkStars(220, 0.3, 0.7,  0.1,  0.4)
    const midStars  = mkStars(110, 0.7, 1.3,  0.28, 0.6)
    const nearStars = mkStars(45,  1.3, 2.2,  0.5,  0.9)

    /* ─── Saturn — 右上角压边，只露左下部分，产生"巨行星越过画框"的压迫感 ─── */
    const saturn = {
      bx: W * 0.93, by: H * 0.08,
      x: W * 0.93, y: H * 0.08,
      r: Math.min(100, W * 0.1),
      driftT: 0,
      moons: [
        { a: 0,    spd: 0.007, orb: 1.95, r: 7, col: '#AFA9EC', trail: [] },
        { a: 2.09, spd: 0.004, orb: 2.45, r: 5, col: '#85B7EB', trail: [] },
      ],
    }

    /* ─── Small teal planet ─── */
    const teal = {
      bx: W * 0.17, by: H * 0.68,
      x:  W * 0.17, y:  H * 0.68,
      r:  Math.min(34, W * 0.038),
      driftA: 0,
    }

    /* ─── Spaceship ─── */
    const ship = {
      x: W * 0.32, y: H * 0.22,
      vx: 0.22, vy: 0.09,
      angle: Math.atan2(0.09, 0.22),
      sz: Math.min(26, W * 0.028),
      thrustT: 0,
      warping: false, warpAlpha: 0,
      warpDstX: 0, warpDstY: 0,
    }

    /* ─── Satellite ─── */
    const sat = {
      x: W * 0.52, y: H * 0.76,
      vx: -0.14, vy: -0.07,
      angle: 0, angSpd: 0.009,
      sz: Math.min(18, W * 0.022),
    }

    /* ─── Asteroids ─── */
    const asteroids = Array.from({ length: 6 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.12,
      r: 3 + Math.random() * 5,
      angle: Math.random() * Math.PI * 2,
      angSpd: (Math.random() - 0.5) * 0.02,
      sides: 5 + Math.floor(Math.random() * 4),
    }))

    /* ─── Comets, Particles, Ripples ─── */
    const comets    = []
    const particles = []
    const ripples   = []

    /* ─── Warp state ─── */
    let warpStars = null
    let warpDone  = false
    if (warpMode) {
      const WCOUNT = 300
      warpStars = Array.from({ length: WCOUNT }, () => ({
        angle: Math.random() * Math.PI * 2,
        r: Math.random() * 30 + 5,
        spd: 3 + Math.random() * 6,
        sz: 0.4 + Math.random() * 1.2,
        hue: 220 + Math.random() * 70,
        sat: 60 + Math.random() * 40,
        lum: 70 + Math.random() * 30,
      }))
    }

    const maxR = Math.hypot(W, H) / 2 + 100
    const warpStart = performance.now()
    const WARP_DUR  = 1900

    /* ─── Helpers ─── */
    function drawStarDot(x, y, sz, op) {
      ctx.beginPath()
      ctx.arc(x + (Math.random() - 0.5) * 0.3, y, sz, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${op})`
      ctx.fill()
    }

    function mouseRepel(obj, radius = 130, force = 2.5) {
      const dx = obj.x - mouseRef.current.x
      const dy = obj.y - mouseRef.current.y
      const d  = Math.hypot(dx, dy)
      if (d < radius && d > 0) {
        const f = (1 - d / radius) * force
        obj.x += (dx / d) * f
        obj.y += (dy / d) * f
      }
    }

    function drawNebula(x, y, r, r_i, g_i, b_i, maxA) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0,   `rgba(${r_i},${g_i},${b_i},${maxA})`)
      grad.addColorStop(0.5, `rgba(${r_i},${g_i},${b_i},${maxA * 0.4})`)
      grad.addColorStop(1,   `rgba(${r_i},${g_i},${b_i},0)`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    }

    function drawSaturn(t) {
      const { x, y, r } = saturn
      const rRX = r * 2.25, rRY = r * 2.25 * 0.27

      // Ring gradient
      const rGrad = ctx.createLinearGradient(x - rRX, y, x + rRX, y)
      rGrad.addColorStop(0,    'rgba(127,119,221,0)')
      rGrad.addColorStop(0.18, 'rgba(127,119,221,0.18)')
      rGrad.addColorStop(0.5,  'rgba(175,169,236,0.38)')
      rGrad.addColorStop(0.82, 'rgba(127,119,221,0.18)')
      rGrad.addColorStop(1,    'rgba(127,119,221,0)')

      // Back ring
      ctx.save()
      ctx.beginPath(); ctx.rect(x - rRX - 4, y - rRY - 4, (rRX + 4) * 2, rRY + 4)
      ctx.clip()
      ctx.beginPath(); ctx.ellipse(x, y, rRX, rRY, 0, 0, Math.PI * 2)
      ctx.strokeStyle = rGrad; ctx.lineWidth = r * 0.21; ctx.stroke()
      ctx.restore()

      // Planet glow
      const gGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8)
      gGrad.addColorStop(0, 'rgba(83,74,183,0.15)')
      gGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gGrad; ctx.fillRect(0, 0, W, H)

      // Planet body
      const bGrad = ctx.createRadialGradient(x - r * 0.32, y - r * 0.32, 0, x, y, r)
      bGrad.addColorStop(0,    '#6B5FD0')
      bGrad.addColorStop(0.48, '#26215C')
      bGrad.addColorStop(1,    '#070512')
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = bGrad; ctx.fill()

      // Specular highlight
      const hlGrad = ctx.createRadialGradient(x - r*0.36, y - r*0.36, 0, x - r*0.1, y - r*0.1, r*0.72)
      hlGrad.addColorStop(0, 'rgba(160,148,255,0.28)')
      hlGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = hlGrad; ctx.fill()

      // Front ring
      ctx.save()
      ctx.beginPath(); ctx.rect(x - rRX - 4, y, (rRX + 4) * 2, rRY + 6)
      ctx.clip()
      ctx.beginPath(); ctx.ellipse(x, y, rRX, rRY, 0, 0, Math.PI * 2)
      ctx.strokeStyle = rGrad; ctx.lineWidth = r * 0.21; ctx.stroke()
      ctx.restore()

      // Moons
      saturn.moons.forEach(m => {
        m.a += m.spd
        const mx = x + Math.cos(m.a) * r * m.orb
        const my = y + Math.sin(m.a) * r * m.orb * 0.38

        // Trail
        m.trail.push({ x: mx, y: my })
        if (m.trail.length > 16) m.trail.shift()
        m.trail.forEach((pt, i) => {
          const prog = i / m.trail.length
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, m.r * prog * 0.5, 0, Math.PI * 2)
          const [rr, gg, bb] = m.col === '#AFA9EC'
            ? [175, 169, 236] : [133, 183, 235]
          ctx.fillStyle = `rgba(${rr},${gg},${bb},${prog * 0.4})`
          ctx.fill()
        })

        ctx.shadowBlur = 10; ctx.shadowColor = m.col
        ctx.beginPath(); ctx.arc(mx, my, m.r, 0, Math.PI * 2)
        ctx.fillStyle = m.col; ctx.fill()
        ctx.shadowBlur = 0
      })
    }

    function drawTealPlanet() {
      const { x, y, r } = teal
      const gGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2)
      gGrad.addColorStop(0, 'rgba(29,158,117,0.12)')
      gGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gGrad; ctx.fillRect(0, 0, W, H)

      const bGrad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, r)
      bGrad.addColorStop(0,    '#2dd4a0')
      bGrad.addColorStop(0.5,  '#1D9E75')
      bGrad.addColorStop(1,    '#0a3d2b')
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = bGrad; ctx.fill()
    }

    function drawShip() {
      const { x, y, angle, sz, thrustT } = ship
      if (ship.warping) return
      ctx.save()
      ctx.translate(x, y); ctx.rotate(angle)
      const thrust = Math.sin(thrustT) * 0.3 + 0.7

      // Engine glow
      const engGrad = ctx.createRadialGradient(-sz*0.55, 0, 0, -sz*0.55, 0, sz*0.9)
      engGrad.addColorStop(0, `rgba(100,180,255,${thrust*0.6})`)
      engGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = engGrad; ctx.beginPath(); ctx.arc(-sz*0.55, 0, sz*0.9, 0, Math.PI*2); ctx.fill()

      // Body
      ctx.beginPath()
      ctx.moveTo(sz, 0)
      ctx.lineTo(-sz*0.65, -sz*0.32)
      ctx.lineTo(-sz*0.48,  0)
      ctx.lineTo(-sz*0.65,  sz*0.32)
      ctx.closePath()
      const bGrad = ctx.createLinearGradient(-sz, 0, sz, 0)
      bGrad.addColorStop(0, '#1a1060'); bGrad.addColorStop(0.4, '#534AB7'); bGrad.addColorStop(1, '#AFA9EC')
      ctx.fillStyle = bGrad; ctx.fill()
      ctx.strokeStyle = 'rgba(175,169,236,0.45)'; ctx.lineWidth = 0.5; ctx.stroke()

      // Cockpit
      ctx.beginPath()
      ctx.ellipse(sz*0.22, 0, sz*0.19, sz*0.11, 0, 0, Math.PI*2)
      ctx.fillStyle = `rgba(135,200,255,0.65)`; ctx.fill()

      // Thruster flame (outer)
      ctx.beginPath()
      ctx.moveTo(-sz*0.48, -sz*0.1)
      ctx.lineTo(-sz*(0.78 + thrust*0.4), 0)
      ctx.lineTo(-sz*0.48,  sz*0.1)
      ctx.fillStyle = `rgba(60,140,255,${thrust*0.7})`; ctx.fill()
      // inner bright core
      ctx.beginPath()
      ctx.moveTo(-sz*0.48, -sz*0.05)
      ctx.lineTo(-sz*(0.65 + thrust*0.28), 0)
      ctx.lineTo(-sz*0.48, sz*0.05)
      ctx.fillStyle = `rgba(180,230,255,${thrust})`; ctx.fill()

      ctx.restore()
    }

    function drawSatellite() {
      const { x, y, angle, sz } = sat
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle)

      // Body
      ctx.fillStyle = '#26215C'; ctx.strokeStyle = '#534AB7'; ctx.lineWidth = 1
      const bsz = sz * 0.32
      ctx.fillRect(-bsz, -bsz, bsz*2, bsz*2)
      ctx.strokeRect(-bsz, -bsz, bsz*2, bsz*2)

      // Solar panels
      ;[-1, 1].forEach(side => {
        const px = side * bsz, pw = side * sz * 0.72, ph = sz * 0.52
        ctx.fillStyle = 'rgba(55,138,221,0.65)'; ctx.strokeStyle = '#85B7EB'; ctx.lineWidth = 0.5
        ctx.fillRect(px, -ph/2, pw, ph); ctx.strokeRect(px, -ph/2, pw, ph)
        // Grid
        ctx.strokeStyle = 'rgba(133,183,235,0.35)'; ctx.lineWidth = 0.4
        ctx.beginPath()
        ctx.moveTo(px + pw/2, -ph/2); ctx.lineTo(px + pw/2, ph/2)
        ctx.moveTo(px, 0); ctx.lineTo(px + pw, 0)
        ctx.stroke()
      })

      // Antenna
      ctx.strokeStyle = '#AFA9EC'; ctx.lineWidth = 0.9
      ctx.beginPath(); ctx.moveTo(0, -bsz); ctx.lineTo(0, -sz*0.72); ctx.stroke()
      ctx.shadowBlur = 6; ctx.shadowColor = '#EF9F27'
      ctx.beginPath(); ctx.arc(0, -sz*0.72, 2.5, 0, Math.PI*2)
      ctx.fillStyle = '#EF9F27'; ctx.fill(); ctx.shadowBlur = 0

      ctx.restore()
    }

    function drawAsteroid(a) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle)
      ctx.beginPath()
      for (let i = 0; i < a.sides; i++) {
        const ang = (i / a.sides) * Math.PI * 2
        const rnd = a.r * (0.75 + Math.sin(i * 1.7 + a.angle) * 0.25)
        const method = i === 0 ? 'moveTo' : 'lineTo'
        ctx[method](Math.cos(ang) * rnd, Math.sin(ang) * rnd)
      }
      ctx.closePath()
      ctx.fillStyle = 'rgba(80,70,110,0.5)'; ctx.strokeStyle = 'rgba(127,119,221,0.3)'; ctx.lineWidth = 0.8
      ctx.fill(); ctx.stroke()
      ctx.restore()
    }

    function drawComet(c) {
      const tl = c.tailLen ?? 160
      const a  = c.alpha
      const grad = ctx.createLinearGradient(
        c.x - Math.cos(c.angle)*tl, c.y - Math.sin(c.angle)*tl, c.x, c.y)
      grad.addColorStop(0, 'rgba(255,255,255,0)')
      grad.addColorStop(0.6, `rgba(200,210,255,${a * 0.5})`)
      grad.addColorStop(1, `rgba(255,255,255,${a})`)
      ctx.strokeStyle = grad; ctx.lineWidth = c.isBg ? 1.2 : 1.8
      ctx.beginPath()
      ctx.moveTo(c.x - Math.cos(c.angle)*tl, c.y - Math.sin(c.angle)*tl)
      ctx.lineTo(c.x, c.y); ctx.stroke()
      ctx.shadowBlur = 10; ctx.shadowColor = `rgba(200,220,255,${a})`
      ctx.beginPath(); ctx.arc(c.x, c.y, c.isBg ? 2 : 2.5, 0, Math.PI*2)
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill(); ctx.shadowBlur = 0
    }

    /* ─── 背景彗星自动生成 ─── */
    let lastCometTime = performance.now() + 3000   // 首颗延迟 3s
    let nextCometDelay = 4000 + Math.random() * 6000

    function spawnBgComet() {
      // 从四条边随机选一条边的随机位置出发
      const side = Math.floor(Math.random() * 4)
      let sx, sy, ex, ey
      const pad = 60
      if (side === 0) { sx = Math.random()*W;  sy = -pad;     ex = Math.random()*W;   ey = H+pad }
      else if (side === 1) { sx = W+pad;  sy = Math.random()*H; ex = -pad;              ey = Math.random()*H }
      else if (side === 2) { sx = Math.random()*W;  sy = H+pad;     ex = Math.random()*W;   ey = -pad }
      else { sx = -pad; sy = Math.random()*H; ex = W+pad; ey = Math.random()*H }
      const angle = Math.atan2(ey - sy, ex - sx)
      const spd = 2.5 + Math.random() * 2.5
      // 长拖尾，慢速，入场渐亮 + 出场渐暗
      comets.push({
        x: sx, y: sy, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd,
        angle, alpha: 0, life: 1,
        tailLen: 200 + Math.random() * 120,
        isBg: true,          // 背景彗星：渐入渐出
        fadeIn: true,
      })
    }

    /* ─── Surprises ─── */
    function spawnSurprise(mx, my) {
      const kinds = ['comet', 'nova', 'ripple', 'shipwarp', 'comet']
      const kind = kinds[Math.floor(Math.random() * kinds.length)]

      if (kind === 'comet') {
        const edgeAngle = Math.random() * Math.PI * 2
        const ex = W/2 + Math.cos(edgeAngle) * (W * 0.8)
        const ey = H/2 + Math.sin(edgeAngle) * (H * 0.8)
        const toAngle = Math.atan2(H/2 - ey + (Math.random()-0.5)*H*0.5,
                                   W/2 - ex + (Math.random()-0.5)*W*0.5)
        const spd = 9 + Math.random() * 5
        comets.push({ x: ex, y: ey,
          vx: Math.cos(toAngle)*spd, vy: Math.sin(toAngle)*spd,
          angle: toAngle, alpha: 1, life: 1 })
      }
      if (kind === 'nova') {
        for (let i = 0; i < 64; i++) {
          const a = Math.random() * Math.PI * 2
          const spd = 1.5 + Math.random() * 6
          particles.push({
            x: mx, y: my,
            vx: Math.cos(a)*spd, vy: Math.sin(a)*spd,
            life: 1, decay: 0.012 + Math.random()*0.012,
            color: ['#7F77DD','#AFA9EC','#EF9F27','#1D9E75','#378ADD','#85B7EB','#fff'][i%7],
            size: 2 + Math.random() * 5,
          })
        }
      }
      if (kind === 'ripple') {
        ripples.push({ x: mx, y: my, r: 0, maxR: Math.max(W,H)*0.6, life: 1 })
      }
      if (kind === 'shipwarp') {
        // Ship warps to click position with flash
        ship.x = mx; ship.y = my
        ship.warping = true; ship.warpAlpha = 1
        ship.angle = Math.atan2(ship.vy, ship.vx)
        for (let i = 0; i < 30; i++) {
          const a = Math.random()*Math.PI*2, spd = 3+Math.random()*5
          particles.push({
            x: mx, y: my, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd,
            life:1, decay:0.025, color:'#AFA9EC', size:3+Math.random()*4,
          })
        }
      }
    }

    /* ─── Warp mode draw ─── */
    function drawWarp(now) {
      const t = Math.min((now - warpStart) / WARP_DUR, 1)
      const spd = t < 0.38
        ? 1 + (0.38 - t) * 38
        : Math.max(0.8, (1 - t) * 9)

      ctx.fillStyle = `rgba(4,2,15,${t < 0.25 ? 0.12 : 0.3})`
      ctx.fillRect(0, 0, W, H)

      const cx = W/2, cy = H/2
      warpStars.forEach(s => {
        s.r += s.spd * spd * 0.55
        if (s.r > maxR) s.r = 4 + Math.random()*15
        const x = cx + Math.cos(s.angle)*s.r
        const y = cy + Math.sin(s.angle)*s.r
        const tl = s.spd * spd * 1.5
        const tx = x - Math.cos(s.angle)*tl
        const ty = y - Math.sin(s.angle)*tl
        const alpha = Math.min(1, s.r/70)
        const grad = ctx.createLinearGradient(tx, ty, x, y)
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(1, `hsla(${s.hue},${s.sat}%,${s.lum}%,${alpha})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = s.sz * Math.min(2.2, spd*0.11+0.4)
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(x,y); ctx.stroke()
      })
      return t >= 1
    }

    /* ─── Main loop ─── */
    let raf
    function frame(now) {
      ctx.clearRect(0, 0, W, H)

      if (warpMode && !warpDone) {
        const done = drawWarp(now)
        if (done) { warpDone = true; onWarpDone?.() }
        raf = requestAnimationFrame(frame)
        return
      }

      /* Nebulae */
      drawNebula(W*0.15, H*0.3,  W*0.38, 83, 74, 183,  0.07)
      drawNebula(W*0.8,  H*0.58, W*0.32, 24, 95, 165,  0.055)
      drawNebula(W*0.45, H*0.82, W*0.28, 29,158,117,   0.045)

      /* Far + mid stars */
      ;[farStars, midStars].forEach(layer => {
        layer.forEach(s => {
          s.tw += s.twSpd
          drawStarDot(s.x, s.y, s.sz, s.baseOp*(0.65+0.35*Math.sin(s.tw)))
        })
      })
      /* Near stars — react to mouse */
      nearStars.forEach(s => {
        s.tw += s.twSpd
        const d = Math.hypot(s.x - mouseRef.current.x, s.y - mouseRef.current.y)
        const boost = d < 90 ? 1 + (1 - d/90)*1.5 : 1
        drawStarDot(s.x, s.y, s.sz*Math.min(boost,2.2),
                    Math.min(1, s.baseOp*(0.65+0.35*Math.sin(s.tw))*boost))
      })

      /* Saturn */
      saturn.driftT += 0.00045
      saturn.x = saturn.bx + Math.sin(saturn.driftT * 2.1) * 14
      saturn.y = saturn.by + Math.cos(saturn.driftT * 1.6) * 9
      mouseRepel(saturn, 150, 3)
      drawSaturn(now)

      /* Teal planet */
      teal.driftA += 0.0012
      teal.x = teal.bx + Math.sin(teal.driftA * 1.4) * 10
      teal.y = teal.by + Math.cos(teal.driftA) * 7
      mouseRepel(teal, 120, 2.5)
      drawTealPlanet()

      /* Ship */
      ship.thrustT += 0.14
      if (!ship.warping) {
        ship.x += ship.vx; ship.y += ship.vy
        if (ship.x < -60) { ship.x = W+60; ship.y = Math.random()*H }
        if (ship.x > W+60) { ship.x = -60; ship.y = Math.random()*H }
        if (ship.y < -60)  { ship.y = H+60 }
        if (ship.y > H+60) { ship.y = -60 }
      } else {
        ship.warpAlpha -= 0.04
        if (ship.warpAlpha <= 0) { ship.warping = false }
        // Draw warp flash
        ctx.fillStyle = `rgba(127,119,221,${ship.warpAlpha*0.35})`
        ctx.fillRect(0,0,W,H)
      }
      drawShip()

      /* Satellite */
      sat.angle += sat.angSpd
      sat.x += sat.vx; sat.y += sat.vy
      if (sat.x < -45) sat.x = W+45
      if (sat.x > W+45) sat.x = -45
      if (sat.y < -45) sat.y = H+45
      if (sat.y > H+45) sat.y = -45
      drawSatellite()

      /* Asteroids */
      asteroids.forEach(a => {
        a.x += a.vx; a.y += a.vy; a.angle += a.angSpd
        if (a.x < -20) a.x = W+20
        if (a.x > W+20) a.x = -20
        if (a.y < -20) a.y = H+20
        if (a.y > H+20) a.y = -20
        mouseRepel(a, 80, 1.5)
        drawAsteroid(a)
      })

      /* Comets */
      for (let i = comets.length-1; i >= 0; i--) {
        const c = comets[i]
        c.x += c.vx; c.y += c.vy
        if (c.isBg) {
          // 背景彗星：前段渐入，中段满透明，后段渐出
          if (c.fadeIn) {
            c.alpha = Math.min(c.alpha + 0.025, 0.72)
            if (c.alpha >= 0.72) c.fadeIn = false
          } else {
            c.life -= 0.003
            c.alpha = Math.min(0.72, c.life * 1.8)
          }
          if (c.life <= 0 || (c.x < -350 || c.x > W+350 || c.y < -350 || c.y > H+350))
            comets.splice(i, 1)
          else drawComet(c)
        } else {
          c.life -= 0.007; c.alpha = c.life
          if (c.life <= 0 || Math.abs(c.x) > W+250 || Math.abs(c.y) > H+250) comets.splice(i,1)
          else drawComet(c)
        }
      }

      /* 自动生成背景彗星 */
      if (!warpMode && now - lastCometTime > nextCometDelay) {
        spawnBgComet()
        lastCometTime = now
        nextCometDelay = 5000 + Math.random() * 8000
      }

      /* Particles */
      for (let i = particles.length-1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97; p.life -= p.decay
        if (p.life <= 0) { particles.splice(i,1); continue }
        ctx.globalAlpha = p.life
        ctx.shadowBlur = 8; ctx.shadowColor = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2)
        ctx.fillStyle = p.color; ctx.fill()
        ctx.shadowBlur = 0; ctx.globalAlpha = 1
      }

      /* Ripples */
      for (let i = ripples.length-1; i >= 0; i--) {
        const rp = ripples[i]
        rp.r += 6; rp.life -= 0.018
        if (rp.life <= 0) { ripples.splice(i,1); continue }
        ctx.strokeStyle = `rgba(127,119,221,${rp.life * 0.6})`
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI*2); ctx.stroke()
        // Second ring (slightly delayed)
        if (rp.r > 40) {
          ctx.strokeStyle = `rgba(175,169,236,${rp.life * 0.35})`
          ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r - 30, 0, Math.PI*2); ctx.stroke()
        }
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    /* Events — on window so overlays don't block */
    function onMove(e) { mouseRef.current = { x: e.clientX, y: e.clientY } }
    function onClick(e) { spawnSurprise(e.clientX, e.clientY) }
    window.addEventListener('mousemove', onMove)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('click', onClick)
    }
  }, [warpMode])

  return (
    <canvas ref={canvasRef} style={{
      position:'fixed', inset:0, zIndex:0,
      width:'100%', height:'100%',
      cursor:'crosshair',
    }} />
  )
}

/* ═══════════════════════════════════════════════════════
   LoginPage
═══════════════════════════════════════════════════════ */
const BASE = {
  position:'fixed', inset:0,
  display:'flex', flexDirection:'column',
  alignItems:'center', justifyContent:'center',
  overflow:'hidden',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setUser  = useUserStore(s => s.setUser)

  const [act, setAct]         = useState(1)
  const [poemLine, setPLine]  = useState(-1)
  const [credVis, setCredVis] = useState([false,false,false,false])
  const [formIn, setFormIn]   = useState(false)
  const [form, setForm]       = useState({ name:'', grade:'', school:'', avatar:'boy1' })
  const [err, setErr]         = useState('')
  const timers = useRef([])
  const tick = (fn, ms) => { const t=setTimeout(fn,ms); timers.current.push(t) }

  function runTimeline() {
    // act 1 → 2 triggered by WarpCanvas.onWarpDone
    tick(()=>setAct(3), 5400)
    tick(()=>setPLine(0), 5400)
    tick(()=>setPLine(1), 6900)
    tick(()=>setPLine(2), 8400)
    tick(()=>setPLine(3), 9900)
    tick(()=>setAct(4), 11400)
    CREDITS.forEach((_,i)=>tick(()=>setCredVis(p=>{const n=[...p];n[i]=true;return n}),11600+i*750))
    tick(()=>setAct(5), 16200)
  }

  useEffect(()=>{ runTimeline(); return()=>timers.current.forEach(clearTimeout) },[])

  function skip() {
    timers.current.forEach(clearTimeout); timers.current=[]
    setAct(6); setTimeout(()=>setFormIn(true),60)
  }
  function goToForm() {
    timers.current.forEach(clearTimeout); timers.current=[]
    setAct(6); setTimeout(()=>setFormIn(true),60)
  }
  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setErr('请输入你的名字'); return }
    setUser(form); navigate('/map')
  }

  const SkipBtn = act < 6 && (
    <div style={{ position:'fixed',top:'1.25rem',right:'1.25rem',zIndex:500, pointerEvents:'auto' }}>
      <button onClick={skip} style={{
        padding:'0.35rem 1rem', borderRadius:'20px',
        background:'rgba(127,119,221,0.1)', border:'1px solid rgba(127,119,221,0.2)',
        color:'#6b66b0', fontSize:'0.8rem', cursor:'pointer',
      }}>跳过 →</button>
    </div>
  )

  /* ── Act 2: Logo 光雾涌现（无旋转无缩放，从深空光晕中浮现） ── */
  const LogoReveal = act === 2 && (
    <>
      <style>{`
        @keyframes logoFog {
          0%   { opacity:0; filter:blur(32px) brightness(3); }
          35%  { filter:blur(12px) brightness(2); }
          65%  { filter:blur(3px) brightness(1.4); opacity:1; }
          100% { opacity:1; filter:blur(0) brightness(1); }
        }
        @keyframes haloExpand {
          0%   { opacity:0.8; transform:scale(0.4); }
          100% { opacity:0;   transform:scale(3.5); }
        }
        @keyframes rayFlash {
          0%   { opacity:0; }
          20%  { opacity:1; }
          100% { opacity:0; }
        }
        @keyframes logoGlow {
          0%,100% { filter:drop-shadow(0 0 20px rgba(127,119,221,0.6)) drop-shadow(0 0 50px rgba(127,119,221,0.2)); }
          50%     { filter:drop-shadow(0 0 40px rgba(127,119,221,1)) drop-shadow(0 0 100px rgba(127,119,221,0.5)); }
        }
      `}</style>

      {/* 放射光芒 */}
      {[0,45,90,135].map(rot=>(
        <div key={rot} style={{
          position:'fixed', top:'50%', left:'50%',
          width:'3px', height:'40vmax',
          transformOrigin:'top center',
          transform:`translateX(-50%) rotate(${rot}deg)`,
          background:'linear-gradient(180deg,rgba(127,119,221,0.6) 0%,rgba(127,119,221,0) 100%)',
          animation:'rayFlash 2.2s ease-out both',
          animationDelay:`${0.05+rot*0.003}s`,
          pointerEvents:'none', zIndex:20,
        }}/>
      ))}

      {/* 光晕扩散圆 */}
      {[0,1,2].map(i=>(
        <div key={i} style={{
          position:'fixed', top:'50%', left:'50%',
          width:'200px', height:'200px',
          marginLeft:'-100px', marginTop:'-100px',
          borderRadius:'50%',
          border:`1px solid rgba(127,119,221,${0.6-i*0.15})`,
          animation:`haloExpand ${1.6+i*0.5}s ${i*0.3}s ease-out both`,
          pointerEvents:'none', zIndex:20,
        }}/>
      ))}

      {/* Logo 主体——直接 opacity + blur 涌现，不缩放不旋转 */}
      <div style={{
        position:'relative', zIndex:25,
        animation:'logoFog 2.4s cubic-bezier(0.22,1,0.36,1) 0.15s both',
      }}>
        <div style={{ animation:'logoGlow 3s 2.6s ease-in-out infinite' }}>
          <LogoBanner iconSize={88} titleSize={66} gap={28}/>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* 始终渲染的交互宇宙画布 */}
      <SpaceCanvas
        warpMode={act === 1}
        onWarpDone={() => setAct(2)}
      />

      {/* 各幕叠层 */}
      <div style={{ ...BASE, zIndex:10, pointerEvents:'none' }}>
        {SkipBtn}

        {/* ─ Act 2: Logo 光雾涌现 ─ */}
        {act === 2 && (
          <div style={{ pointerEvents:'none' }}>{LogoReveal}</div>
        )}

        {/* ─ Act 3: 诗词逐字 ─ */}
        {act === 3 && (
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'center',
            gap:'clamp(1rem,3.5vh,2rem)', padding:'0 2rem',
            position:'relative', zIndex:30,
          }}>
            {/* 顶部小 Logo */}
            <div style={{ position:'fixed', top:'1.8rem', left:'50%', transform:'translateX(-50%)', opacity:0.4 }}>
              <LogoBanner iconSize={26} titleSize={18} gap={10}/>
            </div>

            <style>{`
              @keyframes scanBar {
                from { transform:scaleX(0) translateX(-50%); opacity:0.9; }
                to   { transform:scaleX(1) translateX(0);    opacity:0; }
              }
            `}</style>
            {POEM_LINES.map((line,i)=>(
              <div key={i} style={{
                opacity: poemLine>=i ? 1 : 0,
                transition:'opacity 0.25s',
                fontFamily:"'PingFang SC','Microsoft YaHei',system-ui",
                fontSize: i===2 ? 'clamp(1rem,3.5vw,1.75rem)' : 'clamp(1.1rem,4vw,2rem)',
                fontWeight:700, letterSpacing:'0.15em', textAlign:'center',
              }}>
                {poemLine>=i && <CharReveal text={line} startDelay={0} charDelay={78}/>}
              </div>
            ))}
            {/* 扫光条 */}
            {poemLine>=0 && (
              <div key={poemLine} style={{
                position:'absolute',
                width:'55%', height:'1.5px',
                background:'linear-gradient(90deg,transparent,rgba(127,119,221,0.9),transparent)',
                animation:'scanBar 0.55s ease-out both',
                pointerEvents:'none',
              }}/>
            )}
          </div>
        )}

        {/* ─ Act 4: 制作文案 ─ */}
        {act === 4 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
            gap:'1rem', padding:'0 2rem', position:'relative', zIndex:30 }}>
            <div style={{ position:'fixed', top:'1.8rem', left:'50%', transform:'translateX(-50%)', opacity:0.5 }}>
              <LogoBanner iconSize={30} titleSize={22} gap={12}/>
            </div>
            {/* 上下暗角 */}
            <div style={{ position:'fixed', inset:0,
              background:'radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(4,2,15,0.65) 100%)',
              pointerEvents:'none', zIndex:28 }}/>
            {CREDITS.map((line,i)=>(
              <div key={i} style={{
                position:'relative', zIndex:30,
                opacity: credVis[i] ? 1 : 0,
                transform: credVis[i] ? 'none' : 'translateY(16px)',
                transition:'all 0.65s cubic-bezier(0.25,0.46,0.45,0.94)',
                fontSize:'clamp(0.95rem,2.5vw,1.25rem)',
                color:'#a8a3e8', letterSpacing:'0.07em', textAlign:'center',
              }}>
                <Highlighted text={line.text} highlights={line.highlights}/>
              </div>
            ))}
          </div>
        )}

        {/* ─ Act 5: 点击提示 ─ */}
        {act === 5 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
            gap:'3rem', position:'relative', zIndex:30, pointerEvents:'auto' }}>
            <style>{`
              @keyframes tapBlink{0%,100%{opacity:0.7;}50%{opacity:0.25;}}
              @keyframes circleBreath{
                0%,100%{transform:scale(1);    box-shadow:0 0 30px rgba(127,119,221,0.4);}
                50%    {transform:scale(1.06); box-shadow:0 0 60px rgba(127,119,221,0.7),0 0 120px rgba(127,119,221,0.2);}
              }
            `}</style>

            {/* 可点击圆形区域 */}
            <div onClick={goToForm} style={{
              width:'clamp(160px,22vw,220px)', height:'clamp(160px,22vw,220px)',
              borderRadius:'50%',
              border:'1.5px solid rgba(127,119,221,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer',
              animation:'circleBreath 3s ease-in-out infinite',
            }}>
              <PlanetLogo size={Math.min(160, window.innerWidth * 0.18)} uid="act5"/>
            </div>

            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'PingFang SC','Microsoft YaHei',system-ui",
                fontSize:'clamp(1.3rem,3.5vw,1.8rem)', fontWeight:700,
                letterSpacing:'0.2em', color:'#EEEDFE', marginBottom:'0.3rem' }}>
                星&nbsp;渊
              </div>
              <div style={{ fontFamily:'var(--font-english)',
                fontSize:'clamp(0.6rem,1.4vw,0.75rem)',
                letterSpacing:'0.35em', color:'#AFA9EC' }}>
                XING&nbsp;&nbsp;YUAN
              </div>
              <div style={{ fontSize:'clamp(0.78rem,1.8vw,0.9rem)', color:'#534AB7',
                letterSpacing:'0.1em', marginTop:'1.4rem',
                animation:'tapBlink 2.4s ease-in-out infinite' }}>
                点击星球，开始探索
              </div>
            </div>
          </div>
        )}

        {/* ─ Act 6: 登录表单 ─ */}
        {act === 6 && (
          <>
            <style>{`
              @keyframes riseUp {
                0%  { opacity:0; transform:translateY(80px); filter:blur(10px); }
                60% { filter:blur(0); }
                80% { transform:translateY(-5px); }
                100%{ opacity:1; transform:translateY(0); }
              }
            `}</style>
            <div style={{
              width:'100%', maxWidth:'420px', padding:'0 1rem',
              opacity: formIn?1:0, pointerEvents:'auto',
              animation: formIn ? 'riseUp 0.85s cubic-bezier(0.175,0.885,0.32,1.275) forwards' : 'none',
            }}>
              <div style={{
                background:'rgba(38,33,92,0.88)', backdropFilter:'blur(16px)',
                border:'0.5px solid #534AB7', borderRadius:'20px',
                padding:'clamp(1.5rem,5vw,2rem)',
              }}>
                {/* 表单标题 */}
                <div style={{
                  fontFamily:'var(--font-english)', fontSize:'1.62rem',
                  color:'#EEEDFE', letterSpacing:'0.15em', textAlign:'center',
                  marginBottom:'1.5rem',
                }}>创建你的星际档案</div>

                <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  <div>
                    <label style={LS}>探索者名字 <span style={{color:'#7F77DD'}}>*</span></label>
                    <input type="text" placeholder="输入你的名字"
                      value={form.name} maxLength={20} autoFocus
                      onChange={e=>{setForm(p=>({...p,name:e.target.value}));setErr('')}}
                      style={IS(!!err)}/>
                    {err&&<p style={{color:'var(--danger)',fontSize:'0.78rem',marginTop:'0.3rem'}}>{err}</p>}
                  </div>
                  <div>
                    <label style={LS}>年级</label>
                    <select value={form.grade} onChange={e=>setForm(p=>({...p,grade:e.target.value}))}
                      style={{...IS(false), appearance:'none'}}>
                      <option value="">选择年级</option>
                      {['一年级','二年级','三年级','四年级','五年级','六年级'].map(g=>(
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={LS}>学校</label>
                    <input type="text" placeholder="输入你的学校名称" value={form.school} maxLength={30}
                      onChange={e=>setForm(p=>({...p,school:e.target.value}))} style={IS(false)}/>
                  </div>
                  <div>
                    <label style={LS}>选择你的头像</label>
                    <div style={{
                      display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                      gap:'0.6rem', marginTop:'0.4rem',
                    }}>
                      {AVATAR_LIST.map(av=>(
                        <button key={av.id} type="button"
                          onClick={()=>setForm(p=>({...p,avatar:av.id}))}
                          style={{
                            aspectRatio:'1', padding:'4px',
                            borderRadius:'14px', cursor:'pointer',
                            border:`2px solid ${form.avatar===av.id?'#7F77DD':'rgba(38,33,92,0.8)'}`,
                            background:form.avatar===av.id?'rgba(127,119,221,0.18)':'rgba(255,255,255,0.03)',
                            transition:'all 0.18s',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            overflow:'hidden',
                            boxShadow: form.avatar===av.id ? '0 0 10px rgba(127,119,221,0.35)' : 'none',
                          }}>
                          <AvatarDisplay id={av.id} size={52} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" style={{
                    marginTop:'0.25rem', width:'100%', padding:'0.85rem',
                    background:'#7F77DD', border:'none', borderRadius:'12px',
                    color:'#EEEDFE', fontSize:'0.85rem', fontWeight:500,
                    cursor:'pointer', letterSpacing:'0.06em',
                    fontFamily:'var(--font-english)', transition:'all 0.2s',
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background='#9088e8'}
                    onMouseLeave={e=>e.currentTarget.style.background='#7F77DD'}
                    onMouseDown={e=>e.currentTarget.style.transform='scale(0.97)'}
                    onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
                  >开始探索宇宙 →</button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

const LS = { display:'block', color:'#AFA9EC', fontSize:'0.82rem', marginBottom:'0.4rem' }
const IS = err => ({
  width:'100%', padding:'0.65rem 1rem',
  background:'rgba(127,119,221,0.08)',
  border:`1px solid ${err?'var(--danger)':'rgba(127,119,221,0.3)'}`,
  borderRadius:'10px', color:'#EEEDFE', fontSize:'1rem', outline:'none',
  transition:'border-color 0.2s',
})
