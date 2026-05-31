export const mockDrivers = [
  { id: 'TX01', name: 'Nguyễn Văn Tài', status: 'available' },
  { id: 'TX02', name: 'Trần Văn B', status: 'busy' },
  { id: 'TX03', name: 'Lê Thị C', status: 'available' },
  { id: 'TX04', name: 'Phạm Văn D', status: 'off' },
];

export const mockBuses = [
  { id: '43B-123.45', type: '45 chỗ', status: 'available' },
  { id: '43B-888.99', type: '29 chỗ', status: 'busy' },
  { id: '43B-555.22', type: '45 chỗ', status: 'maintenance' },
  { id: '43B-777.11', type: '29 chỗ', status: 'available' },
];

export const mockShifts = [
  { id: 'S1', route: 'Tuyến 1: KTX ⇄ ĐH Bách Khoa', time: '06:00 - 08:00', driver: 'TX01', bus: '43B-123.45', status: 'assigned' },
  { id: 'S2', route: 'Tuyến 2: Ngã ba Huế ⇄ ĐH Kinh Tế', time: '06:30 - 08:30', driver: '', bus: '', status: 'unassigned' },
  { id: 'S3', route: 'Tuyến 1: KTX ⇄ ĐH Bách Khoa', time: '08:30 - 10:30', driver: '', bus: '', status: 'unassigned' },
  { id: 'S4', route: 'Tuyến 3: Cầu Rồng ⇄ ĐH Ngoại Ngữ', time: '07:00 - 09:00', driver: 'TX02', bus: '43B-888.99', status: 'assigned' },
];

export const mockGetScheduleData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ drivers: mockDrivers, buses: mockBuses, shifts: mockShifts });
    }, 800);
  });
};
