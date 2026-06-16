import { apiClient } from './apiClient';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const adminSystemService = {
  getDashboard: async () => {
    if (USE_MOCK) return mockDashboard();
    const response = await apiClient('/admin/dashboard');
    return response.data;
  },

  getFares: async () => {
    if (USE_MOCK) return mockFares();
    const response = await apiClient('/admin/fares');
    return response.data ?? [];
  },

  getPricingRoutes: async () => {
    if (USE_MOCK) return mockRoutes();
    const response = await apiClient('/admin/routes/pricing-options');
    return response.data ?? [];
  },

  updateFare: async (payload) => {
    if (USE_MOCK) {
      return [
        {
          id: Date.now(),
          routeId: payload.routeId || 0,
          routeName: payload.routeId ? `Tuyến ${payload.routeId}` : 'Tất cả tuyến',
          fareType: payload.fareType,
          amount: payload.amount,
          effectiveFrom: payload.effectiveFrom || new Date().toISOString().slice(0, 10),
          effectiveUntil: payload.effectiveUntil || null,
          notes: payload.notes
        },
        ...mockFares()
      ];
    }
    const response = await apiClient('/admin/fares', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return response.data ?? [];
  },

  sendNotification: async (payload) => {
    if (USE_MOCK) {
      const totals = { all: 128, all_students: 96, all_staffs: 32 };
      return { createdMessages: totals[payload.target] ?? 0 };
    }
    const response = await apiClient('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return response.data;
  }
};

function mockDashboard() {
  const today = new Date();
  const revenueLast7Days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    return {
      day: day.toISOString().slice(0, 10),
      amount: [180000, 260000, 210000, 320000, 280000, 410000, 360000][index]
    };
  });
  return {
    todayRevenue: 360000,
    studentCount: 96,
    driverCount: 18,
    todayTripCount: 42,
    pendingCaseCount: 5,
    revenueLast7Days,
    userRoleCounts: [
      { role: 'STUDENT', total: 96 },
      { role: 'DRIVER', total: 18 },
      { role: 'CONDUCTOR', total: 8 },
      { role: 'DISPATCHER', total: 4 },
      { role: 'ADMIN', total: 2 }
    ],
    studentsBySchool: [
      { school: 'Đại học FPT', total: 45 },
      { school: 'Đại học Bách khoa', total: 24 },
      { school: 'Đại học Kinh tế', total: 16 },
      { school: 'Khác', total: 11 }
    ]
  };
}

function mockRoutes() {
  return [
    { id: 1, name: 'Tuyến 01 - Ký túc xá - Campus' },
    { id: 2, name: 'Tuyến 02 - Trung tâm - Campus' },
    { id: 3, name: 'Tuyến 03 - Bến xe - Campus' }
  ];
}

function mockFares() {
  return [
    { id: 1, routeId: 1, routeName: 'Tuyến 01 - Ký túc xá - Campus', fareType: 'SINGLE', amount: 7000, effectiveFrom: '2026-06-01', effectiveUntil: null, notes: '' },
    { id: 2, routeId: 1, routeName: 'Tuyến 01 - Ký túc xá - Campus', fareType: 'MONTHLY', amount: 160000, effectiveFrom: '2026-06-01', effectiveUntil: null, notes: '' },
    { id: 3, routeId: 2, routeName: 'Tuyến 02 - Trung tâm - Campus', fareType: 'SINGLE', amount: 9000, effectiveFrom: '2026-06-01', effectiveUntil: null, notes: '' },
    { id: 4, routeId: 2, routeName: 'Tuyến 02 - Trung tâm - Campus', fareType: 'MONTHLY', amount: 210000, effectiveFrom: '2026-06-01', effectiveUntil: null, notes: '' }
  ];
}
