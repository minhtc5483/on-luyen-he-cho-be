export type GradeType = number;
export type SubjectName = string;
export type QuestionType =
  | 'multiple-choice'
  | 'text-input'
  | 'true-false'
  | 'word-match'
  | 'matching'
  | 'drag-drop'
  | 'word-order'
  | 'reading-comprehension'
  | 'spelling'
  | 'image-choice';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
}

export interface Student {
  id: string;
  name: string;
  grade: GradeType;
  avatar: string; // avatar key or base64 or emoji
  points: number;
  streak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  password?: string;
}

export interface Grade {
  id: string;
  level: number;
  name: string;
}

export interface Subject {
  id: string;
  name: SubjectName;
  icon: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  icon: string;
  grade: GradeType;
}

export interface Exam {
  id: string;
  topicId: string;
  name: string;
  description: string;
  grade: GradeType;
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  assignedStudentId?: string;
  deadline?: string;
}

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  content: string; // Question prompt / text
  options?: string[]; // Multiple choice options or elements to drag
  correctAnswer: string; // Correct answer or key
  explanation?: string; // AI or editor provided explanation
  imageUrl?: string; // Optional illustration (SVG, Emoji or URL)
  readingText?: string; // For reading-comprehension
  matchingPairs?: { left: string; right: string }[]; // For matching type
  points: number;
}

export interface Result {
  id: string;
  studentId: string;
  examId: string;
  examName: string;
  subjectName: SubjectName;
  score: number; // 0-100
  correctCount: number;
  wrongCount: number;
  date: string; // ISO date
  answersSubmitted: { questionId: string; isCorrect: boolean; answer: string }[];
  streakBonus?: {
    days: number;
    points: number;
    message: string;
  };
}

export interface WrongQuestion {
  id: string;
  studentId: string;
  question: Question;
  topicName: string;
  subjectName: SubjectName;
  examName: string;
  incorrectAnswer: string;
  solvedCount: number;
}

export interface Reward {
  id: string;
  studentId: string;
  badgeId: string; // 'streak-1' | 'streak-3' | 'streak-7' | 'super-student' | 'math-star' | 'reading-star'
  badgeName: string;
  icon: string;
  awardedAt: string;
}

export interface GiftConfig {
  id: string;
  name: string;
  pointsCost: number;
  icon: string;
}

export interface GiftRedemption {
  id: string;
  studentId: string;
  studentName: string;
  giftId: string;
  giftName: string;
  pointsCost: number;
  icon: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

// Stats interface for charts & summaries
export interface StudentStats {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  studyTimeMinutes: number;
  streak: number;
  points: number;
  subjectStrengths: {
    subject: SubjectName;
    correct: number;
    total: number;
  }[];
  recentActivity: {
    date: string;
    correct: number;
    total: number;
    pointsGained: number;
  }[];
}
