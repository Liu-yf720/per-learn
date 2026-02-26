'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Send } from 'lucide-react';
import {
  getChapter,
  generateChapterAssessment,
  submitAssessment,
  getAssessmentResult
} from '@/lib/api';

interface Chapter {
  id: number;
  title: string;
  learning_goal: string;
}

interface Question {
  type: 'question' | 'judgment' | 'practice';
  question: string;
  answer?: string;
  hint?: string;
}

interface Assessment {
  questions: Question[];
}

interface AssessmentResult {
  id: number;
  ai_feedback: string;
  status: string;
}

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const chapterId = params.chapterId as string;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    loadData();
  }, [chapterId]);

  const loadData = async () => {
    try {
      const chapterData = await getChapter(chapterId);
      setChapter(chapterData);

      // 尝试获取已有评估
      if (chapterData.assessment) {
        setAssessment(JSON.parse(chapterData.assessment));
      }

      // 检查是否已有评估结果
      try {
        const existingResult = await getAssessmentResult(chapterId);
        if (existingResult) {
          setResult(existingResult);
        }
      } catch {
        // 没有评估结果
      }
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAssessment = async () => {
    setGenerating(true);
    try {
      const result = await generateChapterAssessment(chapterId);
      setAssessment(result.assessment);
    } catch (error) {
      console.error('Failed to generate assessment:', error);
      alert('生成评估题目失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    const answerText = Object.entries(answers)
      .map(([index, answer]) => `问题 ${parseInt(index) + 1}: ${answer}`)
      .join('\n\n');

    if (!answerText.trim()) {
      alert('请至少回答一个问题');
      return;
    }

    setSubmitting(true);
    try {
      const feedback = await submitAssessment(chapterId, answerText);
      setResult(feedback);
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('提交评估失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href={`/learn/${sessionId}/chapter/${chapterId}`}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回章节
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          章节评估：{chapter?.title}
        </h1>
        <p className="text-slate-500 mb-8">检验你的学习效果</p>

        {/* Result */}
        {result && (
          <div className={`card mb-8 ${result.status === 'mastered' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-start gap-4">
              {result.status === 'mastered' ? (
                <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-amber-500 flex-shrink-0" />
              )}
              <div>
                <h3 className={`font-semibold ${result.status === 'mastered' ? 'text-green-700' : 'text-amber-700'}`}>
                  {result.status === 'mastered' ? '🎉 已掌握' : '📚 需要复习'}
                </h3>
                <p className="text-slate-700 mt-2 whitespace-pre-wrap">{result.ai_feedback}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex gap-3">
              <Link
                href={`/learn/${sessionId}/chapter/${chapterId}`}
                className="btn-secondary text-sm"
              >
                复习章节内容
              </Link>
              <Link
                href={`/learn/${sessionId}`}
                className="btn-primary text-sm"
              >
                返回课程
              </Link>
            </div>
          </div>
        )}

        {/* Assessment */}
        {!assessment ? (
          <div className="card text-center py-16">
            <h2 className="text-xl font-semibold mb-3">开始评估</h2>
            <p className="text-slate-500 mb-8">
              点击下方按钮，AI 将生成本章节的评估题目
            </p>
            <button
              onClick={handleGenerateAssessment}
              disabled={generating}
              className="btn-primary inline-flex items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI 正在生成题目...
                </>
              ) : (
                '生成评估题目'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {assessment.questions.map((q, index) => (
              <div key={index} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    q.type === 'question' ? 'bg-blue-100 text-blue-600' :
                    q.type === 'judgment' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {q.type === 'question' ? '问答题' : q.type === 'judgment' ? '判断题' : '实践题'}
                  </span>
                </div>
                <p className="text-slate-800 font-medium mb-3">{q.question}</p>
                {q.hint && (
                  <p className="text-sm text-slate-500 mb-3">💡 提示：{q.hint}</p>
                )}
                <textarea
                  className="input-field min-h-[100px]"
                  placeholder="请输入你的答案..."
                  value={answers[index] || ''}
                  onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
                  disabled={!!result}
                />
              </div>
            ))}

            {!result && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    提交评估
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
