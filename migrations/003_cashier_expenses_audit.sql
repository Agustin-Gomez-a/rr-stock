-- ============================================================
-- REPUESTO CONTROL – Migración 003: Cajero, Gastos y Auditoría
-- ============================================================

-- Agregar 'cashier' al tipo enumerado si aún no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype AND enumlabel = 'cashier'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'cashier';
  END IF;
END $$;

-- ============================================================
-- Tabla de Gastos del Negocio (luz, servicios, insumos, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'otros',
  amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT,
  created_by_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(business_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(business_id, category);

-- ============================================================
-- Tabla de Auditoría / Monitoreo de Acciones del Personal
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name       TEXT NOT NULL,
  user_role       TEXT NOT NULL,
  action          TEXT NOT NULL,
  details         TEXT NOT NULL,
  amount          NUMERIC(12, 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_business ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_role ON audit_logs(business_id, user_role);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(business_id, action);
