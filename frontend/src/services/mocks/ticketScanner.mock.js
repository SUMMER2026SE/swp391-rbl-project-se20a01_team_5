export const mockScanTicket = (ticketCode) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate validation logic
      if (ticketCode === 'VALID' || ticketCode === 'TKT-123') {
        resolve({
          status: 'success',
          ticket: {
            id: ticketCode === 'VALID' ? 'TKT-999' : ticketCode,
            name: 'Nguyễn Văn A',
            studentId: '102220001',
            type: 'Vé Tháng',
            route: 'Tuyến 01',
            time: new Date().toLocaleTimeString('vi-VN')
          }
        });
      } else {
        reject(new Error('Vé đã hết hạn hoặc sai tuyến!'));
      }
    }, 1500); // simulate 1.5s delay for scanning
  });
};
