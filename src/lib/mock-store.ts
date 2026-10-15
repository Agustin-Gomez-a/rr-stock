// ============================================================
// RR Stock – Almacenamiento local persistente
// Fallback automático cuando no hay conexión a Neon Postgres
// ============================================================

import fs from 'fs';
import path from 'path';
import type { UserRole, ExpenseCategory, AuditActionType } from '@/types';

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
  role: UserRole;
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

export interface MockSaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface MockSale {
  id: string;
  business_id: string;
  customer_id: string | null;
  customer_name?: string | null;
  seller_id: string | null;
  seller_name?: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  total: number;
  notes: string | null;
  sale_date: string;
  created_at: string;
  updated_at: string;
}

export interface MockExpense {
  id: string;
  business_id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_by_id: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockAuditLog {
  id: string;
  business_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: AuditActionType;
  details: string;
  amount?: number | null;
  created_at: string;
}

export interface MockQuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface MockQuote {
  id: string;
  business_id: string;
  customer_id: string | null;
  customer_name?: string;
  template_id: string | null;
  quote_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
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

export interface MockSalary {
  id: string;
  business_id: string;
  user_id?: string | null;
  employee_name: string;
  employee_role: string;
  period: string;
  base_amount: number;
  bonus_amount: number;
  deductions_amount: number;
  total_amount: number;
  status: 'pending' | 'paid';
  payment_date?: string | null;
  payment_method?: 'efectivo' | 'transferencia' | 'cheque' | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

const STORAGE_FILE = process.env.VERCEL
  ? path.join('/tmp', 'mock-db.json')
  : path.join(process.cwd(), '.data', 'mock-db.json');

class MockDatabase {
  businesses: MockBusiness[] = [];
  subscriptions: MockSubscription[] = [];
  users: MockUser[] = [];
  customers: MockCustomer[] = [];
  products: MockProduct[] = [];
  sales: MockSale[] = [];
  saleItems: MockSaleItem[] = [];
  expenses: MockExpense[] = [];
  auditLogs: MockAuditLog[] = [];
  quotes: MockQuote[] = [];
  quoteItems: MockQuoteItem[] = [];
  quoteTemplates: MockQuoteTemplate[] = [];
  salaries: MockSalary[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Intentar cargar desde el archivo persistente en disco
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.businesses = data.businesses || [];
        this.subscriptions = data.subscriptions || [];
        this.users = data.users || [];
        this.customers = data.customers || [];
        this.products = data.products || [];
        this.sales = data.sales || [];
        this.saleItems = data.saleItems || [];
        this.expenses = data.expenses || [];
        this.auditLogs = data.auditLogs || [];
        this.quotes = data.quotes || [];
        this.quoteItems = data.quoteItems || [];
        this.quoteTemplates = data.quoteTemplates || [];
        this.salaries = data.salaries || [];
        return;
      }
    } catch (e) {
      console.warn('[MockDB] No se pudo leer almacenamiento en disco, inicializando datos limpios:', e);
    }

    // Si no existe, inicializar con el negocio solicitado y los datos en CERO
    this.businesses = [
      {
        id: '11111111-0000-0000-0000-000000000001',
        name: 'RR REPUESTOS & LUBRICANTES',
        slug: 'rr-repuestos-lubricantes',
        logo_url: null,
        address: 'Av. Martín Berho 532, San Miguel de Tucumán',
        phone: '3815853438 - 3816241623',
        tax_id: '20-33703597-4',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.subscriptions = [
      {
        id: 'sub-1',
        business_id: '11111111-0000-0000-0000-000000000001',
        type: 'monthly',
        status: 'active',
        amount: 25000.0,
        starts_at: '2026-01-01',
        expires_at: '2028-12-31',
        last_payment_at: '2026-10-01',
        notes: 'Abono Premium Activo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Administradores requeridos con hash de bcrypt de 'rradmin123_'
    const hashRradmin123 = '$2b$10$MJqzGB7nZM3Pni6hBa1oxOFu2tz8oghUh/xnd.78k5i8kXhcP7c3K';

    this.users = [
      {
        id: 'aaaaaaaa-0000-0000-0000-000000000001',
        business_id: null,
        email: 'superadmin@repuestocontrol.com',
        password_hash: hashRradmin123,
        full_name: 'Super Administrador',
        role: 'superadmin',
        is_active: true,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'aaaaaaaa-0000-0000-0000-000000000002',
        business_id: '11111111-0000-0000-0000-000000000001',
        email: 'admin1@admin.com',
        password_hash: hashRradmin123,
        full_name: 'Emiliano',
        role: 'admin',
        is_active: true,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'aaaaaaaa-0000-0000-0000-000000000003',
        business_id: '11111111-0000-0000-0000-000000000001',
        email: 'admin2@admin.com',
        password_hash: hashRradmin123,
        full_name: 'Freddy',
        role: 'admin',
        is_active: true,
        last_login_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Datos iniciales en CERO para el negocio
    this.customers = [];
    this.products = [];
    this.sales = [];
    this.saleItems = [];
    this.expenses = [];
    this.auditLogs = [];
    this.quotes = [];
    this.quoteItems = [];
    this.salaries = [];

    this.quoteTemplates = [
      {
        id: 't1',
        business_id: '11111111-0000-0000-0000-000000000001',
        business_name: 'RR REPUESTOS & LUBRICANTES',
        logo_url: null,
        title: 'PRESUPUESTO',
        footer_text: 'Validez de la oferta: 7 días | Disponibilidad: Inmediata / A pedido | Tel: 3815853438 - 3816241623',
        payment_terms: 'Forma de pago: Efectivo / Transferencia',
        vat_rate: 21.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    this.save();
  }

  public save() {
    try {
      const dir = path.dirname(STORAGE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        STORAGE_FILE,
        JSON.stringify(
          {
            businesses: this.businesses,
            subscriptions: this.subscriptions,
            users: this.users,
            customers: this.customers,
            products: this.products,
            sales: this.sales,
            saleItems: this.saleItems,
            expenses: this.expenses,
            auditLogs: this.auditLogs,
            quotes: this.quotes,
            quoteItems: this.quoteItems,
            quoteTemplates: this.quoteTemplates,
            salaries: this.salaries,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      console.warn('[MockDB] Error al guardar datos en disco:', err);
    }
  }

  handleQuery(queryText: string, params: any[] = []): any[] {
    const q = queryText.toLowerCase().trim();

    // ----------------------------------------------------
    // 1. AUDIT LOGS (Monitoreo)
    // ----------------------------------------------------
    if (q.includes('audit_logs')) {
      if (q.includes('insert into audit_logs')) {
        // params: [business_id, user_id, user_name, user_role, action, details, amount]
        const newLog: MockAuditLog = {
          id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          business_id: params[0],
          user_id: params[1],
          user_name: params[2],
          user_role: params[3],
          action: params[4],
          details: params[5],
          amount: params[6] != null ? Number(params[6]) : null,
          created_at: new Date().toISOString(),
        };
        this.auditLogs.unshift(newLog);
        this.save();
        return [newLog];
      }
      // SELECT from audit_logs
      const bId = params[0];
      let results = this.auditLogs.filter((l) => !bId || l.business_id === bId);
      return results;
    }

    // ----------------------------------------------------
    // 2. EXPENSES (Gastos)
    // ----------------------------------------------------
    if (q.includes('expenses')) {
      if (q.includes('insert into expenses')) {
        // params: [business_id, title, category, amount, expense_date, notes, created_by_id, created_by_name]
        const newExp: MockExpense = {
          id: 'exp-' + Date.now(),
          business_id: params[0],
          title: params[1],
          category: params[2],
          amount: Number(params[3]) || 0,
          expense_date: params[4] || new Date().toISOString().substring(0, 10),
          notes: params[5] ?? null,
          created_by_id: params[6] ?? null,
          created_by_name: params[7] ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.expenses.unshift(newExp);
        this.save();
        return [newExp];
      }

      if (q.includes('delete from expenses')) {
        const id = params[0];
        const idx = this.expenses.findIndex((e) => e.id === id);
        if (idx >= 0) {
          const removed = this.expenses.splice(idx, 1)[0];
          this.save();
          return [removed];
        }
        return [];
      }

      if (q.includes('sum(amount)')) {
        const bId = params[0];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
        const total = this.expenses
          .filter((e) => (!bId || e.business_id === bId) && e.expense_date >= startOfMonth)
          .reduce((sum, e) => sum + e.amount, 0);
        return [{ total_expenses: total, count: this.expenses.length }];
      }

      const bId = params[0];
      return this.expenses
        .filter((e) => !bId || e.business_id === bId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // ----------------------------------------------------
    // 2.1 SALARIES (Sueldos y Liquidaciones)
    // ----------------------------------------------------
    if (q.includes('salaries')) {
      if (q.includes('insert into salaries')) {
        const newSalary: MockSalary = {
          id: 'sal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          business_id: params[0],
          user_id: params[1] ?? null,
          employee_name: params[2],
          employee_role: params[3] || 'Vendedor',
          period: params[4] || new Date().toISOString().substring(0, 7),
          base_amount: Number(params[5]) || 0,
          bonus_amount: Number(params[6]) || 0,
          deductions_amount: Number(params[7]) || 0,
          total_amount: Number(params[8]) || (Number(params[5]) || 0) + (Number(params[6]) || 0) - (Number(params[7]) || 0),
          status: (params[9] as any) || 'pending',
          payment_date: params[10] ?? null,
          payment_method: params[11] ?? null,
          notes: params[12] ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.salaries.unshift(newSalary);
        this.save();
        return [newSalary];
      }

      if (q.includes('update salaries')) {
        const idParam = params.find(p => typeof p === 'string' && (p.startsWith('sal-') || p.length > 20)) || params[params.length - 2] || params[params.length - 1];
        const salary = this.salaries.find(s => s.id === idParam);
        if (salary) {
          if (q.includes('status')) {
            const statusVal = params.find(p => p === 'paid' || p === 'pending');
            if (statusVal) salary.status = statusVal;
          }
          const methodVal = params.find(p => p === 'efectivo' || p === 'transferencia' || p === 'cheque');
          if (methodVal) salary.payment_method = methodVal;
          salary.payment_date = new Date().toISOString().substring(0, 10);
          salary.updated_at = new Date().toISOString();
          this.save();
          return [salary];
        }
        return [];
      }

      if (q.includes('delete from salaries')) {
        const idParam = params[0];
        const idx = this.salaries.findIndex(s => s.id === idParam);
        if (idx >= 0) {
          const removed = this.salaries.splice(idx, 1)[0];
          this.save();
          return [removed];
        }
        return [];
      }

      if (q.includes('where id =')) {
        const idParam = params[0];
        const salary = this.salaries.find(s => s.id === idParam);
        return salary ? [salary] : [];
      }

      const bId = params[0];
      return this.salaries
        .filter(s => !bId || s.business_id === bId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // ----------------------------------------------------
    // 3. USERS (Autenticación y Equipo)
    // ----------------------------------------------------
    if (q.includes('from users') || q.includes('update users') || q.includes('insert into users')) {
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

      if (q.includes('where u.id =') || q.includes('where id =')) {
        const id = params[0];
        const user = this.users.find((u) => u.id === id);
        if (!user) return [];
        return [user];
      }

      if (q.includes('insert into users')) {
        // [business_id, email, password_hash, full_name, role, is_active]
        const newUser: MockUser = {
          id: 'u-' + Date.now(),
          business_id: params[0],
          email: String(params[1]).toLowerCase().trim(),
          password_hash: params[2],
          full_name: params[3],
          role: params[4],
          is_active: params[5] !== false,
          last_login_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.users.unshift(newUser);
        this.save();
        return [newUser];
      }

      if (q.includes('update users')) {
        if (q.includes('last_login_at = now()')) {
          const id = params[0];
          const user = this.users.find((u) => u.id === id);
          if (user) user.last_login_at = new Date().toISOString();
          this.save();
          return [{ success: true }];
        }
        // General user update
        const id = params[params.length - 1];
        const user = this.users.find((u) => u.id === id);
        if (user) {
          if (q.includes('is_active =')) {
            user.is_active = Boolean(params[0]);
          }
          if (q.includes('password_hash =')) {
            user.password_hash = params[0];
          }
          user.updated_at = new Date().toISOString();
          this.save();
          return [user];
        }
        return [{ success: true }];
      }

      if (q.includes('count(*)')) {
        return [{ count: this.users.filter((u) => u.role !== 'superadmin').length }];
      }

      // SELECT all users for business (Equipo)
      const bId = params[0];
      return this.users
        .filter((u) => !bId || u.business_id === bId)
        .map((u) => {
          const b = this.businesses.find((x) => x.id === u.business_id);
          return {
            ...u,
            business_name: b?.name ?? null,
          };
        });
    }

    // ----------------------------------------------------
    // 4. PRODUCTS (Catálogo y Stock)
    // ----------------------------------------------------
    if (q.includes('from products') || q.includes('insert into products') || q.includes('update products')) {
      if (q.includes('insert into products')) {
        const newProd: MockProduct = {
          id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
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
        this.save();
        return [newProd];
      }

      // 1. UPDATE products SET quantity = quantity - $1 (Deducción atómica por venta)
      if (q.includes('update products') && q.includes('quantity -')) {
        const deduction = Number(params[0]) || 0;
        const prodId = params[1];
        const prod = this.products.find((p) => p.id === prodId);
        if (prod) {
          prod.quantity = Math.max(0, prod.quantity - deduction);
          prod.updated_at = new Date().toISOString();
          this.save();
          return [prod];
        }
        return [];
      }

      // 2. UPDATE products SET quantity = quantity + $1 (Ajuste o carga de stock)
      if (q.includes('update products') && q.includes('quantity +')) {
        const adj = Number(params[0]) || 0;
        const prodId = params[1];
        const prod = this.products.find((p) => p.id === prodId);
        if (prod) {
          if (prod.quantity + adj < 0) return []; // stock negativo no permitido
          prod.quantity += adj;
          prod.updated_at = new Date().toISOString();
          this.save();
          return [prod];
        }
        return [];
      }

      // 3. Soft delete: UPDATE products SET is_active = FALSE
      if (q.includes('update products') && q.includes('is_active = false')) {
        const prodId = params[0];
        const prod = this.products.find((p) => p.id === prodId);
        if (prod) {
          prod.is_active = false;
          prod.updated_at = new Date().toISOString();
          this.save();
          return [prod];
        }
        return [];
      }

      // 4. General UPDATE products
      if (q.includes('update products')) {
        const id = params[params.length - 1];
        const prod = this.products.find((p) => p.id === id);
        if (prod) {
          if (params[0] !== undefined && params[0] !== null) prod.sku = params[0];
          if (params[1] !== undefined && params[1] !== null) prod.name = params[1];
          if (params[2] !== undefined) prod.description = params[2];
          if (params[3] !== undefined) prod.category = params[3];
          if (params[4] !== undefined) prod.supplier = params[4];
          if (params[5] !== undefined && params[5] !== null) prod.price = Number(params[5]);
          if (params[6] !== undefined && params[6] !== null) prod.cost = Number(params[6]);
          if (params[7] !== undefined && params[7] !== null) prod.quantity = Number(params[7]);
          if (params[8] !== undefined && params[8] !== null) prod.min_stock = Number(params[8]);
          prod.updated_at = new Date().toISOString();
          this.save();
          return [prod];
        }
        return [];
      }

      // 5. SELECT single product by ID: WHERE id = ...
      if (q.includes('where id =') || q.includes('where p.id =')) {
        const prodId = params[0];
        const prod = this.products.find((p) => p.id === prodId);
        if (!prod) return [];
        return [prod];
      }

      // 6. Low stock count: SELECT count(*) FROM products WHERE quantity <= min_stock
      if (q.includes('count(*)')) {
        const low = this.products.filter((p) => p.is_active && p.quantity <= p.min_stock).length;
        return [{ count: low }];
      }

      // Low stock list
      if (q.includes('quantity <= min_stock')) {
        const bId = params[0];
        return this.products
          .filter((p) => (!bId || p.business_id === bId) && p.is_active && p.quantity <= p.min_stock)
          .sort((a, b) => a.quantity - b.quantity)
          .slice(0, 5);
      }

      // Normal SELECT products list
      const bId = params[0];
      const search = params[1] ? String(params[1]).toLowerCase() : '';
      return this.products
        .filter((p) => {
          if (!p.is_active) return false;
          if (bId && p.business_id !== bId) return false;
          if (search) {
            const cleanSearch = search.replace(/%/g, '');
            if (
              !p.name.toLowerCase().includes(cleanSearch) &&
              !p.sku.toLowerCase().includes(cleanSearch)
            ) {
              return false;
            }
          }
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // ----------------------------------------------------
    // 5. SALES & SALE_ITEMS (Ventas)
    // ----------------------------------------------------
    if (q.includes('sales') || q.includes('sale_items')) {
      if (q.includes('insert into sales')) {
        // [business_id, customer_id, seller_id, status, total, notes, sale_date]
        const seller = this.users.find((u) => u.id === params[2]);
        const customer = this.customers.find((c) => c.id === params[1]);
        const newSale: MockSale = {
          id: 's-' + Date.now(),
          business_id: params[0],
          customer_id: params[1] ?? null,
          customer_name: customer?.name ?? 'Consumidor Final',
          seller_id: params[2] ?? null,
          seller_name: seller?.full_name ?? null,
          status: params[3] ?? 'paid',
          total: Number(params[4]) || 0,
          notes: params[5] ?? null,
          sale_date: params[6] ?? new Date().toISOString().substring(0, 10),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.sales.unshift(newSale);
        this.save();
        return [newSale];
      }

      if (q.includes('insert into sale_items')) {
        const item: MockSaleItem = {
          id: 'si-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          sale_id: params[0],
          product_id: params[1] ?? null,
          sku: params[2],
          name: params[3],
          quantity: Number(params[4]) || 1,
          unit_price: Number(params[5]) || 0,
          subtotal: (Number(params[4]) || 1) * (Number(params[5]) || 0),
        };
        this.saleItems.push(item);
        this.save();
        return [item];
      }

      if (q.includes('update sales') && q.includes('status =')) {
        const newStatus = params[0];
        const saleId = params[1];
        const sale = this.sales.find((s) => s.id === saleId);
        if (sale) {
          sale.status = newStatus;
          sale.updated_at = new Date().toISOString();
          this.save();
          return [sale];
        }
        return [];
      }

      if (q.includes('sum(total)') || q.includes('count_month')) {
        const bId = params[0];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
        const filteredSales = this.sales.filter(
          (s) => (!bId || s.business_id === bId) && s.status === 'paid' && s.sale_date >= startOfMonth
        );
        const total = filteredSales.reduce((sum, s) => sum + s.total, 0);
        return [{ total_month: total, count_month: filteredSales.length }];
      }

      if (q.includes('count(distinct customer_id)')) {
        const bId = params[0];
        const customersWithSales = new Set(
          this.sales.filter((s) => (!bId || s.business_id === bId) && s.customer_id).map((s) => s.customer_id)
        );
        return [{ count: customersWithSales.size }];
      }

      if (q.includes('to_char(date_trunc') || q.includes('group by date_trunc')) {
        // Ventas agrupadas por mes para el gráfico
        const bId = params[0];
        const monthsMap: Record<string, number> = {};
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const now = new Date();

        // Inicializar últimos 6 meses
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${monthNames[d.getMonth()]}`;
          monthsMap[key] = 0;
        }

        this.sales
          .filter((s) => (!bId || s.business_id === bId) && s.status === 'paid')
          .forEach((s) => {
            const d = new Date(s.sale_date);
            const key = monthNames[d.getMonth()];
            if (monthsMap[key] !== undefined) {
              monthsMap[key] += s.total;
            }
          });

        return Object.entries(monthsMap).map(([month, total]) => ({ month, total }));
      }

      if (q.includes('where s.id =') || q.includes('where id =')) {
        const id = params[0];
        const sale = this.sales.find((s) => s.id === id);
        if (!sale) return [];
        return [sale];
      }

      // SELECT sales list
      const bId = params[0];
      return this.sales
        .filter((s) => !bId || s.business_id === bId)
        .map((s) => {
          const cust = this.customers.find((c) => c.id === s.customer_id);
          const seller = this.users.find((u) => u.id === s.seller_id);
          return {
            ...s,
            customer_name: cust?.name ?? s.customer_name ?? 'Consumidor Final',
            seller_name: seller?.full_name ?? s.seller_name ?? '—',
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // ----------------------------------------------------
    // 6. CUSTOMERS (Clientes)
    // ----------------------------------------------------
    if (q.includes('customers')) {
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
        this.save();
        return [newCust];
      }

      if (q.includes('where id =') || q.includes('where c.id =')) {
        const id = params[0];
        const cust = this.customers.find((c) => c.id === id);
        if (!cust) return [];
        return [cust];
      }

      if (q.includes('update customers')) {
        const id = params[params.length - 1];
        const cust = this.customers.find((c) => c.id === id);
        if (cust) {
          if (params[0]) cust.name = params[0];
          if (params[1] !== undefined) cust.email = params[1];
          if (params[2] !== undefined) cust.phone = params[2];
          if (params[3] !== undefined) cust.address = params[3];
          if (params[4] !== undefined) cust.tax_id = params[4];
          if (params[5] !== undefined) cust.notes = params[5];
          cust.updated_at = new Date().toISOString();
          this.save();
          return [cust];
        }
        return [];
      }

      if (q.includes('count(*)')) {
        return [{ count: this.customers.length }];
      }

      const bId = params[0];
      return this.customers
        .filter((c) => !bId || c.business_id === bId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // ----------------------------------------------------
    // 7. QUOTES & QUOTE_ITEMS & TEMPLATES (Presupuestos)
    // ----------------------------------------------------
    if (q.includes('quotes') || q.includes('quote_items') || q.includes('quote_templates')) {
      if (q.includes('from quote_templates')) {
        return this.quoteTemplates;
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
        this.save();
        return [newQuote];
      }

      if (q.includes('insert into quote_items')) {
        const item: MockQuoteItem = {
          id: 'qi-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          quote_id: params[0],
          product_id: params[1] ?? null,
          sku: params[2],
          name: params[3],
          quantity: Number(params[4]) || 1,
          unit_price: Number(params[5]) || 0,
          subtotal: (Number(params[4]) || 1) * (Number(params[5]) || 0),
        };
        this.quoteItems.push(item);
        this.save();
        return [item];
      }

      if (q.includes('where id =') || q.includes('where q.id =')) {
        const id = params[0];
        const quote = this.quotes.find((qu) => qu.id === id);
        if (!quote) return [];
        return [quote];
      }

      if (q.includes('from quote_items where quote_id =')) {
        const quoteId = params[0];
        return this.quoteItems.filter((qi) => qi.quote_id === quoteId);
      }

      if (q.includes('update quotes') && q.includes('status =')) {
        const newStatus = params[0];
        const id = params[1];
        const quote = this.quotes.find((qu) => qu.id === id);
        if (quote) {
          quote.status = newStatus;
          quote.updated_at = new Date().toISOString();
          this.save();
          return [quote];
        }
        return [];
      }

      const bId = params[0];
      return this.quotes
        .filter((qu) => !bId || qu.business_id === bId)
        .map((qu) => {
          const cust = this.customers.find((c) => c.id === qu.customer_id);
          return {
            ...qu,
            customer_name: cust?.name ?? 'Sin cliente',
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // ----------------------------------------------------
    // 8. BUSINESSES (Superadmin)
    // ----------------------------------------------------
    if (q.includes('businesses')) {
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
          sub_amount: sub?.amount ?? 25000,
          sub_expires_at: sub?.expires_at ?? '2028-12-31',
          sub_last_payment: sub?.last_payment_at ?? '2026-10-01',
          user_count: usersCount,
        };
      });
    }

    // Default genérico
    return [];
  }
}

// Singleton global para mantener estado durante el runtime de desarrollo
const globalForMock = global as unknown as { mockDb?: MockDatabase };
export const mockDb = globalForMock.mockDb || new MockDatabase();
if (process.env.NODE_ENV !== 'production') globalForMock.mockDb = mockDb;
