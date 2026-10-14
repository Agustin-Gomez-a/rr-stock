-- ============================================================
-- REPUESTO CONTROL – Migración inicial
-- Ejecutar con psql o desde el panel de Neon
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos enumerados
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'manager', 'seller');
CREATE TYPE subscription_type AS ENUM ('monthly', 'fixed');
CREATE TYPE subscription_status AS ENUM ('active', 'suspended', 'expired');
CREATE TYPE sale_status AS ENUM ('pending', 'paid', 'cancelled');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected');

-- ============================================================
-- Negocios (unidades independientes)
-- ============================================================
CREATE TABLE businesses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  logo_url    TEXT,
  address     TEXT,
  phone       TEXT,
  tax_id      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_businesses_slug ON businesses(slug);

-- ============================================================
-- Suscripciones
-- ============================================================
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type            subscription_type NOT NULL DEFAULT 'monthly',
  status          subscription_status NOT NULL DEFAULT 'active',
  amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  starts_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at      DATE,
  last_payment_at DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================
-- Usuarios
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID REFERENCES businesses(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'seller',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- superadmin no necesita business_id
  CONSTRAINT chk_business_or_superadmin
    CHECK (role = 'superadmin' OR business_id IS NOT NULL)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_business ON users(business_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- Clientes
-- ============================================================
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  tax_id      TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_business ON customers(business_id);
CREATE INDEX idx_customers_name ON customers(business_id, name);

-- ============================================================
-- Productos (catálogo de repuestos)
-- ============================================================
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sku           TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  supplier      TEXT,
  price         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cost          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity      INTEGER NOT NULL DEFAULT 0,
  min_stock     INTEGER NOT NULL DEFAULT 5,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_sku UNIQUE (business_id, sku),
  CONSTRAINT chk_price_positive CHECK (price >= 0),
  CONSTRAINT chk_cost_positive CHECK (cost >= 0),
  CONSTRAINT chk_quantity_non_negative CHECK (quantity >= 0)
);

CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_products_sku ON products(business_id, sku);
CREATE INDEX idx_products_category ON products(business_id, category);
CREATE INDEX idx_products_low_stock ON products(business_id, quantity, min_stock)
  WHERE quantity <= min_stock AND is_active = TRUE;

-- ============================================================
-- Ventas
-- ============================================================
CREATE TABLE sales (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES customers(id) ON DELETE SET NULL,
  seller_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  status        sale_status NOT NULL DEFAULT 'pending',
  total         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes         TEXT,
  sale_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_business ON sales(business_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(business_id, sale_date);
CREATE INDEX idx_sales_status ON sales(business_id, status);

-- ============================================================
-- Líneas de venta
-- ============================================================
CREATE TABLE sale_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  sku         TEXT NOT NULL,
  name        TEXT NOT NULL,
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(12, 2) NOT NULL,
  subtotal    NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_unit_price_positive CHECK (unit_price >= 0)
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- ============================================================
-- Plantillas de presupuesto
-- ============================================================
CREATE TABLE quote_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_name   TEXT,
  logo_url        TEXT,
  title           TEXT NOT NULL DEFAULT 'PRESUPUESTO',
  footer_text     TEXT,
  payment_terms   TEXT,
  vat_rate        NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quote_templates_business ON quote_templates(business_id);

-- ============================================================
-- Presupuestos
-- ============================================================
CREATE TABLE quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  template_id     UUID REFERENCES quote_templates(id) ON DELETE SET NULL,
  quote_number    TEXT NOT NULL,
  status          quote_status NOT NULL DEFAULT 'draft',
  vehicle_info    TEXT,
  vin             TEXT,
  subtotal        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  vat_rate        NUMERIC(5, 2) NOT NULL DEFAULT 21.00,
  vat_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes           TEXT,
  valid_until     DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_quote_number UNIQUE (business_id, quote_number)
);

CREATE INDEX idx_quotes_business ON quotes(business_id);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(business_id, status);
CREATE INDEX idx_quotes_number ON quotes(business_id, quote_number);

-- ============================================================
-- Líneas de presupuesto
-- ============================================================
CREATE TABLE quote_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  sku         TEXT NOT NULL,
  name        TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal    NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  CONSTRAINT chk_qi_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_qi_price_positive CHECK (unit_price >= 0)
);

CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);

-- ============================================================
-- Función: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_quote_templates_updated_at
  BEFORE UPDATE ON quote_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
