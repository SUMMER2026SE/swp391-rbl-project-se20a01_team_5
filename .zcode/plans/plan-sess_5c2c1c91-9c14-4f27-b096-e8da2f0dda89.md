## Đại tu UI "Lịch sử chuyến" — Timeline dọc

**File duy nhất cần sửa:** `frontend/src/components/bus/roles/student-module.tsx`
- `HistoryScreen` (dòng 4798–4879)
- `HistoryRow` (dòng 1179–1229)

Không đụng backend, không đụng API, không đụng các màn hình khác. Giữ nguyên tất cả dữ liệu nguồn (`ctx.tripsHistory`, `ctx.routes`, `ctx.activeTicket`) và 2 nút hành động (Đánh giá / Mất đồ, logic `localStorage` + `setView` giữ nguyên).

### Giữ nguyên
- `PageHeader` "Lịch sử chuyến đi".
- 3 tab: Chuyến đã đi / Phản hồi / Mất đồ (Tabs + `FeedbackScreen`/`LostItemsScreen`).
- 3 stat card mini (Tổng chuyến / Tháng này / Chi phí tháng).
- Nút "Đánh giá" + "Mất đồ" trên mỗi chuyến.

### Thay đổi chính

**1. Thêm thanh Tìm kiếm + Lọc** (mới, phía trên timeline)
- Ô input tìm kiếm (icon `Search`): lọc theo tên tuyến / mã tuyến (`routeCode`) / trạm lên-xuống, dùng `displayStopLabel`, không phân biệt dấu.
- Dropdown/segment lọc tháng: "Tất cả" + danh sách tháng có dữ liệu (sinh động từ `tripsHistory`).
- Khi `totalTrips === 0` thì không hiện thanh lọc (chỉ hiện `EmptyState`).
- Dùng lại style input của app (rounded-2xl, bg-surface-container-low).

**2. Thay list phẳng → Timeline dọc gom theo ngày**
- Tách component mới `HistoryTimeline` (thay cho map trực tiếp `ctx.tripsHistory`).
- Bước tiền xử lý trong `HistoryScreen`:
  1. Lọc theo từ khóa + tháng đang chọn.
  2. Gom theo ngày (dùng `boardedAt || serviceDate`). Key ngày hiển thị: "Hôm nay" / "Hôm qua" / `formatDate(...)`.
  3. Sắp xếp ngày giảm dần (mới nhất trên cùng).
- Render: trục dọc (border trái `border-outline-variant`), mỗi ngày = 1 group có header ngày (chấm tròn đậm `bg-[#14140f]` + label). Mỗi chuyến trong group = 1 node + card.

**3. Redesign `HistoryRow` → `HistoryTimelineCard`**
- Card bo `rounded-2xl` `elev-1`, `bg-surface-container-low`, padding thoáng hơn, `whileHover` nhẹ.
- Hàng trên: badge mã tuyến (ô màu `route.color`, giữ pattern `route.code.slice(0,2)`), tên tuyến (font bold, truncate), icon `CheckCircle2` trạng thái "Hoàn tất" (text-success) góc phải.
- Hàng giữa: lộ trình lên → xuống với 2 dot dọc nhỏ (boarding `bg-[#beff50]`, alighting `bg-[#ff8c5f]`) + 2 dòng trạm. Dùng `displayStopLabel` cho cả 2 trạm.
- Hàng thời gian: `boardedAt` → `alightedAt` (format `formatDateTime`/giờ), icon `Clock`. Nếu chỉ có `boardedAt` thì hiện 1 mốc.
- Hàng action: 2 nút "Đánh giá" (lime `#BDFD4F`) + "Mất đồ" (outline) như cũ, canh phải.

### Xử lý rủi ro
- Nếu lọc ra 0 kết quả → hiện `EmptyState` phụ "Không tìm thấy chuyến" (không trộn với empty khi chưa có chuyến nào).
- Bảo toàn `key` (dùng `travelHistoryId`/`tripId`/`id`) để Stagger không nhảy.
- Giữ type `history: any` hiện tại, không đổi signature dữ liệu.
- Dùng các primitive/utility đã có: `StaggerGroup`/`StaggerItem`/`PageTransition` (`m3/motion`), `formatDate`/`formatDateTime`/`formatVND` (`prototype-data`), `displayStopLabel`, icon lucide (`History`, `Search`, `Star`, `PackageSearch`, `CheckCircle2`, `Clock`, `MapPin`).

### Kiểm tra sau khi làm
- `npm run lint` + `npm run build` chạy qua ở `student-module`.
- Mở vai trò sinh viên → "Lịch sử chuyến": timeline gom theo ngày, ô tìm + lọc tháng hoạt động, 2 nút hành động vẫn chuyển tab đúng.