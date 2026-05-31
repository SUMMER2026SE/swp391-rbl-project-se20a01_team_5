"use client";

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function BackendUnavailable({
  title = 'Chưa có API backend',
  description = 'Màn này không hiển thị dữ liệu mẫu. Cần bổ sung endpoint backend trước khi nối chức năng thật.',
  actionHref,
  actionLabel,
}) {
  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">{title}</h1>
        <p className="text-brand-text/60 font-medium">{description}</p>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-black/5 shadow-sm flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-warning/10 text-brand-warning flex items-center justify-center mb-5">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-brand-text mb-2">Không dùng dữ liệu giả</h2>
        <p className="max-w-xl text-sm font-medium text-brand-text/60 leading-relaxed">
          Khi backend cung cấp endpoint cho màn này, frontend sẽ tải dữ liệu thật qua service layer.
        </p>
        {actionHref && actionLabel && (
          <Link href={actionHref} className="mt-6 px-5 py-3 rounded-xl bg-brand-text text-white font-bold hover:bg-black transition-colors">
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
