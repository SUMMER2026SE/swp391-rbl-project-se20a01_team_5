"use client";

import { useCallback, useEffect, useState } from 'react';
import { Ban, Loader2, RefreshCw, Search, TicketCheck } from 'lucide-react';
import { adminMonthlyPassApi } from '@/services/api';

const statusLabels = {
  ACTIVE: 'Dang hoat dong',
  CANCELLED: 'Da huy',
  EXPIRED: 'Het han',
};

const statusTone = {
  ACTIVE: 'bg-brand-success/10 text-brand-success',
  CANCELLED: 'bg-brand-danger/10 text-brand-danger',
  EXPIRED: 'bg-brand-text/10 text-brand-text/60',
};

export default function AdminMonthlyPassesPage() {
  const [passes, setPasses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [isLoading, setIsLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadPasses = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminMonthlyPassApi.list({ keyword: keyword.trim(), status });
      setPasses(data || []);
    } catch (err) {
      setError(err.message);
      setPasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, status]);

  useEffect(() => {
    const handle = window.setTimeout(loadPasses, 250);
    return () => window.clearTimeout(handle);
  }, [loadPasses]);

  const cancelPass = async (monthlyPass) => {
    if (monthlyPass.status !== 'ACTIVE') return;
    setMutatingId(monthlyPass.monthlyPassId);
    setNotice('');
    setError('');
    try {
      const updated = await adminMonthlyPassApi.cancel(monthlyPass.monthlyPassId);
      setPasses((current) => current.map((item) => (
        item.monthlyPassId === updated.monthlyPassId ? updated : item
      )));
      setNotice(`Da huy ve thang cua ${updated.studentName || updated.studentCode}. Sinh vien co the thanh toan VNPay lai.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setMutatingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <TicketCheck className="w-8 h-8 text-brand-primary" /> Ve thang
          </h1>
          <p className="text-brand-text/60 font-medium">Quan ly ve thang va huy ve active truoc khi demo thanh toan VNPay.</p>
        </div>
        <button
          type="button"
          onClick={loadPasses}
          className="px-5 py-3 rounded-2xl bg-white border border-black/5 font-bold text-sm hover:bg-brand-surface transition-colors flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Lam moi
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl border border-brand-success/20 bg-brand-success/10 p-4 text-sm font-bold text-brand-success">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <section className="flex-1 bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
        <div className="p-6 md:p-8 border-b border-black/5 bg-brand-surface/30 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
          <div className="relative w-full md:w-1/2 xl:w-1/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
            <input
              type="text"
              placeholder="Tim MSSV, email, ten sinh vien, tuyen..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="w-full bg-white border border-black/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-brand-primary shadow-sm transition-all"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full md:w-auto bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-primary cursor-pointer shadow-sm"
          >
            <option value="ACTIVE">Dang hoat dong</option>
            <option value="CANCELLED">Da huy</option>
            <option value="EXPIRED">Het han</option>
            <option value="ALL">Tat ca</option>
          </select>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 md:px-8 py-5 text-xs font-black text-brand-text/50 uppercase tracking-wider border-b">Sinh vien</th>
                <th className="p-4 md:px-8 py-5 text-xs font-black text-brand-text/50 uppercase tracking-wider border-b">Tuyen</th>
                <th className="p-4 md:px-8 py-5 text-xs font-black text-brand-text/50 uppercase tracking-wider border-b">Ky ve</th>
                <th className="p-4 md:px-8 py-5 text-xs font-black text-brand-text/50 uppercase tracking-wider border-b">Trang thai</th>
                <th className="p-4 md:px-8 py-5 text-xs font-black text-brand-text/50 uppercase tracking-wider border-b text-right">Hanh dong</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-brand-text/50 font-bold">
                    <span className="inline-flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Dang tai ve thang...</span>
                  </td>
                </tr>
              )}

              {!isLoading && passes.map((monthlyPass) => (
                <tr key={monthlyPass.monthlyPassId} className="border-b border-black/5 transition-colors hover:bg-brand-surface/30">
                  <td className="p-4 md:px-8 py-4">
                    <div className="font-bold text-brand-text">{monthlyPass.studentName || monthlyPass.studentCode}</div>
                    <div className="text-xs font-bold text-brand-text/50 mt-1">{monthlyPass.studentCode} - {monthlyPass.email}</div>
                  </td>
                  <td className="p-4 md:px-8 py-4">
                    <div className="font-bold text-brand-text">{monthlyPass.routeName}</div>
                    <div className="text-xs font-bold text-brand-text/50 mt-1">Route #{monthlyPass.routeId}</div>
                  </td>
                  <td className="p-4 md:px-8 py-4">
                    <div className="font-bold text-brand-text">Thang {monthlyPass.effectiveMonth}/{monthlyPass.effectiveYear}</div>
                    <div className="text-xs font-bold text-brand-text/50 mt-1">{formatMoney(monthlyPass.fareAmount)}</div>
                  </td>
                  <td className="p-4 md:px-8 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${statusTone[monthlyPass.status] || statusTone.EXPIRED}`}>
                      {statusLabels[monthlyPass.status] || monthlyPass.status}
                    </span>
                  </td>
                  <td className="p-4 md:px-8 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => cancelPass(monthlyPass)}
                      disabled={monthlyPass.status !== 'ACTIVE' || mutatingId === monthlyPass.monthlyPassId}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-danger/10 px-4 py-2 text-xs font-black text-brand-danger hover:bg-brand-danger hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-brand-danger/10 disabled:hover:text-brand-danger"
                    >
                      {mutatingId === monthlyPass.monthlyPassId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                      Huy ve
                    </button>
                  </td>
                </tr>
              ))}

              {!isLoading && passes.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-brand-text/50 font-bold">
                    Khong co ve thang phu hop.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 md:px-8 border-t border-black/5 bg-white flex justify-between items-center text-sm font-bold text-brand-text/50">
          <span>Hien thi {passes.length} ve thang</span>
          <span>Demo VNPay: huy ve active truoc, sau do dang nhap student de thanh toan lai</span>
        </div>
      </section>
    </div>
  );
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
