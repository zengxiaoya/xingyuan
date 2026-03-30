const BASE_URL = '/api'

/**
 * 获取题目
 * @param {string} levelId - 关卡ID
 * @param {string} type - 题目类型（如 'choice', 'fillblank', 'creative'）
 * @returns {Promise<object>} 题目数据
 */
export async function fetchQuiz(levelId, type) {
  const res = await fetch(`${BASE_URL}/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ levelId, type })
  })
  if (!res.ok) throw new Error('获取题目失败')
  return res.json()
}

/**
 * 评估答案
 * @param {string} levelId - 关卡ID
 * @param {string} question - 题目内容
 * @param {string} answer - 用户答案
 * @param {string} type - 题目类型
 * @returns {Promise<object>} 评估结果 { correct, feedback, stars }
 */
export async function evaluateAnswer(levelId, question, answer, type) {
  const res = await fetch(`${BASE_URL}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ levelId, question, answer, type })
  })
  if (!res.ok) throw new Error('评估失败')
  return res.json()
}

/**
 * SSE 流式聊天（Generator 函数，逐段 yield 文本）
 * @param {Array<{role: string, content: string}>} messages - 消息历史
 * @param {{ type: string, id: string|null }} context - 对话上下文
 * @param {{ name: string, grade: string, school: string }} userInfo - 用户信息
 * @yields {string} 文本片段
 */
export async function* streamChat(messages, context, userInfo) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context, userInfo })
  })

  if (!res.ok) throw new Error('聊天请求失败')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          if (parsed.text) yield parsed.text
        } catch {
          // 忽略无法解析的行
        }
      }
    }
  }

  // 处理缓冲区中剩余数据
  if (buffer.startsWith('data: ')) {
    const data = buffer.slice(6).trim()
    if (data && data !== '[DONE]') {
      try {
        const parsed = JSON.parse(data)
        if (parsed.text) yield parsed.text
      } catch {
        // 忽略无法解析的行
      }
    }
  }
}

/**
 * 生成 NOVA 结业评语
 * @param {{ name: string, grade: string, school: string }} userInfo
 * @param {{ stars: number, badgeCount: number, scientistCount: number }} progress
 * @returns {Promise<{ evaluation: string }>}
 */
export async function generateCertificateEvaluation(userInfo, progress) {
  const res = await fetch(`${BASE_URL}/certificate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...userInfo, ...progress })
  })
  if (!res.ok) throw new Error('生成评语失败')
  return res.json()
}
