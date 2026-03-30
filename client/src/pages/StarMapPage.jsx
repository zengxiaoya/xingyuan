import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore.js'
import { useProgressStore } from '../store/progressStore.js'
import { useNovaStore } from '../store/novaStore.js'
import { LEVELS } from '../data/levels.js'
import { AvatarDisplay } from '../components/Avatars.jsx'
import Icon from '../components/Icon.jsx'

/* ── Node definitions ── */
const NODES = [
  { id:'solar_lv1',    x:.18, y:.22, theme:'solar',   lv:1, label:'行星基础',    floatAmp:4, floatSpd:.8,  floatOff:0   },
  { id:'explore_lv1',  x:.50, y:.15, theme:'explore',  lv:1, label:'宇航员与火箭', floatAmp:5, floatSpd:.6,  floatOff:1.2 },
  { id:'universe_lv1', x:.82, y:.22, theme:'universe', lv:1, label:'星系与光年',   floatAmp:4, floatSpd:.9,  floatOff:2.1 },
  { id:'solar_lv2',    x:.18, y:.52, theme:'solar',   lv:2, label:'探测器历史',   floatAmp:3, floatSpd:.7,  floatOff:.5  },
  { id:'explore_lv2',  x:.50, y:.48, theme:'explore',  lv:2, label:'空间站生活',   floatAmp:3, floatSpd:.5,  floatOff:1.8 },
  { id:'universe_lv2', x:.82, y:.52, theme:'universe', lv:2, label:'黑洞与星云',   floatAmp:3, floatSpd:.8,  floatOff:3.0 },
  { id:'solar_lv3',    x:.25, y:.80, theme:'solar',   lv:3, label:'极端环境',    floatAmp:2, floatSpd:.6,  floatOff:.9  },
  { id:'explore_lv3',  x:.50, y:.85, theme:'explore',  lv:3, label:'星际移民',    floatAmp:2, floatSpd:.7,  floatOff:2.4 },
  { id:'universe_lv3', x:.75, y:.80, theme:'universe', lv:3, label:'宇宙大爆炸',  floatAmp:2, floatSpd:.5,  floatOff:1.5 },
]

const EDGES = [
  ['solar_lv1','explore_lv1'], ['explore_lv1','universe_lv1'],
  ['solar_lv1','solar_lv2'],   ['explore_lv1','explore_lv2'], ['universe_lv1','universe_lv2'],
  ['solar_lv2','explore_lv2'], ['explore_lv2','universe_lv2'],
  ['solar_lv2','solar_lv3'],   ['explore_lv2','explore_lv3'], ['universe_lv2','universe_lv3'],
  ['solar_lv3','explore_lv3'], ['explore_lv3','universe_lv3'],
]

// Theme color palette
const THEME = {
  solar:    { base:'#4fc3f7', glow:'rgba(79,195,247,', dark:'#0d3a52' },
  explore:  { base:'#66bb6a', glow:'rgba(102,187,106,', dark:'#0a2e0c' },
  universe: { base:'#ffa726', glow:'rgba(255,167,38,', dark:'#3a2200' },
}

export default function StarMapPage() {
  const navigate   = useNavigate()
  const user       = useUserStore(s => s.user)
  const { stars, isLevelUnlocked, isLevelCompleted } = useProgressStore()
  const openNova   = useNovaStore(s => s.openNova)
  const canvasRef  = useRef()
  const mapRef     = useRef()
  const [tooltip, setTooltip] = useState(null)

  const completedCount = NODES.filter(n => isLevelCompleted(n.id)).length

  useEffect(() => {
    const canvas = canvasRef.current
    const area   = mapRef.current
    let W, H
    let bgStars = []
    let dustParticles = []
    let shootingStars = []
    let t = 0
    let flowOff = 0
    let raf

    function resize() {
      W = canvas.width  = area.offsetWidth
      H = canvas.height = area.offsetHeight

      // Background stars — varied sizes and brightness
      bgStars = Array.from({ length: 320 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.6 + .3,
        a: Math.random() * .8 + .1,
        da: (Math.random() - .5) * .007,
        vx: (Math.random() - .5) * .04, vy: (Math.random() - .5) * .04,
        bright: Math.random() > .92, // 8% are bright sparkle stars
      }))

      // Cosmic dust
      dustParticles = Array.from({ length: 80 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * .7 + .1,
        a: Math.random() * .3,
        vx: (Math.random() - .5) * .02, vy: (Math.random() - .5) * .02,
      }))
    }

    function spawnShootingStar() {
      if (shootingStars.length >= 2) return
      const startX = Math.random() * W * .6 + W * .1
      const startY = Math.random() * H * .3
      shootingStars.push({
        x: startX, y: startY,
        vx: Math.random() * 6 + 4,
        vy: Math.random() * 3 + 1.5,
        life: 1, decay: .025,
        length: Math.random() * 80 + 60,
      })
    }

    function getPos(n) {
      return {
        x: n.x * W,
        y: n.y * H + Math.sin(t * n.floatSpd + n.floatOff) * n.floatAmp,
      }
    }

    function getState(id) {
      if (isLevelCompleted(id)) return 'done'
      if (isLevelUnlocked(id)) return 'active'
      return 'locked'
    }

    const ctx = canvas.getContext('2d')

    function draw() {
      t += 0.016
      flowOff = (flowOff + 1) % 200
      ctx.clearRect(0, 0, W, H)

      // ── Background
      ctx.fillStyle = '#03010e'
      ctx.fillRect(0, 0, W, H)

      // ── Zone tints (subtle colored backgrounds)
      const zones = [
        { xr: .35, c0: 'rgba(79,195,247,.025)', c1: 'rgba(79,195,247,0)' },   // solar
        { xr: .67, c0: 'rgba(102,187,106,.02)',  c1: 'rgba(102,187,106,0)' },  // explore
        { xr: 1.0, c0: 'rgba(255,167,38,.018)',  c1: 'rgba(255,167,38,0)' },   // universe
      ]
      const zoneWidths = [.35, .32, .33]
      const zoneStarts = [0, .35, .67]
      zones.forEach((z, i) => {
        const g = ctx.createLinearGradient(zoneStarts[i]*W, 0, (zoneStarts[i]+zoneWidths[i])*W, 0)
        g.addColorStop(0, z.c1)
        g.addColorStop(.5, z.c0)
        g.addColorStop(1, z.c1)
        ctx.fillStyle = g
        ctx.fillRect(zoneStarts[i]*W, 0, zoneWidths[i]*W, H)
      })

      // ── Nebulas (5 layers, richer colors)
      const nebulas = [
        [.15, .30, 'rgba(79,195,247,.07)',  W*.30],
        [.70, .50, 'rgba(102,187,106,.055)', W*.28],
        [.48, .72, 'rgba(127,119,221,.065)', W*.26],
        [.85, .28, 'rgba(255,167,38,.05)',   W*.22],
        [.32, .62, 'rgba(236,64,122,.04)',   W*.20],
      ]
      nebulas.forEach(([nx, ny, c, r]) => {
        const g = ctx.createRadialGradient(nx*W, ny*H, 0, nx*W, ny*H, r)
        g.addColorStop(0, c); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      })

      // ── Cosmic dust
      dustParticles.forEach(d => {
        d.x += d.vx; d.y += d.vy
        if (d.x < 0) d.x = W; if (d.x > W) d.x = 0
        if (d.y < 0) d.y = H; if (d.y > H) d.y = 0
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2)
        ctx.fillStyle = `rgba(180,175,255,${d.a})`; ctx.fill()
      })

      // ── Background stars
      bgStars.forEach(s => {
        s.a += s.da
        if (s.a < .08) s.da = Math.abs(s.da)
        if (s.a > .9) s.da = -Math.abs(s.da)
        s.x += s.vx; s.y += s.vy
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0

        if (s.bright) {
          // 4-point sparkle star
          const spk = s.r * 3
          ctx.save()
          ctx.translate(s.x, s.y)
          ctx.strokeStyle = `rgba(255,255,240,${s.a * .7})`
          ctx.lineWidth = .6
          ctx.beginPath(); ctx.moveTo(-spk, 0); ctx.lineTo(spk, 0); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(0, -spk); ctx.lineTo(0, spk); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(-spk*.6, -spk*.6); ctx.lineTo(spk*.6, spk*.6); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(spk*.6, -spk*.6); ctx.lineTo(-spk*.6, spk*.6); ctx.stroke()
          ctx.restore()
        } else {
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(210,205,255,${s.a * .55})`; ctx.fill()
        }
      })

      // ── Shooting stars
      if (Math.random() < .002) spawnShootingStar()
      shootingStars = shootingStars.filter(ss => ss.life > 0)
      shootingStars.forEach(ss => {
        ss.x += ss.vx; ss.y += ss.vy; ss.life -= ss.decay
        const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * ss.length/ss.vx, ss.y - ss.vy * ss.length/ss.vx)
        grad.addColorStop(0, `rgba(255,255,220,${ss.life * .9})`)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.moveTo(ss.x, ss.y)
        ctx.lineTo(ss.x - ss.vx * (ss.length / Math.hypot(ss.vx, ss.vy)),
                   ss.y - ss.vy * (ss.length / Math.hypot(ss.vx, ss.vy)))
        ctx.strokeStyle = grad; ctx.lineWidth = 1.2; ctx.stroke()
      })

      // ── Zone dividers
      ctx.setLineDash([3, 8])
      ;[.35, .67].forEach(xr => {
        ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = .5
        ctx.beginPath(); ctx.moveTo(xr*W, 0); ctx.lineTo(xr*W, H); ctx.stroke()
      })
      ctx.setLineDash([])

      // ── Zone labels
      const zoneLabels = [
        { x:.175, label:'太阳系',   c:'rgba(79,195,247,.45)' },
        { x:.51,  label:'宇宙探索', c:'rgba(102,187,106,.4)' },
        { x:.835, label:'宇宙尺度', c:'rgba(255,167,38,.4)' },
      ]
      ctx.font = '10px Orbitron,system-ui'; ctx.textAlign = 'center'
      zoneLabels.forEach(z => {
        ctx.fillStyle = z.c; ctx.fillText(z.label, z.x*W, 16)
      })

      // ── Level lines
      ctx.setLineDash([2, 10])
      ;[.38, .68].forEach(yr => {
        ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = .5
        ctx.beginPath(); ctx.moveTo(0, yr*H); ctx.lineTo(W, yr*H); ctx.stroke()
      })
      ctx.setLineDash([])
      ctx.font = '9px Orbitron,system-ui'; ctx.textAlign = 'left'
      ;['Lv 1', 'Lv 2', 'Lv 3'].forEach((lbl, i) => {
        ctx.fillStyle = 'rgba(255,255,255,.2)'
        ctx.fillText(lbl, 6, [.08,.44,.74][i]*H)
      })

      // ── Edges
      EDGES.forEach(([a, b]) => {
        const na = NODES.find(n => n.id === a), nb = NODES.find(n => n.id === b)
        if (!na || !nb) return
        const pa = getPos(na), pb = getPos(nb)
        const sa = getState(a), sb = getState(b)
        const active  = sa !== 'locked' && sb !== 'locked'
        const flowing = sa === 'done' && sb !== 'locked'

        // Use theme color of the source node
        const thC = THEME[na.theme] || THEME.solar

        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y)
        ctx.setLineDash(active ? [] : [3, 6])
        if (flowing) {
          ctx.strokeStyle = thC.glow + '.35)'
          ctx.lineWidth = 1.2
        } else if (active) {
          ctx.strokeStyle = thC.glow + '.2)'
          ctx.lineWidth = .8
        } else {
          ctx.strokeStyle = 'rgba(60,50,100,.4)'
          ctx.lineWidth = .5
        }
        ctx.stroke()
        ctx.setLineDash([])

        // Flowing particles
        if (flowing) {
          for (let d = 0; d < 3; d++) {
            const prog = ((flowOff / 200) + (d / 3)) % 1
            const fx = pa.x + (pb.x - pa.x) * prog
            const fy = pa.y + (pb.y - pa.y) * prog
            const alpha = Math.sin(prog * Math.PI)
            ctx.beginPath(); ctx.arc(fx, fy, 2.2, 0, Math.PI * 2)
            ctx.fillStyle = thC.glow + `${alpha * .9})`; ctx.fill()
          }
        }
      })

      // ── Nodes
      NODES.forEach(n => {
        const { x, y } = getPos(n)
        const state = getState(n.id)
        const isDone   = state === 'done'
        const isActive = state === 'active'
        const thC = THEME[n.theme] || THEME.solar
        const r = isDone ? 23 : isActive ? 24 : 16

        // Outer pulse rings
        if (isActive) {
          const pulse = .12 + .07 * Math.sin(t * 2 + n.floatOff)
          const ringR = r + 12 + 5 * Math.sin(t * 1.5 + n.floatOff)
          ctx.beginPath(); ctx.arc(x, y, ringR, 0, Math.PI * 2)
          ctx.strokeStyle = thC.glow + `${pulse})`; ctx.lineWidth = 1; ctx.stroke()
          const ring2R = r + 22 + 8 * Math.sin(t * 1.2 + n.floatOff + 1)
          ctx.beginPath(); ctx.arc(x, y, ring2R, 0, Math.PI * 2)
          ctx.strokeStyle = thC.glow + `${pulse * .4})`; ctx.lineWidth = .5; ctx.stroke()
        } else if (isDone) {
          const pulse = .1 + .05 * Math.sin(t * 1.8 + n.floatOff)
          ctx.beginPath(); ctx.arc(x, y, r + 9 + 3 * Math.sin(t * 1.3 + n.floatOff), 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(29,158,117,${pulse})`; ctx.lineWidth = 1; ctx.stroke()
        }

        // Planet body with theme gradient
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
        const bg = ctx.createRadialGradient(x - r * .35, y - r * .35, 0, x, y, r)
        if (isDone) {
          bg.addColorStop(0, '#1e5c3a'); bg.addColorStop(1, '#071a10')
        } else if (isActive) {
          const col = thC.dark
          bg.addColorStop(0, col + 'ee'); bg.addColorStop(1, '#060212')
        } else {
          bg.addColorStop(0, '#141028'); bg.addColorStop(1, '#04020c')
        }
        ctx.fillStyle = bg; ctx.fill()

        // Planet border
        ctx.strokeStyle = isDone ? '#1D9E75'
          : isActive ? thC.base
          : 'rgba(60,50,100,.5)'
        ctx.lineWidth = isDone ? 1.5 : isActive ? 2 : .8; ctx.stroke()

        // Planet surface details (for active/done)
        if (isActive || isDone) {
          // subtle surface ring/band
          const bY = y + r * .15
          ctx.beginPath()
          ctx.ellipse(x, bY, r * .7, r * .12, 0, 0, Math.PI * 2)
          ctx.strokeStyle = isDone ? 'rgba(29,158,117,.15)' : thC.glow + '.1)'
          ctx.lineWidth = .8; ctx.stroke()
        }

        // Orbit ring (active planets only)
        if (isActive) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(t * .7)
          ctx.beginPath(); ctx.ellipse(0, 0, r + 7, r * .35, 0, 0, Math.PI * 2)
          ctx.strokeStyle = thC.glow + '.25)'; ctx.lineWidth = .9; ctx.stroke()
          // Moon on orbit
          const mx = Math.cos(t * .7) * (r + 7)
          const my = Math.sin(t * .7) * (r * .35)
          ctx.beginPath(); ctx.arc(mx, my, 2, 0, Math.PI * 2)
          ctx.fillStyle = thC.base + 'cc'; ctx.fill()
          ctx.restore()
        }

        // Center icon
        ctx.textAlign = 'center'
        if (isDone) {
          ctx.fillStyle = '#1D9E75'
          ctx.font = `bold ${r * .65}px system-ui`
          ctx.fillText('✓', x, y + r * .25)
        } else if (isActive) {
          // Glowing center dot
          const pulse = .5 + .5 * Math.sin(t * 3 + n.floatOff)
          const innerGrad = ctx.createRadialGradient(x, y, 0, x, y, r * .5)
          innerGrad.addColorStop(0, thC.glow + `${pulse * .8})`)
          innerGrad.addColorStop(1, 'transparent')
          ctx.beginPath(); ctx.arc(x, y, r * .5, 0, Math.PI * 2)
          ctx.fillStyle = innerGrad; ctx.fill()
          ctx.beginPath(); ctx.arc(x, y, r * .18, 0, Math.PI * 2)
          ctx.fillStyle = thC.base + 'ee'; ctx.fill()
        } else {
          // Lock icon drawn manually
          const lw = r * .55, lh = r * .45
          const lx = x - lw/2, ly = y - lh/2 + r * .05
          ctx.strokeStyle = 'rgba(100,90,160,.55)'; ctx.lineWidth = 1.1
          ctx.beginPath()
          ctx.roundRect(lx, ly + lh * .38, lw, lh * .62, 2)
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(x, ly + lh * .38, lw * .28, Math.PI, 0)
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(x, ly + lh * .72, 1.8, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(100,90,160,.5)'; ctx.fill()
        }

        // Label
        const lv = LEVELS[n.id]
        const labelText = lv ? lv.title : n.label
        ctx.fillStyle = isDone  ? 'rgba(29,158,117,.85)'
          : isActive ? thC.base + 'cc'
          : 'rgba(100,90,160,.45)'
        ctx.font = `${isActive ? '600' : '400'} 10.5px system-ui`; ctx.textAlign = 'center'
        ctx.fillText(labelText, x, y + r + 15)

        // Lv badge
        ctx.fillStyle = isDone  ? 'rgba(29,158,117,.6)'
          : isActive ? thC.glow + '.65)'
          : 'rgba(60,50,100,.5)'
        ctx.font = '8px Orbitron,system-ui'
        ctx.fillText('Lv' + n.lv, x, y - r - 5)
      })

      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()

    // Touch / Mouse interaction
    function getNodeAt(mx, my) {
      let found = null
      NODES.forEach(n => {
        const p = getPos(n)
        if (Math.hypot(mx - p.x, my - p.y) < 30) found = n
      })
      return found
    }

    function onMove(e) {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      const found = getNodeAt(mx, my)
      if (found) {
        const state = getState(found.id)
        canvas.style.cursor = state === 'locked' ? 'default' : 'pointer'
        const rect2 = area.getBoundingClientRect()
        setTooltip({
          x: e.clientX - rect2.left + 14,
          y: e.clientY - rect2.top - 20,
          node: found, state,
          levelData: LEVELS[found.id],
        })
      } else {
        canvas.style.cursor = 'default'
        setTooltip(null)
      }
    }

    function onClick(e) {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      const found = getNodeAt(mx, my)
      if (found && getState(found.id) !== 'locked') {
        navigate(`/level/${found.id}`)
      }
    }

    const ro = new ResizeObserver(resize)
    ro.observe(area)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', () => setTooltip(null))
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('click', onClick)
    }
  }, [isLevelUnlocked, isLevelCompleted])

  return (
    <div style={{
      background: '#03010e', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui,sans-serif',
    }}>

      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.6rem 1.25rem',
        background: 'rgba(6,3,24,.8)',
        borderBottom: '1px solid rgba(127,119,221,.15)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        flexWrap: 'wrap', gap: '0.5rem',
        position: 'relative', zIndex: 10,
        boxShadow: '0 1px 30px rgba(0,0,0,.5)',
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: 'var(--font-english)', fontSize: '1.05rem', fontWeight: 700,
          color: '#EEEDFE', letterSpacing: '0.3em',
          background: 'linear-gradient(135deg, #AFA9EC, #7F77DD)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          星渊
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Stars badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'rgba(239,159,39,.12)',
            border: '1px solid rgba(239,159,39,.3)',
            borderRadius: '20px', padding: '4px 10px',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9 3,11 3.5,7.5 1,5 4.5,4.5" fill="#EF9F27"/>
            </svg>
            <span style={{ fontSize: '0.78rem', color: '#EF9F27', fontWeight: 600 }}>{stars}</span>
          </div>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              border: '1.5px solid rgba(127,119,221,.6)',
              overflow: 'hidden', flexShrink: 0,
              boxShadow: '0 0 12px rgba(127,119,221,.3)',
            }}>
              <AvatarDisplay id={user?.avatar} size={34} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', color: '#EEEDFE', fontWeight: 500 }}>{user?.name}</div>
              {user?.grade && <div style={{ fontSize: '0.68rem', color: '#7F77DD' }}>{user.grade}</div>}
            </div>
          </div>

          {/* Nav buttons */}
          <button onClick={() => navigate('/hall')} style={NavBtn}>名人堂</button>
          <button onClick={() => navigate('/achievement')} style={NavBtn}>成就</button>
          <button onClick={() => openNova({ type: 'general' })} style={{
            ...NavBtn,
            border: '1px solid rgba(127,119,221,.5)',
            color: '#AFA9EC',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#7F77DD" strokeWidth="1"/>
              <circle cx="12" cy="12" r="4.5" fill="#7F77DD" opacity=".7"/>
              <circle cx="12" cy="12" r="2" fill="#EEEDFE"/>
            </svg>
            NOVA
          </button>
        </div>
      </header>

      {/* ── Progress bar ── */}
      <div style={{
        padding: '0.45rem 1.25rem',
        background: 'rgba(4,2,18,.6)',
        borderBottom: '1px solid rgba(83,74,183,.1)',
        position: 'relative', zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.7rem' }}>
          <span style={{ color: 'rgba(127,119,221,.7)' }}>探索进度</span>
          <span style={{ color: '#7F77DD', fontWeight: 500 }}>{completedCount} / {NODES.length} 关卡</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(127,119,221,.12)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            width: `${(completedCount / NODES.length) * 100}%`,
            background: 'linear-gradient(90deg, #534AB7, #7F77DD, #AFA9EC)',
            transition: 'width 0.6s ease',
            boxShadow: '0 0 8px rgba(127,119,221,.6)',
          }}/>
        </div>
      </div>

      {/* ── Canvas area ── */}
      <div ref={mapRef} style={{ flex: 1, position: 'relative', minHeight: '0' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }}/>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: tooltip.x, top: tooltip.y,
            background: 'rgba(10,6,32,.96)',
            border: `1px solid ${tooltip.state === 'done' ? 'rgba(29,158,117,.5)' : tooltip.state === 'active' ? `${THEME[tooltip.node.theme]?.base || '#7F77DD'}60` : 'rgba(60,50,100,.5)'}`,
            borderRadius: '12px', padding: '10px 14px',
            fontSize: '12px', color: '#EEEDFE',
            pointerEvents: 'none', zIndex: 30, minWidth: '160px',
            boxShadow: '0 4px 24px rgba(0,0,0,.6)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '3px', fontSize: '13px' }}>
              {tooltip.levelData?.title || tooltip.node.label}
            </div>
            <div style={{ color: 'rgba(175,169,236,.8)', fontSize: '11px', lineHeight: 1.7 }}>
              {tooltip.levelData?.subtitle || tooltip.node.label}
              {tooltip.levelData?.scientists?.length > 0 && (
                <><br/>科学家：{tooltip.levelData.scientists.join('·')}</>
              )}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '10px', padding: '2px 8px',
              borderRadius: '10px', marginTop: '6px',
              background: tooltip.state === 'done' ? 'rgba(29,158,117,.15)'
                : tooltip.state === 'active' ? 'rgba(127,119,221,.15)'
                : 'rgba(60,50,100,.15)',
              color: tooltip.state === 'done' ? '#1D9E75'
                : tooltip.state === 'active' ? (THEME[tooltip.node.theme]?.base || '#7F77DD')
                : '#534AB7',
              border: `1px solid ${tooltip.state === 'done' ? 'rgba(29,158,117,.4)'
                : tooltip.state === 'active' ? 'rgba(127,119,221,.35)'
                : 'rgba(60,50,100,.4)'}`,
            }}>
              {tooltip.state === 'done' ? '✓ 已通关' : tooltip.state === 'active' ? '▶ 可挑战' : '🔒 未解锁'}
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: '20px', left: '20px', zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: '5px',
          background: 'rgba(4,2,18,.7)', borderRadius: '10px',
          padding: '8px 12px',
          border: '1px solid rgba(83,74,183,.15)',
          backdropFilter: 'blur(8px)',
        }}>
          {[['#1D9E75', '已通关'], ['#7F77DD', '可挑战'], ['#2a2260', '未解锁']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'rgba(175,169,236,.7)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, boxShadow: `0 0 5px ${c}80` }}/>
              {l}
            </div>
          ))}
        </div>

        {/* NOVA floating button */}
        <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => openNova({ type: 'general' })}
            style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(127,119,221,.18)',
              border: '1.5px solid #7F77DD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all .3s',
              boxShadow: '0 0 20px rgba(127,119,221,.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(127,119,221,.35)'; e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(127,119,221,.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(127,119,221,.18)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(127,119,221,.3)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#7F77DD" strokeWidth="1"/>
              <circle cx="12" cy="12" r="5" fill="#7F77DD" opacity=".7"/>
              <circle cx="12" cy="12" r="2.5" fill="#EEEDFE"/>
            </svg>
          </button>
          <div style={{ fontSize: '10px', color: '#7F77DD', letterSpacing: '.08em', textAlign: 'center' }}>NOVA</div>
        </div>
      </div>
    </div>
  )
}

const NavBtn = {
  padding: '4px 11px',
  background: 'transparent',
  border: '1px solid rgba(83,74,183,.3)',
  borderRadius: '20px', color: 'rgba(175,169,236,.8)', fontSize: '11px',
  cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
}
