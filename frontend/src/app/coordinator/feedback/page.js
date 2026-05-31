"use client";

import { useState } from 'react';
import { MessageSquare, BellRing, Send, AlertCircle, ShieldAlert, CheckCircle2, User, Search, Filter } from 'lucide-react';

const feedbacksFromBackend = [];

export default function CoordinatorFeedbackPage() {
  const [feedbacks] = useState(feedbacksFromBackend);
  const [notice, setNotice] = useState('');

  // Notification form state
  const [notifyTarget, setNotifyTarget] = useState('all_students');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyContent, setNotifyContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleResolve = (id) => {
    setNotice(`Chức năng xử lý phản hồi ${id} chưa được kết nối với backend.`);
  };

  const handleSendNotification = (e) => {
    e.preventDefault();
    setIsSending(true);
    setIsSending(false);
    setNotifyTitle('');
    setNotifyContent('');
    setNotice('Chức năng phát thông báo chưa được kết nối với backend.');
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-brand-primary" /> Phản hồi & Thông báo
          </h1>
          <p className="text-brand-text/60 font-medium">Trung tâm xử lý khiếu nại và phát thông báo hệ thống.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-hidden pb-6">

        {/* Column 1: Incoming Feedbacks */}
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
          <div className="p-6 md:p-8 border-b border-black/5 bg-brand-surface/30 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Hộp thư Phản hồi</h2>
              <div className="flex items-center gap-2 text-sm font-bold text-brand-danger bg-brand-danger/10 px-3 py-1 rounded-md">
                {feedbacks.filter(f => f.status === 'pending').length} chờ xử lý
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                <input type="text" placeholder="Tìm kiếm phản hồi..." className="w-full bg-white border border-black/5 rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary" />
              </div>
              <button className="bg-white border border-black/5 p-2 rounded-xl text-brand-text hover:bg-brand-surface transition-colors">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {notice && (
              <div className="mb-4 rounded-2xl border border-brand-secondary/20 bg-brand-secondary/10 p-4 text-sm font-bold text-brand-text">
                {notice}
              </div>
            )}
            <div className="flex flex-col gap-4">
              {feedbacks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/10 bg-brand-surface/40 p-8 text-center text-sm font-bold text-brand-text/50">
                  Chưa có dữ liệu phản hồi từ backend.
                </div>
              )}
              {feedbacks.map((fb) => (
                <div key={fb.id} className={`border rounded-2xl p-5 transition-colors ${fb.status === 'resolved' ? 'border-black/5 bg-brand-surface/30 opacity-70' : fb.type === 'sos' ? 'border-brand-danger/30 bg-brand-danger/5' : fb.type === 'lost_item' ? 'border-brand-secondary/30 bg-brand-secondary/5' : 'border-black/5 bg-white shadow-sm'}`}>

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${fb.type === 'sos' ? 'bg-brand-danger text-white' : fb.type === 'lost_item' ? 'bg-brand-secondary text-brand-text' : 'bg-brand-surface text-brand-text'}`}>
                        {fb.type === 'sos' ? <ShieldAlert className="w-4 h-4" /> : fb.type === 'lost_item' ? <AlertCircle className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{fb.user}</div>
                        <div className="text-[10px] font-bold text-brand-text/50">{fb.time}</div>
                      </div>
                    </div>
                    {fb.status === 'pending' ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-brand-danger text-white animate-pulse">Chờ xử lý</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-brand-success text-white">Đã xử lý</span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-brand-text mb-4">
                    {fb.content}
                  </p>

                  {fb.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolve(fb.id)}
                        className="flex-1 py-2 bg-brand-success/10 text-brand-success font-bold text-xs rounded-xl hover:bg-brand-success hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã xử lý
                      </button>
                      <button className="py-2 px-4 bg-brand-surface font-bold text-xs rounded-xl hover:bg-black hover:text-white transition-colors">
                        Phản hồi
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Send Notification */}
        <div className="bg-brand-primary/10 rounded-3xl p-6 md:p-8 shadow-sm border border-brand-primary/20 flex flex-col">

          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 shrink-0">
            <BellRing className="w-6 h-6 text-brand-primary" /> Phát Thông Báo Mới
          </h2>

          <form onSubmit={handleSendNotification} className="flex flex-col gap-6 flex-1">

            <div>
              <label className="block text-sm font-bold text-brand-text/70 mb-2">Gửi đến (Nhóm đối tượng)</label>
              <select
                value={notifyTarget}
                onChange={(e) => setNotifyTarget(e.target.value)}
                className="w-full bg-white border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary transition-all"
              >
                <option value="all_students">Tất cả Sinh viên</option>
                <option value="all_drivers">Tất cả Tài xế</option>
                <option value="route_1">Sinh viên đăng ký Tuyến 1</option>
                <option value="route_2">Sinh viên đăng ký Tuyến 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-text/70 mb-2">Tiêu đề thông báo</label>
              <input
                type="text"
                required
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                placeholder="VD: Thay đổi lộ trình Tuyến 1..."
                className="w-full bg-white border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-bold text-brand-text/70 mb-2">Nội dung chi tiết</label>
              <textarea
                required
                value={notifyContent}
                onChange={(e) => setNotifyContent(e.target.value)}
                placeholder="Nhập nội dung chi tiết thông báo..."
                className="w-full flex-1 min-h-[150px] bg-white border border-transparent rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-primary transition-all resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-4 mt-auto bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" /> {isSending ? 'Đang gửi...' : 'Phát Thông Báo (Push Notification)'}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
