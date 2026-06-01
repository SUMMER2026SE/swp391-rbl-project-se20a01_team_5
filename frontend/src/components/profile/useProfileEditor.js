"use client";

import { useEffect, useState } from 'react';
import { toApiAssetUrl, userApi } from '@/services/api';

const emptyProfile = {
  name: '',
  employeeId: '',
  phone: '',
  email: '',
  address: '',
};

export default function useProfileEditor() {
  const [formData, setFormData] = useState(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    userApi.getProfile()
      .then((profile) => {
        if (cancelled) return;
        setFormData({
          name: profile.fullName || '',
          employeeId: profile.userId ? `#${profile.userId}` : '',
          phone: profile.phoneNumber || '',
          email: profile.email || '',
          address: profile.address || '',
        });
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
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setTempImageUrl(URL.createObjectURL(file));
      setCropModalOpen(true);
    }
    event.target.value = null;
  };

  const handleConfirmCrop = (croppedImageUrl) => {
    setAvatar(croppedImageUrl);
    window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: croppedImageUrl }));
    setCropModalOpen(false);
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
      let nextProfile = profile;
      if (avatar?.startsWith('data:image/')) {
        nextProfile = await userApi.uploadAvatar(dataUrlToFile(avatar, 'avatar.jpg'));
      }
      const nextAvatar = toApiAssetUrl(nextProfile.avatarUrl) || null;
      setFormData({
        name: nextProfile.fullName || '',
        employeeId: nextProfile.userId ? `#${nextProfile.userId}` : '',
        phone: nextProfile.phoneNumber || '',
        email: nextProfile.email || '',
        address: nextProfile.address || '',
      });
      setAvatar(nextAvatar);
      if (nextAvatar) {
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: nextAvatar }));
      }
      setIsEditing(false);
      setMessage('Cập nhật hồ sơ thành công.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
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
  };
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
