-- ============================================================
-- REPUESTO CONTROL – Datos demo (solo desarrollo)
-- Ejecutar SOLO en entornos de desarrollo.
-- NO ejecutar en producción.
-- Las contraseñas son hash de bcrypt de 'Demo1234!'
-- ============================================================

-- Negocio demo
INSERT INTO businesses (id, name, slug, address, phone, tax_id) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Repuestos García', 'garcia-repuestos',
   'Av. Rivadavia 4500, CABA', '+54 11 4444-5555', '20-12345678-9');

-- Suscripción activa para el negocio demo
INSERT INTO subscriptions (business_id, type, status, amount, starts_at, expires_at, last_payment_at) VALUES
  ('11111111-0000-0000-0000-000000000001', 'monthly', 'active', 15000.00,
   CURRENT_DATE - INTERVAL '15 days',
   CURRENT_DATE + INTERVAL '15 days',
   CURRENT_DATE - INTERVAL '15 days');

-- Usuarios demo
-- Superadmin (sin business_id)
INSERT INTO users (id, business_id, email, password_hash, full_name, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'superadmin@repuestocontrol.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NQFfVHHIy',
   'Super Administrador', 'superadmin');

-- Admin del negocio demo
INSERT INTO users (id, business_id, email, password_hash, full_name, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'admin@garcia.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NQFfVHHIy',
   'Carlos García', 'admin');

-- Manager del negocio demo
INSERT INTO users (id, business_id, email, password_hash, full_name, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
   'manager@garcia.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NQFfVHHIy',
   'Ana Torres', 'manager');

-- Vendedor del negocio demo
INSERT INTO users (id, business_id, email, password_hash, full_name, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001',
   'vendedor@garcia.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NQFfVHHIy',
   'Lucas Martínez', 'seller');

-- Clientes demo
INSERT INTO customers (id, business_id, name, email, phone, tax_id) VALUES
  ('cccccccc-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'Juan Pérez', 'juan@email.com', '+54 11 1234-5678', '20-98765432-1'),
  ('cccccccc-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'María López', 'maria@email.com', '+54 11 9876-5432', '27-11223344-5'),
  ('cccccccc-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
   'Roberto Silva', 'roberto@email.com', '+54 11 5555-6666', '20-55556666-7');

-- Productos demo
INSERT INTO products (business_id, sku, name, category, supplier, price, cost, quantity, min_stock) VALUES
  ('11111111-0000-0000-0000-000000000001', 'FIL-001', 'Filtro de Aceite Toyota', 'Filtros', 'AutoParts SA', 2500.00, 1800.00, 45, 10),
  ('11111111-0000-0000-0000-000000000001', 'FRE-001', 'Pastillas de Freno Delanteras', 'Frenos', 'FrenoPro', 8900.00, 6200.00, 8, 5),
  ('11111111-0000-0000-0000-000000000001', 'ACE-001', 'Aceite Motor 10W40 1L', 'Lubricantes', 'Mobil', 1200.00, 800.00, 120, 20),
  ('11111111-0000-0000-0000-000000000001', 'BUJ-001', 'Bujías NGK BPR6ES (x4)', 'Encendido', 'NGK', 3200.00, 2100.00, 3, 8),
  ('11111111-0000-0000-0000-000000000001', 'COR-001', 'Correa de Distribución', 'Motor', 'Gates', 12500.00, 9000.00, 15, 3),
  ('11111111-0000-0000-0000-000000000001', 'AMO-001', 'Amortiguador Trasero', 'Suspensión', 'Monroe', 18000.00, 13000.00, 6, 2),
  ('11111111-0000-0000-0000-000000000001', 'BAT-001', 'Batería 12V 60Ah', 'Eléctrico', 'Bosch', 35000.00, 25000.00, 4, 2),
  ('11111111-0000-0000-0000-000000000001', 'FIL-002', 'Filtro de Aire Universal', 'Filtros', 'AutoParts SA', 1800.00, 1200.00, 30, 10);

-- Plantilla de presupuesto demo
INSERT INTO quote_templates (business_id, business_name, title, footer_text, payment_terms, vat_rate) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Repuestos García',
   'PRESUPUESTO',
   'Este presupuesto tiene una validez de 7 días hábiles.',
   'Pago al contado. Transferencia bancaria o efectivo.',
   21.00);
