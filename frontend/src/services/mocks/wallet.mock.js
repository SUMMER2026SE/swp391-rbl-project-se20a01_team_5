export const mockTransactions = [
  { id: 'TXN-001', type: 'in', title: 'Nạp tiền từ Momo', amount: 200000, date: '25/05/2026 08:30' },
  { id: 'TXN-002', type: 'out', title: 'Mua vé tháng Tuyến 01', amount: -150000, date: '25/05/2026 08:35' },
  { id: 'TXN-003', type: 'in', title: 'Hoàn tiền vé lỗi', amount: 10000, date: '20/05/2026 14:20' },
  { id: 'TXN-004', type: 'out', title: 'Mua vé lượt Tuyến 03', amount: -10000, date: '18/05/2026 07:15' },
];

export const mockGetBalance = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const saved = localStorage.getItem('wallet_balance');
      resolve({ balance: saved ? parseInt(saved) : 150000 });
    }, 800);
  });
};

export const mockGetTransactions = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const saved = localStorage.getItem('wallet_transactions');
      if (saved) {
        resolve({ transactions: JSON.parse(saved) });
      } else {
        localStorage.setItem('wallet_transactions', JSON.stringify(mockTransactions));
        resolve({ transactions: mockTransactions });
      }
    }, 800);
  });
};

export const mockTopup = (amount) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let savedBalance = parseInt(localStorage.getItem('wallet_balance') || '150000');
      savedBalance += amount;
      localStorage.setItem('wallet_balance', savedBalance.toString());

      let savedTxns = JSON.parse(localStorage.getItem('wallet_transactions') || JSON.stringify(mockTransactions));
      const newTxn = {
        id: `TXN-00${savedTxns.length + 1}`,
        type: 'in',
        title: 'Nạp tiền từ Ngân hàng',
        amount: amount,
        date: new Date().toLocaleString('vi-VN')
      };
      savedTxns = [newTxn, ...savedTxns];
      localStorage.setItem('wallet_transactions', JSON.stringify(savedTxns));

      resolve({ success: true, balance: savedBalance, transaction: newTxn });
    }, 1500);
  });
};
