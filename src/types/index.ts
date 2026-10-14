// ============================================================
// Tipos de dominio de Repuesto Control
// ============================================================

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'seller';
export type SubscriptionType = 'monthly' | 'fixed';
export type SubscriptionStatus = 'active' | 'suspended' | 'expired';
export type SaleStatus = 'pending' | 'paid' | 'cancelled';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface Business {
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

export interface Subscription {
  id: string;
  business_id: string;
  type: SubscriptionType;
  status: SubscriptionStatus;
  amount: number;
  starts_at: string;
  expires_at: string | null;
  last_payment_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  business_id: string | null;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
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

export interface Product {
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

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  business_id: string;
  customer_id: string | null;
  seller_id: string | null;
  status: SaleStatus;
  total: number;
  notes: string | null;
  sale_date: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  seller_name?: string;
  items?: SaleItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Quote {
  id: string;
  business_id: string;
  customer_id: string | null;
  template_id: string | null;
  quote_number: string;
  status: QuoteStatus;
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
  customer_name?: string;
  items?: QuoteItem[];
}

export interface QuoteTemplate {
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

// Tipos para formularios
export interface ProductFormData {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  supplier?: string;
  price: number;
  cost: number;
  quantity: number;
  min_stock: number;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
}

export interface SaleItemForm {
  product_id?: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface SaleFormData {
  customer_id?: string;
  status: SaleStatus;
  notes?: string;
  sale_date: string;
  items: SaleItemForm[];
}

export interface QuoteItemForm {
  product_id?: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface QuoteFormData {
  customer_id?: string;
  vehicle_info?: string;
  vin?: string;
  vat_rate: number;
  notes?: string;
  valid_until?: string;
  items: QuoteItemForm[];
}

// Respuesta de API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalSalesMonth: number;
  salesCountMonth: number;
  lowStockCount: number;
  activeCustomers: number;
  recentActivity: ActivityItem[];
  lowStockProducts: Product[];
  monthlySales: { month: string; total: number }[];
}

export interface ActivityItem {
  id: string;
  type: 'sale' | 'quote' | 'product' | 'customer';
  description: string;
  amount?: number;
  created_at: string;
}
