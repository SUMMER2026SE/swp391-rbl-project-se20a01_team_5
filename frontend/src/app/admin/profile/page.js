"use client";

import { UserCircle, Mail, Phone, MapPin, Building2, ShieldCheck, KeyRound, Save, Server, Camera } from 'lucide-react';
import ImageCropModal from '@/components/modals/ImageCropModal';
import useProfileEditor from '@/components/profile/useProfileEditor';

export default function AdminProfilePage() {
  const {
    formData,
    isEditing,
    setIsEditing,
    avatar,
    cropModalOpen,
    setCropModalOpen,
    tempImageUrl,
    isLoading,
    isSaving,
    error,
    message,
    handleAvatarChange,
    handleConfirmCrop,
    handleChange,
    handleSubmit,
  } = useProfileEditor();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm font-bold text-brand-text/50">Đang tải hồ sơ...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Hồ sơ Quản trị viên</h1>
        <p className="text-brand-text/60 font-medium">Quản lý thông tin định danh của tài khoản Root (Super Admin).</p>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">

        {/* Column 1: Identity Card */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-32 bg-black/5"></div>

            <label className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center relative z-10 mt-8 mb-4 cursor-pointer group">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserCircle className="w-32 h-32 text-black" />
              )}

              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </label>

            <h2 className="text-2xl font-bold text-brand-text">{formData.name || 'Chưa có hồ sơ'}</h2>
            <p className="text-brand-text/60 font-medium mb-2">Super Admin</p>

            <div className="flex items-center gap-1 text-xs font-bold bg-black text-white px-3 py-1 rounded-md mb-6 shadow-lg shadow-black/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Toàn quyền hệ thống
            </div>

            <div className="w-full flex flex-col gap-3 text-left">
              <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
                <Building2 className="w-5 h-5 text-brand-text/40" />
                <div>
                  <div className="text-xs font-bold text-brand-text/40 uppercase">Phòng ban</div>
                  <div className="font-bold">Quản trị hệ thống</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
                <Server className="w-5 h-5 text-brand-text/40" />
                <div>
                  <div className="text-xs font-bold text-brand-text/40 uppercase">Mã Hệ thống</div>
                  <div className="font-bold">{formData.employeeId || '--'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 & 3: Settings Form */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
            {error && (
              <div className="mb-4 rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 rounded-2xl border border-brand-success/20 bg-brand-success/10 p-4 text-sm font-bold text-brand-success">
                {message}
              </div>
            )}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Thông tin liên lạc (Nội bộ)</h3>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-bold text-brand-text hover:bg-brand-text hover:text-white transition-colors px-4 py-2 bg-brand-surface rounded-xl"
                >
                  Chỉnh sửa
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="text-sm font-bold text-white bg-black hover:bg-black/80 transition-colors px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
                  <UserCircle className="w-4 h-4" /> Họ và tên (Bí danh)
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-brand-surface border border-transparent disabled:opacity-70 disabled:cursor-not-allowed rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> ID Định danh
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  disabled
                  className="w-full bg-brand-surface border border-transparent disabled:opacity-70 disabled:cursor-not-allowed rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Hotline Admin
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-brand-surface border border-transparent disabled:opacity-70 disabled:cursor-not-allowed rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email quản trị
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-brand-surface border border-transparent disabled:opacity-70 disabled:cursor-not-allowed rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Địa chỉ máy chủ / Văn phòng
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-brand-surface border border-transparent disabled:opacity-70 disabled:cursor-not-allowed rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
              </div>
            </div>
          </form>

          {/* Security */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-brand-danger">
              <KeyRound className="w-6 h-6" /> Bảo mật Cấp cao
            </h3>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 border border-black/5 rounded-2xl mb-4">
              <div>
                <h4 className="font-bold">Mật khẩu Root</h4>
                <p className="text-sm font-medium text-brand-text/60">Đăng nhập bằng thông tin xác thực backend.</p>
              </div>
              <button className="px-6 py-3 bg-brand-surface font-bold text-sm rounded-xl hover:bg-brand-danger hover:text-white transition-colors w-full md:w-auto">
                Đổi mật khẩu
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 border border-brand-primary/20 bg-brand-primary/5 rounded-2xl">
              <div>
                <h4 className="font-bold">Xác thực 2 lớp (2FA)</h4>
                <p className="text-sm font-medium text-brand-text/60">Yêu cầu mã OTP qua điện thoại khi đăng nhập từ thiết bị lạ.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-6 bg-brand-success rounded-full flex justify-end p-1 shadow-inner cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <span className="text-sm font-bold text-brand-success">Đang bật</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <ImageCropModal
        isOpen={cropModalOpen}
        imageUrl={tempImageUrl}
        onClose={() => setCropModalOpen(false)}
        onConfirm={handleConfirmCrop}
      />
    </div>
  );
}
