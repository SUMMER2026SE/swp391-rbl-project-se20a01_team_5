BEGIN;

INSERT INTO universities (code, name, short_name, status, created_at, updated_at)
VALUES
    ('DTU', 'Trường Đại học Duy Tân', 'DTU', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('DUT', 'Trường Đại học Bách khoa - Đại học Đà Nẵng', 'DUT', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('UTE', 'Trường Đại học Sư phạm Kỹ thuật - Đại học Đà Nẵng', 'UTE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('UED', 'Trường Đại học Sư phạm - Đại học Đà Nẵng', 'UED', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('VKU', 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn', 'VKU', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('DUE', 'Trường Đại học Kinh tế - Đại học Đà Nẵng', 'DUE', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('UFLS', 'Trường Đại học Ngoại ngữ - Đại học Đà Nẵng', 'UFLS', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('UDN', 'Đại học Đà Nẵng', 'UDN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('UDA', 'Trường Đại học Đông Á', 'UDA', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('FPTDN', 'Trường Đại học FPT Đà Nẵng', 'FPT', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO UPDATE SET
    code = EXCLUDED.code,
    short_name = EXCLUDED.short_name,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;
