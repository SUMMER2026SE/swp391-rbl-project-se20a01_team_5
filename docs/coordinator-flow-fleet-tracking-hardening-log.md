# Coordinator Flow & Fleet Tracking Hardening Log

Ngày ghi nhận: 2026-07-10
Nhánh làm việc: `DucHai`
Phạm vi: Coordinator, Conductor, student route tracking, demo fleet
Không thay đổi database schema, không thêm Flyway migration, không thao tác live RDS trong đợt này.

## 1. Mục tiêu nghiệp vụ đã thống nhất

- Phụ xe chỉ được quét vé sau khi tài xế thực sự bắt đầu chuyến, tức trip có trạng thái `RUNNING`.
- Coordinator theo dõi toàn bộ xe đang chạy, không chỉ một tuyến hoặc một xe.
- Student và Coordinator phải nhìn cùng một tập xe và cùng vị trí.
- Giữ nguyên giao diện bản đồ hiện có: `JourneyMap`, bus icon, marker, màu tuyến, tracker và animation.
- Không dùng xe giả do frontend tự sinh và không dùng ID kiểu `MOCK-*`.
- Demo fleet chạy bằng backend simulator, chỉ áp dụng cho trip có marker demo.

## 2. Trạng thái trước khi sửa

### 2.1. Quét vé chưa bám đúng trạng thái vận hành

- Backend còn cho phép scan dựa nhiều vào khung giờ lịch chạy.
- Trip chưa được tài xế bắt đầu vẫn có thể lọt vào luồng quét trong một số trường hợp.
- Frontend phụ xe tự tính cửa sổ quét từ 30 phút trước đến 3 giờ sau giờ xuất phát.
- Vì frontend hiển thị nhiều trip theo cửa sổ thời gian, dropdown tạo cảm giác phụ xe được tự chọn tuyến để quét.
- UI và backend có thể hiểu khác nhau về trip nào đang mở quét.

### 2.2. Có thể tạo duplicate trip

- `ensureTrip()` kiểm tra tồn tại rồi insert nhưng không khóa schedule.
- Hai request đồng thời có thể cùng vượt qua `NOT EXISTS` và tạo hai trip cho cùng schedule/ngày.
- Duplicate trip khiến một phụ xe có thể thấy nhiều chuyến giống nhau và gây khó hiểu trong lịch sử/quét vé.

### 2.3. Student và Coordinator dùng hai nguồn xe khác nhau

- Coordinator frontend có `mockLiveFleet()` và tự tạo xe có biển số `MOCK-*` khi API không trả dữ liệu.
- Coordinator map còn tự tính chuyển động trên polyline ở frontend.
- `JourneyTrackingService.routeSnapshot()` của student chỉ lấy tối đa một xe thật rồi tự thêm hai simulated companions.
- Khi không có xe thật, backend student tự tạo ba xe `route-sim-*`.
- Kết quả: student có thể thấy ba xe trên tuyến nhưng Coordinator lại thấy tập xe khác hoặc vị trí khác.

### 2.4. Backend simulator chưa đủ realtime qua REST

- Simulator ban đầu publish WebSocket mỗi 5 giây nhưng chỉ persist `vehicle_locations` mỗi phút.
- Frontend hiện không có STOMP client; student/coordinator chủ yếu polling REST.
- Vì vậy vị trí REST chỉ thay đổi khoảng một lần mỗi phút dù simulator chạy 5 giây.

### 2.5. Demo fleet chưa có data rõ ràng

- Script chỉ có số lượng trip/xe hạn chế cho các tài khoản demo chính.
- Không đủ data để Coordinator demo theo dõi nhiều xe trên nhiều tuyến.
- Không có một nguồn fleet demo thống nhất để student và Coordinator cùng sử dụng.

## 3. Thay đổi đã thực hiện

### 3.1. Backend khóa scan theo `RUNNING`

File:

- `backend/src/main/java/com/unibus/api/operations/OperationsService.java`
- `backend/src/test/java/com/unibus/api/operations/OperationsServiceTests.java`

Thay đổi:

- Khi trip là `NOT_STARTED`, scan trả lỗi rõ ràng: `Tài xế chưa bắt đầu chuyến.`
- Chỉ trip thực sự `RUNNING` mới đi tiếp vào validation vé.
- Giữ các kiểm tra trip `COMPLETED`, `CANCELLED` và các rule hợp lệ của vé hiện có.
- Không thay đổi logic vé tháng/vé lượt ngoài điều kiện trạng thái chuyến.

Kết quả sau sửa:

- Lịch phân công không đồng nghĩa với quyền quét.
- Driver phải nhấn bắt đầu chuyến trước.
- Conductor không còn quét chỉ vì đang nằm trong giờ dự kiến.

### 3.2. Ngăn duplicate trip bằng row lock

File:

- `backend/src/main/java/com/unibus/api/operations/OperationsRepository.java`
- `backend/src/test/java/com/unibus/api/operations/OperationsRepositoryTests.java`

Thay đổi:

- `ensureTrip()` khóa schedule bằng:

```sql
SELECT schedule_id
FROM bus_schedules
WHERE schedule_id = ?
FOR UPDATE
```

- Sau khi lấy lock mới chạy insert có `NOT EXISTS(schedule_id, service_date)`.
- Thêm test gọi `ensureTrip()` hai lần và xác nhận chỉ tồn tại một trip.

Kết quả sau sửa:

- Các request đồng thời cho cùng schedule được tuần tự hóa.
- Không tạo thêm duplicate trip mới từ flow `ensureTrip()`.
- Dữ liệu duplicate đã có từ trước không tự động bị xóa; cần audit riêng nếu muốn dọn.

### 3.3. Xóa simulated companions khỏi student route tracking

File:

- `backend/src/main/java/com/unibus/api/transport/JourneyTrackingService.java`
- `backend/src/test/java/com/unibus/api/transport/JourneyTrackingServiceTests.java`

Đã xóa khỏi lookup route tracking:

- `latestVehicle()` kiểu chỉ lấy một xe.
- `simulatedRouteVehicles()`.
- `withSimulatedCompanions()`.
- `simulatedRouteVehicle()` cho route lookup.
- Các helper chỉ phục vụ simulated route vehicles.

Cơ chế mới:

- Query tất cả trip của tuyến thỏa:
  - đúng `route_id`;
  - `service_date = CURRENT_DATE`;
  - `status = 'RUNNING'`;
  - có vị trí mới trong vòng 5 phút.
- Mỗi trip chỉ lấy bản ghi `vehicle_locations` mới nhất.
- ID frontend nhận được là `trip-{tripId}`.
- Nếu không có xe thật thì trả danh sách rỗng, không tự bịa thêm xe.
- `simulated` của route snapshot trả `false`.

Regression test:

- Tạo hai trip `RUNNING` và một trip `NOT_STARTED`.
- Kết quả phải đúng `trip-101`, `trip-102`.
- Trip chưa chạy không xuất hiện.
- Không có `route-sim-*`.

### 3.4. Thêm backend demo fleet simulator

File:

- `backend/src/main/java/com/unibus/api/operations/DemoFleetSimulator.java`
- `backend/src/test/java/com/unibus/api/operations/DemoFleetSimulatorTests.java`
- `backend/src/main/java/com/unibus/api/UnibusApiApplication.java`
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-local.properties`
- `backend/src/main/resources/application-prod.properties`

Cơ chế:

- Bật scheduling bằng `@EnableScheduling`.
- Simulator chỉ chọn trip:
  - ngày hiện tại;
  - trạng thái `RUNNING`;
  - notes bắt đầu bằng `DEMO_DATA` hoặc `DEMO_FLEET`.
- Load điểm tuyến từ `route_stops` và `stops`.
- Nội suy vị trí theo thời gian và `tripId` để các xe không chồng hoàn toàn lên nhau.
- Publish qua `RealtimePublisher` mỗi tick.
- Persist vị trí mỗi tick, mặc định 5 giây.

Giới hạn tài nguyên:

- Trước khi insert vị trí mới, simulator xóa vị trí cũ của chính trip demo đó.
- Mỗi demo trip chỉ giữ một vị trí hiện tại thay vì chèn thêm 12 dòng mỗi 5 giây vô hạn.
- Cleanup dữ liệu location cũ hơn 24 giờ vẫn chạy mỗi phút.

Cấu hình:

- Default profile: `DEMO_FLEET_ENABLED=false`.
- Local profile: mặc định `true`.
- Prod profile: mặc định `true`.
- Có thể tắt bằng environment variable `DEMO_FLEET_ENABLED=false`.

### 3.5. Coordinator chỉ dùng fleet thật từ backend

File:

- `frontend/src/components/bus/roles/coordinator-module.tsx`

Đã xóa:

- `mockLiveFleet()`.
- Biển số `MOCK-*`.
- Timer tự di chuyển xe phía frontend.
- Fallback tự lấy route rồi dựng bus giả.
- Wording `Mô phỏng trên tuyến`.

Cơ chế mới:

- Chỉ hiển thị response của `operationsApi.liveFleet()` có status `RUNNING`.
- Poll API mỗi 3 giây.
- Không có latitude/longitude thì hiển thị `Chưa có dữ liệu GPS` thay vì tự đặt xe lên tuyến.
- Có vị trí thì tìm stop gần nhất và hiển thị `Gần {tên trạm}`.
- Giữ nguyên map component, icon xe, marker, màu sắc và animation.

Kết quả sau sửa:

- Coordinator không còn nguồn xe giả riêng.
- Coordinator và student cùng đọc `trips + vehicle_locations`.
- Vị trí trên hai role có thể đồng bộ theo cùng trip ID.

### 3.6. Frontend phụ xe chỉ hiển thị trip `RUNNING`

File:

- `frontend/src/components/bus/roles/assistant-module.tsx`

Thay đổi:

- Bỏ helper frontend tự tính cửa sổ scan theo giờ.
- Trip hợp lệ để quét phải:
  - có `tripId`, `routeId`, `routeName`;
  - có status `RUNNING`.
- Nếu chỉ có một trip `RUNNING`, UI tự chọn và hiển thị như thông tin khóa.
- Nếu có nhiều trip `RUNNING`, dropdown hiển thị rõ:
  - tên tuyến;
  - biển số;
  - giờ chạy/ngày.
- Nếu không có trip đang chạy:
  - camera và nút quét bị disable;
  - hiển thị `Chưa có chuyến đang chạy`;
  - hướng dẫn `Tài xế cần bắt đầu chuyến trước khi phụ xe quét vé.`

Kết quả sau sửa:

- Dropdown không còn mang nghĩa chọn tuyến tùy ý.
- UI và backend cùng dùng một rule `RUNNING`.
- Trường hợp nhiều trip chỉ còn là xử lý dữ liệu bất thường/phân công đồng thời.

### 3.7. Bổ sung demo fleet vào script, chưa chạy live RDS

File:

- `database/SeedDemoDataUntilAugust.sql`
- `database/ResetDemoScenario.sql`
- `database/AuditDemoDataUntilAugust.sql`

Thay đổi:

- Thêm tài khoản kỹ thuật `fleet.simulator@unibus.local`:
  - role `DRIVER` để đáp ứng foreign key hiện có;
  - user status `INACTIVE`;
  - không phải tài khoản demo để người dùng đăng nhập;
  - tên hiển thị rõ mục đích: `Mô phỏng đội xe UniBus`.
- Thêm 12 bus có biển số `43B-82001` đến `43B-82012`.
- Tạo tối đa 12 trip `RUNNING` cho các route BUSMAP thật:
  - ba xe tuyến `02`;
  - ba xe tuyến `12`;
  - mỗi tuyến `01`, `03`, `05`, `06`, `07`, `16` một xe nếu route tồn tại.
- Fleet trip có marker `DEMO_FLEET vehicle XX`.
- Fleet trip không gán `conductor_id`, tránh làm conductor demo thấy 12 chuyến để quét.
- Script cleanup/audit nhận diện cả `DEMO_DATA%` và `DEMO_FLEET%`.

Lưu ý:

- Chỉ sửa file script.
- Chưa chạy `Seed`, `Reset` hoặc thao tác ghi lên live RDS trong đợt này.
- Khi chạy script thật cần backup và audit theo quy trình hiện có.

## 4. Luồng sau khi sửa

1. Coordinator tạo/phân công schedule.
2. Hệ thống tạo trip duy nhất cho schedule/ngày.
3. Trước khi driver bắt đầu:
   - trip là `NOT_STARTED`;
   - conductor không thể quét;
   - scan backend trả `Tài xế chưa bắt đầu chuyến.`
4. Driver bắt đầu chuyến:
   - trip chuyển `RUNNING`;
   - conductor UI tự nhận chuyến đang chạy;
   - camera/nút scan được bật.
5. Xe gửi GPS hoặc simulator cập nhật `vehicle_locations`.
6. Student route tracking và Coordinator live map cùng đọc vị trí mới nhất của trip.
7. Khi trip hoàn thành/hủy:
   - không còn trong danh sách xe đang chạy;
   - conductor không thể tiếp tục quét.

## 5. Validation đã chạy

### Scoped backend tests

Command:

```powershell
mvn -Dtest=OperationsServiceTests,OperationsRepositoryTests,JourneyTrackingServiceTests,DemoFleetSimulatorTests test
```

Kết quả:

- 8 tests.
- 0 failures.
- 0 errors.
- `BUILD SUCCESS`.

### Backend compile/package

Command:

```powershell
mvn -DskipTests package
```

Kết quả:

- Compile thành công.
- Tạo Spring Boot jar thành công.
- `BUILD SUCCESS`.

### Frontend lint

Command:

```powershell
npm run lint --prefix frontend
```

Kết quả:

- 0 errors.
- 5 warnings cũ trong `student-module.tsx` liên quan hook dependencies.
- Không có warning/error mới trong Coordinator hoặc Conductor.

### Frontend build

Command:

```powershell
npm run build --prefix frontend
```

Kết quả quan sát được:

- Next.js compile thành công.
- TypeScript hoàn thành.
- Tool không in dòng exit/final result hoặc marker tiếp theo, vì vậy không ghi nhận là full build pass tuyệt đối.

### Git whitespace

Command:

```powershell
git diff --check
```

Kết quả:

- Không có whitespace error.
- Chỉ có cảnh báo Git về chuyển LF thành CRLF trên Windows.

### Full backend test suite

Command:

```powershell
mvn test
```

Kết quả:

- 69 tests.
- 10 failures.
- 1 error.
- Các lỗi tập trung ở `AuthEdgeCaseIntegrationTests`, `AuthHttpIntegrationTests`, `AuthServiceTests`.
- Nguyên nhân log thể hiện test database thiếu/bất đồng bộ bảng `university_domains` và trạng thái OTP.
- Scoped Operations/Tracking tests vẫn pass trong cùng codebase.
- Không sửa nhóm Auth vì nằm ngoài phạm vi yêu cầu này.

## 6. Những gì không thay đổi

- Không đổi schema.
- Không thêm Flyway migration.
- Không thao tác live RDS.
- Không đổi logic giá vé, subsidy, thanh toán hoặc ticket provisioning.
- Không đổi thiết kế map, bus icon, tracker, marker hoặc route color.
- Không khôi phục `stu-stops`.
- Không làm lại toàn bộ Coordinator UI.
- Không xóa dữ liệu duplicate cũ trên live database.

## 7. Điểm Agent tiếp theo cần đối chiếu

1. Kiểm tra SQL script trên bản sao/staging trước khi chạy live:
   - `trips.schedule_id` cho phép `NULL` trên database đích;
   - các status `READY`, `RUNNING`, `INACTIVE` phù hợp constraint hiện tại;
   - đủ route BUSMAP thật cho các code được chọn.
2. Chạy backup trước Seed/Reset live RDS.
3. Sau khi seed, audit số fleet trip và vehicle location.
4. Mở đồng thời student tracking và Coordinator live map:
   - đối chiếu cùng biển số;
   - cùng trip ID;
   - vị trí thay đổi khoảng 3–5 giây.
5. Test conductor:
   - `NOT_STARTED` phải bị khóa;
   - sau driver start mới scan được;
   - fleet simulator không xuất hiện trong danh sách conductor demo.
6. Audit và dọn duplicate trip cũ nếu live database còn dữ liệu được tạo trước row-lock fix.
7. Điều tra riêng nhóm Auth tests đang fail; không gộp fix Auth vào tracking nếu không cần.

## 8. File thay đổi thuộc đợt Coordinator/Tracking

- `backend/src/main/java/com/unibus/api/UnibusApiApplication.java`
- `backend/src/main/java/com/unibus/api/operations/DemoFleetSimulator.java`
- `backend/src/main/java/com/unibus/api/operations/OperationsRepository.java`
- `backend/src/main/java/com/unibus/api/operations/OperationsService.java`
- `backend/src/main/java/com/unibus/api/transport/JourneyTrackingService.java`
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-local.properties`
- `backend/src/main/resources/application-prod.properties`
- `backend/src/test/java/com/unibus/api/operations/DemoFleetSimulatorTests.java`
- `backend/src/test/java/com/unibus/api/operations/OperationsRepositoryTests.java`
- `backend/src/test/java/com/unibus/api/operations/OperationsServiceTests.java`
- `backend/src/test/java/com/unibus/api/transport/JourneyTrackingServiceTests.java`
- `frontend/src/components/bus/roles/assistant-module.tsx`
- `frontend/src/components/bus/roles/coordinator-module.tsx`
- `database/AuditDemoDataUntilAugust.sql`
- `database/ResetDemoScenario.sql`
- `database/SeedDemoDataUntilAugust.sql`

## 9. Trạng thái handoff

- Code chưa được push/commit trong bước ghi log này.
- `.zcode/` là untracked và không thuộc phạm vi; không được stage.
- Các thay đổi rename/cleanup script demo đã tồn tại trong working tree trước phần Coordinator/Tracking; cần review chung trước khi commit.
