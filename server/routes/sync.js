import { Router } from 'express'
import db from '../db/index.js'

const router = Router()

// 同步用户信息（登录时调用）
router.post('/user', (req, res) => {
  const { name, school, grade, avatar } = req.body
  if (!name) return res.status(400).json({ error: '缺少用户名' })
  try {
    const row = db.prepare(`
      INSERT INTO users (name, school, grade, avatar)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name, school) DO UPDATE SET
        grade      = excluded.grade,
        avatar     = excluded.avatar,
        updated_at = datetime('now', 'localtime')
      RETURNING id
    `).get(name, school || '', grade || '', avatar || '🚀')
    res.json({ userId: row.id })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 同步学习进度（完成关卡时调用）
router.post('/progress', (req, res) => {
  const { name, school, stars, badges, scientists, creativeAnswers, novaEvaluation } = req.body
  if (!name) return res.status(400).json({ error: '缺少用户名' })
  try {
    const user = db.prepare(
      'SELECT id FROM users WHERE name = ? AND school = ?'
    ).get(name, school || '')
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

export default router
