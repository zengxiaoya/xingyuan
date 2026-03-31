import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { useUserStore } from '../store/userStore.js'
import { useProgressStore } from '../store/progressStore.js'
import { generateCertificateEvaluation } from '../utils/api.js'
import { LEVEL_ORDER } from '../data/levels.js'

const TOTAL_LEVELS = LEVEL_ORDER.length
const GOLD = '#C9A84C'

/* ── Corner ornament ─────────────────────────────────────────────────────── */
function CornerOrnament({ rotate = 0 }) {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none"
      style={{ display: 'block', transform: `rotate(${rotate}deg)` }}>
      <path d="M3 53L3 3L53 3" stroke={GOLD} strokeWidth="2.2" strokeLinecap="square"/>
      <path d="M10 53L10 10L53 10" stroke={GOLD} strokeWidth="0.8" strokeOpacity="0.4"/>
      <rect x="1.5" y="1.5" width="4.5" height="4.5" fill={GOLD}/>
      <circle cx="3" cy="23" r="1.5" fill={GOLD} fillOpacity="0.5"/>
      <circle cx="23" cy="3" r="1.5" fill={GOLD} fillOpacity="0.5"/>
    </svg>
  )
}

/* ── Gold divider with star ──────────────────────────────────────────────── */
function Divider() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'1.5rem 0' }}>
      <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg, transparent, ${GOLD}55)` }}/>
      <svg width="13" height="13" viewBox="0 0 13 13">
        <path d="M6.5 0L7.9 5L13 6.5L7.9 8L6.5 13L5.1 8L0 6.5L5.1 5Z" fill={GOLD}/>
      </svg>
      <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg, ${GOLD}55, transparent)` }}/>
    </div>
  )
}

/* ── Official seal ───────────────────────────────────────────────────────── */
function OfficialSeal({ size = 94 }) {
  const cx = size / 2, cy = size / 2
  const r = size * 0.44
  const tr = r - 9
  const id = `seal-arc-${size}`
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity: 0.82 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={GOLD} strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke={GOLD} strokeWidth="0.5" strokeOpacity="0.38"/>
      <defs>
        <path id={id} d={`M ${cx - tr} ${cy} A ${tr} ${tr} 0 0 1 ${cx + tr} ${cy}`}/>
      </defs>
      <text fontSize="5.5" fill={GOLD} fontFamily="'Orbitron', monospace" letterSpacing="1.6">
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">XINGYUAN SPACE ACADEMY</textPath>
      </text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="20" fill={GOLD}>✦</text>
      <text x={cx} y={cy + 19} textAnchor="middle" fontSize="6.5" fill={GOLD}
        fontFamily="'PingFang SC', 'Microsoft YaHei', sans-serif" letterSpacing="1.5">
        星渊宇宙学院
      </text>
      <line x1={cx - 18} y1={cy + 25} x2={cx + 18} y2={cy + 25} stroke={GOLD} strokeWidth="0.5" strokeOpacity="0.45"/>
    </svg>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function CertificatePage() {
  const navigate = useNavigate()
  const user = useUserStore(s => s.user)
  const { stars, badges, scientists, novaEvaluation, setNovaEvaluation } = useProgressStore()
  const certRef = useRef(null)

  const [lang, setLang] = useState('cn')
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const completedLevels = badges.length
  const isGraduated = completedLevels === TOTAL_LEVELS
  const isCN = lang === 'cn'

  const today = new Date()
  const dateCN = today.toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric' })
  const dateEN = today.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })

  useEffect(() => {
    if (!isGraduated || novaEvaluation) return
    setGenerating(true)
    generateCertificateEvaluation({ name: user?.name, school: user?.school, grade: user?.grade, class_name: user?.class_name })
      .then(({ evaluation }) => { if (evaluation) setNovaEvaluation(evaluation) })
      .catch(() => setNovaEvaluation(
        `${user?.name}，你用好奇心照亮了每一颗星球！NOVA 为你骄傲，愿你的未来像宇宙一样无边无际！`
      ))
      .finally(() => setGenerating(false))
  }, [isGraduated, novaEvaluation, user?.name, user?.school, user?.grade, user?.class_name])

  async function handleDownload() {
    if (!certRef.current || downloading) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#08051a',
        logging: false,
        imageTimeout: 0,
      })
      const link = document.createElement('a')
      link.download = `星渊证书_${user?.name || 'certificate'}_${lang.toUpperCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('下载失败', e)
    } finally {
      setDownloading(false)
    }
  }

  // ── Bilingual content ──────────────────────────────────────────────────
  const certTitle    = isGraduated
    ? (isCN ? '结　业　证　书' : 'CERTIFICATE OF COMPLETION')
    : (isCN ? '学习参与证明'   : 'CERTIFICATE OF PARTICIPATION')
  const certSub      = isGraduated
    ? (isCN ? 'CERTIFICATE OF COMPLETION' : '结业证书')
    : (isCN ? 'CERTIFICATE OF PARTICIPATION' : '学习参与证明')
  const preamble     = isCN ? '兹　证　明' : 'This is to certify that'
  const bodyText     = isGraduated
    ? (isCN
        ? `已圆满完成星渊宇宙探索学习平台全部 ${TOTAL_LEVELS} 门课程，解锁 ${badges.length} 个关卡徽章，结识 ${scientists.length} 位科学巨匠，累计获得 ${stars} 星分。`
        : `has successfully completed all ${TOTAL_LEVELS} courses in the Xingyuan Cosmic Exploration Program, unlocking ${badges.length} achievement badges, discovering ${scientists.length} legendary scientists, and earning ${stars} stellar points.`)
    : (isCN
        ? `正在星渊宇宙探索学习平台探索宇宙奥秘，已完成 ${completedLevels} / ${TOTAL_LEVELS} 个关卡，结识 ${scientists.length} 位科学家，累计获得 ${stars} 星分，探索之旅仍在继续。`
        : `is actively exploring the Xingyuan Space Academy, having completed ${completedLevels} of ${TOTAL_LEVELS} courses, befriended ${scientists.length} scientists, and earned ${stars} stellar points. The journey continues.`)
  const novaLabel    = isCN ? 'NOVA 结业评语' : "NOVA's Evaluation"
  const issuedLabel  = isCN ? '颁　发　于' : 'Issued on'
  const dateStr      = isCN ? dateCN : dateEN
  const directorLbl  = isCN ? 'AI 学院导师' : 'AI Academy Director'
  const progressNote = isCN
    ? `继续探索，还差 ${TOTAL_LEVELS - completedLevels} 个关卡即可解锁结业证书`
    : `Complete ${TOTAL_LEVELS - completedLevels} more course${TOTAL_LEVELS - completedLevels !== 1 ? 's' : ''} to unlock the Certificate of Completion`
  const statLabels   = isCN
    ? ['关卡通关', '科学家', '星分']
    : ['Levels', 'Scientists', 'Stars']

  const accent = isGraduated ? GOLD : '#9d98e8'
  const certBg = isGraduated
    ? 'linear-gradient(160deg, #130c24 0%, #0e0a1a 45%, #140b22 100%)'
    : 'linear-gradient(160deg, #0b0a20 0%, #090816 50%, #0c0920 100%)'

  return (
    <div className="page-container">
      <div className="stars-bg"/>
      <div style={{ position:'relative', zIndex:1, padding:'1.5rem', maxWidth:'720px', margin:'0 auto' }}>

        {/* ── Action bar ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
          <button className="btn-ghost" onClick={() => navigate('/achievement')}>← 返回成就</button>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            {/* Language toggle */}
            <div style={{ display:'flex', borderRadius:'6px', overflow:'hidden', border:`1px solid ${accent}44` }}>
              {(['cn','en']).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding:'0.3rem 0.9rem', fontSize:'0.78rem', fontWeight:700,
                  fontFamily:"'Orbitron', sans-serif", letterSpacing:'0.05em',
                  background: lang === l ? `${accent}22` : 'transparent',
                  color: lang === l ? accent : 'var(--text-muted)',
                  border:'none', cursor:'pointer', transition:'all 0.2s'
                }}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={handleDownload} disabled={downloading}
              className="btn-primary"
              style={{ fontSize:'0.82rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
              {downloading ? '生成中...' : '⬇ 下载证书'}
            </button>
            <button onClick={() => window.print()}
              className="btn-secondary"
              style={{ fontSize:'0.82rem' }}>
              🖨 打印
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════
            CERTIFICATE
        ═══════════════════════════════════ */}
        <div ref={certRef} id="certificate-content" style={{
          background: certBg,
          border: `2px solid ${accent}`,
          borderRadius: '3px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Watermark */}
          <div style={{
            position:'absolute', inset:0, display:'flex',
            alignItems:'center', justifyContent:'center',
            pointerEvents:'none', overflow:'hidden', zIndex:0
          }}>
            <span style={{
              fontFamily:"'Orbitron', sans-serif",
              fontSize:'9rem', fontWeight:900, color: accent,
              opacity: 0.024, transform:'rotate(-30deg)',
              whiteSpace:'nowrap', userSelect:'none',
              letterSpacing:'0.2em'
            }}>
              XINGYUAN
            </span>
          </div>

          {/* Corner ornaments */}
          <div style={{ position:'absolute', top:0, left:0, zIndex:2 }}><CornerOrnament rotate={0}/></div>
          <div style={{ position:'absolute', top:0, right:0, zIndex:2 }}><CornerOrnament rotate={90}/></div>
          <div style={{ position:'absolute', bottom:0, right:0, zIndex:2 }}><CornerOrnament rotate={180}/></div>
          <div style={{ position:'absolute', bottom:0, left:0, zIndex:2 }}><CornerOrnament rotate={270}/></div>

          {/* Inner border */}
          <div style={{
            position:'absolute', inset:'13px',
            border:`1px solid ${accent}35`, borderRadius:'1px',
            pointerEvents:'none', zIndex:2
          }}/>

          {/* Body */}
          <div style={{ position:'relative', zIndex:1, padding:'2.75rem 3.5rem', textAlign:'center' }}>

            {/* Academy identity */}
            <p style={{
              fontFamily:"'Orbitron', sans-serif", fontSize:'0.62rem',
              letterSpacing:'0.45em', color: accent, opacity:0.65, marginBottom:'0.5rem'
            }}>
              XINGYUAN · 星 渊
            </p>
            <p style={{
              fontFamily:"'Orbitron', sans-serif", fontSize:'0.82rem',
              letterSpacing:'0.22em', color: accent, fontWeight:700, marginBottom:'0.2rem'
            }}>
              XINGYUAN SPACE ACADEMY
            </p>
            <p style={{
              fontFamily:"'Noto Serif SC', serif", fontSize:'0.72rem',
              letterSpacing:'0.45em', color: accent, opacity:0.65
            }}>
              星　渊　宇　宙　学　院
            </p>

            <Divider/>

            {/* Certificate type */}
            <p style={{
              fontFamily: isCN ? "'Noto Serif SC', serif" : "'Orbitron', sans-serif",
              fontSize: isCN ? '1.65rem' : '1.1rem',
              fontWeight: 700, letterSpacing: isCN ? '0.55em' : '0.12em',
              color: '#EEEDFE', marginBottom:'0.35rem', lineHeight:1.25,
              textShadow: `0 0 50px ${accent}44`
            }}>
              {certTitle}
            </p>
            <p style={{
              fontFamily: isCN ? "'Orbitron', sans-serif" : "'Noto Serif SC', serif",
              fontSize:'0.7rem', letterSpacing: isCN ? '0.12em' : '0.35em',
              color: accent, opacity:0.6, marginBottom:'1.75rem'
            }}>
              {certSub}
            </p>

            {/* Preamble */}
            <p style={{
              fontSize:'0.82rem', color:'#AFA9EC', marginBottom:'0.65rem',
              letterSpacing: isCN ? '0.35em' : '0.04em',
              fontStyle: isCN ? 'normal' : 'italic',
              fontFamily: isCN ? "'Noto Serif SC', serif" : 'inherit'
            }}>
              {preamble}
            </p>

            {/* Student name */}
            <p style={{
              fontFamily:"'Noto Serif SC', serif",
              fontSize:'2.4rem', fontWeight:700,
              color:'#EEEDFE', marginBottom:'0.4rem',
              letterSpacing:'0.12em',
              textShadow:'0 2px 24px rgba(238,237,254,0.28)'
            }}>
              {user?.name}
            </p>
            {user?.grade && (
              <p style={{
                fontSize:'0.78rem', color:'#6b66b0',
                letterSpacing:'0.1em', marginBottom:'1.4rem'
              }}>
                {user.grade}{user.school ? ` · ${user.school}` : ''}
              </p>
            )}

            {/* Achievement text */}
            <p style={{
              fontSize:'0.875rem', color:'#AFA9EC', lineHeight:1.95,
              maxWidth:'480px', margin:'0 auto 1.4rem',
              fontFamily: isCN ? "'Noto Serif SC', serif" : 'inherit'
            }}>
              {bodyText}
            </p>

            {/* Stats */}
            <div style={{ display:'flex', justifyContent:'center', gap:'2.5rem', marginBottom:'1.5rem' }}>
              {[
                { v: badges.length,    l: statLabels[0] },
                { v: scientists.length, l: statLabels[1] },
                { v: stars,             l: statLabels[2] },
              ].map(({ v, l }) => (
                <div key={l} style={{ textAlign:'center' }}>
                  <div style={{
                    fontFamily:"'Orbitron', sans-serif", fontSize:'1.4rem',
                    fontWeight:700, color: accent, lineHeight:1
                  }}>{v}</div>
                  <div style={{
                    fontSize:'0.65rem', color:'#6b66b0',
                    letterSpacing:'0.12em', marginTop:'0.3rem',
                    textTransform:'uppercase'
                  }}>{l}</div>
                </div>
              ))}
            </div>

            {/* NOVA evaluation */}
            {isGraduated && (
              <div style={{
                margin:'0 auto 1.75rem', maxWidth:'460px',
                padding:'1rem 1.3rem',
                background:`${accent}0c`,
                border:`1px solid ${accent}2a`,
                borderRadius:'2px',
              }}>
                <p style={{
                  fontSize:'0.62rem', color: accent, opacity:0.8,
                  letterSpacing:'0.25em', marginBottom:'0.6rem',
                  fontFamily:"'Orbitron', sans-serif"
                }}>
                  ✦　{novaLabel}　✦
                </p>
                {generating || !novaEvaluation ? (
                  <p style={{ color:'#6b66b0', fontStyle:'italic', fontSize:'0.82rem' }}>
                    {isCN ? 'NOVA 正在撰写评语...' : 'NOVA is writing your evaluation...'}
                  </p>
                ) : (
                  <p style={{
                    color:'#AFA9EC', fontSize:'0.85rem', lineHeight:1.9,
                    fontStyle:'italic',
                    fontFamily: isCN ? "'Noto Serif SC', serif" : 'inherit'
                  }}>
                    "{novaEvaluation}"
                  </p>
                )}
              </div>
            )}

            {/* Not graduated progress note */}
            {!isGraduated && (
              <div style={{
                margin:'0 auto 1.75rem', maxWidth:'380px',
                padding:'0.55rem 1rem',
                border:`1px solid ${accent}22`,
                fontSize:'0.78rem', color:'#6b66b0',
                letterSpacing:'0.04em', lineHeight:1.6
              }}>
                {progressNote}
              </div>
            )}

            <Divider/>

            {/* Footer: Seal · Motto · Signature */}
            <div style={{
              display:'flex', alignItems:'flex-end',
              justifyContent:'space-between', gap:'1rem'
            }}>
              {/* Seal */}
              <OfficialSeal size={94}/>

              {/* Motto */}
              <div style={{ flex:1, textAlign:'center', paddingBottom:'0.5rem' }}>
                <p style={{
                  fontFamily:"'Orbitron', sans-serif",
                  fontSize:'0.58rem', letterSpacing:'0.22em',
                  color: accent, opacity:0.38, lineHeight:2.2
                }}>
                  PER ASPERA AD ASTRA
                </p>
                <p style={{
                  fontFamily:"'Noto Serif SC', serif",
                  fontSize:'0.6rem', letterSpacing:'0.22em',
                  color: accent, opacity:0.32
                }}>
                  历尽艰辛，抵达群星
                </p>
              </div>

              {/* Date + signature */}
              <div style={{ textAlign:'right', minWidth:'130px', paddingBottom:'0.25rem' }}>
                <p style={{ fontSize:'0.68rem', color:'#6b66b0', marginBottom:'0.2rem', letterSpacing:'0.06em' }}>
                  {issuedLabel}
                </p>
                <p style={{ fontSize:'0.8rem', color:'#AFA9EC', fontWeight:600, marginBottom:'1rem' }}>
                  {dateStr}
                </p>
                <div style={{ height:'1px', background:`${accent}48`, marginBottom:'0.3rem' }}/>
                <p style={{ fontSize:'0.72rem', color: accent, letterSpacing:'0.12em', fontFamily:"'Orbitron', sans-serif" }}>
                  NOVA
                </p>
                <p style={{ fontSize:'0.6rem', color:'#6b66b0', letterSpacing:'0.06em', marginTop:'0.15rem' }}>
                  {directorLbl}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Back */}
        <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/map')}>返回星图</button>
        </div>
      </div>
    </div>
  )
}
