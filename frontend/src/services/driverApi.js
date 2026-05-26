import axiosClient from '@/utils/axiosClient';

export const driverApi = {
  dashboard(maTaiXe = 1) {
    return axiosClient.get('/driver/dashboard', { params: { maTaiXe } });
  },
  trips(maTaiXe = 1, params = {}) {
    return axiosClient.get('/driver/trips', { params: { maTaiXe, ...params } });
  },
  currentTrip(maTaiXe = 1) {
    return axiosClient.get('/driver/trips/current', { params: { maTaiXe } });
  },
  routeStops(maChuyenXe) {
    return axiosClient.get(`/driver/trips/${maChuyenXe}/route-stops`);
  },
  startTrip(maChuyenXe, maTaiXe = 1, payload = {}) {
    return axiosClient.post(`/driver/trips/${maChuyenXe}/start`, payload, { params: { maTaiXe } });
  },
  endTrip(maChuyenXe, maTaiXe = 1, payload = {}) {
    return axiosClient.post(`/driver/trips/${maChuyenXe}/end`, payload, { params: { maTaiXe } });
  },
  contact(maChuyenXe = 1) {
    return axiosClient.get('/driver/contact', { params: { maChuyenXe } });
  },
  profile(maTaiXe = 1) {
    return axiosClient.get('/driver/profile', { params: { maTaiXe } });
  },
};
