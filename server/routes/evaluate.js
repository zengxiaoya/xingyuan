// 答案评估路由：POST /api/evaluate
// 对猜谜题进行语义判断，对创意题生成个性化正向反馈

import { Router } from 'express';
import OpenAI from 'openai';
import { getEvaluatePrompt, getCreativeFeedbackPrompt } from '../prompts/templates.js';

const router = Router();

// 初始化 Kimi 客户端
function getKimiClient() {
  return new OpenAI({
    apiKey: process.env.KIMI_API_KEY,
    baseURL: process.env.KIMI_BASE_URL,
  });
}

const MODEL = () => process.env.KIMI_MODEL || 'kimi-k2';

// ─── 路由处理 ─────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const { levelId, question, answer, type } = req.body;

  // 参数校验
  if (!levelId || !question || !answer || !type) {
    return res.status(400).json({ error: '缺少参数：levelId、question、answer、type 均为必填项' });
  }

  if (type !== 'guess' && type !== 'creative') {
    return res.status(400).json({ error: 'type 参数无效，必须是 guess 或 creative' });
  }

  // ─── 猜谜题：判断答案是否正确 ───────────────────────────────────────────────
  if (type === 'guess') {
    try {
      const client = getKimiClient();
      const systemPrompt = getEvaluatePrompt(levelId, question, answer);

      const completion = await client.chat.completions.create({
        model: MODEL(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '请评判这道猜谜题的答案，严格按 JSON 格式返回。' },
        ],
        temperature: 0.3, // 判断题需要更稳定的输出
        max_tokens: 200,
      });

      const rawContent = completion.choices[0]?.message?.content || '';
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('API 返回内容无法解析为 JSON');
      }

      const result = JSON.parse(jsonMatch[0]);

      // 确保返回格式正确
      return res.json({
        correct: Boolean(result.correct),
        feedback: result.feedback || (result.correct ? '答对了！太棒了！' : '再想想看，你能行的！'),
      });
    } catch (err) {
      console.error('[evaluate/guess] API 调用失败:', err.message);
      return res.json({
        correct: false,
        feedback: '网络好像出了点问题，再试试看？',
      });
    }
  }

  // ─── 创意题：生成个性化正向反馈 ─────────────────────────────────────────────
  if (type === 'creative') {
    try {
      const client = getKimiClient();
      const systemPrompt = getCreativeFeedbackPrompt(levelId, question, answer);

      const completion = await client.chat.completions.create({
        model: MODEL(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '请为小朋友的创意回答生成个性化反馈，严格按 JSON 格式返回。' },
        ],
        temperature: 0.9, // 创意反馈需要更多变化
        max_tokens: 200,
      });

      const rawContent = completion.choices[0]?.message?.content || '';
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('API 返回内容无法解析为 JSON');
      }

      const result = JSON.parse(jsonMatch[0]);

      return res.json({
        feedback: result.feedback || '你的想象力真棒！NOVA 很喜欢你的回答！',
      });
    } catch (err) {
      console.error('[evaluate/creative] API 调用失败:', err.message);
      return res.json({
        feedback: '你的想象力真棒！NOVA 很喜欢你的回答！',
      });
    }
  }
});

export default router;
