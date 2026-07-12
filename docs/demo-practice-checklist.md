# UniBus Demo Practice Checklist

This is the single maintained rehearsal guide for the UniBus demo. It replaces older scattered visual-test logs and seed notes.

## 1. Demo Data Control

Run from the repository root on Windows PowerShell.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Audit
```

Use these only when the team intentionally changes live demo data:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Seed
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Reset
```

Rules:
- `Audit` is safe and read-only.
- `Seed` and `Reset` require typed confirmation in the runner.
- Stable demo data targets `Trường Đại học Duy Tân` and real BUSMAP routes.
- Do not run old seed scripts; they were removed to keep one source of truth.

## 2. Shared Demo Accounts

Shared password: `Password123!`

| Role | Account | What to practice |
| --- | --- | --- |
| Student supported | `student.supported@unibus.local` | subsidized route, active monthly pass, QR, tracking |
| Student full price | `student.fullprice@unibus.local` | public route, full-price purchase |
| Student monthly | `student.monthly@unibus.local` | monthly pass scenario |
| Student day ticket | `student.day@unibus.local` | single/day ticket scenario |
| Student unpaid | `student.unpaid@unibus.local` | registered route without valid ticket |
| Student history | `student.history@unibus.local` | history and invoice views |
| University admin | `uniadmin.demo@unibus.local` | Duy Tân students, roster, policies, transactions |
| Dispatcher | `dispatcher.demo@unibus.local` | schedules, assignments, live fleet |
| Driver | `driver.demo@unibus.local` | today's trip, start/end trip, contacts |
| Conductor | `conductor.demo@unibus.local` | assigned trip, scan QR, incident report |
| System admin | `admin.demo@unibus.local` | universities, routes, staff, system overview |

Special real test student:
- `khanhnv20a02@gmail.com`: use for a fresh Duy Tân student flow when needed.

## 3. Student Flow

Practice with `student.supported@unibus.local` first.

Expected flow:
1. Login.
2. Dashboard shows Duy Tân student state.
3. Open `Vé của tôi`.
4. `Tuyến đã đăng ký` card shows:
   - `Đã đăng ký`;
   - `Đã có vé hợp lệ` for paid monthly route, or `Cần mua vé` for unpaid route;
   - `Xem vé / QR` when monthly pass exists;
   - `Theo dõi tuyến` always available.
5. Open `Vé đã mua` and verify QR is visible.
6. Open `Theo dõi tuyến` from the card.
7. Verify route map, stops, selected stop, nearest-stop button, ETA section, and stop list.
8. Go to payment only for an unpaid/full-price account.
9. On payment, choose `Vé tháng` or `Vé lượt / vé ngày`, then confirm SePay QR.

Expected result:
- Tracking is not blocked by unpaid status.
- Payment amount must match the button/QR amount.
- If SePay simulator is used, transfer content must include `DH<orderId>` and exact amount.

## 4. University Admin Flow

Practice with `uniadmin.demo@unibus.local`.

Expected checks:
1. Dashboard is scoped to `Trường Đại học Duy Tân`.
2. Student list is not empty.
3. Campus/domain/roster screens load real backend data or clear empty states.
4. Transactions/reconciliation show demo payment rows when demo data is seeded.
5. Subsidy policy for the supported Duy Tân route is visible.

## 5. Dispatcher Flow

Practice with `dispatcher.demo@unibus.local`.

Expected checks:
1. Schedules load for today's date.
2. Assign bus, driver, and conductor if the scenario requires it.
3. Live fleet should not look broken when there is no fresh vehicle location.
4. After assignment, driver/conductor dashboards should reflect today's trip.

## 6. Driver Flow

Practice with `driver.demo@unibus.local`.

Expected checks:
1. Dashboard shows today's assigned trip clearly.
2. Trip card includes route code/name, time, bus plate, and status.
3. Start/end trip actions work only for valid trip states.
4. Contacts/help screens load without fake fallback data.

## 7. Conductor Flow

Practice with `conductor.demo@unibus.local`.

Expected checks:
1. Dashboard does not show a fake active trip when trip data is incomplete.
2. Ticket scan screen shows empty state if no valid trip is selected.
3. Scan a valid student monthly QR or single-ticket QR.
4. Expired/invalid QR must fail with a clear reason.
5. Incident report submits without DB enum errors.

## 8. System Admin Flow

Practice with `admin.demo@unibus.local`.

Expected checks:
1. University management can view Duy Tân.
2. Route assignment to university is visible.
3. Staff/account management shows natural demo names and roles.
4. Do not create new operator or schema-level demo data.

## 9. SePay Simulator

Webhook URL for deployed CloudFront environment:

```text
https://d8xawk4fn4vfd.cloudfront.net/api/v1/payments/sepay/webhook
```

Simulator fields:
- Content/description/code must contain `DH<orderId>`.
- Amount must exactly match QR total.
- Transfer type must be inbound.

After simulated success:
- order status should become paid;
- ticket/pass should be created or activated;
- frontend should move to completion state after polling;
- invoice/payment should no longer appear pending.

## 10. Before And After Practice

Before practice:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Audit
```

After practice, when the team wants to restore the prepared scenario:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Reset
powershell -NoProfile -ExecutionPolicy Bypass -File database\RunDemoData.ps1 -Mode Audit
```

If audit fails, fix data/script first. Do not hide failures with frontend mock data.
