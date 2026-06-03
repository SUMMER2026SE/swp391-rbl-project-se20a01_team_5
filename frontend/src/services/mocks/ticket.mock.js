export const mockGetTicketList = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'TKT-001', name: 'Nguyễn Văn A', studentId: '102220001', type: 'Vé Tháng', status: 'Hợp lệ', time: '07:05' },
        { id: 'TKT-002', name: 'Trần Thị B', studentId: '102220002', type: 'Vé Lượt', status: 'Hợp lệ', time: '07:08' },
        { id: 'TKT-003', name: 'Lê Văn C', studentId: '102220003', type: 'Vé Tháng', status: 'Hết hạn', time: '07:12' },
        { id: 'TKT-004', name: 'Phạm Thị D', studentId: '102220004', type: 'Vé Tháng', status: 'Hợp lệ', time: '07:15' },
      ]);
    }, 800);
  });
};
