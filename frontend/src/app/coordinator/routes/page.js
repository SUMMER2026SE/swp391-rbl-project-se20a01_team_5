import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function CoordinatorRoutesPage() {
  return (
    <BackendUnavailable
      title="Quản lý tuyến & trạm"
      description="Backend hiện chỉ có API tra cứu tuyến cho sinh viên; chưa có API quản trị tuyến/trạm cho điều phối."
    />
  );
}
