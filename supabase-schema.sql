-- ============================================================
-- RUNAGENT COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PLANS
CREATE TABLE IF NOT EXISTS plans (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  price        INTEGER NOT NULL DEFAULT 0,
  bill_credits INTEGER NOT NULL DEFAULT 50,
  description  TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO plans (id,name,price,bill_credits,description) VALUES
  ('free',   'Free Trial',0,   50,  '50 bills one-time'),
  ('starter','Starter',  999,  300, '300 bills/month'),
  ('growth', 'Growth',   1999, 800, '800 bills/month'),
  ('pro',    'Pro',      2999, 1500,'1500 bills/month'),
  ('firm',   'Firm',     4999, 3000,'3000 bills/month')
ON CONFLICT (id) DO NOTHING;

-- ACCESS REQUESTS
CREATE TABLE IF NOT EXISTS access_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name      TEXT NOT NULL,
  firm_name      TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  mobile         TEXT NOT NULL,
  city           TEXT NOT NULL,
  monthly_volume TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at    TIMESTAMPTZ
);

-- FIRMS
CREATE TABLE IF NOT EXISTS firms (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_name     TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  mobile        TEXT,
  city          TEXT,
  plan_id       TEXT REFERENCES plans(id) DEFAULT 'free',
  total_credits INTEGER NOT NULL DEFAULT 50,
  used_credits  INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id    UUID REFERENCES firms(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  mobile     TEXT,
  notes      TEXT,
  bill_limit INTEGER,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UPLOAD TOKENS
CREATE TABLE IF NOT EXISTS upload_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id  UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  firm_id    UUID REFERENCES firms(id) ON DELETE CASCADE NOT NULL,
  token      TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id           UUID REFERENCES firms(id) ON DELETE CASCADE NOT NULL,
  client_id         UUID REFERENCES clients(id),
  original_file_url TEXT,
  file_name         TEXT,
  file_type         TEXT,
  ocr_raw           JSONB,
  invoice_number    TEXT,
  invoice_date      TEXT,
  vendor_name       TEXT,
  gstin             TEXT,
  hsn_code          TEXT,
  description       TEXT,
  taxable_amount    NUMERIC(12,2) DEFAULT 0,
  cgst              NUMERIC(12,2) DEFAULT 0,
  sgst              NUMERIC(12,2) DEFAULT 0,
  igst              NUMERIC(12,2) DEFAULT 0,
  total_amount      NUMERIC(12,2) DEFAULT 0,
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','review')),
  ocr_confidence    NUMERIC(5,2),
  uploaded_by       TEXT DEFAULT 'client',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id              UUID REFERENCES firms(id) ON DELETE CASCADE NOT NULL,
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  razorpay_signature   TEXT,
  plan_id              TEXT REFERENCES plans(id),
  amount               INTEGER NOT NULL,
  currency             TEXT DEFAULT 'INR',
  status               TEXT DEFAULT 'created' CHECK (status IN ('created','paid','failed')),
  method               TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id              UUID REFERENCES firms(id) ON DELETE CASCADE,
  plan_id              TEXT REFERENCES plans(id),
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  amount               INTEGER NOT NULL,
  status               TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  starts_at            TIMESTAMPTZ DEFAULT NOW(),
  ends_at              TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- OTP CODES (for email login)
CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT NOT NULL UNIQUE,
  otp        TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USAGE LOGS
CREATE TABLE IF NOT EXISTS usage_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id    UUID REFERENCES firms(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  action     TEXT NOT NULL,
  meta       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMIN LOGS
CREATE TABLE IF NOT EXISTS admin_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action      TEXT NOT NULL,
  target_id   UUID,
  target_type TEXT,
  meta        JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_firm     ON invoices(firm_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client   ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status   ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created  ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_firm      ON clients(firm_id);
CREATE INDEX IF NOT EXISTS idx_upload_tokens_tok ON upload_tokens(token);
CREATE INDEX IF NOT EXISTS idx_firms_user        ON firms(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_email         ON otp_codes(email);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE firms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs    ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS firm_own          ON firms;
DROP POLICY IF EXISTS clients_own       ON clients;
DROP POLICY IF EXISTS tokens_own        ON upload_tokens;
DROP POLICY IF EXISTS invoices_own      ON invoices;
DROP POLICY IF EXISTS payments_own      ON payments;
DROP POLICY IF EXISTS subscriptions_own ON subscriptions;
DROP POLICY IF EXISTS usage_own         ON usage_logs;

CREATE POLICY firm_own          ON firms         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY clients_own       ON clients       FOR ALL USING (firm_id IN (SELECT id FROM firms WHERE user_id = auth.uid()));
CREATE POLICY tokens_own        ON upload_tokens FOR ALL USING (firm_id IN (SELECT id FROM firms WHERE user_id = auth.uid()));
CREATE POLICY invoices_own      ON invoices      FOR ALL USING (firm_id IN (SELECT id FROM firms WHERE user_id = auth.uid()));
CREATE POLICY payments_own      ON payments      FOR ALL USING (firm_id IN (SELECT id FROM firms WHERE user_id = auth.uid()));
CREATE POLICY subscriptions_own ON subscriptions FOR ALL USING (firm_id IN (SELECT id FROM firms WHERE user_id = auth.uid()));
CREATE POLICY usage_own         ON usage_logs    FOR ALL USING (firm_id IN (SELECT id FROM firms WHERE user_id = auth.uid()));

-- ── STORAGE BUCKET ────────────────────────────────────────────
-- Run separately if bucket doesn't exist:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bills', 'bills', false) ON CONFLICT DO NOTHING;

-- ── AUTO-UPDATE updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- OTP cleanup function (call via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_otps() RETURNS void AS $$
BEGIN DELETE FROM otp_codes WHERE expires_at < NOW(); END; $$ LANGUAGE plpgsql;
