import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function AssistantVerifyTicketPage() {
  return (
    <BackendUnavailable
      title="Xác minh vé"
      description="Backend hiện chưa có API tra cứu hoặc xác minh vé."
    />
  );
}
