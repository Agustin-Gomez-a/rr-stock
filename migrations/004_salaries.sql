-- ============================================================
-- REPUESTO CONTROL – Migración 004: Módulo de Sueldos y Liquidaciones
-- ============================================================

CREATE TABLE IF NOT EXISTS salaries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_name     TEXT NOT NULL,
  employee_role     TEXT NOT NULL DEFAULT 'Vendedor',
  period            TEXT NOT NULL, -- '2026-10' o 'Octubre 2026'
  base_amount       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bonus_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deductions_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
  payment_date      DATE,
  payment_method    TEXT, -- 'efectivo' | 'transferencia' | 'cheque'
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salaries_business ON salaries(business_id);
CREATE INDEX IF NOT EXISTS idx_salaries_period ON salaries(business_id, period);
CREATE INDEX IF NOT EXISTS idx_salaries_status ON salaries(business_id, status);
