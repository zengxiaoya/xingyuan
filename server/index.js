// 星渊后端服务主入口
// Express + Kimi API（OpenAI 兼容），支持 SSE 流式输出

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { rateLimiter } from './middleware/rateLimit.js';
import chatRouter from './routes/chat.js';
import quizRouter from './routes/quiz.js';
import evaluateRouter from './routes/evaluate.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── 中间件 ───────────────────────────────────────────────────────────────────

// CORS：允许前端开发服务器和所有来源访问
app.use(cors({
  origin: (origin, callback) => {
    // 允许 localhost 开发环境和生产环境
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://150.158.11.197',
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // 开发阶段允许所有来源
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error(`CORS 策略不允许来自 ${origin} 的请求`));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// JSON body parser（限制 1MB，防止超大请求）
app.use(express.json({ limit: '1mb' }));

// 全局速率限制
app.use(rateLimiter);

// ─── 路由 ─────────────────────────────────────────────────────────────────────

app.use('/api/chat', chatRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/evaluate', evaluateRouter);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '星渊后端服务',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ─── 全局错误处理中间件 ───────────────────────────────────────────────────────

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: `路由不存在：${req.method} ${req.path}` });
});

// 通用错误处理
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[全局错误]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── 启动服务器 ───────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║        星渊后端服务已启动            ║
╠══════════════════════════════════════╣
║  地址：http://localhost:${PORT}         ║
║  环境：${(process.env.NODE_ENV || 'development').padEnd(29)}║
║  模型：${(process.env.KIMI_MODEL || 'kimi-k2').padEnd(29)}║
╠══════════════════════════════════════╣
║  路由：                              ║
║    POST /api/chat     (SSE 流式)     ║
║    POST /api/quiz     (题目生成)     ║
║    POST /api/evaluate (答案评估)     ║
║    GET  /health       (健康检查)     ║
╚══════════════════════════════════════╝
  `);
});

export default app;
