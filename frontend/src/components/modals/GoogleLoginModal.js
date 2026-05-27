import { X, Globe, User } from 'lucide-react';

export default function GoogleLoginModal({ isOpen, onClose, onSelectAccount }) {
  if (!isOpen) return null;

  const accounts = [
    { name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', avatar: 'N', role: 'STUDENT', color: 'bg-orange-200 text-orange-800' },
    { name: 'Sinh Viên UniBus', email: 'sinhvien@unibus.edu.vn', avatar: 'S', role: 'STUDENT', color: 'bg-blue-300 text-blue-900' },
    { name: 'Admin UniBus', email: 'admin@unibus.edu.vn', avatar: 'A', role: 'ADMIN', color: 'bg-red-500 text-white' },
  ];

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
          <p className="text-sm text-brand-text/60 font-medium">Chọn tài khoản để tiếp tục với UniBus</p>
        </div>

        {/* Account List */}
        <div className="flex flex-col">
          {accounts.map((acc, index) => (
            <button 
              key={index}
              onClick={() => onSelectAccount(acc)}
              className="flex items-center gap-4 p-4 mx-2 my-1 hover:bg-brand-surface rounded-2xl transition-colors border-b border-black/5 last:border-b-0"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${acc.color}`}>
                {acc.avatar}
              </div>
              <div className="text-left">
                <div className="font-bold text-brand-text">{acc.name}</div>
                <div className="text-sm text-brand-text/60">{acc.email}</div>
              </div>
            </button>
          ))}
          
          <button className="flex items-center gap-4 p-4 mx-2 my-1 hover:bg-brand-surface rounded-2xl transition-colors">
            <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-text/60" />
            </div>
            <div className="text-left font-bold text-brand-text/80">
              Sử dụng tài khoản khác
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
