import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function CoordinatorDashboardPage() {
  return (
    <BackendUnavailable
      title="Tổng quan điều phối"
      description="Backend hiện chưa có API đội xe, vận hành hoặc dashboard điều phối."
    />
  );
}
