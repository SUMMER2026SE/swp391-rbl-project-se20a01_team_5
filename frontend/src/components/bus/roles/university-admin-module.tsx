"use client";

import { BarChart3, Building2, FileBarChart, FileSpreadsheet, Globe, Megaphone, Percent, School, Users } from "lucide-react";
import { PageHeader } from "@/components/bus/primitives";
import { UnavailablePanel } from "@/components/bus/real-data";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

const SCREEN_META: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  "uniadm-dashboard": {
    title: "Tổng quan trường",
    description: "Dashboard University Admin đang chờ backend scoped API.",
    icon: <School className="size-7" />,
  },
  "uniadm-info": {
    title: "Thông tin trường & campus",
    description: "Chưa có API quản lý campus/domain theo trường trong MVP hiện tại.",
    icon: <Building2 className="size-7" />,
  },
  "uniadm-domains": {
    title: "Domain email",
    description: "Chưa có API domain email production.",
    icon: <Globe className="size-7" />,
  },
  "uniadm-import": {
    title: "Import danh sách sinh viên",
    description: "Chưa có API roster import CSV/XLSX production.",
    icon: <FileSpreadsheet className="size-7" />,
  },
  "uniadm-roster": {
    title: "Trạng thái sinh viên",
    description: "Chưa có API roster scoped theo trường.",
    icon: <Users className="size-7" />,
  },
  "uniadm-subsidy": {
    title: "Chính sách trợ giá",
    description: "Chưa có API university subsidy policy production.",
    icon: <Percent className="size-7" />,
  },
  "uniadm-stats": {
    title: "Thống kê sử dụng",
    description: "Chưa có API analytics scoped theo trường.",
    icon: <BarChart3 className="size-7" />,
  },
  "uniadm-notify": {
    title: "Gửi thông báo trường",
    description: "Chưa có API thông báo scoped theo trường.",
    icon: <Megaphone className="size-7" />,
  },
  "uniadm-recon": {
    title: "Báo cáo đối soát",
    description: "Chưa có API reconciliation production.",
    icon: <FileBarChart className="size-7" />,
  },
};

export function UniversityAdminModule({ activeId }: Props) {
  const meta = SCREEN_META[activeId] || SCREEN_META["uniadm-dashboard"];
  return (
    <div>
      <PageHeader title={meta.title} description={meta.description} icon={meta.icon} />
      <UnavailablePanel
        title="Chưa có backend University Admin"
        description="UI v1.1 được giữ làm blueprint, nhưng màn này không hiển thị dữ liệu mẫu. Khi university-admin APIs được build, phần này sẽ nối vào dữ liệu thật."
      />
    </div>
  );
}
