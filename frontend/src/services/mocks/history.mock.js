export const mockTrips = [
  { id: 'TRP-101', date: '24/05/2026 14:30', route: 'Tuyến 1: KTX ⇄ ĐH Bách Khoa', driver: 'Nguyễn Văn Tài', status: 'Hoàn thành' },
  { id: 'TRP-098', date: '23/05/2026 07:15', route: 'Tuyến 2: Ngã ba Huế ⇄ ĐH Kinh Tế', driver: 'Trần Văn B', status: 'Hoàn thành' },
  { id: 'TRP-054', date: '20/05/2026 17:00', route: 'Tuyến 1: KTX ⇄ ĐH Bách Khoa', driver: 'Lê Hoàng C', status: 'Hoàn thành' },
];

export const mockGetHistory = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ trips: mockTrips });
    }, 800);
  });
};
