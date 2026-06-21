"use client";

import { useCallback, useState } from "react";
import { BarChart3, Building2, FileBarChart, FileSpreadsheet, Globe, Megaphone, Percent, School, Users, CreditCard, Receipt } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Section, StatCard } from "@/components/bus/primitives";
import { AsyncBlock, DataList, StatusPill, formatDate, formatDateTime, formatMoney, getErrorMessage, useApiResource } from "@/components/bus/real-data";
import { ExpressiveButton, ExpressiveCard } from "@/components/m3/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  universityApi,
  type CampusView,
  type DomainView,
  type ImportBatchView,
  type RosterStudentView,
  type SubsidyPolicyView,
  type PaymentTransactionView,
  type ReconciliationView,
} from "@/lib/api/client";

type Props = {
  activeId: string;
  onNavigate: (id: string) => void;
};

export function UniversityAdminModule({ activeId }: Props) {
  if (activeId === "uniadm-dashboard") return <Dashboard />;
  if (activeId === "uniadm-info") return <InfoScreen />;
  if (activeId === "uniadm-domains") return <DomainsScreen />;
  if (activeId === "uniadm-import") return <ImportScreen />;
  if (activeId === "uniadm-roster") return <RosterScreen />;
  if (activeId === "uniadm-subsidy") return <SubsidyScreen />;
  if (activeId === "uniadm-stats") return <StatsScreen />;
  if (activeId === "uniadm-notify") return <NotifyScreen />;
  if (activeId === "uniadm-recon") return <ReconciliationScreen />;
  if (activeId === "uniadm-transactions") return <UniversityPaymentTransactionsScreen />;
  return <Dashboard />;
}

function Dashboard() {
  const resource = useApiResource(useCallback(async () => {
    const [profile, stats, batches] = await Promise.all([
      universityApi.profile(),
      universityApi.stats(),
      universityApi.importBatches().catch(() => []),
    ]);
    return { profile, stats, batches };
  }, []));

  return (
    <div>
      <PageHeader title="Tổng quan trường" description="Dữ liệu scoped theo tài khoản University Admin." icon={<School className="size-7" />} />
      <AsyncBlock resource={resource}>
        {({ profile, stats, batches }) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Sinh viên roster" value={stats.activeRosterStudents} icon={<Users className="size-6" />} accent="primary" />
              <StatCard label="Đã liên kết" value={stats.matchedStudents} icon={<School className="size-6" />} accent="success" />
              <StatCard label="Tuyến active" value={stats.activeRoutes} icon={<BarChart3 className="size-6" />} accent="secondary" />
              <StatCard label="Trợ giá" value={formatMoney(stats.totalSubsidyAmount)} icon={<Percent className="size-6" />} accent="tertiary" />
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <ExpressiveCard variant="elevated" className="p-5">
                <h2 className="text-xl font-bold text-on-surface">{profile.universityName}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{profile.fullName} · {profile.email}</p>
                <div className="mt-4"><StatusPill status={profile.status} /></div>
              </ExpressiveCard>
              <Section title="Import gần đây">
                <BatchList batches={batches.slice(0, 4)} />
              </Section>
            </div>
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function InfoScreen() {
  const resource = useApiResource(useCallback(async () => {
    const [profile, campuses, domains] = await Promise.all([
      universityApi.profile(),
      universityApi.campuses(),
      universityApi.domains(),
    ]);
    return { profile, campuses, domains };
  }, []));

  return (
    <div>
      <PageHeader title="Thông tin trường & campus" description="Thông tin thật của trường được gán cho tài khoản hiện tại." icon={<Building2 className="size-7" />} />
      <AsyncBlock resource={resource}>
        {({ profile, campuses, domains }) => (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <ExpressiveCard variant="elevated" className="p-5">
              <h2 className="text-xl font-bold text-on-surface">{profile.universityName}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">{profile.title || "University Admin"}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Email" value={profile.email} />
                <Info label="Số điện thoại" value={profile.phoneNumber || "Chưa có"} />
              </div>
            </ExpressiveCard>
            <div className="space-y-4">
              <Section title="Campus"><CampusList campuses={campuses} /></Section>
              <Section title="Domain"><DomainList domains={domains} /></Section>
            </div>
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function DomainsScreen() {
  const resource = useApiResource<DomainView[]>(useCallback(() => universityApi.domains(), []));
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    setSaving(true);
    try {
      await universityApi.createDomain({ domain });
      setDomain("");
      toast.success("Đã thêm domain");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể thêm domain"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Domain email" description="Domain active được dùng để hint/liên kết Google login." icon={<Globe className="size-7" />} />
      <ExpressiveCard variant="elevated" className="mb-5 grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Domain"><Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="vku.udn.vn" /></Field>
        <ExpressiveButton onClick={create} disabled={saving || !domain}>{saving ? "Đang thêm..." : "Thêm domain"}</ExpressiveButton>
      </ExpressiveCard>
      <AsyncBlock resource={resource}>{(domains) => <DomainList domains={domains} />}</AsyncBlock>
    </div>
  );
}

function ImportScreen() {
  const batches = useApiResource<ImportBatchView[]>(useCallback(() => universityApi.importBatches(), []));
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await universityApi.importRoster(file);
      setFile(null);
      toast.success("Đã import roster");
      batches.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể import roster"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Import danh sách sinh viên" description="Upload CSV/XLSX thật, backend lưu batch và lỗi từng dòng." icon={<FileSpreadsheet className="size-7" />} />
      <ExpressiveCard variant="elevated" className="mb-5 grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="File CSV/XLSX"><Input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
        <ExpressiveButton onClick={upload} disabled={uploading || !file}>{uploading ? "Đang import..." : "Import"}</ExpressiveButton>
      </ExpressiveCard>
      <AsyncBlock resource={batches}>{(items) => <BatchList batches={items} />}</AsyncBlock>
    </div>
  );
}

function RosterScreen() {
  const resource = useApiResource<RosterStudentView[]>(useCallback(() => universityApi.roster(), []));
  return (
    <div>
      <PageHeader title="Trạng thái sinh viên" description="Roster thật và trạng thái matched user." icon={<Users className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(rows) => (
          <DataList emptyTitle="Chưa có roster" emptyDescription="Import CSV/XLSX để danh sách sinh viên xuất hiện.">
            {rows.map((row) => (
              <ExpressiveCard key={row.rosterId} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface">{row.fullName}</h3>
                    <p className="text-sm text-on-surface-variant">{row.email} · {row.studentCode}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{row.faculty || "Chưa có khoa"} · {row.academicYear || "Chưa có khóa"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill status={row.status} />
                    <StatusPill status={row.matchedUserId ? "MATCHED" : "UNMATCHED"} />
                  </div>
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function SubsidyScreen() {
  const resource = useApiResource<SubsidyPolicyView[]>(useCallback(() => universityApi.subsidyPolicies(), []));
  const [policyName, setPolicyName] = useState("");
  const [subsidyType, setSubsidyType] = useState("PERCENTAGE");
  const [value, setValue] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    setSaving(true);
    try {
      await universityApi.createSubsidyPolicy({
        policyName,
        subsidyType,
        value: Number(value),
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
      });
      setPolicyName("");
      setValue("");
      setMaxAmount("");
      toast.success("Đã tạo chính sách trợ giá");
      resource.reload();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tạo chính sách"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Chính sách trợ giá" description="Chính sách này được ticketing dùng để tính giá vé tháng." icon={<Percent className="size-7" />} />
      <ExpressiveCard variant="elevated" className="mb-5 grid gap-4 p-5 md:grid-cols-4">
        <Field label="Tên chính sách"><Input value={policyName} onChange={(e) => setPolicyName(e.target.value)} /></Field>
        <Field label="Loại">
          <select value={subsidyType} onChange={(e) => setSubsidyType(e.target.value)} className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm">
            <option value="PERCENTAGE">Phần trăm</option>
            <option value="FIXED_AMOUNT">Số tiền cố định</option>
          </select>
        </Field>
        <Field label="Giá trị"><Input type="number" value={value} onChange={(e) => setValue(e.target.value)} /></Field>
        <Field label="Trần trợ giá"><Input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} /></Field>
        <div className="md:col-span-4"><ExpressiveButton onClick={create} disabled={saving || !policyName || !value}>{saving ? "Đang tạo..." : "Tạo chính sách"}</ExpressiveButton></div>
      </ExpressiveCard>
      <AsyncBlock resource={resource}>{(items) => <PolicyList policies={items} />}</AsyncBlock>
    </div>
  );
}

function StatsScreen() {
  const resource = useApiResource(useCallback(() => universityApi.stats(), []));
  return (
    <div>
      <PageHeader title="Thống kê sử dụng" description="Aggregate thật từ roster, route, pass và trợ giá." icon={<BarChart3 className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(stats) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Roster active" value={stats.activeRosterStudents} icon={<Users className="size-6" />} accent="primary" />
            <StatCard label="Matched" value={stats.matchedStudents} icon={<School className="size-6" />} accent="success" />
            <StatCard label="Campus" value={stats.activeCampuses} icon={<Building2 className="size-6" />} accent="secondary" />
            <StatCard label="Vé tháng" value={stats.monthlyPasses} icon={<Percent className="size-6" />} accent="tertiary" />
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function NotifyScreen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      const recipients = await universityApi.notify({ title, content });
      setTitle("");
      setContent("");
      toast.success(`Đã gửi tới ${recipients} sinh viên`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi thông báo"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Gửi thông báo trường" description="Gửi thông báo tới sinh viên đã liên kết với trường." icon={<Megaphone className="size-7" />} />
      <ExpressiveCard variant="elevated" className="max-w-2xl space-y-4 p-5">
        <Field label="Tiêu đề"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Nội dung"><Textarea value={content} onChange={(e) => setContent(e.target.value)} /></Field>
        <ExpressiveButton onClick={send} disabled={sending || !title || !content}>{sending ? "Đang gửi..." : "Gửi thông báo"}</ExpressiveButton>
      </ExpressiveCard>
    </div>
  );
}


function UniversityPaymentTransactionsScreen() {
  const resource = useApiResource<PaymentTransactionView[]>(useCallback(() => universityApi.paymentTransactions(), []));
  return (
    <div>
      <PageHeader title="Lịch sử giao dịch" description="Chỉ hiển thị giao dịch của sinh viên thuộc trường bạn." icon={<CreditCard className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(transactions) => (
          <DataList emptyTitle="Chưa có giao dịch" emptyDescription="Các đơn thanh toán của sinh viên sẽ xuất hiện tại đây.">
            {transactions.map((tx) => (
              <ExpressiveCard key={`uni-tx-${tx.orderId}-${tx.transactionId || 0}`} variant="elevated" className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-on-surface">DH{tx.orderId} | {tx.studentName || tx.studentCode}</h3>
                      <StatusPill status={tx.paymentStatus || "UNKNOWN"} />
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">{tx.routeName || "Chưa có tuyến"}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Nội dung: {tx.transactionContent || `DH${tx.orderId}`} | Ref: {tx.referenceNumber || "Chưa có"}</p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-lg font-black text-on-surface">{formatMoney(tx.orderTotal || tx.amountIn || 0)}</p>
                    <p className="text-xs text-on-surface-variant">{tx.paidAt ? `Thanh toán: ${formatDateTime(tx.paidAt)}` : `Tạo đơn: ${formatDateTime(tx.createdAt)}`}</p>
                  </div>
                </div>
              </ExpressiveCard>
            ))}
          </DataList>
        )}
      </AsyncBlock>
    </div>
  );
}

function ReconciliationScreen() {
  const resource = useApiResource(useCallback(() => universityApi.reconciliation(), []));
  return (
    <div>
      <PageHeader title="Báo cáo đối soát" description="Tổng tiền gốc, trợ giá và thanh toán từ monthly pass." icon={<FileBarChart className="size-7" />} />
      <AsyncBlock resource={resource}>
        {(data) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Từ ngày" value={formatDate(data.from)} icon={<FileBarChart className="size-6" />} accent="secondary" />
            <StatCard label="Vé tháng" value={data.monthlyPasses} icon={<Users className="size-6" />} accent="primary" />
            <StatCard label="Tổng trợ giá" value={formatMoney(data.totalSubsidyAmount)} icon={<Percent className="size-6" />} accent="tertiary" />
            <StatCard label="Tổng thanh toán" value={formatMoney(data.totalFinalAmount)} icon={<BarChart3 className="size-6" />} accent="success" />
          </div>
        )}
      </AsyncBlock>
    </div>
  );
}

function CampusList({ campuses }: { campuses: CampusView[] }) {
  return (
    <DataList emptyTitle="Chưa có campus" emptyDescription="Campus được tạo từ University Admin hoặc Admin.">
      {campuses.map((campus) => (
        <ExpressiveCard key={campus.campusId} variant="elevated" className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-on-surface">{campus.name}</h3>
              <p className="text-sm text-on-surface-variant">{campus.code} · {campus.address || "Chưa có địa chỉ"}</p>
            </div>
            <StatusPill status={campus.status} />
          </div>
        </ExpressiveCard>
      ))}
    </DataList>
  );
}

function DomainList({ domains }: { domains: DomainView[] }) {
  return (
    <DataList emptyTitle="Chưa có domain" emptyDescription="Thêm domain email để Google login có university hint.">
      {domains.map((domain) => (
        <ExpressiveCard key={domain.domainId} variant="elevated" className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-on-surface">@{domain.domain}</h3>
              <p className="text-sm text-on-surface-variant">Xác thực: {formatDateTime(domain.verifiedAt)}</p>
            </div>
            <StatusPill status={domain.status} />
          </div>
        </ExpressiveCard>
      ))}
    </DataList>
  );
}

function BatchList({ batches }: { batches: ImportBatchView[] }) {
  return (
    <DataList emptyTitle="Chưa có batch import" emptyDescription="Import roster để xem lịch sử xử lý.">
      {batches.map((batch) => (
        <ExpressiveCard key={batch.importBatchId} variant="elevated" className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-bold text-on-surface">{batch.fileName}</h3>
              <p className="text-sm text-on-surface-variant">{batch.successRows}/{batch.totalRows} dòng hợp lệ · {batch.errorRows} lỗi</p>
              <p className="mt-1 text-xs text-on-surface-variant">{formatDateTime(batch.completedAt || batch.createdAt)}</p>
              {(batch.errors || []).slice(0, 3).map((error) => (
                <p key={error.importErrorId} className="mt-2 rounded-xl bg-surface-container-high p-2 text-xs text-on-surface-variant">
                  Dòng {error.rowNumber}: {error.errorMessage}
                </p>
              ))}
            </div>
            <StatusPill status={batch.status} />
          </div>
        </ExpressiveCard>
      ))}
    </DataList>
  );
}

function PolicyList({ policies }: { policies: SubsidyPolicyView[] }) {
  return (
    <DataList emptyTitle="Chưa có chính sách" emptyDescription="Tạo chính sách để sinh viên được tính trợ giá khi mua vé tháng.">
      {policies.map((policy) => (
        <ExpressiveCard key={policy.subsidyPolicyId} variant="elevated" className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-bold text-on-surface">{policy.policyName}</h3>
              <p className="text-sm text-on-surface-variant">
                {policy.subsidyType === "PERCENTAGE" ? `${policy.value}%` : formatMoney(policy.value)}
                {policy.maxAmount ? ` · trần ${formatMoney(policy.maxAmount)}` : ""}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">{formatDate(policy.activeFrom)} - {formatDate(policy.activeUntil)}</p>
            </div>
            <StatusPill status={policy.status} />
          </div>
        </ExpressiveCard>
      ))}
    </DataList>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-container-high p-3">
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <div className="mt-1 text-sm font-bold text-on-surface">{value || "Chưa có"}</div>
    </div>
  );
}
