import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export interface LearningPreferences {
  topic: string;
  currentLevel: string;
  learningStyle: 'theory' | 'practice' | 'mixed';
  lessonDuration: number;
}

export interface Chapter {
  title: string;
  learningGoal: string;
  learningMethod: string;
  durationMinutes: number;
  orderIndex: number;
}

export interface Assessment {
  questions: {
    type: 'question' | 'judgment' | 'practice';
    question: string;
    answer?: string;
    hint?: string;
  }[];
}

// 生成学习计划
export async function generateLearningPlan(prefs: LearningPreferences): Promise<{
  title: string;
  description: string;
  chapters: Chapter[];
}> {
  const prompt = `
你是一个专业的课程设计专家。请为以下学习需求设计一个个性化的学习计划。

学习主题: ${prefs.topic}
当前水平: ${prefs.currentLevel}
学习方式偏好: ${prefs.learningStyle === 'theory' ? '理论为主' : prefs.learningStyle === 'practice' ? '实践为主' : '理论+实践'}
单节课时长: ${prefs.lessonDuration}分钟

请生成一个结构化的学习计划，包含:
1. 课程标题 (简洁有力)
2. 课程描述 (简要说明)
3. 章节列表 (4-8个章节)，每个章节包含:
   - title: 章节标题
   - learningGoal: 学习目标
   - learningMethod: 学习方式
   - durationMinutes: 预计时长(分钟)
   - orderIndex: 顺序(从1开始)

请以JSON格式返回，格式如下:
{
  "title": "课程标题",
  "description": "课程描述",
  "chapters": [
    {
      "title": "章节1标题",
      "learningGoal": "学习目标",
      "learningMethod": "学习方式",
      "durationMinutes": 30,
      "orderIndex": 1
    }
  ]
}

请直接返回JSON，不要其他内容。
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}

// 生成章节学习内容
export async function generateChapterContent(
  topic: string,
  chapter: Chapter,
  level: string
): Promise<string> {
  const prompt = `
你是一位专业讲师。请为以下章节生成详细的学习内容。

学习主题: ${topic}
章节标题: ${chapter.title}
学习目标: ${chapter.learningGoal}
学习方式: ${chapter.learningMethod}
学习者水平: ${level}

请生成该章节的学习内容，包括:
1. 章节概述
2. 核心知识点讲解
3. 示例或步骤说明
4. 小结

内容要通俗易懂，适合${level}水平的学习者。
使用Markdown格式组织内容。
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  return response.choices[0]?.message?.content || '';
}

// 生成章节评估
export async function generateChapterAssessment(
  topic: string,
  chapter: Chapter,
  level: string
): Promise<Assessment> {
  const prompt = `
你是一位教育专家。请为以下章节生成评估题目。

学习主题: ${topic}
章节标题: ${chapter.title}
学习目标: ${chapter.learningGoal}
学习者水平: ${level}

请生成3-5道评估题目，包括:
- 简单问答题
- 关键概念判断题
- 或小实践任务

请以JSON格式返回，格式如下:
{
  "questions": [
    {
      "type": "question|judgment|practice",
      "question": "题目内容",
      "answer": "参考答案(可选)",
      "hint": "提示(可选)"
    }
  ]
}

请直接返回JSON，不要其他内容。
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  const content = response.choices[0]?.message?.content || '{"questions":[]}';
  return JSON.parse(content);
}

// 评估反馈
export async function generateAssessmentFeedback(
  topic: string,
  chapter: Chapter,
  userAnswers: string,
  level: string
): Promise<{
  feedback: string;
  status: 'mastered' | 'needs_review';
}> {
  const prompt = `
你是一位专业导师。请根据用户的回答给出评估反馈。

学习主题: ${topic}
章节标题: ${chapter.title}
学习目标: ${chapter.learningGoal}
学习者水平: ${level}

用户回答:
${userAnswers}

请给出:
1. 简要掌握情况说明
2. 结果状态: "mastered"(已掌握) 或 "needs_review"(需要复习)

请以JSON格式返回，格式如下:
{
  "feedback": "反馈内容",
  "status": "mastered|needs_review"
}

请直接返回JSON，不要其他内容。
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  const content = response.choices[0]?.message?.content || '{"feedback":"","status":"needs_review"}';
  return JSON.parse(content);
}
