import type {
  User,
  BusStop,
  Route,
  Bus,
  Trip,
  Booking,
  Invoice,
  Notification,
  Feedback,
  LostItem,
  Complaint,
  Incident,
  ScheduleSlot,
  University,
  UniversityDomain,
  StudentRosterEntry,
  ImportBatch,
  SubsidyPolicy,
  RouteUniversity,
  AuditLogEntry,
  UniversityStats,
} from "./types";

// ---------- USERS ----------
export const users: User[] = [
  {
    id: "u1",
    name: "Nguyễn Minh Anh",
    email: "minhanh@duytan.edu.vn",
    phone: "0912 345 678",
    avatar: "MA",
    role: "student",
    studentId: "SE20A01",
    faculty: "Công nghệ Phần mềm",
    class: "SE20A01",
    status: "active",
    createdAt: "2024-08-15",
    universityId: "uni1",
    verificationStatus: "VERIFIED",
    authProvider: "google",
  },
  {
    id: "u6u",
    name: "Đặng Thị Bích Ngọc",
    email: "ngocdtb@duytan.edu.vn",
    phone: "0908 112 233",
    avatar: "BN",
    role: "university_admin",
    employeeId: "UA-DTU-001",
    status: "active",
    createdAt: "2023-02-01",
    universityId: "uni1",
  },
  {
    id: "u2",
    name: "Trần Hoàng Long",
    email: "longth@busgo.dn.edu.vn",
    phone: "0987 654 321",
    avatar: "LÔ",
    role: "driver",
    licenseNo: "B2-0459821",
    employeeId: "DRV-012",
    status: "active",
    createdAt: "2023-06-10",
  },
  {
    id: "u3",
    name: "Lê Thị Phương",
    email: "phuonglt@busgo.dn.edu.vn",
    phone: "0901 222 333",
    avatar: "PT",
    role: "assistant",
    employeeId: "AST-034",
    status: "active",
    createdAt: "2024-01-20",
  },
  {
    id: "u4",
    name: "Phạm Quốc Bảo",
    email: "baopq@busgo.dn.edu.vn",
    phone: "0933 444 555",
    avatar: "BQ",
    role: "coordinator",
    employeeId: "CRD-007",
    status: "active",
    createdAt: "2022-09-01",
  },
  {
    id: "u5",
    name: "Võ Thu Hà",
    email: "havt@busgo.dn.edu.vn",
    phone: "0944 555 666",
    avatar: "HT",
    role: "admin",
    employeeId: "ADM-001",
    status: "active",
    createdAt: "2022-01-15",
  },
];

export const currentUser = users[0]; // student by default; role switch changes this

// ---------- BUS STOPS — Đà Nẵng thực tế (coordinates spread to avoid overlap) ----------
export const busStops: BusStop[] = [
  // Trường ĐH Duy Tân — 2 cơ sở (NVL main, Lê Duẩn ~1km away)
  { id: "s1", name: "ĐH Duy Tân (Nguyễn Văn Linh)", code: "DTU-NVL", address: "254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng", lat: 16.0744, lng: 108.1522, routes: ["r1", "r2"], hasShelter: true },
  { id: "s2", name: "ĐH Duy Tân (Lê Duẩn)", code: "DTU-LD", address: "254 Lê Duẩn, Thanh Khê, Đà Nẵng", lat: 16.0710, lng: 108.1300, routes: ["r1"], hasShelter: true },
  // Trường ĐH Bách Khoa (Hòa Khánh, Liên Chiểu — west side)
  { id: "s3", name: "ĐH Bách Khoa (Hòa Khánh)", code: "DUT-HK", address: "54 Nguyễn Lương Bằng, Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng", lat: 16.0744, lng: 108.1432, routes: ["r2", "r3"], hasShelter: true },
  // Trường ĐH Sư phạm (Tôn Đức Thắng — near Bách Khoa but distinct)
  { id: "s4", name: "ĐH Sư phạm (Tôn Đức Thắng)", code: "UED-TDT", address: "459 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng", lat: 16.0780, lng: 108.1250, routes: ["r3"], hasShelter: false },
  // Trường VKU (Ngũ Hành Sơn — far south-east)
  { id: "s5", name: "ĐH Việt-Hàn (Trần Đại Nghĩa)", code: "VKU-TDN", address: "470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng", lat: 16.0421, lng: 108.2211, routes: ["r4"], hasShelter: true },
  // KTX sinh viên (Liên Chiểu, distinct from BK)
  { id: "s6", name: "KTX khu vực Liên Chiểu", code: "KTX-LC", address: "Đ. Nam Kỳ Khởi Nghĩa, Hòa Khánh, Liên Chiểu, Đà Nẵng", lat: 16.0810, lng: 108.1150, routes: ["r2", "r3"], hasShelter: true },
  // Bến xe Trung tâm Đà Nẵng (distinct location)
  { id: "s7", name: "Bến xe Trung tâm Đà Nẵng", code: "BX-TC", address: "Đ. Tôn Đức Thắng, Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng", lat: 16.0850, lng: 108.1050, routes: ["r1", "r2", "r3"], hasShelter: true },
  // Bến xe Điện Nam - Điện Ngọc (far south-west, Quảng Nam border)
  { id: "s8", name: "Bến xe Điện Nam - Điện Ngọc", code: "BX-DN", address: "QL1A, Điện Bàn, Quảng Nam", lat: 15.8961, lng: 108.2394, routes: ["r4"], hasShelter: true },
  // Vincom Bạch Đằng (Hải Châu — river side, distinct)
  { id: "s9", name: "Vincom (Bạch Đằng)", code: "VCM-BĐ", address: "74 Bạch Đằng, Hải Châu, Đà Nẵng", lat: 16.0686, lng: 108.1280, routes: ["r1"], hasShelter: false },
  // Lotte Mart Hùng Vương (Hòa Cường — south Hai Châu, distinct)
  { id: "s10", name: "Lotte Mart (Hùng Vương)", code: "LOT-HV", address: "6 Hùng Vương, Hòa Cường, Hải Châu, Đà Nẵng", lat: 16.0450, lng: 108.1180, routes: ["r1"], hasShelter: false },
  // Sân bay Quốc tế Đà Nẵng (Thanh Khê — distinct from DTU)
  { id: "s11", name: "Sân bay Quốc tế Đà Nẵng", code: "DAD", address: "Đ. Nguyễn Văn Linh, Thanh Khê, Đà Nẵng", lat: 16.0441, lng: 108.1990, routes: ["r1", "r4"], hasShelter: true },
  // Bãi biển Mỹ Khê (Sơn Trà — far east)
  { id: "s12", name: "Bãi biển Mỹ Khê", code: "BB-MK", address: "Đ. Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng", lat: 16.0528, lng: 108.2500, routes: ["r4"], hasShelter: false },
];

// ---------- ROUTES — Đà Nẵng ----------
export const routes: Route[] = [
  {
    id: "r1",
    code: "DN-01",
    name: "Tuyến xanh Duy Tân — Trung tâm",
    from: "ĐH Duy Tân (NVL)",
    to: "Lotte Mart (Hùng Vương)",
    stops: ["s1", "s2", "s9", "s10", "s11"],
    distanceKm: 8.2,
    durationMin: 32,
    frequencyMin: 15,
    fare: 5000,
    monthlyPass: 180000,
    color: "#beff50",
    active: true,
    firstTrip: "05:30",
    lastTrip: "20:30",
  },
  {
    id: "r2",
    code: "DN-02",
    name: "Tuyến cam Duy Tân — Bách Khoa",
    from: "ĐH Duy Tân (NVL)",
    to: "ĐH Bách Khoa (Hòa Khánh)",
    stops: ["s1", "s2", "s9", "s7", "s6", "s3"],
    distanceKm: 11.4,
    durationMin: 38,
    frequencyMin: 20,
    fare: 6000,
    monthlyPass: 210000,
    color: "#f59e0b",
    active: true,
    firstTrip: "05:15",
    lastTrip: "20:15",
  },
  {
    id: "r3",
    code: "DN-03",
    name: "Tuyến teal Bách Khoa — Sư phạm",
    from: "ĐH Bách Khoa (Hòa Khánh)",
    to: "ĐH Sư phạm (Tôn Đức Thắng)",
    stops: ["s3", "s6", "s7", "s4"],
    distanceKm: 4.8,
    durationMin: 18,
    frequencyMin: 12,
    fare: 4000,
    monthlyPass: 150000,
    color: "#14b8a6",
    active: true,
    firstTrip: "06:00",
    lastTrip: "21:00",
  },
  {
    id: "r4",
    code: "DN-04",
    name: "Tuyến hồng Việt-Hàn — Mỹ Khê",
    from: "ĐH Việt-Hàn (Trần Đại Nghĩa)",
    to: "Bãi biển Mỹ Khê",
    stops: ["s5", "s11", "s12"],
    distanceKm: 9.6,
    durationMin: 28,
    frequencyMin: 25,
    fare: 7000,
    monthlyPass: 240000,
    color: "#ec4899",
    active: true,
    firstTrip: "05:45",
    lastTrip: "20:00",
  },
];

// ---------- BUSES — Đà Nẵng (biển số 43B-) ----------
export const buses: Bus[] = [
  { id: "b1", plate: "43B-12345", model: "Hyundai County 29 chỗ", capacity: 29, driverId: "u2", assistantId: "u3", routeId: "r1", status: "active", lat: 16.0700, lng: 108.1290, speed: 32, occupancy: 18, currentStopIndex: 1, nextStopId: "s9", etaMin: 6 },
  { id: "b2", plate: "43B-22345", model: "Thaco Town 30 chỗ", capacity: 30, driverId: "u6", assistantId: "u7", routeId: "r2", status: "active", lat: 16.0718, lng: 108.1402, speed: 28, occupancy: 22, currentStopIndex: 0, nextStopId: "s6", etaMin: 12 },
  { id: "b3", plate: "43B-32345", model: "Hyundai County 29 chỗ", capacity: 29, driverId: "u8", routeId: "r3", status: "active", lat: 16.0761, lng: 108.1402, speed: 0, occupancy: 9, currentStopIndex: 0, nextStopId: "s4", etaMin: 4 },
  { id: "b4", plate: "43B-42345", model: "Thaco Town 30 chỗ", capacity: 30, routeId: "r1", status: "idle", lat: 16.0744, lng: 108.1522, speed: 0, occupancy: 0, etaMin: 0 },
  { id: "b5", plate: "43B-52345", model: "Hyundai Aero 45 chỗ", capacity: 45, status: "maintenance", lat: 16.0744, lng: 108.1432, speed: 0, occupancy: 0, etaMin: 0 },
  { id: "b6", plate: "43B-62345", model: "Thaco Town 30 chỗ", capacity: 30, driverId: "u9", routeId: "r4", status: "active", lat: 16.0441, lng: 108.1378, speed: 35, occupancy: 14, currentStopIndex: 1, nextStopId: "s12", etaMin: 9 },
];

// ---------- TRIPS ----------
const today = new Date().toISOString().slice(0, 10);
export const trips: Trip[] = [
  { id: "t1", routeId: "r1", busId: "b1", driverId: "u2", assistantId: "u3", date: today, departTime: "06:30", arriveTime: "06:58", status: "completed", passengerCount: 24, revenue: 120000 },
  { id: "t2", routeId: "r1", busId: "b1", driverId: "u2", assistantId: "u3", date: today, departTime: "07:15", arriveTime: "07:43", status: "running", passengerCount: 18, revenue: 90000 },
  { id: "t3", routeId: "r1", busId: "b4", driverId: "u2", date: today, departTime: "12:00", arriveTime: "12:28", status: "scheduled", passengerCount: 0, revenue: 0 },
  { id: "t4", routeId: "r2", busId: "b2", driverId: "u6", assistantId: "u7", date: today, departTime: "06:00", arriveTime: "06:45", status: "completed", passengerCount: 28, revenue: 196000 },
  { id: "t5", routeId: "r3", busId: "b3", driverId: "u8", date: today, departTime: "07:30", arriveTime: "08:08", status: "running", passengerCount: 12, revenue: 72000 },
  { id: "t6", routeId: "r2", busId: "b2", driverId: "u6", date: today, departTime: "16:00", arriveTime: "16:45", status: "scheduled", passengerCount: 0, revenue: 0 },
];

// ---------- BOOKINGS ----------
export const bookings: Booking[] = [
  { id: "bk1", studentId: "u1", routeId: "r1", date: today, status: "active", type: "monthly", fare: 180000, createdAt: "2025-05-01" },
  { id: "bk2", studentId: "u1", routeId: "r3", date: "2025-06-10", status: "completed", type: "single", fare: 6000, createdAt: "2025-06-10" },
  { id: "bk3", studentId: "u1", routeId: "r1", date: "2025-06-12", status: "completed", type: "single", fare: 5000, createdAt: "2025-06-12" },
];

// ---------- INVOICES ----------
export const invoices: Invoice[] = [
  { id: "i1", code: "INV-2025-0612", studentId: "u1", description: "Vé tháng tuyến DN-01 (06/2025)", amount: 180000, method: "momo", status: "paid", date: "2025-06-01" },
  { id: "i2", code: "INV-2025-0610", studentId: "u1", description: "Vé lượt tuyến DN-03", amount: 6000, method: "vnpay", status: "paid", date: "2025-06-10" },
  { id: "i3", code: "INV-2025-0612", studentId: "u1", description: "Vé lượt tuyến DN-01", amount: 5000, method: "momo", status: "paid", date: "2025-06-12" },
  { id: "i4", code: "INV-2025-0701", studentId: "u1", description: "Vé tháng tuyến DN-01 (07/2025)", amount: 180000, method: "momo", status: "pending", date: today },
];

// ---------- NOTIFICATIONS ----------
export const notifications: Notification[] = [
  { id: "n1", title: "Xe DN-01 sắp đến trạm", body: "Bus 43B-12345 cách trạm ĐH Duy Tân khoảng 6 phút.", type: "info", read: false, createdAt: "2 phút trước", icon: "bus" },
  { id: "n2", title: "Thanh toán thành công", body: "Vé tháng tuyến DN-01 (06/2025) đã được kích hoạt.", type: "success", read: false, createdAt: "1 giờ trước", icon: "check" },
  { id: "n3", title: "Tuyến DN-04 tạm dừng", body: "Tuyến DN-04 đang bảo trì, dự kiến hoạt động lại 01/07.", type: "warning", read: true, createdAt: "Hôm qua", icon: "alert" },
  { id: "n4", title: "Phản hồi đã được ghi nhận", body: "Cảm ơn bạn đã đánh giá chuyến đi ngày 10/06.", type: "success", read: true, createdAt: "2 ngày trước", icon: "star" },
  { id: "n5", title: "Khuyến mãi vé tháng 7", body: "Giảm 10% cho sinh viên đăng ký vé tháng trước 25/06.", type: "info", read: true, createdAt: "3 ngày trước", icon: "gift" },
];

// ---------- FEEDBACK ----------
export const feedbackList: Feedback[] = [
  { id: "f1", studentName: "Nguyễn Minh Anh", routeCode: "DN-01", driverName: "Trần Hoàng Long", rating: 5, category: "driver", content: "Anh lái xe rất nhẹ nhàng, đến trạm đúng giờ.", status: "resolved", createdAt: "2025-06-12" },
  { id: "f2", studentName: "Lê Thanh Tùng", routeCode: "DN-02", driverName: "Đinh Văn Hùng", rating: 2, category: "punctuality", content: "Xe trễ 20 phút so với lịch trình.", status: "processing", createdAt: "2025-06-11" },
  { id: "f3", studentName: "Phạm Thị Lan", routeCode: "DN-03", rating: 4, category: "vehicle", content: "Xe sạch sẽ nhưng máy lạnh hơi yếu.", status: "new", createdAt: "2025-06-13" },
  { id: "f4", studentName: "Võ Minh Quân", routeCode: "DN-01", driverName: "Trần Hoàng Long", rating: 5, category: "service", content: "Phụ xe nhiệt tình hỗ trợ sinh viên.", status: "resolved", createdAt: "2025-06-09" },
  { id: "f5", studentName: "Hoàng Thị Mai", routeCode: "DN-02", rating: 3, category: "other", content: "Đề xuất tăng chuyến giờ cao điểm.", status: "new", createdAt: "2025-06-13" },
];

// ---------- LOST ITEMS ----------
export const lostItems: LostItem[] = [
  { id: "li1", studentName: "Nguyễn Minh Anh", routeCode: "DN-01", tripDate: "2025-06-12", item: "Balo đen", description: "Balo đen có logo Duy Tân, để quên ở ghế cuối.", status: "found", createdAt: "2025-06-12" },
  { id: "li2", studentName: "Trần Bảo", routeCode: "DN-03", tripDate: "2025-06-10", item: "Thẻ sinh viên", description: "Thẻ sinh viên SE20A01 tên Trần Bảo.", status: "returned", createdAt: "2025-06-10" },
  { id: "li3", studentName: "Lê Hoa", routeCode: "DN-02", tripDate: today, item: "Tai nghe trắng", description: "Tai nghe Bluetooth trắng, để quên ghế cạnh cửa sổ.", status: "reported", createdAt: today },
];

// ---------- COMPLAINTS ----------
export const complaints: Complaint[] = [
  { id: "c1", code: "CP-2025-0042", studentName: "Lê Thanh Tùng", subject: "Tài xế thái độ không tốt", category: "Hành vi tài xế", priority: "high", status: "processing", createdAt: "2025-06-11", description: "Tài xế tuyến DN-02 nói chuyện thiếu văn minh với sinh viên." },
  { id: "c2", code: "CP-2025-0041", studentName: "Phạm Thị Lan", subject: "Xe trễ giờ cố định", category: "Lịch trình", priority: "medium", status: "new", createdAt: "2025-06-13", description: "Chuyến 06:30 tuyến DN-03 trễ 15 phút." },
  { id: "c3", code: "CP-2025-0040", studentName: "Nguyễn Minh Anh", subject: "Máy lạnh yếu", category: "Cơ sở vật chất", priority: "low", status: "resolved", createdAt: "2025-06-09", description: "Xe 43B-12345 máy lạnh không mát." },
  { id: "c4", code: "CP-2025-0039", studentName: "Võ Minh Quân", subject: "Phụ xe không hỗ trợ", category: "Hành vi phụ xe", priority: "medium", status: "rejected", createdAt: "2025-06-08", description: "Phụ xe không quét mã vé đúng quy trình." },
];

// ---------- INCIDENTS ----------
export const incidents: Incident[] = [
  { id: "ic1", code: "INC-2025-0088", reporter: "Trần Hoàng Long", routeCode: "DN-01", type: "delay", severity: "low", description: "Kẹt xe tại ngã tư Lê Duẩn - Nguyễn Văn Linh, trễ 8 phút.", status: "closed", createdAt: "2025-06-12" },
  { id: "ic2", code: "INC-2025-0089", reporter: "Lê Thị Phương", routeCode: "DN-02", type: "behavior", severity: "medium", description: "Sinh viên tranh cãi với phụ xe về vé.", status: "investigating", createdAt: today },
  { id: "ic3", code: "INC-2025-0090", reporter: "Đinh Văn Hùng", routeCode: "DN-02", type: "breakdown", severity: "high", description: "Xe 43B-22345 hỏng máy lạnh giữa tuyến.", status: "open", createdAt: today },
];

// ---------- SCHEDULES (coordinator) ----------
export const schedules: ScheduleSlot[] = [
  { id: "sc1", driverId: "u2", driverName: "Trần Hoàng Long", busId: "b1", busPlate: "43B-12345", routeId: "r1", routeCode: "DN-01", shift: "morning", startTime: "06:00", endTime: "12:00", date: today },
  { id: "sc2", driverId: "u6", driverName: "Đinh Văn Hùng", busId: "b2", busPlate: "43B-22345", routeId: "r2", routeCode: "DN-02", shift: "morning", startTime: "05:30", endTime: "11:30", date: today },
  { id: "sc3", driverId: "u8", driverName: "Nguyễn Đức Mạnh", busId: "b3", busPlate: "43B-32345", routeId: "r3", routeCode: "DN-03", shift: "morning", startTime: "05:00", endTime: "11:00", date: today },
  { id: "sc4", driverId: "u2", driverName: "Trần Hoàng Long", busId: "b4", busPlate: "43B-42345", routeId: "r1", routeCode: "DN-01", shift: "afternoon", startTime: "12:00", endTime: "18:00", date: today },
  { id: "sc5", driverId: "u9", driverName: "Lâm Quốc Việt", busId: "b6", busPlate: "43B-62345", routeId: "r4", routeCode: "DN-04", shift: "afternoon", startTime: "13:00", endTime: "19:00", date: today },
];

// Extra staff for coordinator scheduling
export const allDrivers = [
  { id: "u2", name: "Trần Hoàng Long", plate: "43B-12345", status: "on-duty", tripsToday: 4, phone: "0987 654 321" },
  { id: "u6", name: "Đinh Văn Hùng", plate: "43B-22345", status: "on-duty", tripsToday: 3, phone: "0977 111 222" },
  { id: "u8", name: "Nguyễn Đức Mạnh", plate: "43B-32345", status: "on-duty", tripsToday: 2, phone: "0966 333 444" },
  { id: "u9", name: "Lâm Quốc Việt", plate: "43B-62345", status: "break", tripsToday: 2, phone: "0955 555 666" },
  { id: "u10", name: "Phan Thanh Hải", plate: "—", status: "off", tripsToday: 0, phone: "0944 777 888" },
];

export const allBuses = [
  { id: "b1", plate: "43B-12345", model: "Hyundai County 29 chỗ", route: "DN-01", status: "running", occupancy: "18/29", driver: "Trần Hoàng Long" },
  { id: "b2", plate: "43B-22345", model: "Thaco Town 30 chỗ", route: "DN-02", status: "running", occupancy: "22/30", driver: "Đinh Văn Hùng" },
  { id: "b3", plate: "43B-32345", model: "Hyundai County 29 chỗ", route: "DN-03", status: "running", occupancy: "9/29", driver: "Nguyễn Đức Mạnh" },
  { id: "b4", plate: "43B-42345", model: "Thaco Town 30 chỗ", route: "DN-01", status: "idle", occupancy: "0/30", driver: "—" },
  { id: "b5", plate: "43B-52345", model: "Hyundai Aero 45 chỗ", route: "—", status: "maintenance", occupancy: "0/45", driver: "—" },
  { id: "b6", plate: "43B-62345", model: "Thaco Town 30 chỗ", route: "DN-04", status: "running", occupancy: "14/30", driver: "Lâm Quốc Việt" },
];

// ---------- ALL USERS (for admin management) ----------
export const allUsers = [
  { id: "u1", name: "Nguyễn Minh Anh", email: "minhanh@duytan.edu.vn", role: "Sinh viên", status: "active", createdAt: "15/08/2024", trips: 48 },
  { id: "u2", name: "Trần Hoàng Long", email: "longth@busgo.dn.edu.vn", role: "Tài xế", status: "active", createdAt: "10/06/2023", trips: 320 },
  { id: "u3", name: "Lê Thị Phương", email: "phuonglt@busgo.dn.edu.vn", role: "Phụ xe", status: "active", createdAt: "20/01/2024", trips: 210 },
  { id: "u4", name: "Phạm Quốc Bảo", email: "baopq@busgo.dn.edu.vn", role: "Điều phối", status: "active", createdAt: "01/09/2022", trips: 0 },
  { id: "u5", name: "Võ Thu Hà", email: "havt@busgo.dn.edu.vn", role: "Quản trị", status: "active", createdAt: "15/01/2022", trips: 0 },
  { id: "u6", name: "Đinh Văn Hùng", email: "hungdv@busgo.dn.edu.vn", role: "Tài xế", status: "active", createdAt: "12/03/2023", trips: 295 },
  { id: "u7", name: "Trần Bảo", email: "baot@duytan.edu.vn", role: "Sinh viên", status: "locked", createdAt: "05/09/2024", trips: 12 },
  { id: "u8", name: "Nguyễn Đức Mạnh", email: "manhnd@busgo.dn.edu.vn", role: "Tài xế", status: "active", createdAt: "22/07/2023", trips: 188 },
  { id: "u9", name: "Lâm Quốc Việt", email: "vietlq@busgo.dn.edu.vn", role: "Tài xế", status: "active", createdAt: "18/11/2023", trips: 142 },
  { id: "u10", name: "Phan Thanh Hải", email: "haipt@busgo.dn.edu.vn", role: "Tài xế", status: "active", createdAt: "03/02/2024", trips: 67 },
  { id: "u11", name: "Hoàng Thị Mai", email: "maiht@duytan.edu.vn", role: "Sinh viên", status: "active", createdAt: "20/08/2024", trips: 33 },
  { id: "u12", name: "Lê Thị Phương Nhi", email: "nihiltp@busgo.dn.edu.vn", role: "Phụ xe", status: "active", createdAt: "14/02/2024", trips: 98 },
];

// ---------- CHATBOT seed ----------
export const chatbotSeed: { role: "user" | "bot"; text: string; time: string }[] = [
  { role: "bot", text: "Xin chào! Mình là BusGO Bot. Mình có thể giúp bạn tìm tuyến xe, xem giá vé và giờ chạy. Bạn cần hỗ trợ gì?", time: "09:00" },
];

// ---------- AI suggestions ----------
export const aiSuggestions = [
  {
    id: "ai1",
    routeCode: "DN-01",
    routeName: "Tuyến xanh KTX — FPT",
    reason: "Phù hợp với lịch học 7h30 sáng tại Duy Tân, chỉ 32 phút di chuyển.",
    confidence: 92,
    departTime: "06:55",
    eta: "07:23",
    fare: 5000,
    stops: 2,
    matchScore: 5,
  },
  {
    id: "ai2",
    routeCode: "DN-02",
    routeName: "Tuyến cam An Sương — FPT",
    reason: "Cách bạn 5 phút đi bộ, nhưng di chuyển lâu hơn (38 phút).",
    confidence: 71,
    departTime: "06:30",
    eta: "07:15",
    fare: 7000,
    stops: 1,
    matchScore: 4,
  },
  {
    id: "ai3",
    routeCode: "DN-03",
    routeName: "Tuyến teal Sân bay — Thủ Đức",
    reason: "Lựa chọn thay thế nếu KTX Liên Chiểu đầy chỗ.",
    confidence: 58,
    departTime: "06:45",
    eta: "07:35",
    fare: 6000,
    stops: 3,
    matchScore: 3,
  },
];

// ---------- Helper ----------
export const formatVND = (n: number) =>
  n.toLocaleString("vi-VN") + " đ";

export const routeById = (id: string) => routes.find((r) => r.id === id);
export const stopById = (id: string) => busStops.find((s) => s.id === id);
export const busById = (id: string) => buses.find((b) => b.id === id);
export const userById = (id: string) => users.find((u) => u.id === id);

// ============ UNIVERSITY LINKAGE (MVP feature) ============
export const universities: University[] = [
  {
    id: "uni1",
    code: "DTU",
    name: "Trường Đại học Duy Tân",
    shortName: "Duy Tân",
    contactEmail: "studentaffairs@duytan.edu.vn",
    phone: "0236 3650 529",
    address: "254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng",
    status: "active",
    logo: "DT",
    logoUrl: "https://sfile.chatglm.cn/images-ppt/3ec210761a9d.jpg",
    color: "#1a73e8",
    campuses: [
      { id: "c1", universityId: "uni1", code: "DTU-M", name: "Cơ sở chính Nguyễn Văn Linh", address: "254 Nguyễn Văn Linh, Thanh Khê", lat: 16.0744, lng: 108.1522, status: "active" },
      { id: "c2", universityId: "uni1", code: "DTU-7", name: "Cơ sở 254 Lê Duẩn", address: "254 Lê Duẩn, Thanh Khê", lat: 16.0689, lng: 108.1345, status: "active" },
    ],
    domains: ["duytan.edu.vn", "st.duytan.edu.vn"],
    studentCount: 1248,
    routeCount: 3,
    subsidyActive: true,
  },
  {
    id: "uni2",
    code: "DUT",
    name: "Trường Đại học Bách Khoa Đà Nẵng",
    shortName: "Bách Khoa",
    contactEmail: "daotao@dut.udn.vn",
    phone: "0236 3732 122",
    address: "54 Nguyễn Lương Bằng, Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng",
    status: "active",
    logo: "BK",
    logoUrl: "https://sfile.chatglm.cn/images-ppt/abaad94fd60c.jpg",
    color: "#0f9d58",
    campuses: [
      { id: "c3", universityId: "uni2", code: "DUT-M", name: "Cơ sở Hòa Khánh", address: "54 Nguyễn Lương Bằng, Liên Chiểu", lat: 16.0744, lng: 108.1432, status: "active" },
    ],
    domains: ["dut.udn.vn"],
    studentCount: 856,
    routeCount: 2,
    subsidyActive: true,
  },
  {
    id: "uni3",
    code: "UED",
    name: "Trường Đại học Sư phạm Đà Nẵng",
    shortName: "Sư phạm",
    contactEmail: "phongctsv@ued.udn.vn",
    phone: "0236 3731 222",
    address: "459 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng",
    status: "active",
    logo: "SP",
    logoUrl: "https://sfile.chatglm.cn/images-ppt/06ecd3743811.jpg",
    color: "#db4437",
    campuses: [
      { id: "c4", universityId: "uni3", code: "UED-M", name: "Cơ sở Tôn Đức Thắng", address: "459 Tôn Đức Thắng, Liên Chiểu", lat: 16.0712, lng: 108.1389, status: "active" },
    ],
    domains: ["ued.udn.vn"],
    studentCount: 432,
    routeCount: 1,
    subsidyActive: false,
  },
  {
    id: "uni4",
    code: "VKU",
    name: "Trường Đại học Công nghệ thông tin và Truyền thông Việt - Hàn",
    shortName: "Việt-Hàn",
    contactEmail: "tchcs@vku.udn.vn",
    phone: "0236 3731 999",
    address: "470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng",
    status: "inactive",
    logo: "VH",
    logoUrl: "https://sfile.chatglm.cn/images-ppt/4e191960793a.png",
    color: "#9c27b0",
    campuses: [
      { id: "c5", universityId: "uni4", code: "VKU-M", name: "Cơ sở Trần Đại Nghĩa", address: "470 Trần Đại Nghĩa, Ngũ Hành Sơn", lat: 16.0421, lng: 108.2211, status: "active" },
    ],
    domains: ["vku.udn.vn"],
    studentCount: 0,
    routeCount: 0,
    subsidyActive: false,
  },
];

export const universityById = (id: string) => universities.find((u) => u.id === id);

export const universityDomains: UniversityDomain[] = [
  { id: "d1", universityId: "uni1", domain: "duytan.edu.vn", status: "active", addedAt: "2024-01-15" },
  { id: "d2", universityId: "uni1", domain: "st.duytan.edu.vn", status: "active", addedAt: "2024-01-15" },
  { id: "d3", universityId: "uni2", domain: "dut.udn.vn", status: "active", addedAt: "2024-02-10" },
  { id: "d4", universityId: "uni3", domain: "ued.udn.vn", status: "active", addedAt: "2024-03-01" },
  { id: "d5", universityId: "uni4", domain: "vku.udn.vn", status: "locked", addedAt: "2024-04-20" },
];

export const studentRoster: StudentRosterEntry[] = [
  { id: "r1", universityId: "uni1", studentCode: "SE20A01", fullName: "Nguyễn Minh Anh", email: "minhanh@duytan.edu.vn", status: "ACTIVE", importedAt: "2024-08-15" },
  { id: "r2", universityId: "uni1", studentCode: "SE20A02", fullName: "Trần Bảo", email: "baot@duytan.edu.vn", status: "SUSPENDED", importedAt: "2024-08-15" },
  { id: "r3", universityId: "uni1", studentCode: "IT21B05", fullName: "Lê Thị Lan", email: "lantl@duytan.edu.vn", status: "ACTIVE", importedAt: "2024-08-15" },
  { id: "r4", universityId: "uni1", studentCode: "BA19C12", fullName: "Phạm Hoàng Long", email: "longph@duytan.edu.vn", status: "GRADUATED", importedAt: "2024-08-15" },
  { id: "r5", universityId: "uni1", studentCode: "SE22A03", fullName: "Võ Thị Mai", email: "maivt@duytan.edu.vn", status: "ACTIVE", importedAt: "2024-08-15" },
  { id: "r6", universityId: "uni1", studentCode: "IT20A11", fullName: "Đặng Quang Huy", email: "huydq@duytan.edu.vn", status: "INACTIVE", importedAt: "2024-08-15" },
  { id: "r7", universityId: "uni1", studentCode: "SE21B07", fullName: "Bùi Thanh Nhã", email: "nhabt@duytan.edu.vn", status: "ACTIVE", importedAt: "2024-08-15" },
];

export const importBatches: ImportBatch[] = [
  { id: "ib1", universityId: "uni1", fileName: "ds_sinhvien_hk1_2526.csv", totalRows: 1248, successRows: 1245, errorRows: 3, status: "completed", importedAt: "2025-08-15 09:32" },
  { id: "ib2", universityId: "uni1", fileName: "capnhat_sinhvien_10.csv", totalRows: 86, successRows: 86, errorRows: 0, status: "completed", importedAt: "2025-09-02 14:18" },
  { id: "ib3", universityId: "uni2", fileName: "danh_sach_moi.xlsx", totalRows: 856, successRows: 850, errorRows: 6, status: "completed", importedAt: "2025-08-20 10:05" },
  { id: "ib4", universityId: "uni1", fileName: "ds_hk2_2526.csv", totalRows: 1310, successRows: 0, errorRows: 0, status: "processing", importedAt: "2025-12-01 08:00" },
];

export const subsidyPolicies: SubsidyPolicy[] = [
  { id: "sp1", universityId: "uni1", name: "Trợ giá vé tháng Duy Tân 30%", type: "percent", value: 30, maxAmount: 72000, activeFrom: "2025-01-01", activeUntil: "2025-12-31", status: "active" },
  { id: "sp2", universityId: "uni1", name: "Trợ giá kỳ tuyển sinh 2025", type: "fixed", value: 50000, maxAmount: 50000, activeFrom: "2025-08-01", activeUntil: "2025-10-31", status: "expired" },
  { id: "sp3", universityId: "uni2", name: "Trợ giá Bách Khoa 25%", type: "percent", value: 25, maxAmount: 60000, activeFrom: "2025-01-01", activeUntil: "2025-12-31", status: "active" },
  { id: "sp4", universityId: "uni3", name: "Trợ giá Sư phạm (bản nháp)", type: "percent", value: 20, activeFrom: "2026-01-01", activeUntil: "2026-12-31", status: "draft" },
];

export const routeUniversities: RouteUniversity[] = [
  { routeId: "r1", universityId: "uni1", campusId: "c1", activeFrom: "2024-09-01", status: "active" },
  { routeId: "r2", universityId: "uni1", campusId: "c2", activeFrom: "2024-09-01", status: "active" },
  { routeId: "r2", universityId: "uni2", campusId: "c3", activeFrom: "2024-09-15", status: "active" },
  { routeId: "r3", universityId: "uni2", campusId: "c3", activeFrom: "2024-10-01", status: "active" },
  { routeId: "r3", universityId: "uni1", campusId: "c1", activeFrom: "2024-10-01", status: "active" },
];

export const auditLogs: AuditLogEntry[] = [
  { id: "al1", actor: "Đặng Thị Bích Ngọc", actorRole: "university_admin", action: "Import danh sách sinh viên", target: "ds_sinhvien_hk1_2526.csv (1248 dòng)", university: "Duy Tân", result: "success", timestamp: "2025-08-15 09:32", ip: "203.113.142.21" },
  { id: "al2", actor: "Võ Thu Hà", actorRole: "admin", action: "Thêm domain email", target: "st.duytan.edu.vn", university: "Duy Tân", result: "success", timestamp: "2025-08-12 11:08", ip: "203.113.142.5" },
  { id: "al3", actor: "Đặng Thị Bích Ngọc", actorRole: "university_admin", action: "Cập nhật chính sách trợ giá", target: "Trợ giá 30% → 35%", university: "Duy Tân", result: "success", timestamp: "2025-09-01 15:42", ip: "203.113.142.21" },
  { id: "al4", actor: "Phạm Quốc Bảo", actorRole: "coordinator", action: "Gán tuyến cho trường", target: "DN-03 → Duy Tân (cơ sở chính)", university: "Duy Tân", result: "success", timestamp: "2025-09-03 08:15", ip: "203.113.142.88" },
  { id: "al5", actor: "Võ Thu Hà", actorRole: "admin", action: "Khóa tài khoản University Admin", target: "vkuanmin@vku.udn.vn", university: "Việt-Hàn", result: "success", timestamp: "2025-09-10 10:22", ip: "203.113.142.5" },
  { id: "al6", actor: "System", actorRole: "admin", action: "Tự động xác định trường", target: "minhanh@duytan.edu.vn → Duy Tân", university: "Duy Tân", result: "success", timestamp: "2024-08-15 08:01", ip: "—" },
  { id: "al7", actor: "Đặng Thị Bích Ngọc", actorRole: "university_admin", action: "Khóa domain", target: "vku.udn.vn", university: "Việt-Hàn", result: "failure", timestamp: "2025-09-12 14:30", ip: "203.113.142.21" },
];

export const universityStats: UniversityStats[] = [
  { universityId: "uni1", activeStudents: 1186, monthlyPasses: 412, topRoute: "DN-01", totalSubsidy: 12864000, tripsThisMonth: 8420 },
  { universityId: "uni2", activeStudents: 812, monthlyPasses: 268, topRoute: "DN-02", totalSubsidy: 6432000, tripsThisMonth: 5210 },
  { universityId: "uni3", activeStudents: 398, monthlyPasses: 0, topRoute: "—", totalSubsidy: 0, tripsThisMonth: 980 },
];

// University admins list (for System Admin to manage)
export const universityAdmins = [
  { id: "u6u", name: "Đặng Thị Bích Ngọc", email: "ngocdtb@duytan.edu.vn", university: "Duy Tân", status: "active", createdAt: "01/02/2023", lastLogin: "2 giờ trước" },
  { id: "ua2", name: "Nguyễn Văn Hùng", email: "hungnv@dut.udn.vn", university: "Bách Khoa", status: "active", createdAt: "15/03/2023", lastLogin: "1 ngày trước" },
  { id: "ua3", name: "Trần Thị Hương", email: "huongtt@ued.udn.vn", university: "Sư phạm", status: "pending", createdAt: "10/09/2025", lastLogin: "—" },
  { id: "ua4", name: "Lê Minh Tuấn", email: "tuanlm@vku.udn.vn", university: "Việt-Hàn", status: "locked", createdAt: "20/04/2024", lastLogin: "3 tháng trước" },
];

// Subsidy calc helper
export function calcSubsidy(originalFare: number, universityId: string): {
  original: number;
  subsidy: number;
  final: number;
  policy?: SubsidyPolicy;
} {
  const policy = subsidyPolicies.find(
    (p) => p.universityId === universityId && p.status === "active"
  );
  if (!policy) return { original: originalFare, subsidy: 0, final: originalFare };
  let subsidy =
    policy.type === "percent"
      ? Math.round((originalFare * policy.value) / 100)
      : Math.min(policy.value, policy.maxAmount ?? policy.value);
  if (policy.maxAmount && subsidy > policy.maxAmount) subsidy = policy.maxAmount;
  return { original: originalFare, subsidy, final: originalFare - subsidy, policy };
}
