import type { Role } from "@/lib/types";
import {
  LayoutDashboard,
  Route as RouteIcon,
  Navigation,
  TicketCheck,
  History,
  Star,
  PackageSearch,
  Receipt,
  BadgeCheck,
  Bot,
  User as UserIcon,
  Bell,
  CalendarClock,
  PlayCircle,
  QrCode,
  AlertTriangle,
  Users,
  ShieldAlert,
  BarChart3,
  Megaphone,
  Tag,
  UserCog,
  Bus as BusIcon,
  MessageSquare,
  Settings,
  School,
  Globe,
  Percent,
  ScrollText,
  GraduationCap,
  Building2,
  Filter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  group: string;
  badge?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  student: "Sinh viên",
  driver: "Tài xế",
  assistant: "Phụ xe",
  coordinator: "Điều phối viên",
  admin: "Quản trị viên",
  university_admin: "Admin trường ĐH",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  student: "Đặt vé, theo dõi xe, thanh toán và phản hồi",
  driver: "Xem lịch chạy, bắt đầu/kết thúc chuyến",
  assistant: "Quét vé, kiểm tra vé tháng, báo cáo sự cố",
  coordinator: "Phân công, điều phối xe và tuyến đường",
  admin: "Quản lý hệ thống, thống kê và xử lý khiếu nại",
  university_admin: "Quản lý trường, domain, sinh viên, trợ giá",
};

export const ROLE_COLORS: Record<Role, string> = {
  student: "bg-primary",
  driver: "bg-tertiary",
  assistant: "bg-secondary",
  coordinator: "bg-violet-500",
  admin: "bg-error",
  university_admin: "bg-blue-500",
};

export const ROLE_AVATARS: Record<Role, string> = {
  student: "MA",
  driver: "LÔ",
  assistant: "PT",
  coordinator: "BQ",
  admin: "HT",
  university_admin: "BN",
};

export const NAV_CONFIG: Record<Role, NavItem[]> = {
  student: [
    { id: "stu-dashboard", label: "Trang chủ", icon: LayoutDashboard, group: "Tổng quan" },
    { id: "stu-find", label: "Tìm tuyến xe", icon: RouteIcon, group: "Tuyến xe" },
    { id: "stu-my-journeys", label: "Vé của tôi", icon: TicketCheck, group: "Tuyến xe" },
    { id: "stu-history", label: "Lịch sử chuyến", icon: History, group: "Tuyến xe" },
    { id: "stu-chatbot", label: "Chatbot tra cứu", icon: Bot, group: "Thông minh" },
    { id: "stu-invoices", label: "Thanh toán & hóa đơn", icon: Receipt, group: "Tài chính" },
  ],
  driver: [
    { id: "drv-dashboard", label: "Lịch hôm nay", icon: LayoutDashboard, group: "Tổng quan" },
    { id: "drv-schedule", label: "Lịch chạy xe", icon: CalendarClock, group: "Chuyến xe" },
    { id: "drv-active", label: "Chuyến hiện tại", icon: PlayCircle, group: "Chuyến xe" },
    { id: "drv-history", label: "Lịch sử chuyến", icon: History, group: "Chuyến xe" },
    { id: "drv-contact", label: "Liên hệ điều phối", icon: MessageSquare, group: "Hỗ trợ" },
  ],
  assistant: [
    { id: "ast-dashboard", label: "Chuyến được phân", icon: LayoutDashboard, group: "Tổng quan" },
    { id: "ast-scan", label: "Quét QR vé", icon: QrCode, group: "Kiểm soát" },
    { id: "ast-monthly", label: "Kiểm tra vé tháng", icon: BadgeCheck, group: "Kiểm soát" },
    { id: "ast-lost", label: "Hỗ trợ mất đồ", icon: PackageSearch, group: "Hỗ trợ" },
    { id: "ast-incident", label: "Báo cáo sự cố", icon: AlertTriangle, group: "Hỗ trợ" },
    { id: "ast-contact", label: "Liên hệ tài xế", icon: MessageSquare, group: "Hỗ trợ" },
    { id: "ast-history", label: "Lịch sử chuyến", icon: History, group: "Tổng quan" },
  ],
  coordinator: [
    { id: "crd-dashboard", label: "Tổng quan điều phối", icon: LayoutDashboard, group: "Tổng quan" },
    { id: "crd-live", label: "Theo dõi tất cả xe", icon: Navigation, group: "Vận hành" },
    { id: "crd-schedule", label: "Lịch trình xe", icon: CalendarClock, group: "Vận hành" },
    { id: "crd-assign", label: "Phân công xe chạy", icon: UserCog, group: "Phân công" },
    { id: "crd-routes", label: "Tuyến đường", icon: RouteIcon, group: "Quản lý" },
    { id: "crd-by-university", label: "Điều phối theo trường", icon: School, group: "Quản lý" },
    { id: "crd-feedback", label: "Hỗ trợ và phản hồi", icon: MessageSquare, group: "Hỗ trợ" },
    { id: "crd-notify", label: "Gửi thông báo", icon: Megaphone, group: "Hỗ trợ" },
  ],
  admin: [
    { id: "adm-dashboard", label: "Báo cáo", icon: BarChart3, group: "Tổng quan" },
    { id: "adm-accounts", label: "Tài khoản & phân quyền", icon: Users, group: "Quản trị" },
    { id: "adm-schools", label: "Trường đối tác", icon: School, group: "Quản trị" },
    { id: "adm-verifications", label: "Xác minh sinh viên", icon: BadgeCheck, group: "Quản trị" },
    { id: "adm-finance", label: "Giao dịch & hóa đơn", icon: Receipt, group: "Tài chính" },
    { id: "adm-pricing", label: "Giá vé", icon: Tag, group: "Tài chính" },
    { id: "adm-risk", label: "Vi phạm", icon: ShieldAlert, group: "Vận hành rủi ro" },
    { id: "adm-audit", label: "Nhật ký hoạt động", icon: ScrollText, group: "Hệ thống" },
  ],
  university_admin: [
    { id: "uniadm-dashboard", label: "Tổng quan trường", icon: LayoutDashboard, group: "Tổng quan" },
    { id: "uniadm-info", label: "Thông tin trường & cơ sở", icon: Building2, group: "Quản lý trường" },
    { id: "uniadm-domains", label: "Domain email", icon: Globe, group: "Quản lý trường" },
    { id: "uniadm-students", label: "Sinh vi\u00ean", icon: Users, group: "Sinh vi\u00ean" },
    { id: "uniadm-subsidy", label: "Chính sách trợ giá", icon: Percent, group: "Tài chính & đối soát" },
    { id: "uniadm-transactions", label: "\u0110\u1ed1i so\u00e1t v\u00e0 giao d\u1ecbch", icon: Receipt, group: "T\u00e0i ch\u00ednh & \u0111\u1ed1i so\u00e1t" },
  ],
};
