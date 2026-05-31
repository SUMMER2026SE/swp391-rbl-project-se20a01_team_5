"use client";

import { useState } from 'react';
import { UserCircle, Map, Clock, ShieldCheck, Mail, Phone, Award, CreditCard, Camera } from 'lucide-react';
import ImageCropModal from '@/components/modals/ImageCropModal';

export default function DriverProfilePage() {
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

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Hồ sơ cá nhân</h1>
        <p className="text-brand-text/60 font-medium">Thông tin tài xế và thống kê hoạt động.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">

        {/* Column 1: Identity (Spans 1 col) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-32 bg-brand-primary/20"></div>

            <label className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center relative z-10 mt-8 mb-4 cursor-pointer group">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserCircle className="w-32 h-32 text-brand-text/20" />
              )}

              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </label>

            <h2 className="text-2xl font-bold text-brand-text">Chưa có hồ sơ</h2>
            <p className="text-brand-text/60 font-medium mb-6">Chưa có dữ liệu từ backend</p>

            <div className="w-full flex flex-col gap-3 text-left">
              <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
                <CreditCard className="w-5 h-5 text-brand-text/40" />
                <div>
                  <div className="text-xs font-bold text-brand-text/40 uppercase">Mã nhân viên</div>
                  <div className="font-bold">--</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
                <Phone className="w-5 h-5 text-brand-text/40" />
                <div>
                  <div className="text-xs font-bold text-brand-text/40 uppercase">Số điện thoại</div>
                  <div className="font-bold">--</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
                <Mail className="w-5 h-5 text-brand-text/40" />
                <div>
                  <div className="text-xs font-bold text-brand-text/40 uppercase">Email</div>
                  <div className="font-bold truncate max-w-[200px]">--</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 & 3: Stats & Details (Spans 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Stats Bento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center">
                <Map className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <div className="text-3xl font-black text-brand-text">--</div>
                <div className="text-sm font-bold text-brand-text/40 uppercase tracking-wider">Chuyến đã đi</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-secondary/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-brand-secondary" />
              </div>
              <div>
                <div className="text-3xl font-black text-brand-text">--</div>
                <div className="text-sm font-bold text-brand-text/40 uppercase tracking-wider">Giờ lái (Tháng này)</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-success/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-brand-success" />
              </div>
              <div>
                <div className="text-3xl font-black text-brand-text">--</div>
                <div className="text-sm font-bold text-brand-text/40 uppercase tracking-wider">Điểm an toàn</div>
              </div>
            </div>
          </div>

          {/* Licenses and Badges */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex-1">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-text" /> Bằng lái & Chứng chỉ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-black/5 rounded-2xl p-4 flex items-start gap-4 hover:border-brand-primary transition-colors">
                <div className="w-12 h-12 bg-brand-surface rounded-xl flex items-center justify-center shrink-0 font-black text-xl text-brand-primary">
                  E
                </div>
                <div>
                  <div className="font-bold">Chưa có dữ liệu bằng lái</div>
                  <div className="text-sm text-brand-text/60 mt-1">--</div>
                  <div className="text-sm font-bold text-brand-success mt-1">--</div>
                </div>
              </div>

              <div className="border border-black/5 rounded-2xl p-4 flex items-start gap-4 hover:border-brand-primary transition-colors">
                <div className="w-12 h-12 bg-brand-surface rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-brand-success" />
                </div>
                <div>
                  <div className="font-bold">Chưa có dữ liệu sức khỏe</div>
                  <div className="text-sm text-brand-text/60 mt-1">--</div>
                  <div className="text-sm font-bold text-brand-success mt-1">--</div>
                </div>
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
