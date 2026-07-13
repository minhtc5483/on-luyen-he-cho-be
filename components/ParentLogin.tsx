import React, { useState } from 'react';
import { api } from '../services/api';
import { Lock, ArrowLeft, Key, Eye, EyeOff } from 'lucide-react';

interface ParentLoginProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

export default function ParentLogin({
  onLoginSuccess,
  onClose,
}: ParentLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      // We seed standard parent account with password '123456'
      await api.login('parent', password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Mật khẩu phụ huynh không chính xác.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12 animate-pop">
      <div className="bg-white rounded-[40px] p-6 md:p-8 shadow-sm border-4 border-slate-100 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-50 border-4 border-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500 animate-wiggle">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-sans font-black text-slate-800 uppercase tracking-wide">CỔNG BẢO MẬT PHỤ HUYNH</h2>
          <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">Xác minh quyền quản trị</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 text-red-700 text-xs font-bold p-3 rounded-xl mb-4 text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Nhập mật khẩu phụ huynh:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="Mặc định thử nghiệm: 123456"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl border-4 border-slate-100 py-3.5 pl-10 pr-10 text-slate-700 font-black text-center focus:outline-none focus:border-blue-500 text-sm"
              />
              <div className="absolute left-4 top-4.5 text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border-4 border-dashed border-slate-100 rounded-2xl p-4 text-[11px] text-slate-500 font-medium leading-relaxed">
            💡 <strong>Mẹo nhỏ:</strong> Để bảo vệ các bé không tự ý đổi cấu hình đề thi, chúng tôi thiết lập mật khẩu mặc định là <strong className="text-blue-500 font-black">123456</strong>. Bố mẹ có thể cấu hình lại sau này.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border-2 border-slate-200 border-b-[6px] border-b-slate-300 hover:border-slate-300 text-slate-700 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] cursor-pointer"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 border-b-[6px] border-blue-700 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all active:translate-y-0.5 active:border-b-[2px] cursor-pointer"
            >
              {isSubmitting ? 'Đang kiểm tra...' : 'Mở cổng 🔑'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
