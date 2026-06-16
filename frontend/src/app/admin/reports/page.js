"use client";

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Flag, Lock, MessageSquare, Search, Send, ShieldAlert, XCircle } from 'lucide-react';
import { adminReportsService } from '@/services/adminReports.service';
import { adminUsersService } from '@/services/adminUsers.service';

const statusLabels = {
  NEW: 'Mới',
  OPEN: 'Đang chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Đã bác bỏ',
  CLOSED: 'Đã đóng'
};

const typeLabels = {
  COMPLAINT: 'Khiếu nại',
  VIOLATION: 'Vi phạm',
  INCIDENT: 'Sự cố',
  SUPPORT: 'Hỗ trợ'
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [replyText, setReplyText] = useState('');
  const [resolution, setResolution] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminReportsService.getReports();
      setReports(data);
      setSelectedReport((current) => current ? data.find((item) => item.id === current.id) ?? null : data[0] ?? null);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách khiếu nại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    adminReportsService.getReports()
      .then((data) => {
        if (!active) return;
        setReports(data);
        setSelectedReport(data[0] ?? null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Không tải được danh sách khiếu nại.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedReport?.id) {
      queueMicrotask(() => {
        if (active) setNotes([]);
      });
      return () => {
        active = false;
      };
    }
    adminReportsService.getNotes(selectedReport.id)
      .then((items) => {
        if (active) setNotes(items);
      })
      .catch(() => {
        if (active) setNotes([]);
      });
    return () => {
      active = false;
    };
  }, [selectedReport?.id]);

  const filteredReports = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return reports.filter((report) => {
      const statusMatch = statusFilter === 'all'
        || (statusFilter === 'pending' && ['NEW', 'OPEN', 'IN_PROGRESS'].includes(report.status))
        || report.status === statusFilter;
      const text = `${report.code ?? ''} ${report.title ?? ''} ${report.reporter ?? ''} ${report.target ?? ''} ${report.content ?? ''}`.toLowerCase();
      return statusMatch && (!keyword || text.includes(keyword));
    });
  }, [reports, searchTerm, statusFilter]);

  const pendingCount = reports.filter((report) => ['NEW', 'OPEN', 'IN_PROGRESS'].includes(report.status)).length;

  const updateSelectedReport = (updated) => {
    setReports((items) => items.map((item) => item.id === updated.id ? updated : item));
    setSelectedReport(updated);
  };

  const handleStatus = async (status) => {
    if (!selectedReport) return;
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const updated = await adminReportsService.updateStatus(selectedReport.id, status, resolution);
      updateSelectedReport(updated);
      setResolution('');
      setNotice(status === 'RESOLVED' ? 'Đã đánh dấu xử lý hợp lệ.' : 'Đã bác bỏ khiếu nại.');
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (event) => {
    event.preventDefault();
    if (!selectedReport || !replyText.trim()) return;
    setSaving(true);
    try {
      const note = await adminReportsService.addNote(selectedReport.id, replyText.trim());
      setNotes((items) => [...items, note]);
      setReplyText('');
    } catch (err) {
      setError(err.message || 'Không gửi được ghi chú.');
    } finally {
      setSaving(false);
    }
  };

  const handleLockTarget = async () => {
    if (!selectedReport?.targetUserId) {
      setNotice('Báo cáo này chưa gắn mã tài khoản đối tượng để khóa trực tiếp.');
      return;
    }
    setSaving(true);
    try {
      await adminUsersService.toggleLock(selectedReport.targetUserId, 'ACTIVE', `Khóa từ ${selectedReport.code}`);
      setNotice('Đã khóa tài khoản người vi phạm.');
    } catch (err) {
      setError(err.message || 'Không khóa được tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-brand-danger" /> Khiếu nại & Vi phạm
          </h1>
          <p className="text-brand-text/60 font-medium">Xem xét, phân loại và giải quyết các khiếu nại từ sinh viên và tài xế.</p>
        </div>
      </div>

      {notice && <div className="rounded-2xl border border-brand-success/20 bg-brand-success/10 p-4 text-sm font-bold text-brand-text">{notice}</div>}
      {error && <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">{error}</div>}

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-hidden pb-6">
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-black/5 bg-brand-surface/30 shrink-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm mã case, tiêu đề, người liên quan..." className="w-full bg-white border border-black/5 rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStatusFilter('pending')} className={`flex-1 text-xs font-bold py-2 rounded-lg border ${statusFilter === 'pending' ? 'bg-brand-danger/10 text-brand-danger border-brand-danger/20' : 'bg-white text-brand-text/60 border-black/5'}`}>Chờ xử lý ({pendingCount})</button>
              <button onClick={() => setStatusFilter('all')} className={`flex-1 text-xs font-bold py-2 rounded-lg border ${statusFilter === 'all' ? 'bg-brand-text text-white border-brand-text' : 'bg-white text-brand-text/60 border-black/5'}`}>Tất cả</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
            {loading && <div className="p-6 text-center text-sm font-bold text-brand-text/50">Đang tải báo cáo...</div>}
            {!loading && filteredReports.length === 0 && <div className="rounded-2xl border border-dashed border-black/10 bg-brand-surface/40 p-6 text-center text-sm font-bold text-brand-text/50">Không có báo cáo phù hợp.</div>}
            {filteredReports.map((report) => (
              <button key={report.id} onClick={() => setSelectedReport(report)} className={`text-left p-4 rounded-2xl border transition-all ${selectedReport?.id === report.id ? 'border-brand-primary bg-brand-primary/5 shadow-sm' : 'border-black/5 bg-white hover:border-brand-primary/30'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {report.priority === 'HIGH' || report.priority === 'URGENT' ? <ShieldAlert className="w-4 h-4 text-brand-danger shrink-0" /> : <Flag className="w-4 h-4 text-brand-secondary shrink-0" />}
                    <span className="font-bold text-sm text-brand-text truncate">{report.title || report.code}</span>
                  </div>
                  <span className="text-[10px] font-black text-brand-text/40">{new Date(report.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="text-xs font-bold text-brand-text/60 mb-3">Đối tượng: <span className="text-brand-text">{report.target || 'Chưa xác định'}</span></div>
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-brand-surface text-brand-text">{typeLabels[report.type] || report.type}</span>
                  {['RESOLVED', 'CLOSED'].includes(report.status) ? <CheckCircle2 className="w-4 h-4 text-brand-success" /> : report.status === 'REJECTED' ? <XCircle className="w-4 h-4 text-brand-text/40" /> : <span className="w-2 h-2 rounded-full bg-brand-danger animate-pulse" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedReport ? (
          <div className="xl:col-span-2 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${selectedReport.priority === 'HIGH' || selectedReport.priority === 'URGENT' ? 'bg-brand-danger' : 'bg-brand-secondary'}`} />
              <div className="flex justify-between items-start gap-4 mb-6 mt-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase bg-brand-surface px-2 py-1 rounded-md text-brand-text/60">{selectedReport.code}</span>
                    <span className="text-xs font-black uppercase px-2 py-1 rounded-md bg-brand-text text-white">{statusLabels[selectedReport.status] || selectedReport.status}</span>
                  </div>
                  <h2 className="text-2xl font-black text-brand-text mb-2">{selectedReport.title || 'Không có tiêu đề'}</h2>
                  <p className="text-sm font-bold text-brand-text/60">Báo cáo lúc {new Date(selectedReport.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Info label="Người báo cáo" value={selectedReport.reporter || 'Không rõ'} />
                <Info label="Đối tượng bị khiếu nại" value={selectedReport.target || 'Không rõ'} danger />
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">Nội dung chi tiết</h3>
                <p className="text-brand-text bg-white border border-black/10 p-5 rounded-2xl leading-relaxed font-medium whitespace-pre-wrap">{selectedReport.content}</p>
              </div>

              {!['RESOLVED', 'REJECTED', 'CLOSED'].includes(selectedReport.status) && (
                <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-black/5">
                  <textarea value={resolution} onChange={(event) => setResolution(event.target.value)} placeholder="Nhập kết quả xử lý hoặc lý do bác bỏ..." className="min-h-24 rounded-2xl bg-brand-surface border border-transparent p-4 text-sm font-medium focus:outline-none focus:border-brand-primary" />
                  <div className="flex flex-wrap gap-3">
                    <button disabled={saving} onClick={() => handleStatus('RESOLVED')} className="px-6 py-3 bg-brand-success text-white font-bold rounded-xl hover:bg-brand-success/80 flex items-center gap-2 disabled:opacity-60"><CheckCircle2 className="w-5 h-5" /> Đánh dấu đã xử lý</button>
                    <button disabled={saving} onClick={() => handleStatus('REJECTED')} className="px-6 py-3 bg-brand-surface text-brand-text font-bold rounded-xl hover:bg-black hover:text-white flex items-center gap-2 disabled:opacity-60"><XCircle className="w-5 h-5" /> Bác bỏ</button>
                    <button disabled={saving} onClick={handleLockTarget} className="px-6 py-3 md:ml-auto bg-brand-danger/10 text-brand-danger font-bold rounded-xl border border-brand-danger/20 hover:bg-brand-danger hover:text-white flex items-center gap-2 disabled:opacity-60"><Lock className="w-5 h-5" /> Khóa người vi phạm</button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-brand-primary" /> Ghi chú xử lý</h3>
              <div className="flex flex-col gap-3 mb-4">
                {notes.length === 0 && <div className="bg-brand-surface p-4 rounded-2xl text-sm font-medium text-brand-text/50">Chưa có ghi chú xử lý.</div>}
                {notes.map((note) => <div key={note.id} className="bg-brand-surface p-4 rounded-2xl"><div className="text-xs font-black text-brand-text/40 mb-1">{note.sender || 'Admin'} - {new Date(note.sentAt).toLocaleString('vi-VN')}</div><div className="text-sm font-medium">{note.content}</div></div>)}
              </div>
              <form onSubmit={handleAddNote} className="flex gap-2 relative">
                <input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Nhập ghi chú xử lý..." className="flex-1 bg-brand-surface border border-transparent rounded-2xl py-3 pl-4 pr-12 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white" />
                <button disabled={saving || !replyText.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-text text-white rounded-xl flex items-center justify-center hover:bg-black disabled:opacity-50"><Send className="w-4 h-4" /></button>
              </form>
            </div>
          </div>
        ) : (
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-black/5 flex items-center justify-center p-8 text-center text-brand-text/40 font-bold">Chọn một báo cáo để xem chi tiết và xử lý.</div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, danger = false }) {
  return (
    <div className={`p-4 rounded-2xl ${danger ? 'bg-brand-danger/5 border border-brand-danger/20' : 'bg-brand-surface'}`}>
      <div className={`text-xs font-bold uppercase mb-1 ${danger ? 'text-brand-danger' : 'text-brand-text/50'}`}>{label}</div>
      <div className={`font-bold ${danger ? 'text-brand-danger' : 'text-brand-text'}`}>{value}</div>
    </div>
  );
}
