-- Migration to integrate SePay payment gateway

CREATE TABLE IF NOT EXISTS tb_orders (
    id BIGSERIAL PRIMARY KEY,
    student_code VARCHAR(20) NOT NULL,
    ticket_type VARCHAR(20) NOT NULL CHECK (ticket_type IN ('monthly', 'single')),
    route_id INTEGER NOT NULL,
    total NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (total >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Paid', 'Cancelled', 'Refunded')),
    name VARCHAR(250) NOT NULL,
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tb_transactions (
    id BIGSERIAL PRIMARY KEY,
    sepay_transaction_id BIGINT UNIQUE,
    gateway VARCHAR(100) NOT NULL,
    transaction_date TIMESTAMPTZ,
    account_number VARCHAR(100),
    sub_account VARCHAR(250),
    amount_in NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (amount_in >= 0),
    amount_out NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (amount_out >= 0),
    accumulated NUMERIC(12, 0) NOT NULL DEFAULT 0,
    code VARCHAR(250),
    transaction_content TEXT,
    reference_number VARCHAR(255),
    body TEXT,
    raw_payload JSONB,
    matched_order_id BIGINT REFERENCES tb_orders(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tb_orders_payment_status ON tb_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_tb_orders_student_code ON tb_orders(student_code);
CREATE INDEX IF NOT EXISTS idx_tb_transactions_matched_order_id ON tb_transactions(matched_order_id);
