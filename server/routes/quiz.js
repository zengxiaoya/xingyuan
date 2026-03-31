// 题目生成路由：POST /api/quiz
// 根据关卡ID和题型调用 Kimi API 生成题目，失败时使用 fallback 数据

import { Router } from 'express';
import OpenAI from 'openai';
import { getQuizPrompt } from '../prompts/templates.js';
import db from '../db/index.js';

const router = Router();

// 初始化 Kimi 客户端（OpenAI 兼容接口）
function getKimiClient() {
  return new OpenAI({
    apiKey: process.env.KIMI_API_KEY,
    baseURL: process.env.KIMI_BASE_URL,
  });
}

const MODEL = () => process.env.KIMI_MODEL || 'kimi-k2';

// ─── Fallback 题库 ────────────────────────────────────────────────────────────
// 每个关卡×每种题型各一道，当 API 失败时使用

const FALLBACK_QUESTIONS = {
  solar_lv1: {
    choice: {
      type: 'choice',
      question: '太阳系中最大的行星是哪一颗？',
      options: ['A. 土星', 'B. 木星', 'C. 天王星', 'D. 海王星'],
      correctIndex: 1,
      explanation: '木星是太阳系中最大的行星，直径约为地球的11倍！',
      scientistHint: '伽利略用望远镜发现了木星的四颗卫星，称为伽利略卫星。',
    },
    guess: {
      type: 'guess',
      riddle: '我是太阳系的第六颗行星，戴着一顶由冰和岩石组成的美丽大环，从地球上看特别漂亮，你知道我是谁吗？',
      answer: '土星',
      hints: ['我的环非常宽阔壮观', '我的名字来自古罗马农神'],
    },
    creative: {
      type: 'creative',
      question: '如果你能乘坐宇宙飞船去太阳系中的任何一颗行星旅游，你会去哪里？为什么？',
      prompt: '想想那颗行星有什么特别的地方，比如它的大小、颜色、或者特殊的环境',
    },
    multi: {
      type: 'multi',
      question: '以下哪些是太阳系中的气态巨行星？',
      options: ['A. 木星', 'B. 地球', 'C. 土星', 'D. 火星'],
      correctIndices: [0, 2],
      explanation: '木星和土星都是气态巨行星，主要由氢和氦组成，体积巨大。地球和火星是岩石行星。',
      scientistHint: '伽利略用望远镜首先观察到木星的四颗卫星。',
    },
  },

  solar_lv2: {
    choice: {
      type: 'choice',
      question: '好奇号火星车是哪个国家发射的？',
      options: ['A. 中国', 'B. 俄罗斯', 'C. 美国', 'D. 欧洲'],
      correctIndex: 2,
      explanation: '好奇号是美国 NASA 于2011年发射的火星探测车，2012年成功登陆火星！',
      scientistHint: '好奇号发现了火星曾经存在液态水的证据。',
    },
    guess: {
      type: 'guess',
      riddle: '我是一艘飞得最远的探测器，已经飞出了太阳系，携带着地球人的问候唱片，在宇宙中孤独旅行了几十年。',
      answer: '旅行者号',
      hints: ['我发射于1977年', '我发现了木星和土星的很多秘密'],
    },
    creative: {
      type: 'creative',
      question: '如果你是探测器设计师，你想设计一个去哪里探索的探测器？它有什么特别的功能？',
      prompt: '可以想想太阳系里最神秘或最有趣的地方',
    },
    multi: {
      type: 'multi',
      question: '以下哪些是人类已发射的太空探测器？',
      options: ['A. 旅行者1号', 'B. 探测者9号', 'C. 好奇号', 'D. 新视野号'],
      correctIndices: [0, 2, 3],
      explanation: '旅行者1号、好奇号、新视野号都是真实存在的探测器，"探测者9号"是虚构的。',
      scientistHint: '旅行者1号已成为飞离太阳系最远的人造物体。',
    },
  },

  solar_lv3: {
    choice: {
      type: 'choice',
      question: '木星上著名的"大红斑"是什么？',
      options: ['A. 一座火山', 'B. 一片红色海洋', 'C. 一场持续的大风暴', 'D. 一块红色岩石'],
      correctIndex: 2,
      explanation: '木星大红斑是一场已经持续了数百年的超级风暴，大小比地球还大！',
      scientistHint: '大红斑的风速可以达到每小时500公里以上。',
    },
    guess: {
      type: 'guess',
      riddle: '我是土星的一颗卫星，表面有甲烷组成的湖泊和河流，科学家认为我可能藏着生命的秘密。',
      answer: '土卫六',
      hints: ['我也叫泰坦', '我有厚厚的大气层'],
    },
    creative: {
      type: 'creative',
      question: '如果木卫二的地下海洋里真的有生命，你觉得那里的生物会是什么样子的？',
      prompt: '想想没有阳光、压力很大的深海里，生命可能会长什么样',
    },
    multi: {
      type: 'multi',
      question: '太阳系中哪些天体被认为可能存在液态水？',
      options: ['A. 木卫二（欧罗巴）', 'B. 水星', 'C. 土卫二（恩克拉多斯）', 'D. 土卫六（泰坦）'],
      correctIndices: [0, 2, 3],
      explanation: '木卫二冰层下有地下海洋，土卫二有水蒸气喷泉，土卫六有液态甲烷湖（不是水但也是液体）。水星温度极端，不适合液态水存在。',
      scientistHint: '德雷克方程帮助科学家估算宇宙中文明的数量。',
    },
  },

  explore_lv1: {
    choice: {
      type: 'choice',
      question: '火箭能飞上太空，主要依靠什么原理？',
      options: ['A. 螺旋桨旋转', 'B. 喷出气体产生反推力', 'C. 太阳能驱动', 'D. 磁力悬浮'],
      correctIndex: 1,
      explanation: '火箭靠向后喷出高速气体，产生向前的反推力飞向太空，就像气球放气会飞走！',
      scientistHint: '齐奥尔科夫斯基是现代火箭理论的奠基人，被称为"航天之父"。',
    },
    guess: {
      type: 'guess',
      riddle: '我是一个速度，达到我就能绕着地球飞行不掉下来，科学家给我起了一个特别的名字叫"宇宙第一速度"。',
      answer: '第一宇宙速度',
      hints: ['大约是每秒7.9公里', '达到这个速度就能绕地球飞'],
    },
    creative: {
      type: 'creative',
      question: '如果你要成为宇航员，你觉得最需要准备什么？你会怎么训练自己？',
      prompt: '想想在太空里会遇到哪些挑战，比如失重、辐射、与家人分离……',
    },
    multi: {
      type: 'multi',
      question: '以下哪些是成为宇航员必须经历的训练？',
      options: ['A. 水下太空行走模拟', 'B. 马拉松比赛', 'C. 离心机高过载训练', 'D. 极端温度测试'],
      correctIndices: [0, 2, 3],
      explanation: '宇航员训练包括水下失重模拟、离心机8G过载、极端温度测试。马拉松不是标准训练科目。',
      scientistHint: '加加林是第一位进入太空的人类，他的训练非常严苛。',
    },
  },

  explore_lv2: {
    choice: {
      type: 'choice',
      question: '在太空空间站里，宇航员怎么喝水？',
      options: ['A. 用杯子直接喝', 'B. 用吸管从密封袋里吸', 'C. 直接接住漂浮的水球喝', 'D. 不需要喝水'],
      correctIndex: 1,
      explanation: '太空中没有重力，水会变成水球四处漂浮，所以宇航员要用吸管从密封袋里喝水。',
      scientistHint: '中国天宫空间站的宇航员也用同样的方式解决喝水问题。',
    },
    guess: {
      type: 'guess',
      riddle: '我是中国自己建造的太空家园，绕着地球飞行，宇航员在我这里生活、工作和做实验，我的名字里有"天"字。',
      answer: '天宫空间站',
      hints: ['我是中国独立建造的', '我由多个舱段组成'],
    },
    creative: {
      type: 'creative',
      question: '如果你在太空空间站住一个月，你最想带什么东西去？为什么？',
      prompt: '想想在太空里什么东西用不了，什么东西会很想念',
    },
    multi: {
      type: 'multi',
      question: '在太空失重环境中，以下哪些事情会发生？',
      options: ['A. 水会变成球形漂浮', 'B. 眼泪会正常流下', 'C. 睡觉需要固定自己', 'D. 肌肉会逐渐萎缩'],
      correctIndices: [0, 2, 3],
      explanation: '失重环境下水会凝成球形，眼泪不会流下而是粘在脸上，睡觉必须固定，长期失重导致肌肉萎缩。',
      scientistHint: '王亚平在天宫空间站开展了水球实验来演示失重现象。',
    },
  },

  explore_lv3: {
    choice: {
      type: 'choice',
      question: '人类想要移民火星，最大的挑战是什么？',
      options: ['A. 火星太冷太热', 'B. 没有适合呼吸的空气', 'C. 以上都是挑战', 'D. 距离太远路上无聊'],
      correctIndex: 2,
      explanation: '移民火星面临很多挑战：大气主要是二氧化碳无法呼吸、温度极端、辐射强烈、距离遥远。',
      scientistHint: '埃隆·马斯克的 SpaceX 正在研发星舰飞船，目标是载人前往火星。',
    },
    guess: {
      type: 'guess',
      riddle: '我是一艘巨大的火箭飞船，设计目标是把人类送到火星，我的名字和宇宙中的星星有关，SpaceX 正在建造我。',
      answer: '星舰',
      hints: ['英文名叫 Starship', '我是目前最大的火箭系统'],
    },
    creative: {
      type: 'creative',
      question: '如果人类在火星上建了一个城市，你觉得那里的学校会是什么样子的？',
      prompt: '想想火星上的重力比地球小、没有蓝天白云，这些会怎么影响学校的设计',
    },
    multi: {
      type: 'multi',
      question: '人类移民火星面临哪些挑战？',
      options: ['A. 宇宙辐射强烈', 'B. 火星太靠近太阳', 'C. 大气无法直接呼吸', 'D. 旅途约需7个月'],
      correctIndices: [0, 2, 3],
      explanation: '移民火星面临强宇宙辐射、二氧化碳大气无法呼吸、7个月旅程的挑战。火星实际上比地球离太阳更远。',
      scientistHint: 'SpaceX的星舰飞船设计目标就是把人类送往火星。',
    },
  },

  universe_lv1: {
    choice: {
      type: 'choice',
      question: '一光年大约是多远？',
      options: ['A. 光走一秒的距离', 'B. 光走一分钟的距离', 'C. 光走一年的距离', 'D. 光走一百年的距离'],
      correctIndex: 2,
      explanation: '一光年是光在真空中走一年的距离，约等于9.46万亿公里，非常非常远！',
      scientistHint: '距离太阳系最近的恒星"比邻星"约在4.2光年之外。',
    },
    guess: {
      type: 'guess',
      riddle: '我是地球所在的星系，像一个巨大的旋涡，有几千亿颗恒星，太阳只是我其中一颗普通的小星星。',
      answer: '银河系',
      hints: ['晴天夜晚能看到我像一条河', '我的直径约10万光年'],
    },
    creative: {
      type: 'creative',
      question: '宇宙如此巨大，你觉得在遥远的星系里，会有和我们人类一样的生命吗？',
      prompt: '想想宇宙里有那么多星星，每颗星星可能都有行星……',
    },
    multi: {
      type: 'multi',
      question: '以下哪些关于光年的说法是正确的？',
      options: ['A. 光年是距离单位', 'B. 一光年约9.46万亿公里', 'C. 光年是时间单位', 'D. 比邻星距我们约4.2光年'],
      correctIndices: [0, 1, 3],
      explanation: '光年是距离单位（不是时间），约等于9.46万亿公里，比邻星距我们约4.2光年。',
      scientistHint: '哈勃望远镜帮助我们看到了130多亿光年外的天体。',
    },
  },

  universe_lv2: {
    choice: {
      type: 'choice',
      question: '黑洞是由什么形成的？',
      options: ['A. 超大的行星爆炸后', 'B. 质量很大的恒星死亡后塌缩', 'C. 宇宙中的漩涡', 'D. 太阳燃烧完后'],
      correctIndex: 1,
      explanation: '当质量足够大的恒星走到生命终点时，会发生超新星爆炸，核心塌缩成黑洞。',
      scientistHint: '霍金发现了黑洞也会缓慢地"蒸发"，这被称为"霍金辐射"。',
    },
    guess: {
      type: 'guess',
      riddle: '我是宇宙中美丽的气体和尘埃云，新的恒星就在我的怀抱里诞生，我有时候像马头，有时候像鹰，你猜我是什么？',
      answer: '星云',
      hints: ['我是恒星的"摇篮"', '著名的有猎户座星云'],
    },
    creative: {
      type: 'creative',
      question: '如果你能乘坐宇宙飞船在黑洞旁边安全观察，你最想知道黑洞的什么秘密？',
      prompt: '想想黑洞能吸走光、时间在黑洞旁边会变慢……',
    },
    multi: {
      type: 'multi',
      question: '以下哪些关于黑洞的描述是正确的？',
      options: ['A. 连光都无法逃脱', 'B. 由大质量恒星死亡形成', 'C. 黑洞不会影响时间', 'D. 周围有事件视界'],
      correctIndices: [0, 1, 3],
      explanation: '黑洞引力极强连光都逃不掉，由大质量恒星坍缩形成，周围有事件视界。时间在黑洞附近会变慢，不是不受影响。',
      scientistHint: '霍金提出黑洞会发出微弱辐射，即"霍金辐射"。',
    },
  },

  universe_lv3: {
    choice: {
      type: 'choice',
      question: '科学家认为宇宙大约诞生于多少年前？',
      options: ['A. 46亿年前', 'B. 138亿年前', 'C. 10亿年前', 'D. 1000亿年前'],
      correctIndex: 1,
      explanation: '根据科学观测，宇宙大约在138亿年前的大爆炸中诞生，地球则形成于约46亿年前。',
      scientistHint: '乔治·伽莫夫是宇宙大爆炸理论的主要提出者之一。',
    },
    guess: {
      type: 'guess',
      riddle: '我是宇宙中神秘的存在，看不见也摸不着，但我占了宇宙质量的大部分，正是我让星系不至于飞散开来。',
      answer: '暗物质',
      hints: ['科学家用引力效应发现了我', '我和"暗能量"是宇宙的两大谜团'],
    },
    creative: {
      type: 'creative',
      question: '如果时间机器能带你回到宇宙大爆炸后的第一秒，你觉得你会看到什么？',
      prompt: '想想宇宙最初只是一个超级热的小点，然后迅速膨胀……',
    },
    multi: {
      type: 'multi',
      question: '以下哪些是大爆炸理论的有力证据？',
      options: ['A. 宇宙微波背景辐射', 'B. 宇宙正在膨胀', 'C. 太阳每天升起落下', 'D. 星系在彼此远离'],
      correctIndices: [0, 1, 3],
      explanation: '宇宙微波背景辐射是大爆炸余晖，宇宙膨胀和星系相互远离都支持大爆炸理论。太阳升落是地球自转现象，与大爆炸无关。',
      scientistHint: '勒梅特神父最早提出宇宙起源于一个"原始原子"的爆炸。',
    },
  },
};

// ─── 路由处理 ─────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const { levelId, type, slot = 0 } = req.body;

  // 参数校验
  if (!levelId || !type) {
    return res.status(400).json({ error: '缺少参数：levelId 和 type 为必填项' });
  }

  const validTypes = ['choice', 'guess', 'creative', 'multi'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type 参数无效，必须是 ${validTypes.join('/')} 之一` });
  }

  // ── 缓存优先 ────────────────────────────────────────────────────────────────
  // slot 参数使同一关卡同时请求多道同类题时返回不同条目，避免重复
  const cacheCount = db.prepare(
    'SELECT COUNT(*) AS cnt FROM quiz_cache WHERE level_id = ? AND type = ?'
  ).get(levelId, type).cnt;

  if (cacheCount >= 3) {
    const offset = Number.isInteger(slot) && slot >= 0 ? slot % cacheCount : 0;
    const cached = db.prepare(
      'SELECT question FROM quiz_cache WHERE level_id = ? AND type = ? ORDER BY id LIMIT 1 OFFSET ?'
    ).get(levelId, type, offset);
    try {
      return res.json(JSON.parse(cached.question));
    } catch {
      // 缓存数据损坏，降级到 LLM 生成
    }
  }

  // ── LLM 生成 ─────────────────────────────────────────────────────────────────
  try {
    const client = getKimiClient();
    const systemPrompt = getQuizPrompt(levelId, type);

    const completion = await client.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请为关卡 ${levelId} 生成一道 ${type} 类型的题目，严格按 JSON 格式返回。` },
      ],
      temperature: 0.8,
      max_tokens: 600,
    });

    const rawContent = completion.choices[0]?.message?.content || '';

    // 提取 JSON（Kimi 有时会在 JSON 外加说明文字）
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('API 返回内容无法解析为 JSON');
    }

    const question = JSON.parse(jsonMatch[0]);

    // 写入缓存，并修剪超出上限的旧条目（最多保留 10 条）
    db.prepare('INSERT INTO quiz_cache (level_id, type, question) VALUES (?, ?, ?)').run(
      levelId, type, JSON.stringify(question)
    );
    db.prepare(`
      DELETE FROM quiz_cache WHERE level_id = ? AND type = ? AND id NOT IN (
        SELECT id FROM quiz_cache WHERE level_id = ? AND type = ? ORDER BY created_at DESC LIMIT 10
      )
    `).run(levelId, type, levelId, type);

    return res.json(question);
  } catch (err) {
    console.error('[quiz] API 调用失败，使用 fallback 数据:', err.message);

    // 尝试 fallback
    const fallback = FALLBACK_QUESTIONS[levelId]?.[type];
    if (fallback) {
      return res.json({ ...fallback, _fallback: true });
    }

    // 连 fallback 都没有时返回通用错误
    return res.status(500).json({
      error: '题目生成失败，请稍后再试',
      detail: err.message,
    });
  }
});

export default router;
