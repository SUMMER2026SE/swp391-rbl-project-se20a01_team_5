"use client";

import { useEffect, useState } from 'react';
import { UserCircle, Mail, Phone, MapPin, Building2, ShieldCheck, KeyRound, Save, BadgeCheck, Camera } from 'lucide-react';
import ImageCropModal from '@/components/modals/ImageCropModal';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import { toApiAssetUrl, userApi } from '@/services/api';

const emptyProfile = {
  name: '',
  employeeId: '',
  phone: '',
  email: '',
  address: '',
};

export default function CoordinatorProfilePage() {
  const [formData, setFormData] = useState(emptyProfile);
  const [originalData, setOriginalData] = useState(emptyProfile);
  const [avatar, setAvatar] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    userApi.getProfile()
      .then((profile) => {
        if (cancelled) return;
        const next = {
          name: profile.fullName || '',
          employeeId: profile.userId ? `#${profile.userId}` : '',
          phone: profile.phoneNumber || '',
          email: profile.email || '',
          address: profile.address || '',
        };
        setFormData(next);
        setOriginalData(next);
        const nextAvatar = toApiAssetUrl(profile.avatarUrl) || null;
        setAvatar(nextAvatar);
        if (nextAvatar) {
          window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: nextAvatar }));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setTempImageUrl(URL.createObjectURL(file));
      setCropModalOpen(true);
    }
    event.target.value = null;
  };

  const handleConfirmCrop = async (croppedImageUrl) => {
    setError('');
    setMessage('');
    setAvatar(croppedImageUrl);
    window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: croppedImageUrl }));
    setCropModalOpen(false);
    setIsSaving(true);
    try {
      const nextProfile = await userApi.uploadAvatar(dataUrlToFile(croppedImageUrl, 'avatar.jpg'));
      const nextAvatar = toApiAssetUrl(nextProfile.avatarUrl) || null;
      setAvatar(nextAvatar);
      if (nextAvatar) {
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: nextAvatar }));
      }
      setMessage('Cập nhật ảnh đại diện thành công.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      const profile = await userApi.updateProfile({
        fullName: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phone.trim() || null,
        address: formData.address.trim() || null,
      });
      const nextAvatar = toApiAssetUrl(profile.avatarUrl) || null;
      const updated = {
        name: profile.fullName || '',
        employeeId: profile.userId ? `#${profile.userId}` : '',
        phone: profile.phoneNumber || '',
        email: profile.email || '',
        address: profile.address || '',
      };
      setFormData(updated);
      setOriginalData(updated);
      setAvatar(nextAvatar);
      if (nextAvatar) {
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: nextAvatar }));
      }
      setMessage('Cập nhật hồ sơ thành công.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm font-bold text-brand-text/50">Đang tải hồ sơ...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Hồ sơ cá nhân</h1>
        <p className="text-brand-text/60 font-medium">Quản lý thông tin tài khoản nhân viên điều hành.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
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

            <h2 className="text-2xl font-bold text-brand-text">{formData.name || 'Chưa có hồ sơ'}</h2>
            <p className="text-brand-text/60 font-medium mb-2">Trưởng ca Điều phối</p>

            <div className="flex items-center gap-1 text-xs font-bold bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-md mb-6">
              <BadgeCheck className="w-3.5 h-3.5" /> Nhân sự cấp cao
            </div>

            <div className="w-full flex flex-col gap-3 text-left">
              <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
                <Building2 className="w-5 h-5 text-brand-text/40" />
                <div>
                  <div className="text-xs font-bold text-brand-text/40 uppercase">Phòng ban</div>
                  <div className="font-bold">Điều phối vận hành</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl">
                <ShieldCheck className="w-5 h-5 text-brand-text/40" />
                <div>
                  <div className="text-xs font-bold text-brand-text/40 uppercase">Mã Nhân viên</div>
                  <div className="font-bold">{formData.employeeId || '--'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              <h3 className="text-xl font-bold">Thông tin liên lạc & Cá nhân</h3>
              <button
                type="submit"
                disabled={isSaving || !isDirty}
                className={`text-sm font-bold transition-colors px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm ${!isDirty && !isSaving ? 'bg-brand-surface text-brand-text/50 cursor-not-allowed border border-black/5' : 'bg-brand-text text-white hover:bg-black disabled:opacity-60'}`}
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileInput icon={UserCircle} label="Họ và tên" name="name" value={formData.name} onChange={handleChange} />
              <ProfileInput icon={ShieldCheck} label="Mã nhân viên" name="employeeId" value={formData.employeeId} disabled />
              <ProfileInput icon={Phone} label="Số điện thoại nội bộ" type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              <ProfileInput icon={Mail} label="Email công việc" type="email" name="email" value={formData.email} onChange={handleChange} />
              <div className="md:col-span-2">
                <ProfileInput icon={MapPin} label="Địa chỉ văn phòng" name="address" value={formData.address} onChange={handleChange} />
              </div>
            </div>
          </form>

          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-brand-text/60" /> Bảo mật & Đăng nhập
            </h3>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 border border-black/5 rounded-2xl">
              <div>
                <h4 className="font-bold">Mật khẩu đăng nhập</h4>
                <p className="text-sm font-medium text-brand-text/60">Bảo vệ tài khoản điều phối đang sử dụng.</p>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="px-6 py-3 bg-brand-surface font-bold text-sm rounded-xl hover:bg-black hover:text-white transition-colors w-full md:w-auto"
              >
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
      <ChangePasswordModal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
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

function dataUrlToFile(dataUrl, fileName) {
  const [metadata, content] = dataUrl.split(',');
  const mime = metadata.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mime });
}
