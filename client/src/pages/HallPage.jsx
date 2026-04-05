import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgressStore } from '../store/progressStore.js'
import { SCIENTISTS, SCIENTIST_ORDER } from '../data/scientists.js'
import Icon from '../components/Icon.jsx'

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 600)
  React.useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return isMobile
}

function ScientistAvatar({ scientist }) {
  const [imgError, setImgError] = useState(false)
  if (scientist.image && !imgError) {
    return (
      <img
        src={scientist.image}
        alt={scientist.name}
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          objectFit: 'cover',
          border: `2px solid ${scientist.color}66`
        }}
        onError={() => setImgError(true)}
      />
    )
  }
  return <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>{scientist.emoji}</span>
}

export default function HallPage() {
  const navigate = useNavigate()
  const { scientists: unlockedIds } = useProgressStore()
  const m = useIsMobile()

  return (
    <div className="page-container">
      <div className="stars-bg" />
      <div style={{ position: 'relative', zIndex: 1, padding: m ? '1rem 0.75rem' : '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
        <button className="btn-ghost" onClick={() => navigate('/map')} style={{ marginBottom: '1rem' }}>
          ← 返回星图
        </button>

        <h1 style={{
          fontFamily: 'var(--font-english)',
          fontSize: m ? '1.15rem' : '1.4rem',
          textAlign: 'center',
          marginBottom: '0.5rem',
          color: 'var(--purple-300)'
        }}>
          HALL OF FAME
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          完成关卡，解锁科学家卡片
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${m ? '140px' : '200px'}, 1fr))`,
          gap: m ? '0.7rem' : '1rem'
        }}>
          {SCIENTIST_ORDER.map((id) => {
            const scientist = SCIENTISTS[id]
            const unlocked = unlockedIds.includes(id)

            return (
              <div
                key={id}
                className="card"
                onClick={() => unlocked && navigate(`/scientist/${id}`)}
                style={{
                  opacity: unlocked ? 1 : 0.4,
                  filter: unlocked ? 'none' : 'grayscale(1)',
                  border: unlocked ? `1px solid ${scientist.color}44` : '1px solid var(--card-border)',
                  textAlign: 'center',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  ...(unlocked ? {
                    ':hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${scientist.color}33`,
                      borderColor: `${scientist.color}88`
                    }
                  } : {})
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  {unlocked
                    ? <ScientistAvatar scientist={scientist} />
                    : <Icon name="question" size={40} color="var(--text-muted)" />
                  }
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  {unlocked ? scientist.name : '???'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {unlocked ? scientist.nameEn : '完成关卡解锁'}
                </p>
                {unlocked && (
                  <>
                    <p style={{ fontSize: '0.75rem', color: scientist.color, marginBottom: '0.5rem' }}>
                      {scientist.years} · {scientist.nationality}
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                      fontFamily: 'var(--font-serif)',
                      borderTop: '1px solid var(--card-border)',
                      paddingTop: '0.5rem',
                      marginTop: '0.5rem',
                      lineHeight: 1.6
                    }}>
                      "{scientist.quote}"
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
