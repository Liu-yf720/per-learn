# DerSonaUCV - 个性化学习平台

## 1. Project Overview

**Project Name:** DerSonaUCV  
**Type:** Full-stack Web Application  
**Frontend:** Next.js (App Router)  
**Backend:** Node.js + Express + SQLite  
**Description:** AI驱动的个性化学习平台，帮助用户从输入学习需求到获得完整的学习计划、内容和评估。

---

## 2. Tech Stack

### Frontend
- Next.js 14+ (App Router)
- React 18
- TypeScript
- Tailwind CSS (via tailwind-design-system skill)
- Shadcn UI components

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- OpenAI API (GPT-4) for content generation

### Dev Tools
- Git for version control
- Concurrent dev servers (concurrently)

---

## 3. UI/UX Specification

### Color Palette
- **Primary:** #6366F1 (Indigo-500)
- **Primary Dark:** #4F46E5 (Indigo-600)
- **Secondary:** #10B981 (Emerald-500)
- **Accent:** #F59E0B (Amber-500)
- **Background:** #F8FAFC (Slate-50)
- **Surface:** #FFFFFF
- **Text Primary:** #1E293B (Slate-800)
- **Text Secondary:** #64748B (Slate-500)
- **Border:** #E2E8F0 (Slate-200)
- **Success:** #22C55E (Green-500)
- **Warning:** #EAB308 (Yellow-500)
- **Error:** #EF4444 (Red-500)

### Typography
- **Font Family:** "Inter", system-ui, sans-serif
- **Headings:** 
  - H1: 2.5rem (40px), font-weight: 700
  - H2: 2rem (32px), font-weight: 600
  - H3: 1.5rem (24px), font-weight: 600
- **Body:** 1rem (16px), font-weight: 400
- **Small:** 0.875rem (14px)

### Layout
- Max content width: 1200px
- Sidebar width: 280px
- Card padding: 24px
- Section gap: 32px

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 4. Database Schema (SQLite)

### Tables

```sql
-- 用户学习会话
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  current_level TEXT,
  learning_style TEXT,
  lesson_duration INTEGER DEFAULT 30,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学习计划（课程大纲）
CREATE TABLE plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- 章节
CREATE TABLE chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  learning_goal TEXT,
  learning_method TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL,
  content TEXT,
  assessment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- 学习进度
CREATE TABLE progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  current_chapter_id INTEGER,
  completed_chapters TEXT DEFAULT '[]', -- JSON array of chapter IDs
  status TEXT DEFAULT 'in_progress', -- not_started, in_progress, completed
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- 章节评估结果
CREATE TABLE assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL,
  user_answer TEXT,
  ai_feedback TEXT,
  status TEXT DEFAULT 'pending', -- pending, mastered, needs_review
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
```

---

## 5. API Endpoints

### Sessions
- `POST /api/sessions` - 创建新学习会话
- `GET /api/sessions` - 获取所有会话
- `GET /api/sessions/:id` - 获取会话详情

### Plans
- `GET /api/sessions/:sessionId/plans` - 获取学习计划
- `POST /api/sessions/:sessionId/plans` - AI 生成学习计划

### Chapters
- `GET /api/plans/:planId/chapters` - 获取章节列表
- `GET /api/chapters/:id` - 获取章节详情（含内容）
- `POST /api/chapters/:id/content` - AI 生成章节内容
- `POST /api/chapters/:id/assessment` - AI 生成评估题目

### Progress
- `GET /api/sessions/:sessionId/progress` - 获取学习进度
- `PUT /api/sessions/:sessionId/progress` - 更新学习进度
- `POST /api/progress/continue` - 继续学习

### Assessments
- `POST /api/chapters/:id/submit-assessment` - 提交评估答案
- `GET /api/chapters/:id/assessment-result` - 获取评估结果

---

## 6. Page Structure

### Pages
1. **首页** (`/`) - 学习意图采集表单
2. **学习计划页** (`/learn/[sessionId]`) - 显示学习计划和大纲
3. **学习内容页** (`/learn/[sessionId]/chapter/[chapterId]`) - 章节学习内容
4. **评估页** (`/learn/[sessionId]/chapter/[chapterId]/assessment`) - 章节评估
5. **进度页** (`/progress`) - 学习进度概览
6. **历史页** (`/history`) - 历史学习记录

---

## 7. Features (MVP)

### 1. 学习意图采集
- [x] 学习主题输入框
- [x] 当前水平选择（初学者/入门/进阶/精通）
- [x] 学习方式偏好（理论/实践/理论+实践）
- [x] 单节课时长选择（15/30/45/60分钟）

### 2. 个性化学习计划生成
- [x] AI 自动生成课程大纲
- [x] 课程 → 章节结构
- [x] 每章节包含：学习目标、学习方式、预计时长
- [x] 按顺序学习（不可编辑）

### 3. 学习内容生成
- [x] 点击章节时 AI 即时生成内容
- [x] 文本讲解
- [x] 示例/步骤说明
- [x] 支持顺序学习

### 4. 学习进度记录
- [x] 自动记录已完成章节
- [x] 当前学习位置
- [x] 支持中断后继续

### 5. 学习效果评估
- [x] 章节级评估（问答/判断/实践）
- [x] AI 输出反馈
- [x] 结果状态：已掌握/需要复习
- [x] 用户自我确认

---

## 8. Acceptance Criteria

### Must Pass
1. ✅ 用户可以输入学习主题和相关参数创建学习会话
2. ✅ AI 能生成合理的课程大纲和章节
3. ✅ 用户可以按顺序学习各章节内容
4. ✅ 系统正确记录和显示学习进度
5. ✅ 每个章节完成后可以进行评估
6. ✅ AI 能给出评估反馈

### Visual Checkpoints
1. 首页表单清晰易用
2. 计划页面展示清晰的大纲结构
3. 学习内容页面阅读体验良好
4. 进度页面一目了然

---

## 9. Project Structure

```
dersona-ucv/
├── frontend/                 # Next.js 前端
│   ├── app/
│   │   ├── page.tsx         # 首页
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── learn/
│   │   │   └── [sessionId]/
│   │   │       ├── page.tsx
│   │   │       └── chapter/
│   │   │           └── [chapterId]/
│   │   │               ├── page.tsx
│   │   │               └── assessment/
│   │   │                   └── page.tsx
│   │   ├── progress/
│   │   │   └── page.tsx
│   │   └── history/
│   │       └── page.tsx
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── tailwind.config.ts
├── backend/                  # Node.js 后端
│   ├── src/
│   │   ├── index.ts
│   │   ├── db.ts
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── dercona.db           # SQLite 数据库
└── package.json             # 根目录 concurrently
```

---

## 10. Environment Variables

### Backend (.env)
```
PORT=3001
DATABASE_PATH=./dercona.db
OPENAI_API_KEY=your-openai-api-key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
