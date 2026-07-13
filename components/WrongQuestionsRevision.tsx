import React, { useState, useEffect } from 'react';
import { Student, WrongQuestion } from '../types';
import { api } from '../services/api';
import { SoundService } from './SoundService';
import { ArrowLeft, CheckCircle2, RotateCcw, Volume2, Smile, ArrowRight } from 'lucide-react';

interface WrongQuestionsRevisionProps {
  student: Student;
  onBack: () => void;
}

export default function WrongQuestionsRevision({
  student,
  onBack,
}: WrongQuestionsRevisionProps) {
  const [wrongs, setWrongs] = useState<WrongQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pool words for sorting
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [poolWords, setPoolWords] = useState<string[]>([]);
  const [sanitizedOptions, setSanitizedOptions] = useState<string[]>([]);

  useEffect(() => {
    async function loadWrongs() {
      try {
        const data = await api.getWrongQuestions(student.id);
        setWrongs(data);
      } catch (err) {
        console.error('Lỗi tải danh sách lỗi sai:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWrongs();
  }, [student.id]);

  const currentWrong = wrongs[currentIndex];

  useEffect(() => {
    if (!currentWrong) return;

    speakQuestion();

    const q = currentWrong.question;

    if (q.type === 'word-order' || q.type === 'drag-drop') {
      const rawOpts = q.options || [];
      const nonEmpties = rawOpts.map(o => String(o).trim()).filter(o => o !== '');
      const words = nonEmpties.length > 0 ? nonEmpties : q.content.split(' ').filter(w => w.trim() !== '');
      setPoolWords([...words].sort(() => Math.random() - 0.5));
      setAssembledWords([]);
    } else {
      setSelectedOption('');
      setTextAnswer('');

      // Compute sanitized options for multiple-choice / word-match / spelling / image-choice / true-false / reading-comprehension
      let opts: string[] = [];
      if (q.type === 'true-false') {
        opts = ['Đúng', 'Sai'];
      } else {
        const rawOpts = q.options || [];
        opts = rawOpts.map(o => String(o).trim()).filter(o => o !== '');

        // Ensure correctAnswer is included in the options
        const correctStr = String(q.correctAnswer || '').trim();
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
            if (q.type === 'spelling') {
              const distractors = ['an', 'anh', 'ong', 'ông', 'en', 'et', 'oang', 'oanh', 'uôn', 'iêc'].filter(d => d.toLowerCase() !== correctStr.toLowerCase());
              opts = [correctStr, ...distractors.slice(0, 3)];
            } else if (q.type === 'image-choice') {
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
  }, [currentIndex, wrongs.length]);

  const speakQuestion = () => {
    if (currentWrong) {
      const readText = currentWrong.question.readingText
        ? `${currentWrong.question.readingText}. Câu hỏi ôn tập là: ${currentWrong.question.content}`
        : currentWrong.question.content;
      SoundService.speak(`Câu hỏi sửa sai: ${readText}`);
    }
  };

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

  const handleSubmit = async () => {
    if (!currentWrong) return;
    const q = currentWrong.question;
    let finalAns = '';
    let correct = false;

    if (q.type === 'multiple-choice' || q.type === 'true-false' || q.type === 'image-choice' || q.type === 'spelling' || q.type === 'reading-comprehension' || q.type === 'word-match') {
      finalAns = selectedOption;
      correct = selectedOption.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    } else if (q.type === 'text-input') {
      finalAns = textAnswer.trim();
      correct = textAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    } else if (q.type === 'word-order' || q.type === 'drag-drop') {
      finalAns = assembledWords.join(' ');
      correct = finalAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    }

    setIsCorrect(correct);
    setHasAnswered(true);

    if (correct) {
      SoundService.playCorrect();
      setTimeout(() => SoundService.speak('Hoan hô con yêu! Con đã sửa sai thành công và được cộng thêm 15 điểm thưởng!'), 400);
      try {
        // Call API to remove from wrong questions database list
        await api.solveWrongQuestion(student.id, q.id);
        
        // Reward double/extra points for correction (+15 points!)
        await api.updateStudent(student.id, {
          points: student.points + 15,
        });
        student.points += 15;
      } catch (err) {
        console.error(err);
      }
    } else {
      SoundService.playIncorrect();
      setTimeout(() => SoundService.speak(`Vẫn chưa đúng rồi con ơi. Đáp án đúng của câu này là: ${q.correctAnswer}. Hãy nhớ kỹ nhé!`), 400);
    }
  };

  const handleNext = () => {
    SoundService.stopSpeaking();
    // Re-fetch or remove from current local list if answered correctly
    if (isCorrect) {
      const updated = [...wrongs];
      updated.splice(currentIndex, 1);
      setWrongs(updated);
      // Adjust pointer if pointing out of bound
      if (currentIndex >= updated.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } else {
      if (currentIndex + 1 < wrongs.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0); // wrap around
      }
    }
    setHasAnswered(false);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500 mb-4"></div>
        <p className="text-slate-500 font-bold text-base">Đang lấy các bài ôn lỗi sai...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Top action header bar */}
      <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-slate-700 font-black text-xs bg-white border border-slate-200 px-4 py-2.5 rounded-2xl transition-all active:translate-y-0.5 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </button>

        <div className="text-center">
          <span className="text-sm font-sans font-black text-amber-600 uppercase tracking-wider">
            {wrongs.length > 0 ? `Lỗi sai số ${currentIndex + 1} / ${wrongs.length}` : 'Đã sửa hết lỗi! 🎉'}
          </span>
        </div>

        {currentWrong && (
          <button
            onClick={speakQuestion}
            className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2.5 rounded-2xl border-2 border-amber-200 transition-all text-xs font-black uppercase tracking-wider active:translate-y-0.5 flex items-center gap-1.5"
          >
            <Volume2 className="w-4 h-4" /> Đọc lại đề 🔊
          </button>
        )}
      </div>

      {wrongs.length === 0 ? (
        <div className="bg-white rounded-[40px] p-10 border-4 border-emerald-100 text-center shadow-sm animate-pop">
          <span className="text-7xl animate-bounce block mb-6">🏆</span>
          <h2 className="text-2xl md:text-3xl font-sans font-black text-slate-800 mb-2 uppercase tracking-wide">QUÁ TUYỆT VỜI!</h2>
          <p className="text-slate-500 font-bold text-base max-w-md mx-auto italic leading-relaxed">
            Con đã sửa sạch sẽ tất cả các lỗi sai rồi! Không còn câu nào làm sai nữa cả. Con là siêu nhân học hè đấy!
          </p>
          <button
            onClick={onBack}
            className="mt-6 bg-emerald-500 hover:bg-emerald-600 border-b-[6px] border-emerald-700 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] cursor-pointer"
          >
            Quay lại trang chủ thôi! 🚀
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Question card */}
          <div className="bg-white rounded-[40px] p-6 md:p-10 shadow-sm border-4 border-amber-100 relative overflow-hidden">
            <span className="absolute top-4 right-4 bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Lỗi từ: {currentWrong.examName}
            </span>

            {/* Reading Text for Reading Comprehension */}
            {currentWrong.question.type === 'reading-comprehension' && currentWrong.question.readingText && (
              <div className="bg-amber-50/30 border-2 border-dashed border-amber-100 rounded-2xl p-4 mb-4 text-left text-slate-700 leading-relaxed text-sm font-bold mt-4">
                {currentWrong.question.readingText}
              </div>
            )}

            {/* Content */}
            <h2 className="text-xl md:text-2xl font-sans font-black text-slate-800 text-center mb-8 pt-4 uppercase tracking-wide">
              {currentWrong.question.content}
            </h2>

            {/* Options list */}
            {(currentWrong.question.type === 'multiple-choice' ||
              currentWrong.question.type === 'true-false' ||
              currentWrong.question.type === 'word-match' ||
              currentWrong.question.type === 'spelling' ||
              currentWrong.question.type === 'reading-comprehension') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                {sanitizedOptions.map((opt) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <button
                      key={opt}
                      disabled={hasAnswered}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-4 rounded-2xl border-4 font-black text-sm md:text-base transition-all text-center cursor-pointer active:translate-y-0.5 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-700 text-white border-b-[8px] active:translate-y-1 active:border-b-[2px]'
                          : 'bg-white border-slate-100 border-b-[8px] border-b-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text input option */}
            {currentWrong.question.type === 'text-input' && (
              <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                <input
                  type="text"
                  disabled={hasAnswered}
                  placeholder="Điền đáp án chính xác của con..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl border-4 border-slate-100 p-4 text-center text-xl font-black text-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Word sorting option */}
            {(currentWrong.question.type === 'word-order' || currentWrong.question.type === 'drag-drop') && (
              <div className="space-y-4 max-w-xl mx-auto">
                {/* Assembly Bar */}
                <div className="min-h-[72px] bg-amber-50/20 border-dashed border-4 border-amber-200 rounded-2xl p-3.5 flex flex-wrap gap-2.5 items-center justify-center">
                  {assembledWords.map((word, index) => (
                    <button
                      key={index}
                      disabled={hasAnswered}
                      onClick={() => handleTapAssembledWord(word, index)}
                      className="bg-white hover:bg-red-50 hover:text-red-600 border-2 border-b-4 border-amber-200 text-slate-700 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                    >
                      {word}
                    </button>
                  ))}
                </div>

                {/* Pool Words */}
                <div className="flex flex-wrap gap-2.5 justify-center">
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
              </div>
            )}
          </div>

          {/* Submit/Next Trigger */}
          {!hasAnswered ? (
            <button
              onClick={handleSubmit}
              disabled={
                (currentWrong.question.type === 'multiple-choice' ||
                  currentWrong.question.type === 'true-false' ||
                  currentWrong.question.type === 'word-match' ||
                  currentWrong.question.type === 'spelling' ||
                  currentWrong.question.type === 'reading-comprehension') && !selectedOption
              }
              className="w-full bg-amber-500 hover:bg-amber-600 border-b-[8px] border-amber-700 text-white font-black py-4 rounded-2xl shadow-xs transition-all text-sm md:text-base uppercase tracking-widest active:translate-y-1 active:border-b-[2px] cursor-pointer"
            >
              Sửa đáp án câu sai này 🛠️
            </button>
          ) : (
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
                    {isCorrect ? '🎉 TUYỆT VỜI! Con đã phục thù thành công!' : '😊 Gần đúng rồi con yêu.'}
                  </h4>
                  <p className="text-xs md:text-sm font-bold mt-1.5 leading-relaxed text-slate-600">
                    {isCorrect
                      ? `Nhận ngay +15 Điểm vàng sửa sai! Chúc mừng con nhé.`
                      : `Đáp án đúng là: ${currentWrong.question.correctAnswer}. Ghi nhớ để lần sau làm đúng nhé!`
                    }
                  </p>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border-b-[6px] border-slate-950 text-white font-black px-6 py-4 rounded-2xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
              >
                Tiếp tục <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
