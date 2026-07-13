import React, { useEffect, useState } from 'react';
import { Student, Result, Reward, WrongQuestion, StudentStats, GiftConfig, GiftRedemption, Exam } from '../types';
import { api } from '../services/api';
import {
  Flame,
  Award,
  BookOpen,
  Calculator,
  ArrowLeft,
  AlertTriangle,
  History,
  TrendingUp,
  Clock,
  CheckCircle,
  HelpCircle,
  Play,
  Volume2
} from 'lucide-react';
import { SoundService } from './SoundService';
import { StudentAvatar } from './StudentAvatar';

const BADGE_LEVELS = [
  { level: 1, name: 'Hạng 1', icon: '🔆', points: 10, desc: 'Cần 10 điểm' },
  { level: 2, name: 'Hạng 2', icon: '💧', points: 50, desc: 'Cần 50 điểm' },
  { level: 3, name: 'Hạng 3', icon: '🚀', points: 100, desc: 'Cần 100 điểm' },
  { level: 4, name: 'Hạng 4', icon: '🛡️', points: 200, desc: 'Cần 200 điểm' },
  { level: 5, name: 'Hạng 5', icon: '⚔️', points: 400, desc: 'Cần 400 điểm' },
  { level: 6, name: 'Hạng 6', icon: '👑', points: 600, desc: 'Cần 600 điểm' },
  { level: 7, name: 'Hạng 7', icon: '💎', points: 800, desc: 'Cần 800 điểm' },
  { level: 8, name: 'Hạng 8', icon: '🔮', points: 1000, desc: 'Cần 1.000 điểm' },
  { level: 9, name: 'Hạng 9', icon: '🏵️', points: 1500, desc: 'Cần 1.500 điểm' },
  { level: 10, name: 'Hạng 10', icon: '🏆', points: 2000, desc: 'Cần 2.000 điểm' },
];

interface StudentHomeProps {
  student: Student;
  onSelectSubject: (subject: 'Toán' | 'Tiếng Việt') => void;
  onSelectWrongQuestions: () => void;
  onBack: () => void;
  onSelectExam?: (exam: Exam) => void;
}

export default function StudentHome({
  student,
  onSelectSubject,
  onSelectWrongQuestions,
  onBack,
  onSelectExam,
}: StudentHomeProps) {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [recentExams, setRecentExams] = useState<Result[]>([]);
  const [fullHistoryExams, setFullHistoryExams] = useState<Result[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [gifts, setGifts] = useState<GiftConfig[]>([]);
  const [redemptions, setRedemptions] = useState<GiftRedemption[]>([]);
  const [availableExams, setAvailableExams] = useState<(Exam & { subjectName: string; highScore: number | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'all' | 'Toán' | 'Tiếng Việt' | 'Tiếng Anh'>('all');

  const loadData = async () => {
    try {
      const [
        statsData,
        rewardsData,
        wrongsData,
        resultsData,
        giftsData,
        redemptionsData,
        examsData,
        topicsData
      ] = await Promise.all([
        api.getStudentStats(student.id),
        api.getStudentRewards(student.id),
        api.getWrongQuestions(student.id),
        api.getAllResults(),
        api.getGifts(),
        api.getRedemptions(student.id),
        api.getExams(),
        api.getTopics(),
      ]);
      
      setStats(statsData);
      setRewards(rewardsData);
      setWrongQuestions(wrongsData);
      setGifts(giftsData);
      setRedemptions(redemptionsData);
      
      // Filter recent exams for this student
      const studentHistory = resultsData
        .filter((r) => r.studentId === student.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentExams(studentHistory.slice(0, 5));
      setFullHistoryExams(studentHistory);

      // Process and filter available exams for the current student's grade
      const filteredExams = examsData
        .filter((exam) => {
          const isCorrectGrade = exam.grade === student.grade;
          const isAssignedToMe = !exam.assignedStudentId || exam.assignedStudentId === student.id;
          return isCorrectGrade && isAssignedToMe;
        })
        .map((exam) => {
          // Find subject based on topic mapping
          const topic = topicsData.find((t) => t.id === exam.topicId);
          let subjectName = 'Toán';
          if (topic) {
            subjectName = topic.subjectId === 'sub_viet' ? 'Tiếng Việt' : 'Toán';
          }
          
          // Get high score
          const examResults = resultsData.filter((r) => r.studentId === student.id && r.examId === exam.id);
          const highScore = examResults.length > 0 ? Math.max(...examResults.map((r) => r.score)) : null;

          return {
            ...exam,
            subjectName,
            highScore,
          };
        });

      setAvailableExams(filteredExams);
    } catch (err) {
      console.error('Lỗi tải thông tin học sinh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [student.id]);

  const handleRedeem = async (giftId: string, giftName: string) => {
    if (redeemLoading) return;
    setRedeemLoading(true);
    try {
      await api.createRedemption(student.id, giftId);
      SoundService.speak(`Chúc mừng con đã đổi thành công yêu cầu quà: ${giftName}. Chờ bố mẹ duyệt nhé!`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi đổi quà.');
    } finally {
      setRedeemLoading(false);
    }
  };

  const speakWelcome = () => {
    SoundService.speak(`Chào mừng ${student.name} quay lại học bài nào! Hôm nay con muốn học Toán hay Tiếng Việt?`);
  };

  useEffect(() => {
    // Speak a cute greeting when the student home loads!
    speakWelcome();
  }, [student.id]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-slate-500 font-bold text-lg">Đang chuẩn bị bài học vui vẻ cho {student.name}...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 md:py-6 space-y-6">
      {/* Top action bar */}
      <div className="flex justify-between items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all active:translate-y-0.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Đổi bé khác
        </button>

        <button
          onClick={speakWelcome}
          className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all active:translate-y-0.5 cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5 animate-bounce" /> Nghe cô chào 🔊
        </button>
      </div>

      {/* Header card matching mockup layout */}
      <div className="bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 border-2 border-blue-300 rounded-full flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            <StudentAvatar avatar={student.avatar} className="w-full h-full" />
          </div>
          <div className="text-left">
            <h1 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-snug">
              Xin chào, {student.name}!
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-wider">
              Lớp {student.grade}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          {/* Streak badge */}
          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-4 py-2 rounded-full font-black text-xs md:text-sm border border-orange-100 shrink-0 shadow-2xs">
            🔥 {stats?.streak || student.streak} ngày
          </div>
          {/* Score badge */}
          <div
            onClick={() => setShowHistoryModal(true)}
            role="button"
            tabIndex={0}
            title="Bấm để xem lịch sử điểm số!"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setShowHistoryModal(true);
              }
            }}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-500 px-4 py-2 rounded-full font-black text-xs md:text-sm border border-amber-100 shrink-0 shadow-2xs cursor-pointer transition-all active:translate-y-0.5 hover:scale-105 duration-150 outline-none select-none"
          >
            ⭐ {stats?.points || student.points}
          </div>
          {/* Redeem gift button */}
          <button
            onClick={() => setShowGiftModal(true)}
            className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-full font-black text-xs md:text-sm transition-all active:translate-y-0.5 cursor-pointer shadow-sm shadow-pink-500/20 shrink-0 ml-auto md:ml-0"
          >
            🎁 Đổi Điểm Ngay
          </button>
        </div>
      </div>

      {/* 🔥 Thanh Học Tập Liên Tiếp (Daily Streak Week Track) */}
      <div className="bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-5 md:p-6 shadow-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              🔥 Lịch Học Tuần Này
            </h2>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
              Bé đã học liên tiếp <span className="text-orange-500 font-black">{stats?.streak || student.streak} ngày</span>. Hãy giữ ngọn lửa luôn sáng nhé!
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-orange-50 px-3.5 py-1.5 rounded-full border border-orange-100 self-start sm:self-auto shadow-2xs">
            <span className="text-sm animate-pulse">🔥</span>
            <span className="text-[10px] md:text-xs font-black text-orange-600 uppercase tracking-wide">
              Đạt {stats?.streak || student.streak} ngày liên tiếp!
            </span>
          </div>
        </div>

        {/* 7 Days Row */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-3">
          {(() => {
            const today = new Date();
            const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
            const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
            const monday = new Date(today);
            monday.setDate(today.getDate() + mondayOffset);
            monday.setHours(0, 0, 0, 0);

            const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            
            return Array.from({ length: 7 }).map((_, i) => {
              const dayDate = new Date(monday);
              dayDate.setDate(monday.getDate() + i);
              
              const isToday = dayDate.toDateString() === today.toDateString();
              const isFuture = dayDate.getTime() > today.getTime() && !isToday;
              
              // Check if this day has any completed exam in fullHistoryExams
              const hasCompleted = fullHistoryExams.some(exam => {
                const examDate = new Date(exam.date);
                return examDate.toDateString() === dayDate.toDateString();
              });

              // Also check if matches the streak logic backwards from today
              const daysDiff = Math.floor((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
              const isStreakDay = daysDiff >= 0 && daysDiff < (stats?.streak || student.streak || 0);

              const isActive = hasCompleted || isStreakDay;

              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-between p-2.5 md:p-4 rounded-2xl border-2 transition-all duration-300 relative ${
                    isActive
                      ? 'bg-gradient-to-b from-orange-50/50 to-orange-100/30 border-orange-400 shadow-md shadow-orange-500/10'
                      : isToday
                      ? 'bg-white border-blue-400 border-dashed ring-4 ring-blue-400/10'
                      : 'bg-slate-50/50 border-slate-100 opacity-60'
                  }`}
                >
                  {/* Small absolute top indicator for Today */}
                  {isToday && (
                    <span className="absolute -top-2.5 bg-blue-500 text-white font-black text-[7px] md:text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none shadow-sm">
                      Hôm nay
                    </span>
                  )}

                  {/* Day Label */}
                  <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider mb-2 ${
                    isActive
                      ? 'text-orange-600'
                      : isToday
                      ? 'text-blue-500'
                      : 'text-slate-400'
                  }`}>
                    {dayNames[i]}
                  </span>

                  {/* Flame Icon with gorgeous animations */}
                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-md shadow-orange-400/30 animate-pulse'
                      : 'bg-slate-100 text-slate-300'
                  }`}>
                    <span className={`text-sm md:text-xl filter drop-shadow-xs transition-transform ${isActive ? 'opacity-100 scale-110' : 'grayscale opacity-40'}`}>
                      🔥
                    </span>
                  </div>

                  {/* Completion status label */}
                  <span className={`text-[7px] md:text-[9px] font-extrabold uppercase mt-2 tracking-wider ${
                    isActive
                      ? 'text-emerald-500'
                      : isToday
                      ? 'text-blue-400 font-black'
                      : 'text-slate-300'
                  }`}>
                    {isActive ? 'Đã học ✓' : isFuture ? 'Sắp tới' : 'Chưa học'}
                  </span>
                </div>
              );
            });
          })()}
        </div>

        {/* Streak Milestone Rewards Board */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
            🎁 Mức Thưởng Điểm Học Liên Tiếp:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { days: 2, points: 20, icon: '🔥', label: 'Chuỗi 2 ngày', bg: 'from-orange-50 to-amber-50 border-orange-200 text-orange-700' },
              { days: 3, points: 30, icon: '⚡', label: 'Chuỗi 3 ngày', bg: 'from-amber-50 to-yellow-50 border-amber-200 text-amber-700' },
              { days: 7, points: 100, icon: '🏆', label: 'Chuỗi 7 ngày', bg: 'from-red-50 to-orange-50 border-red-200 text-red-700' },
              { days: 30, points: 500, icon: '👑', label: 'Cả tháng (30 ngày)', bg: 'from-purple-50 to-pink-50 border-purple-200 text-purple-700' },
            ].map((milestone) => {
              const currentStreak = stats?.streak || student.streak || 0;
              const isAchieved = currentStreak >= milestone.days;
              
              return (
                <div
                  key={milestone.days}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border bg-gradient-to-r ${milestone.bg} relative overflow-hidden transition-all duration-300 ${
                    isAchieved ? 'ring-2 ring-emerald-400 border-emerald-400 opacity-100 shadow-3xs' : 'opacity-80'
                  }`}
                >
                  <span className="text-xl md:text-2xl shrink-0">{milestone.icon}</span>
                  <div className="text-left min-w-0">
                    <p className="font-black text-[10px] md:text-xs uppercase tracking-tight truncate leading-tight">
                      {milestone.label}
                    </p>
                    <p className="text-[9px] md:text-[10px] font-bold opacity-90 mt-0.5">
                      Thưởng +{milestone.points} ⭐
                    </p>
                  </div>
                  {isAchieved && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white font-black text-[7px] px-1.5 py-0.5 rounded-bl-lg uppercase tracking-wider leading-none shadow-xs">
                      Đạt ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🏆 Góc Phần Thưởng Section - Horizontal Scrollable Badges matching mockup */}
      <div className="bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-xs text-left">
        <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          🏆 Góc Phần Thưởng
        </h2>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {BADGE_LEVELS.map((badge) => {
            const currentPoints = stats?.points ?? student.points ?? 0;
            const isUnlocked = currentPoints >= badge.points;
            
            return (
              <div
                key={badge.level}
                className={`flex-shrink-0 w-[110px] md:w-[130px] flex flex-col items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-300 text-center relative ${
                  isUnlocked
                    ? 'bg-amber-50/10 border-amber-200 hover:border-amber-300'
                    : 'bg-slate-50/50 border-slate-100 opacity-75'
                }`}
              >
                {/* Lock icon overlay at top right */}
                <div className="absolute top-2 right-2">
                  {!isUnlocked && (
                    <div className="w-5 h-5 bg-slate-200/80 rounded-full flex items-center justify-center border border-slate-300 shadow-3xs">
                      <span className="text-[9px]">🔒</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center mt-1 w-full">
                  <div className={`text-2xl md:text-3xl mb-1.5 filter drop-shadow-sm ${!isUnlocked && 'grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                  <h4 className="font-black text-slate-800 text-[10px] md:text-xs uppercase tracking-tight leading-none mb-0.5">
                    Hạng {badge.level}
                  </h4>
                </div>

                <div className="w-full mt-3">
                  <span className={`inline-block text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-md ${
                    isUnlocked
                      ? 'bg-amber-100 text-amber-800 font-black'
                      : 'bg-slate-100 text-slate-400 font-bold'
                  }`}>
                    {isUnlocked ? 'Đạt được' : `Cần ${badge.points}đ`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chọn Môn Học Filter with custom styled mechanical square tab buttons */}
      <div className="text-left space-y-4">
        <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider">
          Chọn Môn Học
        </h2>
        <div className="flex flex-wrap gap-3.5">
          {/* Tất cả Filter */}
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border transition-all cursor-pointer text-center ${
              selectedSubjectFilter === 'all'
                ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white border-none shadow-md shadow-orange-500/20 scale-102 font-black'
                : 'bg-white text-slate-700 border-slate-100 hover:border-slate-200 shadow-2xs font-bold'
            }`}
          >
            <span className="text-2xl md:text-3xl">⭐</span>
            <span className="text-[11px] md:text-xs tracking-wide">Tất cả</span>
          </button>

          {/* Tiếng Anh Filter (Locked placeholder as in mockup) */}
          <button
            onClick={() => {
              setSelectedSubjectFilter('Tiếng Anh');
              SoundService.speak("Môn Tiếng Anh đang chuẩn bị ra mắt, bé nhớ ôn tập thật tốt các môn học khác nhé!");
            }}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border transition-all cursor-pointer text-center ${
              selectedSubjectFilter === 'Tiếng Anh'
                ? 'bg-rose-500 text-white border-none shadow-md shadow-rose-500/20 scale-102 font-black'
                : 'bg-white text-slate-700 border-slate-100 hover:border-slate-200 shadow-2xs font-bold'
            }`}
          >
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              {/* Overlapping sheets design */}
              <div className="absolute w-4.5 h-4.5 bg-blue-400 rounded-xs -rotate-12 translate-x-[-2px] translate-y-[-2px] opacity-80"></div>
              <div className="absolute w-4.5 h-4.5 bg-green-400 rounded-xs rotate-6 translate-x-[2px] translate-y-[-1px] opacity-85"></div>
              <div className="absolute w-4.5 h-4.5 bg-rose-400 rounded-xs -rotate-3 translate-x-[1px] translate-y-[1px]"></div>
            </div>
            <span className="text-[11px] md:text-xs tracking-wide">Tiếng Anh</span>
          </button>

          {/* Toán Filter */}
          <button
            onClick={() => setSelectedSubjectFilter('Toán')}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border transition-all cursor-pointer text-center ${
              selectedSubjectFilter === 'Toán'
                ? 'bg-blue-500 text-white border-none shadow-md shadow-blue-500/20 scale-102 font-black'
                : 'bg-white text-slate-700 border-slate-100 hover:border-slate-200 shadow-2xs font-bold'
            }`}
          >
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <div className="absolute w-4.5 h-4.5 bg-indigo-500 rounded-xs -rotate-12 translate-x-[-2px] translate-y-[-2px] opacity-80"></div>
              <div className="absolute w-4.5 h-4.5 bg-amber-400 rounded-xs rotate-6 translate-x-[2px] translate-y-[-1px] opacity-85"></div>
              <div className="absolute w-4.5 h-4.5 bg-blue-500 rounded-xs -rotate-3 translate-x-[1px] translate-y-[1px]"></div>
            </div>
            <span className="text-[11px] md:text-xs tracking-wide">Toán</span>
          </button>

          {/* Tiếng Việt Filter */}
          <button
            onClick={() => setSelectedSubjectFilter('Tiếng Việt')}
            className={`flex flex-col items-center justify-center gap-1.5 p-3 w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl border transition-all cursor-pointer text-center ${
              selectedSubjectFilter === 'Tiếng Việt'
                ? 'bg-green-500 text-white border-none shadow-md shadow-green-500/20 scale-102 font-black'
                : 'bg-white text-slate-700 border-slate-100 hover:border-slate-200 shadow-2xs font-bold'
            }`}
          >
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <div className="absolute w-4.5 h-4.5 bg-amber-400 rounded-xs -rotate-12 translate-x-[-2px] translate-y-[-2px] opacity-80"></div>
              <div className="absolute w-4.5 h-4.5 bg-teal-500 rounded-xs rotate-6 translate-x-[2px] translate-y-[-1px] opacity-85"></div>
              <div className="absolute w-4.5 h-4.5 bg-green-500 rounded-xs -rotate-3 translate-x-[1px] translate-y-[1px]"></div>
            </div>
            <span className="text-[11px] md:text-xs tracking-wide">Tiếng Việt</span>
          </button>
        </div>
      </div>

      {/* Sửa lỗi sai component logic */}
      {wrongQuestions.length > 0 && (
        <div className="bg-white border-4 border-amber-300 rounded-[24px] md:rounded-[32px] p-4 md:p-6 mb-4 md:mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs animate-pop relative overflow-hidden text-left">
          <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-100 border-2 border-amber-300 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-600 animate-wiggle shrink-0 text-xl md:text-2xl">
              🛠️
            </div>
            <div>
              <h3 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-wide">Khu vực sửa lỗi sai!</h3>
              <p className="text-[11px] md:text-sm text-slate-500 font-bold mt-0.5 leading-relaxed text-left">
                Con đang có <strong className="text-amber-600 font-black">{wrongQuestions.length} câu chưa đúng</strong>. Luyện lại để nhận gấp đôi sao vàng nhé!
              </p>
            </div>
          </div>
          <button
            onClick={onSelectWrongQuestions}
            id="practice-wrong-questions-btn"
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 border-b-[4px] md:border-b-[6px] border-amber-700 text-white font-black px-4 py-2.5 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] shrink-0 cursor-pointer"
          >
            Sửa lỗi ngay! 🚀
          </button>
        </div>
      )}

      {/* Exquisitely styled Exams Grid/List based on active filter */}
      <div className="text-left space-y-4">
        {selectedSubjectFilter === 'Tiếng Anh' ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[24px] md:rounded-[32px] p-8 text-center text-slate-500">
            <span className="text-5xl block mb-2">🇬🇧</span>
            <p className="font-black text-base uppercase text-slate-700">Môn Tiếng Anh Đang Biên Soạn</p>
            <p className="text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
              Môn Tiếng Anh hiện tại chưa có đề thi sẵn sàng. Con hãy chăm chỉ luyện tập môn <strong className="text-blue-500">Toán</strong> và <strong className="text-green-500">Tiếng Việt</strong> trước nhé!
            </p>
          </div>
        ) : (
          <>
            {/* Direct list/grid of filtered exams */}
            {(() => {
              const filteredExams = availableExams.filter(exam => {
                if (selectedSubjectFilter === 'all') return true;
                return exam.subjectName === selectedSubjectFilter;
              });

              if (filteredExams.length === 0) {
                return (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px] md:rounded-[32px] p-8 text-center text-slate-400">
                    <span className="text-3xl block mb-1">📝</span>
                    <p className="font-bold text-xs uppercase">Chưa có đề ôn luyện nào</p>
                    <p className="text-[10px] mt-0.5">Bố mẹ chưa tạo đề ôn luyện cho con ở Cổng Phụ Huynh.</p>
                  </div>
                );
              }

              // Color assignments for colorful exam cards
              const colors = [
                { bg: 'bg-[#3b82f6]', hover: 'hover:bg-blue-600', playColor: 'text-[#3b82f6]' },     // Blue
                { bg: 'bg-[#10b981]', hover: 'hover:bg-emerald-600', playColor: 'text-[#10b981]' }, // Emerald green
                { bg: 'bg-[#f59e0b]', hover: 'hover:bg-amber-600', playColor: 'text-[#f59e0b]' },   // Amber/orange
                { bg: 'bg-[#8b5cf6]', hover: 'hover:bg-purple-600', playColor: 'text-[#8b5cf6]' },  // Purple
                { bg: 'bg-[#ec4899]', hover: 'hover:bg-pink-600', playColor: 'text-[#ec4899]' },    // Pink
                { bg: 'bg-[#6366f1]', hover: 'hover:bg-indigo-600', playColor: 'text-[#6366f1]' },  // Indigo
              ];

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {filteredExams.map((exam, idx) => {
                    const theme = colors[idx % colors.length];
                    const isOverdue = exam.deadline && exam.deadline < new Date().toISOString().split('T')[0];
                    const formattedDeadline = exam.deadline ? exam.deadline.split('-').reverse().join('/') : '13/7/2026';
                    
                    return (
                      <div
                        key={exam.id}
                        onClick={() => {
                          if (onSelectExam) {
                            SoundService.speak(`Bắt đầu làm bài thi ${exam.name} nhé! Cố lên con yêu.`);
                            onSelectExam(exam);
                          }
                        }}
                        className={`${theme.bg} ${theme.hover} text-white rounded-[24px] p-5 md:p-6 shadow-sm transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-between gap-4`}
                      >
                        {/* Info of Exam (Left) */}
                        <div className="space-y-3.5 flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="bg-white/20 text-white font-black text-[9px] md:text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {exam.subjectName}
                            </span>
                            <span className="bg-white/20 text-white font-black text-[9px] md:text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                              ⏱️ {exam.questionCount ? exam.questionCount * 2 : 15}p
                            </span>
                            <span className="bg-rose-500 text-white font-black text-[9px] md:text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                              📅 {formattedDeadline}
                            </span>
                          </div>

                          {/* Title */}
                          <div>
                            <h3 className="font-sans font-black text-sm md:text-lg tracking-wide uppercase leading-snug line-clamp-1">
                              {exam.name}
                            </h3>
                            {exam.description && (
                              <p className="text-white/80 text-[11px] md:text-xs font-medium line-clamp-1 mt-0.5">
                                {exam.description}
                              </p>
                            )}
                          </div>

                          {/* Question Count Tag */}
                          <div className="inline-block bg-black/20 text-white text-[9px] md:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {exam.questionCount || 10} câu hỏi
                          </div>
                        </div>

                        {/* Play Arrow Button (Right) */}
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shrink-0 hover:scale-110 transition-transform shadow-md">
                          <Play className={`w-4 h-4 md:w-5 md:h-5 fill-current ${theme.playColor}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* === TÚI ĐỔI QUÀ ĐIỂM THƯỞNG === */}
      <div className="bg-white border-4 border-slate-100 rounded-[28px] md:rounded-[40px] p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
          <div className="text-left">
            <h3 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              🎁 ĐỔI QUÀ THƯỞNG SAO VÀNG
            </h3>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-0.5">
              Dùng sao vàng ⭐ con tự tay tích lũy được để nhận những món quà siêu xinh từ bố mẹ nhé!
            </p>
          </div>
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl md:rounded-2xl px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 text-emerald-800 font-black text-xs md:text-sm shrink-0 self-start md:self-auto">
            <span>⭐ Sao hiện có:</span>
            <span className="bg-emerald-500 text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-xs md:text-sm animate-pulse font-black">
              {stats?.points ?? student.points ?? 0}
            </span>
          </div>
        </div>

        {gifts.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500">
            <span className="text-3xl block mb-1">🧸</span>
            <p className="font-black text-xs uppercase tracking-wide text-slate-700">Chưa có quà trong cửa hàng</p>
            <p className="text-[10px] mt-1 max-w-md mx-auto leading-relaxed">
              Bố mẹ chưa cài đặt danh mục quà đổi điểm. Con hãy nhờ bố mẹ nhấn vào nút <strong className="text-blue-500">"Quản lý Phụ huynh"</strong> ở ngoài để thêm quà nhé!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {gifts.map((gift) => {
              const currentPoints = stats?.points ?? student.points ?? 0;
              const canRedeem = currentPoints >= gift.pointsCost;
              return (
                <div
                  key={gift.id}
                  onClick={() => {
                    if (canRedeem) {
                      handleRedeem(gift.id, gift.name);
                    }
                  }}
                  className={`relative border-4 rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col justify-between items-center transition-all duration-300 ${
                    canRedeem
                      ? 'border-emerald-400 bg-emerald-50/20 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-400/20 scale-102 hover:scale-105 active:scale-98 cursor-pointer'
                      : 'border-slate-100 bg-slate-50/50 opacity-80'
                  }`}
                >
                  {/* Sáng lên Effect overlay for redeemable gifts */}
                  {canRedeem && (
                    <div className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white font-black text-[8px] md:text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce shadow-md">
                      ✨ Đủ Sao ✨
                    </div>
                  )}

                  <div className="text-center">
                    <span className="text-3xl md:text-4xl block mb-1.5 filter drop-shadow-sm transform hover:scale-110 transition-transform">
                      {gift.icon}
                    </span>
                    <h4 className="font-black text-slate-800 text-xs md:text-sm mb-0.5 line-clamp-1 leading-tight">{gift.name}</h4>
                    <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 font-black text-[9px] md:text-xs px-2 py-0.5 md:py-1 rounded-full mb-2">
                      ⭐ {gift.pointsCost} điểm
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRedeem(gift.id, gift.name);
                    }}
                    disabled={!canRedeem || redeemLoading}
                    className={`w-full py-1.5 px-2 md:py-2 md:px-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs uppercase tracking-wider transition-all active:translate-y-0.5 cursor-pointer ${
                      canRedeem
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {canRedeem ? 'Đổi quà 🎁' : `Cần thêm ${gift.pointsCost - currentPoints} ⭐`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Lịch sử yêu cầu đổi quà */}
        <div className="mt-6 border-t-2 border-dashed border-slate-100 pt-4">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5 text-left">
            ⏱️ LỊCH SỬ ĐỔI QUÀ CỦA BÉ
          </h4>

          {redemptions.length === 0 ? (
            <p className="text-[10px] md:text-xs text-slate-400 italic font-bold text-left">
              Con chưa gửi yêu cầu đổi món quà nào. Chăm chỉ học tập để rinh quà nhé!
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {redemptions.map((red) => (
                <div
                  key={red.id}
                  className="flex items-center justify-between p-2.5 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl">{red.icon}</span>
                    <div>
                      <p className="font-black text-slate-800 text-xs md:text-sm">{red.giftName}</p>
                      <p className="text-[8px] md:text-[10px] text-slate-400 font-bold leading-tight">
                        Đổi ⭐ {red.pointsCost} • {new Date(red.requestedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div>
                    {red.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-black text-[8px] md:text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-amber-300">
                        Chờ duyệt 💬
                      </span>
                    )}
                    {red.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-black text-[8px] md:text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-emerald-300">
                        Đã nhận 🎉
                      </span>
                    )}
                    {red.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-black text-[8px] md:text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-rose-300">
                        Từ chối ↩️
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity List: styled exactly like the list items in Design HTML */}
      <div className="bg-white border-4 border-slate-100 rounded-[28px] md:rounded-[40px] p-4 md:p-6 text-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-wide">Nhật ký làm bài</h3>
          <span className="text-[10px] md:text-xs font-bold text-slate-400">Xem tiến trình của con</span>
        </div>

        {recentExams.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <span className="text-3xl block mb-1">📝</span>
            <p className="font-black text-xs uppercase tracking-wider">Chưa có bài thi</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentExams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 transition-all text-left"
              >
                {/* Subject Icon */}
                <div className={`w-10 h-10 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  exam.subjectName === 'Toán' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                }`}>
                  {exam.subjectName === 'Toán' ? '🔢' : '🔡'}
                </div>
                
                {/* Exam Title & Completed info */}
                <div className="flex-1 min-w-0">
                  <div className="font-black text-slate-800 truncate text-xs md:text-sm uppercase tracking-tight">{exam.examName}</div>
                  <div className="text-[8px] md:text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                    {exam.subjectName === 'Toán' ? 'Môn Toán' : 'Môn Tiếng Việt'} • Đúng {exam.correctCount}/{exam.correctCount + exam.wrongCount} câu
                  </div>
                </div>

                {/* Score & Date display */}
                <div className="text-right shrink-0">
                  <div className="font-black text-green-500 text-sm md:text-base">{exam.score}đ</div>
                  <div className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                    {new Date(exam.date).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lịch sử điểm số Modal */}
      {showHistoryModal && (() => {
        const formatDate = (isoString: string) => {
          try {
            const d = new Date(isoString);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes} - ${day}/${month}/${year}`;
          } catch (e) {
            return isoString;
          }
        };

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[24px] md:rounded-[32px] border-4 border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col text-left">
              
              {/* Header */}
              <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl shrink-0 shadow-3xs">
                    🏆
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm md:text-base uppercase tracking-wider leading-tight">
                      Lịch sử điểm của {student.name}
                    </h3>
                    <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                      Tổng tích lũy: <span className="text-amber-500 font-black">⭐ {stats?.points || student.points} sao</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-3.5">
                {fullHistoryExams.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-2">📝</div>
                    <h4 className="font-black text-slate-700 text-xs uppercase tracking-wider">Chưa có lịch sử làm bài</h4>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Bé hãy hoàn thành các đề thi ôn tập để ghi lại những điểm số đầu tiên nhé!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fullHistoryExams.map((exam, index) => {
                      const totalQuestions = exam.correctCount + exam.wrongCount;
                      
                      return (
                        <div
                          key={exam.id || index}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/10 transition-all"
                        >
                          {/* Subject & Exam Name */}
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                              exam.subjectName === 'Toán' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                            }`}>
                              {exam.subjectName === 'Toán' ? '🔢' : '🔡'}
                            </div>
                            <div className="min-w-0">
                              <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 border ${
                                exam.subjectName === 'Toán'
                                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                                  : 'bg-green-50 border-green-200 text-green-700'
                              }`}>
                                {exam.subjectName}
                              </span>
                              <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight leading-snug line-clamp-1">
                                {exam.examName}
                              </h4>
                            </div>
                          </div>

                          {/* Answers, Date, Score */}
                          <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
                            <div className="text-left sm:text-right">
                              <div className="text-[10px] md:text-xs text-slate-700 font-bold flex items-center gap-1 sm:justify-end">
                                <span className="text-emerald-500 font-black">✓ Đúng {exam.correctCount}</span>
                                <span className="text-slate-400">/ {totalQuestions} câu</span>
                              </div>
                              <div className="text-[8px] md:text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                                🕒 {formatDate(exam.date)}
                              </div>
                            </div>

                            <div className="flex flex-col items-center justify-center min-w-[50px] text-right">
                              <span className="text-xl md:text-2xl font-black text-amber-500 leading-none">
                                {exam.score}
                              </span>
                              <span className="text-[8px] md:text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">
                                điểm
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 md:p-5 border-t border-slate-100 flex justify-end bg-slate-50/50 shrink-0">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="bg-blue-500 hover:bg-blue-600 border-b-[4px] border-blue-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[1px] cursor-pointer shadow-sm"
                >
                  Đóng lại ✕
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Cửa hàng quà tặng Modal */}
      {showGiftModal && (() => {
        const currentPoints = stats?.points ?? student.points ?? 0;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[24px] md:rounded-[32px] border-4 border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col text-left">
              
              {/* Header */}
              <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-xl shrink-0 shadow-3xs">
                    🎁
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm md:text-base uppercase tracking-wider leading-tight">
                      Cửa hàng quà tặng của {student.name}
                    </h3>
                    <p className="text-[10px] md:text-xs text-slate-400 font-bold mt-0.5 uppercase tracking-wider flex items-center gap-1">
                      <span>Sao hiện có:</span>
                      <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] md:text-xs font-black animate-pulse">⭐ {currentPoints} sao</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Intro banner */}
                <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-200/50 rounded-2xl p-4 flex gap-3 items-center">
                  <span className="text-3xl animate-bounce">✨</span>
                  <p className="text-[11px] md:text-xs text-slate-600 font-bold leading-relaxed">
                    Dùng sao vàng con tích lũy được để đổi những món quà tuyệt vời! Các món quà <strong className="text-emerald-600">ĐỦ ĐIỂM ĐỔI</strong> sẽ có <strong className="text-emerald-500">VIỀN XANH PHÁT SÁNG lấp lánh</strong> đó nhé!
                  </p>
                </div>

                {gifts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <span className="text-5xl block mb-2">🧸</span>
                    <p className="font-black text-xs uppercase tracking-wide text-slate-700">Chưa có quà trong cửa hàng</p>
                    <p className="text-[10px] mt-1 max-w-sm mx-auto leading-relaxed">
                      Nhờ bố mẹ cài đặt danh mục quà trong Cổng Phụ Huynh để con đổi quà nhé!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-5">
                    {gifts.map((gift) => {
                      const canRedeem = currentPoints >= gift.pointsCost;
                      
                      return (
                        <div
                          key={gift.id}
                          onClick={() => {
                            if (canRedeem) {
                              handleRedeem(gift.id, gift.name);
                            }
                          }}
                          className={`relative border-4 rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col justify-between items-center transition-all duration-300 ${
                            canRedeem
                              ? 'border-emerald-400 bg-emerald-50/20 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-400/20 scale-102 hover:scale-105 active:scale-98 cursor-pointer'
                              : 'border-slate-100 bg-slate-50/50 opacity-70'
                          }`}
                        >
                          {/* Sáng lên Effect overlay for redeemable gifts */}
                          {canRedeem && (
                            <div className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white font-black text-[8px] md:text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce shadow-md">
                              ✨ Đủ Sao ✨
                            </div>
                          )}

                          <div className="text-center w-full">
                            <span className="text-4xl md:text-5xl block mb-2 filter drop-shadow-sm transform hover:scale-110 transition-transform">
                              {gift.icon}
                            </span>
                            <h4 className="font-black text-slate-800 text-xs md:text-sm mb-1 line-clamp-1 leading-tight uppercase tracking-tight">
                              {gift.name}
                            </h4>
                            <span className={`inline-flex items-center gap-0.5 font-black text-[10px] md:text-xs px-2.5 py-0.5 md:py-1 rounded-full mb-3 ${
                              canRedeem
                                ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300/30'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              ⭐ {gift.pointsCost} điểm
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRedeem(gift.id, gift.name);
                            }}
                            disabled={!canRedeem || redeemLoading}
                            className={`w-full py-2 px-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-wider transition-all active:translate-y-0.5 cursor-pointer ${
                              canRedeem
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 border-b-[4px] border-emerald-700 active:border-b-[1px]'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {canRedeem ? 'Đổi Quà 🎁' : `Thiếu ${gift.pointsCost - currentPoints} ⭐`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Integration of recent redemptions inside the modal */}
                <div className="border-t border-slate-100 pt-5 mt-2">
                  <h4 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-left">
                    ⏱️ YÊU CẦU ĐÃ GỬI BỐ MẸ
                  </h4>
                  {redemptions.length === 0 ? (
                    <p className="text-[10px] md:text-xs text-slate-400 font-bold italic text-left">
                      Chưa có yêu cầu nào được gửi đi.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {redemptions.map((red) => (
                        <div
                          key={red.id}
                          className="flex items-center justify-between p-2.5 md:p-3 bg-slate-50 rounded-xl border border-slate-100 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{red.icon}</span>
                            <div>
                              <p className="font-black text-slate-800 text-xs">{red.giftName}</p>
                              <p className="text-[8px] md:text-[9px] text-slate-400 font-bold">
                                Chi phí ⭐ {red.pointsCost} • {new Date(red.requestedAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          <div>
                            {red.status === 'pending' && (
                              <span className="inline-flex items-center bg-amber-50 text-amber-700 font-black text-[8px] md:text-[9px] uppercase px-2 py-0.5 rounded-md border border-amber-200">
                                Đang đợi bố mẹ 💬
                              </span>
                            )}
                            {red.status === 'approved' && (
                              <span className="inline-flex items-center bg-emerald-50 text-emerald-700 font-black text-[8px] md:text-[9px] uppercase px-2 py-0.5 rounded-md border border-emerald-200">
                                Đã nhận 🎉
                              </span>
                            )}
                            {red.status === 'rejected' && (
                              <span className="inline-flex items-center bg-rose-50 text-rose-700 font-black text-[8px] md:text-[9px] uppercase px-2 py-0.5 rounded-md border border-rose-200">
                                Từ chối ↩️
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 md:p-5 border-t border-slate-100 flex justify-end bg-slate-50/50 shrink-0">
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="bg-blue-500 hover:bg-blue-600 border-b-[4px] border-blue-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[1px] cursor-pointer shadow-sm"
                >
                  Đóng cửa hàng ✕
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
