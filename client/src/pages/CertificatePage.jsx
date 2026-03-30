import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore.js'
import { useProgressStore } from '../store/progressStore.js'
import Icon from '../components/Icon.jsx'

export default function CertificatePage() {
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)
  const { stars, badges, scientists } = useProgressStore()
  const certRef = useRef(null)

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="page-container">
      <div className="stars-bg" />
      <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
        <button className="btn-ghost" onClick={() => navigate('/achievement')} style={{ marginBottom: '1rem' }}>
          ← 返回成就
        </button>

        <div
          ref={certRef}
          className="card fade-in"
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            border: '2px solid rgba(212, 160, 23, 0.5)',
            background: 'linear-gradient(135deg, rgba(20, 10, 50, 0.95), rgba(40, 20, 80, 0.9))',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            inset: '0.75rem',
            border: '1px solid rgba(212, 160, 23, 0.25)',
            borderRadius: '14px',
            pointerEvents: 'none'
          }} />

          <div className="float-animation" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Icon name="galaxy" size={56} color="#AFA9EC" />
          </div>

          <p style={{
            fontFamily: 'var(--font-english)',
            fontSize: '0.8rem',
            letterSpacing: '0.3em',
            color: 'var(--text-muted)',
            marginBottom: '1rem'
          }}>
            XINGYUAN SPACE ACADEMY
          </p>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.8rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, var(--gold-start), #f0c040, var(--gold-start))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            宇宙探索结业证书
          </h1>

          <div style={{ width: '60px', height: '2px', background: 'rgba(212, 160, 23, 0.5)', margin: '1rem auto' }} />

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            兹证明
          </p>
          <p style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            {user?.name}
          </p>
          {user?.grade && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {user.grade}{user.school ? ` · ${user.school}` : ''}
            </p>
          )}

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
            已圆满完成星渊宇宙探索学习平台全部课程，<br />
            解锁了 <strong style={{ color: 'var(--amber)' }}>{badges.length}</strong> 个关卡徽章，
            结识了 <strong style={{ color: 'var(--purple-300)' }}>{scientists.length}</strong> 位科学巨匠，<br />
            累计获得 <strong style={{ color: 'var(--amber)', display: 'inline-flex', alignItems: 'center', gap: '3px', verticalAlign: 'middle' }}>
              <Icon name="star" size={14} color="var(--amber)" />{stars}
            </strong> 星分。
          </p>

          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0.75rem 2rem',
            background: 'rgba(212, 160, 23, 0.1)',
            border: '1px solid rgba(212, 160, 23, 0.3)',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>颁发于</p>
            <p style={{ color: 'var(--amber)', fontWeight: 600 }}>{today}</p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            marginTop: '0.5rem',
            opacity: 0.6,
          }}>
            <Icon name="rocket" size={24} color="#AFA9EC" />
            <Icon name="moon" size={24} color="#AFA9EC" />
            <Icon name="star" size={24} color="#EF9F27" />
            <Icon name="galaxy" size={24} color="#AFA9EC" />
            <Icon name="telescope" size={24} color="#AFA9EC" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => window.print()}>
            打印证书
          </button>
          <button className="btn-secondary" onClick={() => navigate('/map')}>
            返回星图
          </button>
        </div>
      </div>
    </div>
  )
}
