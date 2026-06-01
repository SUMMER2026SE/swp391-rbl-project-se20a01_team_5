import { X, Globe, User } from 'lucide-react';

export default function GoogleLoginModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="p-8 text-center relative border-b border-black/5">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-brand-text/40 hover:text-brand-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-surface rounded-full flex items-center justify-center border border-black/5">
              <Globe className="w-8 h-8 text-brand-secondary" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-brand-text mb-2">Đăng nhập bằng Google</h2>
          <p className="text-sm text-brand-text/60 font-medium">OAuth backend chưa được triển khai.</p>
        </div>

        {/* Account List */}
        <div className="flex flex-col">
          <button className="flex items-center gap-4 p-4 mx-2 my-1 hover:bg-brand-surface rounded-2xl transition-colors">
            <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-text/60" />
            </div>
            <div className="text-left font-bold text-brand-text/80">
              Sử dụng tài khoản Google khi backend OAuth sẵn sàng
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 bg-brand-surface/30 text-center">
          <p className="text-xs text-brand-text/50">
            Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email và ảnh hồ sơ của bạn với UniBus.
          </p>
        </div>

      </div>
    </div>
  );
}
