"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bell, CheckCircle2, Map, Navigation, QrCode, Receipt, ShieldCheck, Smartphone } from 'lucide-react';
import { MotionItem, MotionPage } from '@/components/motion/MotionPage';
import { FilledButton, MaterialCard, StatusChip, TonalButton } from '@/components/ui/material';
import { getAuthSession, getDefaultRouteForRole } from '@/services/api';

const features = [
  {
    title: 'Vé tháng và QR lên xe',
    description: 'Thanh toán vé tháng, nhận QR và hóa đơn rõ ràng trong cùng một luồng.',
    icon: Smartphone,
    tone: 'primary',
  },
  {
    title: 'Theo dõi tuyến trực tiếp',
    description: 'Xem tuyến, điểm lên/xuống và ETA để không lỡ chuyến học.',
    icon: Map,
    tone: 'secondary',
  },
  {
    title: 'Quét vé cho phụ xe',
    description: 'Camera scanner và nhập QR thủ công tối ưu cho điện thoại.',
    icon: QrCode,
    tone: 'tertiary',
  },
  {
    title: 'Điều phối vận hành',
    description: 'Theo dõi đội xe, lịch chạy, trạng thái GPS và phản hồi theo thời gian thực.',
    icon: ShieldCheck,
    tone: 'dark',
  },
];

export default function Home() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      router.replace(getDefaultRouteForRole(session.role, session.studentVerificationStatus));
      return;
    }

    const handle = window.setTimeout(() => setIsCheckingSession(false), 0);
    return () => window.clearTimeout(handle);
  }, [router]);

  if (isCheckingSession) {
    return <div className="min-h-screen m3-app-bg" />;
  }

  return (
    <MotionPage className="min-h-screen m3-app-bg overflow-x-hidden font-sans text-[var(--md-sys-color-on-surface)]">
      <nav className="fixed left-0 top-0 z-50 w-full px-3 pt-3 md:px-6">
        <MaterialCard className="mx-auto flex h-20 max-w-7xl items-center justify-between rounded-full px-4 md:px-6">
          <Link href="/" className="m3-focus-ring rounded-full">
            <img src="/logo.png" alt="UniBus Logo" className="h-16 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <TonalButton as={Link} href="/login" className="min-h-11 px-5">
              Đăng nhập
            </TonalButton>
            <FilledButton as={Link} href="/register" className="min-h-11 px-5">
              Đăng ký <ArrowRight className="h-4 w-4" />
            </FilledButton>
          </div>
        </MaterialCard>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-28 md:px-8 md:pt-36">
        <section className="grid min-h-[calc(100vh-9rem)] grid-cols-1 items-center gap-10 pb-20 lg:grid-cols-[1fr_.92fr]">
          <MotionItem>
            <StatusChip tone="primary" className="mb-6">Material 3 Expressive for student transit</StatusChip>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
              UniBus mềm như Android, rõ như một bảng điều phối thật.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-bold leading-relaxed text-[var(--md-sys-color-on-surface-variant)] md:text-xl">
              Một web app cho sinh viên, tài xế, phụ xe, điều phối và admin: mua vé tháng, quét QR, theo dõi tuyến và vận hành đội xe trong trải nghiệm Material 3 hiện đại.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <FilledButton as={Link} href="/register" className="text-base">
                Bắt đầu ngay <ArrowRight className="h-5 w-5" />
              </FilledButton>
              <TonalButton as={Link} href="#features" className="text-base">
                Xem khả năng
              </TonalButton>
            </div>
          </MotionItem>

          <MotionItem>
            <MaterialCard elevated className="relative overflow-hidden rounded-[2.25rem] p-4">
              <div className="m3-map-surface min-h-[34rem] rounded-[1.75rem] p-5">
                <div className="flex items-start justify-between gap-3">
                  <MaterialCard className="rounded-[1.5rem] p-4">
                    <p className="text-xs font-black text-[var(--md-sys-color-on-surface-variant)]">Tuyến đang chạy</p>
                    <p className="mt-1 text-xl font-black">UD-DN01</p>
                    <p className="mt-1 text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]">KTX → Đại học → Trung tâm</p>
                  </MaterialCard>
                  <StatusChip tone="success">GPS live</StatusChip>
                </div>

                <div className="relative mt-12 h-72">
                  <div className="absolute left-[8%] top-[14%] h-4 w-4 rounded-full bg-[var(--md-sys-color-secondary)] shadow-lg" />
                  <div className="absolute left-[18%] top-[25%] right-[24%] h-2 origin-left rotate-[13deg] rounded-full bg-[var(--md-sys-color-secondary-container)]" />
                  <div className="absolute right-[14%] top-[44%] flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-[var(--md-sys-elevation-3)]">
                    <Navigation className="h-9 w-9" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 grid grid-cols-3 gap-3">
                    <Metric label="ETA" value="4 phút" />
                    <Metric label="QR" value="Sẵn sàng" />
                    <Metric label="Trạm" value="12" />
                  </div>
                </div>

                <MaterialCard className="mt-5 rounded-[1.5rem] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black">Vé tháng tháng này</p>
                        <p className="text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]">Đã trợ giá, chờ quét QR</p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-7 w-7 text-[var(--unibus-success)]" />
                  </div>
                </MaterialCard>
              </div>
            </MaterialCard>
          </MotionItem>
        </section>

        <section id="features" className="pb-28">
          <MotionItem className="mb-10 text-center">
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">Đủ mềm để dùng trên điện thoại, đủ rõ để vận hành.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
              UniBus không chỉ đổi màu. UI mới tổ chức lại điều hướng, trạng thái, hành động chính và motion theo Material 3 Expressive.
            </p>
          </MotionItem>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </section>
      </main>
    </MotionPage>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-[1.5rem] bg-[var(--md-sys-color-surface-container-lowest)] p-4 text-center shadow-[var(--md-sys-elevation-1)]">
      <p className="text-xs font-black text-[var(--md-sys-color-on-surface-variant)]">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function FeatureCard({ feature }) {
  const Icon = feature.icon;
  const toneClass = {
    primary: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
    secondary: 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]',
    tertiary: 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]',
    dark: 'bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)]',
  }[feature.tone];

  return (
    <MotionItem>
      <MaterialCard interactive className="h-full p-6">
        <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-[1.5rem] ${toneClass}`}>
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-black">{feature.title}</h3>
        <p className="mt-3 text-sm font-bold leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">{feature.description}</p>
      </MaterialCard>
    </MotionItem>
  );
}
