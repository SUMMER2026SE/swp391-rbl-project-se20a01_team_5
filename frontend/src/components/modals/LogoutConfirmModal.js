import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  const [rememberPassword, setRememberPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-black/5 relative">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 text-brand-text/40 hover:text-brand-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-brand-danger/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-brand-danger" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-center">Xác nhận đăng xuất</h3>
          <p className="text-center text-sm text-brand-text/60 mt-1">Bạn có chắc chắn muốn thoát khỏi ứng dụng?</p>
        </div>
        
        <div className="p-6 border-b border-black/5 bg-brand-surface/30">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer sr-only"
                checked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
              />
              <div className="w-5 h-5 bg-white border-2 border-black/20 rounded peer-checked:bg-brand-secondary peer-checked:border-brand-secondary transition-colors"></div>
              <svg className="absolute w-5 h-5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="text-sm font-bold text-brand-text/80">Nhớ tài khoản trên thiết bị này</span>
          </label>
        </div>

        <div className="p-4 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-brand-surface font-bold hover:bg-black/5 transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={() => onConfirm(rememberPassword)}
            className="flex-1 py-3 rounded-xl bg-brand-danger text-white font-bold hover:bg-red-600 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
