import React, { useState } from 'react';
import { Student } from '../types';
import { Plus, Settings, UserCheck, Flame, Award, Trash2 } from 'lucide-react';
import { StudentAvatar } from './StudentAvatar';

interface StudentSelectionProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onOpenParentLogin: () => void;
  onAddStudent: (name: string, grade: 1 | 2, avatar: string) => Promise<void>;
  onDeleteStudent?: (id: string) => Promise<void>;
}

const AVATAR_OPTIONS = ['👧', '👦', '🦊', '🐻', '🦁', '🐱', '🐶', '🦄', '🐼', '🦖'];

export default function StudentSelection({
  students,
  onSelectStudent,
  onOpenParentLogin,
  onAddStudent,
  onDeleteStudent,
}: StudentSelectionProps) {
  const [passwordPromptStudent, setPasswordPromptStudent] = useState<Student | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleStudentClick = (student: Student) => {
    if (student.password) {
      setPasswordPromptStudent(student);
      setEnteredPassword('');
      setPasswordError('');
    } else {
      onSelectStudent(student);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-[80vh]">
      {/* Title with geometric balance look */}
      <div className="text-center mb-8 animate-float flex flex-col items-center">
        <div className="w-16 h-16 bg-orange-400 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-orange-100 mb-4 border-2 border-white">
          📚
        </div>
        <h1 className="text-4xl md:text-5xl font-sans font-black tracking-tight text-slate-800 uppercase">
          ÔN LUYỆN HÈ
        </h1>
        <p className="text-slate-500 font-bold italic mt-2 text-base">Trạm học tập vui vẻ cho các bé Lớp 1 & Lớp 2</p>
      </div>

      {/* Main selection board: rounded-[40px] with thick border */}
      <div className="bg-white rounded-[40px] p-6 md:p-10 border-4 border-slate-100 shadow-sm w-full text-center relative overflow-hidden">
        {/* Playful background blobs but keep them minimalist and clean */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-slate-50 rounded-full -translate-x-12 -translate-y-12 border border-slate-100" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-12 translate-y-12 border border-slate-100" />

        <h2 className="text-xl md:text-2xl font-sans font-black text-slate-800 mb-8 flex items-center justify-center gap-2 relative z-10 uppercase tracking-wide">
          <span>👋</span> Ai đang học thế nhỉ? Chọn mình nhé!
        </h2>

        {/* Kids list with geometric rounded-3xl / rounded-[32px] boxes */}
        <div className={`grid gap-6 justify-center items-stretch relative z-10 ${
          students.length === 1
            ? 'grid-cols-1 max-w-[320px] mx-auto'
            : students.length === 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-[660px] mx-auto'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto'
        }`}>
          {students.map((student) => (
            <div
              key={student.id}
              onClick={() => handleStudentClick(student)}
              id={`student-card-${student.id}`}
              className="bg-white rounded-[32px] p-6 border-4 border-slate-100 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between items-center relative active:translate-y-0.5"
            >
              {/* Grade label */}
              <div className={`absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full text-white uppercase tracking-wider ${
                student.grade === 1 ? 'bg-orange-500' : 'bg-blue-500'
              }`}>
                Lớp {student.grade}
              </div>

              {/* Avatar circle with border */}
              <div className="w-20 h-20 bg-slate-50 border-4 border-slate-100 group-hover:border-blue-300 rounded-full flex items-center justify-center shadow-sm my-4 group-hover:scale-105 transition-transform animate-wiggle overflow-hidden">
                <StudentAvatar avatar={student.avatar} className="w-full h-full" />
              </div>

              {/* Info */}
              <div className="text-center w-full">
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1">{student.name}</h3>
                
                {/* Stats quick pill */}
                <div className="flex justify-center items-center gap-2 mt-3 text-xs font-black">
                  <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full">
                    <Award className="w-3.5 h-3.5" /> {student.points} ĐIỂM
                  </span>
                  {student.streak > 0 && (
                    <span className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full">
                      <Flame className="w-3.5 h-3.5 text-orange-500" /> {student.streak} NGÀY
                    </span>
                  )}
                </div>
              </div>

              {/* Select indicator with 3D offset border active behavior */}
              <button className="mt-5 w-full bg-blue-500 group-hover:bg-blue-600 border-b-[6px] border-blue-700 text-white py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all group-hover:shadow-md">
                <UserCheck className="w-4 h-4" /> Vào học thôi!
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Password Prompt Modal */}
      {passwordPromptStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] border-4 border-slate-100 max-w-sm w-full p-6 text-center shadow-2xl relative animate-pop text-left">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 border-4 border-blue-200 rounded-full flex items-center justify-center overflow-hidden mb-4">
                <StudentAvatar avatar={passwordPromptStudent.avatar} className="w-full h-full" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-1">Chào {passwordPromptStudent.name}!</h3>
              <p className="text-xs text-slate-400 font-bold mb-4 uppercase tracking-wider">Nhập mật khẩu của con để vào học nhé 🔐</p>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (enteredPassword === passwordPromptStudent.password) {
                    onSelectStudent(passwordPromptStudent);
                    setPasswordPromptStudent(null);
                  } else {
                    setPasswordError('Mật khẩu chưa chính xác rồi, con thử lại nhé! 🥺');
                  }
                }}
                className="w-full space-y-3"
              >
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Mật khẩu của con..."
                  value={enteredPassword}
                  onChange={(e) => {
                    setEnteredPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 text-center text-lg font-black tracking-widest text-slate-700 focus:outline-hidden focus:border-blue-400 focus:bg-white"
                />

                {passwordError && (
                  <p className="text-xs font-bold text-red-500 animate-wiggle">{passwordError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPasswordPromptStudent(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 border-b-[4px] border-blue-700 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] shadow-sm"
                  >
                    Xác nhận
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Parental Gate Section: chunky dark slate button */}
      <div className="mt-10 flex flex-col items-center gap-2">
        <button
          onClick={onOpenParentLogin}
          id="parent-gate-btn"
          className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-b-[4px] border-slate-950 active:translate-y-0.5 active:border-b-[2px]"
        >
          <Settings className="w-4 h-4" /> Cổng Phụ Huynh (Quản lý đề) 🔑
        </button>
        <span className="text-xs text-slate-400 font-bold">Dành cho bố mẹ thiết lập đề thi, theo dõi kết quả</span>
      </div>
    </div>
  );
}
