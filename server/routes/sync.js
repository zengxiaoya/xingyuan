import { Router } from 'express'
import db from '../db/index.js'

const router = Router()

// 同步用户信息（登录时调用）
router.post('/user', (req, res) => {
  const { name, school, grade, class_name, avatar } = req.body
  if (!name) return res.status(400).json({ error: '缺少用户名' })
  try {
    const row = db.prepare(`
      INSERT INTO users (name, school, grade, class_name, avatar)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(name, school, grade, class_name) DO UPDATE SET
        avatar     = excluded.avatar,
        updated_at = datetime('now', 'localtime')
      RETURNING id
    `).get(name, school || '', grade || '', class_name || '', avatar || '🚀')
    res.json({ userId: row.id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 同步学习进度（完成关卡时调用）
router.post('/progress', (req, res) => {
  const { name, school, grade, class_name, stars, badges, scientists, creativeAnswers, novaEvaluation } = req.body
  if (!name) return res.status(400).json({ error: '缺少用户名' })
  try {
    const user = db.prepare(
      'SELECT id FROM users WHERE name = ? AND school = ? AND grade = ? AND class_name = ?'
    ).get(name, school || '', grade || '', class_name || '')
    if (!user) return res.status(404).json({ error: '用户不存在，请先同步用户信息' })

    db.prepare(`
      INSERT INTO progress (user_id, stars, badges, scientists, creative_answers, nova_evaluation, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
      ON CONFLICT(user_id) DO UPDATE SET
        stars            = excluded.stars,
        badges           = excluded.badges,
        scientists       = excluded.scientists,
        creative_answers = excluded.creative_answers,
        nova_evaluation  = excluded.nova_evaluation,
        updated_at       = datetime('now', 'localtime')
    `).run(
      user.id,
      stars || 0,
      JSON.stringify(badges || []),
      JSON.stringify(scientists || []),
      JSON.stringify(creativeAnswers || {}),
      novaEvaluation || ''
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const VALID_QUIZ_TYPES = ['choice', 'multi', 'creative', 'guess']

// 记录答题结果（用于错题分析）
router.post('/quiz-result', (req, res) => {
  const { name, school, grade, class_name, levelId, type, isCorrect } = req.body
  if (!name || !levelId || !type) return res.status(400).json({ error: '缺少参数' })
  if (!VALID_QUIZ_TYPES.includes(type)) return res.status(400).json({ error: '无效的题型' })
  if (typeof isCorrect !== 'boolean') return res.status(400).json({ error: '参数格式错误' })
  try {
    const user = db.prepare(
      'SELECT id FROM users WHERE name = ? AND school = ? AND grade = ? AND class_name = ?'
    ).get(name, school || '', grade || '', class_name || '')
    if (!user) return res.json({ ok: true }) // 游客模式，静默跳过
    db.prepare(
      'INSERT INTO quiz_results (user_id, level_id, type, is_correct) VALUES (?, ?, ?, ?)'
    ).run(user.id, levelId, type, isCorrect ? 1 : 0)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
