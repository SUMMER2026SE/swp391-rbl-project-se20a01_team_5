import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function StudentAiAssistantPage() {
  return (
    <BackendUnavailable
      title="AI trợ lý"
      description="Backend hiện chưa có API chat AI hoặc tư vấn tuyến cho frontend."
      actionHref="/student/routes"
      actionLabel="Tìm tuyến xe"
    />
  );
}
