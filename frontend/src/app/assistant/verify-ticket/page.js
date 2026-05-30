"use client";

import { useState } from 'react';
import { Search, Filter, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VerifyTicketPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const mockTickets = [
    { id: 'TKT-001', name: 'Nguyễn Văn A', studentId: '102220001', type: 'Vé Tháng', status: 'Hợp lệ', time: '07:05' },
    { id: 'TKT-002', name: 'Trần Thị B', studentId: '102220002', type: 'Vé Lượt', status: 'Hợp lệ', time: '07:08' },
    { id: 'TKT-003', name: 'Lê Văn C', studentId: '102220003', type: 'Vé Tháng', status: 'Hết hạn', time: '07:12' },
    { id: 'TKT-004', name: 'Phạm Thị D', studentId: '102220004', type: 'Vé Tháng', status: 'Hợp lệ', time: '07:15' },
  ];

  const filteredTickets = mockTickets.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.studentId.includes(searchQuery) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Kiểm tra vé thủ công</h1>
        <p className="text-brand-text/60 font-medium">Tra cứu danh sách sinh viên đăng ký trên chuyến đi hiện tại.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1 flex flex-col">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
            <input 
              type="text" 
              placeholder="Tìm theo Tên, MSSV hoặc Mã vé..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-brand-surface border border-transparent focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all text-sm font-bold"
            />
          </div>
          <button className="px-6 py-4 bg-brand-surface rounded-2xl flex items-center justify-center gap-2 hover:bg-black/5 transition-colors font-bold text-sm">
            <Filter className="w-5 h-5" /> Bộ lọc
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-brand-success/10 border border-brand-success/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-brand-success font-bold text-2xl">42</div>
              <div className="text-brand-success/70 text-xs font-bold uppercase tracking-wider mt-1">Đã kiểm tra</div>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-brand-success" />
            </div>
          </div>
          <div className="bg-brand-surface border border-black/5 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-brand-text font-bold text-2xl">8</div>
              <div className="text-brand-text/50 text-xs font-bold uppercase tracking-wider mt-1">Chưa lên xe</div>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6 text-brand-text/40" />
            </div>
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
          <div className="flex flex-col gap-3">
            {filteredTickets.map((ticket, idx) => (
              <div key={idx} className="bg-white border border-black/5 hover:border-brand-primary p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors group shadow-sm hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold ${ticket.status === 'Hợp lệ' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`}>
                    {ticket.type === 'Vé Tháng' ? 'T' : 'L'}
                  </div>
                  <div>
                    <div className="font-black text-brand-text text-lg">{ticket.name}</div>
                    <div className="text-sm font-medium text-brand-text/60 mt-0.5">MSSV: {ticket.studentId} • Mã vé: {ticket.id}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 md:w-auto w-full border-t border-black/5 md:border-t-0 pt-4 md:pt-0">
                  <div className="text-right">
                    <div className={`text-sm font-bold ${ticket.status === 'Hợp lệ' ? 'text-brand-success' : 'text-brand-danger'}`}>
                      {ticket.status}
                    </div>
                    <div className="text-xs text-brand-text/50 font-medium mt-1">Lên xe: {ticket.time}</div>
                  </div>
                  <button className="px-6 py-2.5 bg-black text-white font-bold text-sm rounded-xl hover:bg-black/80 transition-colors">
                    Chi tiết
                  </button>
                </div>
              </div>
            ))}
            
            {filteredTickets.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-brand-text/20 mx-auto mb-4" />
                <p className="text-brand-text/60 font-medium">Không tìm thấy vé nào phù hợp.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
