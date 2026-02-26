'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { getSessions } from '@/lib/api';

interface Session {
  id: number;
  topic: string;
  current_level: string;
  learning_style: string;
  lesson_duration: number;
  progress_status: string;
  created_at: string;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">历史记录</h1>

        {sessions.length === 0 ? (
          <div className="card text-center py-16">
            <History className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h2 className="text-xl font-semibold mb-3">暂无历史记录</h2>
            <p className="text-slate-500">
              你的学习历史将显示在这里
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/learn/${session.id}`}
                className="card hover:shadow-md transition-shadow block"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-800">{session.topic}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                      <span className="px-2 py-0.5 bg-slate-100 rounded">
                        {session.current_level}
                      </span>
                      <span>
                        {session.learning_style === 'mixed' ? '理论+实践' : 
                         session.learning_style === 'theory' ? '理论' : '实践'}
                      </span>
                      <span>•</span>
                      <span>{session.lesson_duration}分钟/课</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      {new Date(session.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div>
                    {session.progress_status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : session.progress_status === 'in_progress' ? (
                      <span className="text-sm text-primary">进行中</span>
                    ) : (
                      <span className="text-sm text-slate-400">未开始</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
