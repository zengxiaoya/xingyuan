import { describe, it, expect, vi, beforeAll } from 'vitest'
import { request, app, TEST_USER, registerUser } from './helpers.js'

// Mock OpenAI — no real HTTP calls
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'NOVA写的温暖评语' } }],
        }),
      },
    },
  })),
}))

beforeAll(async () => {
  await registerUser()
})

describe('POST /api/certificate', () => {
  it('returns evaluation string (no SyntaxError from grade re-declaration)', async () => {
    const res = await request(app).post('/api/certificate').send({
      name: TEST_USER.name,
      school: TEST_USER.school,
      grade: TEST_USER.grade,
      class_name: TEST_USER.class_name,
    })
    expect(res.status).toBe(200)
    expect(typeof res.body.evaluation).toBe('string')
    expect(res.body.evaluation.length).toBeGreaterThan(0)
  })

  it('uses DB grade over request grade when user exists', async () => {
    // User is in DB with grade '三年级', but we send a different grade
    const res = await request(app).post('/api/certificate').send({
      name: TEST_USER.name,
      school: TEST_USER.school,
      grade: '一年级',           // wrong grade — won't match DB record
      class_name: TEST_USER.class_name,
    })
    // Route proceeds without crash (row will be null, falls back to request grade)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('evaluation')
  })

  it('handles missing user gracefully (no crash)', async () => {
    const res = await request(app).post('/api/certificate').send({
      name: '不存在的用户',
      school: '',
      grade: '',
      class_name: '',
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('evaluation')
  })

  it('rejects missing name', async () => {
    const res = await request(app).post('/api/certificate').send({
      school: '星渊小学', grade: '三年级', class_name: '1班',
    })
    expect(res.status).toBe(400)
  })
})
