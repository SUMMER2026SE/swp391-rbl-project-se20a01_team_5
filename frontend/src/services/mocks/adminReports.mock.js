export const mockGetReports = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { 
          id: 'REP-001', 
          type: 'violation', 
          title: 'Tài xế vi phạm tốc độ', 
          reporter: 'Hệ thống GPS', 
          target: 'Tài xế Nguyễn Văn Tài (TX01)', 
          time: '15 phút trước', 
          content: 'Tài xế điều khiển xe 43B-123.45 vượt quá tốc độ cho phép (hơn 60km/h) tại đoạn đường Lê Duẩn.', 
          status: 'pending',
          severity: 'high'
        },
        { 
          id: 'REP-002', 
          type: 'complaint', 
          title: 'Thái độ phụ xe không tốt', 
          reporter: 'Sinh viên Trần Văn B (SV102)', 
          target: 'Phụ xe Lê Thị C (PX02)', 
          time: '2 giờ trước', 
          content: 'Phụ xe tuyến số 2 vào lúc 8h sáng nay có thái độ cáu gắt và la mắng sinh viên khi lên xe.', 
          status: 'pending',
          severity: 'medium'
        },
        { 
          id: 'REP-003', 
          type: 'system', 
          title: 'Lỗi nạp tiền ví điện tử', 
          reporter: 'Nhiều sinh viên', 
          target: 'Cổng thanh toán', 
          time: '1 ngày trước', 
          content: 'Nhiều giao dịch nạp tiền qua VNPay bị trừ tiền nhưng không cộng vào ví UniBus.', 
          status: 'resolved',
          severity: 'high'
        },
      ]);
    }, 800);
  });
};

export const mockUpdateReportStatus = (id, newStatus) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, id, status: newStatus }), 600);
  });
};
