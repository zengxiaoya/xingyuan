// 简单的基于内存的速率限制中间件
// 按 IP 限制，每分钟最多 60 次请求

const requestCounts = new Map(); // { ip: { count, resetTime } }

const WINDOW_MS = 60 * 1000; // 1 分钟窗口
const MAX_REQUESTS = 60;      // 每窗口最大请求数

export function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    // 新窗口
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      retryAfter,
    });
  }

  record.count += 1;
  return next();
}

// 定期清理过期条目，避免内存泄漏
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, WINDOW_MS);
