import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
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
        


        <div className="p-4 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-brand-surface font-bold hover:bg-black/5 transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={() => onConfirm()}
            className="flex-1 py-3 rounded-xl bg-brand-danger text-white font-bold hover:bg-red-600 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
