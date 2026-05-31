import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function AssistantDashboardPage() {
  return (
    <BackendUnavailable
      title="Tổng quan phụ xe"
      description="Backend hiện chưa có API chuyến xe, quét vé hoặc dashboard phụ xe."
    />
  );
}
