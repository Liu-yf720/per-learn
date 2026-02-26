'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Target, Loader2, CheckCircle } from 'lucide-react';
import { getSession, getPlans, generatePlan, getProgress, getChapters } from '@/lib/api';

interface Session {
  id: number;
  topic: string;
  current_level: string;
  learning_style: string;
  lesson_duration: number;
  progress_status: string;
}

interface Plan {
  id: number;
  title: string;
  description: string;
}

interface Chapter {
  id: number;
  title: string;
  learning_goal: string;
  learning_method: string;
  duration_minutes: number;
  order_index: number;
}

interface ProgressData {
  completed_chapters: string;
  current_chapter_id: number;
  status: string;
}

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadData = async () => {
    try {
      const sessionData = await getSession(sessionId);
      setSession(sessionData);

      const plans = await getPlans(sessionId);
      if (plans.length > 0) {
        setPlan(plans[0]);
        const chaptersData = await getChapters(plans[0].id);
        setChapters(chaptersData);
      }

      const progressData = await getProgress(sessionId);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const result = await generatePlan(sessionId);
      setPlan(result);
      setChapters(result.chapters || []);
      const progressData = await getProgress(sessionId);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('生成学习计划失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const completedArray = progress ? JSON.parse(progress.completed_chapters || '[]') : [];

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
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-slate-600 hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">{session?.topic}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span>当前水平：{session?.current_level}</span>
            <span>•</span>
            <span>学习方式：{session?.learning_style === 'mixed' ? '理论+实践' : session?.learning_style === 'theory' ? '理论' : '实践'}</span>
            <span>•</span>
            <span>每节 {session?.lesson_duration} 分钟</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!plan ? (
          /* No Plan Yet */
          <div className="card text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h2 className="text-xl font-semibold mb-3">准备开始学习</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              点击下方按钮，AI 将根据你的学习需求生成个性化的课程大纲和章节
            </p>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="btn-primary inline-flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI 正在生成学习计划...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成个性化学习计划
                </>
              )}
            </button>
          </div>
        ) : (
          /* Plan & Chapters */
          <div className="space-y-6">
            {/* Plan Info */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-2">{plan.title}</h2>
              <p className="text-slate-600">{plan.description}</p>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <BookOpen className="w-4 h-4" />
                  {chapters.length} 个章节
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  预计 {chapters.reduce((sum, c) => sum + (c.duration_minutes || 0), 0)} 分钟
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle className="w-4 h-4" />
                  已完成 {completedArray.length} / {chapters.length}
                </div>
              </div>
            </div>

            {/* Chapters */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">课程章节</h3>
              {chapters.map((chapter, index) => {
                const isCompleted = completedArray.includes(chapter.id);
                const isCurrent = progress?.current_chapter_id === chapter.id;

                return (
                  <div
                    key={chapter.id}
                    className={`card hover:shadow-md transition-shadow ${
                      isCurrent ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted
                              ? 'bg-green-100 text-green-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{chapter.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{chapter.learning_goal}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {chapter.learning_method}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {chapter.duration_minutes} 分钟
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/learn/${sessionId}/chapter/${chapter.id}`}
                        className={`btn-primary text-sm py-2 ${
                          isCompleted ? 'bg-green-500 hover:bg-green-600' : ''
                        }`}
                      >
                        {isCompleted ? '复习' : isCurrent ? '继续学习' : '开始学习'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
