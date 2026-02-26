const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

// Sessions
export async function createSession(data: {
  topic: string;
  currentLevel?: string;
  learningStyle?: string;
  lessonDuration?: number;
}) {
  return fetchAPI('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSessions() {
  return fetchAPI('/sessions');
}

export async function getSession(id: string) {
  return fetchAPI(`/sessions/${id}`);
}

// Plans
export async function getPlans(sessionId: string) {
  return fetchAPI(`/sessions/${sessionId}/plans`);
}

export async function generatePlan(sessionId: string) {
  return fetchAPI(`/sessions/${sessionId}/plans`, {
    method: 'POST',
  });
}

// Chapters
export async function getChapters(planId: string) {
  return fetchAPI(`/plans/${planId}/chapters`);
}

export async function getChapter(id: string) {
  return fetchAPI(`/chapters/${id}`);
}

export async function generateChapterContent(chapterId: string) {
  return fetchAPI(`/chapters/${chapterId}/content`, {
    method: 'POST',
  });
}

export async function generateChapterAssessment(chapterId: string) {
  return fetchAPI(`/chapters/${chapterId}/assessment`, {
    method: 'POST',
  });
}

export async function submitAssessment(chapterId: string, userAnswer: string) {
  return fetchAPI(`/chapters/${chapterId}/submit-assessment`, {
    method: 'POST',
    body: JSON.stringify({ userAnswer }),
  });
}

export async function getAssessmentResult(chapterId: string) {
  return fetchAPI(`/chapters/${chapterId}/assessment-result`);
}

// Progress
export async function getProgress(sessionId: string) {
  return fetchAPI(`/sessions/${sessionId}/progress`);
}

export async function updateProgress(sessionId: string, data: {
  completedChapters?: number[];
  currentChapterId?: number;
  status?: string;
}) {
  return fetchAPI(`/sessions/${sessionId}/progress`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function continueLearning(sessionId: string) {
  return fetchAPI('/progress/continue', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}
