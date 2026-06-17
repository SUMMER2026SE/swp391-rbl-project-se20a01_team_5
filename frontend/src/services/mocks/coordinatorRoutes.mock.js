let MOCK_ROUTES = [
  { id: 'T1', name: 'Tuyến 1: KTX ⇄ Bách Khoa', stopsCount: 8, active: true },
  { id: 'T2', name: 'Tuyến 2: Ngã Ba Huế ⇄ Kinh Tế', stopsCount: 12, active: true },
  { id: 'T3', name: 'Tuyến 3: Cầu Rồng ⇄ Ngoại Ngữ', stopsCount: 6, active: false },
];

let INITIAL_STOPS = [
  { id: 'S01', name: 'KTX Tập trung Đà Nẵng', timeFromStart: '0 phút', type: 'Điểm đầu' },
  { id: 'S02', name: 'Ngã Ba Huế', timeFromStart: '15 phút', type: 'Trạm dừng' },
  { id: 'S03', name: 'Đại học Bách Khoa', timeFromStart: '30 phút', type: 'Trạm dừng' },
  { id: 'S04', name: 'Đại học Sư Phạm', timeFromStart: '45 phút', type: 'Điểm cuối' },
];

export const mockGetRoutes = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_ROUTES]), 600);
  });
};

export const mockAddRoute = (routeData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newRoute = { 
        ...routeData, 
        id: `T${MOCK_ROUTES.length + 1}`, 
        stopsCount: 0, 
        active: true 
      };
      MOCK_ROUTES.push(newRoute);
      resolve({ success: true, data: newRoute });
    }, 600);
  });
};

export const mockGetRouteStops = (routeId) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...INITIAL_STOPS]), 600); // In mock, return same stops for all
  });
};

export const mockAddStop = (routeId, stop) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newStop = { ...stop, id: `S0${INITIAL_STOPS.length + 1}` };
      INITIAL_STOPS.push(newStop);
      resolve({ success: true, data: newStop });
    }, 500);
  });
};

export const mockUpdateStop = (routeId, stop) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      INITIAL_STOPS = INITIAL_STOPS.map(s => s.id === stop.id ? stop : s);
      resolve({ success: true, data: stop });
    }, 500);
  });
};

export const mockDeleteStop = (routeId, stopId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      INITIAL_STOPS = INITIAL_STOPS.filter(s => s.id !== stopId);
      resolve({ success: true });
    }, 500);
  });
};
