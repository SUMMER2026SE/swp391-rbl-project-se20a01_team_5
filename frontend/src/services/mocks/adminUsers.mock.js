export const mockGetUsers = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '102220001', name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', role: 'Sinh viên', status: 'active', joined: '12/05/2026' },
        { id: 'TX01', name: 'Nguyễn Văn Tài', email: 'tai.nguyen@unibus.vn', role: 'Tài xế', status: 'active', joined: '01/01/2026' },
        { id: '102220099', name: 'Trần Văn Vi Phạm', email: 'vipham@gmail.com', role: 'Sinh viên', status: 'locked', joined: '10/05/2026' },
        { id: 'DP01', name: 'Lê Thị Điều Phối', email: 'dieuphoi@unibus.vn', role: 'Điều phối', status: 'active', joined: '15/02/2026' },
        { id: 'TX02', name: 'Phạm Văn B', email: 'vanb@unibus.vn', role: 'Tài xế', status: 'active', joined: '20/03/2026' },
      ]);
    }, 800);
  });
};

export const mockToggleUserLock = (id, newStatus) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, id, status: newStatus }), 600);
  });
};

export const mockAddUser = (user) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, data: user }), 600);
  });
};
