import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function CoordinatorProfilePage() {
  return (
    <BackendUnavailable
      title="Hồ sơ điều phối"
      description="Backend hiện chưa có API hồ sơ điều phối viên."
    />
  );
}
