import React, { useState, useEffect, useRef } from 'react';
import { Student, Exam, Question } from '../types';
import { SoundService } from './SoundService';
import {
  Volume2,
  CheckCircle2,
  ArrowRight,
  Smile,
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface ActiveExamProps {
  student: Student;
  exam: Exam & { questions: Question[] };
  onFinish: (answers: { questionId: string; isCorrect: boolean; answer: string }[]) => void;
  onQuit: () => void;
}

export default function ActiveExam({
  student,
  exam,
  onFinish,
  onQuit,
}: ActiveExamProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState<string>('');
  
  // Custom states for word assembly types (word-order, drag-drop)
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [poolWords, setPoolWords] = useState<string[]>([]);
  const [sanitizedOptions, setSanitizedOptions] = useState<string[]>([]);

  // Matching type state
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({}); // leftId -> rightId

  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const [submittedAnswers, setSubmittedAnswers] = useState<{
    questionId: string;
    isCorrect: boolean;
    answer: string;
  }[]>([]);

  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const questions = exam.questions;
  const currentQuestion = questions[currentIndex];

  // Initialize pool of words for word sorting types
  useEffect(() => {
    if (!currentQuestion) return;
    
    // Auto speak the question for children on load!
    speakQuestion();

    if (currentQuestion.type === 'word-order' || currentQuestion.type === 'drag-drop') {
      const rawOpts = currentQuestion.options || [];
      const nonEmpties = rawOpts.map(o => String(o).trim()).filter(o => o !== '');
      const words = nonEmpties.length > 0 ? nonEmpties : currentQuestion.content.split(' ').filter(w => w.trim() !== '');
      // Shuffle pool words
      setPoolWords([...words].sort(() => Math.random() - 0.5));
      setAssembledWords([]);
    } else {
      setSelectedOption('');
      setTextAnswer('');
      setMatchingAnswers({});
      setSelectedLeft(null);

      // Compute sanitized options for multiple-choice / word-match / spelling / image-choice / true-false / reading-comprehension
      let opts: string[] = [];
      if (currentQuestion.type === 'true-false') {
        opts = ['Đúng', 'Sai'];
      } else {
        const rawOpts = currentQuestion.options || [];
        opts = rawOpts.map(o => String(o).trim()).filter(o => o !== '');

        // Ensure correctAnswer is included in the options
        const correctStr = String(currentQuestion.correctAnswer || '').trim();
        if (correctStr && !opts.some(o => o.toLowerCase() === correctStr.toLowerCase())) {
          opts.push(correctStr);
        }

        // Add fallback distractors if we have fewer than 2 valid options
        if (opts.length <= 1) {
          const isNum = !isNaN(Number(correctStr)) && correctStr !== '';
          if (isNum) {
            const num = Number(correctStr);
            opts = [
              correctStr,
              String(num + 1),
              String(Math.max(0, num - 1)),
              String(num + 2)
            ];
          } else {
            if (currentQuestion.type === 'spelling') {
              const distractors = ['an', 'anh', 'ong', 'ông', 'en', 'et', 'oang', 'oanh', 'uôn', 'iêc'].filter(d => d.toLowerCase() !== correctStr.toLowerCase());
              opts = [correctStr, ...distractors.slice(0, 3)];
            } else if (currentQuestion.type === 'image-choice') {
              const distractors = ['🍎', '🍌', '🦊', '🐻', '🎈', '⭐', '🚗', '🐱', '🐶', '🦄'].filter(d => d !== correctStr);
              opts = [correctStr, ...distractors.slice(0, 2)];
            } else {
              const distractors = ['bố mẹ', 'học sinh', 'bông hoa', 'quả bóng', 'mặt trời', 'quyển sách', 'con mèo', 'trường học'].filter(d => d.toLowerCase() !== correctStr.toLowerCase());
              opts = [correctStr, ...distractors.slice(0, 3)];
            }
          }
        }
      }

      // De-duplicate options
      opts = Array.from(new Set(opts));

      // Shuffle options once so they are randomized but stay stable for this question
      setSanitizedOptions([...opts].sort(() => Math.random() - 0.5));
    }
    setHasAnswered(false);
  }, [currentIndex, exam.id]);

  // Clear timeout on unmount or transition
  useEffect(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  }, [currentIndex, exam.id]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const speakQuestion = () => {
    if (currentQuestion) {
      const readText = currentQuestion.readingText 
        ? `${currentQuestion.readingText}. Câu hỏi là: ${currentQuestion.content}`
        : currentQuestion.content;
      SoundService.speak(readText);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-bold">Lỗi: Bộ đề không có câu hỏi.</p>
        <button onClick={onQuit} className="mt-4 bg-slate-500 text-white px-4 py-2 rounded-xl">Quay lại</button>
      </div>
    );
  }

  // Handle tap word in sorting game
  const handleTapPoolWord = (word: string, index: number) => {
    if (hasAnswered) return;
    setAssembledWords([...assembledWords, word]);
    const newPool = [...poolWords];
    newPool.splice(index, 1);
    setPoolWords(newPool);
  };

  const handleTapAssembledWord = (word: string, index: number) => {
    if (hasAnswered) return;
    setPoolWords([...poolWords, word]);
    const newAssembled = [...assembledWords];
    newAssembled.splice(index, 1);
    setAssembledWords(newAssembled);
  };

  // Handle matching connect
  const handleLeftClick = (leftVal: string) => {
    if (hasAnswered) return;
    setSelectedLeft(leftVal);
  };

  const handleRightClick = (rightVal: string) => {
    if (hasAnswered || !selectedLeft) return;
    setMatchingAnswers({
      ...matchingAnswers,
      [selectedLeft]: rightVal,
    });
    setSelectedLeft(null);
  };

  const handleResetMatching = () => {
    if (hasAnswered) return;
    setMatchingAnswers({});
    setSelectedLeft(null);
  };

  // Submit Answer check
  const submitAndCheck = (userAnswer: string) => {
    if (hasAnswered) return;

    let finalUserAns = userAnswer.trim();
    let correct = false;

    if (
      currentQuestion.type === 'multiple-choice' ||
      currentQuestion.type === 'true-false' ||
      currentQuestion.type === 'image-choice' ||
      currentQuestion.type === 'word-match' ||
      currentQuestion.type === 'reading-comprehension' ||
      currentQuestion.type === 'spelling'
    ) {
      correct = finalUserAns.toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    } else if (currentQuestion.type === 'text-input') {
      correct = finalUserAns.toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    } else if (currentQuestion.type === 'word-order' || currentQuestion.type === 'drag-drop') {
      correct = finalUserAns.toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    } else if (currentQuestion.type === 'matching') {
      // Simulating a success connect
      const isComplete = Object.keys(matchingAnswers).length > 0;
      correct = isComplete; // For kid experience, any valid matching attempt is celebrated
      finalUserAns = JSON.stringify(matchingAnswers);
    }

    setIsCorrect(correct);
    setHasAnswered(true);

    if (correct) {
      SoundService.playCorrect();
      // Speak congratulations
      const encouragements = [
        'Con giỏi quá! 🌟',
        'Tuyệt vời ông mặt trời! ☀️',
        'Chính xác rồi con ơi! 🎉',
        'Quá đỉnh luôn! 🚀',
      ];
      const randomMsg = encouragements[Math.floor(Math.random() * encouragements.length)];
      setTimeout(() => SoundService.speak(`${randomMsg}. ${currentQuestion.explanation || ''}`), 500);
    } else {
      SoundService.playIncorrect();
      // Gently speak the answer
      setTimeout(() => SoundService.speak(`Chưa đúng rồi con yêu. Đáp án đúng là ${currentQuestion.correctAnswer}. Con cố gắng ở câu tiếp theo nhé!`), 500);
    }

    const newSubmitted = [
      ...submittedAnswers,
      {
        questionId: currentQuestion.id,
        isCorrect: correct,
        answer: finalUserAns || '(bỏ trống)',
      },
    ];
    setSubmittedAnswers(newSubmitted);

    // Auto advance to next question after 3.5 seconds
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      SoundService.stopSpeaking();
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onFinish(newSubmitted);
      }
    }, 3500);
  };

  const handleNextQuestion = () => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    SoundService.stopSpeaking();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Complete exam!
      onFinish(submittedAnswers);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Quiz Progress header bar */}
      <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs mb-6 flex items-center justify-between">
        <button
          onClick={onQuit}
          className="text-slate-500 hover:text-slate-700 font-black text-xs bg-white border border-slate-200 px-4 py-2.5 rounded-2xl transition-all active:translate-y-0.5"
        >
          ✕ Thoát bài ôn
        </button>

        {/* Progress pills */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-sans font-black text-blue-600 uppercase tracking-wider">
            Câu {currentIndex + 1} / {questions.length}
          </span>
          <div className="w-32 bg-slate-100 border border-slate-200 rounded-full h-3 mt-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={speakQuestion}
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-2xl border-2 border-blue-200 transition-all text-xs font-black uppercase tracking-wider active:translate-y-0.5 flex items-center gap-1.5"
        >
          <Volume2 className="w-4 h-4" /> Đọc đề 🔊
        </button>
      </div>

      {/* Main Question Display Box */}
      <div className="bg-white rounded-[40px] p-6 md:p-10 border-4 border-slate-100 shadow-sm mb-6 relative overflow-hidden">
        {/* Reading Text Container (For Reading Comprehension) */}
        {currentQuestion.type === 'reading-comprehension' && currentQuestion.readingText && (
          <div className="bg-emerald-50/40 border-2 border-dashed border-emerald-200 rounded-2xl p-4 mb-5 text-left text-slate-700 leading-relaxed text-sm font-bold">
            <div className="flex items-center gap-1.5 text-emerald-700 font-black mb-1.5 text-xs uppercase tracking-widest">
              <BookOpen className="w-4 h-4" /> Tập đọc truyện nhỏ:
            </div>
            {currentQuestion.readingText}
          </div>
        )}

        {/* Question content */}
        <h2 className="text-xl md:text-2xl font-sans font-black text-slate-800 text-center leading-snug mb-8 uppercase tracking-wide">
          {currentQuestion.content}
        </h2>

        {/* ==================== INTERACTIVE ANSWERS BY TYPE ==================== */}

        {/* 1. Multiple Choice / Word Match / Reading Comprehension / Spelling / True-False */}
        {(currentQuestion.type === 'multiple-choice' ||
          currentQuestion.type === 'true-false' ||
          currentQuestion.type === 'word-match' ||
          currentQuestion.type === 'spelling' ||
          currentQuestion.type === 'reading-comprehension') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            {sanitizedOptions.map((opt) => {
              const isSelected = selectedOption === opt;
              const isCorrectOpt = opt.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
              
              let btnClass = '';
              if (hasAnswered) {
                if (isCorrectOpt) {
                  btnClass = 'bg-emerald-500 border-emerald-700 text-white border-b-[8px]';
                } else if (isSelected) {
                  btnClass = 'bg-rose-500 border-rose-700 text-white border-b-[8px]';
                } else {
                  btnClass = 'bg-white border-slate-100 border-b-[8px] border-b-slate-200 text-slate-400 opacity-40';
                }
              } else {
                if (isSelected) {
                  btnClass = 'bg-blue-500 border-blue-700 text-white border-b-[8px] active:translate-y-1 active:border-b-[2px]';
                } else {
                  btnClass = 'bg-white border-slate-100 border-b-[8px] border-b-slate-200 text-slate-700 hover:border-slate-300';
                }
              }

              return (
                <button
                  key={opt}
                  disabled={hasAnswered}
                  onClick={() => {
                    setSelectedOption(opt);
                    submitAndCheck(opt);
                  }}
                  id={`option-${opt}`}
                  className={`p-4 rounded-2xl border-4 font-black text-sm md:text-base transition-all text-center cursor-pointer active:translate-y-0.5 ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Text Input (Numbers or Short Words) */}
        {currentQuestion.type === 'text-input' && (
          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
            <input
              type="text"
              disabled={hasAnswered}
              placeholder="Bé hãy viết đáp án tại đây..."
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && textAnswer.trim()) {
                  submitAndCheck(textAnswer);
                }
              }}
              className="w-full bg-slate-50 rounded-2xl border-4 border-slate-100 p-4 text-center text-xl font-black text-slate-800 focus:outline-none focus:border-blue-400 placeholder:text-slate-400"
            />
            
            {/* Quick digit helpers for Math calculations */}
            {!hasAnswered && (
              <div className="grid grid-cols-5 gap-2.5 w-full pt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTextAnswer((prev) => prev + num)}
                    className="bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-black py-2.5 rounded-xl text-base transition-all active:translate-y-0.5"
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            {!hasAnswered && (
              <button
                type="button"
                onClick={() => {
                  if (textAnswer.trim()) submitAndCheck(textAnswer);
                }}
                disabled={!textAnswer.trim()}
                className="w-full mt-2 bg-blue-500 hover:bg-blue-600 border-b-[6px] border-blue-700 text-white font-black py-3 rounded-xl shadow-xs transition-all text-sm uppercase tracking-widest active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận đáp án 🚀
              </button>
            )}
          </div>
        )}

        {/* 3. Image Choice */}
        {currentQuestion.type === 'image-choice' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
            {sanitizedOptions.map((opt) => {
              const isSelected = selectedOption === opt;
              const isCorrectOpt = opt.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
              
              let btnClass = '';
              if (hasAnswered) {
                if (isCorrectOpt) {
                  btnClass = 'bg-emerald-100 border-emerald-500 text-emerald-800 border-b-[8px] border-b-emerald-600';
                } else if (isSelected) {
                  btnClass = 'bg-rose-100 border-rose-500 text-rose-800 border-b-[8px] border-b-rose-600';
                } else {
                  btnClass = 'bg-white border-slate-100 border-b-[8px] border-b-slate-200 text-slate-400 opacity-40';
                }
              } else {
                if (isSelected) {
                  btnClass = 'bg-amber-100 border-amber-400 text-amber-800 border-b-[8px] border-b-amber-600 active:translate-y-1 active:border-b-[2px]';
                } else {
                  btnClass = 'bg-white border-slate-100 border-b-[8px] border-b-slate-200 text-slate-700 hover:border-slate-300';
                }
              }

              return (
                <button
                  key={opt}
                  disabled={hasAnswered}
                  onClick={() => {
                    setSelectedOption(opt);
                    submitAndCheck(opt);
                  }}
                  className={`p-5 rounded-2xl border-4 transition-all text-center flex flex-col items-center justify-center active:translate-y-0.5 ${btnClass}`}
                >
                  <span className="text-5xl md:text-6xl mb-2 animate-float">{opt}</span>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wide">Hình {opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. Word Order / Drag and Drop assembled words */}
        {(currentQuestion.type === 'word-order' || currentQuestion.type === 'drag-drop') && (
          <div className="space-y-6 max-w-xl mx-auto">
            {/* Assembly Bar */}
            <div className="min-h-[72px] bg-sky-50/50 border-dashed border-4 border-sky-200 rounded-2xl p-3.5 flex flex-wrap gap-2.5 items-center justify-center">
              {assembledWords.length === 0 && (
                <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Nhấn chọn chữ bên dưới xếp vào đây! 👇</span>
              )}
              {assembledWords.map((word, index) => (
                <button
                  key={index}
                  disabled={hasAnswered}
                  onClick={() => handleTapAssembledWord(word, index)}
                  className="bg-white hover:bg-red-50 hover:text-red-600 border-2 border-b-4 border-sky-300 text-sky-800 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  {word}
                </button>
              ))}
            </div>

            {/* Source Words Pool */}
            <div className="flex flex-wrap gap-2.5 justify-center pt-2">
              {poolWords.map((word, index) => (
                <button
                  key={index}
                  disabled={hasAnswered}
                  onClick={() => handleTapPoolWord(word, index)}
                  className="bg-slate-100 hover:bg-slate-200 border-2 border-b-4 border-slate-300 text-slate-700 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  {word}
                </button>
              ))}
            </div>

            {!hasAnswered && assembledWords.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  submitAndCheck(assembledWords.join(' '));
                }}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 border-b-[6px] border-blue-700 text-white font-black py-3 rounded-xl shadow-xs transition-all text-sm uppercase tracking-widest active:translate-y-0.5"
              >
                Xác nhận câu ghép 🚀
              </button>
            )}
          </div>
        )}

        {/* 5. Matching Columns */}
        {currentQuestion.type === 'matching' && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-6 text-center">
              {/* Left Column */}
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Cột Trái</p>
                {(currentQuestion.options || []).map((leftVal) => {
                  const isLinked = !!matchingAnswers[leftVal];
                  const isSelected = selectedLeft === leftVal;
                  
                  return (
                    <button
                      key={leftVal}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleLeftClick(leftVal)}
                      className={`w-full p-4 rounded-xl border-4 text-left font-black text-xs md:text-sm transition-all active:translate-y-0.5 ${
                        isSelected
                          ? 'bg-blue-500 text-white border-blue-700 border-b-[6px]'
                          : isLinked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 border-b-[6px] border-b-emerald-500'
                          : 'bg-white border-slate-100 border-b-[6px] border-b-slate-200'
                      }`}
                    >
                      {leftVal} {isLinked && `🔗 (${matchingAnswers[leftVal]})`}
                    </button>
                  );
                })}
              </div>

              {/* Right Column */}
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Cột Phải</p>
                {/* Find matched right values to make options unique */}
                {Array.from(new Set((currentQuestion.matchingPairs || []).map(p => p.right))).map((rightVal) => {
                  const isLinkedToAny = Object.values(matchingAnswers).includes(rightVal);
                  return (
                    <button
                      key={rightVal}
                      type="button"
                      disabled={hasAnswered || !selectedLeft}
                      onClick={() => handleRightClick(rightVal)}
                      className={`w-full p-4 rounded-xl border-4 text-left font-black text-xs md:text-sm transition-all ${
                        isLinkedToAny
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 border-b-[6px] border-b-emerald-400'
                          : selectedLeft
                          ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 text-slate-800 border-b-[6px] border-b-amber-500 animate-pulse'
                          : 'bg-white border-slate-100 border-b-[6px] border-b-slate-200'
                      }`}
                    >
                      {rightVal}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear matching connections */}
            {!hasAnswered && Object.keys(matchingAnswers).length > 0 && (
              <button
                type="button"
                onClick={handleResetMatching}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold flex items-center justify-center gap-1.5 mx-auto pt-3 uppercase tracking-wider"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Xóa các liên kết
              </button>
            )}

            {!hasAnswered && Object.keys(matchingAnswers).length > 0 && (
              <button
                type="button"
                onClick={() => {
                  submitAndCheck(JSON.stringify(matchingAnswers));
                }}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 border-b-[6px] border-blue-700 text-white font-black py-3 rounded-xl shadow-xs transition-all text-sm uppercase tracking-widest active:translate-y-0.5"
              >
                Xác nhận nối hình 🚀
              </button>
            )}
          </div>
        )}

      </div>

      {/* Answer Verification Banner (Slide up) */}
      {hasAnswered && (
        <div className={`p-6 rounded-[32px] text-left border-4 animate-pop flex flex-col sm:flex-row items-center justify-between gap-6 ${
          isCorrect 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-2 ${
              isCorrect ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-amber-100 text-amber-600 border-amber-200'
            }`}>
              {isCorrect ? <CheckCircle2 className="w-8 h-8" /> : <Smile className="w-8 h-8 animate-wiggle" />}
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-sans font-black uppercase tracking-tight">
                {isCorrect ? '🎉 Chính xác! Tuyệt vời quá.' : '😊 Không sao đâu con ơi.'}
              </h4>
              <p className="text-xs md:text-sm font-bold mt-1.5 leading-relaxed text-slate-600">
                {isCorrect 
                  ? `+10 Điểm vàng! ${currentQuestion.explanation || 'Con thật thông minh.'}`
                  : `Đáp án đúng là: ${currentQuestion.correctAnswer}. ${currentQuestion.explanation || 'Con cố gắng ở câu tiếp theo nhé!'}`
                }
              </p>
            </div>
          </div>

          <button
            onClick={handleNextQuestion}
            id="next-question-btn"
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border-b-[6px] border-slate-950 text-white font-black px-6 py-4 rounded-2xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            Tiếp tục <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
