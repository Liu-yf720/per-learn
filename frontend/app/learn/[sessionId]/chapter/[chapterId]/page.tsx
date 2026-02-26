'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles, BookOpen, CheckCircle } from 'lucide-react';
import {
  getChapter,
  generateChapterContent,
  getProgress,
  updateProgress,
  getChapters
} from '@/lib/api';

interface Chapter {
  id: number;
  title: string;
  learning_goal: string;
  learning_method: string;
  duration_minutes: number;
  content: string;
  plan_id: number;
}

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const chapterId = params.chapterId as string;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  const loadChapter = async () => {
    try {
      const data = await getChapter(chapterId);
      setChapter(data);
      
      // 检查是否已完成
      const progress = await getProgress(sessionId);
      const completedArray = JSON.parse(progress.completed_chapters || '[]');
      setCompleted(completedArray.includes(parseInt(chapterId)));
    } catch (error) {
      console.error('Failed to load chapter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    setGenerating(true);
    try {
      const result = await generateChapterContent(chapterId);
      setChapter((prev) => prev ? { ...prev, content: result.content } : null);
    } catch (error) {
      console.error('Failed to generate content:', error);
      alert('生成学习内容失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      await updateProgress(sessionId, {
        completedChapters: [parseInt(chapterId)],
        status: 'in_progress'
      });
      setCompleted(true);
      
      // 尝试继续下一个章节
      try {
        const result = await (await import('@/lib/api')).continueLearning(sessionId);
        if (result.nextChapter) {
          router.push(`/learn/${sessionId}/chapter/${result.nextChapter.id}`);
        } else if (result.status === 'completed') {
          router.push(`/learn/${sessionId}`);
        }
      } catch {
        router.push(`/learn/${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  // 获取上一章和下一章
  const [prevChapter, setPrevChapter] = useState<number | null>(null);
  const [nextChapter, setNextChapter] = useState<number | null>(null);

  useEffect(() => {
    const fetchNavChapters = async () => {
      if (!chapter) return;
      try {
        const plans = await (await import('@/lib/api')).getPlans(sessionId);
        if (plans.length > 0) {
          const chapters = await getChapters(plans[0].id);
          const currentIndex = chapters.findIndex((c: any) => c.id === chapter.id);
          setPrevChapter(currentIndex > 0 ? chapters[currentIndex - 1].id : null);
          setNextChapter(currentIndex < chapters.length - 1 ? chapters[currentIndex + 1].id : null);
        }
      } catch (e) {
        console.error('Failed to fetch nav chapters:', e);
      }
    };
    fetchNavChapters();
  }, [chapter, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href={`/learn/${sessionId}`}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回课程
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Chapter Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <BookOpen className="w-4 h-4" />
            {chapter?.learning_method}
            <span>•</span>
            <span>约 {chapter?.duration_minutes} 分钟</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{chapter?.title}</h1>
          <p className="text-slate-600 mt-2">{chapter?.learning_goal}</p>
        </div>

        {/* Content */}
        {!chapter?.content ? (
          <div className="card text-center py-16">
            <Sparkles className="w-16 h-16 text-accent mx-auto mb-6" />
            <h2 className="text-xl font-semibold mb-3">准备开始学习</h2>
            <p className="text-slate-500 mb-8">
              点击下方按钮，AI 将生成本章的详细学习内容
            </p>
            <button
              onClick={handleGenerateContent}
              disabled={generating}
              className="btn-primary inline-flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI 正在生成内容...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成学习内容
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Content */}
            <div className="card prose prose-slate max-w-none">
              <div
                className="text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: chapter.content.replace(/\n/g, '<br>').replace(/^# (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>').replace(/^## (.+)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>').replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>').replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>') }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <div className="flex gap-3">
                {prevChapter && (
                  <Link
                    href={`/learn/${sessionId}/chapter/${prevChapter}`}
                    className="btn-secondary"
                  >
                    上一章
                  </Link>
                )}
                {nextChapter && (
                  <Link
                    href={`/learn/${sessionId}/chapter/${nextChapter}`}
                    className="btn-secondary"
                  >
                    下一章
                  </Link>
                )}
              </div>
              
              <div className="flex gap-3">
                <Link
                  href={`/learn/${sessionId}/chapter/${chapterId}/assessment`}
                  className="btn-secondary"
                >
                  章节评估
                </Link>
                <button
                  onClick={handleMarkComplete}
                  className={`btn-primary flex items-center gap-2 ${
                    completed ? 'bg-green-500 hover:bg-green-600' : ''
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  {completed ? '已完成' : '标记完成'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
