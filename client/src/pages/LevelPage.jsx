import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LEVELS } from '../data/levels.js'
import { SCIENTISTS } from '../data/scientists.js'
import { PLANET_FACTS } from '../data/planetFacts.js'
import { useProgressStore } from '../store/progressStore.js'
import { useNovaStore } from '../store/novaStore.js'
import { fetchQuiz, evaluateAnswer } from '../utils/api.js'
import Icon from '../components/Icon.jsx'

// 阶段：intro → learn → q1_load → q1 → q1_feedback → q2_load → q2 → q2_feedback → q3 → q3_feedback → complete
const PHASES = {
  INTRO: 'intro',
  LEARN: 'learn',
  LOADING: 'loading',
  Q1: 'q1',           // 选择题
  Q1_FB: 'q1_fb',     // 选择题反馈
  Q2: 'q2',           // 猜谜题
  Q2_FB: 'q2_fb',     // 猜谜题反馈
  Q3: 'q3',           // 创意题
  Q3_FB: 'q3_fb',     // 创意题反馈
  COMPLETE: 'complete'
}

export default function LevelPage() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const level = LEVELS[levelId]
  const facts = PLANET_FACTS[levelId] || []
  const { isLevelUnlocked, completeLevel, isLevelCompleted, saveCreativeAnswer } = useProgressStore()
  const openNova = useNovaStore((state) => state.openNova)

  const [phase, setPhase] = useState(PHASES.INTRO)
  const [q1, setQ1] = useState(null)         // 选择题数据
  const [q2, setQ2] = useState(null)         // 猜谜题数据
  const [q3, setQ3] = useState(null)         // 创意题数据
  const [factIndex, setFactIndex] = useState(0)
  const [learnIndex, setLearnIndex] = useState(0)

  // 选择题状态
  const [q1Attempt, setQ1Attempt] = useState(0)   // 尝试次数
  const [q1Selected, setQ1Selected] = useState(null)
  const [q1Result, setQ1Result] = useState(null)   // 'correct' | 'wrong'
  const [q1Stars, setQ1Stars] = useState(0)

  // 猜谜题状态
  const [q2Input, setQ2Input] = useState('')
  const [q2Hints, setQ2Hints] = useState(0)        // 已使用提示次数
  const [q2Result, setQ2Result] = useState(null)   // { correct, feedback }
  const [q2Stars, setQ2Stars] = useState(0)
  const [q2Evaluating, setQ2Evaluating] = useState(false)

  // 创意题状态
  const [q3Input, setQ3Input] = useState('')
  const [q3Feedback, setQ3Feedback] = useState('')
  const [q3Evaluating, setQ3Evaluating] = useState(false)

  // 全屏反馈遮罩
  const [overlay, setOverlay] = useState(null) // { type: 'correct'|'wrong'|'creative', text }
  const overlayTimer = useRef(null)

  const totalStars = q1Stars + q2Stars + 10 // q3 固定10分

  const alreadyDone = isLevelCompleted(levelId)

  if (!level || !isLevelUnlocked(levelId)) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>关卡未解锁或不存在</p>
          <button className="btn-primary" onClick={() => navigate('/map')}>返回星图</button>
        </div>
      </div>
    )
  }

  function showOverlay(type, text, duration = 1800) {
    setOverlay({ type, text })
    if (overlayTimer.current) clearTimeout(overlayTimer.current)
    overlayTimer.current = setTimeout(() => setOverlay(null), duration)
  }

  // 加载题目
  async function loadQuestions() {
    setPhase(PHASES.LOADING)
    try {
      const [choice, guess, creative] = await Promise.all([
        fetchQuiz(levelId, 'choice'),
        fetchQuiz(levelId, 'guess'),
        fetchQuiz(levelId, 'creative')
      ])
      setQ1(choice)
      setQ2(guess)
      setQ3(creative)
      setPhase(PHASES.Q1)
    } catch (e) {
      console.error('加载题目失败', e)
      setPhase(PHASES.INTRO)
    }
  }

  // 选择题：选项点击
  function handleQ1Select(idx) {
    if (q1Result === 'correct') return
    setQ1Selected(idx)
  }

  // 选择题：提交
  function handleQ1Submit() {
    if (q1Selected === null) return
    const correct = q1Selected === q1.correctIndex
    const attempt = q1Attempt + 1
    setQ1Attempt(attempt)

    if (correct) {
      const stars = attempt === 1 ? 10 : 5
      setQ1Stars(stars)
      setQ1Result('correct')
      showOverlay('correct', '正确！⭐', 1600)
      setTimeout(() => setPhase(PHASES.Q1_FB), 1700)
    } else {
      setQ1Result('wrong')
      showOverlay('wrong', '再试试！', 1400)
      setTimeout(() => {
        setOverlay(null)
        if (attempt >= 2) {
          // 两次都错，给0分，进入下一题
          setQ1Stars(0)
          setQ1Result('wrong_final')
          setPhase(PHASES.Q1_FB)
        } else {
          setQ1Result(null)
          setQ1Selected(null)
        }
      }, 1500)
    }
  }

  // 猜谜题：提交评估
  async function handleQ2Submit() {
    if (!q2Input.trim() || q2Evaluating) return
    setQ2Evaluating(true)
    try {
      const res = await evaluateAnswer(levelId, q2.riddle, q2Input, 'guess')
      if (res.correct) {
        setQ2Stars(10)
        setQ2Result({ correct: true, feedback: res.feedback })
        showOverlay('correct', '答对了！🎉', 1600)
        setTimeout(() => setPhase(PHASES.Q2_FB), 1700)
      } else {
        setQ2Result({ correct: false, feedback: res.feedback })
        showOverlay('wrong', '想一想...', 1400)
        setTimeout(() => setOverlay(null), 1500)
      }
    } catch {
      setQ2Result({ correct: false, feedback: '网络出了点小问题，再试试？' })
    } finally {
      setQ2Evaluating(false)
    }
  }

  // 猜谜题：放弃（进入下一题，0分）
  function handleQ2Skip() {
    setQ2Stars(0)
    setQ2Result({ correct: false, feedback: '没关系，下次一定！' })
    setPhase(PHASES.Q2_FB)
  }

  // 创意题：提交
  async function handleQ3Submit() {
    if (!q3Input.trim() || q3Evaluating) return
    setQ3Evaluating(true)
    try {
      const res = await evaluateAnswer(levelId, q3.question, q3Input, 'creative')
      setQ3Feedback(res.feedback || '你的想象力真棒！NOVA 很喜欢你的回答！')
      saveCreativeAnswer(levelId, q3Input)
    } catch {
      setQ3Feedback('你的想象力真棒！NOVA 很喜欢你的回答！')
      saveCreativeAnswer(levelId, q3Input)
    } finally {
      setQ3Evaluating(false)
      showOverlay('creative', 'CREATIVE! ✨', 1600)
      setTimeout(() => setPhase(PHASES.Q3_FB), 1700)
    }
  }

  // 通关
  function handleComplete() {
    const earned = q1Stars + q2Stars + 10
    completeLevel(levelId, earned, level.scientists)
    setPhase(PHASES.COMPLETE)
  }

  // 步骤条
  function StepBar() {
    const steps = [PHASES.Q1, PHASES.Q1_FB, PHASES.Q2, PHASES.Q2_FB, PHASES.Q3, PHASES.Q3_FB]
    const stepLabels = ['选择题', '猜谜题', '创意题']
    const stepPhases = [
      [PHASES.Q1, PHASES.Q1_FB],
      [PHASES.Q2, PHASES.Q2_FB],
      [PHASES.Q3, PHASES.Q3_FB]
    ]
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {stepLabels.map((label, i) => {
          const done = stepPhases[i].every(p => {
            const order = [PHASES.Q1, PHASES.Q1_FB, PHASES.Q2, PHASES.Q2_FB, PHASES.Q3, PHASES.Q3_FB, PHASES.COMPLETE]
            return order.indexOf(phase) > order.indexOf(p)
          })
          const active = stepPhases[i].includes(phase)
          return (
            <React.Fragment key={i}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: done ? 'var(--teal-400)' : active ? level.color : 'rgba(100,100,150,0.2)',
                  border: `2px solid ${done ? 'var(--teal-400)' : active ? level.color : 'rgba(100,100,150,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700, color: '#fff',
                  transition: 'all 0.3s'
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.65rem', color: active ? level.color : 'var(--text-muted)' }}>{label}</span>
              </div>
              {i < 2 && (
                <div style={{
                  flex: 1, height: '2px', maxWidth: '60px',
                  background: done ? 'var(--teal-400)' : 'rgba(100,100,150,0.2)',
                  marginBottom: '1.2rem', transition: 'all 0.3s'
                }} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  // 科学家横幅
  function ScientistBanner({ scientistId }) {
    const s = SCIENTISTS[scientistId]
    if (!s) return null
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: `${level.color}10`,
        border: `1px solid ${level.color}30`,
        borderRadius: '12px', marginBottom: '1rem'
      }}>
        <span style={{ fontSize: '1.8rem' }}>{s.emoji}</span>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: level.color }}>{s.name}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>"{s.quote}"</p>
        </div>
      </div>
    )
  }

  // ======= 各阶段渲染 =======

  // 简介页
  if (phase === PHASES.INTRO) {
    return (
      <div className="page-container">
        <div className="stars-bg" />
        <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem', maxWidth: '680px', margin: '0 auto' }}>
          <button className="btn-ghost" onClick={() => navigate('/map')} style={{ marginBottom: '1rem' }}>← 返回星图</button>

          <div className="card fade-in" style={{ marginBottom: '1.5rem', borderColor: `${level.color}44` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: `${level.color}22`, border: `2px solid ${level.color}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', color: level.color, fontFamily: 'var(--font-english)', fontWeight: 700
              }}>
                {level.level}
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: level.color, marginBottom: '0.2rem' }}>{level.themeLabel}</p>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{level.title}</h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{level.subtitle}</p>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8 }}>{level.description}</p>
          </div>

          <div className="card fade-in" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="star" size={14} color="var(--amber)" /> 宇宙冷知识
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {facts.map((fact, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
                  padding: '0.65rem 0.75rem',
                  background: 'rgba(127,119,221,0.05)', borderRadius: '10px',
                  fontSize: '0.85rem', lineHeight: 1.7
                }}>
                  <span style={{ color: level.color, flexShrink: 0 }}>★</span>
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} onClick={() => { setLearnIndex(0); setPhase(PHASES.LEARN) }}>
              <Icon name="rocket" size={15} color="currentColor" />
              开始闯关 ({alreadyDone ? '重玩' : '3 道题'})
            </button>
            <button className="btn-secondary" style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              onClick={() => openNova({ type: 'level', id: levelId })}>
              <Icon name="bot" size={15} color="currentColor" />
              问问 NOVA
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 知识学习页
  if (phase === PHASES.LEARN) {
    const knowledge = level.knowledge || []
    const card = knowledge[learnIndex]
    const isLast = learnIndex === knowledge.length - 1

    if (!card) {
      // No knowledge data, skip straight to loading questions
      loadQuestions()
      return null
    }

    return (
      <div className="page-container">
        <div className="stars-bg" />
        <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem', maxWidth: '680px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <button className="btn-ghost" onClick={() => setPhase(PHASES.INTRO)}>← 返回</button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: level.color, fontWeight: 600 }}>{level.title}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>知识卡片 {learnIndex + 1} / {knowledge.length}</p>
            </div>
            <div style={{ width: '60px' }} />
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.5rem' }}>
            {knowledge.map((_, i) => (
              <div key={i} style={{
                width: i === learnIndex ? '20px' : '8px', height: '8px',
                borderRadius: '4px',
                background: i <= learnIndex ? level.color : 'rgba(127,119,221,.2)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* Knowledge card */}
          <div className="card fade-in" style={{
            marginBottom: '1.5rem',
            borderColor: `${level.color}55`,
            boxShadow: `0 0 30px ${level.color}15`,
            padding: '2rem 1.5rem',
            textAlign: 'center',
          }}>
            {/* Icon */}
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: '1.25rem',
            }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: `${level.color}15`,
                border: `2px solid ${level.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 20px ${level.color}20`,
              }}>
                <Icon name={card.icon} size={48} color={level.color} />
              </div>
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: '1.15rem', fontWeight: 700,
              color: level.color,
              marginBottom: '1rem', lineHeight: 1.4,
            }}>
              {card.title}
            </h2>

            {/* Content */}
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.92rem', lineHeight: 1.85,
              textAlign: 'left',
            }}>
              {card.content}
            </p>
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {learnIndex > 0 && (
              <button
                className="btn-secondary"
                style={{ flex: 1, minWidth: '100px' }}
                onClick={() => setLearnIndex(i => i - 1)}
              >
                ← 上一条
              </button>
            )}
            {!isLast && (
              <button
                className="btn-primary"
                style={{ flex: 2, minWidth: '140px', background: `${level.color}22`, borderColor: `${level.color}66`, color: level.color }}
                onClick={() => setLearnIndex(i => i + 1)}
              >
                下一条 →
              </button>
            )}
            {isLast && (
              <button
                className="btn-primary"
                style={{ flex: 2, minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                onClick={loadQuestions}
              >
                <Icon name="rocket" size={15} color="currentColor" />
                我学会了，开始挑战！
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 加载中
  if (phase === PHASES.LOADING) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="stars-bg" />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="float-animation" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Icon name="orbit" size={56} color="#7F77DD" />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-english)' }}>NOVA 正在准备题目...</p>
        </div>
      </div>
    )
  }

  // 通关页
  if (phase === PHASES.COMPLETE) {
    const earned = q1Stars + q2Stars + 10
    const scientists = level.scientists.map(id => SCIENTISTS[id]).filter(Boolean)
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="stars-bg" />
        <div className="card fade-in" style={{
          position: 'relative', zIndex: 1, maxWidth: '480px', width: '90%', textAlign: 'center',
          borderColor: `${level.color}55`
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Icon name="trophy" size={52} color={level.color} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem', color: level.color }}>
            关卡通关！
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{level.title} 探索完成</p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.5rem', borderRadius: '50px',
            background: 'rgba(239,159,39,0.15)', border: '1px solid rgba(239,159,39,0.4)',
            marginBottom: '1.5rem'
          }}>
            <Icon name="star" size={20} color="#EF9F27" />
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--font-english)' }}>
              +{earned}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>星分</span>
          </div>

          {scientists.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>解锁科学家</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {scientists.map(s => (
                  <div key={s.id} style={{
                    padding: '0.5rem 1rem', borderRadius: '10px',
                    background: `${level.color}15`, border: `1px solid ${level.color}30`,
                    fontSize: '0.85rem'
                  }}>
                    {s.emoji} {s.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => navigate('/map')}>返回星图</button>
            <button className="btn-secondary" onClick={() => navigate('/achievement')}>查看成就</button>
            <button className="btn-secondary" onClick={() => navigate('/certificate')} style={{ borderColor: 'rgba(212,160,23,0.5)', color: '#d4a017' }}>🏆 领取证书</button>
          </div>
        </div>
      </div>
    )
  }

  // 主闯关界面（q1/q1_fb/q2/q2_fb/q3/q3_fb）
  return (
    <div className="page-container">
      <div className="stars-bg" />

      {/* 全屏反馈遮罩 */}
      {overlay && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-english)',
            letterSpacing: '0.05em',
            color: overlay.type === 'correct' ? 'var(--teal-400)'
              : overlay.type === 'creative' ? 'var(--purple-300)'
              : 'var(--danger)',
            animation: 'feedbackPop 0.3s ease',
            textShadow: overlay.type === 'correct'
              ? '0 0 40px rgba(29,158,117,0.8)'
              : overlay.type === 'creative'
              ? '0 0 40px rgba(127,119,221,0.8)'
              : '0 0 30px rgba(224,85,85,0.7)'
          }}>
            {overlay.text}
          </div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, padding: '1rem 1.5rem', maxWidth: '680px', margin: '0 auto' }}>
        {/* 顶部栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button className="btn-ghost" onClick={() => navigate('/map')}>← 星图</button>
          <div style={{ fontFamily: 'var(--font-english)', fontSize: '0.9rem', color: level.color, fontWeight: 600 }}>
            {level.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--amber)', fontWeight: 600 }}>
            <Icon name="star" size={14} color="#EF9F27" /> {q1Stars + q2Stars}
          </div>
        </div>

        <StepBar />

        {/* === 第1题：选择题 === */}
        {(phase === PHASES.Q1 || phase === PHASES.Q1_FB) && q1 && (
          <div className="card fade-in">
            <div style={{
              display: 'inline-block', padding: '0.25rem 0.8rem',
              background: `${level.color}20`, borderRadius: '20px',
              fontSize: '0.75rem', color: level.color, fontWeight: 600, marginBottom: '0.75rem'
            }}>
              第 1 题 · 选择题
            </div>
            <ScientistBanner scientistId={level.scientists[0]} />
            <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.7, marginBottom: '1.2rem' }}>
              {q1.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.2rem' }}>
              {q1.options.map((opt, idx) => {
                let bg = 'rgba(127,119,221,0.06)'
                let border = 'var(--card-border)'
                let color = 'var(--text-primary)'
                if (q1Selected === idx) {
                  bg = `${level.color}18`
                  border = level.color
                }
                if (q1Result === 'correct' || q1Result === 'wrong_final') {
                  if (idx === q1.correctIndex) {
                    bg = 'rgba(29,158,117,0.12)'
                    border = 'var(--teal-400)'
                    color = 'var(--teal-400)'
                  } else if (q1Selected === idx && idx !== q1.correctIndex) {
                    bg = 'rgba(224,85,85,0.1)'
                    border = 'var(--danger)'
                    color = 'var(--danger)'
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => phase === PHASES.Q1 && handleQ1Select(idx)}
                    disabled={q1Result === 'correct' || q1Result === 'wrong_final' || phase === PHASES.Q1_FB}
                    style={{
                      padding: '0.8rem 1rem', textAlign: 'left',
                      background: bg, border: `1.5px solid ${border}`,
                      borderRadius: '12px', color, fontSize: '0.9rem',
                      cursor: q1Result === 'correct' || q1Result === 'wrong_final' ? 'default' : 'pointer',
                      transition: 'all 0.2s', lineHeight: 1.5
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>

            {phase === PHASES.Q1 && q1Result !== 'correct' && q1Result !== 'wrong_final' && (
              <button
                className="btn-primary"
                disabled={q1Selected === null}
                onClick={handleQ1Submit}
                style={{ width: '100%' }}
              >
                确认答案
              </button>
            )}

            {(q1Result === 'correct' || q1Result === 'wrong_final') && phase === PHASES.Q1 && (
              <div style={{
                padding: '0.75rem', background: 'rgba(127,119,221,0.08)',
                borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)',
                lineHeight: 1.6, marginBottom: '0.75rem'
              }}>
                <span style={{ display: 'flex', gap: '0.4rem' }}><Icon name="lightbulb" size={15} color="var(--blue-400)" style={{ flexShrink: 0, marginTop: '1px' }} />{q1.explanation}</span>
              </div>
            )}

            {phase === PHASES.Q1_FB && (
              <>
                <div style={{
                  padding: '0.75rem', background: 'rgba(127,119,221,0.08)',
                  borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)',
                  lineHeight: 1.6, marginBottom: '1rem'
                }}>
                  <span style={{ display: 'flex', gap: '0.4rem' }}><Icon name="lightbulb" size={15} color="var(--blue-400)" style={{ flexShrink: 0, marginTop: '1px' }} />{q1.explanation}</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0.75rem', background: 'rgba(239,159,39,0.08)',
                  borderRadius: '10px', marginBottom: '1rem'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>本题得分</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-english)' }}>
                    +{q1Stars} <Icon name="star" size={13} color="#EF9F27" style={{ verticalAlign: 'middle' }} />
                  </span>
                </div>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => setPhase(PHASES.Q2)}>
                  下一题 →
                </button>
              </>
            )}

            {q1Attempt > 0 && q1Result === null && (
              <p style={{ fontSize: '0.8rem', color: 'var(--danger)', textAlign: 'center', marginTop: '0.5rem' }}>
                已尝试 {q1Attempt} 次，还有 {2 - q1Attempt} 次机会
              </p>
            )}
          </div>
        )}

        {/* === 第2题：猜谜题 === */}
        {(phase === PHASES.Q2 || phase === PHASES.Q2_FB) && q2 && (
          <div className="card fade-in">
            <div style={{
              display: 'inline-block', padding: '0.25rem 0.8rem',
              background: `${level.color}20`, borderRadius: '20px',
              fontSize: '0.75rem', color: level.color, fontWeight: 600, marginBottom: '0.75rem'
            }}>
              第 2 题 · 猜谜题
            </div>
            <ScientistBanner scientistId={level.scientists[level.scientists.length > 1 ? 1 : 0]} />
            <div style={{
              padding: '1.2rem', background: 'rgba(127,119,221,0.08)',
              borderRadius: '12px', marginBottom: '1.2rem',
              border: '1px solid rgba(127,119,221,0.15)'
            }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Icon name="puzzle" size={13} color="var(--text-muted)" /> 谜题
              </p>
              <p style={{ fontSize: '1rem', lineHeight: 1.8, fontWeight: 500 }}>{q2.riddle}</p>
            </div>

            {q2.hints && q2Hints > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                {q2.hints.slice(0, q2Hints).map((hint, i) => (
                  <div key={i} style={{
                    padding: '0.5rem 0.75rem', background: 'rgba(55,138,221,0.1)',
                    borderRadius: '8px', fontSize: '0.8rem', color: 'var(--blue-400)',
                    marginBottom: '0.4rem'
                  }}>
                    <span style={{ display: 'flex', gap: '0.4rem' }}><Icon name="lightbulb" size={13} color="var(--blue-400)" style={{ flexShrink: 0, marginTop: '1px' }} />提示 {i + 1}：{hint}</span>
                  </div>
                ))}
              </div>
            )}

            {phase === PHASES.Q2 && (
              <>
                <input
                  type="text"
                  placeholder="输入你的答案..."
                  value={q2Input}
                  onChange={e => setQ2Input(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQ2Submit()}
                  disabled={q2Evaluating || q2Result?.correct}
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    background: 'rgba(127,119,221,0.08)',
                    border: `1px solid ${q2Result?.correct === false ? 'var(--danger)' : 'var(--card-border)'}`,
                    borderRadius: '10px', color: 'var(--text-primary)',
                    fontSize: '1rem', outline: 'none', marginBottom: '0.75rem'
                  }}
                />

                {q2Result && !q2Result.correct && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    {q2Result.feedback}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, minWidth: '100px' }}
                    onClick={handleQ2Submit}
                    disabled={!q2Input.trim() || q2Evaluating}
                  >
                    {q2Evaluating ? '判断中...' : '提交答案'}
                  </button>
                  {q2.hints && q2Hints < q2.hints.length && (
                    <button
                      className="btn-secondary"
                      style={{ flex: 1, minWidth: '100px' }}
                      onClick={() => setQ2Hints(h => h + 1)}
                    >
                      查看提示 ({q2.hints.length - q2Hints})
                    </button>
                  )}
                  <button
                    className="btn-ghost"
                    style={{ flex: 1, minWidth: '80px' }}
                    onClick={handleQ2Skip}
                  >
                    跳过
                  </button>
                </div>
              </>
            )}

            {phase === PHASES.Q2_FB && q2Result && (
              <>
                {q2Result.correct ? (
                  <div style={{
                    padding: '0.75rem', background: 'rgba(29,158,117,0.1)',
                    border: '1px solid rgba(29,158,117,0.3)', borderRadius: '10px',
                    fontSize: '0.85rem', color: 'var(--teal-400)', marginBottom: '1rem'
                  }}>
                    <span style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}><Icon name="check-circle" size={15} color="var(--teal-400)" style={{ flexShrink: 0, marginTop: '1px' }} />{q2Result.feedback}</span>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.75rem', background: 'rgba(127,119,221,0.08)',
                    borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)',
                    marginBottom: '1rem'
                  }}>
                    答案是：<strong style={{ color: 'var(--text-primary)' }}>{q2.answer}</strong>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0.75rem', background: 'rgba(239,159,39,0.08)',
                  borderRadius: '10px', marginBottom: '1rem'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>本题得分</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-english)' }}>
                    +{q2Stars} <Icon name="star" size={13} color="#EF9F27" style={{ verticalAlign: 'middle' }} />
                  </span>
                </div>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => setPhase(PHASES.Q3)}>
                  最后一题 →
                </button>
              </>
            )}
          </div>
        )}

        {/* === 第3题：创意题 === */}
        {(phase === PHASES.Q3 || phase === PHASES.Q3_FB) && q3 && (
          <div className="card fade-in">
            <div style={{
              display: 'inline-block', padding: '0.25rem 0.8rem',
              background: `${level.color}20`, borderRadius: '20px',
              fontSize: '0.75rem', color: level.color, fontWeight: 600, marginBottom: '0.75rem'
            }}>
              第 3 题 · 创意题
            </div>
            <div style={{
              padding: '1.2rem', background: `${level.color}08`,
              borderRadius: '12px', marginBottom: '1.2rem',
              border: `1px solid ${level.color}20`
            }}>
              <p style={{ fontSize: '1rem', lineHeight: 1.8, fontWeight: 500 }}>{q3.question}</p>
              {q3.prompt && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.6 }}>
                  <span style={{ display: 'flex', gap: '0.4rem' }}><Icon name="thought" size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '1px' }} />{q3.prompt}</span>
                </p>
              )}
            </div>

            {phase === PHASES.Q3 && (
              <>
                <textarea
                  placeholder="写下你的想法..."
                  value={q3Input}
                  onChange={e => setQ3Input(e.target.value)}
                  disabled={q3Evaluating}
                  rows={4}
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    background: 'rgba(127,119,221,0.08)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px', color: 'var(--text-primary)',
                    fontSize: '0.95rem', outline: 'none',
                    resize: 'vertical', marginBottom: '0.75rem',
                    lineHeight: 1.7
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Icon name="sparkle" size={13} color="var(--purple-300)" /> 没有标准答案，大胆发挥你的想象力！
                </p>
                <button
                  className="btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  onClick={handleQ3Submit}
                  disabled={!q3Input.trim() || q3Evaluating}
                >
                  {q3Evaluating ? 'NOVA 正在阅读...' : <><Icon name="sparkle" size={14} color="currentColor" /> 提交创意</>}
                </button>
              </>
            )}

            {phase === PHASES.Q3_FB && (
              <>
                <div style={{
                  padding: '0.75rem', background: 'rgba(127,119,221,0.1)',
                  borderRadius: '10px', fontSize: '0.85rem',
                  color: 'var(--text-secondary)', lineHeight: 1.7,
                  marginBottom: '1rem', border: '1px solid rgba(127,119,221,0.2)'
                }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--purple-300)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Icon name="bot" size={13} color="var(--purple-300)" /> NOVA 说：
                  </p>
                  <p style={{ fontStyle: 'italic' }}>{q3Feedback || '你的想象力真棒！'}</p>
                </div>
                <div style={{
                  padding: '0.6rem 0.75rem', background: 'rgba(239,159,39,0.08)',
                  borderRadius: '10px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>创意分</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-english)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>+10 <Icon name="star" size={13} color="#EF9F27" /></span>
                </div>
                <div style={{
                  padding: '0.75rem', background: 'rgba(239,159,39,0.08)',
                  borderRadius: '10px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '1rem', borderTop: '1px solid rgba(239,159,39,0.15)'
                }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>本关总分</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 900, fontFamily: 'var(--font-english)', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {q1Stars + q2Stars + 10} <Icon name="star" size={16} color="#EF9F27" />
                  </span>
                </div>
                <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} onClick={handleComplete}>
                  <Icon name="trophy" size={15} color="currentColor" /> 领取通关奖励
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
