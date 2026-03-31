import { Router } from 'express'
import { createHash } from 'crypto'
import db from '../db/index.js'

const router = Router()

function sha256(str) {
  return createHash('sha256').update(str).digest('hex')
}

function safeJSON(str, fallback) {
  try { return JSON.parse(str) } catch { return fallback }
}

// 注册新用户
router.post('/register', (req, res) => {
  const { name, school, grade, class_name, avatar, pin } = req.body
  if (!name?.trim()) return res.status(400).json({ error: '请填写姓名' })
  if (name.trim().length > 20) return res.status(400).json({ error: '姓名不能超过20个字' })
  if ((school || '').length > 50) return res.status(400).json({ error: '学校名称过长' })
  if ((grade || '').length > 20) return res.status(400).json({ error: '年级格式错误' })
  if ((class_name || '').length > 20) return res.status(400).json({ error: '班级格式错误' })
  if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'PIN 必须为 4 位数字' })

  try {
    const row = db.prepare(`
      INSERT INTO users (name, school, grade, class_name, avatar, pin_hash)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id, name, school, grade, class_name, avatar
    `).get(
      name.trim(), school || '', grade || '', class_name || '',
      avatar || '🚀', sha256(pin)
    )

    // 创建初始进度记录
    db.prepare(`INSERT OR IGNORE INTO progress (user_id) VALUES (?)`).run(row.id)

    res.json({ ok: true, user: row })
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '该学生信息已注册，请直接找回进度' })
    }
    res.status(500).json({ error: e.message })
  }
})

// 登录 / 找回进度
router.post('/login', (req, res) => {
  const { name, school, grade, class_name, pin } = req.body
  if (!name?.trim() || !pin) return res.status(400).json({ error: '请填写姓名和 PIN' })
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'PIN 必须为 4 位数字' })

  const user = db.prepare(`
    SELECT id, name, school, grade, class_name, avatar, pin_hash
    FROM users
    WHERE name = ? AND school = ? AND grade = ? AND class_name = ?
  `).get(name.trim(), school || '', grade || '', class_name || '')

  if (!user) return res.status(404).json({ error: '未找到该学生，请检查信息是否填写正确' })
  if (!user.pin_hash) return res.status(400).json({ error: '该账号尚未设置 PIN，请重新注册' })
  if (user.pin_hash !== sha256(pin)) return res.status(401).json({ error: 'PIN 错误，请重试' })

  const progress = db.prepare(`
    SELECT stars, badges, scientists, creative_answers, nova_evaluation
    FROM progress WHERE user_id = ?
  `).get(user.id)

  const { pin_hash, ...userInfo } = user
  res.json({
    user: userInfo,
    progress: {
      stars: progress?.stars || 0,
      badges: safeJSON(progress?.badges, []),
      scientists: safeJSON(progress?.scientists, []),
      creativeAnswers: safeJSON(progress?.creative_answers, {}),
      novaEvaluation: progress?.nova_evaluation || '',
    }
  })
})

export default router
