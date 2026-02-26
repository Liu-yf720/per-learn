# DerSonaUCV - 个性化学习平台

AI 驱动的个性化学习平台，帮助用户从输入学习需求到获得完整的学习计划、内容和评估。

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![SQLite](https://img.shields.io/badge/SQLite-brightgreen)

## ✨ 功能特性

### MVP 功能
1. **学习意图采集** - 输入学习主题、当前水平、学习方式偏好、单节课时长
2. **个性化计划生成** - AI 自动生成课程大纲和章节
3. **学习内容生成** - AI 即时生成章节学习内容
4. **进度记录** - 自动记录已完成章节，支持中断后继续
5. **效果评估** - AI 生成评估题目，提供反馈

## 🛠️ 技术栈

- **前端**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + SQLite (better-sqlite3)
- **AI**: OpenAI GPT-4 API

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Liu-yf720/per-learn.git
cd per-learn
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 配置环境变量

在后端目录创建 `.env` 文件：

```env
PORT=3001
DATABASE_PATH=./dercona.db
OPENAI_API_KEY=your-openai-api-key
```

> 注意：你需要 OpenAI API Key 才能使用 AI 功能

### 4. 启动服务

**开发模式（推荐）**:

```bash
# 同时启动前后端
cd ..
npm run dev
```

**分别启动**:

```bash
# 终端1: 启动后端 (3001端口)
cd backend
npm run dev

# 终端2: 启动前端 (3002端口)
cd frontend
npm run dev
```

### 5. 访问应用

- 前端: http://localhost:3002
- 后端 API: http://localhost:3001

## 📁 项目结构

```
per-learn/
├── frontend/                 # Next.js 前端
│   ├── app/                 # App Router 页面
│   │   ├── page.tsx       # 首页 - 学习意图采集
│   │   ├── learn/         # 学习相关页面
│   │   ├── progress/      # 进度页面
│   │   └── history/       # 历史记录
│   ├── lib/               # 工具函数
│   └── package.json
├── backend/                 # Node.js 后端
│   ├── src/
│   │   ├── index.ts       # 入口文件
│   │   ├── db.ts          # 数据库初始化
│   │   ├── routes/        # API 路由
│   │   └── services/      # AI 服务
│   └── package.json
├── SPEC.md                 # 项目规格文档
└── package.json            # 根目录脚本
```

## 📡 API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/sessions` | 创建学习会话 |
| GET | `/api/sessions` | 获取所有会话 |
| GET | `/api/sessions/:id` | 获取会话详情 |
| POST | `/api/sessions/:id/plans` | AI 生成学习计划 |
| GET | `/api/plans/:id/chapters` | 获取章节列表 |
| POST | `/api/chapters/:id/content` | AI 生成章节内容 |
| POST | `/api/chapters/:id/assessment` | AI 生成评估 |
| POST | `/api/chapters/:id/submit-assessment` | 提交评估答案 |
| GET | `/api/sessions/:id/progress` | 获取学习进度 |
| PUT | `/api/sessions/:id/progress` | 更新学习进度 |

## 🔧 部署

### Vercel + Render/Railway

1. **前端**: 推送到 GitHub，连接到 Vercel 自动部署
2. **后端**: 部署到 Render/Railway，配置环境变量

## 📄 许可证

MIT License
