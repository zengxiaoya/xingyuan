# 星渊项目运行文档

## 项目简介

星渊是一个面向小学生的宇宙探索教育平台，采用前后端分离架构：
- **前端**：React 18 + Vite + React Router + Zustand
- **后端**：Node.js + Express + Claude API

---

## 环境要求

- Node.js >= 18.x
- pnpm >= 8.x
- Anthropic API Key（用于 Claude API）

---

## 安装依赖

### 1. 安装根目录依赖

在项目根目录执行：

```bash
pnpm install
```

### 2. 安装子项目依赖

项目使用 pnpm workspace 管理多包，执行以下命令安装所有子项目依赖：

```bash
pnpm install:all
```

或者分别安装：

```bash
# 安装服务端依赖
pnpm --filter xingyuan-server install

# 安装客户端依赖
pnpm --filter xingyuan-client install
```

---

## 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
touch .env
```

在 `.env` 文件中添加以下内容：

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
NODE_ENV=development
```

**注意**：将 `your_api_key_here` 替换为你的 Anthropic API Key。

---

## 运行项目

### 方式一：同时运行前后端（推荐）

在项目根目录执行：

```bash
pnpm dev
```

这将同时启动：
- 前端开发服务器：http://localhost:5173
- 后端 API 服务：http://localhost:3001

### 方式二：分别运行前后端

**仅运行后端：**

```bash
pnpm dev:server
```

后端服务将运行在：http://localhost:3001

**仅运行前端：**

```bash
pnpm dev:client
```

前端服务将运行在：http://localhost:5173

---

## 构建生产版本

### 构建前端

```bash
pnpm build
```

构建产物将生成在 `client/dist` 目录。

### 本地预览生产构建

```bash
cd client
pnpm preview
```

---

## 目录结构说明

```
xingyuan/
├── client/                 # 前端 React 项目
│   ├── src/               # 源代码
│   ├── public/            # 静态资源
│   └── package.json       # 前端依赖配置
├── server/                # 后端 Node.js 项目
│   ├── index.js           # 入口文件
│   ├── routes/            # API 路由
│   └── package.json       # 后端依赖配置
├── nginx/                 # Nginx 配置文件
├── docker-compose.yml     # Docker 编排配置
├── pnpm-workspace.yaml    # pnpm workspace 配置
└── package.json           # 根目录配置
```

---

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装根目录依赖 |
| `pnpm install:all` | 安装所有子项目依赖 |
| `pnpm dev` | 同时启动前后端开发服务器 |
| `pnpm dev:server` | 仅启动后端 |
| `pnpm dev:client` | 仅启动前端 |
| `pnpm build` | 构建前端生产版本 |

---

## 注意事项

1. 确保 Node.js 版本 >= 18.x，否则可能运行失败
2. 运行前必须配置 `.env` 文件并填入有效的 Anthropic API Key
3. 首次运行前请确保已完成所有依赖安装
4. 前端默认端口：5173，后端默认端口：3001
5. 如遇端口冲突，可修改 `.env` 文件中的 `PORT` 变量

---

## 故障排查

### 端口被占用

如果端口 3001 或 5173 被占用，修改 `.env` 文件中的端口配置，或停止占用该端口的进程。

### 依赖安装失败

尝试清理缓存后重新安装：

```bash
rm -rf node_modules
rm -rf client/node_modules
rm -rf server/node_modules
pnpm install:all
```

### API 调用失败

检查 `.env` 文件中的 `ANTHROPIC_API_KEY` 是否正确配置。

---

## Docker 部署（可选）

项目支持使用 Docker 进行部署，详细部署步骤请参考 `README-DEPLOY.md` 文件。

---

祝使用愉快！🚀
