-- PostgreSQL version of SePay demo database
-- Original docs use MySQL tables: tb_orders, tb_transactions.
-- This version keeps same table names/fields, adds safe PostgreSQL constraints/indexes.

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sepay_payment_status') THEN
        CREATE TYPE sepay_payment_status AS ENUM ('Unpaid', 'Paid', 'Cancelled', 'Refunded');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS tb_orders (
    id BIGSERIAL PRIMARY KEY,
    total NUMERIC(20, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    payment_status sepay_payment_status NOT NULL DEFAULT 'Unpaid',
    name VARCHAR(250),
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
    amount_in NUMERIC(20, 2) NOT NULL DEFAULT 0.00 CHECK (amount_in >= 0),
    amount_out NUMERIC(20, 2) NOT NULL DEFAULT 0.00 CHECK (amount_out >= 0),
    accumulated NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
    code VARCHAR(250),
    transaction_content TEXT,
    reference_number VARCHAR(255),
    body TEXT,
    raw_payload JSONB,
    matched_order_id BIGINT REFERENCES tb_orders(id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tb_orders_payment_status ON tb_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_tb_orders_created_at ON tb_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tb_transactions_reference_number ON tb_transactions(reference_number);
CREATE INDEX IF NOT EXISTS idx_tb_transactions_matched_order_id ON tb_transactions(matched_order_id);
CREATE INDEX IF NOT EXISTS idx_tb_transactions_transaction_date ON tb_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tb_transactions_content_text ON tb_transactions USING GIN (to_tsvector('simple', COALESCE(transaction_content, '')));

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tb_orders_updated_at ON tb_orders;
CREATE TRIGGER trg_tb_orders_updated_at
BEFORE UPDATE ON tb_orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION extract_sepay_order_id(p_content TEXT)
RETURNS BIGINT AS $$
DECLARE
    v_match TEXT[];
BEGIN
    v_match := regexp_match(COALESCE(p_content, ''), 'DH([0-9]+)');
    IF v_match IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN v_match[1]::BIGINT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION insert_sepay_transaction_and_mark_paid(p_payload JSONB)
RETURNS TABLE(success BOOLEAN, message TEXT, order_id BIGINT) AS $$
DECLARE
    v_transfer_type TEXT;
    v_transfer_amount NUMERIC(20, 2);
    v_amount_in NUMERIC(20, 2) := 0;
    v_amount_out NUMERIC(20, 2) := 0;
    v_content TEXT;
    v_order_id BIGINT;
    v_transaction_id BIGINT;
BEGIN
    v_transfer_type := COALESCE(p_payload ->> 'transferType', 'in');
    v_transfer_amount := COALESCE(NULLIF(p_payload ->> 'transferAmount', '')::NUMERIC, 0);
    v_content := p_payload ->> 'content';
    v_order_id := extract_sepay_order_id(v_content);

    IF v_transfer_type = 'in' THEN
        v_amount_in := v_transfer_amount;
    ELSE
        v_amount_out := v_transfer_amount;
    END IF;

    INSERT INTO tb_transactions (
        sepay_transaction_id,
        gateway,
        transaction_date,
        account_number,
        sub_account,
        amount_in,
        amount_out,
        accumulated,
        code,
        transaction_content,
        reference_number,
        body,
        raw_payload,
        matched_order_id
    ) VALUES (
        NULLIF(p_payload ->> 'id', '')::BIGINT,
        COALESCE(p_payload ->> 'gateway', 'SePay'),
        NULLIF(p_payload ->> 'transactionDate', '')::TIMESTAMPTZ,
        p_payload ->> 'accountNumber',
        p_payload ->> 'subAccount',
        v_amount_in,
        v_amount_out,
        COALESCE(NULLIF(p_payload ->> 'accumulated', '')::NUMERIC, 0),
        p_payload ->> 'code',
        v_content,
        p_payload ->> 'referenceCode',
        p_payload ->> 'description',
        p_payload,
        v_order_id
    )
    ON CONFLICT (sepay_transaction_id) DO NOTHING
    RETURNING id INTO v_transaction_id;

    IF v_transaction_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Duplicate SePay transaction'::TEXT, v_order_id;
        RETURN;
    END IF;

    IF v_order_id IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Order code DH{id} not found in transaction content'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;

    UPDATE tb_orders
    SET payment_status = 'Paid'
    WHERE id = v_order_id
      AND total = v_amount_in
      AND payment_status = 'Unpaid';

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Order not found, amount mismatch, or already processed'::TEXT, v_order_id;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'Payment marked as Paid'::TEXT, v_order_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Example order, like docs order.php inserting tb_orders(total, name):
-- INSERT INTO tb_orders(total, name) VALUES (7000, 'V? th??ng UniBus') RETURNING id;
-- QR description must be: DH<id>, example DH30.

-- Example webhook payload processing:
-- SELECT * FROM insert_sepay_transaction_and_mark_paid(
--   '{"id":92704,"gateway":"Vietcombank","transactionDate":"2024-07-25 14:02:37","accountNumber":"0123499999","code":null,"content":"DH30","transferType":"in","transferAmount":7000,"accumulated":19077000,"subAccount":null,"referenceCode":"MBVCB.3278907687","description":""}'::jsonb
-- );
