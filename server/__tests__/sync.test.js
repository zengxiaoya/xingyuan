import { describe, it, expect, beforeAll } from 'vitest'
import { request, app, TEST_USER, registerUser } from './helpers.js'

beforeAll(async () => {
  await registerUser()
})

const VALID = {
  name: TEST_USER.name,
  school: TEST_USER.school,
  grade: TEST_USER.grade,
  class_name: TEST_USER.class_name,
  levelId: 'solar_lv1',
  type: 'choice',
  isCorrect: true,
}

describe('POST /api/sync/quiz-result', () => {
  it('records a correct result', async () => {
    const res = await request(app).post('/api/sync/quiz-result').send(VALID)
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('records an incorrect result', async () => {
    const res = await request(app).post('/api/sync/quiz-result')
      .send({ ...VALID, isCorrect: false })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('rejects invalid type', async () => {
    const res = await request(app).post('/api/sync/quiz-result')
      .send({ ...VALID, type: 'hacked' })
    expect(res.status).toBe(400)
  })

  it('rejects non-boolean isCorrect', async () => {
    const res = await request(app).post('/api/sync/quiz-result')
      .send({ ...VALID, isCorrect: 1 })
    expect(res.status).toBe(400)
  })

  it('rejects string isCorrect', async () => {
    const res = await request(app).post('/api/sync/quiz-result')
      .send({ ...VALID, isCorrect: 'true' })
    expect(res.status).toBe(400)
  })

  it('silently skips unknown user (guest mode)', async () => {
    const res = await request(app).post('/api/sync/quiz-result')
      .send({ ...VALID, name: '不存在的幽灵用户' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('rejects missing levelId', async () => {
    const { levelId, ...rest } = VALID
    const res = await request(app).post('/api/sync/quiz-result').send(rest)
    expect(res.status).toBe(400)
  })

  it('rejects missing type', async () => {
    const { type, ...rest } = VALID
    const res = await request(app).post('/api/sync/quiz-result').send(rest)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/sync/progress', () => {
  it('syncs progress for known user', async () => {
    const res = await request(app).post('/api/sync/progress').send({
      name: TEST_USER.name,
      school: TEST_USER.school,
      grade: TEST_USER.grade,
      class_name: TEST_USER.class_name,
      stars: 30,
      badges: ['solar_lv1'],
      scientists: ['galileo'],
      creativeAnswers: { solar_lv1: '我的答案' },
      novaEvaluation: '',
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('rejects unknown user with 404', async () => {
    const res = await request(app).post('/api/sync/progress').send({
      name: '不存在', school: '', grade: '', class_name: '',
      stars: 0, badges: [], scientists: [],
    })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/sync/user', () => {
  it('updates avatar for known user', async () => {
    const res = await request(app).post('/api/sync/user').send({
      name: TEST_USER.name,
      school: TEST_USER.school,
      grade: TEST_USER.grade,
      class_name: TEST_USER.class_name,
      avatar: '🛰️',
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBeUndefined()
    expect(res.body.userId).toBeDefined()

    const login = await request(app).post('/api/auth/login').send({
      name: TEST_USER.name,
      school: TEST_USER.school,
      grade: TEST_USER.grade,
      class_name: TEST_USER.class_name,
      pin: TEST_USER.pin,
    })
    expect(login.status).toBe(200)
    expect(login.body.user.avatar).toBe('🛰️')
  })

  it('rejects unknown user instead of auto-creating account', async () => {
    const res = await request(app).post('/api/sync/user').send({
      name: '陌生同学',
      school: '星渊小学',
      grade: '一年级',
      class_name: '2班',
      avatar: '🚀',
    })
    expect(res.status).toBe(404)
  })
})
