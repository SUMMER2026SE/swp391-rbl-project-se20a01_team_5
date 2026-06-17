"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentWalletRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/passes');
  }, [router]);

  return (
    <div className="h-full flex items-center justify-center text-sm font-bold text-brand-text/50">
      Đang mở trang vé và hóa đơn...
    </div>
  );
}
