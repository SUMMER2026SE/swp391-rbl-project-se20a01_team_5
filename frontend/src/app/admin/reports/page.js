import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function AdminReportsPage() {
  return (
    <BackendUnavailable
      title="Báo cáo & khiếu nại"
      description="Backend hiện chưa có API báo cáo, khiếu nại hoặc xử lý phản hồi cho admin."
    />
  );
}
