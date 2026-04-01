import React, { useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════
   SpaceCanvas — 沉浸式宇宙交互画布
   · 星空 (3层深度)  · 星云光晕
   · 土星 + 轨道环 + 卫星  · 小行星
   · 宇宙飞船（推进火焰动画）  · 太阳能卫星
   · 鼠标悬停：物体轻微漂移 / 星星增亮
   · 点击：随机惊喜特效（彗星/粒子爆炸/飞船跃迁/光波）
═══════════════════════════════════════════════════════ */
export default function SpaceCanvas({ warpMode = false, onWarpDone, style }) {
  const canvasRef = useRef()
  const mouseRef  = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    let W = window.innerWidth
    let H = window.innerHeight
    let DPR = Math.min(window.devicePixelRatio || 1, 2)
    const ctx = canvas.getContext('2d')

    /* ─── Stars ─── */
    const mkStars = (n, szMin, szMax, opMin, opMax) =>
      Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        sz: szMin + Math.random() * (szMax - szMin),
        baseOp: opMin + Math.random() * (opMax - opMin),
        tw: Math.random() * Math.PI * 2,
        twSpd: 0.008 + Math.random() * 0.018,
        ox: 0, oy: 0,
      }))
    const farStars  = mkStars(220, 0.3, 0.7,  0.1,  0.4)
    const midStars  = mkStars(110, 0.7, 1.3,  0.28, 0.6)
    const nearStars = mkStars(45,  1.3, 2.2,  0.5,  0.9)
    const dustClouds = Array.from({ length: 16 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 40 + Math.random() * 120,
      alpha: 0.02 + Math.random() * 0.035,
      hue: [210, 235, 260, 165][Math.floor(Math.random() * 4)],
      drift: 0.2 + Math.random() * 0.4,
      offset: Math.random() * Math.PI * 2,
    }))

    /* ─── Saturn ─── */
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

    function drawAuroraBand(now, opts) {
      const {
        yBase,
        amplitude,
        thickness,
        speed,
        hueA,
        hueB,
        alpha,
        phase,
      } = opts
      const grad = ctx.createLinearGradient(0, yBase - thickness, 0, yBase + thickness)
      grad.addColorStop(0, `hsla(${hueA}, 85%, 62%, 0)`)
      grad.addColorStop(0.5, `hsla(${hueB}, 85%, 68%, ${alpha})`)
      grad.addColorStop(1, `hsla(${hueA}, 85%, 62%, 0)`)

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(-40, H + 40)
      for (let x = -40; x <= W + 40; x += 18) {
        const wave = Math.sin(x * 0.006 + now * speed + phase) * amplitude
        const wave2 = Math.cos(x * 0.0035 + now * speed * 0.65 + phase * 1.7) * amplitude * 0.45
        ctx.lineTo(x, yBase + wave + wave2)
      }
      ctx.lineTo(W + 40, H + 40)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.globalCompositeOperation = 'screen'
      ctx.filter = 'blur(22px)'
      ctx.fill()
      ctx.restore()
      ctx.filter = 'none'
      ctx.globalCompositeOperation = 'source-over'
    }

    function drawDustField(now) {
      dustClouds.forEach(cloud => {
        const x = cloud.x + Math.sin(now * 0.00018 * cloud.drift + cloud.offset) * 18
        const y = cloud.y + Math.cos(now * 0.00012 * cloud.drift + cloud.offset * 1.4) * 12
        const grad = ctx.createRadialGradient(x, y, 0, x, y, cloud.r)
        grad.addColorStop(0, `hsla(${cloud.hue}, 70%, 70%, ${cloud.alpha})`)
        grad.addColorStop(0.45, `hsla(${cloud.hue}, 65%, 55%, ${cloud.alpha * 0.45})`)
        grad.addColorStop(1, `hsla(${cloud.hue}, 65%, 45%, 0)`)
        ctx.fillStyle = grad
        ctx.fillRect(x - cloud.r, y - cloud.r, cloud.r * 2, cloud.r * 2)
      })
    }

    function drawVignette() {
      const grad = ctx.createRadialGradient(W * 0.5, H * 0.48, Math.min(W, H) * 0.12, W * 0.5, H * 0.5, Math.max(W, H) * 0.72)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.7, 'rgba(3,2,12,0.18)')
      grad.addColorStop(1, 'rgba(1,1,8,0.56)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    }

    function resize() {
      W = window.innerWidth
      H = window.innerHeight
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = W * DPR
      canvas.height = H * DPR
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    function drawSaturn() {
      const { x, y, r } = saturn
      const rRX = r * 2.25, rRY = r * 2.25 * 0.27
      const rGrad = ctx.createLinearGradient(x - rRX, y, x + rRX, y)
      rGrad.addColorStop(0,    'rgba(127,119,221,0)')
      rGrad.addColorStop(0.18, 'rgba(127,119,221,0.18)')
      rGrad.addColorStop(0.5,  'rgba(175,169,236,0.38)')
      rGrad.addColorStop(0.82, 'rgba(127,119,221,0.18)')
      rGrad.addColorStop(1,    'rgba(127,119,221,0)')

      ctx.save()
      ctx.beginPath(); ctx.rect(x - rRX - 4, y - rRY - 4, (rRX + 4) * 2, rRY + 4); ctx.clip()
      ctx.beginPath(); ctx.ellipse(x, y, rRX, rRY, 0, 0, Math.PI * 2)
      ctx.strokeStyle = rGrad; ctx.lineWidth = r * 0.21; ctx.stroke()
      ctx.restore()

      const gGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.8)
      gGrad.addColorStop(0, 'rgba(83,74,183,0.15)'); gGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gGrad; ctx.fillRect(0, 0, W, H)

      const bGrad = ctx.createRadialGradient(x - r * 0.32, y - r * 0.32, 0, x, y, r)
      bGrad.addColorStop(0, '#6B5FD0'); bGrad.addColorStop(0.48, '#26215C'); bGrad.addColorStop(1, '#070512')
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = bGrad; ctx.fill()

      const hlGrad = ctx.createRadialGradient(x - r*0.36, y - r*0.36, 0, x - r*0.1, y - r*0.1, r*0.72)
      hlGrad.addColorStop(0, 'rgba(160,148,255,0.28)'); hlGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = hlGrad; ctx.fill()

      ctx.save()
      ctx.beginPath(); ctx.rect(x - rRX - 4, y, (rRX + 4) * 2, rRY + 6); ctx.clip()
      ctx.beginPath(); ctx.ellipse(x, y, rRX, rRY, 0, 0, Math.PI * 2)
      ctx.strokeStyle = rGrad; ctx.lineWidth = r * 0.21; ctx.stroke()
      ctx.restore()

      saturn.moons.forEach(m => {
        m.a += m.spd
        const mx = x + Math.cos(m.a) * r * m.orb
        const my = y + Math.sin(m.a) * r * m.orb * 0.38
        m.trail.push({ x: mx, y: my })
        if (m.trail.length > 16) m.trail.shift()
        m.trail.forEach((pt, i) => {
          const prog = i / m.trail.length
          ctx.beginPath(); ctx.arc(pt.x, pt.y, m.r * prog * 0.5, 0, Math.PI * 2)
          const [rr, gg, bb] = m.col === '#AFA9EC' ? [175, 169, 236] : [133, 183, 235]
          ctx.fillStyle = `rgba(${rr},${gg},${bb},${prog * 0.4})`; ctx.fill()
        })
        ctx.shadowBlur = 10; ctx.shadowColor = m.col
        ctx.beginPath(); ctx.arc(mx, my, m.r, 0, Math.PI * 2)
        ctx.fillStyle = m.col; ctx.fill(); ctx.shadowBlur = 0
      })
    }

    function drawTealPlanet() {
      const { x, y, r } = teal
      const gGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2)
      gGrad.addColorStop(0, 'rgba(29,158,117,0.12)'); gGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = gGrad; ctx.fillRect(0, 0, W, H)
      const bGrad = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, r)
      bGrad.addColorStop(0, '#2dd4a0'); bGrad.addColorStop(0.5, '#1D9E75'); bGrad.addColorStop(1, '#0a3d2b')
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = bGrad; ctx.fill()
    }

    function drawShip() {
      const { x, y, angle, sz, thrustT } = ship
      if (ship.warping) return
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle)
      const thrust = Math.sin(thrustT) * 0.3 + 0.7
      const engGrad = ctx.createRadialGradient(-sz*0.55, 0, 0, -sz*0.55, 0, sz*0.9)
      engGrad.addColorStop(0, `rgba(100,180,255,${thrust*0.6})`); engGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = engGrad; ctx.beginPath(); ctx.arc(-sz*0.55, 0, sz*0.9, 0, Math.PI*2); ctx.fill()
      ctx.beginPath()
      ctx.moveTo(sz, 0); ctx.lineTo(-sz*0.65, -sz*0.32); ctx.lineTo(-sz*0.48, 0); ctx.lineTo(-sz*0.65, sz*0.32); ctx.closePath()
      const bGrad = ctx.createLinearGradient(-sz, 0, sz, 0)
      bGrad.addColorStop(0, '#1a1060'); bGrad.addColorStop(0.4, '#534AB7'); bGrad.addColorStop(1, '#AFA9EC')
      ctx.fillStyle = bGrad; ctx.fill()
      ctx.strokeStyle = 'rgba(175,169,236,0.45)'; ctx.lineWidth = 0.5; ctx.stroke()
      ctx.beginPath(); ctx.ellipse(sz*0.22, 0, sz*0.19, sz*0.11, 0, 0, Math.PI*2)
      ctx.fillStyle = `rgba(135,200,255,0.65)`; ctx.fill()
      ctx.beginPath(); ctx.moveTo(-sz*0.48, -sz*0.1); ctx.lineTo(-sz*(0.78+thrust*0.4), 0); ctx.lineTo(-sz*0.48, sz*0.1)
      ctx.fillStyle = `rgba(60,140,255,${thrust*0.7})`; ctx.fill()
      ctx.beginPath(); ctx.moveTo(-sz*0.48, -sz*0.05); ctx.lineTo(-sz*(0.65+thrust*0.28), 0); ctx.lineTo(-sz*0.48, sz*0.05)
      ctx.fillStyle = `rgba(180,230,255,${thrust})`; ctx.fill()
      ctx.restore()
    }

    function drawSatellite() {
      const { x, y, angle, sz } = sat
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle)
      ctx.fillStyle = '#26215C'; ctx.strokeStyle = '#534AB7'; ctx.lineWidth = 1
      const bsz = sz * 0.32
      ctx.fillRect(-bsz, -bsz, bsz*2, bsz*2); ctx.strokeRect(-bsz, -bsz, bsz*2, bsz*2)
      ;[-1, 1].forEach(side => {
        const px = side * bsz, pw = side * sz * 0.72, ph = sz * 0.52
        ctx.fillStyle = 'rgba(55,138,221,0.65)'; ctx.strokeStyle = '#85B7EB'; ctx.lineWidth = 0.5
        ctx.fillRect(px, -ph/2, pw, ph); ctx.strokeRect(px, -ph/2, pw, ph)
        ctx.strokeStyle = 'rgba(133,183,235,0.35)'; ctx.lineWidth = 0.4
        ctx.beginPath(); ctx.moveTo(px+pw/2, -ph/2); ctx.lineTo(px+pw/2, ph/2)
        ctx.moveTo(px, 0); ctx.lineTo(px+pw, 0); ctx.stroke()
      })
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
      ctx.fill(); ctx.stroke(); ctx.restore()
    }

    function drawComet(c) {
      const tl = c.tailLen ?? 160
      const grad = ctx.createLinearGradient(
        c.x - Math.cos(c.angle)*tl, c.y - Math.sin(c.angle)*tl, c.x, c.y)
      grad.addColorStop(0, 'rgba(255,255,255,0)')
      grad.addColorStop(0.6, `rgba(200,210,255,${c.alpha * 0.5})`)
      grad.addColorStop(1, `rgba(255,255,255,${c.alpha})`)
      ctx.strokeStyle = grad; ctx.lineWidth = c.isBg ? 1.2 : 1.8
      ctx.beginPath()
      ctx.moveTo(c.x - Math.cos(c.angle)*tl, c.y - Math.sin(c.angle)*tl)
      ctx.lineTo(c.x, c.y); ctx.stroke()
      ctx.shadowBlur = 10; ctx.shadowColor = `rgba(200,220,255,${c.alpha})`
      ctx.beginPath(); ctx.arc(c.x, c.y, c.isBg ? 2 : 2.5, 0, Math.PI*2)
      ctx.fillStyle = `rgba(255,255,255,${c.alpha})`; ctx.fill(); ctx.shadowBlur = 0
    }

    let lastCometTime = performance.now() + 3000
    let nextCometDelay = 4000 + Math.random() * 6000

    function spawnBgComet() {
      const side = Math.floor(Math.random() * 4)
      let sx, sy, ex, ey
      const pad = 60
      if (side === 0)      { sx = Math.random()*W; sy = -pad;    ex = Math.random()*W; ey = H+pad }
      else if (side === 1) { sx = W+pad; sy = Math.random()*H;   ex = -pad;            ey = Math.random()*H }
      else if (side === 2) { sx = Math.random()*W; sy = H+pad;   ex = Math.random()*W; ey = -pad }
      else                 { sx = -pad; sy = Math.random()*H;    ex = W+pad;           ey = Math.random()*H }
      const angle = Math.atan2(ey - sy, ex - sx)
      const spd = 2.5 + Math.random() * 2.5
      comets.push({
        x: sx, y: sy, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd,
        angle, alpha: 0, life: 1,
        tailLen: 200 + Math.random() * 120,
        isBg: true, fadeIn: true,
      })
    }

    function spawnSurprise(mx, my) {
      const kinds = ['comet', 'nova', 'ripple', 'shipwarp', 'comet']
      const kind = kinds[Math.floor(Math.random() * kinds.length)]
      if (kind === 'comet') {
        const edgeAngle = Math.random() * Math.PI * 2
        const ex = W/2 + Math.cos(edgeAngle) * (W * 0.8)
        const ey = H/2 + Math.sin(edgeAngle) * (H * 0.8)
        const toAngle = Math.atan2(H/2 - ey + (Math.random()-0.5)*H*0.5, W/2 - ex + (Math.random()-0.5)*W*0.5)
        const spd = 9 + Math.random() * 5
        comets.push({ x: ex, y: ey, vx: Math.cos(toAngle)*spd, vy: Math.sin(toAngle)*spd, angle: toAngle, alpha: 1, life: 1 })
      }
      if (kind === 'nova') {
        for (let i = 0; i < 64; i++) {
          const a = Math.random() * Math.PI * 2
          const spd = 1.5 + Math.random() * 6
          particles.push({
            x: mx, y: my, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd,
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
        ship.x = mx; ship.y = my; ship.warping = true; ship.warpAlpha = 1
        ship.angle = Math.atan2(ship.vy, ship.vx)
        for (let i = 0; i < 30; i++) {
          const a = Math.random()*Math.PI*2, spd = 3+Math.random()*5
          particles.push({ x: mx, y: my, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, life:1, decay:0.025, color:'#AFA9EC', size:3+Math.random()*4 })
        }
      }
    }

    function drawWarp(now) {
      const t = Math.min((now - warpStart) / WARP_DUR, 1)
      const spd = t < 0.38 ? 1 + (0.38 - t) * 38 : Math.max(0.8, (1 - t) * 9)
      ctx.fillStyle = `rgba(4,2,15,${t < 0.25 ? 0.12 : 0.3})`; ctx.fillRect(0, 0, W, H)
      const cx = W/2, cy = H/2
      warpStars.forEach(s => {
        s.r += s.spd * spd * 0.55
        if (s.r > maxR) s.r = 4 + Math.random()*15
        const x = cx + Math.cos(s.angle)*s.r, y = cy + Math.sin(s.angle)*s.r
        const tl = s.spd * spd * 1.5
        const tx = x - Math.cos(s.angle)*tl, ty = y - Math.sin(s.angle)*tl
        const alpha = Math.min(1, s.r/70)
        const grad = ctx.createLinearGradient(tx, ty, x, y)
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(1, `hsla(${s.hue},${s.sat}%,${s.lum}%,${alpha})`)
        ctx.strokeStyle = grad; ctx.lineWidth = s.sz * Math.min(2.2, spd*0.11+0.4)
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(x,y); ctx.stroke()
      })
      return t >= 1
    }

    let raf
    function frame(now) {
      ctx.clearRect(0, 0, W, H)

      if (warpMode && !warpDone) {
        const done = drawWarp(now)
        if (done) { warpDone = true; onWarpDone?.() }
        raf = requestAnimationFrame(frame)
        return
      }

      const mxNorm = mouseRef.current.x > -1000 ? mouseRef.current.x / W : 0.5
      const myNorm = mouseRef.current.y > -1000 ? mouseRef.current.y / H : 0.5

      const skyGrad = ctx.createLinearGradient(0, 0, 0, H)
      skyGrad.addColorStop(0, '#040312')
      skyGrad.addColorStop(0.38, '#07051a')
      skyGrad.addColorStop(0.72, '#040212')
      skyGrad.addColorStop(1, '#02010a')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, W, H)

      drawAuroraBand(now, {
        yBase: H * 0.22 + myNorm * 16,
        amplitude: 18,
        thickness: 90,
        speed: 0.0012,
        hueA: 250,
        hueB: 215,
        alpha: 0.08,
        phase: 0.3,
      })
      drawAuroraBand(now, {
        yBase: H * 0.74 - myNorm * 12,
        amplitude: 24,
        thickness: 110,
        speed: 0.0009,
        hueA: 178,
        hueB: 250,
        alpha: 0.06,
        phase: 1.7,
      })

      drawNebula(W*0.15, H*0.3,  W*0.38, 83,  74,  183, 0.07)
      drawNebula(W*0.8,  H*0.58, W*0.32, 24,  95,  165, 0.055)
      drawNebula(W*0.45, H*0.82, W*0.28, 29,  158, 117, 0.045)
      drawNebula(W*(0.25 + mxNorm * 0.04), H*0.16, W*0.22, 110, 120, 255, 0.04)
      drawDustField(now)

      ;[farStars, midStars].forEach(layer => {
        layer.forEach(s => {
          s.tw += s.twSpd
          const driftX = mouseRef.current.x > -1000 ? (mxNorm - 0.5) * (layer === farStars ? -8 : -15) : 0
          const driftY = mouseRef.current.y > -1000 ? (myNorm - 0.5) * (layer === farStars ? -5 : -9) : 0
          drawStarDot(s.x + driftX, s.y + driftY, s.sz, s.baseOp*(0.65+0.35*Math.sin(s.tw)))
        })
      })
      nearStars.forEach(s => {
        s.tw += s.twSpd
        const d = Math.hypot(s.x - mouseRef.current.x, s.y - mouseRef.current.y)
        const boost = d < 90 ? 1 + (1 - d/90)*1.5 : 1
        const driftX = mouseRef.current.x > -1000 ? (mxNorm - 0.5) * -26 : 0
        const driftY = mouseRef.current.y > -1000 ? (myNorm - 0.5) * -16 : 0
        drawStarDot(s.x + driftX, s.y + driftY, s.sz*Math.min(boost,2.2), Math.min(1, s.baseOp*(0.65+0.35*Math.sin(s.tw))*boost))
      })

      saturn.driftT += 0.00045
      saturn.x = saturn.bx + Math.sin(saturn.driftT * 2.1) * 14
      saturn.y = saturn.by + Math.cos(saturn.driftT * 1.6) * 9
      mouseRepel(saturn, 150, 3); drawSaturn()

      teal.driftA += 0.0012
      teal.x = teal.bx + Math.sin(teal.driftA * 1.4) * 10
      teal.y = teal.by + Math.cos(teal.driftA) * 7
      mouseRepel(teal, 120, 2.5); drawTealPlanet()

      ship.thrustT += 0.14
      if (!ship.warping) {
        ship.x += ship.vx; ship.y += ship.vy
        if (ship.x < -60) { ship.x = W+60; ship.y = Math.random()*H }
        if (ship.x > W+60) { ship.x = -60; ship.y = Math.random()*H }
        if (ship.y < -60) ship.y = H+60
        if (ship.y > H+60) ship.y = -60
      } else {
        ship.warpAlpha -= 0.04
        if (ship.warpAlpha <= 0) ship.warping = false
        ctx.fillStyle = `rgba(127,119,221,${ship.warpAlpha*0.35})`; ctx.fillRect(0,0,W,H)
      }
      drawShip()

      sat.angle += sat.angSpd
      sat.x += sat.vx; sat.y += sat.vy
      if (sat.x < -45) sat.x = W+45; if (sat.x > W+45) sat.x = -45
      if (sat.y < -45) sat.y = H+45; if (sat.y > H+45) sat.y = -45
      drawSatellite()

      asteroids.forEach(a => {
        a.x += a.vx; a.y += a.vy; a.angle += a.angSpd
        if (a.x < -20) a.x = W+20; if (a.x > W+20) a.x = -20
        if (a.y < -20) a.y = H+20; if (a.y > H+20) a.y = -20
        mouseRepel(a, 80, 1.5); drawAsteroid(a)
      })

      for (let i = comets.length-1; i >= 0; i--) {
        const c = comets[i]
        c.x += c.vx; c.y += c.vy
        if (c.isBg) {
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
          if (c.life <= 0 || Math.abs(c.x) > W+250 || Math.abs(c.y) > H+250) comets.splice(i, 1)
          else drawComet(c)
        }
      }

      if (!warpMode && now - lastCometTime > nextCometDelay) {
        spawnBgComet(); lastCometTime = now; nextCometDelay = 5000 + Math.random() * 8000
      }

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

      for (let i = ripples.length-1; i >= 0; i--) {
        const rp = ripples[i]
        rp.r += 6; rp.life -= 0.018
        if (rp.life <= 0) { ripples.splice(i,1); continue }
        ctx.strokeStyle = `rgba(127,119,221,${rp.life * 0.6})`; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI*2); ctx.stroke()
        if (rp.r > 40) {
          ctx.strokeStyle = `rgba(175,169,236,${rp.life * 0.35})`
          ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r - 30, 0, Math.PI*2); ctx.stroke()
        }
      }

      drawVignette()

      raf = requestAnimationFrame(frame)
    }
    resize()
    raf = requestAnimationFrame(frame)

    function onMove(e) { mouseRef.current = { x: e.clientX, y: e.clientY } }
    function onClick(e) { spawnSurprise(e.clientX, e.clientY) }
    function onResize() { resize() }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', onResize)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('click', onClick)
    }
  }, [warpMode])

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0, zIndex: 0,
      width: '100%', height: '100%',
      cursor: 'crosshair',
      ...style,
    }} />
  )
}
