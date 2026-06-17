"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { conductorApi } from '@/services/api';

function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function VerifyTicketPage() {
  const [serviceDate, setServiceDate] = useState(todayInput());
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState('');
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await conductorApi.listTrips(serviceDate);
      setTrips(data || []);
      const nextTripId = tripId || data?.find((trip) => trip.tripId)?.tripId || '';
      setTripId(nextTripId);
      if (nextTripId) {
        const ticketData = await conductorApi.listTickets(nextTripId);
        setTickets(ticketData || []);
      } else {
        setTickets([]);
      }
    } catch (err) {
      setError(err.message);
      setTrips([]);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [serviceDate, tripId]);

  useEffect(() => {
    const handle = window.setTimeout(loadTrips, 0);
    return () => window.clearTimeout(handle);
  }, [loadTrips]);

  const handleTripChange = async (value) => {
    setTripId(value);
    setTickets([]);
    if (!value) return;
    try {
      const ticketData = await conductorApi.listTickets(Number(value));
      setTickets(ticketData || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredTickets = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return tickets;
    return tickets.filter((ticket) => (
      ticket.studentName?.toLowerCase().includes(keyword)
      || ticket.studentCode?.toLowerCase().includes(keyword)
      || ticket.qrCode?.toLowerCase().includes(keyword)
    ));
  }, [tickets, searchQuery]);

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Kiểm tra vé thủ công</h1>
          <p className="text-brand-text/60 font-medium">Tra cứu vé hợp lệ trên chuyến được phân công.</p>
        </div>
        <button onClick={loadTrips} className="px-4 py-3 bg-white border border-black/5 rounded-2xl hover:bg-brand-surface flex items-center gap-2 font-bold">
          <RefreshCw className="w-5 h-5" /> Tải lại
        </button>
      </div>

      {error && (
        <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 mb-8">
          <select
            value={tripId}
            onChange={(event) => handleTripChange(event.target.value)}
            className="bg-brand-surface border border-black/5 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-brand-primary"
          >
            <option value="">Chọn chuyến</option>
            {trips.filter((trip) => trip.tripId).map((trip) => (
              <option key={trip.tripId} value={trip.tripId}>
                TRIP-{trip.tripId} • {trip.routeName} • {trip.status}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
            <input
              type="text"
              placeholder="Tìm theo tên, MSSV hoặc QR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-brand-surface border border-black/5 focus:bg-white focus:border-brand-primary outline-none transition-all text-sm font-bold"
            />
          </div>
          <input
            type="date"
            value={serviceDate}
            onChange={(event) => setServiceDate(event.target.value)}
            className="bg-brand-surface border border-black/5 rounded-2xl px-4 py-4 text-sm font-bold focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Stat icon={CheckCircle2} label="Đã quét" value={tickets.filter((ticket) => ticket.lastScannedAt).length} tone="success" />
          <Stat icon={ShieldCheck} label="Vé hợp lệ" value={tickets.length} />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
          {isLoading ? (
            <div className="py-20 text-center text-brand-text/50 font-bold">Đang tải vé...</div>
          ) : filteredTickets.length ? (
            <div className="flex flex-col gap-3">
              {filteredTickets.map((ticket) => (
                <div key={`${ticket.ticketKind}-${ticket.ticketId}`} className="bg-white border border-black/5 hover:border-brand-primary p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold ${ticket.lastScannedAt ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-primary/20 text-brand-text'}`}>
                      {ticket.ticketKind === 'MONTHLY' ? 'T' : 'L'}
                    </div>
                    <div>
                      <div className="font-black text-brand-text text-lg">{ticket.studentName}</div>
                      <div className="text-sm font-medium text-brand-text/60 mt-0.5">MSSV: {ticket.studentCode} • {ticket.ticketKind}</div>
                      <div className="text-xs font-mono font-bold text-brand-text/40 mt-1 break-all">{ticket.qrCode}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${ticket.lastScannedAt ? 'text-brand-success' : 'text-brand-text/60'}`}>
                      {ticket.lastScannedAt ? 'Đã quét' : ticket.status}
                    </div>
                    <div className="text-xs text-brand-text/50 font-medium mt-1">{ticket.routeName}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-brand-text/20 mx-auto mb-4" />
              <p className="text-brand-text/60 font-medium">Không có vé phù hợp cho chuyến đã chọn.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <div className={`${tone === 'success' ? 'bg-brand-success/10 border-brand-success/20 text-brand-success' : 'bg-brand-surface border-black/5 text-brand-text'} border rounded-2xl p-4 flex items-center justify-between`}>
      <div>
        <div className="font-bold text-2xl">{value}</div>
        <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{label}</div>
      </div>
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
