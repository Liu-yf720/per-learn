'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Sparkles } from 'lucide-react';
import { createSession } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    currentLevel: '入门',
    learningStyle: 'mixed',
    lessonDuration: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) return;

    setLoading(true);
    try {
      const session = await createSession(formData);
      router.push(`/learn/${session.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('创建学习会话失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            DerSonaUCV
          </h1>
          <p className="text-lg text-slate-600">
            AI 驱动的个性化学习平台
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            开始你的学习之旅
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 学习主题 */}
            <div>
              <label className="label">学习主题 *</label>
              <input
                type="text"
                className="input-field"
                placeholder="例如：Python 编程基础、机器学习、英语口语..."
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />
            </div>

            {/* 当前水平 */}
            <div>
              <label className="label">当前水平</label>
              <div className="grid grid-cols-4 gap-3">
                {['初学者', '入门', '进阶', '精通'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`py-2.5 px-4 rounded-lg border-2 transition-all ${
                      formData.currentLevel === level
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setFormData({ ...formData, currentLevel: level })}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* 学习方式 */}
            <div>
              <label className="label">学习方式偏好</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'theory', label: '📖 理论为主' },
                  { value: 'practice', label: '💻 实践为主' },
                  { value: 'mixed', label: '⚖️ 理论+实践' },
                ].map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    className={`py-2.5 px-4 rounded-lg border-2 transition-all ${
                      formData.learningStyle === style.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setFormData({ ...formData, learningStyle: style.value })}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 单节课时长 */}
            <div>
              <label className="label">单节课学习时长</label>
              <div className="grid grid-cols-4 gap-3">
                {[15, 30, 45, 60].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    className={`py-2.5 px-4 rounded-lg border-2 transition-all ${
                      formData.lessonDuration === duration
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setFormData({ ...formData, lessonDuration: duration })}
                  >
                    {duration} 分钟
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !formData.topic.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>生成中...</>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  开始学习
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>输入你的学习需求，AI 将为你生成个性化的学习计划</p>
        </div>
      </div>
    </div>
  );
}
