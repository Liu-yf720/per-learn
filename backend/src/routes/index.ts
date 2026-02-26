import { Router, Request, Response } from 'express';
import db from '../db.js';
import {
  generateLearningPlan,
  generateChapterContent,
  generateChapterAssessment,
  generateAssessmentFeedback
} from '../services/ai.js';

const router = Router();

// 创建新学习会话
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { topic, currentLevel, learningStyle, lessonDuration } = req.body;

    if (!topic) {
      return res.status(400).json({ error: '学习主题不能为空' });
    }

    // 创建会话
    const insertSession = db.prepare(`
      INSERT INTO sessions (topic, current_level, learning_style, lesson_duration)
      VALUES (?, ?, ?, ?)
    `);
    const result = insertSession.run(topic, currentLevel || '入门', learningStyle || 'mixed', lessonDuration || 30);
    const sessionId = result.lastInsertRowid;

    // 创建进度记录
    const insertProgress = db.prepare(`
      INSERT INTO progress (session_id, status)
      VALUES (?, 'not_started')
    `);
    insertProgress.run(sessionId);

    res.json({ id: sessionId, topic });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: '创建会话失败' });
  }
});

// 获取所有会话
router.get('/sessions', (req: Request, res: Response) => {
  try {
    const sessions = db.prepare(`
      SELECT s.*, p.status as progress_status, p.current_chapter_id
      FROM sessions s
      LEFT JOIN progress p ON s.id = p.session_id
      ORDER BY s.created_at DESC
    `).all();
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: '获取会话失败' });
  }
});

// 获取会话详情
router.get('/sessions/:id', (req: Request, res: Response) => {
  try {
    const session = db.prepare(`
      SELECT s.*, p.status as progress_status, p.current_chapter_id, p.completed_chapters
      FROM sessions s
      LEFT JOIN progress p ON s.id = p.session_id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!session) {
      return res.status(404).json({ error: '会话不存在' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: '获取会话失败' });
  }
});

// 获取学习计划
router.get('/sessions/:sessionId/plans', (req: Request, res: Response) => {
  try {
    const plans = db.prepare(`
      SELECT * FROM plans WHERE session_id = ? ORDER BY created_at DESC
    `).all(req.params.sessionId);
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: '获取学习计划失败' });
  }
});

// AI 生成学习计划
router.post('/sessions/:sessionId/plans', async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as any;

    if (!session) {
      return res.status(404).json({ error: '会话不存在' });
    }

    const planData = await generateLearningPlan({
      topic: session.topic,
      currentLevel: session.current_level,
      learningStyle: session.learning_style,
      lessonDuration: session.lesson_duration
    });

    // 保存计划
    const insertPlan = db.prepare(`
      INSERT INTO plans (session_id, title, description)
      VALUES (?, ?, ?)
    `);
    const planResult = insertPlan.run(sessionId, planData.title, planData.description);
    const planId = planResult.lastInsertRowid;

    // 保存章节
    const insertChapter = db.prepare(`
      INSERT INTO chapters (plan_id, title, learning_goal, learning_method, duration_minutes, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const chapter of planData.chapters) {
      insertChapter.run(
        planId,
        chapter.title,
        chapter.learningGoal,
        chapter.learningMethod,
        chapter.durationMinutes,
        chapter.orderIndex
      );
    }

    // 更新进度状态
    db.prepare(`
      UPDATE progress SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `).run(sessionId);

    // 返回完整计划
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);
    const chapters = db.prepare(`
      SELECT * FROM chapters WHERE plan_id = ? ORDER BY order_index
    `).all(planId);

    res.json({ ...plan, chapters });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: '生成学习计划失败' });
  }
});

// 获取章节列表
router.get('/plans/:planId/chapters', (req: Request, res: Response) => {
  try {
    const chapters = db.prepare(`
      SELECT * FROM chapters WHERE plan_id = ? ORDER BY order_index
    `).all(req.params.planId);
    res.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: '获取章节失败' });
  }
});

// 获取章节详情
router.get('/chapters/:id', (req: Request, res: Response) => {
  try {
    const chapter = db.prepare(`
      SELECT c.*, p.title as plan_title, s.topic as session_topic, s.current_level
      FROM chapters c
      JOIN plans p ON c.plan_id = p.id
      JOIN sessions s ON p.session_id = s.id
      WHERE c.id = ?
    `).get(req.params.id) as any;

    if (!chapter) {
      return res.status(404).json({ error: '章节不存在' });
    }
    res.json(chapter);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ error: '获取章节失败' });
  }
});

// AI 生成章节内容
router.post('/chapters/:id/content', async (req: Request, res: Response) => {
  try {
    const chapterId = parseInt(req.params.id);
    const chapter = db.prepare(`
      SELECT c.*, p.title as plan_title, s.topic as session_topic, s.current_level
      FROM chapters c
      JOIN plans p ON c.plan_id = p.id
      JOIN sessions s ON p.session_id = s.id
      WHERE c.id = ?
    `).get(chapterId) as any;

    if (!chapter) {
      return res.status(404).json({ error: '章节不存在' });
    }

    // 如果已有内容，直接返回
    if (chapter.content) {
      return res.json({ content: chapter.content });
    }

    const content = await generateChapterContent(
      chapter.session_topic,
      {
        title: chapter.title,
        learningGoal: chapter.learning_goal,
        learningMethod: chapter.learning_method,
        durationMinutes: chapter.duration_minutes,
        orderIndex: chapter.order_index
      },
      chapter.current_level
    );

    // 保存内容
    db.prepare('UPDATE chapters SET content = ? WHERE id = ?').run(content, chapterId);

    // 更新进度
    db.prepare(`
      UPDATE progress 
      SET current_chapter_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE session_id = (SELECT session_id FROM plans WHERE id = (SELECT plan_id FROM chapters WHERE id = ?))
    `).run(chapterId, chapterId);

    res.json({ content });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: '生成学习内容失败' });
  }
});

// AI 生成章节评估
router.post('/chapters/:id/assessment', async (req: Request, res: Response) => {
  try {
    const chapterId = parseInt(req.params.id);
    const chapter = db.prepare(`
      SELECT c.*, p.title as plan_title, s.topic as session_topic, s.current_level
      FROM chapters c
      JOIN plans p ON c.plan_id = p.id
      JOIN sessions s ON p.session_id = s.id
      WHERE c.id = ?
    `).get(chapterId) as any;

    if (!chapter) {
      return res.status(404).json({ error: '章节不存在' });
    }

    // 如果已有评估，直接返回
    if (chapter.assessment) {
      return res.json({ assessment: JSON.parse(chapter.assessment) });
    }

    const assessment = await generateChapterAssessment(
           {
        title: chapter.title,
        learningGoal: chapter.learning_goal,
        learningMethod: chapter.learning_method,
        durationMinutes: chapter.duration_minutes,
        orderIndex: chapter.order_index
      },
      chapter.current_level
    );

    // 保存评估
    db.prepare('UPDATE chapters SET assessment = ? WHERE id = ?').run(
      JSON.stringify(assessment),
      chapterId
    );

    res.json({ assessment });
  } catch (error) {
    console.error('Error generating assessment:', error);
    res.status(500).json({ error: '生成评估失败' });
  }
});

// 提交评估答案
router.post('/chapters/:id/submit-assessment', async (req: Request, res: Response) => {
  try {
    const chapterId = parseInt(req.params.id);
    const { userAnswer } = req.body;

    const chapter = db.prepare(`
      SELECT c.*, p.title as plan_title, s.topic as session_topic, s.current_level
      FROM chapters c
      JOIN plans p ON c.plan_id = p.id
      JOIN sessions s ON p.session_id = s.id
      WHERE c.id = ?
    `).get(chapterId) as any;

    if (!chapter) {
      return res.status(404).json({ error: '章节不存在' });
    }

    const feedback = await generateAssessmentFeedback(
      chapter.session_topic,
      {
        title: chapter.title,
        learningGoal: chapter.learning_goal,
        learningMethod: chapter.learning_method,
        durationMinutes: chapter.duration_minutes,
        orderIndex: chapter.order_index
      },
      userAnswer,
      chapter.current_level
    );

    // 保存评估结果
    const insertAssessment = db.prepare(`
      INSERT INTO assessments (chapter_id, user_answer, ai_feedback, status)
      VALUES (?, ?, ?, ?)
    `);
    insertAssessment.run(chapterId, userAnswer, feedback.feedback, feedback.status);

    res.json(feedback);
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ error: '提交评估失败' });
  }
});

// 获取评估结果
router.get('/chapters/:id/assessment-result', (req: Request, res: Response) => {
  try {
    const assessment = db.prepare(`
      SELECT * FROM assessments WHERE chapter_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(req.params.id);

    res.json(assessment || null);
  } catch (error) {
    console.error('Error fetching assessment result:', error);
    res.status(500).json({ error: '获取评估结果失败' });
  }
});

// 获取学习进度
router.get('/sessions/:sessionId/progress', (req: Request, res: Response) => {
  try {
    const progress = db.prepare(`
      SELECT p.*, s.topic, s.current_level
      FROM progress p
      JOIN sessions s ON p.session_id = s.id
      WHERE p.session_id = ?
    `).get(req.params.sessionId);

    if (!progress) {
      return res.status(404).json({ error: '进度不存在' });
    }

    // 获取计划信息
    const plan = db.prepare(`
      SELECT id, title FROM plans WHERE session_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(req.params.sessionId) as any;

    // 获取章节信息
    let chapters = [];
    if (plan) {
      chapters = db.prepare(`
        SELECT id, title, order_index FROM chapters WHERE plan_id = ? ORDER BY order_index
      `).all(plan.id);
    }

    res.json({ ...progress, plan, chapters });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: '获取进度失败' });
  }
});

// 更新学习进度（标记章节完成）
router.put('/sessions/:sessionId/progress', (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const { completedChapters, currentChapterId, status } = req.body;

    const progress = db.prepare('SELECT * FROM progress WHERE session_id = ?').get(sessionId) as any;

    if (!progress) {
      return res.status(404).json({ error: '进度不存在' });
    }

    let completed = JSON.parse(progress.completed_chapters || '[]');
    if (completedChapters) {
      completed = [...new Set([...completed, ...completedChapters])];
    }

    db.prepare(`
      UPDATE progress 
      SET completed_chapters = ?, current_chapter_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `).run(
      JSON.stringify(completed),
      currentChapterId || progress.current_chapter_id,
      status || progress.status,
      sessionId
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: '更新进度失败' });
  }
});

// 继续学习（获取下一个未完成的章节）
router.post('/progress/continue', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    const progress = db.prepare('SELECT * FROM progress WHERE session_id = ?').get(sessionId) as any;
    if (!progress) {
      return res.status(404).json({ error: '进度不存在' });
    }

    const completed = JSON.parse(progress.completed_chapters || '[]');

    // 获取计划
    const plan = db.prepare(`
      SELECT id FROM plans WHERE session_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(sessionId) as any;

    if (!plan) {
      return res.json({ status: 'no_plan' });
    }

    // 获取下一个未完成的章节
    const nextChapter = db.prepare(`
      SELECT id, title, order_index FROM chapters 
      WHERE plan_id = ? AND id NOT IN (${completed.length ? completed.join(',') : '0'})
      ORDER BY order_index LIMIT 1
    `).get(plan.id);

    if (!nextChapter) {
      // 所有章节已完成
      db.prepare(`
        UPDATE progress SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `).run(sessionId);
      return res.json({ status: 'completed' });
    }

    res.json({ nextChapter, status: 'in_progress' });
  } catch (error) {
    console.error('Error continuing:', error);
    res.status(500).json({ error: '继续学习失败' });
  }
});

export default router;
