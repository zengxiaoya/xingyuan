// NOVA 聊天路由：POST /api/chat
// SSE 流式输出，调用 Kimi API stream 模式与 NOVA 角色对话

import { Router } from 'express';
import OpenAI from 'openai';
import { getNovaSystemPrompt } from '../prompts/templates.js';

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
  const { messages, context, userInfo } = req.body;

  // 参数校验
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: '缺少参数：messages 为必填数组' });
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲（如有代理）
  res.flushHeaders();

  // 客户端真正断开时的清理标志
  // 注意：req.on('close') 在某些 Node.js 版本中会在请求体读完时就触发，
  // 必须改为监听底层 socket 的 close 事件来判断连接是否真正关闭
  let clientDisconnected = false;
  res.on('close', () => {
    clientDisconnected = true;
  });

  try {
    const client = getKimiClient();
    const systemPrompt = getNovaSystemPrompt(context || {}, userInfo || {});

    // 构造消息列表，插入系统提示
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // 调用 Kimi API 流式模式
    const stream = await client.chat.completions.create({
      model: MODEL(),
      messages: fullMessages,
      temperature: 0.8,
      max_tokens: 300,
      stream: true,
    });

    // 逐块发送 SSE 数据
    for await (const chunk of stream) {
      if (clientDisconnected) break;

      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
      }

      // 检测流结束信号
      const finishReason = chunk.choices[0]?.finish_reason;
      if (finishReason === 'stop' || finishReason === 'length') {
        break;
      }
    }

    // 发送完成标志
    if (!clientDisconnected) {
      res.write('data: [DONE]\n\n');
    }
    res.end();
  } catch (err) {
    console.error('[chat] API 调用失败:', err.message);

    if (!clientDisconnected) {
      // 发送错误信息给前端
      const errorMessage = err.status === 401
        ? 'API 密钥无效，请检查配置'
        : err.status === 429
          ? '请求太频繁啦，NOVA 需要休息一下，稍后再聊～'
          : 'NOVA 遇到了一点小问题，请稍后再试';

      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

export default router;
