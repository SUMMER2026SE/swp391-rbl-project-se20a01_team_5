"use client";

import { useState } from 'react';
import { CreditCard, QrCode, Calendar, CheckCircle2, History, XCircle, ArrowRight, RefreshCw, X, ShoppingCart, MapPin, Receipt, ShieldCheck } from 'lucide-react';

export default function PassesPage() {
  const [hasPass, setHasPass] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [invoices, setInvoices] = useState([
    { id: 'INV-001', date: '01/05/2026', amount: '100.000đ', item: 'Vé tháng Sinh viên', status: 'Expired' }
  ]);
  const [registeredRoutes, setRegisteredRoutes] = useState([
    { id: 1, name: 'Tuyến 1', path: 'KTX Đà Nẵng ⇄ ĐH Bách Khoa', status: 'Active' }
  ]);

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setHasPass(true);
    setShowPaymentModal(false);
    
    // Add new invoice
    const newInvoice = {
      id: `INV-00${invoices.length + 1}`,
      date: new Date().toLocaleDateString('vi-VN'),
      amount: '100.000đ',
      item: 'Vé tháng Sinh viên',
      status: 'Success'
    };
    setInvoices([newInvoice, ...invoices]);
    
    alert("Thanh toán thành công! Vé tháng của bạn đã được kích hoạt.");
  };

  const handleCancelRoute = (id) => {
    if(confirm("Bạn có chắc chắn muốn hủy đăng ký tuyến cố định này không?")) {
      setRegisteredRoutes(registeredRoutes.filter(r => r.id !== id));
    }
  };

  const handleChangeRoute = () => {
    alert("Tính năng đổi tuyến sẽ mở ra cửa sổ chọn tuyến mới (Đang phát triển).");
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Vé & Thanh toán</h1>
        <p className="text-brand-text/60 font-medium">Quản lý vé tháng, tuyến cố định và hóa đơn dịch vụ của bạn.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        
        {/* Column 1: Pass & Route Management */}
        <div className="flex flex-col gap-6">
          
          {/* Current Pass Bento */}
          <div className="bg-brand-text text-white rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand-primary/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold mb-1">Vé Tháng Sinh Viên</h2>
                {hasPass ? (
                  <div className="flex items-center gap-2 text-brand-success font-bold text-sm bg-brand-success/20 px-3 py-1 rounded-md w-fit">
                    <CheckCircle2 className="w-4 h-4" /> Đang sử dụng hợp lệ
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-brand-danger font-bold text-sm bg-brand-danger/20 px-3 py-1 rounded-md w-fit">
                    <XCircle className="w-4 h-4" /> Vé đã hết hạn
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="text-sm text-white/50 font-bold uppercase tracking-wider mb-1">Mã vé của bạn</div>
              <div className="text-3xl font-mono tracking-widest font-black mb-6">
                {hasPass ? "UB-89012" : "---"}
              </div>

              {hasPass ? (
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Hạn dùng: 24/06/2026
                  </div>
                  <button className="flex-1 bg-white text-brand-text font-bold py-2 rounded-xl hover:bg-brand-primary transition-colors flex justify-center items-center gap-2">
                    <QrCode className="w-4 h-4" /> Mở QR Soát vé
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-brand-primary text-brand-text font-bold py-4 rounded-xl hover:bg-white transition-colors flex justify-center items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" /> Mua vé ngay để tiếp tục
                </button>
              )}
            </div>
          </div>

          {/* Route Management Bento */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-brand-secondary" /> Tuyến xe đã đăng ký cố định
            </h3>
            
            <div className="flex flex-col gap-4">
              {registeredRoutes.length > 0 ? registeredRoutes.map((route) => (
                <div key={route.id} className="border border-black/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-lg">{route.name}</h4>
                    <p className="text-sm font-medium text-brand-text/60">{route.path}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={handleChangeRoute}
                      className="px-4 py-2 bg-brand-surface font-bold text-sm rounded-xl hover:bg-brand-secondary/10 hover:text-brand-secondary transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Đổi
                    </button>
                    <button 
                      onClick={() => handleCancelRoute(route.id)}
                      className="px-4 py-2 bg-brand-danger/10 text-brand-danger font-bold text-sm rounded-xl hover:bg-brand-danger hover:text-white transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-brand-text/40 font-medium">
                  Bạn chưa đăng ký sử dụng tuyến xe cố định nào.
                </div>
              )}

              <button className="w-full py-4 bg-brand-surface font-bold text-sm rounded-2xl hover:bg-brand-primary hover:text-brand-text transition-colors border border-black/5 border-dashed">
                + Đăng ký thêm tuyến xe cố định
              </button>
            </div>
          </div>

        </div>

        {/* Column 2: Buy & Invoices */}
        <div className="flex flex-col gap-6">
          
          {/* Shop/Buy Bento */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-brand-primary" /> Mua vé & Gia hạn
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-brand-primary bg-brand-primary/5 rounded-2xl p-5 relative">
                <div className="absolute top-0 right-0 bg-brand-primary text-brand-text text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl rounded-tr-xl">Khuyên dùng</div>
                <h4 className="font-bold text-lg mb-1">Vé Tháng</h4>
                <p className="text-xs font-medium text-brand-text/60 mb-4">Đi không giới hạn số chuyến trong vòng 30 ngày.</p>
                <div className="text-2xl font-black mb-4">100.000đ</div>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3 bg-brand-text text-white font-bold rounded-xl hover:bg-black transition-colors"
                >
                  Chọn Mua
                </button>
              </div>

              <div className="border border-black/5 rounded-2xl p-5">
                <h4 className="font-bold text-lg mb-1">Vé Lượt (E-Ticket)</h4>
                <p className="text-xs font-medium text-brand-text/60 mb-4">Dành cho sinh viên thi thoảng mới sử dụng xe.</p>
                <div className="text-2xl font-black mb-4">5.000đ</div>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3 bg-brand-surface text-brand-text font-bold rounded-xl hover:bg-brand-secondary/20 transition-colors"
                >
                  Chọn Mua
                </button>
              </div>
            </div>
          </div>

          {/* Invoice History Bento */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 shrink-0">
              <Receipt className="w-6 h-6 text-brand-text/60" /> Lịch sử Hóa đơn
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="pb-4 text-xs font-bold text-brand-text/40 uppercase border-b border-black/5">Mã HĐ</th>
                    <th className="pb-4 text-xs font-bold text-brand-text/40 uppercase border-b border-black/5">Ngày</th>
                    <th className="pb-4 text-xs font-bold text-brand-text/40 uppercase border-b border-black/5">Nội dung</th>
                    <th className="pb-4 text-xs font-bold text-brand-text/40 uppercase border-b border-black/5 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="group">
                      <td className="py-4 border-b border-black/5 text-sm font-bold">{inv.id}</td>
                      <td className="py-4 border-b border-black/5 text-sm font-medium text-brand-text/70">{inv.date}</td>
                      <td className="py-4 border-b border-black/5 text-sm font-medium">{inv.item}</td>
                      <td className="py-4 border-b border-black/5 text-sm font-bold text-right text-brand-success">{inv.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Payment Modal Overlay */}
      {showPaymentModal && (
        <div className="absolute inset-0 z-50 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-6 right-6 w-8 h-8 bg-brand-surface rounded-full flex items-center justify-center hover:bg-brand-danger/10 hover:text-brand-danger transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-brand-primary" />
            </div>
            
            <h2 className="text-2xl font-black mb-2">Thanh toán an toàn</h2>
            <p className="text-brand-text/60 font-medium text-sm mb-6">Vui lòng kiểm tra lại thông tin và tiến hành thanh toán qua Cổng VNPay.</p>

            <div className="bg-brand-surface rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-brand-text/60">Dịch vụ</span>
                <span className="font-bold">Vé Tháng Sinh Viên</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-brand-text/60">Tài khoản</span>
                <span className="font-bold">Nguyễn Văn A (1022...)</span>
              </div>
              <div className="h-px bg-black/5 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-brand-text/60">Tổng thanh toán</span>
                <span className="text-xl font-black text-brand-success">100.000đ</span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <button 
                type="submit"
                className="w-full py-4 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl shadow-brand-text/20"
              >
                Xác nhận Thanh toán
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
