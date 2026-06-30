# Stable Demo Data: Duy Tân + BUSMAP Routes

Stable demo data now treats `Trường Đại học Duy Tân` as the main demo university.

## Main scenario
- `uniadmin.demo@unibus.local` manages `Trường Đại học Duy Tân`.
- Demo student accounts (`student.supported@unibus.local`, `student.fullprice@unibus.local`, `student.monthly@unibus.local`, `student.day@unibus.local`, `student.unpaid@unibus.local`, `student.history@unibus.local`) belong to Duy Tân.
- The supported/subsidized route is selected from real active BUSMAP routes, preferring route `12`, then `01` or `06`.
- The full-price route is another real active BUSMAP route not linked to Duy Tân, preferring route `02` or `16`.

## Legacy data
- `UB-DN-*` routes are legacy synthetic demo routes and are no longer used as the main stable demo scenario.
- `Đại học Demo UniBus` is not deleted by the stable demo scripts; it is simply no longer the main target university.
- Duplicate Duy Tân-like university rows are not cleaned up in this pass.

## Script policy
- No schema changes and no Flyway migrations.
- `SeedStableDemoDataUntilAugust.sql` and `ResetStableDemoScenario.sql` recreate only demo-owned rows while using Duy Tân as the source-of-truth university.
- `AuditStableDemoDataUntilAugust.sql` validates Duy Tân ownership, BUSMAP route usage, subsidy/full-price split, ticket/order coverage, and legacy warnings.
