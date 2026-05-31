import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function AdminProfilePage() {
  return (
    <BackendUnavailable
      title="Hồ sơ quản trị viên"
      description="Backend hiện chỉ có API hồ sơ sinh viên; chưa có API hồ sơ admin."
    />
  );
}
