import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function DriverContactPage() {
  return (
    <BackendUnavailable
      title="Liên hệ điều phối"
      description="Backend hiện chưa có API nhắn tin hoặc báo sự cố từ tài xế."
    />
  );
}
