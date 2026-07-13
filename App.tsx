import React, { useState, useEffect } from 'react';
import { Student, Exam, Question } from './types';
import { api } from './services/api';
import StudentSelection from './components/StudentSelection';
import StudentHome from './components/StudentHome';
import TopicList from './components/TopicList';
import ActiveExam from './components/ActiveExam';
import ExamResult from './components/ExamResult';
import WrongQuestionsRevision from './components/WrongQuestionsRevision';
import ParentLogin from './components/ParentLogin';
import ParentDashboard from './components/ParentDashboard';
import { SoundService } from './components/SoundService';
import { StudentAvatar } from './components/StudentAvatar';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<'Toán' | 'Tiếng Việt' | null>(null);
  const [activeExam, setActiveExam] = useState<(Exam & { questions: Question[] }) | null>(null);
  
  // Results page state
  const [examResult, setExamResult] = useState<{
    score: number;
    correctCount: number;
    wrongCount: number;
    streakBonus?: { days: number; points: number; message: string };
  } | null>(null);

  // Wrong Questions Practice state
  const [showWrongRevision, setShowWrongRevision] = useState(false);

  // Parental gates states
  const [parentLoggedIn, setParentLoggedIn] = useState(false);
  const [showParentLogin, setShowParentLogin] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
    // Check if parent session already active
    if (api.isLoggedIn()) {
      setParentLoggedIn(true);
    }
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Không thể lấy danh sách học sinh:', err);
    } finally {
      setLoading(false);
    }
  };

  // Student CRUD triggers from Selection Screen
  const handleAddStudent = async (name: string, grade: 1 | 2, avatar: string) => {
    try {
      const created = await api.createStudent({ name, grade, avatar });
      setStudents((prev) => [...prev, created]);
      setSelectedStudent(created);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Exam Selection triggers
  const handleSelectExam = async (exam: Exam) => {
    try {
      const fullExam = await api.getExamById(exam.id);
      setActiveExam(fullExam);
      setExamResult(null);
    } catch (err) {
      alert('Không thể mở đề thi này. Bố mẹ chưa thêm câu hỏi vào đề!');
    }
  };

  // Submit test trigger
  const handleFinishExam = async (
    answers: { questionId: string; isCorrect: boolean; answer: string }[]
  ) => {
    if (!selectedStudent || !activeExam) return;

    const correct = answers.filter((a) => a.isCorrect).length;
    const wrong = answers.length - correct;
    const score = Math.round((correct / answers.length) * 100);

    // Prepare submit payload
    const submission = {
      studentId: selectedStudent.id,
      examId: activeExam.id,
      score,
      correctCount: correct,
      wrongCount: wrong,
      answersSubmitted: answers,
    };

    try {
      // Post result to backend
      const submittedResult = await api.submitResult(submission) as any;
      
      // Update local state results to render congrats
      setExamResult({ 
        score, 
        correctCount: correct, 
        wrongCount: wrong, 
        streakBonus: submittedResult?.streakBonus 
      });
      
      // Clear active quiz game play
      setActiveExam(null);

      // Refresh students to sync total points/streaks immediately
      const updatedStudents = await api.getStudents();
      setStudents(updatedStudents);
      const currentSync = updatedStudents.find((s) => s.id === selectedStudent.id);
      if (currentSync) {
        setSelectedStudent(currentSync);
      }
    } catch (err) {
      console.error('Lỗi khi nộp bài:', err);
      // Fallback
      setExamResult({ score, correctCount: correct, wrongCount: wrong });
      setActiveExam(null);
    }
  };

  // Restart active exam again
  const handleRetryExam = async () => {
    if (!activeExam && examResult && selectedStudent) {
      // Find the exam id that was just finished and reload it
      const lastExamId = localStorage.getItem('last_active_exam_id');
      if (lastExamId) {
        try {
          const fullExam = await api.getExamById(lastExamId);
          setActiveExam(fullExam);
          setExamResult(null);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  // Store last active exam ID when it plays to support retry
  useEffect(() => {
    if (activeExam) {
      localStorage.setItem('last_active_exam_id', activeExam.id);
    }
  }, [activeExam]);

  // Back to dashboards
  const handleBackToStudentHome = async () => {
    setExamResult(null);
    setActiveExam(null);
    setSelectedSubject(null);
    setShowWrongRevision(false);
    
    // Sync points
    if (selectedStudent) {
      const updatedStudents = await api.getStudents();
      const currentSync = updatedStudents.find((s) => s.id === selectedStudent.id);
      if (currentSync) {
        setSelectedStudent(currentSync);
      }
    }
  };

  // Trigger parent login gate
  const handleOpenParentLogin = () => {
    if (parentLoggedIn) {
      setActiveExam(null);
      setSelectedSubject(null);
      setSelectedStudent(null);
    } else {
      setShowParentLogin(true);
    }
  };

  const handleParentLoginSuccess = () => {
    setParentLoggedIn(true);
    setShowParentLogin(false);
    setSelectedStudent(null);
    setSelectedSubject(null);
    setActiveExam(null);
  };

  const handleParentLogout = () => {
    api.logout();
    setParentLoggedIn(false);
    loadStudents();
  };

  if (loading && students.length === 0) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-500 mb-4" />
        <p className="text-slate-500 font-bold text-base">Đang đồng bộ cơ sở dữ liệu học hè...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-700 flex flex-col justify-between">
      {/* Small floating header */}
      <header className="bg-white border-b border-slate-100 py-3.5 px-6 shadow-xs flex items-center justify-between">
        <div
          onClick={handleBackToStudentHome}
          className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-102"
        >
          <span className="text-2xl">🏫</span>
          <span className="font-display font-black text-lg tracking-tight bg-linear-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
            VUI HỌC HÈ
          </span>
        </div>

        {selectedStudent && (
          <div className="flex items-center gap-2">
            <StudentAvatar avatar={selectedStudent.avatar} className="w-6 h-6" />
            <span className="font-bold text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {selectedStudent.name} (Lớp {selectedStudent.grade})
            </span>
          </div>
        )}

        {parentLoggedIn && (
          <div className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
            Chế độ bố mẹ 🔐
          </div>
        )}
      </header>

      {/* Main Content Space */}
      <main className="flex-1 flex flex-col justify-center items-center py-6">
        
        {/* VIEW 1: PARENT DASHBOARD */}
        {parentLoggedIn ? (
          <ParentDashboard onLogout={handleParentLogout} />
        ) : showParentLogin ? (
          <ParentLogin
            onLoginSuccess={handleParentLoginSuccess}
            onClose={() => setShowParentLogin(false)}
          />
        ) : (
          <>
            {/* VIEW 2: SELECT KID */}
            {!selectedStudent && (
              <StudentSelection
                students={students}
                onSelectStudent={(student) => {
                  SoundService.playCorrect();
                  setSelectedStudent(student);
                }}
                onOpenParentLogin={handleOpenParentLogin}
                onAddStudent={handleAddStudent}
              />
            )}

            {/* VIEW 3: SELECTED STUDENT DASHBOARD */}
            {selectedStudent && !selectedSubject && !activeExam && !examResult && !showWrongRevision && (
              <StudentHome
                student={selectedStudent}
                onSelectSubject={(subject) => setSelectedSubject(subject)}
                onSelectWrongQuestions={() => setShowWrongRevision(true)}
                onBack={() => setSelectedStudent(null)}
                onSelectExam={handleSelectExam}
              />
            )}

            {/* VIEW 4: LESSON TOPICS DRILL */}
            {selectedStudent && selectedSubject && !activeExam && !examResult && !showWrongRevision && (
              <TopicList
                student={selectedStudent}
                subjectName={selectedSubject}
                onSelectExam={handleSelectExam}
                onBack={() => setSelectedSubject(null)}
              />
            )}

            {/* VIEW 5: ACTIVE EXAM GAMEPLAY SCREEN */}
            {selectedStudent && activeExam && !examResult && (
              <ActiveExam
                student={selectedStudent}
                exam={activeExam}
                onFinish={handleFinishExam}
                onQuit={() => {
                  if (window.confirm('Con có chắc muốn dừng bài kiểm tra này không? Tiến trình làm bài sẽ không được lưu.')) {
                    setActiveExam(null);
                  }
                }}
              />
            )}

            {/* VIEW 6: EXAM END RESULTS & TROPHY DISPLAY */}
            {selectedStudent && examResult && !activeExam && (
              <ExamResult
                student={selectedStudent}
                exam={JSON.parse(localStorage.getItem('last_active_exam_id') ? JSON.stringify({ name: activeExam?.name || 'Đề thi đã hoàn thành' }) : '{}')}
                score={examResult.score}
                correctCount={examResult.correctCount}
                wrongCount={examResult.wrongCount}
                streakBonus={examResult.streakBonus}
                onRetry={handleRetryExam}
                onOtherExams={() => {
                  setExamResult(null);
                  // Stay in the current subject topic select screen
                }}
                onPracticeWrongs={() => {
                  setExamResult(null);
                  setShowWrongRevision(true);
                }}
              />
            )}

            {/* VIEW 7: WRONG QUESTIONS REVISION LOOP */}
            {selectedStudent && showWrongRevision && (
              <WrongQuestionsRevision
                student={selectedStudent}
                onBack={handleBackToStudentHome}
              />
            )}
          </>
        )}

      </main>

      {/* Humble, clean page footer */}
      <footer className="py-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
        VUI HỌC HÈ © {new Date().getFullYear()} • Trạm học tập thông minh & ngập tràn nụ cười cho gia đình
      </footer>
    </div>
  );
}
