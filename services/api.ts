import {
  User,
  Student,
  Subject,
  Topic,
  Exam,
  Question,
  Result,
  WrongQuestion,
  Reward,
  StudentStats,
  Grade,
  GiftConfig,
  GiftRedemption,
} from '../types';

const API_BASE = '/api';

// Helper to get token from storage
const getParentToken = (): string | null => localStorage.getItem('parent_token');

// Main client request wrapper
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getParentToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi hệ thống: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: async (username: string, password: string): Promise<{ token: string; username: string }> => {
    const data = await request<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('parent_token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('parent_token');
  },

  isLoggedIn: (): boolean => {
    return !!getParentToken();
  },

  // Students
  getStudents: () => request<Student[]>('/students'),
  getStudentById: (id: string) => request<Student>(`/students/${id}`),
  createStudent: (student: { name: string; grade: number; avatar: string; password?: string }) =>
    request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    }),
  updateStudent: (id: string, updates: Partial<Student>) =>
    request<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteStudent: (id: string) =>
    request<{ success: boolean; message: string }>(`/students/${id}`, {
      method: 'DELETE',
    }),
  getStudentStats: (id: string) => request<StudentStats>(`/students/${id}/stats`),
  getStudentRewards: (id: string) => request<Reward[]>(`/students/${id}/rewards`),
  getWrongQuestions: (id: string) => request<WrongQuestion[]>(`/students/${id}/wrong-questions`),
  solveWrongQuestion: (studentId: string, questionId: string) =>
    request<{ success: boolean }>(`/students/${studentId}/wrong-questions/solve`, {
      method: 'POST',
      body: JSON.stringify({ questionId }),
    }),

  // Topics
  getTopics: (grade?: number) => request<Topic[]>(`/topics${grade ? `?grade=${grade}` : ''}`),
  createTopic: (topic: Omit<Topic, 'id'>) =>
    request<Topic>('/topics', {
      method: 'POST',
      body: JSON.stringify(topic),
    }),
  updateTopic: (id: string, updates: Partial<Topic>) =>
    request<Topic>(`/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteTopic: (id: string) =>
    request<{ success: boolean }>(`/topics/${id}`, {
      method: 'DELETE',
    }),

  // Exams & Questions
  getExams: (topicId?: string) => request<Exam[]>(`/exams${topicId ? `?topicId=${topicId}` : ''}`),
  getExamById: (id: string) => request<Exam & { questions: Question[] }>(`/exams/${id}`),
  createExam: (exam: Omit<Exam, 'id'> & { questions?: Omit<Question, 'id' | 'examId'>[] }) =>
    request<Exam & { questions: Question[] }>('/exams', {
      method: 'POST',
      body: JSON.stringify(exam),
    }),
  updateExam: (id: string, updates: Partial<Exam> & { questions?: Partial<Question>[] }) =>
    request<Exam & { questions: Question[] }>(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteExam: (id: string) =>
    request<{ success: boolean }>(`/exams/${id}`, {
      method: 'DELETE',
    }),
  duplicateExam: (id: string) =>
    request<{ success: boolean; exam: Exam }>(`/exams/${id}/duplicate`, {
      method: 'POST',
    }),

  // Quick text-based import
  importQuick: (examData: {
    name: string;
    topicId: string;
    grade: number;
    text: string;
    difficulty?: string;
    assignedStudentId?: string;
    deadline?: string;
  }) =>
    request<{ success: boolean; exam: Exam & { questions: Question[] } }>('/exams/import-quick', {
      method: 'POST',
      body: JSON.stringify(examData),
    }),

  // AI-powered file/text import
  importAI: (examData: {
    name: string;
    topicId: string;
    grade: number;
    sourceText?: string;
    fileBase64?: string;
    fileMimeType?: string;
    questionCount?: number;
    difficulty?: string;
    assignedStudentId?: string;
    deadline?: string;
  }) =>
    request<{ success: boolean; exam: Exam & { questions: Question[] } }>('/exams/import-ai', {
      method: 'POST',
      body: JSON.stringify(examData),
    }),

  // Auto-generate exam by randomly selecting questions from topics
  autoGenerate: (data: {
    name: string;
    topicIds: string[];
    questionCount: number;
    difficulties?: ('easy' | 'medium' | 'hard')[];
    assignedStudentId?: string;
    deadline?: string;
  }) =>
    request<{ success: boolean; exam: Exam & { questions: Question[] } }>('/exams/auto-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Results
  submitResult: (result: Omit<Result, 'id' | 'examName' | 'subjectName' | 'date'>) =>
    request<Result>('/results', {
      method: 'POST',
      body: JSON.stringify(result),
    }),
  getAllResults: () => request<Result[]>('/results'),

  // Grades API
  getGrades: () => request<Grade[]>('/grades'),
  createGrade: (grade: { level: number; name: string }) =>
    request<Grade>('/grades', {
      method: 'POST',
      body: JSON.stringify(grade),
    }),
  updateGrade: (id: string, updates: Partial<Grade>) =>
    request<Grade>(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteGrade: (id: string) =>
    request<{ success: boolean }>(`/grades/${id}`, {
      method: 'DELETE',
    }),

  // Subjects API
  getSubjects: () => request<Subject[]>('/subjects'),
  createSubject: (subject: { name: string; icon: string }) =>
    request<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(subject),
    }),
  updateSubject: (id: string, updates: Partial<Subject>) =>
    request<Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteSubject: (id: string) =>
    request<{ success: boolean }>(`/subjects/${id}`, {
      method: 'DELETE',
    }),

  // Gifts & Redemptions API
  getGifts: () => request<GiftConfig[]>('/gifts'),
  createGift: (gift: { name: string; pointsCost: number; icon: string }) =>
    request<GiftConfig>('/gifts', {
      method: 'POST',
      body: JSON.stringify(gift),
    }),
  updateGift: (id: string, updates: Partial<GiftConfig>) =>
    request<GiftConfig>(`/gifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteGift: (id: string) =>
    request<{ success: boolean }>(`/gifts/${id}`, {
      method: 'DELETE',
    }),
  getRedemptions: (studentId?: string) =>
    request<GiftRedemption[]>(`/redemptions${studentId ? `?studentId=${studentId}` : ''}`),
  createRedemption: (studentId: string, giftId: string) =>
    request<GiftRedemption>('/redemptions', {
      method: 'POST',
      body: JSON.stringify({ studentId, giftId }),
    }),
  processRedemption: (id: string, status: 'approved' | 'rejected') =>
    request<GiftRedemption>(`/redemptions/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
};
