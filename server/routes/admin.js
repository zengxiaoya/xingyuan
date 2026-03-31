import { Router } from 'express'
import { randomUUID, createHash } from 'crypto'
import db from '../db/index.js'

function sha256(str) {
  return createHash('sha256').update(str).digest('hex')
}

const router = Router()

// 内存 token 表：token -> expiry timestamp
const tokens = new Map()
const TOKEN_TTL = 24 * 60 * 60 * 1000 // 24小时

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: '未授权' })
  const token = auth.slice(7)
  const expiry = tokens.get(token)
  if (!expiry || Date.now() > expiry) {
    tokens.delete(token)
    return res.status(401).json({ error: '会话已过期，请重新登录' })
  }
  next()
}

// 登录
router.post('/login', (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return res.status(503).json({ error: '管理员密码未配置，请在服务器环境变量中设置 ADMIN_PASSWORD' })
  }
  const { password } = req.body
  if (!password || password !== sha256(adminPassword)) {
    return res.status(401).json({ error: '密码错误' })
  }
  const token = randomUUID()
  tokens.set(token, Date.now() + TOKEN_TTL)
  res.json({ token })
})

// 以下路由均需要鉴权
router.use(authMiddleware)

// 获取所有用户（含进度）
router.get('/users', (req, res) => {
  const rows = db.prepare(`
    SELECT
      u.id, u.name, u.school, u.grade, u.avatar, u.created_at,
      p.stars, p.badges, p.scientists, p.creative_answers,
      p.nova_evaluation, p.updated_at AS last_active
    FROM users u
    LEFT JOIN progress p ON p.user_id = u.id
    ORDER BY u.created_at DESC
  `).all()

  res.json(rows.map(r => ({
    ...r,
    badges:           JSON.parse(r.badges           || '[]'),
    scientists:       JSON.parse(r.scientists        || '[]'),
    creative_answers: JSON.parse(r.creative_answers  || '{}'),
  })))
})

// 更新用户信息
router.put('/users/:id', (req, res) => {
  const { name, school, grade, avatar } = req.body
  if (!name) return res.status(400).json({ error: '姓名不能为空' })
  try {
    const result = db.prepare(`
      UPDATE users
      SET name = ?, school = ?, grade = ?, avatar = ?,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(name, school || '', grade || '', avatar || '🚀', req.params.id)
    if (result.changes === 0) return res.status(404).json({ error: '用户不存在' })
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// 删除用户（级联删除进度）
router.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// 重置某用户进度
router.delete('/progress/:userId', (req, res) => {
  db.prepare('DELETE FROM progress WHERE user_id = ?').run(req.params.userId)
  res.json({ ok: true })
})

export default router
