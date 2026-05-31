"use client";

import { useState, useEffect } from 'react';
import { History, Star, AlertCircle, MapPin, MessageSquare, Clock, BusFront, ShieldAlert, X, Send, Loader2, Info } from 'lucide-react';
import { historyService } from '@/services/history.service';

export default function TripHistoryPage() {
  const [activeModal, setActiveModal] = useState(null); // 'rate', 'lostItem', or null
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [rating, setRating] = useState(0);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await historyService.getHistory();
        setTrips(res.trips);
      } catch (err) {
        setError(err.message || 'Lỗi tải lịch sử chuyến đi');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const openModal = (type, trip) => {
    setActiveModal(type);
    setSelectedTrip(trip);
    setRating(0); // reset
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedTrip(null);
  };

  const handleRatingSubmit = (e) => {
    e.preventDefault();
    alert(`Đã gửi đánh giá ${rating} sao cho tài xế ${selectedTrip.driver}!`);
    closeModal();
  };

  const handleLostItemSubmit = (e) => {
    e.preventDefault();
    alert(`Đã báo cáo mất đồ trên chuyến ${selectedTrip.route} ngày ${selectedTrip.date}. Trung tâm sẽ liên hệ lại sớm nhất!`);
    closeModal();
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Lịch sử Chuyến đi</h1>
          <p className="text-brand-text/60 font-medium">Xem lại các chuyến xe đã đi, đánh giá tài xế hoặc báo mất đồ.</p>
        </div>
        <button className="bg-brand-surface border border-black/5 text-brand-text px-6 py-3 rounded-2xl font-bold hover:bg-brand-text hover:text-white transition-colors flex items-center gap-2 shadow-sm w-fit">
          <MessageSquare className="w-5 h-5" /> Góp ý Dịch vụ Chung
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <History className="w-6 h-6 text-brand-secondary" /> Chuyến đi gần đây
          </h2>

          <div className="flex flex-col gap-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-brand-text/40">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-bold text-lg">Đang tải lịch sử...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-brand-danger/60">
                <Info className="w-10 h-10 mb-4" />
                <p className="font-bold text-lg">{error}</p>
              </div>
            ) : trips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-brand-text/40">
                <History className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-bold text-lg">Chưa có chuyến đi nào.</p>
              </div>
            ) : (
              trips.map((trip) => (
                <div key={trip.id} className="border border-black/5 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 justify-between hover:border-brand-primary/50 transition-colors group">
                  
                  {/* Trip Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-surface rounded-xl flex items-center justify-center shrink-0">
                      <BusFront className="w-6 h-6 text-brand-text/50" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg">{trip.route}</h3>
                        <span className="px-2 py-0.5 bg-brand-success/10 text-brand-success text-[10px] font-black uppercase tracking-wider rounded-md">
                          {trip.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium text-brand-text/60">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {trip.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {trip.id}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-brand-text text-white rounded-full flex items-center justify-center text-[8px] font-bold">TX</div> 
                          {trip.driver}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openModal('rate', trip)}
                      className="flex-1 lg:flex-none px-4 py-2.5 bg-brand-secondary/10 text-brand-secondary font-bold text-sm rounded-xl hover:bg-brand-secondary hover:text-brand-text transition-colors flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" /> Đánh giá
                    </button>
                    <button 
                      onClick={() => openModal('lostItem', trip)}
                      className="flex-1 lg:flex-none px-4 py-2.5 bg-brand-danger/10 text-brand-danger font-bold text-sm rounded-xl hover:bg-brand-danger hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" /> Báo mất đồ
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 flex justify-center">
            <button className="text-sm font-bold text-brand-text/50 hover:text-brand-primary transition-colors">
              Xem thêm chuyến đi cũ...
            </button>
          </div>
        </div>

      </div>

      {/* Modals Overlay */}
      {activeModal && (
        <div className="absolute inset-0 z-50 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center p-4">
          
          {/* Rate Driver Modal */}
          {activeModal === 'rate' && (
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button onClick={closeModal} className="absolute top-6 right-6 w-8 h-8 bg-brand-surface rounded-full flex items-center justify-center hover:bg-brand-danger/10 hover:text-brand-danger transition-colors">
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-16 h-16 bg-brand-secondary/20 rounded-2xl flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-brand-secondary" />
              </div>
              
              <h2 className="text-2xl font-black mb-2">Đánh giá Tài xế</h2>
              <p className="text-brand-text/60 font-medium text-sm mb-6">
                Đánh giá chuyến đi cùng tài xế <span className="font-bold text-brand-text">{selectedTrip?.driver}</span> vào ngày {selectedTrip?.date}.
              </p>

              <form onSubmit={handleRatingSubmit} className="flex flex-col gap-6">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setRating(star)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${rating >= star ? 'bg-brand-secondary text-brand-text scale-110 shadow-md' : 'bg-brand-surface text-brand-text/20 hover:bg-brand-surface/70'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-text/70 mb-2">Góp ý thêm (Tùy chọn)</label>
                  <textarea 
                    rows="3"
                    placeholder="Bác tài chạy cẩn thận, xe sạch sẽ..."
                    className="w-full bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={rating === 0}
                  className="w-full py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" /> Gửi Đánh Giá
                </button>
              </form>
            </div>
          )}

          {/* Lost Item Modal */}
          {activeModal === 'lostItem' && (
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button onClick={closeModal} className="absolute top-6 right-6 w-8 h-8 bg-brand-surface rounded-full flex items-center justify-center hover:bg-brand-danger/10 hover:text-brand-danger transition-colors">
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-16 h-16 bg-brand-danger/10 rounded-2xl flex items-center justify-center mb-6 border border-brand-danger/20">
                <ShieldAlert className="w-8 h-8 text-brand-danger" />
              </div>
              
              <h2 className="text-2xl font-black mb-2 text-brand-danger">Báo Mất Đồ</h2>
              <p className="text-brand-text/60 font-medium text-sm mb-6">
                Chuyến {selectedTrip?.route} ({selectedTrip?.date}). Điều phối viên sẽ kiểm tra camera và liên hệ với tài xế ngay lập tức.
              </p>

              <form onSubmit={handleLostItemSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-bold text-brand-text/70 mb-2">Đồ vật bị mất</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Balo đen, Điện thoại iPhone..."
                    className="w-full bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-brand-text/70 mb-2">Mô tả chi tiết vị trí ngồi</label>
                  <textarea 
                    rows="2"
                    required
                    placeholder="Ngồi hàng ghế số 3 bên trái..."
                    className="w-full bg-brand-surface border border-black/5 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-brand-primary transition-all resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 mt-2 bg-brand-danger text-white font-bold rounded-2xl hover:bg-red-600 transition-colors flex justify-center items-center gap-2 shadow-xl shadow-brand-danger/20"
                >
                  <AlertCircle className="w-5 h-5" /> Gửi Báo Cáo Khẩn Cấp
                </button>
              </form>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
