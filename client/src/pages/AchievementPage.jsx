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
  const completionPercent = Math.round((completedLevels / totalLevels) * 100)

  return (
    <div className="page-container">
      <div className="stars-bg" />
      <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
        <button className="btn-ghost" onClick={() => navigate('/map')} style={{ marginBottom: '1rem' }}>
          ← 返回星图
        </button>

        <div className="glass-panel fade-in" style={{ padding: '1.5rem', marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div className="cosmic-chip" style={{ marginBottom: '0.8rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal-400)', boxShadow: '0 0 10px rgba(29,158,117,.5)' }} />
                探索档案已同步
              </div>
              <h1 style={{
                fontFamily: 'var(--font-english)',
                fontSize: '1.5rem',
                marginBottom: '0.4rem',
                color: 'var(--purple-300)',
                letterSpacing: '0.06em'
              }}>
                ACHIEVEMENTS
              </h1>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px' }}>
                {user?.name} 的宇宙探索旅程正在持续发光，已经完成 {completedLevels} 个关卡，整体进度达到 {completionPercent}%。
              </p>
            </div>

            <div style={{
              minWidth: '150px',
              padding: '0.9rem 1rem',
              borderRadius: '18px',
              background: 'linear-gradient(145deg, rgba(127,119,221,.16), rgba(79,195,247,.08))',
              border: '1px solid rgba(127,119,221,.25)',
              boxShadow: '0 14px 30px rgba(10,8,35,.32)',
            }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>当前称号</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {completedLevels === totalLevels ? '星渊毕业生' : completedLevels >= 6 ? '深空探险家' : completedLevels >= 3 ? '轨道观察员' : '启程新船员'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--purple-300)' }}>
                {stars} 星分已点亮
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>结业进度</span>
              <span style={{ color: 'var(--purple-300)', fontFamily: 'var(--font-english)' }}>{completionPercent}%</span>
            </div>
            <div className="progress-strip">
              <span style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card stat-card fade-in" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Icon name="star" size={32} color="#EF9F27" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--font-english)' }}>{stars}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>总星分</div>
          </div>
          <div className="card stat-card fade-in" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Icon name="trophy" size={32} color="var(--teal-400)" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--teal-400)', fontFamily: 'var(--font-english)' }}>
              {completedLevels}/{totalLevels}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>关卡通关</div>
          </div>
          <div className="card stat-card fade-in" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <Icon name="telescope" size={32} color="var(--blue-400)" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--blue-400)', fontFamily: 'var(--font-english)' }}>
              {unlockedScientists}/{totalScientists}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>科学家解锁</div>
          </div>
        </div>

        <div className="card fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              关卡徽章
            </h2>
            <div className="cosmic-chip">
              已解锁科学家 {unlockedScientists}/{totalScientists}
            </div>
          </div>
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

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="btn-primary" onClick={() => navigate('/certificate')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: completedLevels === totalLevels ? undefined : 'rgba(127,119,221,0.15)',
              borderColor: completedLevels === totalLevels ? undefined : 'rgba(127,119,221,0.4)',
              color: completedLevels === totalLevels ? undefined : 'var(--purple-300)'
            }}>
            <Icon name="graduation" size={16} color="currentColor" />
            {completedLevels === totalLevels ? '领取结业证书 🎓' : '查看我的证书'}
          </button>
        </div>
      </div>
    </div>
  )
}
