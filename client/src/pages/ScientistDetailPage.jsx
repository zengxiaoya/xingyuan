import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SCIENTISTS } from '../data/scientists.js'
import { LEVELS } from '../data/levels.js'
import Icon from '../components/Icon.jsx'
import { useNovaStore } from '../store/novaStore.js'

export default function ScientistDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  
  const { openNova } = useNovaStore()
  const scientist = SCIENTISTS[id]
  const unlockedLevel = LEVELS[scientist?.levelId]

  if (!scientist) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <Icon name="question" size={64} color="var(--text-muted)" />
        <h2 style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
          未找到该科学家
        </h2>
        <button className="btn-primary" onClick={() => navigate('/hall')}>
          返回名人堂
        </button>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="stars-bg" />
      <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        {/* 返回按钮 */}
        <button 
          className="btn-ghost" 
          onClick={() => navigate('/hall')}
          style={{ marginBottom: '1.5rem' }}
        >
          ← 返回名人堂
        </button>

        {/* 科学家详情卡片 */}
        <div className="card" style={{
          background: 'rgba(38, 33, 92, 0.95)',
          backdropFilter: 'blur(16px)',
          overflow: 'hidden'
        }}>
          {/* 顶部横幅 - 使用科学家主题色 */}
          <div style={{
            height: '8rem',
            background: `linear-gradient(135deg, ${scientist.color}44 0%, ${scientist.color}22 100%)`,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 50%, transparent 0%, rgba(4,2,15,0.8) 100%)'
            }} />
          </div>

          <div style={{ padding: '0 2rem 2rem', marginTop: '-5rem' }}>
            {/* 头像 */}
            <div style={{
              position: 'relative',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: 'rgba(26, 16, 64, 0.9)',
                border: `4px solid ${scientist.color}`,
                overflow: 'hidden',
                boxShadow: `0 8px 32px ${scientist.color}44`,
                margin: '0 auto',
                position: 'relative',
              }}>
                {scientist.image ? (
                  <img
                    src={scientist.image}
                    alt={scientist.name}
                    onError={() => setImageError(true)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${scientist.color}33, ${scientist.color}11)`,
                    fontSize: '4rem',
                  }}>
                    {scientist.emoji}
                  </div>
                )}
              </div>
              
              {/* 新手标 - 仅在第一次解锁时显示 */}
              <div style={{
                position: 'absolute',
                top: '0',
                right: 'calc(50% - 90px)',
                background: 'linear-gradient(135deg, #EF9F27, #FFA726)',
                color: '#fff',
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(239, 159, 39, 0.4)'
              }}>
                NEW
              </div>
            </div>

            {/* 基本信息 */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#EEEDFE',
                marginBottom: '0.3rem'
              }}>
                {scientist.name}
              </h1>
              <p style={{
                fontSize: '1.1rem',
                color: scientist.color,
                fontWeight: 500,
                marginBottom: '0.5rem'
              }}>
                {scientist.nameEn}
              </p>
              <p style={{
                fontSize: '0.9rem',
                color: '#AFA9EC',
                marginBottom: '0.5rem'
              }}>
                {scientist.years} · {scientist.nationality}
              </p>
              <div style={{
                display: 'inline-block',
                padding: '0.3rem 0.8rem',
                background: `${scientist.color}22`,
                border: `1px solid ${scientist.color}55`,
                borderRadius: '20px',
                fontSize: '0.85rem',
                color: scientist.color
              }}>
                {scientist.field}
              </div>
            </div>

            {/* 名言 */}
            <div style={{
              background: `${scientist.color}11`,
              borderLeft: `4px solid ${scientist.color}`,
              padding: '1.2rem 1.5rem',
              borderRadius: '0 12px 12px 0',
              marginBottom: '2rem',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                fontSize: '2rem',
                color: `${scientist.color}44`,
                fontFamily: 'Georgia, serif',
                lineHeight: 1
              }}>
                "
              </span>
              <p style={{
                fontSize: '1.05rem',
                color: '#EEEDFE',
                lineHeight: 1.8,
                fontStyle: 'italic',
                fontFamily: 'var(--font-serif)',
                margin: 0,
                paddingLeft: '1.2rem'
              }}>
                {scientist.quote}
              </p>
              <span style={{
                position: 'absolute',
                bottom: '-12px',
                right: '1rem',
                fontSize: '2rem',
                color: `${scientist.color}44`,
                fontFamily: 'Georgia, serif',
                lineHeight: 1
              }}>
                "
              </span>
            </div>

            {/* 主要成就 */}
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.1rem',
                color: '#EEEDFE',
                marginBottom: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Icon name="star" size={20} color="#EF9F27" />
                主要成就
              </h2>
              <p style={{
                color: '#AFA9EC',
                lineHeight: 1.8,
                fontSize: '1rem'
              }}>
                {scientist.achievement}
              </p>
            </section>

            {/* 有趣的故事 */}
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.1rem',
                color: '#EEEDFE',
                marginBottom: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Icon name="lightbulb" size={20} color="#FFA726" />
                有趣的故事
              </h2>
              <p style={{
                color: '#AFA9EC',
                lineHeight: 1.8,
                fontSize: '1rem'
              }}>
                {scientist.fun}
              </p>
            </section>

            {/* 解锁关卡信息 */}
            <section style={{
              background: 'rgba(127, 119, 221, 0.1)',
              border: '1px solid rgba(127, 119, 221, 0.3)',
              borderRadius: '12px',
              padding: '1.2rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1rem',
                color: '#EEEDFE',
                marginBottom: '0.8rem'
              }}>
                解锁关卡
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `2px solid ${unlockedLevel?.color || 'rgba(127,119,221,0.5)'}`,
                  flexShrink: 0
                }}>
                  {unlockedLevel?.planetImage
                    ? <img src={unlockedLevel.planetImage} alt={unlockedLevel.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, rgba(127,119,221,0.3), rgba(127,119,221,0.1))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}>🌟</div>
                  }
                </div>
                <div>
                  <p style={{
                    color: '#EEEDFE',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    marginBottom: '0.2rem'
                  }}>
                    {unlockedLevel?.title}
                  </p>
                  <p style={{
                    color: '#534AB7',
                    fontSize: '0.9rem'
                  }}>
                    {unlockedLevel?.theme} · Lv{unlockedLevel?.lv}
                  </p>
                </div>
              </div>
            </section>

            {/* 问 NOVA 按钮 */}
            <button
              onClick={() => openNova({
                type: 'scientist',
                id,
                quickReplies: [
                  `${scientist.name}最重要的发现是什么？`,
                  `${scientist.name}的研究对现代科学有什么影响？`,
                  `给我讲一个关于${scientist.name}的有趣故事`
                ]
              })}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #7F77DD, #6B5FD0)',
                border: 'none',
                borderRadius: '12px',
                color: '#EEEDFE',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(127, 119, 221, 0.4)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(127, 119, 221, 0.5)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(127, 119, 221, 0.4)'
              }}
            >
              <Icon name="chat" size={20} color="#fff" />
              问 NOVA：{scientist.name}的故事
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
