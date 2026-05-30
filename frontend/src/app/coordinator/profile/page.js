"use client";

import { useState } from 'react';
import { UserCircle, Mail, Phone, MapPin, Building2, ShieldCheck, KeyRound, Save, BadgeCheck, Camera } from 'lucide-react';
import ImageCropModal from '@/components/modals/ImageCropModal';

export default function CoordinatorProfilePage() {
  const [formData, setFormData] = useState({
    name: 'Phạm Thị Điều Phối',
    employeeId: 'DP-88001',
    phone: '0901 999 888',
    email: 'dieuphoi.pham@unibus.vn',
    address: 'Văn phòng Điều hành Trung tâm, TP. Đà Nẵng'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTempImageUrl(imageUrl);
      setCropModalOpen(true);
    }
    e.target.value = null;
  };

  const handleConfirmCrop = (croppedImageUrl) => {
    setAvatar(croppedImageUrl);
    window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: croppedImageUrl }));
    setCropModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsEditing(false);
    alert("Cập nhật thông tin nhân viên điều phối thành công!");
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Hồ sơ cá nhân</h1>
        <p className="text-brand-text/60 font-medium">Quản lý thông tin tài khoản nhân viên điều hành.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        
        {/* Column 1: Identity Card */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-32 bg-brand-primary/20"></div>
            
            <label className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center relative z-10 mt-8 mb-4 cursor-pointer group">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserCircle className="w-32 h-32 text-brand-primary" />
              )}
              
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </label>
            
            <h2 className="text-2xl font-bold text-brand-text">{formData.name}</h2>
            <p className="text-brand-text/60 font-medium mb-2">Trưởng ca Điều phối</p>
            
            <div className="flex items-center gap-1 text-xs font-bold bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-md mb-6">
              <BadgeCheck className="w-3.5 h-3.5" /> Nhân sự cấp cao
            </div>
            
            <div className="w-full flex flex-col gap-3 text-left">
              <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
                <Building2 className="w-5 h-5 text-brand-text/40" />
                <div>
                  <div className="text-xs font-bold text-brand-text/40 uppercase">Phòng ban</div>
                  <div className="font-bold">Trung tâm Vận hành</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
                <ShieldCheck className="w-5 h-5 text-brand-text/40" />
                <div>
                  <div className="text-xs font-bold text-brand-text/40 uppercase">Mã Nhân viên</div>
                  <div className="font-bold">{formData.employeeId}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 & 3: Settings Form */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Thông tin liên lạc & Cá nhân</h3>
              {!isEditing ? (
                <button 
                  type="button" 
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-bold text-brand-primary hover:text-brand-text transition-colors px-4 py-2 bg-brand-primary/10 rounded-xl"
                >
                  Chỉnh sửa
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="text-sm font-bold text-white bg-brand-text hover:bg-black transition-colors px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Lưu thay đổi
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
                  <UserCircle className="w-4 h-4" /> Họ và tên
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
                  <ShieldCheck className="w-4 h-4" /> Mã nhân viên
                </label>
                <input 
                  type="text" 
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full bg-brand-surface border border-transparent disabled:opacity-70 disabled:cursor-not-allowed rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Số điện thoại nội bộ
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
                  <Mail className="w-4 h-4" /> Email công việc
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
                  <MapPin className="w-4 h-4" /> Địa chỉ văn phòng
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
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-brand-text/60" /> Bảo mật & Đăng nhập
            </h3>
            
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 border border-black/5 rounded-2xl">
              <div>
                <h4 className="font-bold">Mật khẩu hệ thống</h4>
                <p className="text-sm font-medium text-brand-text/60">Cập nhật lần cuối: 2 tháng trước</p>
              </div>
              <button className="px-6 py-3 bg-brand-surface font-bold text-sm rounded-xl hover:bg-black hover:text-white transition-colors w-full md:w-auto">
                Đổi mật khẩu
              </button>
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
