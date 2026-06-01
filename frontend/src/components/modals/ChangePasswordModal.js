"use client";

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, Save, X } from 'lucide-react';
import { userApi } from '@/services/api';

const emptyForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleClose = () => {
    setFormData(emptyForm);
    setError('');
    setMessage('');
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (formData.newPassword.length < 8) {
      setError('Mật khẩu mới cần ít nhất 8 ký tự.');
      return;
    }

    setIsSaving(true);
    try {
      await userApi.changePassword(formData);
      setMessage('Đổi mật khẩu thành công.');
      setFormData(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const passwordType = showPassword ? 'text' : 'password';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-black/10 overflow-hidden">
        <div className="p-6 border-b border-black/5 flex items-start justify-between gap-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-brand-primary" />
            </div>
            <h2 className="text-2xl font-black text-brand-text">Đổi mật khẩu</h2>
            <p className="text-sm font-medium text-brand-text/60 mt-1">
              Mật khẩu mới nên khác mật khẩu hiện tại và có cả chữ lẫn số.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-brand-surface text-brand-text/60 hover:text-brand-text transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-2xl border border-brand-success/20 bg-brand-success/10 p-4 text-sm font-bold text-brand-success">
              {message}
            </div>
          )}

          <PasswordField
            icon={Lock}
            label="Mật khẩu hiện tại"
            name="currentPassword"
            type={passwordType}
            autoComplete="current-password"
            value={formData.currentPassword}
            onChange={handleChange}
          />
          <PasswordField
            icon={KeyRound}
            label="Mật khẩu mới"
            name="newPassword"
            type={passwordType}
            autoComplete="new-password"
            value={formData.newPassword}
            onChange={handleChange}
          />
          <PasswordField
            icon={KeyRound}
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            type={passwordType}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-text/60 hover:text-brand-text"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          </button>

          <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-3 rounded-2xl bg-brand-surface font-bold text-sm hover:bg-black/5 transition-colors"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-3 rounded-2xl bg-brand-text text-white font-bold text-sm hover:bg-black transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu...' : 'Lưu mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordField({ icon: Icon, label, autoComplete, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-brand-text/70 mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4" /> {label}
      </span>
      <input
        required
        autoComplete={autoComplete}
        className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
        {...props}
      />
    </label>
  );
}
