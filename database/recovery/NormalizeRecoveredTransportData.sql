BEGIN;

UPDATE routes
SET route_code = btrim(route_code),
    route_name = btrim(regexp_replace(route_name, '\s+', ' ', 'g')),
    status = 'ACTIVE'
WHERE external_source = 'BUSMAP_DN';

UPDATE stops
SET stop_name = btrim(regexp_replace(stop_name, '\s+', ' ', 'g')),
    address = NULLIF(btrim(regexp_replace(COALESCE(address, ''), '\s+', ' ', 'g')), ''),
    status = 'ACTIVE'
WHERE external_source = 'BUSMAP_DN';

UPDATE stops
SET stop_name = 'Đại học Việt Hàn',
    address = '470 Trần Đại Nghĩa, Hòa Hải, Ngũ Hành Sơn, Đà Nẵng'
WHERE stop_code = 'BUSMAP-DN-48659'
   OR lower(btrim(stop_name)) = 'đại học việt';

UPDATE routes
SET route_name = 'Tuyến 02 (Bến xe Trung tâm - Đại học Việt Hàn)'
WHERE route_code = '02'
  AND external_source = 'BUSMAP_DN';

COMMIT;
