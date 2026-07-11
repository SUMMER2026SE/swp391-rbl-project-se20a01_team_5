# Ke hoach thay doi nghiep vu UniAdmin

Tai lieu nay tom tat nhung diem can sua va can them cho role `university_admin`.
Pham vi chi gom UniAdmin, khong bao gom admin he thong.

## 1. Can sua truoc demo

| Muc | Can thay doi | Ly do | Uu tien |
|---|---|---|---|
| Bao cao doi soat | Goi API `/university-admin/reconciliation` that su va truyen `from/to` khi loc ngay | UI hien tai co kha nang luon rong vi `ctx.reconciliation` khong duoc fetch rieng | Cao |
| Chinh sach tro gia | Dong bo enum frontend/backend: frontend dung `PERCENTAGE` va `FIXED_AMOUNT` thay cho `PERCENT` va `FIXED` | Backend validate `PERCENTAGE/FIXED_AMOUNT`, neu frontend gui sai thi them chinh sach de loi | Cao |
| Hien thi tro gia | Sua logic hien thi `%` theo `subsidyType === "PERCENTAGE"` | Hien tai frontend check `PERCENT`, khong khop data backend | Cao |
| Menu sinh vien | Doi label `Trang thai sinh vien` thanh `Danh sach sinh vien` hoac `Quan ly sinh vien` | Man nay la roster/danh sach sinh vien, khong chi la trang thai | Cao |
| Man gui thong bao | An phan `Gan day` hoac noi voi lich su thong bao that | `ctx.notifications` hien dang rong, de gay hieu nham la chua co thong bao da gui | Cao |
| Menu `Thong bao` | An khoi sidebar hoac doi ten thanh `Thong bao nhan duoc` | De nham voi man `Gui thong bao truong` | Trung binh |
| Text doi soat | Bo cac text ky thuat nhu `V16`, `fallback`, `legacy` | Khong phu hop demo nghiep vu cho nguoi dung truong | Cao |

## 2. Nen giu

| Man | Ly do |
|---|---|
| Tong quan truong | Phu hop vai tro UniAdmin, dung de xem nhanh so lieu cua truong |
| Thong tin truong & campus | Dung scope mot truong, nen giu de xem thong tin va co so |
| Domain email | Can cho nghiep vu lien ket sinh vien voi truong qua email |
| Import danh sach sinh vien | La nghiep vu chinh cua UniAdmin |
| Danh sach sinh vien | Can de theo doi roster sinh vien thuoc truong |
| Chinh sach tro gia | Phu hop voi vai tro truong tai tro/ho tro sinh vien |
| Bao cao doi soat | Can cho tai chinh va doi soat tro gia |
| Lich su giao dich | Can de xem tung giao dich/order chi tiet |
| Gui thong bao cho sinh vien | Phu hop voi UniAdmin khi can thong bao cho sinh vien cua truong |
| Ho so ca nhan | La man tai khoan chung, nen giu |

## 3. Nen doi ten hoac chuyen nhom

| Hien tai | De xuat | Ly do |
|---|---|---|
| Trang thai sinh vien | Danh sach sinh vien | Man hien thi roster sinh vien, co search/filter, khong phai man trang thai rieng |
| Gui thong bao truong | Gui thong bao cho sinh vien | Noi ro doi tuong nhan la sinh vien cua truong |
| Thong bao | Thong bao nhan duoc | Neu giu lai, can phan biet voi chuc nang gui thong bao |
| Thong tin truong & campus | Thong tin truong & co so | Thuan tieng Viet hon, ro nghiep vu hon |
| Bao cao doi soat | Doi soat tai chinh | Noi ro day la man tai chinh/tro gia theo ky |

## 4. Nen an hoac bo

| Phan | Ly do | Uu tien |
|---|---|---|
| Phan `Gan day` trong man gui thong bao | Chua co data lich su thong bao da gui | Cao |
| Menu `Thong bao` neu khong can notification ca nhan | Trung ten va de nham voi gui thong bao | Trung binh |
| Text ky thuat trong doi soat | Khong co gia tri nghiep vu khi demo | Cao |
| Cac label/hien thi tro gia dung enum cu | Sai voi backend | Cao |

## 5. Nen them sau demo

| Chuc nang | Ly do nghiep vu | Can backend khong | Uu tien |
|---|---|---|---|
| Lich su thong bao da gui | UniAdmin can xem da gui thong bao nao, thoi gian nao, bao nhieu sinh vien nhan | Co | Trung binh |
| Filter giao dich | Can loc theo ngay, sinh vien, trang thai thanh toan, loai ve, tuyen | Co the can | Trung binh |
| Export bao cao doi soat | Can xuat file cho nghiep vu tai chinh cua truong | Co | Trung binh |
| Chi tiet loi import | Khi import loi, can biet dong nao loi va loi gi | Co the can | Trung binh |
| Filter thong ke theo thoi gian/campus/tuyen | Giup man thong ke co gia tri hon dashboard | Co the can | Trung binh |
| Audit log thay doi tro gia/domain | Can truy vet ai them/sua domain hoac chinh sach tro gia | Co the tan dung audit hien co | Thap |
| Trang thai domain cho duyet | Giam rui ro UniAdmin tu them domain khong hop le | Co | Thap |
| Sinh vien cho xac minh | Chi nen them neu quyet dinh cho UniAdmin tham gia flow xac minh sinh vien | Co | Thap |

## 6. Menu UniAdmin de xuat

### Tong quan
- Tong quan truong

### Quan ly truong
- Thong tin truong & co so
- Domain email
- Chinh sach tro gia

### Sinh vien
- Danh sach sinh vien
- Import danh sach sinh vien

### Tai chinh & doi soat
- Doi soat tai chinh
- Lich su giao dich

### Truyen thong
- Gui thong bao cho sinh vien
- Lich su thong bao da gui, neu co backend

### Tai khoan
- Ho so ca nhan
- Thong bao nhan duoc, neu van muon giu notification ca nhan

## 7. Thu tu uu tien trien khai

### Uu tien cao
1. Sua doi soat de fetch API that va loc theo ngay.
2. Sua enum tro gia `PERCENTAGE/FIXED_AMOUNT`.
3. Sua hien thi tro gia theo enum backend.
4. Doi menu `Trang thai sinh vien` thanh `Danh sach sinh vien`.
5. An hoac noi data that cho phan `Gan day` trong man gui thong bao.
6. Bo text ky thuat trong man doi soat.

### Uu tien trung binh
1. Doi ten `Gui thong bao truong` thanh `Gui thong bao cho sinh vien`.
2. Doi `Thong bao` thanh `Thong bao nhan duoc` hoac an khoi sidebar.
3. Them filter giao dich.
4. Them export doi soat.
5. Them lich su thong bao da gui.
6. Them chi tiet loi import.

### Uu tien thap
1. Them audit log UI cho tro gia/domain.
2. Them domain cho duyet.
3. Them phan quyen nhieu cap trong truong.
4. Them dashboard thong ke nang cao.

## 8. Ket luan ngan gon

UniAdmin hien tai dung huong: la admin cua mot truong dai hoc va du lieu da duoc backend scope theo `universityId`.
Can sua gap cac diem co nguy co gay loi hoac gay hieu nham khi demo: doi soat, enum tro gia, ten menu sinh vien va thong bao.
Nhung tinh nang nhu export, filter nang cao, lich su thong bao, audit log nen de sau demo.
