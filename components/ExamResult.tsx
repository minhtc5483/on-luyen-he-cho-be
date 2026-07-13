import React, { useEffect } from 'react';
import { Student, Exam } from '../types';
import { SoundService } from './SoundService';
import { Award, BookOpen, Calculator, RotateCcw, ArrowRight, Home, Flame } from 'lucide-react';

interface ExamResultProps {
  student: Student;
  exam: Exam;
  score: number;
  correctCount: number;
  wrongCount: number;
  streakBonus?: {
    days: number;
    points: number;
    message: string;
  };
  onRetry: () => void;
  onOtherExams: () => void;
  onPracticeWrongs?: () => void;
}

export default function ExamResult({
  student,
  exam,
  score,
  correctCount,
  wrongCount,
  streakBonus,
  onRetry,
  onOtherExams,
  onPracticeWrongs,
}: ExamResultProps) {
  
  useEffect(() => {
    SoundService.playTriumph();
    if (streakBonus) {
      SoundService.speak(`Chúc mừng ${student.name} đã đạt chuỗi ${streakBonus.days} ngày học liên tiếp và được nhận thêm ${streakBonus.points} sao vàng đặc biệt!`);
    } else {
      SoundService.speak(`Chúc mừng ${student.name} đã hoàn thành bài thi ${exam.name}! Con xuất sắc đạt được ${score} điểm!`);
    }
  }, []);

  const getStars = () => {
    if (score === 100) return '⭐⭐⭐';
    if (score >= 70) return '⭐⭐';
    return '⭐';
  };

  const getEncouragement = () => {
    if (score === 100) return 'Quá xuất sắc! Con đạt điểm tuyệt đối 100 rồi đấy! 🏆';
    if (score >= 80) return 'Rất tốt! Con thông minh lắm, chút xíu nữa là tuyệt đối rồi. 🥳';
    if (score >= 50) return 'Chúc mừng con! Con hãy làm lại để lấy 3 sao nhé. 🌟';
    return 'Con đã cố gắng rồi! Hãy cùng ôn luyện lại các câu sai để nhớ bài hơn nhé. ❤️';
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 animate-pop">
      <div className="bg-white rounded-[40px] p-6 md:p-10 border-4 border-slate-100 text-center relative overflow-hidden shadow-sm">
        
        {/* Confetti simulation decoration */}
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400" />
        
        <h1 className="text-3xl md:text-4xl font-sans font-black text-slate-800 mt-6 mb-2 uppercase tracking-wide">🎉 HOÀN THÀNH 🎉</h1>
        <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-6">{exam.name}</p>

        {/* Big visual star count */}
        <div className="text-5xl md:text-6xl my-6 animate-bounce filter drop-shadow-md">
          {getStars()}
        </div>

        {/* Score indicator */}
        <div className="bg-slate-50 border-4 border-slate-100 rounded-[32px] p-6 max-w-sm mx-auto mb-6 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Điểm của con đạt được</p>
          <span className="text-5xl md:text-6xl font-black text-blue-600 tracking-tight">{score}</span>
          <span className="text-2xl font-black text-slate-400">/100</span>
          
          <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t-2 border-dashed border-slate-200">
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Trả lời Đúng</p>
              <p className="text-base font-black text-emerald-600 mt-1">✅ {correctCount} câu</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Làm Chưa Đúng</p>
              <p className="text-base font-black text-slate-400 mt-1">❌ {wrongCount} câu</p>
            </div>
          </div>
        </div>

        {/* Encouraging message */}
        <p className="text-sm md:text-base font-black text-slate-700 px-4 mb-8 leading-relaxed italic">
          {getEncouragement()}
        </p>

        {/* Action button tree */}
        <div className="space-y-4 max-w-sm mx-auto">
          {/* Practice wrong answers if any */}
          {wrongCount > 0 && onPracticeWrongs && (
            <button
              onClick={onPracticeWrongs}
              className="w-full bg-amber-500 hover:bg-amber-600 border-b-[8px] border-amber-700 text-white font-black py-4 rounded-2xl shadow-xs transition-all text-sm uppercase tracking-wider active:translate-y-1 active:border-b-[2px] cursor-pointer flex items-center justify-center gap-2"
            >
              🔄 Ôn lại các câu sai
            </button>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onRetry}
              className="bg-white border-2 border-slate-200 border-b-[6px] border-b-slate-300 hover:border-slate-300 text-slate-700 font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Làm lại bài này
            </button>
            <button
              onClick={onOtherExams}
              className="bg-blue-500 hover:bg-blue-600 border-b-[6px] border-blue-700 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] cursor-pointer flex items-center justify-center gap-1.5"
            >
              Làm đề khác <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Streak Milestone Rewards Card */}
        {streakBonus && (
          <div className="mt-6 bg-gradient-to-r from-orange-500 to-amber-400 text-white border-4 border-orange-300 rounded-[28px] p-5 shadow-lg shadow-orange-500/20 flex items-center gap-4 text-left animate-pulse">
            <span className="text-4xl">🔥</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] bg-white/20 text-white font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                Kỷ Lục Chuỗi Mới! 🌟
              </p>
              <h3 className="font-sans font-black text-xs md:text-sm leading-tight uppercase tracking-wide">
                {streakBonus.message}
              </h3>
              <p className="text-[11px] font-bold text-orange-100 mt-1 uppercase tracking-wide">
                Bé đạt chuỗi {streakBonus.days} ngày học • Nhận thêm <span className="text-yellow-300 font-black">+{streakBonus.points} Sao vàng</span> ⭐
              </p>
            </div>
          </div>
        )}

        {/* Streak milestone alert if perfect score */}
        {score === 100 && (
          <div className="mt-8 bg-orange-50 border-4 border-dashed border-orange-200 rounded-[24px] p-4 flex items-center gap-3.5 justify-center text-left">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-xs text-orange-600 font-black uppercase tracking-wider">SIÊU CHĂM CHỈ!</p>
              <p className="text-xs text-slate-600 font-bold mt-0.5 leading-relaxed">Điểm tuyệt đối giúp con nuôi chuỗi học tập dài hơn và gặt hái nhiều phần thưởng nhé!</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
