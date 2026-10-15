-- ============================================================
-- RR STOCK – Inicialización de Negocio y Administradores
-- Negocio limpio arrancando al 0
-- Contraseñas configuradas: 'rradmin123_'
-- ============================================================

-- Negocio principal
INSERT INTO businesses (id, name, slug, address, phone, tax_id) VALUES
  ('11111111-0000-0000-0000-000000000001', 'RR Stock', 'rr-stock',
   'Av. Libertador 1200, Buenos Aires', '+54 11 5555-0101', '30-71234567-8')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

-- Suscripción activa
INSERT INTO subscriptions (business_id, type, status, amount, starts_at, expires_at, last_payment_at) VALUES
  ('11111111-0000-0000-0000-000000000001', 'monthly', 'active', 25000.00,
   CURRENT_DATE - INTERVAL '15 days',
   CURRENT_DATE + INTERVAL '365 days',
   CURRENT_DATE - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

-- Administrador 1: Emiliano (admin1@admin.com / rradmin123_)
INSERT INTO users (id, business_id, email, password_hash, full_name, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'admin1@admin.com',
   '$2b$10$MJqzGB7nZM3Pni6hBa1oxOFu2tz8oghUh/xnd.78k5i8kXhcP7c3K',
   'Emiliano', 'admin')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

-- Administrador 2: Freddy (admin2@admin.com / rradmin123_)
INSERT INTO users (id, business_id, email, password_hash, full_name, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
   'admin2@admin.com',
   '$2b$10$MJqzGB7nZM3Pni6hBa1oxOFu2tz8oghUh/xnd.78k5i8kXhcP7c3K',
   'Freddy', 'admin')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

-- Superadmin general
INSERT INTO users (id, business_id, email, password_hash, full_name, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'superadmin@repuestocontrol.com',
   '$2b$10$MJqzGB7nZM3Pni6hBa1oxOFu2tz8oghUh/xnd.78k5i8kXhcP7c3K',
   'Super Administrador', 'superadmin')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash;

-- Plantilla de presupuesto por defecto
INSERT INTO quote_templates (business_id, business_name, title, footer_text, payment_terms, vat_rate) VALUES
  ('11111111-0000-0000-0000-000000000001', 'RR Stock',
   'PRESUPUESTO',
   'Este presupuesto tiene una validez de 7 días hábiles.',
   'Pago al contado, transferencia o débito.',
   21.00)
ON CONFLICT DO NOTHING;
