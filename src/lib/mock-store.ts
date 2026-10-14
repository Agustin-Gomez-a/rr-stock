// ============================================================
// Repuesto Control – Almacenamiento Demo en memoria
// Fallback automático cuando no hay conexión a Neon Postgres
// ============================================================

export interface MockBusiness {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  tax_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockSubscription {
  id: string;
  business_id: string;
  type: string;
  status: string;
  amount: number;
  starts_at: string;
  expires_at: string | null;
  last_payment_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockUser {
  id: string;
  business_id: string | null;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'manager' | 'seller';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockCustomer {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockProduct {
  id: string;
  business_id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  supplier: string | null;
  price: number;
  cost: number;
  quantity: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockSale {
  id: string;
  business_id: string;
  customer_id: string | null;
  customer_name?: string;
  seller_id: string | null;
  seller_name?: string;
  status: string;
  total: number;
  notes: string | null;
  sale_date: string;
  created_at: string;
  updated_at: string;
}

export interface MockQuote {
  id: string;
  business_id: string;
  customer_id: string | null;
  customer_name?: string;
  template_id: string | null;
  quote_number: string;
  status: string;
  vehicle_info: string | null;
  vin: string | null;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  notes: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockQuoteTemplate {
  id: string;
  business_id: string;
  business_name: string | null;
  logo_url: string | null;
  title: string;
  footer_text: string | null;
  payment_terms: string | null;
  vat_rate: number;
  created_at: string;
  updated_at: string;
}

class MockDatabase {
  businesses: MockBusiness[] = [
    {
      id: '11111111-0000-0000-0000-000000000001',
      name: 'Repuestos García',
      slug: 'garcia-repuestos',
      logo_url: null,
      address: 'Av. Rivadavia 4500, CABA',
      phone: '+54 11 4444-5555',
      tax_id: '20-12345678-9',
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-01-10T10:00:00Z',
    },
  ];

  subscriptions: MockSubscription[] = [
    {
      id: 'sub-1',
      business_id: '11111111-0000-0000-0000-000000000001',
      type: 'monthly',
      status: 'active',
      amount: 15000.0,
      starts_at: '2026-09-25',
      expires_at: '2026-10-25',
      last_payment_at: '2026-09-25',
      notes: 'Abono mensual en término',
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-01-10T10:00:00Z',
    },
  ];

  users: MockUser[] = [
    {
      id: 'aaaaaaaa-0000-0000-0000-000000000001',
      business_id: null,
      email: 'superadmin@repuestocontrol.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NQFfVHHIy',
      full_name: 'Super Administrador',
      role: 'superadmin',
      is_active: true,
      last_login_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'aaaaaaaa-0000-0000-0000-000000000002',
      business_id: '11111111-0000-0000-0000-000000000001',
      email: 'admin@garcia.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NQFfVHHIy',
      full_name: 'Carlos García',
      role: 'admin',
      is_active: true,
      last_login_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'aaaaaaaa-0000-0000-0000-000000000003',
      business_id: '11111111-0000-0000-0000-000000000001',
      email: 'manager@garcia.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NQFfVHHIy',
      full_name: 'Ana Torres',
      role: 'manager',
      is_active: true,
      last_login_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'aaaaaaaa-0000-0000-0000-000000000004',
      business_id: '11111111-0000-0000-0000-000000000001',
      email: 'vendedor@garcia.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NQFfVHHIy',
      full_name: 'Lucas Martínez',
      role: 'seller',
      is_active: true,
      last_login_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  customers: MockCustomer[] = [
    {
      id: 'cccccccc-0000-0000-0000-000000000001',
      business_id: '11111111-0000-0000-0000-000000000001',
      name: 'Juan Pérez',
      email: 'juan@email.com',
      phone: '+54 11 1234-5678',
      address: 'Av. Corrientes 1234',
      tax_id: '20-98765432-1',
      notes: 'Cliente habitual de repuestos Toyota',
      created_at: '2026-02-10T10:00:00Z',
      updated_at: '2026-02-10T10:00:00Z',
    },
    {
      id: 'cccccccc-0000-0000-0000-000000000002',
      business_id: '11111111-0000-0000-0000-000000000001',
      name: 'María López',
      email: 'maria@email.com',
      phone: '+54 11 9876-5432',
      address: 'Belgrano 456',
      tax_id: '27-11223344-5',
      notes: 'Taller mecánico La Tuerca',
      created_at: '2026-02-15T10:00:00Z',
      updated_at: '2026-02-15T10:00:00Z',
    },
    {
      id: 'cccccccc-0000-0000-0000-000000000003',
      business_id: '11111111-0000-0000-0000-000000000001',
      name: 'Roberto Silva',
      email: 'roberto@email.com',
      phone: '+54 11 5555-6666',
      address: 'Av. San Martín 789',
      tax_id: '20-55556666-7',
      notes: 'Flota de remises',
      created_at: '2026-02-20T10:00:00Z',
      updated_at: '2026-02-20T10:00:00Z',
    },
  ];

  products: MockProduct[] = [
    {
      id: 'p1',
      business_id: '11111111-0000-0000-0000-000000000001',
      sku: 'FIL-001',
      name: 'Filtro de Aceite Toyota',
      description: 'Filtro para Corolla / Hilux',
      category: 'Filtros',
      supplier: 'AutoParts SA',
      price: 2500,
      cost: 1800,
      quantity: 45,
      min_stock: 10,
      is_active: true,
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 'p2',
      business_id: '11111111-0000-0000-0000-000000000001',
      sku: 'FRE-001',
      name: 'Pastillas de Freno Delanteras',
      description: 'Pastillas cerámicas',
      category: 'Frenos',
      supplier: 'FrenoPro',
      price: 8900,
      cost: 6200,
      quantity: 8,
      min_stock: 5,
      is_active: true,
      created_at: '2026-01-11T10:00:00Z',
      updated_at: '2026-01-11T10:00:00Z',
    },
    {
      id: 'p3',
      business_id: '11111111-0000-0000-0000-000000000001',
      sku: 'ACE-001',
      name: 'Aceite Motor 10W40 1L',
      description: 'Semi-sintético Mobil Super',
      category: 'Lubricantes',
      supplier: 'Mobil',
      price: 1200,
      cost: 800,
      quantity: 120,
      min_stock: 20,
      is_active: true,
      created_at: '2026-01-12T10:00:00Z',
      updated_at: '2026-01-12T10:00:00Z',
    },
    {
      id: 'p4',
      business_id: '11111111-0000-0000-0000-000000000001',
      sku: 'BUJ-001',
      name: 'Bujías NGK BPR6ES (x4)',
      description: 'Juego de 4 bujías',
      category: 'Encendido',
      supplier: 'NGK',
      price: 3200,
      cost: 2100,
      quantity: 3,
      min_stock: 8,
      is_active: true,
      created_at: '2026-01-13T10:00:00Z',
      updated_at: '2026-01-13T10:00:00Z',
    },
    {
      id: 'p5',
      business_id: '11111111-0000-0000-0000-000000000001',
      sku: 'COR-001',
      name: 'Correa de Distribución',
      description: 'Correa dentada 121 dientes',
      category: 'Motor',
      supplier: 'Gates',
      price: 12500,
      cost: 9000,
      quantity: 15,
      min_stock: 3,
      is_active: true,
      created_at: '2026-01-14T10:00:00Z',
      updated_at: '2026-01-14T10:00:00Z',
    },
    {
      id: 'p6',
      business_id: '11111111-0000-0000-0000-000000000001',
      sku: 'AMO-001',
      name: 'Amortiguador Trasero',
      description: 'Amortiguador a gas',
      category: 'Suspensión',
      supplier: 'Monroe',
      price: 18000,
      cost: 13000,
      quantity: 6,
      min_stock: 2,
      is_active: true,
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'p7',
      business_id: '11111111-0000-0000-0000-000000000001',
      sku: 'BAT-001',
      name: 'Batería 12V 60Ah',
      description: 'Libre mantenimiento',
      category: 'Eléctrico',
      supplier: 'Bosch',
      price: 35000,
      cost: 25000,
      quantity: 4,
      min_stock: 2,
      is_active: true,
      created_at: '2026-01-16T10:00:00Z',
      updated_at: '2026-01-16T10:00:00Z',
    },
    {
      id: 'p8',
      business_id: '11111111-0000-0000-0000-000000000001',
      sku: 'FIL-002',
      name: 'Filtro de Aire Universal',
      description: 'Filtro cónico de alto flujo',
      category: 'Filtros',
      supplier: 'AutoParts SA',
      price: 1800,
      cost: 1200,
      quantity: 30,
      min_stock: 10,
      is_active: true,
      created_at: '2026-01-17T10:00:00Z',
      updated_at: '2026-01-17T10:00:00Z',
    },
  ];

  sales: MockSale[] = [
    {
      id: 's1',
      business_id: '11111111-0000-0000-0000-000000000001',
      customer_id: 'cccccccc-0000-0000-0000-000000000001',
      customer_name: 'Juan Pérez',
      seller_id: 'aaaaaaaa-0000-0000-0000-000000000004',
      seller_name: 'Lucas Martínez',
      status: 'paid',
      total: 11400.0,
      notes: 'Pago en efectivo',
      sale_date: '2026-10-09',
      created_at: '2026-10-09T14:30:00Z',
      updated_at: '2026-10-09T14:30:00Z',
    },
    {
      id: 's2',
      business_id: '11111111-0000-0000-0000-000000000001',
      customer_id: 'cccccccc-0000-0000-0000-000000000002',
      customer_name: 'María López',
      seller_id: 'aaaaaaaa-0000-0000-0000-000000000002',
      seller_name: 'Carlos García',
      status: 'paid',
      total: 35000.0,
      notes: 'Transferencia bancaria',
      sale_date: '2026-10-08',
      created_at: '2026-10-08T11:00:00Z',
      updated_at: '2026-10-08T11:00:00Z',
    },
  ];

  quotes: MockQuote[] = [
    {
      id: 'q1',
      business_id: '11111111-0000-0000-0000-000000000001',
      customer_id: 'cccccccc-0000-0000-0000-000000000001',
      customer_name: 'Juan Pérez',
      template_id: 't1',
      quote_number: 'PRE-0001',
      status: 'sent',
      vehicle_info: 'Toyota Corolla 2018 1.8 XEI',
      vin: '8AJBA38E9J1234567',
      subtotal: 11400.0,
      vat_rate: 21.0,
      vat_amount: 2394.0,
      total: 13794.0,
      notes: 'Incluye service completo de fluidos y pastillas',
      valid_until: '2026-10-25',
      created_at: '2026-10-05T10:00:00Z',
      updated_at: '2026-10-05T10:00:00Z',
    },
  ];

  quoteTemplates: MockQuoteTemplate[] = [
    {
      id: 't1',
      business_id: '11111111-0000-0000-0000-000000000001',
      business_name: 'Repuestos García',
      logo_url: null,
      title: 'PRESUPUESTO',
      footer_text: 'Este presupuesto tiene una validez de 7 días hábiles.',
      payment_terms: 'Pago al contado. Transferencia bancaria o efectivo.',
      vat_rate: 21.0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  handleQuery(queryText: string, params: any[] = []): any[] {
    const q = queryText.toLowerCase().trim();

    // 1. SELECT users (login o lista)
    if (q.includes('from users')) {
      if (q.includes('where u.email =') || q.includes('where email =')) {
        const email = String(params[0] ?? '').toLowerCase().trim();
        const user = this.users.find((u) => u.email.toLowerCase() === email);
        if (!user) return [];
        const business = this.businesses.find((b) => b.id === user.business_id);
        const sub = this.subscriptions.find((s) => s.business_id === user.business_id);
        return [
          {
            id: user.id,
            email: user.email,
            password_hash: user.password_hash,
            full_name: user.full_name,
            role: user.role,
            business_id: user.business_id,
            is_active: user.is_active,
            business_name: business?.name ?? null,
            subscription_status: sub?.status ?? 'active',
          },
        ];
      }
      if (q.includes('count(*)')) {
        return [{ count: this.users.filter((u) => u.role !== 'superadmin').length }];
      }
      return this.users.map((u) => {
        const b = this.businesses.find((x) => x.id === u.business_id);
        return {
          ...u,
          business_name: b?.name ?? null,
        };
      });
    }

    // 2. UPDATE users
    if (q.includes('update users')) {
      return [{ success: true }];
    }

    // 3. SELECT products
    if (q.includes('from products')) {
      if (q.includes('count(*)')) {
        const low = this.products.filter((p) => p.quantity <= p.min_stock && p.is_active).length;
        return [{ count: low }];
      }
      const bId = params[0] || '11111111-0000-0000-0000-000000000001';
      return this.products.filter((p) => !bId || p.business_id === bId);
    }

    // 4. SELECT customers
    if (q.includes('from customers')) {
      if (q.includes('count(*)')) {
        return [{ count: this.customers.length }];
      }
      const bId = params[0] || '11111111-0000-0000-0000-000000000001';
      return this.customers.filter((c) => !bId || c.business_id === bId);
    }

    // 5. SELECT sales
    if (q.includes('from sales')) {
      if (q.includes('sum(total)') || q.includes('count_month')) {
        const total = this.sales.reduce((sum, s) => sum + s.total, 0);
        return [{ total_month: total, count_month: this.sales.length }];
      }
      if (q.includes('to_char(sale_date')) {
        return [
          { month: 'Sep 2026', total: 420000 },
          { month: 'Oct 2026', total: 685000 },
        ];
      }
      const bId = params[0];
      return this.sales.filter((s) => !bId || s.business_id === bId);
    }

    // 6. SELECT quotes
    if (q.includes('from quotes')) {
      const bId = params[0];
      return this.quotes.filter((qu) => !bId || qu.business_id === bId);
    }

    // 7. SELECT quote_templates
    if (q.includes('from quote_templates')) {
      return this.quoteTemplates;
    }

    // 8. SELECT businesses
    if (q.includes('from businesses')) {
      if (q.includes('count(*)')) {
        return [{ count: this.businesses.length }];
      }
      return this.businesses.map((b) => {
        const sub = this.subscriptions.find((s) => s.business_id === b.id);
        const usersCount = this.users.filter((u) => u.business_id === b.id).length;
        return {
          id: b.id,
          name: b.name,
          slug: b.slug,
          created_at: b.created_at,
          sub_type: sub?.type ?? 'monthly',
          sub_status: sub?.status ?? 'active',
          sub_amount: sub?.amount ?? 15000,
          sub_expires_at: sub?.expires_at ?? '2026-10-25',
          sub_last_payment: sub?.last_payment_at ?? '2026-09-25',
          user_count: usersCount,
        };
      });
    }

    // 9. INSERT / UPDATE productos, clientes, ventas, etc.
    if (q.includes('insert into products')) {
      const newProd: MockProduct = {
        id: 'p-' + Date.now(),
        business_id: params[0],
        sku: params[1],
        name: params[2],
        description: params[3] ?? null,
        category: params[4] ?? null,
        supplier: params[5] ?? null,
        price: Number(params[6]) || 0,
        cost: Number(params[7]) || 0,
        quantity: Number(params[8]) || 0,
        min_stock: Number(params[9]) || 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.products.unshift(newProd);
      return [newProd];
    }

    if (q.includes('update products') && q.includes('quantity +')) {
      // Ajuste de stock
      const id = params[1];
      const adj = Number(params[0]) || 0;
      const prod = this.products.find((p) => p.id === id);
      if (prod) {
        prod.quantity += adj;
        return [prod];
      }
    }

    if (q.includes('insert into customers')) {
      const newCust: MockCustomer = {
        id: 'c-' + Date.now(),
        business_id: params[0],
        name: params[1],
        email: params[2] ?? null,
        phone: params[3] ?? null,
        address: params[4] ?? null,
        tax_id: params[5] ?? null,
        notes: params[6] ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.customers.unshift(newCust);
      return [newCust];
    }

    if (q.includes('insert into sales')) {
      const newSale: MockSale = {
        id: 's-' + Date.now(),
        business_id: params[0],
        customer_id: params[1] ?? null,
        seller_id: params[2] ?? null,
        status: params[3] ?? 'paid',
        total: Number(params[4]) || 0,
        notes: params[5] ?? null,
        sale_date: params[6] ?? new Date().toISOString().substring(0, 10),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.sales.unshift(newSale);
      return [newSale];
    }

    if (q.includes('insert into quotes')) {
      const newQuote: MockQuote = {
        id: 'q-' + Date.now(),
        business_id: params[0],
        customer_id: params[1] ?? null,
        template_id: null,
        quote_number: 'PRE-' + String(this.quotes.length + 1).padStart(4, '0'),
        status: 'draft',
        vehicle_info: params[3] ?? null,
        vin: params[4] ?? null,
        subtotal: Number(params[5]) || 0,
        vat_rate: Number(params[6]) || 21,
        vat_amount: Number(params[7]) || 0,
        total: Number(params[8]) || 0,
        notes: params[9] ?? null,
        valid_until: params[10] ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.quotes.unshift(newQuote);
      return [newQuote];
    }

    // Default genérico
    return [];
  }
}

// Singleton global para mantener estado durante el runtime de desarrollo
const globalForMock = global as unknown as { mockDb?: MockDatabase };
export const mockDb = globalForMock.mockDb || new MockDatabase();
if (process.env.NODE_ENV !== 'production') globalForMock.mockDb = mockDb;
