-- Online payments through Moyasar hosted invoices.
-- status: pending | paid | failed | expired | canceled | gateway_not_configured (old rows)
ALTER TABLE payments ADD COLUMN gateway TEXT;
ALTER TABLE payments ADD COLUMN gateway_invoice_id TEXT;
ALTER TABLE payments ADD COLUMN gateway_payment_id TEXT;
ALTER TABLE payments ADD COLUMN checkout_url TEXT;
ALTER TABLE payments ADD COLUMN paid_at TEXT;
ALTER TABLE payments ADD COLUMN updated_at TEXT;

CREATE UNIQUE INDEX idx_payments_invoice ON payments(gateway_invoice_id);
CREATE INDEX idx_payments_status ON payments(status, created_at);
