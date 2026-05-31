"use client";

import { useState } from 'react';
import { AlertTriangle, ShieldAlert, Flag, CheckCircle2, MessageSquare, Search, Filter, Lock, Send, XCircle } from 'lucide-react';

const MOCK_REPORTS = [
  {
    id: 'REP-001',
    type: 'violation',
    title: 'Tài xế vi phạm tốc độ',
    reporter: 'Hệ thống GPS',
    target: 'Tài xế Nguyễn Văn Tài (TX01)',
    time: '15 phút trước',
    content: 'Tài xế điều khiển xe 43B-123.45 vượt quá tốc độ cho phép (hơn 60km/h) tại đoạn đường Lê Duẩn.',
    status: 'pending',
    severity: 'high'
  },
  {
    id: 'REP-002',
    type: 'complaint',
    title: 'Thái độ phụ xe không tốt',
    reporter: 'Sinh viên Trần Văn B (SV102)',
    target: 'Phụ xe Lê Thị C (PX02)',
    time: '2 giờ trước',
    content: 'Phụ xe tuyến số 2 vào lúc 8h sáng nay có thái độ cáu gắt và la mắng sinh viên khi lên xe.',
    status: 'pending',
    severity: 'medium'
  },
  {
    id: 'REP-003',
    type: 'system',
    title: 'Lỗi nạp tiền ví điện tử',
    reporter: 'Nhiều sinh viên',
    target: 'Cổng thanh toán',
    time: '1 ngày trước',
    content: 'Nhiều giao dịch nạp tiền qua VNPay bị trừ tiền nhưng không cộng vào ví UniBus.',
    status: 'resolved',
    severity: 'high'
  },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState(MOCK_REPORTS[0]);
  const [replyText, setReplyText] = useState('');

  const handleResolve = (id) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
    if (selectedReport?.id === id) {
      setSelectedReport({ ...selectedReport, status: 'resolved' });
    }
  };

  const handleReject = (id) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    if (selectedReport?.id === id) {
      setSelectedReport({ ...selectedReport, status: 'rejected' });
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-brand-danger" /> Khiếu nại & Vi phạm
          </h1>
          <p className="text-brand-text/60 font-medium">Trung tâm giám sát kỷ luật và xử lý các sự cố nghiêm trọng.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-hidden pb-6">

        {/* Column 1: List of Reports */}
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">

          <div className="p-6 border-b border-black/5 bg-brand-surface/30 shrink-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
              <input type="text" placeholder="Tìm mã ticket, tên người bị kiện..." className="w-full bg-white border border-black/5 rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary" />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-brand-danger/10 text-brand-danger text-xs font-bold py-2 rounded-lg border border-brand-danger/20">Chờ xử lý ({reports.filter(r => r.status === 'pending').length})</button>
              <button className="flex-1 bg-white text-brand-text/60 text-xs font-bold py-2 rounded-lg border border-black/5 hover:bg-brand-surface">Đã đóng</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedReport?.id === report.id ? 'border-brand-primary bg-brand-primary/5 shadow-sm' : 'border-black/5 bg-white hover:border-brand-primary/30'} ${report.status !== 'pending' ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {report.severity === 'high' ? <ShieldAlert className="w-4 h-4 text-brand-danger" /> : <Flag className="w-4 h-4 text-brand-secondary" />}
                    <span className="font-bold text-sm text-brand-text truncate w-32">{report.title}</span>
                  </div>
                  <span className="text-[10px] font-black text-brand-text/40">{report.time}</span>
                </div>
                <div className="text-xs font-bold text-brand-text/60 mb-2">
                  Bị kiện: <span className="text-brand-text">{report.target}</span>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${report.type === 'violation' ? 'bg-brand-danger/20 text-brand-danger' : report.type === 'complaint' ? 'bg-brand-secondary/20 text-brand-text' : 'bg-black/10 text-brand-text'}`}>
                    {report.type === 'violation' ? 'Vi phạm' : report.type === 'complaint' ? 'Khiếu nại' : 'Hệ thống'}
                  </span>
                  {report.status === 'pending' ? (
                    <span className="w-2 h-2 rounded-full bg-brand-danger animate-pulse"></span>
                  ) : report.status === 'resolved' ? (
                    <CheckCircle2 className="w-4 h-4 text-brand-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-brand-text/40" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2 & 3: Report Details & Action Panel */}
        {selectedReport ? (
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* Details Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${selectedReport.severity === 'high' ? 'bg-brand-danger' : 'bg-brand-secondary'}`}></div>

              <div className="flex justify-between items-start mb-6 mt-2">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase bg-brand-surface px-2 py-1 rounded-md text-brand-text/60">Ticket: {selectedReport.id}</span>
                    <span className={`text-xs font-black uppercase px-2 py-1 rounded-md ${selectedReport.status === 'pending' ? 'bg-brand-danger text-white' : selectedReport.status === 'resolved' ? 'bg-brand-success text-white' : 'bg-brand-text/20 text-brand-text/60'}`}>
                      {selectedReport.status === 'pending' ? 'Đang chờ xử lý' : selectedReport.status === 'resolved' ? 'Đã giải quyết' : 'Đã từ chối'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-brand-text mb-2">{selectedReport.title}</h2>
                  <p className="text-sm font-bold text-brand-text/60">Báo cáo lúc: 12/05/2026 - 14:30 ({selectedReport.time})</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-brand-surface p-4 rounded-2xl">
                  <div className="text-xs font-bold text-brand-text/50 uppercase mb-1">Người báo cáo</div>
                  <div className="font-bold">{selectedReport.reporter}</div>
                </div>
                <div className="bg-brand-danger/5 border border-brand-danger/20 p-4 rounded-2xl">
                  <div className="text-xs font-bold text-brand-danger uppercase mb-1">Đối tượng bị khiếu nại</div>
                  <div className="font-bold text-brand-danger">{selectedReport.target}</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">Nội dung chi tiết:</h3>
                <p className="text-brand-text bg-white border border-black/10 p-5 rounded-2xl leading-relaxed font-medium">
                  "{selectedReport.content}"
                </p>
              </div>

              {/* Action Buttons for Admin */}
              {selectedReport.status === 'pending' && (
                <div className="flex flex-wrap gap-3 mt-auto pt-6 border-t border-black/5">
                  <button
                    onClick={() => handleResolve(selectedReport.id)}
                    className="px-6 py-3 bg-brand-success text-white font-bold rounded-xl hover:bg-brand-success/80 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Đánh dấu Hợp lệ (Đã Xử lý)
                  </button>
                  <button
                    onClick={() => handleReject(selectedReport.id)}
                    className="px-6 py-3 bg-brand-surface text-brand-text font-bold rounded-xl hover:bg-black hover:text-white transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" /> Bác bỏ khiếu nại
                  </button>

                  {/* Extreme Action */}
                  <button className="px-6 py-3 ml-auto bg-brand-danger/10 text-brand-danger font-bold rounded-xl border border-brand-danger/20 hover:bg-brand-danger hover:text-white transition-colors flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Khóa tài khoản người vi phạm
                  </button>
                </div>
              )}
            </div>

            {/* Communication Panel */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-primary" /> Phản hồi nội bộ / Ghi chú
              </h3>

              <div className="flex-1 flex flex-col gap-4 mb-4">
                <div className="bg-brand-surface p-4 rounded-2xl max-w-[80%]">
                  <div className="text-xs font-bold text-brand-text/50 mb-1">Admin (Bạn) - 10 phút trước</div>
                  <div className="text-sm font-medium">Đã tiếp nhận. Yêu cầu kiểm tra lại camera hành trình trên xe 43B-123.45.</div>
                </div>
              </div>

              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập ghi chú xử lý hoặc gửi tin nhắn cho người báo cáo..."
                  className="flex-1 bg-brand-surface border border-transparent rounded-2xl py-3 pl-4 pr-12 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                  disabled={selectedReport.status !== 'pending'}
                />
                <button
                  disabled={selectedReport.status !== 'pending'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-text text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-black/5 flex items-center justify-center p-8 text-center text-brand-text/40 font-bold">
            Chọn một báo cáo bên trái để xem chi tiết và xử lý.
          </div>
        )}

      </div>
    </div>
  );
}
