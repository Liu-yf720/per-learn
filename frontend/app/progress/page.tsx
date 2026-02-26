'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { getSessions, getProgress, getPlans, getChapters } from '@/lib/api';

interface Session {
  id: number;
  topic: string;
  current_level: string;
  progress_status: string;
  created_at: string;
}

interface SessionWithProgress extends Session {
  progress?: {
    completed_chapters: string;
    status: string;
  };
  plan?: {
    id: number;
    title: string;
  };
  totalChapters?: number;
  completedCount?: number;
}

export default function ProgressPage() {
  const [sessions, setSessions] = useState<SessionWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const sessionsData = await getSessions();
      
      // 获取每个会话的详细信息
      const sessionsWithProgress = await Promise.all(
        sessionsData.map(async (session: Session) => {
          try {
            const progress = await getProgress(String(session.id));
            const plans = await getPlans(String(session.id));
            
            let totalChapters = 0;
            let completedCount = 0;
            
            if (plans.length > 0) {
              const chapters = await getChapters(plans[0].id);
              totalChapters = chapters.length;
              const completedArray = JSON.parse(progress.completed_chapters || '[]');
              completedCount = completedArray.length;
            }
            
            return {
              ...session,
              progress,
              plan: plans[0] || null,
              totalChapters,
              completedCount
            };
          } catch {
            return { ...session, totalChapters: 0, completedCount: 0 };
          }
        })
      );
      
      setSessions(sessionsWithProgress);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeSessions = sessions.filter(s => s.progress?.status !== 'completed');
  const completedSessions = sessions.filter(s => s.progress?.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">学习进度</h1>

        {sessions.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h2 className="text-xl font-semibold mb-3">暂无学习记录</h2>
            <p className="text-slate-500 mb-8">
              开始你的第一个学习计划吧！
            </p>
            <Link href="/" className="btn-primary inline-flex">
              开始学习
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active */}
            {activeSessions.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-700 mb-4">进行中</h2>
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/learn/${session.id}`}
                      className="card hover:shadow-md transition-shadow block"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-slate-800">{session.topic}</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {session.plan?.title || '等待生成计划...'}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(session.created_at).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {session.completedCount || 0}
                            <span className="text-sm font-normal text-slate-400">/{session.totalChapters || 0}</span>
                          </div>
                          <div className="w-24 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: session.totalChapters
                                  ? `${(session.completedCount || 0) / session.totalChapters * 100}%`
                                  : '0%'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedSessions.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  已完成
                </h2>
                <div className="space-y-4">
                  {completedSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/learn/${session.id}`}
                      className="card hover:shadow-md transition-shadow block opacity-75 hover:opacity-100"
                    >
                      <h3 className="font-medium text-slate-800">{session.topic}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {session.plan?.title}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
