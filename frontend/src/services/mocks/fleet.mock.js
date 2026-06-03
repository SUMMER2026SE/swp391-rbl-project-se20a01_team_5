export const mockGetFleetStatus = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '43B-123.45', route: 'Tuyến 1', driver: 'Nguyễn Văn Tài', status: 'moving', speed: '45 km/h', location: 'Ngã ba Huế', x: 30, y: 40 },
        { id: '43B-888.99', route: 'Tuyến 2', driver: 'Trần Văn B', status: 'stopped', speed: '0 km/h', location: 'KTX Bách Khoa', x: 70, y: 20 },
        { id: '43B-555.22', route: 'Tuyến 1', driver: 'Lê Hoàng C', status: 'warning', speed: '15 km/h', location: 'Cầu Rồng', x: 50, y: 70 },
      ]);
    }, 800);
  });
};
