import request from 'supertest'
import { createHash } from 'crypto'
import app from '../index.js'

export { request, app }

export const TEST_USER = {
  name: '测试同学',
  school: '星渊小学',
  grade: '三年级',
  class_name: '1班',
  avatar: '🚀',
  pin: '1234',
}

export async function registerUser(overrides = {}) {
  return request(app)
    .post('/api/auth/register')
    .send({ ...TEST_USER, ...overrides })
}

export async function loginUser(overrides = {}) {
  const { name, school, grade, class_name, pin } = { ...TEST_USER, ...overrides }
  return request(app)
    .post('/api/auth/login')
    .send({ name, school, grade, class_name, pin })
}

export async function getAdminToken() {
  const hashed = createHash('sha256')
    .update(process.env.ADMIN_PASSWORD)
    .digest('hex')
  const res = await request(app)
    .post('/api/admin/login')
    .send({ password: hashed })
  return res.body.token
}
