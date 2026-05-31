import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function AdminDashboardPage() {
  return (
    <BackendUnavailable
      title="Tổng quan hệ thống"
      description="Backend hiện chưa có API thống kê admin, doanh thu, số lượng người dùng hoặc lượt chạy."
    />
  );
}
