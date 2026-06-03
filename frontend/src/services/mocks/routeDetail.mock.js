export const mockStops = [
  { id: 1, name: 'KTX Tập trung Đà Nẵng', passed: true, time: '07:00' },
  { id: 2, name: 'Ngã Ba Huế', passed: true, time: '07:15' },
  { id: 3, name: 'Đại học Bách Khoa', passed: false, time: '07:30', isCurrent: true, eta: '5 phút' },
  { id: 4, name: 'Đại học Sư Phạm', passed: false, time: '07:45' },
  { id: 5, name: 'Bến xe Trung tâm', passed: false, time: '08:00' }
];

export const mockGetRouteDetail = (routeId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ 
        id: routeId, 
        busPlate: '43B-123.45', 
        speed: '45 km/h',
        stops: mockStops 
      });
    }, 800);
  });
};
