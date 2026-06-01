"use client";

import { useEffect, useState } from 'react';
import { UserCircle, Mail, Phone, MapPin, GraduationCap, KeyRound, Save, Camera } from 'lucide-react';
import ImageCropModal from '@/components/modals/ImageCropModal';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import { studentApi, studentVerificationApi, toApiAssetUrl } from '@/services/api';

const emptyProfile = {
  fullName: '',
  studentCode: '',
  phoneNumber: '',
  email: '',
  address: '',
  avatarUrl: '',
  university: '',
  faculty: '',
  academicYear: '',
  dateOfBirth: '',
};

export default function StudentProfilePage() {
  const [formData, setFormData] = useState(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [universities, setUniversities] = useState([]);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      studentApi.getProfile(),
      studentVerificationApi.listDaNangUniversities(),
    ])
      .then(([profile, universityList]) => {
        if (cancelled) return;
        const nextProfile = {
          fullName: profile.fullName || '',
          studentCode: profile.studentCode || '',
          phoneNumber: profile.phoneNumber || '',
          email: profile.email || '',
          address: profile.address || '',
          avatarUrl: profile.avatarUrl || '',
          university: profile.university || '',
          faculty: profile.faculty || '',
          academicYear: profile.academicYear || '',
          dateOfBirth: profile.dateOfBirth || '',
        };
        setFormData(nextProfile);
        setAvatar(toApiAssetUrl(profile.avatarUrl) || null);
        if (profile.avatarUrl) {
          window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: toApiAssetUrl(profile.avatarUrl) }));
        }
        setUniversities(universityList || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTempImageUrl(imageUrl);
      setCropModalOpen(true);
    }
    e.target.value = null;
  };

  const handleConfirmCrop = async (croppedImageUrl) => {
    setError('');
    setMessage('');
    setAvatar(croppedImageUrl);
    window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: croppedImageUrl }));
    setCropModalOpen(false);
    setIsSaving(true);
    try {
      const avatarProfile = await studentApi.uploadAvatar(dataUrlToFile(croppedImageUrl, 'avatar.jpg'));
      const nextAvatarUrl = avatarProfile.avatarUrl || '';
      setFormData((current) => ({ ...current, avatarUrl: nextAvatarUrl }));
      setAvatar(toApiAssetUrl(nextAvatarUrl) || null);
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: toApiAssetUrl(nextAvatarUrl) }));
      setMessage('Cập nhật ảnh đại diện thành công.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const payload = {
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        address: formData.address.trim() || null,
        university: formData.university.trim(),
        faculty: formData.faculty.trim() || null,
        academicYear: formData.academicYear ? Number(formData.academicYear) : null,
        dateOfBirth: formData.dateOfBirth || null,
      };

      const profile = await studentApi.updateProfile(payload);
      let avatarUrl = profile.avatarUrl || '';
      setFormData({
        fullName: profile.fullName || '',
        studentCode: profile.studentCode || '',
        phoneNumber: profile.phoneNumber || '',
        email: profile.email || '',
        address: profile.address || '',
        avatarUrl,
        university: profile.university || '',
        faculty: profile.faculty || '',
        academicYear: profile.academicYear || '',
        dateOfBirth: profile.dateOfBirth || '',
      });
      setAvatar(toApiAssetUrl(avatarUrl) || null);
      setIsEditing(false);
      setMessage('Cập nhật thông tin cá nhân thành công.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

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
        <p className="text-brand-text/60 font-medium">Thông tin được tải trực tiếp từ backend.</p>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-2xl text-sm font-bold text-brand-success">
          {message}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-32 bg-brand-secondary/20"></div>

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

            <h2 className="text-2xl font-bold text-brand-text">{formData.fullName || 'Sinh viên'}</h2>
            <p className="text-brand-text/60 font-medium mb-6">Sinh viên</p>

            <div className="w-full flex flex-col gap-3 text-left">
              <InfoCard icon={GraduationCap} label="Trường" value={formData.university || 'Chưa cập nhật'} />
              <InfoCard icon={UserCircle} label="Mã sinh viên" value={formData.studentCode || 'Chưa cập nhật'} />
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Thông tin liên lạc</h3>
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
                  disabled={isSaving}
                  className="text-sm font-bold text-white bg-brand-text hover:bg-black transition-colors px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileInput icon={UserCircle} label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleChange} disabled={!isEditing} />
              <ProfileInput icon={UserCircle} label="Mã sinh viên" name="studentCode" value={formData.studentCode} onChange={handleChange} disabled />
              <ProfileInput icon={Phone} label="Số điện thoại" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} disabled={!isEditing} />
              <ProfileInput icon={Mail} label="Email" type="email" name="email" value={formData.email} onChange={handleChange} disabled={!isEditing} />
              <ProfileSelect icon={GraduationCap} label="Trường" name="university" value={formData.university} onChange={handleChange} disabled={!isEditing} options={universities} />
              <ProfileInput icon={GraduationCap} label="Khoa" name="faculty" value={formData.faculty} onChange={handleChange} disabled={!isEditing} />
              <ProfileInput icon={KeyRound} label="Năm học" type="number" name="academicYear" value={formData.academicYear} onChange={handleChange} disabled={!isEditing} />
              <ProfileInput icon={UserCircle} label="Ngày sinh" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} disabled={!isEditing} />
              <div className="md:col-span-2">
                <ProfileInput icon={MapPin} label="Địa chỉ thường trú" name="address" value={formData.address} onChange={handleChange} disabled={!isEditing} />
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
                <p className="text-sm font-medium text-brand-text/60">Đổi mật khẩu tài khoản sinh viên.</p>
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
        <div className="font-bold truncate">{value}</div>
      </div>
    </div>
  );
}

function ProfileInput({ icon: Icon, label, disabled, type = 'text', ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </span>
      <input
        type={type}
        disabled={disabled}
        className="w-full bg-brand-surface border border-transparent disabled:opacity-70 disabled:cursor-not-allowed rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
        {...props}
      />
    </label>
  );
}

function ProfileSelect({ icon: Icon, label, disabled, options, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </span>
      <select
        disabled={disabled}
        className="w-full bg-brand-surface border border-transparent disabled:opacity-70 disabled:cursor-not-allowed rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
        {...props}
      >
        <option value="">Chọn trường</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
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
