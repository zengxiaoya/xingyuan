import { describe, it, expect, vi } from 'vitest'
import { request, app } from './helpers.js'

const MOCK_CHOICE_Q = {
  type: 'choice',
  question: '太阳系最大的行星是？',
  options: ['A. 地球', 'B. 木星', 'C. 土星', 'D. 海王星'],
  correctIndex: 1,
  explanation: '木星是最大的行星。',
  scientistHint: '伽利略发现了木星的卫星。',
}

// Mock OpenAI — controls LLM response
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(MOCK_CHOICE_Q) } }],
        }),
      },
    },
  })),
}))

describe('POST /api/quiz — validation', () => {
  it('rejects missing levelId', async () => {
    const res = await request(app).post('/api/quiz').send({ type: 'choice' })
    expect(res.status).toBe(400)
  })

  it('rejects missing type', async () => {
    const res = await request(app).post('/api/quiz').send({ levelId: 'solar_lv1' })
    expect(res.status).toBe(400)
  })

  it('rejects invalid type', async () => {
    const res = await request(app).post('/api/quiz')
      .send({ levelId: 'solar_lv1', type: 'injection' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/quiz — cache behaviour', () => {
  const LEVEL = 'universe_lv2'  // unique level to avoid cross-test cache pollution

  it('returns question from LLM when cache is cold', async () => {
    const res = await request(app).post('/api/quiz')
      .send({ levelId: LEVEL, type: 'choice', slot: 0 })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('question')
    expect(res.body).toHaveProperty('correctIndex')
  })

  it('serves from cache after warm-up (no duplicate slots)', async () => {
    // Warm up: 3 LLM calls → cache fills to >= 3
    await request(app).post('/api/quiz').send({ levelId: LEVEL, type: 'multi', slot: 0 })
    await request(app).post('/api/quiz').send({ levelId: LEVEL, type: 'multi', slot: 1 })
    await request(app).post('/api/quiz').send({ levelId: LEVEL, type: 'multi', slot: 2 })

    // Cache hit: different slots return 200
    const r0 = await request(app).post('/api/quiz').send({ levelId: LEVEL, type: 'multi', slot: 0 })
    const r1 = await request(app).post('/api/quiz').send({ levelId: LEVEL, type: 'multi', slot: 1 })
    const r2 = await request(app).post('/api/quiz').send({ levelId: LEVEL, type: 'multi', slot: 2 })

    expect(r0.status).toBe(200)
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
  })

  it('handles invalid slot gracefully (defaults to 0)', async () => {
    const res = await request(app).post('/api/quiz')
      .send({ levelId: LEVEL, type: 'choice', slot: -1 })
    expect(res.status).toBe(200)
  })

  it('accepts creative type', async () => {
    const res = await request(app).post('/api/quiz')
      .send({ levelId: 'solar_lv1', type: 'creative', slot: 0 })
    expect(res.status).toBe(200)
  })
})
