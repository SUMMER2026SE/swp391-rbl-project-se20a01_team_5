import BackendUnavailable from '@/components/common/BackendUnavailable';

export default function AssistantScannerPage() {
  return (
    <BackendUnavailable
      title="Quét QR vé"
      description="Backend hiện chưa có API xác thực vé hoặc ghi nhận lượt quét QR."
    />
  );
}
