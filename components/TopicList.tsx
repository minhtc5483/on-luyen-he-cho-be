import React, { useEffect, useState } from 'react';
import { Student, Topic, Exam, Result } from '../types';
import { api } from '../services/api';
import { ArrowLeft, BookOpen, Calculator, Award, ArrowRight, Layers, FileText } from 'lucide-react';
import { SoundService } from './SoundService';

interface TopicListProps {
  student: Student;
  subjectName: 'Toán' | 'Tiếng Việt';
  onSelectExam: (exam: Exam) => void;
  onBack: () => void;
}

export default function TopicList({
  student,
  subjectName,
  onSelectExam,
  onBack,
}: TopicListProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [examsMap, setExamsMap] = useState<Record<string, Exam[]>>({});
  const [pastResults, setPastResults] = useState<Result[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allTopics, results] = await Promise.all([
          api.getTopics(student.grade),
          api.getAllResults(),
        ]);

        const filteredTopics = allTopics.filter((t) => {
          const subjectMatch =
            subjectName === 'Toán'
              ? t.subjectId === 'sub_math'
              : t.subjectId === 'sub_viet';
          return subjectMatch;
        });

        setTopics(filteredTopics);
        setPastResults(results.filter((r) => r.studentId === student.id));

        // Fetch exams for all filtered topics
        const examsPromises = filteredTopics.map((t) => api.getExams(t.id));
        const examsResults = await Promise.all(examsPromises);

        const newExamsMap: Record<string, Exam[]> = {};
        filteredTopics.forEach((t, index) => {
          newExamsMap[t.id] = examsResults[index];
        });

        setExamsMap(newExamsMap);

        if (filteredTopics.length > 0) {
          setSelectedTopicId(filteredTopics[0].id);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách chủ đề:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [student.id, subjectName]);

  const getHighScore = (examId: string): number | null => {
    const examResults = pastResults.filter((r) => r.examId === examId);
    if (examResults.length === 0) return null;
    return Math.max(...examResults.map((r) => r.score));
  };

  const getTopicProgress = (topicId: string): { completed: number; total: number } => {
    const topicExams = examsMap[topicId] || [];
    if (topicExams.length === 0) return { completed: 0, total: 0 };

    let completed = 0;
    topicExams.forEach((e) => {
      if (getHighScore(e.id) !== null) {
        completed += 1;
      }
    });
    return { completed, total: topicExams.length };
  };

  const handleStartExam = (exam: Exam) => {
    SoundService.speak(`Bắt đầu làm bài thi ${exam.name} nhé! Cố lên con yêu.`);
    onSelectExam(exam);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-500 mb-4"></div>
        <p className="text-slate-500 font-bold text-base">Đang mở tủ sách đề thi...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-700 bg-white border-2 border-slate-200 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:border-slate-300 transition-all active:translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </button>
      </div>

      {/* Header title - White background, thick border, geometric alignment */}
      <div className="text-center md:text-left mb-8 flex flex-col md:flex-row items-center gap-6 justify-between bg-white p-6 md:p-8 rounded-[40px] border-4 border-slate-100 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-4 flex-col md:flex-row text-center md:text-left">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl border-2 border-white shadow-md shrink-0 ${
            subjectName === 'Toán' ? 'bg-blue-500' : 'bg-emerald-500'
          }`}>
            {subjectName === 'Toán' ? '🔢' : '📖'}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-sans font-black text-slate-800 uppercase tracking-tight">
              Kho đề {subjectName} - Lớp {student.grade}
            </h1>
            <p className="text-slate-500 font-bold italic text-sm mt-1">
              Chọn một chuyên đề dưới đây để khám phá các thử thách thú vị nhé!
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border-2 border-dashed border-slate-200 px-5 py-3 rounded-2xl flex items-center gap-2.5 shrink-0">
          <span className="text-3xl animate-wiggle">👧</span>
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Người học:</p>
            <p className="text-base font-black text-slate-800">{student.name}</p>
          </div>
        </div>
      </div>

      {/* Topics list layout (Responsive Split sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Topics */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center lg:text-left">
            Danh sách chuyên đề
          </h2>
          
          {topics.length === 0 ? (
            <div className="bg-white p-8 rounded-[32px] text-center border-4 border-slate-100 text-slate-400 font-bold">
              Chưa có chuyên đề nào được tạo cho môn này.
            </div>
          ) : (
            topics.map((t) => {
              const { completed, total } = getTopicProgress(t.id);
              const isSelected = selectedTopicId === t.id;
              
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTopicId(t.id)}
                  id={`topic-item-${t.id}`}
                  className={`p-4 rounded-[24px] border-4 transition-all cursor-pointer text-left relative flex items-center justify-between active:translate-y-0.5 ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-400 shadow-xs'
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center justify-center text-xl">
                      📚
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-sm leading-snug uppercase tracking-tight">{t.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400 font-bold uppercase tracking-wider">
                        <span>{total} bộ đề</span>
                        {total > 0 && (
                          <span className="text-emerald-600 font-black ml-1.5 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                            Đã làm: {completed}/{total}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className={`w-5 h-5 transition-transform shrink-0 ${
                    isSelected ? 'text-blue-500 translate-x-1' : 'text-slate-300'
                  }`} />
                </div>
              );
            })
          )}
        </div>

        {/* Selected Topic's Exams Panel */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-[32px] p-6 md:p-8 border-4 border-slate-100 shadow-sm">
            <h2 className="text-lg font-sans font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-wide">
              📂 Các bài ôn luyện vui vẻ
            </h2>

            {selectedTopicId && (examsMap[selectedTopicId] || []).length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-5xl mb-2">✏️</p>
                <p className="font-black text-base uppercase tracking-wider">Đang soạn đề thi mới!</p>
                <p className="text-xs font-bold mt-1 text-slate-400">Bố mẹ chưa kích hoạt bộ đề thi cho chuyên đề này.</p>
              </div>
            )}

            {selectedTopicId && (
              <div className="space-y-6">
                {(() => {
                  const filteredExams = (examsMap[selectedTopicId] || [])
                    .filter((exam) => !exam.assignedStudentId || exam.assignedStudentId === student.id);
                  
                  const uncompletedExams = filteredExams.filter(e => getHighScore(e.id) === null);
                  const completedExams = filteredExams.filter(e => getHighScore(e.id) !== null);

                  return (
                    <>
                      {/* Section 1: Uncompleted Exams */}
                      {uncompletedExams.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Bé chưa làm ({uncompletedExams.length})
                          </h3>
                          {uncompletedExams.map((exam) => {
                            return (
                              <div
                                key={exam.id}
                                id={`exam-item-${exam.id}`}
                                className="p-5 rounded-2xl border-2 border-dashed bg-slate-50/50 border-slate-200 hover:border-blue-400 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                              >
                                <div className="space-y-1 text-left flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-lg">📝</span>
                                    <h4 className="font-black text-slate-800 text-sm md:text-base leading-snug uppercase tracking-tight">
                                      {exam.name}
                                    </h4>

                                    {/* Difficulty Badge */}
                                    {exam.difficulty && (
                                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs border ${
                                        exam.difficulty === 'easy'
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                          : exam.difficulty === 'hard'
                                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                                          : 'bg-amber-50 border-amber-200 text-amber-700'
                                      }`}>
                                        {exam.difficulty === 'easy' ? '🟢 Dễ' : exam.difficulty === 'hard' ? '🔴 Khó' : '🟡 Trung bình'}
                                      </span>
                                    )}

                                    {/* Deadline Badge */}
                                    {exam.deadline && (() => {
                                      const today = new Date().toISOString().split('T')[0];
                                      const isOverdue = exam.deadline < today;
                                      const formattedDate = exam.deadline.split('-').reverse().join('/');
                                      return (
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs border ${
                                          isOverdue
                                            ? 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse'
                                            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                        }`}>
                                          📅 {isOverdue ? `⏰ Hết hạn (${formattedDate})` : `Hạn: ${formattedDate}`}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-xs text-slate-500 font-bold leading-relaxed">{exam.description || 'Không có mô tả bộ đề.'}</p>
                                </div>

                                <button
                                  onClick={() => handleStartExam(exam)}
                                  className="w-full sm:w-auto font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 border-b-[4px] border-blue-700 text-white"
                                >
                                  Làm Bài 🚀
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Section 2: Completed Exams */}
                      {completedExams.length > 0 && (
                        <div className="space-y-3 pt-4">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            Bé đã hoàn thành ({completedExams.length})
                          </h3>
                          {completedExams.map((exam) => {
                            const highScore = getHighScore(exam.id);
                            return (
                              <div
                                key={exam.id}
                                id={`exam-item-${exam.id}`}
                                className="p-5 rounded-2xl border-2 border-dashed bg-emerald-50/10 border-emerald-300 hover:border-blue-400 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                              >
                                <div className="space-y-1 text-left flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-lg">✅</span>
                                    <h4 className="font-black text-slate-800 text-sm md:text-base leading-snug uppercase tracking-tight">
                                      {exam.name}
                                    </h4>
                                    <span className="bg-emerald-500 border border-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                                      Hoàn thành
                                    </span>

                                    {/* Difficulty Badge */}
                                    {exam.difficulty && (
                                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs border ${
                                        exam.difficulty === 'easy'
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                          : exam.difficulty === 'hard'
                                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                                          : 'bg-amber-50 border-amber-200 text-amber-700'
                                      }`}>
                                        {exam.difficulty === 'easy' ? '🟢 Dễ' : exam.difficulty === 'hard' ? '🔴 Khó' : '🟡 Trung bình'}
                                      </span>
                                    )}

                                    {/* Deadline Badge */}
                                    {exam.deadline && (() => {
                                      const today = new Date().toISOString().split('T')[0];
                                      const isOverdue = exam.deadline < today;
                                      const formattedDate = exam.deadline.split('-').reverse().join('/');
                                      return (
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs border ${
                                          isOverdue
                                            ? 'bg-rose-100 border-rose-300 text-rose-800'
                                            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                        }`}>
                                          📅 {isOverdue ? `⏰ Hết hạn (${formattedDate})` : `Hạn: ${formattedDate}`}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-xs text-slate-500 font-bold leading-relaxed">{exam.description || 'Không có mô tả bộ đề.'}</p>
                                  
                                  {/* High score display */}
                                  <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs text-emerald-700 font-black w-fit mt-2">
                                    <Award className="w-3.5 h-3.5" /> Điểm cao nhất: {highScore} điểm ⭐
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleStartExam(exam)}
                                  className="w-full sm:w-auto font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 border-b-[4px] border-emerald-700 text-white"
                                >
                                  Ôn Lại Bài 🔁
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
