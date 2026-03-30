// 结业证书评语路由：POST /api/certificate
// 由 NOVA 为完成全部关卡的小朋友生成个性化结业评语

import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

function getKimiClient() {
  return new OpenAI({
    apiKey: process.env.KIMI_API_KEY,
    baseURL: process.env.KIMI_BASE_URL,
  });
}

const MODEL = () => process.env.KIMI_MODEL || 'kimi-k2';

router.post('/', async (req, res) => {
  const { name, grade, school, stars, badgeCount, scientistCount } = req.body;

  if (!name) {
    return res.status(400).json({ error: '缺少用户名' });
  }

  const userDesc = `${name}同学${grade ? `（${grade}）` : ''}${school ? `，就读于${school}` : ''}`;

  const prompt = `你是NOVA，星渊宇宙学院充满活力的AI船长。${userDesc}刚刚圆满完成了星渊宇宙探索学习平台的全部9个关卡，共通关了${badgeCount || 9}个关卡，解锁了${scientistCount || 0}位科学家，累计获得${stars || 0}颗星分。

请用温暖、鼓励、充满宇宙感的语言，为这位同学写一段结业评语（3-4句话，约80-100字）。要自然地提到这位同学的名字，表达你作为NOVA对他/她探索精神的由衷赞美，以及对他/她未来星际之旅的美好祝愿。语言要符合小学生的理解，充满想象力和星空感。直接输出评语文字，不要任何前缀、标签或引号。`;

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
