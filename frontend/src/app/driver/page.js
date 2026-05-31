import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function DriverDashboard() {
  return (
    <BackendUnavailable
      title="Tổng quan tài xế"
      description="Backend hiện chưa có API chuyến xe, lịch chạy hoặc trạng thái làm việc cho tài xế."
    />
  );
}
