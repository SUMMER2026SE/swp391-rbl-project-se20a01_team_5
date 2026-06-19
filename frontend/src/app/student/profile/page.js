"use client";

import { useEffect, useState } from 'react';
import { UserCircle, Mail, Phone, MapPin, GraduationCap, KeyRound, Save, Camera } from 'lucide-react';
import ImageCropModal from '@/components/modals/ImageCropModal';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import { studentApi, studentVerificationApi, toApiAssetUrl } from '@/services/api';
import { MaterialCard, MaterialTextField, FilledButton, TonalButton, TextButton } from '@/components/ui/material';
import { motion } from 'framer-motion';

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
  hasPassword: true, // Default to true so it doesn't flash "Tạo mật khẩu" during load if possible, though it's masked by skeleton
};

export default function StudentProfilePage() {
  const [formData, setFormData] = useState(emptyProfile);
  const [originalData, setOriginalData] = useState(emptyProfile);
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
          hasPassword: profile.hasPassword || false,
        };
        setFormData(nextProfile);
        setOriginalData(nextProfile);
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
      const updatedProfile = {
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
        hasPassword: profile.hasPassword || false,
      };
      setFormData(updatedProfile);
      setOriginalData(updatedProfile);
      setAvatar(toApiAssetUrl(avatarUrl) || null);
      setMessage('Cập nhật thông tin cá nhân thành công.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // Khai báo variants cho animation mượt mà (GSAP style)
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="h-full flex flex-col gap-6 font-sans relative">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)] mb-2">Hồ sơ cá nhân</h1>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </motion.div>
      )}

      {message && (
        <motion.div variants={itemVariants} className="p-4 bg-brand-success/10 border border-brand-success/20 rounded-2xl text-sm font-bold text-brand-success">
          {message}
        </motion.div>
      )}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          <MaterialCard elevated={false} className="p-8 flex flex-col items-center text-center relative overflow-visible border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]">
            <div className="absolute top-0 left-0 w-full h-32 bg-[var(--md-sys-color-primary-container)]"></div>

            <label className="w-32 h-32 rounded-full bg-[var(--md-sys-color-surface)] border-4 border-[var(--md-sys-color-surface)] flex items-center justify-center relative z-10 mt-8 mb-4 cursor-pointer group hover:-translate-y-1 transition-transform duration-300">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover" 
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                />
              ) : null}
              <UserCircle className={avatar ? "w-32 h-32 text-[var(--md-sys-color-primary)] hidden" : "w-32 h-32 text-[var(--md-sys-color-primary)]"} />

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
          </MaterialCard>
        </motion.div>

        <motion.div variants={itemVariants} className="xl:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleSubmit}>
            <MaterialCard elevated={false} className="p-6 md:p-8 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">Thông tin liên lạc</h3>
                <FilledButton
                  type="submit"
                  disabled={isSaving || !isDirty}
                  className="shadow-none"
                >
                  <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </FilledButton>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileInput icon={UserCircle} label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleChange} />
              <ProfileInput icon={UserCircle} label="Mã sinh viên" name="studentCode" value={formData.studentCode} onChange={handleChange} disabled />
              <ProfileInput icon={Phone} label="Số điện thoại" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
              <ProfileInput icon={Mail} label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
              <ProfileSelect icon={GraduationCap} label="Trường" name="university" value={formData.university} onChange={handleChange} options={universities} />
              <ProfileInput icon={GraduationCap} label="Khoa" name="faculty" value={formData.faculty} onChange={handleChange} />
              <ProfileInput icon={KeyRound} label="Năm học" type="number" name="academicYear" value={formData.academicYear} onChange={handleChange} />
              <ProfileInput icon={UserCircle} label="Ngày sinh" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
              <div className="md:col-span-2">
                <ProfileInput icon={MapPin} label="Địa chỉ thường trú" name="address" value={formData.address} onChange={handleChange} />
              </div>
            </div>
            </MaterialCard>
          </form>

          <MaterialCard elevated={false} className="p-6 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-[var(--md-sys-color-on-surface)]" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--md-sys-color-on-surface)]">{formData.hasPassword ? 'Mật khẩu đăng nhập' : 'Tạo mật khẩu'}</h3>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  {formData.hasPassword ? 'Đổi mật khẩu tài khoản sinh viên.' : 'Thiết lập mật khẩu để đăng nhập.'}
                </p>
              </div>
            </div>
            <TonalButton
              type="button"
              onClick={() => setPasswordModalOpen(true)}
            >
              {formData.hasPassword ? 'Đổi mật khẩu' : 'Tạo mật khẩu'}
            </TonalButton>
          </MaterialCard>
        </motion.div>
      </div>

      <ImageCropModal
        isOpen={cropModalOpen}
        imageUrl={tempImageUrl}
        onClose={() => setCropModalOpen(false)}
        onConfirm={handleConfirmCrop}
      />
      <ChangePasswordModal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} hasPassword={formData.hasPassword} />
    </motion.div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-sys-shape-corner-medium)]">
      <Icon className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
      <div className="min-w-0">
        <div className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase">{label}</div>
        <div className="font-bold truncate text-[var(--md-sys-color-on-surface)]">{value}</div>
      </div>
    </div>
  );
}

function ProfileInput({ icon: Icon, label, disabled, type = 'text', name, value, onChange, ...props }) {
  return (
    <MaterialTextField
      label={label}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full"
      {...props}
    >
      <Icon slot="leading-icon" className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
    </MaterialTextField>
  );
}

function ProfileSelect({ icon: Icon, label, disabled, options, name, value, onChange, ...props }) {
  return (
    <label className="relative flex flex-col w-full h-[56px]">
      <span className="absolute -top-[9px] left-3 bg-[var(--md-sys-color-surface-container-lowest)] px-1 text-xs text-[var(--md-sys-color-on-surface-variant)] z-10">{label}</span>
      <div className="relative flex items-center h-full">
        <Icon className="absolute left-3 w-5 h-5 text-[var(--md-sys-color-on-surface-variant)] pointer-events-none" />
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full h-full bg-transparent border border-[var(--md-sys-color-outline)] disabled:border-[var(--md-sys-color-outline-variant)] disabled:text-[var(--md-sys-color-on-surface-variant)] rounded-[4px] px-4 pl-10 text-[var(--md-sys-color-on-surface)] text-base focus:outline-none focus:border-2 focus:border-[var(--md-sys-color-primary)] transition-all appearance-none cursor-pointer"
          {...props}
        >
          <option value="">Chọn {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
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

function ProfileSkeleton() {
  return (
    <div className="h-full flex flex-col gap-6 font-sans relative animate-pulse">
      <div>
        <div className="h-9 w-64 bg-brand-surface rounded-xl mb-3"></div>
        <div className="h-5 w-48 bg-brand-surface rounded-lg"></div>
      </div>
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        <div className="flex flex-col gap-6">
          <div className="p-8 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] rounded-[var(--md-sys-shape-corner-large)] flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-32 bg-[var(--md-sys-color-surface-container)]"></div>
            <div className="w-32 h-32 rounded-full bg-[var(--md-sys-color-surface-container-high)] border-4 border-[var(--md-sys-color-surface)] mb-6 mt-8 relative z-10"></div>
            <div className="h-7 w-40 bg-[var(--md-sys-color-surface-container-high)] rounded-xl mb-3"></div>
            <div className="h-5 w-24 bg-[var(--md-sys-color-surface-container-high)] rounded-lg mb-8"></div>
            <div className="w-full flex flex-col gap-3">
              <div className="h-16 w-full bg-[var(--md-sys-color-surface-container-high)] rounded-[var(--md-sys-shape-corner-medium)]"></div>
              <div className="h-16 w-full bg-[var(--md-sys-color-surface-container-high)] rounded-[var(--md-sys-shape-corner-medium)]"></div>
            </div>
          </div>
        </div>
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="p-6 md:p-8 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] rounded-[var(--md-sys-shape-corner-large)]">
            <div className="flex justify-between items-center mb-8">
              <div className="h-7 w-48 bg-[var(--md-sys-color-surface-container-high)] rounded-xl"></div>
              <div className="h-9 w-28 bg-[var(--md-sys-color-surface-container-high)] rounded-xl"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="h-5 w-32 bg-[var(--md-sys-color-surface-container-high)] rounded-lg mb-2"></div>
                  <div className="h-[56px] w-full bg-[var(--md-sys-color-surface-container-high)] rounded-[4px]"></div>
                </div>
              ))}
              <div className="md:col-span-2">
                <div className="h-5 w-32 bg-[var(--md-sys-color-surface-container-high)] rounded-lg mb-2"></div>
                <div className="h-[56px] w-full bg-[var(--md-sys-color-surface-container-high)] rounded-[4px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
