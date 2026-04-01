import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LEVELS } from '../data/levels.js'
import { SCIENTISTS } from '../data/scientists.js'
import { PLANET_FACTS } from '../data/planetFacts.js'
import { useProgressStore } from '../store/progressStore.js'
import { useNovaStore } from '../store/novaStore.js'
import { fetchQuiz, evaluateAnswer, syncQuizResult } from '../utils/api.js'
import { useUserStore } from '../store/userStore.js'
import Icon from '../components/Icon.jsx'

// 阶段：intro → learn → loading → q1/q1_fb → q2/q2_fb → q3/q3_fb → q4/q4_fb → q5/q5_fb → complete
const PHASES = {
  INTRO: 'intro',
  LEARN: 'learn',
  LOADING: 'loading',
  Q1: 'q1', Q1_FB: 'q1_fb',
  Q2: 'q2', Q2_FB: 'q2_fb',
  Q3: 'q3', Q3_FB: 'q3_fb',
  Q4: 'q4', Q4_FB: 'q4_fb',
  Q5: 'q5', Q5_FB: 'q5_fb',
  COMPLETE: 'complete'
}

const PHASE_ORDER = [
  PHASES.Q1, PHASES.Q1_FB, PHASES.Q2, PHASES.Q2_FB,
  PHASES.Q3, PHASES.Q3_FB, PHASES.Q4, PHASES.Q4_FB,
  PHASES.Q5, PHASES.Q5_FB, PHASES.COMPLETE
]

const CHOICE_CURRENT = [PHASES.Q1, PHASES.Q2, PHASES.Q3]
const CHOICE_FB      = [PHASES.Q1_FB, PHASES.Q2_FB, PHASES.Q3_FB]
const CHOICE_NEXT    = [PHASES.Q2, PHASES.Q3, PHASES.Q4]

export default function LevelPage() {
  const { levelId } = useParams()
  const navigate    = useNavigate()
  const level  = LEVELS[levelId]
  const facts  = PLANET_FACTS[levelId] || []
  const { isLevelUnlocked, completeLevel, isLevelCompleted, saveCreativeAnswer } = useProgressStore()
  const openNova = useNovaStore(s => s.openNova)
  const user = useUserStore(s => s.user)

  const [phase, setPhase]           = useState(PHASES.INTRO)
  const [learnIndex, setLearnIndex] = useState(0)
  const [loadError, setLoadError]   = useState(false)

  // 单选题 (3道)
  const [choiceQs, setChoiceQs]   = useState([null, null, null])
  const [cAttempt, setCAttempt]   = useState([0, 0, 0])
  const [cSelected, setCSelected] = useState([null, null, null])
  const [cResult, setCResult]     = useState([null, null, null]) // 'correct'|'wrong'|'wrong_final'
  const [cStars, setCStars]       = useState([0, 0, 0])

  // 多选题
  const [multiQ, setMultiQ]     = useState(null)
  const [mSelected, setMSelected] = useState([])
  const [mAttempt, setMAttempt]  = useState(0)
  const [mResult, setMResult]    = useState(null)
  const [mStars, setMStars]      = useState(0)

  // 开放题
  const [creativeQ, setCreativeQ]     = useState(null)
  const [q5Input, setQ5Input]         = useState('')
  const [q5Feedback, setQ5Feedback]   = useState('')
  const [q5Evaluating, setQ5Evaluating] = useState(false)

  // 全屏反馈遮罩
  const [overlay, setOverlay] = useState(null)
  const overlayTimer = useRef(null)

  useEffect(() => () => { if (overlayTimer.current) clearTimeout(overlayTimer.current) }, [])

  const runningStars = cStars[0] + cStars[1] + cStars[2] + mStars
  const alreadyDone  = isLevelCompleted(levelId)

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

  async function loadQuestions() {
    setPhase(PHASES.LOADING)
    try {
      const [c1, c2, c3, multi, creative] = await Promise.all([
        fetchQuiz(levelId, 'choice', 0),
        fetchQuiz(levelId, 'choice', 1),
        fetchQuiz(levelId, 'choice', 2),
        fetchQuiz(levelId, 'multi', 0),
        fetchQuiz(levelId, 'creative', 0),
      ])
      setChoiceQs([c1, c2, c3])
      setMultiQ(multi)
      setCreativeQ(creative)
      setPhase(PHASES.Q1)
    } catch (e) {
      console.error('加载题目失败', e)
      setLoadError(true)
      setPhase(PHASES.INTRO)
    }
  }

  // ── 单选题 handlers ──────────────────────────────────────────────────────────
  function handleChoiceSelect(qi, idx) {
    if (cResult[qi] === 'correct' || cResult[qi] === 'wrong_final') return
    setCSelected(prev => { const n = [...prev]; n[qi] = idx; return n })
  }

  function handleChoiceSubmit(qi) {
    const q = choiceQs[qi]
    if (cSelected[qi] === null || !q) return
    const correct = cSelected[qi] === q.correctIndex
    const attempt = cAttempt[qi] + 1
    setCAttempt(prev => { const n = [...prev]; n[qi] = attempt; return n })

    if (correct) {
      const stars = attempt === 1 ? 10 : 5
      setCStars(prev => { const n = [...prev]; n[qi] = stars; return n })
      setCResult(prev => { const n = [...prev]; n[qi] = 'correct'; return n })
      syncQuizResult(user, levelId, 'choice', true)
      showOverlay('correct', '正确！⭐', 1600)
      setTimeout(() => setPhase(CHOICE_FB[qi]), 1700)
    } else {
      setCResult(prev => { const n = [...prev]; n[qi] = 'wrong'; return n })
      showOverlay('wrong', '再试试！', 1400)
      setTimeout(() => {
        setOverlay(null)
        if (attempt >= 2) {
          setCResult(prev => { const n = [...prev]; n[qi] = 'wrong_final'; return n })
          syncQuizResult(user, levelId, 'choice', false)
          setPhase(CHOICE_FB[qi])
        } else {
          setCResult(prev => { const n = [...prev]; n[qi] = null; return n })
          setCSelected(prev => { const n = [...prev]; n[qi] = null; return n })
        }
      }, 1500)
    }
  }

  // ── 多选题 handlers ──────────────────────────────────────────────────────────
  function handleMultiToggle(idx) {
    if (mResult === 'correct' || mResult === 'wrong_final') return
    setMSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  function handleMultiSubmit() {
    if (!multiQ || mSelected.length === 0) return
    const attempt = mAttempt + 1
    setMAttempt(attempt)
    const correctSet  = new Set(multiQ.correctIndices)
    const selectedSet = new Set(mSelected)
    const isCorrect   = selectedSet.size === correctSet.size && [...selectedSet].every(i => correctSet.has(i))

    if (isCorrect) {
      const stars = attempt === 1 ? 10 : 5
      setMStars(stars)
      setMResult('correct')
      syncQuizResult(user, levelId, 'multi', true)
      showOverlay('correct', '全对！🎉', 1600)
      setTimeout(() => setPhase(PHASES.Q4_FB), 1700)
    } else {
      setMResult('wrong')
      showOverlay('wrong', '再想想！', 1400)
      setTimeout(() => {
        setOverlay(null)
        if (attempt >= 2) {
          setMResult('wrong_final')
          syncQuizResult(user, levelId, 'multi', false)
          setPhase(PHASES.Q4_FB)
        } else {
          setMResult(null)
        }
      }, 1500)
    }
  }

  // ── 开放题 handler ────────────────────────────────────────────────────────────
  async function handleQ5Submit() {
    if (!q5Input.trim() || q5Evaluating) return
    setQ5Evaluating(true)
    try {
      const res = await evaluateAnswer(levelId, creativeQ.question, q5Input, 'creative')
      setQ5Feedback(res.feedback || '你的想象力真棒！NOVA 很喜欢你的回答！')
      saveCreativeAnswer(levelId, q5Input)
    } catch {
      setQ5Feedback('你的想象力真棒！NOVA 很喜欢你的回答！')
      saveCreativeAnswer(levelId, q5Input)
    } finally {
      setQ5Evaluating(false)
      showOverlay('creative', 'CREATIVE! ✨', 1600)
      setTimeout(() => setPhase(PHASES.Q5_FB), 1700)
    }
  }

  function handleComplete() {
    const earned = cStars[0] + cStars[1] + cStars[2] + mStars + 10
    completeLevel(levelId, earned, level.scientists)
    setPhase(PHASES.COMPLETE)
  }

  // ── 步骤条 ────────────────────────────────────────────────────────────────────
  function StepBar() {
    const stepLabels = ['单选①', '单选②', '单选③', '多选', '创意']
    const stepPhases = [
      [PHASES.Q1, PHASES.Q1_FB], [PHASES.Q2, PHASES.Q2_FB],
      [PHASES.Q3, PHASES.Q3_FB], [PHASES.Q4, PHASES.Q4_FB],
      [PHASES.Q5, PHASES.Q5_FB],
    ]
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', marginBottom: '1.5rem' }}>
        {stepLabels.map((label, i) => {
          const done   = stepPhases[i].every(p => PHASE_ORDER.indexOf(phase) > PHASE_ORDER.indexOf(p))
          const active = stepPhases[i].includes(phase)
          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: done ? 'var(--teal-400)' : active ? level.color : 'rgba(100,100,150,0.2)',
                  border: `2px solid ${done ? 'var(--teal-400)' : active ? level.color : 'rgba(100,100,150,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#fff', transition: 'all 0.3s'
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.55rem', color: active ? level.color : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < 4 && (
                <div style={{
                  flex: 1, height: '2px', maxWidth: '32px',
                  background: done ? 'var(--teal-400)' : 'rgba(100,100,150,0.2)',
                  marginBottom: '1.1rem', transition: 'all 0.3s'
                }} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  // ── 科学家横幅 ─────────────────────────────────────────────────────────────────
  function ScientistBanner({ scientistId }) {
    const s = SCIENTISTS[scientistId]
    if (!s) return null
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: `${level.color}10`, border: `1px solid ${level.color}30`,
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

  // ── 渲染单选题 (qi = 0|1|2) ───────────────────────────────────────────────────
  function renderChoiceQ(qi) {
    const q          = choiceQs[qi]
    if (!q) return null
    const currentPh  = CHOICE_CURRENT[qi]
    const fbPh       = CHOICE_FB[qi]
    const nextPh     = CHOICE_NEXT[qi]
    const attempt    = cAttempt[qi]
    const selected   = cSelected[qi]
    const result     = cResult[qi]
    const stars      = cStars[qi]
    const sIdx       = qi % level.scientists.length

    return (
      <div className="card fade-in">
        <div style={{ display: 'inline-block', padding: '0.25rem 0.8rem', background: `${level.color}20`, borderRadius: '20px', fontSize: '0.75rem', color: level.color, fontWeight: 600, marginBottom: '0.75rem' }}>
          第 {qi + 1} 题 · 单选题
        </div>
        <ScientistBanner scientistId={level.scientists[sIdx]} />
        <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.7, marginBottom: '1.2rem' }}>{q.question}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.2rem' }}>
          {q.options.map((opt, idx) => {
            let bg = 'rgba(127,119,221,0.06)', border = 'var(--card-border)', color = 'var(--text-primary)'
            if (selected === idx) { bg = `${level.color}18`; border = level.color }
            if (result === 'correct' || result === 'wrong_final') {
              if (idx === q.correctIndex) { bg = 'rgba(29,158,117,0.12)'; border = 'var(--teal-400)'; color = 'var(--teal-400)' }
              else if (selected === idx) { bg = 'rgba(224,85,85,0.1)'; border = 'var(--danger)'; color = 'var(--danger)' }
            }
            return (
              <button key={idx}
                onClick={() => phase === currentPh && handleChoiceSelect(qi, idx)}
                disabled={result === 'correct' || result === 'wrong_final' || phase === fbPh}
                style={{ padding: '0.8rem 1rem', textAlign: 'left', background: bg, border: `1.5px solid ${border}`, borderRadius: '12px', color, fontSize: '0.9rem', cursor: result === 'correct' || result === 'wrong_final' ? 'default' : 'pointer', transition: 'all 0.2s', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <span style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', background: selected === idx ? `${level.color}30` : 'rgba(127,119,221,0.1)', border: `1px solid ${selected === idx ? level.color : 'rgba(127,119,221,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: selected === idx ? level.color : 'var(--text-muted)', fontFamily: 'var(--font-english)' }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            )
          })}
        </div>

        {phase === currentPh && result !== 'correct' && result !== 'wrong_final' && (
          <button className="btn-primary" disabled={selected === null} onClick={() => handleChoiceSubmit(qi)} style={{ width: '100%' }}>确认答案</button>
        )}

        {(result === 'correct' || result === 'wrong_final') && phase === currentPh && (
          <div style={{ padding: '0.75rem', background: 'rgba(127,119,221,0.08)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            <span style={{ display: 'flex', gap: '0.4rem' }}><Icon name="lightbulb" size={15} color="var(--blue-400)" style={{ flexShrink: 0, marginTop: '1px' }} />{q.explanation}</span>
          </div>
        )}

        {phase === fbPh && (
          <>
            <div style={{ padding: '0.75rem', background: 'rgba(127,119,221,0.08)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              <span style={{ display: 'flex', gap: '0.4rem' }}><Icon name="lightbulb" size={15} color="var(--blue-400)" style={{ flexShrink: 0, marginTop: '1px' }} />{q.explanation}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(239,159,39,0.08)', borderRadius: '10px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>本题得分</span>
              <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-english)' }}>+{stars} <Icon name="star" size={13} color="#EF9F27" style={{ verticalAlign: 'middle' }} /></span>
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setPhase(nextPh)}>下一题 →</button>
          </>
        )}

        {attempt > 0 && result === null && (
          <p style={{ fontSize: '0.8rem', color: 'var(--danger)', textAlign: 'center', marginTop: '0.5rem' }}>
            已尝试 {attempt} 次，还有 {2 - attempt} 次机会
          </p>
        )}
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

          {loadError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.75rem 1rem', marginBottom: '1rem',
              background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)',
              borderRadius: '10px', fontSize: '0.85rem', color: 'var(--danger)'
            }}>
              <Icon name="warning" size={15} color="var(--danger)" />
              题目加载失败，请检查网络后重试
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              onClick={() => { setLoadError(false); setLearnIndex(0); setPhase(PHASES.LEARN) }}>
              <Icon name="rocket" size={15} color="currentColor" />
              开始闯关 ({alreadyDone ? '重玩' : '5 道题'})
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
      loadQuestions()
      return null
    }

    return (
      <div className="page-container">
        <div className="stars-bg" />
        <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <button className="btn-ghost" onClick={() => setPhase(PHASES.INTRO)}>← 返回</button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: level.color, fontWeight: 600 }}>{level.title}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>知识卡片 {learnIndex + 1} / {knowledge.length}</p>
            </div>
            <div style={{ width: '60px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.5rem' }}>
            {knowledge.map((_, i) => (
              <div key={i} style={{
                width: i === learnIndex ? '20px' : '8px', height: '8px', borderRadius: '4px',
                background: i <= learnIndex ? level.color : 'rgba(127,119,221,.2)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          <div className="card fade-in" style={{
            marginBottom: '1.5rem', borderColor: `${level.color}55`,
            boxShadow: `0 0 30px ${level.color}15`, padding: '2rem 1.5rem', textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              {card.img
                ? <img src={card.img} alt={card.title} style={{ width: '400px', height: '300px', objectFit: 'cover', borderRadius: '8px', maxWidth: '100%' }} />
                : <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: `${level.color}15`, border: `2px solid ${level.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 20px ${level.color}20`,
                  }}>
                    <Icon name={card.icon} size={48} color={level.color} />
                  </div>
              }
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: level.color, marginBottom: '1rem', lineHeight: 1.4 }}>{card.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.85, textAlign: 'left' }}>{card.content}</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {learnIndex > 0 && (
              <button className="btn-secondary" style={{ flex: 1, minWidth: '100px' }} onClick={() => setLearnIndex(i => i - 1)}>← 上一条</button>
            )}
            {!isLast && (
              <button className="btn-primary" style={{ flex: 2, minWidth: '140px', background: `${level.color}22`, borderColor: `${level.color}66`, color: level.color }}
                onClick={() => setLearnIndex(i => i + 1)}>下一条 →</button>
            )}
            {isLast && (
              <button className="btn-primary" style={{ flex: 2, minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                onClick={loadQuestions}>
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
    const earned   = cStars[0] + cStars[1] + cStars[2] + mStars + 10
    const scientists = level.scientists.map(id => SCIENTISTS[id]).filter(Boolean)
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="stars-bg" />
        <div className="card fade-in" style={{ position: 'relative', zIndex: 1, maxWidth: '480px', width: '90%', textAlign: 'center', borderColor: `${level.color}55` }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Icon name="trophy" size={52} color={level.color} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem', color: level.color }}>关卡通关！</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{level.title} 探索完成</p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.5rem', borderRadius: '50px',
            background: 'rgba(239,159,39,0.15)', border: '1px solid rgba(239,159,39,0.4)',
            marginBottom: '1.5rem'
          }}>
            <Icon name="star" size={20} color="#EF9F27" />
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--font-english)' }}>+{earned}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>星分</span>
          </div>

          {scientists.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>解锁科学家</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {scientists.map(s => (
                  <div key={s.id} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: `${level.color}15`, border: `1px solid ${level.color}30`, fontSize: '0.85rem' }}>
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

  // 主闯关界面 (q1~q5)
  return (
    <div className="page-container">
      <div className="stars-bg" />

      {overlay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900,
            fontFamily: 'var(--font-english)', letterSpacing: '0.05em',
            color: overlay.type === 'correct' ? 'var(--teal-400)' : overlay.type === 'creative' ? 'var(--purple-300)' : 'var(--danger)',
            animation: 'feedbackPop 0.3s ease',
            textShadow: overlay.type === 'correct' ? '0 0 40px rgba(29,158,117,0.8)' : overlay.type === 'creative' ? '0 0 40px rgba(127,119,221,0.8)' : '0 0 30px rgba(224,85,85,0.7)'
          }}>{overlay.text}</div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, padding: '1rem 1.5rem', maxWidth: '680px', margin: '0 auto' }}>
        {/* 顶部栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button className="btn-ghost" onClick={() => navigate('/map')}>← 星图</button>
          <div style={{ fontFamily: 'var(--font-english)', fontSize: '0.9rem', color: level.color, fontWeight: 600 }}>{level.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--amber)', fontWeight: 600 }}>
            <Icon name="star" size={14} color="#EF9F27" /> {runningStars}
          </div>
        </div>

        <StepBar />

        {/* 单选题 1 */}
        {(phase === PHASES.Q1 || phase === PHASES.Q1_FB) && renderChoiceQ(0)}

        {/* 单选题 2 */}
        {(phase === PHASES.Q2 || phase === PHASES.Q2_FB) && renderChoiceQ(1)}

        {/* 单选题 3 */}
        {(phase === PHASES.Q3 || phase === PHASES.Q3_FB) && renderChoiceQ(2)}

        {/* 多选题 */}
        {(phase === PHASES.Q4 || phase === PHASES.Q4_FB) && multiQ && (
          <div className="card fade-in">
            <div style={{ display: 'inline-block', padding: '0.25rem 0.8rem', background: `${level.color}20`, borderRadius: '20px', fontSize: '0.75rem', color: level.color, fontWeight: 600, marginBottom: '0.5rem' }}>
              第 4 题 · 多选题
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>（有多个正确答案，请全部选出）</p>
            <ScientistBanner scientistId={level.scientists[level.scientists.length > 1 ? 1 : 0]} />
            <p style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.7, marginBottom: '1.2rem' }}>{multiQ.question}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.2rem' }}>
              {multiQ.options.map((opt, idx) => {
                const isSelected = mSelected.includes(idx)
                let bg = 'rgba(127,119,221,0.06)', border = 'var(--card-border)', color = 'var(--text-primary)'
                if (isSelected) { bg = `${level.color}18`; border = level.color }
                if (mResult === 'correct' || mResult === 'wrong_final') {
                  const isCorrect = multiQ.correctIndices.includes(idx)
                  if (isCorrect) { bg = 'rgba(29,158,117,0.12)'; border = 'var(--teal-400)'; color = 'var(--teal-400)' }
                  else if (isSelected) { bg = 'rgba(224,85,85,0.1)'; border = 'var(--danger)'; color = 'var(--danger)' }
                }
                return (
                  <button key={idx}
                    onClick={() => phase === PHASES.Q4 && handleMultiToggle(idx)}
                    disabled={mResult === 'correct' || mResult === 'wrong_final' || phase === PHASES.Q4_FB}
                    style={{
                      padding: '0.8rem 1rem', textAlign: 'left', background: bg, border: `1.5px solid ${border}`,
                      borderRadius: '12px', color, fontSize: '0.9rem',
                      cursor: mResult === 'correct' || mResult === 'wrong_final' ? 'default' : 'pointer',
                      transition: 'all 0.2s', lineHeight: 1.5,
                      display: 'flex', alignItems: 'center', gap: '0.6rem'
                    }}>
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                      border: `1.5px solid ${isSelected ? level.color : 'rgba(127,119,221,0.4)'}`,
                      background: isSelected ? `${level.color}30` : 'rgba(127,119,221,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-english)',
                      color: isSelected ? level.color : 'var(--text-muted)'
                    }}>
                      {isSelected ? '✓' : String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>

            {phase === PHASES.Q4 && mResult !== 'correct' && mResult !== 'wrong_final' && (
              <button className="btn-primary" disabled={mSelected.length === 0} onClick={handleMultiSubmit} style={{ width: '100%' }}>确认答案</button>
            )}

            {(mResult === 'correct' || mResult === 'wrong_final') && phase === PHASES.Q4 && (
              <div style={{ padding: '0.75rem', background: 'rgba(127,119,221,0.08)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                <span style={{ display: 'flex', gap: '0.4rem' }}><Icon name="lightbulb" size={15} color="var(--blue-400)" style={{ flexShrink: 0, marginTop: '1px' }} />{multiQ.explanation}</span>
              </div>
            )}

            {phase === PHASES.Q4_FB && (
              <>
                <div style={{ padding: '0.75rem', background: 'rgba(127,119,221,0.08)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                  <span style={{ display: 'flex', gap: '0.4rem' }}><Icon name="lightbulb" size={15} color="var(--blue-400)" style={{ flexShrink: 0, marginTop: '1px' }} />{multiQ.explanation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'rgba(239,159,39,0.08)', borderRadius: '10px', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>本题得分</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-english)' }}>+{mStars} <Icon name="star" size={13} color="#EF9F27" style={{ verticalAlign: 'middle' }} /></span>
                </div>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => setPhase(PHASES.Q5)}>最后一题 →</button>
              </>
            )}

            {mAttempt > 0 && mResult === null && (
              <p style={{ fontSize: '0.8rem', color: 'var(--danger)', textAlign: 'center', marginTop: '0.5rem' }}>
                已尝试 {mAttempt} 次，还有 {2 - mAttempt} 次机会
              </p>
            )}
          </div>
        )}

        {/* 开放题 */}
        {(phase === PHASES.Q5 || phase === PHASES.Q5_FB) && creativeQ && (
          <div className="card fade-in">
            <div style={{ display: 'inline-block', padding: '0.25rem 0.8rem', background: `${level.color}20`, borderRadius: '20px', fontSize: '0.75rem', color: level.color, fontWeight: 600, marginBottom: '0.75rem' }}>
              第 5 题 · 开放题
            </div>
            <div style={{ padding: '1.2rem', background: `${level.color}08`, borderRadius: '12px', marginBottom: '1.2rem', border: `1px solid ${level.color}20` }}>
              <p style={{ fontSize: '1rem', lineHeight: 1.8, fontWeight: 500 }}>{creativeQ.question}</p>
              {creativeQ.prompt && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.6 }}>
                  <span style={{ display: 'flex', gap: '0.4rem' }}><Icon name="thought" size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '1px' }} />{creativeQ.prompt}</span>
                </p>
              )}
            </div>

            {phase === PHASES.Q5 && (
              <>
                <textarea
                  placeholder="写下你的想法..."
                  value={q5Input}
                  onChange={e => setQ5Input(e.target.value)}
                  disabled={q5Evaluating}
                  rows={4}
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    background: 'rgba(127,119,221,0.08)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px', color: 'var(--text-primary)',
                    fontSize: '0.95rem', outline: 'none',
                    resize: 'vertical', marginBottom: '0.75rem', lineHeight: 1.7
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Icon name="sparkle" size={13} color="var(--purple-300)" /> 没有标准答案，大胆发挥你的想象力！
                  </p>
                  <span style={{ fontSize: '0.72rem', color: q5Input.trim().length >= 20 ? 'var(--teal-400)' : 'var(--text-muted)' }}>
                    {q5Input.trim().length}/20字
                  </span>
                </div>
                <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  onClick={handleQ5Submit} disabled={q5Input.trim().length < 20 || q5Evaluating}>
                  {q5Evaluating ? 'NOVA 正在阅读...' : <><Icon name="sparkle" size={14} color="currentColor" /> 提交创意</>}
                </button>
              </>
            )}

            {phase === PHASES.Q5_FB && (
              <>
                <div style={{ padding: '0.75rem', background: 'rgba(127,119,221,0.1)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem', border: '1px solid rgba(127,119,221,0.2)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--purple-300)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Icon name="bot" size={13} color="var(--purple-300)" /> NOVA 说：
                  </p>
                  <p style={{ fontStyle: 'italic' }}>{q5Feedback || '你的想象力真棒！'}</p>
                </div>
                <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(239,159,39,0.08)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>创意分</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 700, fontFamily: 'var(--font-english)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>+10 <Icon name="star" size={13} color="#EF9F27" /></span>
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(239,159,39,0.08)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderTop: '1px solid rgba(239,159,39,0.15)' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>本关总分</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 900, fontFamily: 'var(--font-english)', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {cStars[0] + cStars[1] + cStars[2] + mStars + 10} <Icon name="star" size={16} color="#EF9F27" />
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
