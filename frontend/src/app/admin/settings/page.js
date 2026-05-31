import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function AdminSettingsPage() {
  return (
    <BackendUnavailable
      title="Cài đặt hệ thống"
      description="Backend hiện chưa có API cấu hình giá vé hoặc thông báo hệ thống."
    />
  );
}
