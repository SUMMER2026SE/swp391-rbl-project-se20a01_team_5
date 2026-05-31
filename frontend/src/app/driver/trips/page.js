import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function DriverTripsPage() {
  return (
    <BackendUnavailable
      title="Chuyến xe tài xế"
      description="Backend hiện chưa có API danh sách chuyến, bắt đầu/kết thúc chuyến hoặc cập nhật vị trí cho tài xế."
    />
  );
}
