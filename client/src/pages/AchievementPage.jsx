import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgressStore } from '../store/progressStore.js'
import { useUserStore } from '../store/userStore.js'
import { LEVELS, LEVEL_ORDER } from '../data/levels.js'
import Icon from '../components/Icon.jsx'

export default function AchievementPage() {
  const navigate = useNavigate()
  const user = useUserStore((state) => state.user)
  const { badges, scientists, stars } = useProgressStore()

  const totalLevels = LEVEL_ORDER.length
  const completedLevels = badges.length
  const totalScientists = 13
  const unlockedScientists = scientists.length

  return (
    <div className="page-container">
      <div className="stars-bg" />
      <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
        <button className="btn-ghost" onClick={() => navigate('/map')} style={{ marginBottom: '1rem' }}>
          ← 返回星图
        </button>

        <h1 style={{
          fontFamily: 'var(--font-english)',
          fontSize: '1.4rem',
          textAlign: 'center',
          marginBottom: '0.5rem',
          color: 'var(--purple-300)'
        }}>
          ACHIEVEMENTS
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {user?.name} 的探索成就
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Icon name="star" size={32} color="#EF9F27" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--font-english)' }}>{stars}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>总星分</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Icon name="trophy" size={32} color="var(--teal-400)" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--teal-400)', fontFamily: 'var(--font-english)' }}>
              {completedLevels}/{totalLevels}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>关卡通关</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Icon name="telescope" size={32} color="var(--blue-400)" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--blue-400)', fontFamily: 'var(--font-english)' }}>
              {unlockedScientists}/{totalScientists}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>科学家解锁</div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            关卡徽章
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {LEVEL_ORDER.map((levelId) => {
              const level = LEVELS[levelId]
              const completed = badges.includes(levelId)
              return (
                <div key={levelId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '10px',
                  background: completed ? `${level.color}0d` : 'transparent',
                  border: `1px solid ${completed ? level.color + '33' : 'var(--card-border)'}`,
                }}>
                  <span style={{ opacity: completed ? 1 : 0.3, display: 'flex', alignItems: 'center' }}>
                    {completed
                      ? <Icon name="medal" size={22} color={level.color} />
                      : <Icon name="circle-empty" size={22} color="var(--text-muted)" />
                    }
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: completed ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}>
                      {level.title}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {level.themeLabel} · Lv{level.level}
                    </p>
                  </div>
                  {completed && (
                    <span style={{ fontSize: '0.75rem', color: level.color, fontWeight: 600 }}>已通关</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {completedLevels === totalLevels && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button className="btn-primary" onClick={() => navigate('/certificate')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="graduation" size={16} color="currentColor" />
              领取结业证书
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
