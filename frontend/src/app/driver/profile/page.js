"use client";

import { useEffect, useState } from 'react';
import { Award, Camera, Clock, CreditCard, KeyRound, Mail, Map, MapPin, Phone, Save, ShieldCheck, UserCircle } from 'lucide-react';
import ImageCropModal from '@/components/modals/ImageCropModal';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import useProfileEditor from '@/components/profile/useProfileEditor';
import { driverApi } from '@/services/api';

const fallbackDriverProfile = {
  employeeId: 'DRV-ITER1-01',
  fullName: 'Nguyễn Minh Tài',
  phone: '0905551234',
  email: 'driver.iter1@unibus.vn',
  address: 'Đà Nẵng',
  totalTrips: 128,
  drivingHoursThisMonth: 64,
  safetyScore: 98,
  licenseClass: 'E',
  licenseExpiryDate: '2028-12-31',
  healthCertificateStatus: 'VALID',
};

export default function DriverProfilePage() {
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
    passwordModalOpen,
    setPasswordModalOpen,
    error,
    message,
    handleAvatarChange,
    handleConfirmCrop,
    handleChange,
    handleSubmit,
  } = useProfileEditor();
  const [driverProfile, setDriverProfile] = useState(fallbackDriverProfile);

  useEffect(() => {
    let mounted = true;

    driverApi.getProfile()
      .then((data) => {
        if (mounted && data) setDriverProfile(data);
      })
      .catch(() => {
        if (mounted) setDriverProfile(fallbackDriverProfile);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm font-bold text-brand-text/50">Đang tải hồ sơ...</div>
      </div>
    );
  }

  const displayName = formData.name || driverProfile.fullName;
  const displayPhone = formData.phone || driverProfile.phone;
  const displayEmail = formData.email || driverProfile.email;
  const displayEmployeeId = formData.employeeId || driverProfile.employeeId;
  const displayAddress = formData.address || driverProfile.address;

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Hồ sơ tài xế</h1>
        <p className="text-brand-text/60 font-medium">Thông tin cá nhân, thống kê hoạt động và chứng chỉ lái xe.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
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

            <h2 className="text-2xl font-bold text-brand-text">{displayName}</h2>
            <p className="text-brand-text/60 font-medium mb-6">Tài xế UniBus</p>

            <div className="w-full flex flex-col gap-3 text-left">
              <InfoCard icon={CreditCard} label="Mã nhân viên" value={displayEmployeeId || '--'} />
              <InfoCard icon={Phone} label="Số điện thoại" value={displayPhone || '--'} />
              <InfoCard icon={Mail} label="Email" value={displayEmail || '--'} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Thông tin liên lạc</h3>
              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)} className="text-sm font-bold text-brand-primary hover:text-brand-text transition-colors px-4 py-2 bg-brand-primary/10 rounded-xl">
                  Chỉnh sửa
                </button>
              ) : (
                <button type="submit" disabled={isSaving} className="text-sm font-bold text-white bg-brand-text hover:bg-black transition-colors px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-60">
                  <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileInput icon={UserCircle} label="Họ và tên" name="name" value={displayName || ''} onChange={handleChange} disabled={!isEditing} />
              <ProfileInput icon={CreditCard} label="Mã nhân viên" name="employeeId" value={displayEmployeeId || ''} disabled />
              <ProfileInput icon={Phone} label="Số điện thoại" type="tel" name="phone" value={displayPhone || ''} onChange={handleChange} disabled={!isEditing} />
              <ProfileInput icon={Mail} label="Email" type="email" name="email" value={displayEmail || ''} onChange={handleChange} disabled={!isEditing} />
              <div className="md:col-span-2">
                <ProfileInput icon={MapPin} label="Địa chỉ" name="address" value={displayAddress || ''} onChange={handleChange} disabled={!isEditing} />
              </div>
            </div>
          </form>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-surface flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-brand-text/60" />
              </div>
              <div>
                <h3 className="font-bold">Mật khẩu đăng nhập</h3>
                <p className="text-sm font-medium text-brand-text/60">Đổi mật khẩu tài khoản tài xế.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="px-6 py-3 bg-brand-surface font-bold text-sm rounded-xl hover:bg-black hover:text-white transition-colors w-full md:w-auto"
            >
              Đổi mật khẩu
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={Map} color="bg-brand-primary/20 text-brand-primary" value={driverProfile.totalTrips ?? '--'} label="Chuyến đã đi" />
            <StatCard icon={Clock} color="bg-brand-secondary/20 text-brand-secondary" value={driverProfile.drivingHoursThisMonth ?? '--'} label="Giờ lái tháng này" />
            <StatCard icon={ShieldCheck} color="bg-brand-success/20 text-brand-success" value={driverProfile.safetyScore ?? '--'} label="Điểm an toàn" />
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex-1">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-text" /> Bằng lái và chứng chỉ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CredentialCard title={`Bằng lái hạng ${driverProfile.licenseClass || '--'}`} subtitle={`Hết hạn: ${driverProfile.licenseExpiryDate || '--'}`} status="Hợp lệ" mark={driverProfile.licenseClass || 'E'} />
              <CredentialCard title="Giấy khám sức khỏe" subtitle="Hồ sơ tài xế" status={driverProfile.healthCertificateStatus || '--'} icon={ShieldCheck} />
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
      <ChangePasswordModal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
      <Icon className="w-5 h-5 text-brand-text/40" />
      <div className="min-w-0">
        <div className="text-xs font-bold text-brand-text/40 uppercase">{label}</div>
        <div className="font-bold truncate max-w-[200px]">{value}</div>
      </div>
    </div>
  );
}

function ProfileInput({ icon: Icon, label, disabled, type = 'text', ...props }) {
  return (
    <div>
      <label className="block text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </label>
      <input
        type={type}
        disabled={disabled}
        className="w-full bg-brand-surface border border-transparent disabled:opacity-70 disabled:cursor-not-allowed rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
        {...props}
      />
    </div>
  );
}

function StatCard({ icon: Icon, color, value, label }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-3xl font-black text-brand-text">{value}</div>
        <div className="text-sm font-bold text-brand-text/40 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function CredentialCard({ title, subtitle, status, mark, icon: Icon }) {
  return (
    <div className="border border-black/5 rounded-2xl p-4 flex items-start gap-4 hover:border-brand-primary transition-colors">
      <div className="w-12 h-12 bg-brand-surface rounded-xl flex items-center justify-center shrink-0 font-black text-xl text-brand-primary">
        {Icon ? <Icon className="w-6 h-6 text-brand-success" /> : mark}
      </div>
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-sm text-brand-text/60 mt-1">{subtitle}</div>
        <div className="text-sm font-bold text-brand-success mt-1">{status}</div>
      </div>
    </div>
  );
}
