import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      DB_PATH: ':memory:',
      ADMIN_PASSWORD: 'testpass123',
      KIMI_API_KEY: 'test-key',
      KIMI_BASE_URL: 'http://localhost:19999',
    },
    pool: 'forks',    // 每个测试文件独立进程，避免端口/状态冲突
    forceExit: true,  // setInterval 不阻止退出
  },
})
