import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function AdminUsersPage() {
  return (
    <BackendUnavailable
      title="Quản lý tài khoản"
      description="Backend hiện chưa có API danh sách người dùng, khóa/mở khóa hoặc cấp tài khoản nhân sự."
    />
  );
}
