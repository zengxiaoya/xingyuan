// 结业证书评语路由：POST /api/certificate
// 由 NOVA 为完成全部关卡的小朋友生成个性化结业评语

import { Router } from 'express';
import OpenAI from 'openai';
import db from '../db/index.js';

const router = Router();

function safeJSON(str, fallback) {
  try { return JSON.parse(str) } catch { return fallback }
}

function getKimiClient() {
  return new OpenAI({
    apiKey: process.env.KIMI_API_KEY,
    baseURL: process.env.KIMI_BASE_URL,
  });
}

const MODEL = () => process.env.KIMI_MODEL || 'kimi-k2';

router.post('/', async (req, res) => {
  const { name, school, grade, class_name } = req.body;

  if (!name) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  // 从数据库读取用户信息和进度（不信任前端传入的数据）
  const row = db.prepare(`
    SELECT u.grade, p.stars, p.badges, p.scientists, p.creative_answers
    FROM users u
    JOIN progress p ON p.user_id = u.id
    WHERE u.name = ? AND u.school = ? AND u.grade = ? AND u.class_name = ?
  `).get(name, school || '', grade || '', class_name || '');

  // DB 尚未同步时不阻断，用已有信息生成（无创意答案则跳过）
  const dbGrade = row?.grade || grade || '';
  const stars = row?.stars || 0;
  const badgeCount = safeJSON(row?.badges, []).length;
  const scientistCount = safeJSON(row?.scientists, []).length;
  const creativeAnswers = safeJSON(row?.creative_answers, {});

  const userDesc = `${name}同学${dbGrade ? `（${dbGrade}）` : ''}${school ? `，就读于${school}` : ''}`;

  // 按 key 排序保证顺序稳定
  const answers = Object.entries(creativeAnswers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .filter(Boolean);
  const answersText = answers.length > 0
    ? `\n\n这位同学在各关卡中留下了以下创意思考：\n${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
    : '';

  const prompt = `你是NOVA，星渊宇宙学院充满活力的AI船长。${userDesc}刚刚圆满完成了星渊宇宙探索学习平台的全部9个关卡，共通关了${badgeCount}个关卡，解锁了${scientistCount}位科学家，累计获得${stars}颗星分。${answersText}

请结合这位同学的实际回答内容，用温暖、鼓励、充满宇宙感的语言为他/她写一段结业评语（3-4句话，约80-100字）。要自然地提到这位同学的名字，可以点评他/她回答中体现出的某个特别的想法或闪光点，表达你作为NOVA对他/她探索精神的由衷赞美，以及对他/她未来星际之旅的美好祝愿。语言要符合小学生的理解，充满想象力和星空感。直接输出评语文字，不要任何前缀、标签或引号。`;

  try {
    const client = getKimiClient();
    const completion = await client.chat.completions.create({
      model: MODEL(),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 250,
    });

    const evaluation = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ evaluation });
  } catch (err) {
    console.error('[certificate] 生成评语失败:', err.message);
    res.status(500).json({ error: '生成评语失败' });
  }
});

export default router;
