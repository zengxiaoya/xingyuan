# 星渊 XingYuan

> 光从深渊来 · 知识像星光 · 穿越亿万年的黑暗 · 照亮此刻的你

一款面向小学生的宇宙探索教育平台，通过「闯关游戏 + AI 对话」的方式，让孩子在游戏中学习太空知识。

![星渊 Logo](https://img.shields.io/badge/星渊-XingYuan-purple)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 项目简介

星渊是一款寓教于乐的 Web 应用，专为 6-10 岁小学生设计。孩子可以通过闯关游戏探索宇宙知识，与 AI 助手 NOVA 聊天交流，收集科学家名片和成就徽章，最终获得专属探索证书。

### ✨ 核心特性

- **沉浸式闯关**：3 大主题 × 3 个等级，共 9 个关卡，层层递进
- **AI 智能对话**：NOVA 船长在线陪伴，启发式引导，不直接给答案
- **科学家名人堂**：13 位伟大的太空探索者，通关解锁故事卡片
- **成就系统**：徽章收集 + 星星积分 + 创意答案回顾
- **专属证书**：羊皮纸烫金证书，印章随进度渐显

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- pnpm >= 8.x
- Anthropic API Key（用于 Claude API）

### 安装依赖

```bash
# 安装根目录依赖
pnpm install

# 安装所有子项目依赖
pnpm install:all
```

### 配置环境变量

在项目根目录创建 `.env` 文件：

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
NODE_ENV=development
```

### 运行项目

```bash
# 同时启动前后端（推荐）
pnpm dev

# 或分别运行
pnpm dev:server  # 仅后端：http://localhost:3001
pnpm dev:client  # 仅前端：http://localhost:5173
```

详细运行说明请查看 [RUN.md](./RUN.md)

---

## 📁 项目结构

```
xingyuan/
├── client/                 # 前端 React + Vite
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   ├── store/         # Zustand 状态管理
│   │   ├── data/          # 关卡/科学家数据
│   │   └── utils/         # 工具函数
│   └── package.json
├── server/                # 后端 Node.js + Express
│   ├── index.js           # 入口文件
│   ├── routes/            # API 路由
│   ├── prompts/           # AI 提示词
│   └── package.json
├── nginx/                 # Nginx 配置
├── docker-compose.yml     # Docker 编排
└── package.json           # 根目录配置
```

---

## 🎮 功能模块

| 模块 | 说明 |
|------|------|
| 登录开场 | 6 幕沉浸式开场序列，收集用户信息 |
| 星图总览 | 动态星球地图，展示 9 个关卡进度 |
| 星际闯关 | 3 主题 × 3 等级，跨主题解锁，每关 3 道题 |
| NOVA 对话 | 全局 AI 对话，动态表情头像，全屏弹出 |
| 科学家名人堂 | 通关解锁，名片卡片展示，共 13 位 |
| 个人成就页 | 数据统计 + 徽章收集 + 创意答案回顾 |
| 星渊证书 | 羊皮纸烫金正式证书，印章渐显机制 |

---

## 🎯 关卡体系

### 解锁机制

```
第一阶段（默认全开）
├── 太阳系 Lv1：行星基本知识
├── 宇宙探索 Lv1：宇航员和火箭
└── 宇宙尺度 Lv1：星系和光年

↓ 三个 Lv1 全部通关 → 解锁第二阶段

第二阶段
├── 太阳系 Lv2：探测器和人类探索
├── 宇宙探索 Lv2：空间站和太空生活
└── 宇宙尺度 Lv2：黑洞和星云

↓ 三个 Lv2 全部通关 → 解锁第三阶段

第三阶段
├── 太阳系 Lv3：极端环境和生命可能性
├── 宇宙探索 Lv3：未来星际移民
└── 宇宙尺度 Lv3：宇宙大爆炸
```

### 题型结构

每关包含 3 道题：
1. **选择题**：4 选 1，有明确对错
2. **猜谜题**：AI 出谜面，自然语言作答
3. **创意题**：无标准答案，AI 给个性化反馈

---

## 🎨 技术栈

### 前端
- React 18.3.1
- Vite 5.3.1
- React Router v6
- Zustand（状态管理）
- 纯 CSS + CSS 变量

### 后端
- Node.js + Express（ESM 模块）
- Claude API（流式输出）
- CORS 跨域支持

### 部署
- Docker + Docker Compose
- Nginx 反向代理

---

## 🔧 常用命令

```bash
# 依赖安装
pnpm install              # 安装根目录依赖
pnpm install:all          # 安装所有子项目依赖

# 开发运行
pnpm dev                  # 同时运行前后端
pnpm dev:server           # 仅运行后端
pnpm dev:client           # 仅运行前端

# 构建
pnpm build                # 构建前端生产版本
pnpm --filter client preview  # 预览生产构建
```

---

## 📖 相关文档

- [RUN.md](./RUN.md) - 详细运行说明
- [技术开发方案.md](./技术开发方案.md) - 完整技术实现方案
- [需求设计方案.md](./需求设计方案.md) - 产品需求文档
- [README-DEPLOY.md](./README-DEPLOY.md) - 部署文档
- [DEPLOY.md](./DEPLOY.md) - 服务器部署指南

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 开源协议

本项目采用 MIT 协议开源。

---

## 🙏 致谢

星渊的故事源自一个二年级小朋友和爸爸一起探索宇宙的梦想。用代码丈量星辰大海，让知识像星光一样照亮每一个孩子。

---

<p align="center">
  <b>星渊 XingYuan</b> · 让孩子爱上探索宇宙
</p>
