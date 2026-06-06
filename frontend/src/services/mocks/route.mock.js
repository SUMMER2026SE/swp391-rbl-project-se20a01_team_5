export const mockRoutes = [
  { 
    id: 1, 
    name: 'Tuyến 1', 
    path: 'KTX Tập trung Đà Nẵng ⇄ Đại học Bách Khoa', 
    time: '06:00 - 18:00', 
    frequency: '15 phút/chuyến', 
    activeBuses: 3, 
    status: 'active',
    stops: 8
  },
  { 
    id: 2, 
    name: 'Tuyến 2', 
    path: 'Ngã ba Huế ⇄ Đại học Kinh Tế', 
    time: '06:30 - 17:30', 
    frequency: '20 phút/chuyến', 
    activeBuses: 2, 
    status: 'active',
    stops: 12
  },
  { 
    id: 3, 
    name: 'Tuyến 3', 
    path: 'Cầu Rồng ⇄ Đại học Ngoại Ngữ', 
    time: '07:00 - 18:00', 
    frequency: '30 phút/chuyến', 
    activeBuses: 0, 
    status: 'maintenance',
    stops: 6
  },
  { 
    id: 4, 
    name: 'Tuyến 4', 
    path: 'Bến xe Trung tâm ⇄ Đại học Sư Phạm', 
    time: '06:00 - 19:00', 
    frequency: '15 phút/chuyến', 
    activeBuses: 4, 
    status: 'active',
    stops: 15
  },
];

export const mockGetRoutes = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ routes: mockRoutes });
    }, 800);
  });
};
