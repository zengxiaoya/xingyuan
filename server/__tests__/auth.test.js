import { describe, it, expect } from 'vitest'
import { request, app, TEST_USER, registerUser, loginUser } from './helpers.js'

describe('POST /api/auth/register', () => {
  it('registers a new user and returns user without pin_hash', async () => {
    const res = await registerUser()
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.user.name).toBe(TEST_USER.name)
    expect(res.body.user.class_name).toBe(TEST_USER.class_name)
    expect(res.body.user).not.toHaveProperty('pin_hash')
  })

  it('creates initial progress record', async () => {
    await registerUser()
    const res = await loginUser()
    expect(res.body.progress.stars).toBe(0)
    expect(res.body.progress.badges).toEqual([])
  })

  it('rejects duplicate (same name/school/grade/class)', async () => {
    await registerUser()
    const res = await registerUser()
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/已注册/)
  })

  it('rejects empty name', async () => {
    const res = await registerUser({ name: '   ' })
    expect(res.status).toBe(400)
  })

  it('rejects name over 20 chars', async () => {
    const res = await registerUser({ name: 'a'.repeat(21) })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/姓名/)
  })

  it('rejects school name over 50 chars', async () => {
    const res = await registerUser({ school: 's'.repeat(51) })
    expect(res.status).toBe(400)
  })

  it('rejects non-4-digit PIN', async () => {
    const res = await registerUser({ pin: '123' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/PIN/)
  })

  it('rejects alphabetic PIN', async () => {
    const res = await registerUser({ pin: 'abcd' })
    expect(res.status).toBe(400)
  })

  it('rejects 5-digit PIN', async () => {
    const res = await registerUser({ pin: '12345' })
    expect(res.status).toBe(400)
  })

  it('allows same name in different schools', async () => {
    await registerUser({ school: '学校A' })
    const res = await registerUser({ school: '学校B' })
    expect(res.status).toBe(200)
  })
})

describe('POST /api/auth/login', () => {
  it('returns user + progress on correct PIN', async () => {
    await registerUser()
    const res = await loginUser()
    expect(res.status).toBe(200)
    expect(res.body.user.name).toBe(TEST_USER.name)
    expect(res.body.user.class_name).toBe(TEST_USER.class_name)
    expect(res.body.progress).toBeDefined()
    expect(res.body.user).not.toHaveProperty('pin_hash')
  })

  it('rejects wrong PIN', async () => {
    await registerUser()
    const res = await loginUser({ pin: '9999' })
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/PIN/)
  })

  it('rejects unknown user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      name: '不存在的用户', school: '', grade: '', class_name: '', pin: '1234',
    })
    expect(res.status).toBe(404)
  })

  it('rejects missing PIN', async () => {
    const res = await request(app).post('/api/auth/login').send({
      name: TEST_USER.name, school: TEST_USER.school,
      grade: TEST_USER.grade, class_name: TEST_USER.class_name,
    })
    expect(res.status).toBe(400)
  })
})
