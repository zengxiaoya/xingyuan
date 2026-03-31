import { describe, it, expect, beforeAll } from 'vitest'
import { request, app, TEST_USER, registerUser, getAdminToken } from './helpers.js'

let token

beforeAll(async () => {
  await registerUser()
  token = await getAdminToken()
})

function auth() {
  return { Authorization: `Bearer ${token}` }
}

describe('Admin auth', () => {
  it('rejects missing token', async () => {
    const res = await request(app).get('/api/admin/users')
    expect(res.status).toBe(401)
  })

  it('rejects invalid token', async () => {
    const res = await request(app).get('/api/admin/users')
      .set('Authorization', 'Bearer fake-token')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/admin/users', () => {
  it('returns users including class_name', async () => {
    const res = await request(app).get('/api/admin/users').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    const user = res.body.find(u => u.name === TEST_USER.name)
    expect(user).toBeDefined()
    expect(user.class_name).toBe(TEST_USER.class_name)
    expect(user).not.toHaveProperty('pin_hash')
  })
})

describe('PUT /api/admin/users/:id', () => {
  it('updates class_name', async () => {
    const usersRes = await request(app).get('/api/admin/users').set(auth())
    const user = usersRes.body.find(u => u.name === TEST_USER.name)

    const res = await request(app)
      .put(`/api/admin/users/${user.id}`)
      .set(auth())
      .send({ name: user.name, school: user.school, grade: user.grade, class_name: '2班', avatar: user.avatar })
    expect(res.status).toBe(200)

    const updated = await request(app).get('/api/admin/users').set(auth())
    const u = updated.body.find(u => u.id === user.id)
    expect(u.class_name).toBe('2班')
  })

  it('rejects empty name', async () => {
    const usersRes = await request(app).get('/api/admin/users').set(auth())
    const user = usersRes.body[0]
    const res = await request(app)
      .put(`/api/admin/users/${user.id}`)
      .set(auth())
      .send({ name: '', school: '', grade: '', class_name: '', avatar: '🚀' })
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent user', async () => {
    const res = await request(app)
      .put('/api/admin/users/999999')
      .set(auth())
      .send({ name: '测试', school: '', grade: '', class_name: '', avatar: '🚀' })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/admin/stats', () => {
  it('returns classes and weakLevels arrays', async () => {
    const res = await request(app).get('/api/admin/stats').set(auth())
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.classes)).toBe(true)
    expect(Array.isArray(res.body.weakLevels)).toBe(true)
  })

  it('classes contain expected fields', async () => {
    const res = await request(app).get('/api/admin/stats').set(auth())
    const cls = res.body.classes[0]
    expect(cls).toHaveProperty('school')
    expect(cls).toHaveProperty('grade')
    expect(cls).toHaveProperty('class_name')
    expect(cls).toHaveProperty('user_count')
    expect(cls).toHaveProperty('avg_stars')
    expect(cls).toHaveProperty('avg_completion')
  })
})

describe('DELETE /api/admin/users/:id', () => {
  it('deletes a user', async () => {
    // Register extra user to delete
    await request(app).post('/api/auth/register').send({
      name: '待删除用户', school: '某小学', grade: '一年级', class_name: '1班',
      avatar: '🚀', pin: '0000',
    })
    const usersRes = await request(app).get('/api/admin/users').set(auth())
    const target = usersRes.body.find(u => u.name === '待删除用户')

    const del = await request(app).delete(`/api/admin/users/${target.id}`).set(auth())
    expect(del.status).toBe(200)

    const after = await request(app).get('/api/admin/users').set(auth())
    expect(after.body.find(u => u.id === target.id)).toBeUndefined()
  })
})
