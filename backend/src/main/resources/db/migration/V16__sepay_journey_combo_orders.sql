ALTER TABLE tb_orders
    ADD COLUMN IF NOT EXISTS order_mode VARCHAR(40) DEFAULT 'single-route' NOT NULL,
    ADD COLUMN IF NOT EXISTS ticket_period VARCHAR(20) DEFAULT 'month' NOT NULL,
    ADD COLUMN IF NOT EXISTS origin_label VARCHAR(255),
    ADD COLUMN IF NOT EXISTS destination_label VARCHAR(255),
    ADD COLUMN IF NOT EXISTS legs_json JSONB,
    ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12, 0) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS subsidy_amount NUMERIC(12, 0) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS final_amount NUMERIC(12, 0) DEFAULT 0 NOT NULL;

UPDATE tb_orders
SET final_amount = total
WHERE final_amount = 0 AND total > 0;

UPDATE tb_orders
SET ticket_period = CASE
    WHEN LOWER(ticket_type) = 'single' THEN 'day'
    ELSE 'month'
END
WHERE ticket_period IS NULL OR ticket_period = 'month';

CREATE INDEX IF NOT EXISTS idx_tb_orders_order_mode
    ON tb_orders(order_mode);

CREATE INDEX IF NOT EXISTS idx_tb_orders_ticket_period
    ON tb_orders(ticket_period);
