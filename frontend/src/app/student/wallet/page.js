"use client";

import { useState, useEffect } from 'react';
import { Wallet, Plus, CreditCard, ArrowDownToLine, ArrowUpRight, History, X, CheckCircle2, Loader2, Info } from 'lucide-react';
import { walletService } from '@/services/wallet.service';

export default function StudentWalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState(50000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [balRes, txnRes] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions()
      ]);
      setBalance(balRes.balance);
      setTransactions(txnRes.transactions);
    } catch (err) {
      setError(err.message || 'Lỗi tải dữ liệu ví');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const res = await walletService.topup(topupAmount, 'momo');
      setShowSuccess(true);
      
      // Update local state instead of refetching to save network request
      setBalance(res.balance);
      if (res.transaction) {
        setTransactions(prev => [res.transaction, ...prev]);
      }
      
      // Update global context/event if necessary
      window.dispatchEvent(new CustomEvent('walletUpdated', { detail: res.balance }));

      setTimeout(() => {
        setShowSuccess(false);
        setIsTopupModalOpen(false);
      }, 2000);
    } catch (err) {
      alert('Nạp tiền thất bại: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2">Ví cá nhân</h1>
        <p className="text-brand-text/60 font-medium">Quản lý số dư và thanh toán các dịch vụ xe buýt dễ dàng.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
        
        {/* Column 1: Wallet Card & Payment Methods */}
        <div className="flex flex-col gap-6">
          
          {/* Digital Card */}
          <div className="bg-gradient-to-br from-brand-primary via-brand-primary to-[#ff9100] rounded-3xl p-8 shadow-md relative overflow-hidden text-brand-text">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[200px]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold uppercase tracking-wider mb-1 opacity-80">Số dư khả dụng</div>
                  <div className="text-4xl font-black">
                    {isLoading ? <span className="animate-pulse bg-white/20 text-transparent rounded w-32 inline-block">00000</span> : formatCurrency(balance)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/40">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setIsTopupModalOpen(true)}
                  className="flex-1 py-3 bg-brand-text text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-sm"
                >
                  <ArrowDownToLine className="w-5 h-5" /> Nạp tiền
                </button>
                <button className="flex-1 py-3 bg-white/40 backdrop-blur-sm border border-white/50 text-brand-text rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/60 transition-colors">
                  <ArrowUpRight className="w-5 h-5" /> Rút tiền
                </button>
              </div>
            </div>
          </div>

          {/* Linked Methods */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex-1">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-text/60" /> Nguồn tiền liên kết
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="border-2 border-brand-primary bg-brand-primary/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="Momo" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <div className="font-bold text-brand-text">Ví Momo</div>
                    <div className="text-xs font-medium text-brand-text/60">Liên kết ngày: 12/01/2026</div>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border-4 border-brand-primary flex items-center justify-center">
                  <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                </div>
              </div>

              <div className="border-2 border-transparent bg-brand-surface hover:border-black/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <div className="font-bold text-brand-text">Thẻ Mastercard</div>
                    <div className="text-xs font-medium text-brand-text/60">**** **** **** 4242</div>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border-2 border-brand-text/20"></div>
              </div>

              <button className="border-2 border-dashed border-black/10 hover:border-brand-primary hover:bg-black/5 bg-transparent rounded-2xl p-4 flex items-center justify-center gap-2 font-bold text-brand-text/60 transition-colors mt-2">
                <Plus className="w-5 h-5" /> Thêm phương thức mới
              </button>
            </div>
          </div>
        </div>

        {/* Column 2 & 3: Transaction History */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex-1 flex flex-col">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <History className="w-6 h-6 text-brand-text/60" /> Lịch sử Giao dịch
            </h3>
            
            <div className="flex-1 flex flex-col gap-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-brand-text/40">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="font-semibold">Đang tải lịch sử...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-10 text-brand-danger/60">
                  <Info className="w-8 h-8 mb-4" />
                  <p className="font-semibold">{error}</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-brand-text/40">
                  <History className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-semibold">Chưa có giao dịch nào</p>
                </div>
              ) : (
                transactions.map((txn, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-brand-surface/50 hover:bg-brand-surface rounded-2xl transition-colors border border-transparent hover:border-black/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${txn.type === 'in' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`}>
                        {txn.type === 'in' ? <ArrowDownToLine className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="font-bold text-brand-text text-base">{txn.title}</div>
                        <div className="text-xs font-medium text-brand-text/50 mt-1">{txn.date} • {txn.id}</div>
                      </div>
                    </div>
                    <div className={`text-lg font-black ${txn.type === 'in' ? 'text-brand-success' : 'text-brand-text'}`}>
                      {txn.type === 'in' ? '+' : ''}{formatCurrency(txn.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Topup Modal Overlay */}
      {isTopupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-black/5 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {showSuccess ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-24 h-24 text-brand-success mb-6 animate-bounce" />
                <h2 className="text-2xl font-black mb-2">Nạp tiền thành công!</h2>
                <p className="text-brand-text/60 font-medium">Bạn đã nạp {formatCurrency(topupAmount)} vào Ví cá nhân.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-black/5 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Nạp tiền vào Ví</h2>
                  <button 
                    onClick={() => setIsTopupModalOpen(false)}
                    className="p-2 rounded-xl hover:bg-black/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-brand-text/60" />
                  </button>
                </div>
                
                <form onSubmit={handleTopup} className="p-6">
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-brand-text/70 mb-3">Chọn số tiền nạp</label>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[20000, 50000, 100000, 200000, 500000].map(amt => (
                        <button 
                          key={amt}
                          type="button"
                          onClick={() => setTopupAmount(amt)}
                          className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${topupAmount === amt ? 'border-brand-primary bg-brand-primary/10 text-brand-text' : 'border-black/5 bg-brand-surface text-brand-text/60 hover:border-brand-primary/50'}`}
                        >
                          {amt / 1000}k
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-brand-text/40">VNĐ</span>
                      <input 
                        type="number" 
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(Number(e.target.value))}
                        className="w-full pl-14 pr-4 py-4 rounded-xl bg-brand-surface border border-transparent focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all font-black text-xl text-right"
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-bold text-brand-text/70 mb-3">Nguồn tiền</label>
                    <div className="border border-black/5 bg-brand-surface rounded-xl p-4 flex items-center gap-4">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="Momo" className="w-5 h-5 object-contain" />
                      </div>
                      <div className="font-bold">Ví Momo</div>
                      <div className="ml-auto text-brand-text/40 font-bold text-sm">Thay đổi</div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isProcessing || topupAmount < 10000}
                    className="w-full py-4 bg-brand-text text-white rounded-xl font-bold text-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
                  >
                    {isProcessing ? (
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      `Nạp ${formatCurrency(topupAmount)}`
                    )}
                  </button>
                </form>
              </>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}
