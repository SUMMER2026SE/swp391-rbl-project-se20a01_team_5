import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function CoordinatorSchedulesPage() {
  return (
    <BackendUnavailable
      title="Phân công lịch chạy"
      description="Backend hiện chưa có API tài xế, xe bus, lịch chạy hoặc phân công ca."
    />
  );
}
